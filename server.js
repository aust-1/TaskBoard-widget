require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { google } = require('googleapis');
const path = require('path');
const { randomBytes, createHash } = require('crypto');

function base64URLEncode(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest();
}

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'change_me_to_a_strong_secret',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.OAUTH2_REDIRECT || 'https://taskboard-widget.onrender.com/oauth2callback'
);

app.get('/auth', (req, res) => {
  const codeVerifier = base64URLEncode(randomBytes(32));
  req.session.codeVerifier = codeVerifier;
  const codeChallenge = base64URLEncode(sha256(codeVerifier));

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/tasks.readonly'],
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const { tokens } = await oAuth2Client.getToken({
      code,
      codeVerifier: req.session.codeVerifier,
      redirect_uri: oAuth2Client.redirectUri
    });
    req.session.tokens = tokens;
    res.redirect('/');
  } catch (err) {
    console.error('Token exchange failed:', err);
    res.status(500).send('Failed to retrieve access token');
  }
});

app.get('/api/widget-data', async (req, res) => {
  if (!req.session.tokens) {
    return res.json({ needsAuth: true });
  }

  oAuth2Client.setCredentials(req.session.tokens);
  const tasks = google.tasks({ version: 'v1', auth: oAuth2Client });
  const listId = req.query.listId || '@default';

  try {
    const response = await tasks.tasks.list({
      tasklist: listId,
      maxResults: 5,
      showCompleted: false
    });
    res.json({ needsAuth: false, tasks: response.data.items || [] });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.get('/api/lists', async (req, res) => {
  if (!req.session.tokens) {
    return res.json({ needsAuth: true });
  }
  try {
    oAuth2Client.setCredentials(req.session.tokens);
    const tasksApi = google.tasks({ version: 'v1', auth: oAuth2Client });
    const response = await tasksApi.tasklists.list({ maxResults: 100 });
    res.json({ needsAuth: false, lists: response.data.items || [] });
  } catch (err) {
    console.error('Error fetching task lists:', err);
    res.status(500).json({ error: 'Failed to fetch task lists' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
