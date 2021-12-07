const fetch = require('node-fetch');
const config = require('config');
const { login, API, getAuthHeader } = require('./helpers');
const {getFriends, getStatus} = require('./apiStuff');
const Table = require('table-layout');

const {Duration} = require('luxon');

let friends;
let token;
let id;

function notOffline(friend) {
    return friend.userStatus.onlineStatus !== 'Offline';
}

function filterProperties(friend) {
    return {
        id: friend.id,
        username: friend.friendUsername,
        status: friend.userStatus.onlineStatus,
        lastChange: new Date(friend.userStatus.lastStatusChange),
        accessLevel: getAccessLevel(friend.userStatus.currentSessionAccessLevel),
        hidden: friend.userStatus.currentSessionHidden,
        timeInPublic: Duration.fromMillis(0),
        timeInPrivate: Duration.fromMillis(0)
    }
}

function findFriend(friendList, friendId) {
    return friendList.find(function(friend) {
        return friend.id === friendId;
    });
}

async function main() {
    id = config.get('id');
    token = await login(config.get('username'),config.get('password'));
    const friendsFromNeos = await getFriends(token, id);

    friends = friendsFromNeos
        .filter(notOffline)
        .map(filterProperties);
    
    setInterval(processFriends, 1000 * 5);
}

function getAccessLevel(level) {
    switch(level) {
        case 0:
            return 'Private';
        case 1:
            return 'LAN';
        case 2:
            return 'Friends';
        case 3:
            return 'Friends+';
        case 4:
            return 'RegisteredUsers';
        case 5:
            return 'Anyone';
    }
}
function isInPrivate(friend) {
    return friend.accessLevel === 'Private' || friend.accessLevel ==='LAN' || friend.hidden;
}

async function processFriends() {
    const apiFriends = await getFriends(token, id);

    // newFriends compared with friends;
    const newFriends = apiFriends
        .filter(notOffline)
        .map(filterProperties);

    const processedNewFriends = newFriends.map(function(newFriend) {
            const oldFriend = findFriend(friends, newFriend.id);
            if (oldFriend === undefined || oldFriend === null) {
                return newFriend;
            }
            const oldPrivate = isInPrivate(oldFriend);
            const newPrivate = isInPrivate(newFriend);

            newFriend.timeInPrivate = oldFriend.timeInPrivate;
            newFriend.timeInPublic = oldFriend.timeInPublic;

            if(oldFriend.lastChange < newFriend.lastChange) {
                //They've Changed!!
                // console.log(oldFriend.timeInPrivate, oldFriend.timeInPublic);
                // console.log(Math.abs(newFriend.lastChange.getTime() - oldFriend.lastChange.getTime()));
                // private -> Public increment Private Time
                if (!oldPrivate && newPrivate) {
                    newFriend.timeInPublic = newFriend.timeInPublic.plus(Math.abs(newFriend.lastChange.getTime() - oldFriend.lastChange.getTime()));
                } else if (oldPrivate && !newPrivate) {
                    newFriend.timeInPrivate = newFriend.timeInPrivate.plus(Math.abs(newFriend.lastChange.getTime() - oldFriend.lastChange.getTime()));
                } else if (oldPrivate === newPrivate && newPrivate) {
                    newFriend.timeInPrivate = newFriend.timeInPrivate.plus(Math.abs(newFriend.lastChange.getTime() - oldFriend.lastChange.getTime()));
                } else if (oldPrivate === newPrivate && !newPrivate) {
                    newFriend.timeInPublic = newFriend.timeInPublic.plus(Math.abs(newFriend.lastChange.getTime() - oldFriend.lastChange.getTime()));
                }
            }
            return newFriend;
        });
    // Override old with new data
    friends = processedNewFriends;
    console.log(makeTable(processedNewFriends));
}

function formatDuration(duration) {
    return duration.toISOTime();
}

function makeTable(friends) {
    const table = new Table(friends, { maxWidth: 500,columns:[
        {
            name: 'timeInPublic',
            transform: formatDuration
        },
        {
            name: 'timeInPrivate',
            transform: formatDuration
        }
    ]});
    return table.toString();
}

// "currentSessionAccessLevel": 3,
//             "currentSessionHidden": true,
// [
//     {
//         "id": "U-Neos",
//         "friendUsername": "Neos",
//         "friendStatus": "Accepted",
//         "isAccepted": true,
//         "userStatus": {
//             "onlineStatus": "Offline",
//             "lastStatusChange": "2018-01-01T00:00:00",
//             "currentSessionAccessLevel": 0,
//             "currentSessionHidden": false,
//             "currentHosting": false,
//             "outputDevice": "Unknown",
//             "isMobile": false
//         },
//         "profile": {
//             "iconUrl": "neosdb:///27095aed82033a1b36f4051f3bda0e654ff21c0f816f14bf3bb9d574f1f97a34.webp"
//         },
//         "latestMessageTime": "2021-08-01T13:28:08.9185219Z",
//         "ownerId": "U-ProbablePrime"
//     },



// 0 Private
// 1 LAN
// const SessionAccessLevel = new Enumerable([
// 	"Private",
// 	"LAN",
// 	"Friends",
// 	"RegisteredUsers",
// 	"Anyone",
// ]

main();