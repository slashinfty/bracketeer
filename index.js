const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const Discord = require('discord.js');
const TournamentOrganizer = require('tournament-organizer');

// Load token
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '.firebase-admin-sdk.json'));
const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bracketeer-22018-default-rtdb.firebaseio.com"
});

// Get database
const db = app.database();

// Start Discord
const client = new Discord.Client();
client.login(process.env.DISCORD_TOKEN);

// Start Tournament Organizer
const EventManager = new TournamentOrganizer.EventManager();

// Save tournaments function
const save = () => fs.writeFileSync(path.join(__dirname + '/static/save.json'), JSON.stringify(EventManager.tournaments));

// Set info and share link
const info = t => {
    const object = {
        columns: {
            pairings: [
                {title: 'Match Number', data: 'matchNumber'},
                {title: 'Player One', data: 'playerOne'},
                {title: 'Player Two', data: 'playerTwo'},
                {title: 'Active', data: 'active'},
                {title: 'Result', data: 'result'}
            ],
            standings: [
                {title: 'Rank', data: 'rank'},
                {title: 'Player', data: 'player'},
                {title: 'Points', data: 'matchPoints'}
            ]
        },
        pairings: [],
        standings: []
    };
    let matches;
    if (t.format === 'elim') matches = t.matches.filter(m => m.active || (m.playerOne === null && m.playerTwo !== null) || (m.playerOne !== null && m.playerTwo === null));
    else matches = t.matches.filter(m => m.round === t.currentRound);
    matches.forEach(m => {
        object.pairings.push({
            matchNumber: 'R' + m.round + 'M' + m.matchNumber,
            playerOne: m.playerOne === null ? 'N/A' : t.hasOwnProperty('chess') ? m.playerOne.alias + ' (' + m.playerOne.seed + ')' : m.playerOne.alias,
            playerTwo: m.playerTwo === null ? 'N/A' : t.hasOwnProperty('chess') ? m.playerTwo.alias + ' (' + m.playerTwo.seed + ')' : m.playerTwo.alias,
            active: m.active,
            result: m.draws === 0 ? m.playerOneWins + '-' + m.playerTwoWins : m.playerOneWins + '-' + m.playerTwoWins + '-' + m.draws
        });
    });
    const standings = t.standings();
    t.tiebreakers.forEach(b => {
        switch (b) {
            case 'buchholz-cut1':
                object.columns.standings.push({title: 'Buchholz Cut 1', data: 'cutOne'});
                break;
            case 'solkoff':
                object.columns.standings.push({title: 'Solkoff', data: 'solkoff'});
                break;
            case 'median-buchholz':
                object.columns.standings.push({title: 'Median-Buchholz', data: 'median'});
                break;
            case 'sonneborn-berger':
                object.columns.standings.push({title: 'Sonneborn-Berger', data: 'neustadtl'});
                break;
            case 'cumulative':
                object.columns.standings.push({title: 'Cumulative', data: 'cumulative'}, {title: 'Opp Cumulative', data: 'oppCumulative'});
                break;
            case 'magic-tcg':
                object.columns.standings.push({title: 'Opp Match Win%', data: 'oppMatchWinPctM'}, {title: 'Game Win%', data: 'gameWinPct'}, {title: 'Opp Game Win%', data: 'oppGameWinPct'});
                break;
            case 'pokemon-tcg':
                object.columns.standings.push({title: 'Opp Match Win%', data: 'oppMatchWinPctP'}, {title: 'Opp Opp Match Win%', data: 'oppOppMatchWinPct'});
                break;
            default:
                break;
        }
    });
    standings.forEach((s, i) => {
        const obj = {
            rank: i + 1,
            player: t.hasOwnProperty('chess') ? s.alias + ' (' + s.seed + ')' : s.alias,
            matchPoints: s.matchPoints
        };
        t.tiebreakers.forEach(b => {
            switch (b) {
                case 'buchholz-cut1':
                    obj['cutOne'] = s.tiebreakers.cutOne;
                    break;
                case 'solkoff':
                    obj['solkoff'] = s.tiebreakers.solkoff;
                    break;
                case 'median-buchholz':
                    obj['median'] = s.tiebreakers.median;
                    break;
                case 'sonneborn-berger':
                    obj['neustadtl'] = s.tiebreakers.neustadtl;
                    break;
                case 'cumulative':
                    obj['cumulative'] = s.tiebreakers.cumulative;
                    obj['oppCumulative'] = s.tiebreakers.oppCumulative;
                    break;
                case 'magic-tcg':
                    obj['oppMatchWinPctM'] = s.tiebreakers.oppMatchWinPctM;
                    obj['gameWinPct'] = s.tiebreakers.gameWinPct;
                    obj['oppGameWinPct'] = s.tiebreakers.oppGameWinPct;
                    break;
                case 'pokemon-tcg':
                    obj['oppMatchWinPctP'] = s.tiebreakers.oppMatchWinPctP;
                    obj['oppOppMatchWinPct'] = s.tiebreakers.oppOppMatchWinPct;
                    break;
                default:
                    break;
            }
        });
        object.standings.push(obj);
    });
    const ref = db.ref('tournaments');
    ref.child(t.eventID).set(object);
}

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
    const file = path.join(__dirname + '/static/save.json');
    if (!fs.existsSync(file)) {
        const empty = [];
        fs.writeFileSync(file, JSON.stringify(empty));
    };
    const contents = fs.readFileSync(file);
    EventManager.tournaments = JSON.parse(contents);
});

