const name = document.getElementById('tournament-name');
const format = document.getElementById('format');
const playoffs = document.getElementById('playoffs');
const winValue = document.getElementById('win-value');
const drawValue = document.getElementById('draw-value');
const lossValue = document.getElementById('loss-value');
const bestOf = document.getElementById('best-of');
const maxPlayers = document.getElementById('max-players');
const numberOfRounds = document.getElementById('number-rounds');
const cutType = document.getElementById('cut-type');
const cutLimit = document.getElementById('cut-limit');
const groupNumber = document.getElementById('group-number');
const cutEachGroup = document.getElementById('cut-each-group');
const sortPlayers = document.getElementById('sort-players');
const thirdPlaceMatch = document.getElementById('third-place-match');
const chessAPI = document.getElementById('chess-api');
const tiebreakers = document.getElementById('tiebreakers');
const startCommand = document.getElementById('start-command');

format.addEventListener('change', () => {
    switch (format.value) {
        case 'elim': {
            [playoffs, bestOf, numberOfRounds, cutType, cutLimit, groupNumber, cutEachGroup, tiebreakers].forEach(e => e.disabled = true);
            thirdPlaceMatch.disabled = false;
            break;
        }
        case '2xelim': {
            [playoffs, bestOf, numberOfRounds, cutType, cutLimit, groupNumber, cutEachGroup, thirdPlaceMatch, tiebreakers].forEach(e => e.disabled = true);
            break;
        }
        case 'swiss': {
            [groupNumber, cutEachGroup, thirdPlaceMatch].forEach(e => e.disabled = true);
            [playoffs, bestOf, numberOfRounds, cutType, cutLimit, tiebreakers].forEach(e => e.disabled = false);
            thirdPlaceMatch.disabled = playoffs.value !== 'elim';
            break;
        }
        case 'dutch': {
            [groupNumber, cutEachGroup, thirdPlaceMatch].forEach(e => e.disabled = true);
            [playoffs, bestOf, numberOfRounds, cutType, cutLimit, tiebreakers].forEach(e => e.disabled = false);
            thirdPlaceMatch.disabled = playoffs.value !== 'elim';
            break;
        }
        case 'robin': 
        case '2xrobin': {
            [numberOfRounds, thirdPlaceMatch].forEach(e => e.disabled = true);
            [playoffs, bestOf, cutLimit, cutType, groupNumber, cutEachGroup, tiebreakers].forEach(e => e.disabled = false);
            thirdPlaceMatch.disabled = playoffs.value !== 'elim';
            break;
        }
        default: break;
    }
});

playoffs.addEventListener('change', () => thirdPlaceMatch.disabled = playoffs.value === 'elim' ? false : true);

const generate = () => {
    let command = '!new';
    command += name.value === '' ? '' : ' name=' + name.value.toLowerCase().replace(/[\s_]/g, '-').replace(/[^a-z\d-]/g, '');
    command += ' format=' + format.value;
    command += format.value.includes('elim') || playoffs.value === 'none' ? '' : ' playoffs=' + playoffs.value;
    command += winValue.value === '1' ? '' : ' win=' + winValue.value;
    command += drawValue.value === '0.5' ? '' : ' draw=' + drawValue.value;
    command += lossValue.value === '0' ? '' : ' loss=' + lossValue.value;
    command += format.value.includes('elim') || bestOf.value === '1' ? '' : ' bestof=' + bestOf.value;
    command += maxPlayers.value === '' ? '' : ' maxplayers=' + maxPlayers.value;
    command += (format.value.includes('swiss') || format.value.includes('dutch')) && numberOfRounds.value !== '' ? ' rounds=' + numberOfRounds.value : '';
    command += format.value.includes('elim') || cutType.value === 'rank' ? '' : ' cuttype=points';
    command += format.value.includes('elim') || playoffs.value === 'none' ? '' : ' cutlimit=' + cutLimit.value;
    command += format.value.includes('robin') && groupNumber.value !== '' ? ' groups=' + groupNumber.value : '';
    command += format.value.includes('robin') && cutEachGroup.value === 'true' ? ' cutgroups=true' : '';
    command += sortPlayers.value === 'none' ? '' : ' sort=' + sortPlayers.value;
    command += (format.value === 'elim' || playoffs.value === 'elim') && thirdPlaceMatch.value === 'true' ? ' thirdplace=true' : '';
    command += chessAPI.value === 'none' ? '' : ' chess=' + chessAPI.value;
    const tiebreakerOptions = ['buchholz-cut1', 'solkoff', 'median-buchholz', 'sonneborn-berger', 'cumulative', 'versus', 'magic-tcg', 'pokemon-tcg'];
    const tiebreakerEntry = tiebreakers.value.toLowerCase().split(',').map(t => t.trim().replace(/\s/g,'-').replace(/-(?=\d)/g, '')).filter(t => tiebreakerOptions.includes(t));
    command += format.value.includes('elim') || tiebreakerEntry.length === 0 ? '' : ' tiebreakers=' + tiebreakerEntry.reduce((x, y) => x += x === '' ? y : ',' + y, '');
    startCommand.value = command;
}

const copyToClipboard = () => {
    startCommand.select();
    document.execCommand('copy');
}