import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const Discord = require('discord.js');
const TournamentOrganizer = require('tournament-organizer');
import {markdownTable} from 'markdown-table';

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

// Prepare Tournament Organizer
var EventManager;
var RoleManager;

// Start Discord
const client = new Discord.Client();
client.login(process.env.DISCORD_TOKEN);

// Add reaction
const react = (msg, bool) => {
    try {
        const reaction = bool ? '✅' : '❌';
        msg.react(reaction);
    } catch (err) {
        console.error(err);
    }
}

// Send reply
const reply = (msg, text, attach = null) => {
    try {
        if (attach === null) msg.reply(text);
        else msg.reply(text, attach);
    } catch (err) {
        console.error(err);
    }
}

// Send message
const send = (msg, text, attach = null) => {
    try {
        if (attach === null) msg.channel.send(text);
        else msg.channel.send(text, attach);
    } catch (err) {
        console.error(err);
    }
}

// Save tournaments function
const save = () => fs.writeFileSync(path.join(__dirname + '/static/save.json'), JSON.stringify(EventManager.tournaments));

// Table-fy new matches
const matchTable = arr => {
    const mdArray = [
        ['Match', 'Player 1', 'Player 2']
    ];
    arr.forEach(a => mdArray.push(['R' + a.round + 'M' + a.matchNumber, a.playerOne.alias, a.playerTwo.alias]));
    return(markdownTable(mdArray, {align: ['c', 'l', 'l']}));
}

// Set info and share link
const info = t => {
    const object = {
        name: t.name,
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
            playerOne: m.playerOne === null || m.playerOne === undefined ? 'N/A' : t.etc.hasOwnProperty('chess') ? m.playerOne.alias + ' (' + m.playerOne.seed + ')' : m.playerOne.alias,
            playerTwo: m.playerTwo === null || m.playerTwo === undefined ? 'N/A' : t.etc.hasOwnProperty('chess') ? m.playerTwo.alias + ' (' + m.playerTwo.seed + ')' : m.playerTwo.alias,
            active: m.active,
            result: m.draws === 0 ? m.playerOneWins + '-' + m.playerTwoWins : m.playerOneWins + '-' + m.playerTwoWins + '-' + m.draws
        });
    });
    const mdArray = [
        ['Rank', 'Player', 'Points']
    ];
    const alignArray = ['c', 'l', 'c'];
    const standings = t.standings(false);
    t.tiebreakers.forEach(b => {
        if (b !== 'match-points') alignArray.push('c');
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
            player: t.etc.hasOwnProperty('chess') ? s.alias + ' (' + s.seed + ')' : s.alias,
            matchPoints: s.matchPoints
        };
        const a = [i + 1, s.alias, s.matchPoints];
        const percentify = num => (Math.round(num * 1e4) / 1e2) + '%';
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
                    obj['oppMatchWinPctM'] = percentify(s.tiebreakers.oppMatchWinPctM);
                    obj['gameWinPct'] = percentify(s.tiebreakers.gameWinPct);
                    obj['oppGameWinPct'] = percentify(s.tiebreakers.oppGameWinPct);
                    break;
                case 'pokemon-tcg':
                    obj['oppMatchWinPctP'] = percentify(s.tiebreakers.oppMatchWinPctP);
                    obj['oppOppMatchWinPct'] = percentify(s.tiebreakers.oppOppMatchWinPct);
                    break;
                default:
                    break;
            }
        });
        object.standings.push(obj);
        mdArray.push(a);
    });
    const ref = db.ref('tournaments');
    ref.child(t.eventID).set(object);
    return markdownTable(mdArray, {align: alignArray});
}

