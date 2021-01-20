const fetch = require('node-fetch');
const test = async () => {
    try {
        const response = await fetch(`https://media.discordapp.net/attachments/769919838114021407/801481826320908288/image0.jpg?width=514&height=686`);
        const object = await response.json();
    } catch(e) {
        console.log('sorry, it did not work');
    }
    
    console.log(object);
}

test();