// Interpreting messages
client.on('message', async message => {
    // Ignore bots and anything that doesn't start with !
    if (message.author.bot || !message.content.startsWith('!')) return;

    // Get help with !bracketeer
    if (/^!bracketeer$/i.test(message.content)) {
        message.reply('If you need help, please check out https://slashinfty.github.io/bracketeer/');
        return;
    }

    // Create a tournament with !new
    if (message.member.hasPermission('ADMINISTRATOR') && /^!new(\s\w+=[\w-,]+)*/i.test(message.content)) {
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
        let submission = message.content.split(' ');
        submission.shift();
        let options = {};
        const format = submission.find(x => x.includes('format')).match(/(?<=\=)[\w-]+/)[0];
        if (format.includes('elim')) {
            options.format = 'elim';
            if (format.includes('2x')) options.doubleElim = true;
        } else if (format.includes('robin')) {
            options.format = 'robin';
            if (format.includes('2x')) options.doubleRR = true;
        } else {
            options.format = 'swiss';
            if (format === 'dutch') options.dutch = true;
        }
        if (submission.find(x => x.includes('name')) !== undefined) options.name = submission.find(x => x.includes('name')).match(/(?<=\=)[\w-]+/)[0];
        if (submission.find(x => x.includes('playoffs')) !== undefined) options.playoffs = submission.find(x => x.includes('playoffs')).match(/(?<=\=)[\w-]+/)[0];
        if (submission.find(x => x.includes('win')) !== undefined) options.winValue = Number(submission.find(x => x.includes('win')).match(/(?<=\=)[\w-]+/)[0]);
        if (submission.find(x => x.includes('draw')) !== undefined) options.drawvalue = Number(submission.find(x => x.includes('draw')).match(/(?<=\=)[\w-]+/)[0]);
        if (submission.find(x => x.includes('loss')) !== undefined) options.lossValue = Number(submission.find(x => x.includes('loss')).match(/(?<=\=)[\w-]+/)[0]);
        if (submission.find(x => x.includes('bestof')) !== undefined) options.bestOf = Number(submission.find(x => x.includes('bestof')).match(/(?<=\=)[\w-]+/)[0]);
        if (submission.find(x => x.includes('maxplayers')) !== undefined) options.maxPlayers = Number(submission.find(x => x.includes('maxplayers')).match(/(?<=\=)[\w-]+/)[0]);
        if (submission.find(x => x.includes('rounds')) !== undefined) options.numberOfRounds = Number(submission.find(x => x.includes('rounds')).match(/(?<=\=)[\w-]+/)[0]);
        if (submission.find(x => x.includes('cuttype')) !== undefined) options.cutType = submission.find(x => x.includes('cuttype')).match(/(?<=\=)[\w-]+/)[0];
        if (submission.find(x => x.includes('cutlimit')) !== undefined) options.cutLimit = Number(submission.find(x => x.includes('cutlimit')).match(/(?<=\=)[\w-]+/)[0]);
        if (submission.find(x => x.includes('groups')) !== undefined) options.groupNumber = Number(submission.find(x => x.includes('groups')).match(/(?<=\=)[\w-]+/)[0]);
        if (submission.find(x => x.includes('cutgroups')) !== undefined) options.cutEachGroup = 'true' === submission.find(x => x.includes('cutgroups')).match(/(?<=\=)[\w-]+/)[0];
        if (submission.find(x => x.includes('sort')) !== undefined) {
            options.seededPlayers = true;
            options.seedOrder = submission.find(x => x.includes('sort')).match(/(?<=\=)[\w-]+/)[0];
        }
        if (submission.find(x => x.includes('thirdplace')) !== undefined) options.thirdPlaceMatch = 'true' === submission.find(x => x.includes('thirdplace')).match(/(?<=\=)[\w-]+/)[0];
        if (submission.find(x => x.includes('tiebreakers')) !== undefined) options.tiebreakers = submission.find(x => x.includes('tiebreakers')).match(/(?<=\=)[\w-,]+/)[0].split(',');

        const tournament = EventManager.createTournament(message.channel.id, options);
        if (submission.find(x => x.includes('chess')) !== undefined) options.chess = submission.find(x => x.includes('chess')).match(/(?<=\=)[\w-]+/)[0];

        let desc = 'To join the tournament, type !join or !J';
        if (tournament.hasOwnProperty('chess')) desc += tournament.chess.includes('lichess') ? ' followed by your lichess username' : ' followed by your chess.com username';

        let embedFormat;
        if (tournament.format === 'elim') embedFormat = tournament.doubleElim ? 'Double Elimination' : 'Single Elimination';
        else if (tournament.format === 'robin') embedFormat = tournament.doubleRR ? 'Double Round-Robin' : 'Round-Robin';
        else embedFormat = tournament.dutch ? 'Dutch' : 'Swiss';
        
        let embedPlayoffs = tournament.playoffs === null || tournament.playoffs === undefined ? 'None' : tournament.playoffs === 'elim' ? 'Single Elimination' : 'Double Elimination';

        const embed = {
            color: 0x008e26,
            title: tournament.name === null ? 'New Tournament' : tournament.name,
            author: {
                name: 'Bracketeer',
                url: 'https://slashinfty.github.io/bracketeer'
            },
            description: desc,
            fields: [
                {
                    name: 'Format',
                    value: embedFormat
                },
                {
                    name: 'Playoffs',
                    value: embedPlayoffs
                }
            ],
            timestamp: new Date()
        };

        if (tournament.playoffs !== null && tournament.playoffs !== undefined) {
            let embedCut;
            if (tournament.cutLimit === -1) embedCut = 'All players advance to playoffs';
            else if (tournament.cutType === 'rank') {
                if (Number.isInteger(tournament.groupNumber)) embedCut = 'Top ' + tournament.cutLimit + ' players in each group advance to playoffs';
                else embedCut = 'Top ' + tournament.cutLimit + ' players advance to playoffs';
            } else embedCut = 'All players with ' + tournament.cutLimit + ' points or better advance to playoffs';
            embed.fields.push({
                name: 'Cut',
                value: embedCut
            });
        }

        if (tournament.maxPlayers !== null) embed.fields.push({
            name: 'Maximum Players',
            value: tournament.maxPlayers.toString()
        });

        if (tournament.format === 'swiss' && tournament.numberOfRounds !== null) embed.fields.push({
            name: 'Number of Rounds',
            value: tournament.numberOfRounds.toString()
        });

        if (tournament.format !== 'elim') {
            const breakers = [...tournament.tiebreakers];
            breakers.shift();
            embed.fields.push({
                name: 'Tiebreakers',
                value: breakers.reduce((x, y) => x += x === '' ? y.replace('-', ' ') : ', ' + y.replace('-', ' '), '')
            });
        }

        message.channel.send({ embed: embed });
    }

    // Find the active tournament, or return if it doesn't exist
    const tournament = EventManager.tournaments.find(t => t.eventID === message.channel.id);
    if (tournament === undefined) return;

    // Admin commands
    if (message.member.hasPermission('ADMINISTRATOR')) {
        // Upload a file with !upload
        if (/^!upload$/i.test(message.content) && message.attachments.size !== 0 && tournament.hasOwnProperty('waiting') && tournament.waiting) {
            let object;
            try {
                let response = await fetch(message.attachments.first().url);
                object = await response.json();
            } catch (e) {
                message.reply('Sorry, that is not a valid file.');
                return;
            }
            object.forEach(entry => tournament.players.find(p => p.id === entry.id).seed = entry.value);
            tournament.waiting = false;
            tournament.startEvent();
            info(tournament);
            message.channel.send('Your tournament has started! View pairings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.eventID);
            return;
        }

        // Start the tournament with !start
        if (/^!start$/i.test(message.content)) {
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
            tournament.startEvent();
            const update = info(tournament);
            message.channel.send('Your tournament has started! View pairings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.eventID);
            return;
        }

        // Get a list of all active players with !list
        if (/^!list$/i.test(message.content)) {
            const activePlayers = tournament.players.filter(p => p.active).map(a => a.alias);
            const count = activePlayers.length;
            const list = count === 0 || tournament.active ? '' : '\n\n' + activePlayers.toString().replace(/,/g, ', '); 
            message.channel.send('There are ' + count + ' active players.' + list);
        }

        // End a tournament early with !end
        // regex: /^!end$/i
        if (/^!end$/i.test(message.content)) {
            tournament.active = false;
            const buffer = Buffer.from(JSON.stringify(tournament));
            const attachment = new Discord.MessageAttachment(buffer, tournament.name + '.json');
            message.channel.send('The tournament is now over.', attachment);
            EventManager.removeTournament(tournament);
            const ref = db.ref('tournaments');
            ref.child(tournament.eventID).set(null);
        }

    }

    // Join a tournament with !join or !J
    if (/^!(j(?=\s|$)|join)(\s\w*)?/i.test(message.content)) {
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
                seed = obj.hasOwnProperty(rule) ? obj[rule].last.rating : 1200;
            }
        }
        let add = tournament.addPlayer(message.author.username, message.author.id, seed);
        if (add) message.react('✅');
        else message.react('❌');
        return;
    }

    // Get your current match with !pairing or !P
    if (/^!(p|pairing)$/i.test(message.content)) {
        const active = tournament.activeMatches();
        const match = active.find(m => m.playerOne.id === message.author.id || m.playerTwo.id === message.author.id);
        if (match === undefined) message.reply('You do not have an active match.');
        else message.reply('Round ' + match.round + ' Match ' + match.matchNumber + ' - ' + match.playerOne.alias + ' vs ' + match.playerTwo.alias);
    }

    // Get pairings and standings with !info or !status
    if (/^!(info|status)$/i.test(message.content)) {
        info(tournament);
        message.reply('You can view current pairings and standings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.eventID);
        return;
    }

    // Report results with !results or !report or !R
    if (/^!(r(?=\s)|result|report)\s\d+-\d+(-\d+)?(\s<@!\d+>)?/i.test(message.content)) {
        const result = message.content.match(/(?<=[!r(?=\s)|!result|!report]\s)\d+-\d+(-\d+)?/i);
        const games = result[0].split('-').map(g => parseInt(g));
        if (games.length === 2) games.push(0);
        let match;
        let reportingPlayer;
        if (message.member.hasPermission("ADMINISTRATOR") && message.mentions.users.size === 1) {
            reportingPlayer = tournament.players.find(p => p.id === message.mentions.users.first().id);
            match = tournament.matches.find(m => m.id === reportingPlayer.results[reportingPlayer.results.length - 1]);
        } else {
            reportingPlayer = tournament.players.find(p => p.id === message.author.id);
            match = tournament.activeMatches().find(m => m.playerOne === reportingPlayer || m.playerTwo === reportingPlayer);
        }
        if (reportingPlayer === undefined || match === undefined) {
            message.react('❌');
            return;
        }
        let newMatches = [];
        if (match.playerOne === reportingPlayer) newMatches = tournament.result(match, games[0], games[1], games[2]);
        else newMatches = tournament.result(match, games[1], games[0], games[2]);
        if (newMatches === null) {
            message.react('❌');
            return;
        }
        message.react('✅');
        if (newMatches > 0) {
            let msg = 'There are new matches!\n';
            newMatches.forEach(nm => msg += '\nRound ' + nm.round + ' Match ' + nm.matchNumber + ' - ' + nm.playerOne.alias + ' vs ' + nm.playerTwo.alias);
            msg += '\n\nYou can view current pairings and standings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.eventID;
            message.channel.send(msg);
        }
        return;
    }

    // Quit the tournament with !quit or !Q
    if (/^!(q|quit)(\s<@\d+>)?/i.test(message.content)) {
        let player;
        if (message.member.hasPermission("ADMINISTRATOR") && message.mentions.users.size === 1) player = tournament.players.find(p => p.id === message.mentions.users.first().id);
        else player = tournament.players.find(p => p.id === message.author.id);
        if (player === undefined) message.react('❌');
        const remove = tournament.removePlayer(player);
        if (remove) message.react('✅'); //TODO
        else message.react('❌');
    }

});

// If a user leaves the server, remove them from the tournament
client.on('guildMemberRemove', member => {
    // Find the active tournament, or return if it doesn't exist
    const tournament = EventManager.tournaments.find(t => t.eventID === message.channel.id);
    if (tournament === undefined) return;
    const player = tournament.players.find(p => p.id === member.id);
    if (player === undefined) return;
    const remove = tournament.removePlayer(player);
    //TODO
});

client.on('channelDelete', channel => {
    const tournament = EventManager.tournaments.find(t => t.eventId === channel.id);
    if (tournament === undefined) return;
    EventManager.removeTournament(tournament);
    const ref = db.ref('tournaments');
    ref.child(tournament.eventID).set(null);
});

// Save tournaments every minute
client.setInterval(save, 6e4);