const fetch = require('node-fetch');
const config = require('config');

const fs = require('fs');
const { parse } = require('json2csv');
const { login, API, getAuthHeader } = require('./helpers');
const {getFriends, getStatus} = require('./apiStuff');

async function main() {
    const token = await login(config.get('username'),config.get('password'));
    const friends = await getFriends(token, config.get('id'));

    const filteredFriends = friends.map(function(friend) {
        return {
            username: friend.friendUsername,
            id: friend.id
        }
    });
    writeCSV(filteredFriends, 'friends.csv');
}

function writeCSV(friends, name) {
    const csv = parse(friends, {header:true});
    fs.writeFileSync(name, csv);
}

main();