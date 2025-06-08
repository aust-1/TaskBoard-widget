require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { google } = require('googleapis');
const path = require('path');

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'change_me',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.OAUTH2_REDIRECT || 'http://localhost:3000/oauth2callback'
);

app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/tasks.readonly']
  });
  res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    req.session.tokens = tokens;
    res.redirect('/');
  } catch (err) {
    console.error('Token exchange failed:', err);
    res.status(500).send('Failed to authenticate with Google');
  }
});

app.get('/api/widget-data', async (req, res) => {
  if (!req.session.tokens) {
    return res.json({ needsAuth: true });
  }

  const listId = req.query.listId || '@default';
  oAuth2Client.setCredentials(req.session.tokens);
  const tasks = google.tasks({ version: 'v1', auth: oAuth2Client });
  try {
    const response = await tasks.tasks.list({
      tasklist: listId,
      maxResults: 5,
      showCompleted: false
    });
    res.json({ needsAuth: false, tasks: response.data.items || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