// Bot is on
client.once('ready', () => {
    console.log('Bracketeer is online at ' + new Date(Date.now()));
    console.log('Number of servers that Bracketeer is in: ' + [...client.guilds.cache].length);
    
    // Discord presence
    client.user.setPresence({
        activity: {
            name: '!bracketeer',
            type: 'LISTENING'
        },
        status: 'online'
    });

    // Create role file if necessary
    const roles = path.join(__dirname + '/static/roles.json');
    if (!fs.existsSync(roles)) {
        const empty = [];
        fs.writeFileSync(roles, JSON.stringify(empty));
    }

    // Create archive file if necessary
    const arch = path.join(__dirname + '/static/archive.json');
    if (!fs.existsSync(arch)) {
        const empty = [];
        fs.writeFileSync(arch, JSON.stringify(empty));
    }

    // Recover saved information
    const file = path.join(__dirname + '/static/save.json');
    if (!fs.existsSync(file)) {
        const empty = [];
        fs.writeFileSync(file, JSON.stringify(empty));
    }
    const contents = fs.readFileSync(file);
    const oldTournaments = JSON.parse(contents);
    EventManager = new TournamentOrganizer.EventManager();
    EventManager.tournaments = oldTournaments.map(ot => EventManager.reloadTournament(ot));

    // Recover roles
    const rolesContent = fs.readFileSync(roles);
    RoleManager = JSON.parse(rolesContent);

    console.log('Number of tournaments that are active: ' + EventManager.tournaments.reduce((acc, cur) => acc += cur.active, 0));
});

