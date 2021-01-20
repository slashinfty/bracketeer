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
    }
}