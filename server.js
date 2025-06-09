require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
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

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.get('/api/widget-card', async (req, res) => {
  const listId = req.query.listId || '@default';
  let tasksData;
  if (!req.session.tokens) {
    tasksData = { needsAuth: true, tasks: [] };
  } else {
    oAuth2Client.setCredentials(req.session.tokens);
    const tasksApi = google.tasks({ version: 'v1', auth: oAuth2Client });
    try {
      const response = await tasksApi.tasks.list({
        tasklist: listId,
        maxResults: 5,
        showCompleted: false
      });
      tasksData = { needsAuth: false, tasks: response.data.items || [] };
    } catch (err) {
      console.error('Error fetching tasks:', err);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
  // Build AdaptiveCard JSON
  const { needsAuth, tasks } = tasksData;
  const card = {
    type: 'AdaptiveCard',
    version: '1.5',
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'Authentifier',
        url: '/auth',
        isVisible: needsAuth
      }
    ],
    body: [
      {
        type: 'TextBlock',
        text: '🗒️ Mes prochaines tâches',
        weight: 'Bolder',
        size: 'Medium'
      },
      {
        type: 'Container',
        items: tasks.map(t => ({
          type: 'TextBlock',
          text: `${t.title}${t.due ? '\n— ' + t.due : ''}`,
          wrap: true
        })),
        isVisible: tasks.length > 0
      },
      {
        type: 'TextBlock',
        id: 'authPrompt',
        text: needsAuth ? 'Cliquez pour vous connecter à Google Tasks' : '',
        weight: 'Bolder',
        color: 'Attention',
        isVisible: needsAuth
      }
    ]
  };
  res.json(card);
});

app.post('/share-target', (req, res) => {
  res.redirect('/');
});

app.post('/open-file', (req, res) => {
  res.redirect('/');
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
