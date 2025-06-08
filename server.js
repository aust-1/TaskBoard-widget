require('dotenv').config();
const express = require('express');


const { google } = require('googleapis');
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// Création du client OAuth2
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

// Point d’entrée pour démarrer l’authentification
app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/tasks.readonly']
  });
  res.redirect(authUrl);
});

// Callback OAuth2
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oAuth2Client.getToken(code);
  req.session.tokens = tokens;
  res.redirect('/');  // retour à la page d’accueil
});


const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// Endpoint pour le widget
app.get('/api/widget-data', async (req, res) => {
  if (!req.session.tokens) {
    // Pas encore authentifié → on le redirige vers Google
    return res.json({ needsAuth: true });
  }

  oAuth2Client.setCredentials(req.session.tokens);
  const tasks = google.tasks({ version: 'v1', auth: oAuth2Client });

  try {
    // Récupère les 5 tâches principales de la liste "default"
    const response = await tasks.tasks.list({
      tasklist: '@default',
      maxResults: 5,
      showCompleted: false
    });
    const items = response.data.items || [];
    res.json({ needsAuth: false, tasks: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur au fetch des tâches' });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