// Interpreting messages
client.on('message', async message => {
    // Ignore bots and anything that doesn't start with !
    if (message.author.bot || !message.content.startsWith('!')) return;

    // Get help with !bracketeer
    if (/^!(bracketeer|help)$/i.test(message.content)) {
        reply(message, "Here are some commands available to players:\n```\n!j\nJoin the tournament\n\n!p\nGet your current match\n\n!r w-l-d\nReport your match\n\n!q\nQuit the tournament\n```If you need more help, check out https://slashinfty.github.io/bracketeer"  );
        return;
    }

    if (message.member.hasPermission('ADMINISTRATOR') && /^!to\s(add|remove)\s<@&\d+>/i.test(message.content) && message.mentions.roles.size === 1) {
        const roleID = message.mentions.roles.first().id;
        if (message.content.includes('add')) {
            if (!RoleManager.includes(roleID)) RoleManager.push(roleID);
            react(message, true);
        } else {
            if (RoleManager.includes(roleID)) {
                RoleManager.splice(RoleManager.indexOf(roleID), 1);
                react(message, true);
            } else react(message, false);
        }
        fs.writeFileSync(path.join(__dirname + '/static/roles.json'), JSON.stringify(RoleManager));
    }

    // Create a tournament with !new
    if ((message.member.hasPermission('ADMINISTRATOR') || [...message.member.roles.cache.keys()].some(x => RoleManager.includes(x))) && /^!new(\s\w+=[\w-,]+)*/i.test(message.content)) {
        // If !new without options, link to option generator
        if (message.content === '!new') {
            reply(message, `Looking for how to start a tournament? Try this: https://slashinfty.github.io/bracketeer/generator`);
            return;
        }
        // If a tournament is already happening
        if (EventManager.tournaments.find(t => t.eventID === message.channel.id) !== undefined) {
            reply(message, `Sorry, a tournament is already ongoing in this channel. You can only have one tournament per channel.`);
            return;
        }
        let submission = message.content.split(' ');
        submission.shift();
        let options = {};
        if (submission.find(x => x.includes('name')) !== undefined) {
            options.name = submission.find(x => x.includes('name')).match(/(?<=\=)[\w-]+/)[0];
            submission.splice(submission.findIndex(x => 'name=' + options.name), 1);
        }
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
        if (submission.find(x => x.includes('playoffs')) !== undefined) options.playoffs = submission.find(x => x.includes('playoffs')).match(/(?<=\=)[\w-]+/)[0];
        if (submission.find(x => x.includes('win')) !== undefined) options.winValue = Number(submission.find(x => x.includes('win')).match(/(?<=\=)[\w-]+/)[0]);
        if (submission.find(x => x.includes('draw')) !== undefined) options.drawValue = Number(submission.find(x => x.includes('draw')).match(/(?<=\=)[\w-]+/)[0]);
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
        if (submission.find(x => x.includes('chess')) !== undefined) tournament.etc.chess = submission.find(x => x.includes('chess')).match(/(?<=\=)[\w-]+/)[0];

        let desc = 'To join the tournament, type !join or !J';
        if (tournament.etc.hasOwnProperty('chess')) {
            tournament.seededPlayers = true;
            tournament.seedOrder = 'des';
            desc += tournament.etc.chess.includes('lichess') ? ' followed by your lichess username' : ' followed by your chess.com username';
        }

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

        send(message, { embed: embed });
        const number = EventManager.tournaments.length;
        const word = number === 1 ? 'is currently ' + number + ' tournament' : 'are currently ' + number + ' tournaments';
        console.log('Tournament created! There ' + word + '.');
    }

    // Find the active tournament, or return if it doesn't exist
    const tournament = EventManager.tournaments.find(t => t.eventID === message.channel.id);
    if (tournament === undefined) return;

    // Admin commands
    if (message.member.hasPermission('ADMINISTRATOR') || [...message.member.roles.cache.keys()].some(x => RoleManager.includes(x))) {
        // Upload a file with !upload
        if (/^!upload$/i.test(message.content) && message.attachments.size !== 0 && tournament.etc.hasOwnProperty('waiting') && tournament.etc.waiting) {
            if (tournament.players.length < 2) return;
            let object;
            try {
                let response = await fetch(message.attachments.first().url);
                object = await response.json();
            } catch (e) {
                reply(message, 'Sorry, that is not a valid file.');
                return;
            }
            object.forEach(entry => tournament.players.find(p => p.id === entry.id).seed = entry.value);
            tournament.etc.waiting = false;
            tournament.startEvent();
            info(tournament);
            send(message, 'Your tournament has started! View real-time pairings and standings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.eventID + '\n```\n' + markdownTable(tournament.activeMatches()) + '\n```');
            const number = EventManager.tournaments.reduce((acc, cur) => acc += cur.active, 0);
            const word = number === 1 ? 'is currently ' + number + ' tournament' : 'are currently ' + number + ' tournaments';
            console.log('Tournament started! There ' + word + ' running.');
            return;
        }

        // Start the tournament with !start
        if (/^!start$/i.test(message.content)) {
            if (tournament.players.length < 2) return;
            if (tournament.seededPlayers && !tournament.etc.hasOwnProperty('chess')) {
                tournament.etc.waiting = true;
                const content = tournament.players.map(p => ({
                    id: p.id,
                    name: p.alias,
                    value: p.seed
                }));
                const buffer = Buffer.from(JSON.stringify(content));
                const attachment = new Discord.MessageAttachment(buffer, 'AddPlayerValues.json');
                const order = tournament.seedOrder === 'asc' ? 'ascending' : 'descending';
                reply(message, 'Please add values to each player for sorting. Players will be sorted in ' + order + ' order. When uploading the file, add `!upload` in the message.', attachment);
                return;
            }
            tournament.startEvent();
            info(tournament);
            const msg = 'Your tournament has started! View real-time pairings and standings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.eventID + '\n```\n' + matchTable(tournament.activeMatches()) + '\n```';
            try {
                message.channel.send(msg);
            } catch (err) {
                message.channel.send('Your tournament has started! View real-time pairings and standings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.eventID);
                console.error(err);
                return;
            }
            const number = EventManager.tournaments.reduce((acc, cur) => acc += cur.active, 0);
            const word = number === 1 ? 'is currently ' + number + ' tournament' : 'are currently ' + number + ' tournaments';
            console.log('Tournament started! There ' + word + ' running.');
            return;
        }

        // Get a list of all active players with !list
        if (/^!list$/i.test(message.content)) {
            const activePlayers = tournament.players.filter(p => p.active).map(a => a.alias);
            const count = activePlayers.length;
            const list = count === 0 || tournament.active ? '' : '\n\n' + activePlayers.toString().replace(/,/g, ', ');
            send(message, 'There are ' + count + ' active players.' + list);
        }

        // Get a copy of the tournament in JSON format with !json
        if (/^!json$/i.test(message.content)) {
            const buffer = Buffer.from(JSON.stringify(tournament));
            const attachment = new Discord.MessageAttachment(buffer, tournament.name + '.json');
            reply(message, 'Here is a copy of your tournament.', attachment);
        }

        // End a tournament early with !end
        // regex: /^!end$/i
        if (/^!end$/i.test(message.content)) {
            tournament.active = false;
            const buffer = Buffer.from(JSON.stringify(tournament));
            const attachment = new Discord.MessageAttachment(buffer, tournament.name + '.json');
            try {
                message.channel.send('The tournament is now over.\n```\n' + info(tournament) + '\n```', attachment);
            } catch (err) {
                message.channel.send('The tournament is now over.', attachment);
                console.error(err);
            }
            EventManager.removeTournament(tournament);
            const ref = db.ref('tournaments');
            ref.child(tournament.eventID).set(null);
            const number = EventManager.tournaments.reduce((acc, cur) => acc += cur.active, 0);
            const word = number === 1 ? 'is currently ' + number + ' tournament' : 'are currently ' + number + ' tournaments';
            console.log('Tournament ended! There ' + word + ' running.');
        }

    }

    // Join a tournament with !join or !J
    if (/^!(j(?=\s|$)|join)(\s<@!\d+>)?(\s\w*)?/i.test(message.content)) {
        let seed = 0;
        let username = null;
        if (tournament.etc.hasOwnProperty('waiting') && tournament.etc.waiting) {
            react(message, false);
            return;
        }
        if (tournament.etc.hasOwnProperty('chess')) {
            const usernameArray = message.content.match(/(?<=[!J|!join](\s<@!\d+>)?\s)[\w-]+/);
            if (usernameArray === null) {
                react(message, false);
                return;
            }
            username = usernameArray[0];
            let rule = tournament.etc.chess.match(/(?<=-)\w+/)[0];
            if (tournament.etc.chess.includes('lichess')) {
                try {
                    const resp = await fetch('https://lichess.org/api/user/' + username);
                    const obj = await resp.json();
                    seed = obj.perfs[rule].rating;
                } catch (error) {
                    console.error(error);
                    react(message, false);
                    return;
                }
            } else {
                rule = 'chess_' + rule;
                try {
                    const resp = await fetch('https://api.chess.com/pub/player/' + username + '/stats');
                    const obj = await resp.json();
                    seed = obj.hasOwnProperty(rule) ? obj[rule].last.rating : 1200;
                } catch (error) {
                    console.error(error);
                    react(message, false);
                    return;
                }
            }
        }
        let add;
        const getName = member => member.nickname !== null ? member.nickname : member.user.username;
        if ((message.member.hasPermission('ADMINISTRATOR') || [...message.member.roles.cache.keys()].some(x => RoleManager.includes(x))) && message.mentions.users.size === 1) {
            const taggedUser = message.mentions.users.first();
            tournament.addPlayer(getName(taggedUser), taggedUser.id, seed);
        }
        else add = tournament.addPlayer(getName(message.member), message.author.id, seed);
        if (add) {
            react(message, true);
            const p = tournament.players.find(p => p.id === message.author.id);
            p.etc.chess = username;
        }
        else react(message, false);
        return;
    }

    // Get your current match with !pairing or !P
    if (/^!(p|pairing)$/i.test(message.content)) {
        const active = tournament.activeMatches();
        const match = active.find(m => m.playerOne.id === message.author.id || m.playerTwo.id === message.author.id);
        if (match === undefined) reply(message, 'You do not have an active match.');
        else reply(message, 'Round ' + match.round + ' Match ' + match.matchNumber + ' - ' + match.playerOne.alias + ' vs ' + match.playerTwo.alias);
    }

    // Get pairings and standings with !info or !status
    if (/^!(info|status)$/i.test(message.content)) {
        info(tournament);
        reply(message, 'You can view real-time pairings and standings at https://slashinfty.github.io/bracketeer/viewer?data=' + tournament.eventID)
        return;
    }

    // Report results with !results or !report or !R
    if (/^!(r(?=\s)|result|report)\s\d+(\.\d+)?-\d+(\.\d+)?(-\d+(\.\d+)?)?(\sr\d{1,2}m\d{1,3})?/i.test(message.content)) {
        const result = message.content.match(/(?<=[!r(?=\s)|!result|!report]\s)\d+(\.\d+)?-\d+(\.\d+)?(-\d+(\.\d+)?)?/i);
        const games = result[0].split('-').map(g => Number(g));
        if (games.length === 2) games.push(0);
        let match;
        let reportingPlayer;
        if ((message.member.hasPermission('ADMINISTRATOR') || [...message.member.roles.cache.keys()].some(x => RoleManager.includes(x))) && /r\d{1,2}m\d{1,3}/i.test(message.content)) {
            const roundNo = message.content.match(/(?<=r)\d+(?=m)/i)[0];
            const matchNo = message.content.match(/(?<=m)\d?/i)[0];
            match = tournament.matches.find(m => m.round === parseInt(roundNo) && m.matchNumber === parseInt(matchNo));
            reportingPlayer = match.playerOne;
            if (games[0] === 0 && games[1] === 0) {
                tournament.undoResults(match);
                react(message, true);
                info(tournament);
                return;
            }
        } else {
            reportingPlayer = tournament.players.find(p => p.id === message.author.id);
            const active = tournament.activeMatches();
            match = active.find(m => m.playerOne.id === reportingPlayer.id || m.playerTwo.id === reportingPlayer.id);
        }
        if (reportingPlayer === undefined || match === undefined) {
            react(message, false);
            return;
        }
        let newMatches = [];
        if (match.playerOne === reportingPlayer) newMatches = tournament.result(match, games[0], games[1], games[2]);
        else newMatches = tournament.result(match, games[1], games[0], games[2]);
        if (newMatches === null) {
            react(message, false);
            return;
        }
        react(message, true);
        info(tournament);
        if (newMatches.length > 0) {
            let msg = 'There are new matches!\n```\n' + matchTable(newMatches) + '\n```';
            try {
                message.channel.send(msg);
            } catch (err) {
                send(message, 'There are new matches!')
                console.log(err);
                return;
            }
        }
        if (!tournament.active) {
            const buffer = Buffer.from(JSON.stringify(tournament));
            const attachment = new Discord.MessageAttachment(buffer, tournament.name + '.json');
            send(message, 'The tournament is now over.\n```\n' + info(tournament) + '\n```', attachment);
            const arch = path.join(__dirname + '/static/archive.json');
            const contents = fs.readFileSync(arch);
            const archive = JSON.parse(contents);
            archive.push(tournament);
            fs.writeFileSync(arch, JSON.stringify(archive));
            EventManager.removeTournament(tournament);
            const ref = db.ref('tournaments');
            ref.child(tournament.eventID).set(null);
        }
        return;
    }

    // Quit the tournament with !quit or !Q
    if (/^!(q|quit)(\s<@\d+>)?/i.test(message.content)) {
        let player;
        if ((message.member.hasPermission('ADMINISTRATOR') || [...message.member.roles.cache.keys()].some(x => RoleManager.includes(x))) && message.mentions.users.size === 1) player = tournament.players.find(p => p.id === message.mentions.users.first().id);
        else player = tournament.players.find(p => p.id === message.author.id);
        if (player === undefined) message.react('❌');
        const newMatches = tournament.removePlayer(player);
        if (newMatches === false) {
            react(message, false);
            return;
        } else react(message, true);
        if (tournaments.active) info(tournament);
        if (typeof newMatches === 'object' && newMatches.length > 0) {
            let msg = 'There are new matches!\n```\n' + matchTable(newMatches) + '\n```';
            try {
                message.channel.send(msg);
            } catch (err) {
                send(message, 'There are new matches!')
                console.log(err);
                return;
            }
        }
        if (!tournament.active) {
            const buffer = Buffer.from(JSON.stringify(tournament));
            const attachment = new Discord.MessageAttachment(buffer, tournament.name + '.json');
            send(message, 'The tournament is now over.\n```\n' + info(tournament) + '\n```', attachment);
            EventManager.removeTournament(tournament);
            const ref = db.ref('tournaments');
            ref.child(tournament.eventID).set(null);
        }
    }

});

// If a user updates their nickname, change it
client.on('guildMemberUpdate', (oldMember, newMember) => {
    const tournament = EventManager.tournaments.find(t => t.eventID === message.channel.id);
    if (tournament === undefined) return;
    const player = tournament.players.find(p => p.id === member.id);
    if (player === undefined) return;
    if (newMember.nickname === null || oldMember.nickname === newMember.nickname) return;
    player.alias = newMember.nickname;
    if (tournament.active) info(tournament);
});

// If a user leaves the server, remove them from the tournament
client.on('guildMemberRemove', member => {
    const tournament = EventManager.tournaments.find(t => t.eventID === message.channel.id);
    if (tournament === undefined) return;
    const player = tournament.players.find(p => p.id === member.id);
    if (player === undefined) return;
    const newMatches = tournament.removePlayer(player);
    if (newMatches === false) return;
    if(tournament.active) info(tournament);
    if (typeof newMatches === object && newMatches.length > 0) {
        let msg = 'There are new matches!\n```\n' + matchTable(newMatches) + '\n```';
        try {
            message.channel.send(msg);
        } catch (err) {
            send(message, 'There are new matches!')
            console.log(err);
        }
    }
    if (!tournament.active) {
        const buffer = Buffer.from(JSON.stringify(tournament));
        const attachment = new Discord.MessageAttachment(buffer, tournament.name + '.json');
        send(message, 'The tournament is now over.\n```\n' + info(tournament) + '\n```', attachment);
        EventManager.removeTournament(tournament);
        const ref = db.ref('tournaments');
        ref.child(tournament.eventID).set(null);
    }
});

// If the channel where the tournament is being ran is deleted, then delete the tournament
client.on('channelDelete', channel => {
    const tournament = EventManager.tournaments.find(t => t.eventId === channel.id);
    if (tournament === undefined) return;
    EventManager.removeTournament(tournament);
    const ref = db.ref('tournaments');
    ref.child(tournament.eventID).set(null);
    const number = EventManager.tournaments.reduce((acc, cur) => acc += cur.active, 0);
    const word = number === 1 ? 'is currently ' + number + ' tournament' : 'are currently ' + number + ' tournaments';
    console.log('Tournament ended! There ' + word + ' running.');
});

// If a role is deleted, if it's a TO role, remove it
client.on('roleDelete', role => {
    const oldRole = RoleManager.indexOf(role.id);
    if (oldRole > -1) RoleManager.splice(oldRole, 1);
    fs.writeFileSync(path.join(__dirname + '/static/roles.json'), JSON.stringify(RoleManager));
});

// If the bot is removed from a server, delete any tournaments being ran
client.on('guildDelete', guild => {
    const tournamentIDs = EventManager.tournaments.map(t => t.eventID);
    const ref = db.ref('tournaments');
    if ([...guild.channels.cache.keys()].some(x => tournamentIDs.includes(x))) {
        const oldTournaments = [...guild.channels.cache.keys()].filter(x => tournamentIDs.includes(x));
        oldTournaments.forEach(t => {
            const tournament = EventManager.tournaments.find(tour => tour.eventID === t);
            EventManager.removeTournament(tournament);
            ref.child(tournament.eventID).set(null);
        });
    }
    if ([...guild.roles.cache.keys()].some(x => RoleManager.includes(x))) {
        const oldRoles = [...guild.roles.cache.keys()].filter(x => RoleManager.includes(x));
        oldRoles.forEach(r => RoleManager.splice(RoleManager.indexOf(r), 1));
        fs.writeFileSync(path.join(__dirname + '/static/roles.json'), JSON.stringify(RoleManager));
    }
    const number = [...client.guilds.cache].length;
    const word = number === 1 ? ' server.' : ' servers.';
    console.log('Bracketeer left a server. Now in ' + number + word);
});

client.on('guideCreate', guild => {
    const number = [...client.guilds.cache].length;
    const word = number === 1 ? ' server.' : ' servers.';
    console.log('Bracketeer joined a server. Now in ' + number + word);
});

// Save tournaments every minute
client.setInterval(save, 6e4);
