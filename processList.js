const config = require('config');
const csv = require("csvtojson");
const fetch = require('node-fetch');

const { login, API } = require('./helpers');

async function removeFriend(token, friendUserId) {
    const result = await fetch(`${API}users/${config.get('id')}/friends/${friendUserId}`, {
        method:'DELETE',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `neos ${config.get('id')}:${token}`
        }
    });
    return result.status === 200;
}

async function main() {
    const token = await login(config.get('username'),config.get('password'));
    const json = await csv().fromFile('filtered.csv');
    for (let friend of json) {
        const success = await removeFriend(token, friend.id);
        if (success) {
            console.log(`Removed: ${friend.username}`);
        } else {
            console.log(`Shits Fucked with: ${friend.username}`);
        }
    }
}

main();

