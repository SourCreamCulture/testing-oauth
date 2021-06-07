
const express = require('express');
const config = require('./config.json');
const FormData = require('form-data');
const fetch = require('node-fetch');
const app = express();
app.use(require('express-session')(config.session))

app.get('/', async (req, resp) => {
    if(!req.session.bearer_token)
        return resp.redirect('/login')
    
    const data = await fetch(`https://discord.com/api/users/@me`, {headers: { Authorization: `Bearer ${req.session.bearer_token}` } });
    const json = await data.json();

    if(!json.username)
        return resp.redirect('/login')

    resp.send(`<h1>Hello, ${json.username}#${json.discriminator}!</h1>` +
              `<img src="https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}?size=512">` +
              `<h2>ID: ${json.id}</h2>`)
})

app.get('/login/callback', async (req, resp) => {
    const accessCode = req.query.code;
    if (!accessCode)
        return resp.send('No access code specified');

    const data = new FormData();
    data.append('client_id', config.oauth2.client_id);
    data.append('client_secret', config.oauth2.secret);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', config.oauth2.redirect_uri);
    data.append('scope', 'identify');
    data.append('code', accessCode);

    const json = await (await fetch('https://discord.com/api/oauth2/token', {method: 'POST', body: data})).json();
    req.session.bearer_token = json.access_token;

    resp.redirect('/');
});

app.get('/login', async ({ query }, response) => {
    return response.sendFile('index.html', { root: '.' });
})

app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}`)
});