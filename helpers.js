const fetch = require('node-fetch');
const API = 'https://api.neos.com/api/';

async function login(username, password) {
    const body = {
        Username: username,
        Password: password,
        SecretMachineId: 'abc1234',
        RememberMe: true
    };

    const result = await fetch(API + 'userSessions', {
        method:'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    });
    const json = await result.json();
    return json.token;
}

function getAuthHeader(userId, token) {
    return 'neos '+ userId + ':' + token
}

module.exports = {
    login,
    API,
    getAuthHeader
};