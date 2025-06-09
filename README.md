# TaskBoard Widget

Ce projet fournit un petit serveur Node.js permettant d'afficher les tâches d'une liste Google Tasks.

## Installation

1. Installez les dépendances :

   ```bash
   npm install
   ```

2. Créez un fichier `.env` contenant :

   ```plaintext
   GOOGLE_CLIENT_ID=VotreClientID
   GOOGLE_CLIENT_SECRET=VotreClientSecret
   SESSION_SECRET=unSecretAleatoire
   OAUTH2_REDIRECT=http://localhost:3000/oauth2callback
   ```

   Les identifiants OAuth2 doivent avoir pour URL de redirection `http://localhost:3000/oauth2callback`.
   En cas d'erreur `invalid_grant`, assurez-vous que cette URL correspond exactement à celle configurée dans la console Google.
   Si le message mentionne `code_verifier`, supprimez cette valeur avant l'échange de jeton comme montré dans `server.js`.

## Utilisation

Lancez simplement le serveur :

```bash
node server.js
```

Ouvrez ensuite `http://localhost:3000` dans votre navigateur. Si vous n'êtes pas authentifié,
le bouton vous redirigera vers Google pour vous connecter. Vous pouvez saisir l'ID de la liste
Google Tasks à afficher (ou laisser `@default`).

## Widget

Une fois le serveur lancé, vous pouvez accéder à `http://localhost:3000/widget.html` pour
obtenir un widget affichant vos tâches sous forme d'Adaptive Card. Cette page peut être
intégrée dans un `<iframe>` au besoin. Les données proviennent de l'endpoint
`/api/widget-card` qui renvoie la carte déjà remplie.
