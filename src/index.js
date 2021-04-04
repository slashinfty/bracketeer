const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Discord = require('discord.js');
const TournamentOrganizer = require('tournament-organizer');
const User = require(path.join(__dirname + 'users.js'));
const Admin = require(path.join(__dirname + 'admins.js'));

// Load token
require('dotenv').config();

// Start Discord
const client = new Discord.client();
client.login(process.env.DISCORD_TOKEN);

// Start Tournament Organizer
const EventManager = new TournamentOrganizer.EventManager();

// Save tournaments function
const save = () => fs.writeFileSync(path.join(__dirname + '/../static/save.json'), JSON.stringify(EventManager.tournaments));

// Bot is on
client.once('ready', () => {
    console.log('Bracketeer is online at ' + new Date(Date.now()));
    
    // Discord presence
    client.user.setPresence({
        activity: {
            name: '!bracketeer',
            type: 'LISTENING'
        },
        status: 'online'
    });

    // Recover saved information
    const file = path.join(__dirname + '/../static/save.json');
    if (!fs.existsSync(file)) return;
    const contents = fs.readFileSync(file);
    EventManager.tournaments = JSON.parse(contents);
});

// Interpreting messages
client.on('message', async message => {
    // Ignore bots and anything that doesn't start with !
    if (message.author.bot || !message.content.startsWith('!')) return;

    // Get help with !bracketeer
    if (message.content.startsWith('!bracketeer')) message.reply('If you need help, please check out https://slashinfty.github.io/bracketeer/');

    // Create a tournament with !new
    if (message.member.hasPermission('ADMINISTRATOR') && message.content.startsWith('!new')) {
        // If !new without options, link to option generator
        if (message.content === '!new') {
            message.reply(`Looking for how to start a tournament? Try this: https://slashinfty.github.io/bracketeer/generator`);
            return;
        }
        // If a tournament is already happening
        if (EventManager.tournaments.find(t => t.eventID === message.channel.id) !== undefined) {
            message.reply(`Sorry, a tournament is already ongoing in this channel. You can only have one tournament per channel.`);
            return;
        }
        Admin.create(EventManager, message);
    }

    // Find the active tournament, or return if it doesn't exist
    const tournament = EventManager.tournaments.find(t => t.eventID === message.channel.id);
    if (tournament === undefined) return;

    // Admin commands
    if (message.member.hasPermission('ADMINISTRATOR')) {
        // Upload a file with !upload
        if (message.content.startsWith('!upload') && message.attachments.size !== 0 && tournament.hasOwnProperty('waiting') && tournament.waiting) {
            const upload = Admin.upload(tournament, message);
            if (!upload) return;
            tournament.waiting = false;
            tournament.start();
            const update = Admin.info(tournament);
            if (update) message.channel.send('Your tournament has started! View pairings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.binID);
            else message.reply('Sorry, there was a problem generating the pairings preview. Try !info');
            return;
        }

        // Start the tournament with !start
        if (message.content.startsWith('!start')) {
            if (tournament.seededPlayers && !tournament.hasOwnProperty('chess')) {
                tournament.waiting = true;
                const content = tournament.players.map(p => ({
                    id: p.id,
                    name: p.alias,
                    value: p.seed
                }));
                const buffer = Buffer.from(JSON.stringify(content));
                const attachment = new Discord.MessageAttachment(buffer, 'AddPlayerValues.json');
                message.reply('Please add values to each player for sorting. When uploading the file, add `!upload` in the message.', attachment);
                return;
            }
            tournament.start();
            const update = Admin.info(tournament);
            if (update) message.channel.send('Your tournament has started! View pairings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.binID);
            else message.reply('Sorry, there was a problem generating the pairings preview. Try !info');
            return;
        }

        // Get pairings and standings with !info or !status
        if (message.content.startsWith('!info') || message.content.startsWith('!status')) {
            const update = Admin.info(tournament);
            if (update) message.reply('You can view current pairings and standings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.binID);
            else message.reply('Sorry, there was a problem. Try again later?');
            return;
        }

        // End a tournament early with !end
        if (message.content.startsWith('!end')) {
            tournament.active = false;
            const buffer = Buffer.from(JSON.stringify(tournament));
            const attachment = new Discord.MessageAttachment(buffer, tournament.name + '.json');
            message.channel.send('The tournament is now over.', attachment);
            EventManager.removeTournament(tournament);
        }

    }

    // Join a tournament with !join or !J
    if (message.content.startsWith('!join') || message.content.startsWith('!J')) {
        let seed = null;
        if (tournament.hasOwnProperty('chess')) {
            const usernameArray = message.content.match(/(?<=[!J|!join]\s)[\w-]+/);
            if (usernameArray === null) {
                message.react('❌');
                return;
            }
            username = usernameArray[0];
            let rule = tournament.chess.match(/(?<=-)\w+/)[0];
            if (tournament.chess.includes('lichess')) {
                const resp = await fetch('https://lichess.org/api/user/' + username);
                const obj = await resp.json();
                seed = obj.perfs[rule].rating;
            } else {
                rule = 'chess_' + rule;
                const resp = await fetch('https://api.chess.com/pub/player/' + username + '/stats');
                const obj = await resp.json();
                seed = obj[rule].last.rating;
            }
        }
        let add = tournament.addPlayer(message.author.username, message.author.id, seed);
        if (add) message.react('✅');
        else message.react('❌');
        return;
    }

    // Get your current match with !pairing or !P
    if (message.content.startsWith('!pairing') || message.content.startsWith('!P')) {
        const active = tournament.activeMatches();
        const match = active.filter(m => m.playerOne.id === message.author.id || m.playerTwo.id === message.author.id);
        if (match === undefined) message.reply('You do not have an active match.');
        else message.reply('Round ' + match.round + ' Match ' + match.matchNumber + ' - ' + match.playerOne.alias + ' vs ' + match.playerTwo.alias);
    }

    // Report results with !results or !report or !R
    if (message.content.startsWith('!results') || message.content.startsWith('!report') || message.content.startsWith('!R')) {
        
    }

    // Quit the tournament with !quit or !Q
    if (message.content.startsWith('!quit') || message.content.startsWith('!Q')) {
        let player;
        if (message.member.hasPermission("ADMINISTRATOR") && message.mentions.users.size === 1) player = tournament.players.find(p => p.id === message.mentions.users.first().id);
        else player = tournament.players.find(p => p.id === message.author.id);
        if (player === undefined) message.react('❌');
        const remove = tournament.removePlayer(player);
        if (remove) message.react('✅');
        else message.react('❌');
    }

});

// Save tournaments every 5 minutes
client.setInterval(save, 3e5);