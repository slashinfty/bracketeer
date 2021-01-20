module.exports = {
    create: (em, msg) => {
        let submission = msg.content.split(' ');
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
        if (submission.find(x => x.includes('tiebreakers')) !== undefined) options.tiebreakers = submission.find(x => x.includes('')).match(/(?<=\=)[\w-,]+/)[0].split(',');

        const tournament = em.createTournament(msg.channel.id, options);
        if (submission.find(x => x.includes('chess')) !== undefined) options.chess = submission.find(x => x.includes('chess')).match(/(?<=\=)[\w-]+/)[0];

        let desc = 'To join the tournament, type !join or !J';
        if (tournament.hasOwnProperty('chess')) desc += tournament.chess.includes('lichess') ? ' followed by your lichess username' : ' followed by your chess.com username';

        let embedFormat;
        if (tournament.format === 'elim') embedFormat = tournament.doubleElim ? 'Double Elimination' : 'Single Elimination';
        else if (tournament.format === 'robin') embedFormat = tournament.doubleRR ? 'Double Round-Robin' : 'Round-Robin';
        else embedFormat = tournament.dutch ? 'Dutch' : 'Swiss';
        
        let embedPlayoffs = tournament.playoffs === null ? 'None' : tournament.playoffs === 'elim' ? 'Single Elimination' : 'Double Elimination';

        const embed = {
            color: 0x008e26,
            title: tournament.name === null ? 'New Tournament' : tournament.name,
            author: {
                name: 'Bracketeer',
                url: 'https://mattbraddock.com/bracketeer'
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

        if (tournament.playoffs !== null) {
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

        msg.channel.send({ embed: embed });
    }
}