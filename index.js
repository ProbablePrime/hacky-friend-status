const fetch = require('node-fetch');
const config = require('config');

const fs = require('fs');
const { parse } = require('json2csv');
const { login, API } = require('./helpers');

async function getFriends(token) {
    const result = await fetch(API + 'users/'+ config.get('id') + '/friends', {
        headers: {
            'Authorization': 'neos '+ config.get('id') + ':' + token
        }
    });

    const json = await result.json();
    return json;
}
async function getStatus(userId) {
    const result = await fetch(API + 'users/'+ userId + '/status');
    const json = await result.json();
    return json;
}

async function main() {
    const token = await login(config.get('username'),config.get('password'));
    const friends = await getFriends(token);

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