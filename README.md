# SWARM — Siège & Fusée

Jeu de société asymétrique pour 2 joueurs (prototype v0.3).

- **La colonie** construit une fusée de 12 étages tout en défendant sa base avec des murs, des pièges camouflés et des tourelles.
- **L'essaim** dépense sa biomasse pour déployer des créatures (aggro, tank, soutien) et les faire évoluer grâce à trois arbres d'amélioration.

La colonie gagne quand le 12ᵉ étage est achevé ; l'essaim gagne quand la colonie n'a plus de travailleurs.

## Jouer

- **Sur un seul appareil** : ouvrir `dist/siege-fusee-jeu.html` dans un navigateur, puis « Nouvelle partie locale ». Écran de passage entre les tours ; la partie est sauvegardée dans le navigateur.
- **En ligne** (site Netlify) : un joueur choisit son camp et crée la partie ; il obtient un **code de 5 caractères** (et un lien) à donner à l'adversaire, qui le saisit dans « Rejoindre ». Chaque joueur ne reçoit que ce que son camp a le droit de voir. Recharger la page reprend la partie.
- **En ligne sur son ordinateur** : `npm run serveur`, puis http://localhost:8888 (parties gardées en mémoire).

## Règles

Voir [`docs/regles-v0.3.md`](docs/regles-v0.3.md) (export du livret ; les valeurs marquées † sont encore à valider).

## Développement

```
npm install && npx playwright install chromium
npm run build      # régénère dist/siege-fusee-jeu.html à partir de src/
npm test           # tests de règles et du serveur
npm run e2e        # partie locale complète jouée en clics réels dans Chromium
npm run e2e:en-ligne   # partie en ligne complète entre deux navigateurs
npm run serveur    # serveur local (page + /api)
```

- `src/engine.js` : moteur de règles, sans DOM (tourne aussi sous Node).
- `src/ui.js`, `src/style.css` : interface.
- `tools/` : pictos et assemblage de la page.
- `server/core.js` : serveur du jeu en ligne (lobby, codes, jetons, actions, vues filtrées) ; `server/dev.js` : serveur local.
- `netlify/functions/api.mjs` : le même serveur sur Netlify (état des parties dans Netlify Blobs) ; configuration dans `netlify.toml`.
