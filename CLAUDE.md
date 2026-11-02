# Swarm & Steel — prototype v0.3 (dépôt SWARM)

Ancien nom : « Siège & Fusée » (renommé le 30/10/2026 à la demande d'Oni). Le module du moteur s'appelle toujours `SF` dans le code.

Jeu de société asymétrique pour 2 joueurs, conçu par Oni (game designer, francophone). Ce dépôt contient le **prototype jouable en HTML/JS** (2 joueurs sur le même appareil, ou **en ligne** sur deux appareils avec un code pour rejoindre) et l'export du livret de règles.

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
tools/build.py     Assemble dist/swarm-steel-jeu.html (une seule page autonome)
dist/              Page construite — à régénérer avec `npm run build`, ne pas éditer à la main
tests/rules.test.js  Tests ciblés des règles (scénarios précis, pas de simulation)
tests/e2e-partie.js  Partie complète jouée par clics souris réels (Playwright), vérifie erreurs JS et boutons recouverts
tests/serveur.test.js  Tests du serveur en ligne (lobby, jetons, droits, vues filtrées)
tests/e2e-en-ligne.js  Partie en ligne complète entre deux navigateurs + contrôle des fuites d'information + rechargement
server/core.js     Serveur du jeu en ligne (lobby, codes, jetons, actions) — stockage fourni par l'appelant
server/dev.js      Serveur local (page + /api, parties en mémoire) : `npm run serveur`
netlify/functions/api.mjs  Le même serveur sur Netlify, état des parties dans Netlify Blobs (store « parties »)
netlify.toml       Build Netlify : `python3 tools/build.py --site` → site/index.html (dossier ignoré par git, recréé à chaque déploiement)
docs/regles-v0.3.md  Export du livret de règles (à jour au 01/11/2026), source du PDF
docs/swarm-steel-livret-v0.3.pdf  Livret en PDF, régénéré par `npm run livret` (tools/livret.py → docs/livret.html → tools/livret-pdf.js)
```

Le livret de référence est un document Claude d'Oni ; `docs/regles-v0.3.md` en est un export qui peut prendre du retard. En cas de doute sur une règle, demande à Oni.

## Architecture actuelle

- **État** : un seul objet `S`, entièrement sérialisable en JSON (sauvegardé dans `localStorage`, clé `swarm-steel-v03`). Créé par `SF.newGame()`.
- **Point d'entrée des actions** : `SF.apply(S, camp, type, args)` vérifie le camp (`SF.actor(S)`), la phase et les paramètres, puis appelle les fonctions de règles ; renvoie `""` ou la raison du refus. Table `SF.ACTIONS`. L'interface locale **et** le serveur passent par là. `SF.viewFor(S, camp)` produit la vue filtrée envoyée à un joueur.
- **Moteur** (`SF`) : fonctions pures qui modifient `S` et renvoient `true/false` selon que l'action est légale. Principales actions :
  - Essaim : `attackerDraw`, `deploy`, `endDeploy`, `invest` (amélioration payée en plusieurs fois), `moveLane` (Mobilité), `startAttacks`, `actCase` (un bloc avance puis ses créatures attaquent), `endAttackerTurn`.
  - Colonie : `useSpell`, `startChantier(S, i, lane)`, `cancelChantier`, `endDefenderTurn` (construction) → phase `D_place` → `placeTile(S, key)` → fusée, supports → phase `D_fire` : `fire`, `autoFire` → `endColonyTurn`.
  - Hasard : `Math.random` par défaut, remplaçable par `SF.setRng(f)` (utile pour un serveur ou des tests reproductibles).
- **Phases** (`S.phase`) et camp qui agit (table `PHASE_TXT` dans `ui.js`) : `A_famine` (colonie), `A_start`, `A_deploy`, `A_upgrade` (essaim), `A_react` (colonie), `A_attack` (essaim), `D_main`, `D_fire`, `D_place` (colonie).
- Les transitions de phase qui vivaient dans `ui.js` (fenêtres `A_famine` / `A_react`, passage aux tirs, répartition des travailleurs) sont maintenant dans `SF.ACTIONS` (moteur).
- **Animations (lot 1, validé par Oni : style sobre, rapide)** : le moteur décrit ce qui se passe dans `S.fx` (déplacement, attaque de tuile, dégâts, mort, tuile ou support détruit, fusée touchée, tir de tourelle, déploiement) — seulement quand l'appelant crée `S.fx = []` avant l'action, et sans effet sur les règles. L'interface rejoue ces événements par-dessus le plateau encore à l'ancien état (calque `#fx`), puis affiche l'état final ; un toucher termine l'animation ; bouton « Animations : oui/non » (désactivées par défaut si le système demande moins d'animations). En ligne, le serveur garde les 400 derniers événements (`room.fx`) et renvoie à chaque joueur ceux qu'il n'a pas vus (paramètre `f`), filtrés par `SF.fxFor` (PV d'une tuile camouflée encore cachée non transmis à l'essaim). Bandeau « À vous de jouer » en ligne. Pas de son pour l'instant. **Lot 2 fait** : sortilèges (bandeau « Sortilège : … » + effet sobre par sort), soins, tuile camouflée retournée / piège, chantier lancé, saboté, avancé, bâtiment posé, créatures qui reculent, support apparu, points vers la fusée. **Lot 3 fait** : étage de fusée allumé (+ bandeau aux paliers 3 / 6 / 9), Nuke (flash du plateau), décollage, investissement (barre) et amélioration acquise, auras d'attaque (Fureur, Griffes, Frénésie, Percée) et soins de fin de tour, Vision (balayage + tuiles retournées), Raid, Réincarnation, pioche de l'essaim, écran de victoire. Non animé : la pioche de la colonie (elle la découvre au tour suivant).
- **Hot-seat** : écran de passage (`S.handoff`) entre les camps ; `S.view` = camp qui regarde l'écran. Les mains et les tuiles camouflées de l'autre camp sont masquées **à l'affichage seulement** — l'état complet est dans le navigateur.

## Cahier des charges du jeu en ligne

Objectif : deux joueurs sur deux appareils ; l'un crée une partie et obtient un **code** (5 caractères, sans caractères ambigus), l'autre le saisit pour rejoindre ; choix du camp (essaim / colonie).

Contrainte principale : **le jeu a des informations cachées**. Synchroniser l'état complet entre navigateurs permettrait de tricher (outils de développement). Il faut donc :

1. **Serveur qui fait autorité** : il détient `S` et exécute `src/engine.js` tel quel (le moteur tourne sous Node).
2. **Les clients envoient des actions** (`{type, args}` correspondant aux fonctions du moteur) ; le serveur vérifie que l'action vient du camp dont c'est le tour (selon la phase), l'applique, puis diffuse.
3. **Chaque joueur reçoit une vue filtrée** de `S` :
   - à l'essaim, ne jamais envoyer : `hand` (tuiles de la colonie), `spells` (sortilèges), le nom/les PV/les capacités des tuiles camouflées non révélées (`tile.camo && !tile.revealed`, sauf Clairvoyance — voir `clairvoyance(S)`), le nom des tuiles camouflées en chantier (`chantiers`) et à poser (`toPlace`) — les points restants d'un chantier restent visibles (validé par Oni le 30/10/2026) ;
   - à la colonie, ne jamais envoyer : `handA` (main de l'essaim) ;
   - à personne : l'ordre des pioches (`piles`, `tileDeck`, `spellDeck`, défausses) — envoyer seulement les nombres ;
   - le journal (`S.log`) est commun : il évite déjà de nommer les tuiles camouflées (`pubName`) — à garder ainsi.
4. **Fenêtres de réaction** : `A_famine` / `A_react` ne s'ouvrent que si la colonie tient le bon sortilège. **Validé par Oni (30/10/2026) : on garde ce comportement en ligne** (l'essaim ne voit pas quelle carte la colonie tient).
5. **Reconnexion** : jeton par joueur conservé dans le navigateur ; une partie survit à un rechargement de page.
6. **Garder le mode local (hot-seat)** fonctionnel.
7. L'état d'interface (`UI.sel`, carte choisie, etc.) reste local au client.

**Réalisé (30/10/2026), hébergement Netlify choisi par Oni** : pas de WebSocket sur Netlify, donc fonctions + Netlify Blobs + interrogation périodique (toutes les 2 s, seulement quand ce n'est pas le tour du joueur ; écriture conditionnelle sur l'etag contre les collisions). Les parties ne sont jamais supprimées (pas d'expiration pour l'instant).

## Règles modifiées par Oni (30/10 – 01/11/2026)

- **Mise en place** (01/11) : 16 **Barbelés** (nom « Barbelé » depuis le 02/11 ; d'abord « Mur de départ », puis « Haie d'épines » — renommés automatiquement par `SF.migrate` ; `start: true`, 1 PV, Épines 1, face visible, retirées du jeu quand elles sont détruites) sur toutes les cases des couronnes 1 et 2 ; d'où 4 supports de niveau 1 et 4 de niveau 2 dès le départ (`placeSupports` dans `newGame`). Les tests ciblés gardent l'ancienne mise en place (helper `fresh()`).
- **Épines** (01/11) : de base 1 pour les Barbelés, Baraquement, Ligne de front, Réduit ; 2 pour Haie d'épines, Mur hérissé, Ronceraie ; 0 sinon. Bonus cumulables (`SF.epinesOf`) : +1 par support de niveau 2 dans les 8 cases autour (toute tuile, même sans Épines), +1 par Avant-poste dans les 8 cases autour (« Aura d'épines », `aura: 1`). Les Avant-postes sont posés **face visible** (Oni, 01/11 ; les Avant-postes déjà posés cachés sont retournés par `SF.migrate`). `epinesOf(S, k, true)` (affichage côté essaim) n'a plus d'effet tant qu'aucune tuile à aura n'est camouflée.
- **Bouclier X** (`shield`) : chaque attaque contre la tuile inflige X dégâts de moins (attaque, percée, spores). Égide et Dortoir : Bouclier 2.
- **Forteresses** (01/11) : **Égide** (2 tours, 3 PV, Bouclier 2, camouflée, 3 ex.), **Archives** (2 tours, 3 PV, +1 technologie, face visible, 3 ex.), **Ronceraie** (3 tours, 2 PV, Renforcé 2, Épines 2, camouflée, 3 ex.), **Dortoir** revu (3 tours, 3 PV, Bouclier 2, +1 travailleur **temporaire**, 3 ex. ; avant 1 PV, travailleur permanent). Pioche : 53 forteresses (02/11 : Laboratoire et Observatoire à 3 ex., soit 3 ex. de chaque bâtiment à technologies ; Palissade et Muraille à 4 ex. au lieu de 6).
- **Feu nourri** (02/11) : sort de soutien, 2 ex. (pioche de 28 sorts) : ce tour, chaque tourelle tire 2 fois (`S.doubleFire`, `SF.shotsLeft`). **Support de niveau 3** : +3 travailleurs (`SF.SUP3_WORKERS`, avant +2). Plus aucun travailleur permanent par bâtiment.
- **Piège** : 3 dégâts (`SF.TRAP_DMG`, avant 2), infligés **avant** que la créature frappe : si elle en meurt, elle n'inflige ni dégâts ni ne subit d'Épines (Oni, 01/11) ; un piège déjà vu (Vision, Clairvoyance) ne se déclenche plus.
- **Percée** (01/11) : les dégâts en trop ne passent qu'à la case **suivante** du chemin (bâtiment → il les subit ; fusée → −1 travailleur ; case vide → perdus) ; pas d'enchaînement (seulement depuis l'attaque principale).
- **Fusée** : coût d'un étage 2 points (étages 1-3), 3 (4-6), 4 (7-9), 5 (10-12) — `SF.floorCost(S)` (01/11 ; d'abord 3 / 4 / 5 / 6). Les points en trop passent à l'étage suivant.
- **Sortilèges** (01/11) : un sortilège non joué reste en main tant qu'il n'est pas joué, offensif comme de soutien, sans limite (avant : défaussé à la fin de sa fenêtre).
- **Créatures** (01/11) : aggros à 1 PV à tous les niveaux ; tanks à 1 ATQ à tous les niveaux. Carapace épaisse +1 PV, Blindage +2 PV (avant +2 / +4). **Phéromone** : Aura Leurre supprimée, remplacée par l'**Aura Butin** : quand une autre créature de sa case détruit un bâtiment (attaque, percée, spores), +1 biomasse en plus ; non cumulable (`destroyTile(S, k, why, by)`). **Sapeur** (01/11) : à son déploiement, détruit un bâtiment au choix de sa lane (`deploy(..., target)`, cible obligatoire si la lane a des bâtiments ; +1 biomasse ; avant : détruisait un chantier). Le journal ne nomme jamais une tuile camouflée détruite sans avoir été révélée. **Catalyseur** (02/11) : Aura Instinct supprimée (plus d'actions `instinct` / `instTarget`), remplacée par l'**Aura Cuirasse** : les créatures de sa case ne subissent pas les Épines (les pièges blessent toujours). La Furtivité ne vient plus que de Mue.
- **Bug corrigé** (01/11) : `SF.migrate` remettait les tuiles de départ à Épines 2 (celles de la Haie d'épines de la pioche) après un rechargement ; elles reviennent à 1.
- **Améliorations de l'essaim** : rang 1 = 6 biomasse, rang 2 = 12 (avant 8 / 16).
- **Main de tuiles de la colonie** : 4, +1 à chaque palier de la fusée (étages 3, 6, 9) → 4 / 5 / 6 / 7 (`SF.handSize`). Le palier 6 donne toujours +1 chantier par lane mais ne double plus la main (avant : 8).
- **Biomasse** : 1 par tuile détruite ou support tombé (règle d'origine ; du 30/10 au 01/11, une tuile rapportait sa durée de construction).
- **Paliers de l'essaim** : départ 3, puis 6 / 9 / 12 / 15 (à l'origine 4 / 7 / 10 / 13).
- **Blocs** : toutes les créatures d'une case avancent ensemble (`SF.actCase`, action `act` avec `{key, order}`). Dans une lane, les cases les plus proches de la fusée (chemin le plus court, `pathLen`) agissent d'abord (`SF.readyCases`) ; l'essaim choisit l'ordre d'attaque ; si la tuile tombe **et qu'il reste une créature qui doit frapper**, toute la case avance jusqu'à la suivante juste avant son attaque (un bloc n'avance jamais après la dernière attaque — Oni, 01/11/2026) ; un bloc qui arrive sur une case occupée fusionne avec elle. `SF.act` (une seule créature) ne sert plus qu'aux tests ciblés.
- **Mobilité** (aggro rang 1 seulement ; l'Aura Instinct du Catalyseur n'existe plus) : une fois par tour **par créature**, en phase Améliorations, passe à l'entrée (colonne C) d'une lane voisine, plafond respecté (action `moveLane`). Remplace l'ancien « choisit sa cible dans la lane ».
- **Essaim agrandi** (aggro rang 2 côté B, ancien « Raid ») : +3 au plafond de population de chaque lane (`SF.capOf`).
- **Famine** : budget de l'essaim −5 (`SF.FAMINE`, avant −2).
- **Déploiement** (aggro C2) : les 2 cartes gratuites de niveau 1 sont piochées **avant** la pioche normale (avant : après, et la pioche normale pouvait vider le niveau 1 → aucune carte gratuite, bug signalé par Oni) ; message dans le journal.
- **Ordre de fin de tour de la colonie** : action `build` (D_main) → chantiers, pose (D_place, chaque pose fait apparaître les supports), supports, fusée → phase `D_fire` (tirs manuels ou automatiques) → action `endD` → tirs restants, défausse des sorts de soutien, pioches, tour de l'essaim (`SF.endColonyTurn`). Les supports apparus et les paliers atteints pendant le tour comptent pour les tirs. (Avant : tirs d'abord.)
- Les parties enregistrées avant ces changements sont mises à jour à la lecture (`SF.migrate`, côté navigateur et serveur) ; un nœud déjà assez investi pour le nouveau coût est acquis.
- Conséquences signalées, à trancher par Oni : la colonne « Points » du barème des forteresses est à recalculer (Épines 1 gratuite d'origine, nouvelles forteresses sans valeur) ; le barème des créatures (PV + ATQ = 4 / 7 / 10) ne tient plus depuis les aggros à 1 PV et les tanks à 1 ATQ.

## Points de règles ouverts (ne pas trancher sans Oni)

Marqués † dans le livret, ou repérés pendant la conception :

- **Livret ↔ jeu (décidé par Oni : le jeu fait foi)** : `docs/regles-v0.3.md` et le PDF sont à jour au 01/11/2026 ; le livret de référence (document Claude d'Oni) reste à reporter.
- Coûts des aggros et tanks (3 / 4 / 7) ; nombre d'exemplaires des soutiens.
- Nom « Déploiement » utilisé à la fois pour une amélioration aggro et pour une étape du tour.
- Cadence (+2 points) fait désormais exactement la même chose qu'Effort.
- Aura Griffes : non cumulable avec elle-même, cumulable avec l'Aura Fureur (interprétation).
- Barbelés posés face visible (non camouflés).
- Percée qui atteint la fusée : 1 seul travailleur (interprétation).
- Bâtiment achevé sans case valable : retour en main (interprétation).
- Vision (Œil-sonde) révèle les tuiles camouflées de sa lane **au moment du déploiement** seulement.
- Les compteurs de technologies et de travailleurs de la colonie sont publics.
- Un cas « l'escalier n'a pas fonctionné (créature bloquée sans raison) » a été signalé une fois, non reproduit : les 20 chemins sont vérifiés ; le journal trace maintenant chaque déplacement (« X (lane N) : A3 → B2, devant C2 »).

## Commandes

```
npm install          # installe Playwright (tests e2e)
npx playwright install chromium
npm run build        # python3 tools/build.py → dist/swarm-steel-jeu.html
npm test             # tests de règles (Node)
npm run e2e          # partie complète, 1400 px
npm run e2e:mobile   # partie complète, 400 px
npm run e2e:en-ligne         # partie en ligne, 2 navigateurs, 1400 px (aussi :mobile pour 400 px)
npm run serveur      # serveur local http://localhost:8888
```
