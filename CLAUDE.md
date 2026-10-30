# SWARM — « Siège & Fusée », prototype v0.3

Jeu de société asymétrique pour 2 joueurs, conçu par Oni (game designer, francophone). Ce dépôt contient le **prototype jouable en HTML/JS** (2 joueurs sur le même appareil) et l'export du livret de règles. Prochaine étape demandée : **le jeu en ligne avec un lobby et un code pour rejoindre**.

Tout le contenu du jeu, les messages et la documentation sont **en français**. Réponds à Oni en français.

## Règles de travail (demandées par Oni — à respecter)

- **Co-pilote prudent.** Aucune modification de gameplay (valeurs, règles, capacités) sans validation préalable d'Oni. Une tâche technique (réseau, lobby, refactor) ne doit **pas** changer le comportement des règles.
- **Remonter les décisions** plutôt que les trancher seul ; poser des questions quand une demande est imprécise.
- **Signaler les incohérences** (entre le moteur, l'interface et le livret) au lieu de les corriger en silence.
- **Pas de simulation** (parties automatiques en masse, études d'équilibrage) ni de nouveau moteur de jeu **sans demande explicite** d'Oni.
- **Vérification obligatoire avant livraison** : `npm test` (règles) et `npm run e2e` (partie complète en vrais clics dans Chromium), sur ordinateur et à 400 px de large.
- Honnêteté plutôt que diplomatie ; information sourcée.

## Arborescence

```
src/engine.js      Moteur de règles pur (aucun accès au DOM), module `SF`, utilisable dans le navigateur et sous Node
src/ui.js          Interface : rendu par innerHTML, tous les clics délégués sur [data-a], fonction handle(a, d)
src/style.css      Styles (thèmes clair/sombre, plateau 9 × 9 en CSS grid)
tools/icons.py     Pictos SVG (viewBox 24, trait = currentColor), partagés avec les planches d'impression
tools/build.py     Assemble dist/siege-fusee-jeu.html (une seule page autonome)
dist/              Page construite — à régénérer avec `npm run build`, ne pas éditer à la main
tests/rules.test.js  Tests ciblés des règles (scénarios précis, pas de simulation)
tests/e2e-partie.js  Partie complète jouée par clics souris réels (Playwright), vérifie erreurs JS et boutons recouverts
docs/regles-v0.3.md  Export du livret de règles (instantané du 30/10/2026)
```

Le livret de référence est un document Claude d'Oni ; `docs/regles-v0.3.md` en est un export qui peut prendre du retard. En cas de doute sur une règle, demande à Oni.

## Architecture actuelle

- **État** : un seul objet `S`, entièrement sérialisable en JSON (sauvegardé dans `localStorage`, clé `siege-fusee-v03`). Créé par `SF.newGame()`.
- **Moteur** (`SF`) : fonctions pures qui modifient `S` et renvoient `true/false` selon que l'action est légale. Principales actions :
  - Essaim : `attackerDraw`, `deploy`, `endDeploy`, `invest` (amélioration payée en plusieurs fois), `raid`, `startAttacks`, `act` (une créature se déplace puis attaque), `endAttackerTurn`.
  - Colonie : `useSpell`, `startChantier(S, i, lane)`, `cancelChantier`, `fire`, `autoFire`, `endDefenderTurn` → phase `D_place` → `placeTile(S, key)`.
  - Hasard : `Math.random` par défaut, remplaçable par `SF.setRng(f)` (utile pour un serveur ou des tests reproductibles).
- **Phases** (`S.phase`) et camp qui agit (table `PHASE_TXT` dans `ui.js`) : `A_famine` (colonie), `A_start`, `A_deploy`, `A_upgrade` (essaim), `A_react` (colonie), `A_attack` (essaim), `D_main`, `D_fire`, `D_place` (colonie).
- ⚠ **Une partie de la logique de phase vit dans `ui.js`** : l'ouverture des fenêtres de réaction `A_famine` / `A_react` (vers les lignes `S.phase = "A_react"` et `S.phase = "A_famine"` de `handle`). Pour le jeu en ligne, il faut la déplacer côté serveur/moteur.
- **Hot-seat** : écran de passage (`S.handoff`) entre les camps ; `S.view` = camp qui regarde l'écran. Les mains et les tuiles camouflées de l'autre camp sont masquées **à l'affichage seulement** — l'état complet est dans le navigateur.

## Cahier des charges du jeu en ligne

Objectif : deux joueurs sur deux appareils ; l'un crée une partie et obtient un **code** (5 caractères, sans caractères ambigus), l'autre le saisit pour rejoindre ; choix du camp (essaim / colonie).

Contrainte principale : **le jeu a des informations cachées**. Synchroniser l'état complet entre navigateurs permettrait de tricher (outils de développement). Il faut donc :

1. **Serveur qui fait autorité** : il détient `S` et exécute `src/engine.js` tel quel (le moteur tourne sous Node).
2. **Les clients envoient des actions** (`{type, args}` correspondant aux fonctions du moteur) ; le serveur vérifie que l'action vient du camp dont c'est le tour (selon la phase), l'applique, puis diffuse.
3. **Chaque joueur reçoit une vue filtrée** de `S` :
   - à l'essaim, ne jamais envoyer : `hand` (tuiles de la colonie), `spells` (sortilèges), le nom/les PV/les capacités des tuiles camouflées non révélées (`tile.camo && !tile.revealed`, sauf Clairvoyance — voir `clairvoyance(S)`), le nom des tuiles camouflées en chantier (`chantiers`) et à poser (`toPlace`) ;
   - à la colonie, ne jamais envoyer : `handA` (main de l'essaim) ;
   - à personne : l'ordre des pioches (`piles`, `tileDeck`, `spellDeck`, défausses) — envoyer seulement les nombres ;
   - le journal (`S.log`) est commun : il évite déjà de nommer les tuiles camouflées (`pubName`) — à garder ainsi.
4. **Fenêtres de réaction** : `A_famine` / `A_react` ne s'ouvrent que si la colonie tient le bon sortilège. **Validé par Oni (30/10/2026) : on garde ce comportement en ligne** (l'essaim ne voit pas quelle carte la colonie tient).
5. **Reconnexion** : jeton par joueur conservé dans le navigateur ; une partie survit à un rechargement de page.
6. **Garder le mode local (hot-seat)** fonctionnel.
7. L'état d'interface (`UI.sel`, carte choisie, etc.) reste local au client.

Hébergement suggéré (à confirmer avec Oni) : un petit serveur Node + WebSocket qui sert aussi la page (Render, Railway, Fly.io…). GitHub Pages seul ne suffit pas (pas de serveur).

## Points de règles ouverts (ne pas trancher sans Oni)

Marqués † dans le livret, ou repérés pendant la conception :

- **Livret ↔ jeu (décidé par Oni le 30/10/2026 : le jeu fait foi)** : améliorations payables en plusieurs fois (`invest`) et Brouillage joué dans la fenêtre de réaction, sur une créature déployée ce tour. `docs/regles-v0.3.md` est corrigé ; le livret de référence (document Claude d'Oni) reste à reporter.
- Colosse 3 ATQ / 7 PV (Oni avait écrit 7/3) ; coûts des aggros et tanks (3 / 4 / 7) ; nombre d'exemplaires des soutiens.
- Nom « Déploiement » utilisé à la fois pour une amélioration aggro et pour une étape du tour.
- Cadence (+2 points) fait désormais exactement la même chose qu'Effort.
- Aura Griffes : non cumulable avec elle-même, cumulable avec l'Aura Fureur (interprétation).
- Murs de départ posés face visible (non camouflés).
- Percée qui atteint la fusée : 1 seul travailleur (interprétation).
- Bâtiment achevé sans case valable : retour en main (interprétation).
- Vision (Œil-sonde) révèle les tuiles camouflées de sa lane **au moment du déploiement** seulement.
- Les compteurs de technologies et de travailleurs de la colonie sont publics.
- Un cas « l'escalier n'a pas fonctionné (créature bloquée sans raison) » a été signalé une fois, non reproduit : les 20 chemins sont vérifiés ; le journal trace maintenant chaque déplacement (« X (lane N) : A3 → B2, devant C2 »).

## Commandes

```
npm install          # installe Playwright (tests e2e)
npx playwright install chromium
npm run build        # python3 tools/build.py → dist/siege-fusee-jeu.html
npm test             # tests de règles (Node)
npm run e2e          # partie complète, 1400 px
npm run e2e:mobile   # partie complète, 400 px
```
