const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const TournamentOrganizer = require('tournament-organizer');
const User = require(path.join(__dirname + 'users.js'));
const Admin = require(path.join(__dirname + 'admins.js'));

// Load token
require('dotenv').config();

// Start Discord
const client = new Discord.client();
client.login(process.env.TOKEN);

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
client.on('message', message => {
    // Ignore bots and anything that doesn't start with !
    if (message.author.bot || !message.content.startsWith('!')) return;

    // Get help with !bracketeer
    if (message.content.startsWith('!bracketeer')) message.reply('If you need help, please check out https://mattbraddock.com/bracketeer/');

    // Create a tournament with !new
    if (message.member.hasPermission('ADMINISTRATOR') && message.content.startsWith('!new')) {
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
            Admin.upload(tournament, message);
            tournament.waiting = false;
            // Start the tournament and send info
        }

        // Start the tournament with !start
        if (message.content.startsWith('!start')) {
            // Get seeding info if needed
            if (tournament.seededPlayers && !tournament.hasOwnProperty('chess')) {
                tournament.waiting = true;
                const content = tournament.players.map(p => ({
                    id: p.id,
                    name: p.alias,
                    value: p.seed
                }));
                const buffer = Buffer.from(JSON.stringify(content));
                message.reply('Please add values to each player for sorting. When uploading the file, add `!upload` in the message.', {
                    files: [buffer]
                });
                return;
            }
            // Start the tournament and send info
            // Continue here
        }

        // Get pairings and standings with !info or !status
        if (message.content.startsWith('!info') || message.content.startsWith('!status')) {
            
        }

        // End a tournament early with !end
        if (message.content.startsWith('!end')) {
            
        }

    }

    // Join a tournament with !join or !J
    if (message.content.startsWith('!join') || message.content.startsWith('!J')) {
            
    }

    // Get your current match with !pairing or !P
    if (message.content.startsWith('!pairing') || message.content.startsWith('!P')) {
            
    }

    // Report results with !results or !report or !R
    if (message.content.startsWith('!results') || message.content.startsWith('!report') || message.content.startsWith('!R')) {
            
    }

    // Quit the tournament with !quit or !Q
    if (message.content.startsWith('!quit') || message.content.startsWith('!Q')) {

    }

});

// Save tournaments every 5 minutes
client.setInterval(save, 3e5);