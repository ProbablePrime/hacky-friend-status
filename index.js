const fetch = require('node-fetch');
const config = require('config');

const fs = require('fs');
const { parse } = require('json2csv');
const { login, API, getAuthHeader } = require('./helpers');
const {getFriends, getStatus} = require('./apiStuff');

async function main() {
    const token = await login(config.get('username'),config.get('password'));
    const friends = await getFriends(token, config.get('id'));

    const offlineFriends = friends
        .filter(function(friend) {
            return friend.userStatus.onlineStatus === 'Offline';
        })
        .filter(function(friend) {
            return friend.friendUsername !== 'Neos';
        });

    const filteredFriends = offlineFriends.map(function(friend) {
        return {
            username: friend.friendUsername,
            id: friend.id
        }
    }); 
    console.log(filteredFriends.length);

    for (let friend of filteredFriends) {
        console.log('Checking ' + friend.username);
        const status = await getStatus(friend.id);
        friend.lastStatus = new Date(status.lastStatusChange);
    }
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const vanishedFriends = filteredFriends.filter(function(friend) {
        return friend.lastStatus < threeMonthsAgo;
    });
    writeCSV(vanishedFriends, 'vanished.csv');
}

function writeCSV(friends, name) {
    const csv = parse(friends, {header:true});
    fs.writeFileSync(name, csv);
}

main();