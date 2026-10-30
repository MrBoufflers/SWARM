# SWARM — Siège & Fusée

Jeu de société asymétrique pour 2 joueurs (prototype v0.3).

- **La colonie** construit une fusée de 12 étages tout en défendant sa base avec des murs, des pièges camouflés et des tourelles.
- **L'essaim** dépense sa biomasse pour déployer des créatures (aggro, tank, soutien) et les faire évoluer grâce à trois arbres d'amélioration.

La colonie gagne quand le 12ᵉ étage est achevé ; l'essaim gagne quand la colonie n'a plus de travailleurs.

## Jouer

Ouvrir `dist/siege-fusee-jeu.html` dans un navigateur : deux joueurs sur le même appareil, avec un écran de passage entre les tours. La partie est sauvegardée automatiquement dans le navigateur.

Le jeu en ligne (lobby avec code pour rejoindre) est en préparation.

## Règles

Voir [`docs/regles-v0.3.md`](docs/regles-v0.3.md) (export du livret ; les valeurs marquées † sont encore à valider).

## Développement

```
npm install && npx playwright install chromium
npm run build      # régénère dist/siege-fusee-jeu.html à partir de src/
npm test           # tests de règles
npm run e2e        # partie complète jouée en clics réels dans Chromium
```

- `src/engine.js` : moteur de règles, sans DOM (tourne aussi sous Node).
- `src/ui.js`, `src/style.css` : interface.
- `tools/` : pictos et assemblage de la page.
