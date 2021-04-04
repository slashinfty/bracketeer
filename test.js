//const hastebin = require('hastebin');
const url = require('url');
const fetch = require('node-fetch');

const obj = [
    {first: 'words', second: 0},
    {first: 'numbers', second: 3}
];
const test = async () => {
    console.log('step 1');
    const haste = await fetch('https://hastebin.com/documents', {
        method: "POST",
        body: JSON.stringify(obj)
        //headers: { "Content-Type": "text/plain"}
    });
    console.log('step 2');
    console.log(haste);
    console.log('step 3');
    
}

test();

/*const fetch = require('node-fetch');

const test = async () => {
    try {
        const response = await fetch(`https://media.discordapp.net/attachments/769919838114021407/801481826320908288/image0.jpg?width=514&height=686`);
        const object = await response.json();
    } catch(e) {
        console.log('sorry, it did not work');
    }
    
    console.log(object);
}

test();*/