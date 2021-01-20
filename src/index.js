const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const TournamentOrganizer = require('tournament-organizer');
const User = require(path.join(__dirname + 'users.js'));
const Admin = require(path.join(__dirname + 'admins.js'));

require('dotenv').config();

// Start Discord
const client = new Discord.client();
client.login(process.env.TOKEN);

// Start Tournament Organizer
const EventManager = new TournamentOrganizer.EventManager();

// Save tournaments
const save = () => fs.writeFileSync(path.join(__dirname + '/../static/save.json'), JSON.stringify(EventManager.tournaments));

// Bot is on
client.once('ready', () => {
    console.log('Bracketeer is online at ' + new Date(Date.now()));
    
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

client.on('message', message => {
    if (message.author.bot) return;

    if (message.member.hasPermission('ADMINISTRATOR')) {
        // New command
        if (message.content.startsWith('!new')) {
            if (EventManager.tournaments.find(t => t.eventID === message.channel.id) !== undefined) {
                message.reply(`Sorry, a tournament is already ongoing in this channel. You can only have one tournament per channel.`);
                return;
            }
            Admin.create(EventManager, message);
        }

        // File upload

    }

    if (!message.content.startsWith('!')) return;

    const tournament = EventManager.tournaments.find(t => t.eventID === message.channel.id);
    if (tournament === undefined) return;

    if (message.member.hasPermission('ADMINISTRATOR')) {
        // Start command

        // Info command

        // End command

    }

    // Join command

    // Pairing command

    // Results command

    // Quiz command

});

// Save tournaments
client.setInterval(save, 3e5);