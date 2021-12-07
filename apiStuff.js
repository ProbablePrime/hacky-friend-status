const fetch = require('node-fetch');
const { API, getAuthHeader } = require('./helpers');

async function getFriends(token, id) {
    const result = await fetch(API + 'users/'+ id + '/friends', {
        headers: {
            'Authorization': getAuthHeader(id, token)
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

module.exports = {
    getFriends,
    getStatus
}