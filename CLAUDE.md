# Swarm & Steel — prototype (dépôt SWARM), version du jeu dans `SF.VERSION`

Ancien nom : « Siège & Fusée » (renommé le 30/10/2026 à la demande d'Oni). Le module du moteur s'appelle toujours `SF` dans le code.

Jeu de société asymétrique pour 2 joueurs, conçu par Oni (game designer, francophone). Ce dépôt contient le **prototype jouable en HTML/JS** (2 joueurs sur le même appareil, ou **en ligne** sur deux appareils avec un code pour rejoindre) et l'export du livret de règles.

Tout le contenu du jeu, les messages et la documentation sont **en français**. Réponds à Oni en français.

## Règles de travail (demandées par Oni — à respecter)

- **Co-pilote prudent.** Aucune modification de gameplay (valeurs, règles, capacités) sans validation préalable d'Oni. Une tâche technique (réseau, lobby, refactor) ne doit **pas** changer le comportement des règles.
- **Remonter les décisions** plutôt que les trancher seul ; poser des questions quand une demande est imprécise.
- **Signaler les incohérences** (entre le moteur, l'interface et le livret) au lieu de les corriger en silence.
- **Pas de simulation** (parties automatiques en masse, études d'équilibrage) ni de nouveau moteur de jeu **sans demande explicite** d'Oni.
- **Vérification obligatoire avant livraison** : `npm test` (règles) et **une seule** partie complète par robot (`npm run e2e`, en vrais clics dans Chromium) — demandé par Oni le 07/11/2026 : ne pas lancer plusieurs parties complètes (ordinateur, 400 px, en ligne) à chaque fois ; choisir celle qui couvre le changement (400 px pour l'interface mobile, `e2e:en-ligne` pour le réseau ou les vues filtrées) et vérifier le reste par des captures ciblées.
- **Versions (depuis le 02/11/2026, demandé par Oni pour les tests d'équilibrage)** : chaque mise à jour livrée (déployée) augmente `SF.VERSION` de 1 au dernier chiffre (0.4.0 → 0.4.1…) et ajoute son entrée dans `docs/versions.md` (un test le vérifie). Les statistiques sont regroupées par version.
- Honnêteté plutôt que diplomatie ; information sourcée.

## Arborescence

```
src/engine.js      Moteur de règles pur (aucun accès au DOM), module `SF`, utilisable dans le navigateur et sous Node
src/bilan.js       Bilan de fin de partie (résumé chiffré, mini-plan SVG, agrégats par version), sans DOM : page et serveur
src/ui.js          Interface : rendu par innerHTML, tous les clics délégués sur [data-a], fonction handle(a, d) ; page Statistiques (MODE "stats")
src/style.css      Styles (thèmes clair/sombre, plateau 9 × 9 en CSS grid)
tools/icons.py     Pictos SVG (viewBox 24, trait = currentColor), partagés avec les planches d'impression
tools/build.py     Assemble dist/swarm-steel-jeu.html (une seule page autonome), illustrations comprises (classes CSS .im-…, table IMG_CLASS)
tools/miniatures.py  images/*.jpg (illustrations d'Oni, 2048 px) → assets/miniatures/*.webp (200 px) + table.json ; à relancer quand une image change
images/            Illustrations d'Oni (originaux, non servis tels quels)
dist/              Page construite — à régénérer avec `npm run build`, ne pas éditer à la main
tests/rules.test.js  Tests ciblés des règles (scénarios précis, pas de simulation)
tests/e2e-partie.js  Partie complète jouée par clics souris réels (Playwright), vérifie erreurs JS et boutons recouverts
tests/serveur.test.js  Tests du serveur en ligne (lobby, jetons, droits, vues filtrées)
tests/e2e-en-ligne.js  Partie en ligne complète entre deux navigateurs + contrôle des fuites d'information + rechargement
server/core.js     Serveur du jeu en ligne (lobby, codes, jetons, actions) — stockage fourni par l'appelant
server/dev.js      Serveur local (page + /api, parties en mémoire) : `npm run serveur`
netlify/functions/api.mjs  Le même serveur sur Netlify, état des parties dans Netlify Blobs (store « parties »)
netlify.toml       Build Netlify : `python3 tools/build.py --site` → site/index.html (dossier ignoré par git, recréé à chaque déploiement)
docs/regles-v0.3.md  Export du livret de règles, source du PDF
docs/versions.md   Journal des versions (une entrée par version livrée)
docs/swarm-steel-livret-v0.3.pdf  Livret en PDF, régénéré par `npm run livret` (tools/livret.py → docs/livret.html → tools/livret-pdf.js)
```

Le livret de référence est un document Claude d'Oni ; `docs/regles-v0.3.md` en est un export qui peut prendre du retard. En cas de doute sur une règle, demande à Oni.

## Architecture actuelle

- **État** : un seul objet `S`, entièrement sérialisable en JSON (sauvegardé dans `localStorage`, clé `swarm-steel-v03`). Créé par `SF.newGame()`.
- **Point d'entrée des actions** : `SF.apply(S, camp, type, args)` vérifie le camp (`SF.actor(S)`), la phase et les paramètres, puis appelle les fonctions de règles ; renvoie `""` ou la raison du refus. Table `SF.ACTIONS`. L'interface locale **et** le serveur passent par là. `SF.viewFor(S, camp)` produit la vue filtrée envoyée à un joueur.
- **Moteur** (`SF`) : fonctions pures qui modifient `S` et renvoient `true/false` selon que l'action est légale. Principales actions :
  - Essaim : `attackerDraw`, `deploy`, `endDeploy`, `invest` (amélioration payée en plusieurs fois), `startAttacks`, `actCase` (un bloc avance d'une case puis ses créatures attaquent si elles sont au contact), `endAttackerTurn`.
  - Colonie : `useSpell`, `startChantier(S, i, lane)`, `cancelChantier`, `endDefenderTurn` (construction) → phase `D_place` → `placeTile(S, key)` → fusée, supports → phase `D_fire` : `fire`, `autoFire` → `endColonyTurn`.
  - Hasard : `Math.random` par défaut, remplaçable par `SF.setRng(f)` (utile pour un serveur ou des tests reproductibles).
- **Phases** (`S.phase`) et camp qui agit (table `PHASE_TXT` dans `ui.js`) : `A_famine` (colonie), `A_start`, `A_deploy`, `A_upgrade` (essaim), `A_react` (colonie), `A_attack` (essaim), `D_main`, `D_fire`, `D_place` (colonie).
- Les transitions de phase qui vivaient dans `ui.js` (fenêtres `A_famine` / `A_react`, passage aux tirs, répartition des travailleurs) sont maintenant dans `SF.ACTIONS` (moteur).
- **Animations (lot 1, validé par Oni : style sobre, rapide)** : le moteur décrit ce qui se passe dans `S.fx` (déplacement, attaque de tuile, dégâts, mort, tuile ou support détruit, fusée touchée, tir de tourelle, déploiement) — seulement quand l'appelant crée `S.fx = []` avant l'action, et sans effet sur les règles. L'interface rejoue ces événements par-dessus le plateau encore à l'ancien état (calque `#fx`), puis affiche l'état final ; un toucher termine l'animation ; bouton « Animations : oui/non » (désactivées par défaut si le système demande moins d'animations). En ligne, le serveur garde les 400 derniers événements (`room.fx`) et renvoie à chaque joueur ceux qu'il n'a pas vus (paramètre `f`), filtrés par `SF.fxFor` (PV d'une tuile camouflée encore cachée non transmis à l'essaim). Bandeau « À vous de jouer » en ligne. Pas de son pour l'instant. **Lot 2 fait** : sortilèges (bandeau « Sortilège : … » + effet sobre par sort), soins, tuile camouflée retournée / piège, chantier lancé, saboté, avancé, bâtiment posé, créatures qui reculent, support apparu, points vers la fusée. **Lot 3 fait** : étage de fusée allumé (+ bandeau aux paliers 3 / 6 / 9), Nuke (flash du plateau), décollage, investissement (barre) et amélioration acquise, auras d'attaque (Fureur, Griffes, Frénésie, Percée) et soins de fin de tour, Vision (balayage + tuiles retournées), Raid, Réincarnation, pioche de l'essaim, écran de victoire. Non animé : la pioche de la colonie (elle la découvre au tour suivant).
- **Mise en page (v0.4.5, Oni)** : le camp qui regarde (`S.view`) a son panneau complet (au moins 330 px) et le journal ; l'adversaire n'a qu'un résumé compact de 196 px. `colonySummary` affiche la fusée en colonne avec l'effet des étages (`floorTip`), les chiffres clés et les ateliers ; `swarmSummary` affiche les chiffres clés et les améliorations en icônes (`NODE_ICON`). Info-bulles CSS sur `[data-tip]` (survol, ou focus au toucher). Fond du plateau : « Champ de bataille » ; case centrale : « Fusée ».
- **Thème (v0.4.6, Oni)** : sombre par défaut (charbon, braises, rouille, assorti aux illustrations), clair, ou auto ; `data-theme` sur `<html>` (+ classe `sys-dark` pour « auto »), posé avant l'affichage par un petit script dans `<head>` (build.py) ; bouton « Thème », mémorisé dans `localStorage` (`swarm-steel-theme`).
- **Confort (v0.4.7, Oni)** :
  - `SF.apply` appelle `autoAdvance` : l'étape A_attack se termine seule quand toutes les cases ont agi (plus de bouton endA ; l'action existe encore) ; D_fire se termine seule quand aucune tourelle ne peut plus tirer (`canStillFire`).
  - `startCh` assigne d'office les travailleurs nécessaires aux chantiers de la lane, dans la limite des libres.
  - Une créature à portée de la tourelle choisie est cliquable (`.tok.tgt`, action `fireAt`).
  - Cartes de tuiles : `.art` (illustration) et `.cap` (capacité, texte en `data-tip`).
- **Aide (v0.4.11, Oni)** : `src/aide.js` (module `AIDE`, inclus par build.py après bilan.js).
  - `AIDE.rules(onglet, h)` : fiches Essaim / Colonie / Commun, chiffres et tableaux lus dans `SF`. Fenêtre « Règles » : `UI.helpTab`.
  - `AIDE.nextTip(S, camp, vus)` : conseils du mode découverte (`TIPS` : id, camp, condition, texte). `DISC` et `SEEN` sont gardés dans `localStorage` (`swarm-steel-decouverte`, `swarm-steel-vus`) ; la fiche est rendue par `tipCard()`.
  - Parties marquées `decouverte` (`S.decouverte` en local, `room.decouverte` en ligne via `disc` à la création ou à l'arrivée), visibles dans les statistiques.
- **Mise en page PC (v0.4.14, Oni)** : écran ≥ 1100 × 620 px → `body.pc` et `pcLayout()` (ui.js) ; en dessous, l'ancienne mise en page (`layout()`) inchangée. Colonie toujours à gauche (`pcColonyOwn` / `pcColonySum`), essaim à droite (`pcSwarmOwn` / `pcSwarmSum`), plateau `pcCenter()` (manche et tour dans les angles vides du haut, boutons `pcButtons()` dans l'angle du bas côté joueur). `phaseParts(sh)` fournit consignes et boutons (textes courts si `sh`). Menu escamotable (`.pc-hot`), info-bulles flottantes `#tipbox` (au lieu des bulles CSS), fiche de créature `.cpop` (`UI.pop`), écran de passage `pcHandoff()` (fond en vue publique). Jetons : `auraOf(c)` (icône d'aura donnée / reçue).
- **Accueil (v0.4.21, Oni)** : `home()` (classe `.home2`, `body.on-home`) ; emblème `assets/logos/jeu.png` et titre `assets/logos/titre.png` en masques CSS (`--logo-jeu`, `--logo-titre`, build.py). Le titre est rendu en image par `tools/titre.py` avec la police Ethnocentric (licence Typodermic Desktop : image fixe autorisée, police web interdite — le fichier .otf n'est pas dans le dépôt). Logos : `tools/logos.js`.
- **Musique (v0.5.1, Oni)** : `assets/audio/musique.mp3` (trop lourde pour être intégrée à la page) ; build.py remplace `__MUSIC__` par `../assets/audio/musique.mp3` (dist) ou `musique.mp3` (copiée dans site/) ; server/dev.js la sert aussi. Module `MUSIC` (ui.js) : boucle, `swarm-steel-musique` = {on, vol} dans localStorage, démarrage au premier geste si le navigateur bloque l'autoplay ; `musicCtl()` dans `header()` et en bas à gauche de l'accueil (`.h2-music`).
- **Colonie (v0.5.2, Oni)** : catégories de tuiles `SF.tileCat` (renfort / actif / piège : pièges = `trap` ou `siphon`, actifs = face visible, renforts = camouflés, Épines comprises) ; pioches `S.tileDecks` / `S.tileDiscards` par catégorie (remplacent `tileDeck` / `tileDiscard`, convertis par `migrate`). Phase `D_draw` au début du tour de la colonie (`startDefenderTurn`) : action `tdraw {cat}` (une tuile), passe à `D_main` quand la main est pleine (`needDraw`). Main vide à la mise en place. Mines (`trap` = dégâts) et Siphons (`siphon`) mineur / majeur / supérieur ; `MIN_BIOMASS` = 5. Bouclier : `tile.shield` (jeton), dans `hitTile` comme la stase puis remis à 0 ; Abri blindé. Piège et Siphon d'origine renommés par `migrate` (`OLD_TILE`).
- **IA solo (v0.5.4, Oni)** : `src/ia.js` (module `IA`, sans DOM, inclus par build.py avant ui.js ; aussi sous Node). `IA.decide(S, camp)` → `{type, args}` pour `SF.apply` ; `IA.belief` = `SF.viewFor` + estimations (tuile camouflée inconnue = Palissade, main et sortilèges adverses vides) ; `IA.score` (note de la position, positive pour l'essaim) ; évaluation coup par coup (`best` : chaque candidat sur une copie, fin de tour par défaut `finishSwarm` / `finishColony` + `swarmThreat`) ; `IA.fallback` si un coup est refusé. Interface : `S.ia` = camp de l'IA, `newGame(solo)`, `iaTick()` après chaque rendu (une action à la fois), `play` bloqué pendant le tour de l'IA, pas d'écran de passage. Stats : champ `ia`, filtre `STATS.ia`. e2e : `node tests/e2e-partie.js 1400 colonie` (le robot joue la colonie contre l'IA).
- **v0.5.5 (Oni, 08/11)** : `syncBonus` (moteur, appelé par `killCheck` et `apply`) : quand `bonusHp` baisse, seul le maximum baisse (`c.lastB` = bonus au dernier passage). Spores : `sporeBurst(S, c, x, y)` sur les 8 cases autour de la cible, fusée comprise (−1 travailleur), aussi quand la fusée est attaquée (`hitRocket`).
- **v0.5.6 (Oni, 08/11)** : Furtivité donnée aux aggros par Férocité (aggro A1) : `isStealthy`.
- **v0.5.7 (Oni, 08/11)** : Siphon = niveau × (1 + biomasse ÷ 10) (`siphonLoss`) ; Hurleur +1 ATQ +1 PV (Fureur) ; Griffes = Aura Mobilité 1 aussi (`speedOf`) ; Déploiement : action `teleport {id, lane, u}` (une aggro, une fois par tour, `S.tpUsed`) ; pioche de l'essaim carte par carte, action `pickOne {l}` (`S.pickTotal`, `finishPick`) ; interface : `tpPick` / `tpAt`, jetons ciblables par les sortilèges (`spellCreatures`), bouton unique « Tirer et finir le tour » ; textes des améliorations raccourcis.
- **v0.5.8 (Oni, 08/11) : construction immédiate**, plus d'ateliers : action `buildAt {i, k}` (`SF.buildAt`, `canBuildAt`, `buildTargets`, `putTile`) ; points du tour fixés au début (`S.turnPts`, `S.spent`, `pointsLeft`) ; un bâtiment par lane et par tour (`S.built`, `chPerLane`) ; `build` = fin de la construction (reste → fusée, `endDefenderTurn`). Les chantiers / `alloc` / `D_place` restent dans le moteur pour les anciennes parties et les tests ciblés. Interface : tuile choisie → cases `buildAt` surlignées ; `ateliersHtml` = bâtiments construits ce tour.
- **v0.5.9 (Oni, 08/11) : blocs** — `moveBlock` / `blockSteps` (moteur) : les créatures d'une case qui peuvent avancer bougent ensemble (`moveCreature` déplace tout le bloc, vitesses de la case fixées avant le départ), de la vitesse du plus lent ; les plus rapides finissent ensuite ; `autoCreature` avance en plusieurs fois.
- **v0.5.10 (Oni, 09/11)** : Frappe orbitale 5, Salve 3, Mines 1/3/5, sort « Double bouclier » (2 tuiles, `shield`), Blindage −1 tourelle (`fire`) ; soutien qui reste avec une créature immobile (`autoCreature`) ; Bouclier sur Palissade (1 PV), Égide (sans Renforcé), Archives et Observatoire (2 PV) ; Épines malgré le Bouclier ; Corrosion (soutien B2) remplace Frénésie (`corr` dans `hitTile` ; `frenzyCount` = 0, action `frenzy` refusée). Écran de passage aussi en ligne (`NET.ho` dans `receive`). Animation : `reveal` porte nom / PV, `tileDown` laisse la tuile à 0 PV 1,8 s (`FX.shown`). Stats : `S.builtCount` → `bats` (résumé), `balanceTables()` (taux de victoire par amélioration et par bâtiment).
- **v0.5.11 (Oni, 09/11)** : sortilèges à 1 exemplaire, Cadence retirée (`migrate` → Effort) ; pioche de sortilège en phase `D_spell` (`endColonyTurn` → `offerSpell` / action `spellPick {i}` → `finishColonyTurn`, `S.spellOffer` caché à l'essaim) ; Renouvellement +1 point ; Reconversion : `S.relocate` + action `relocate {k}` (`relocateTargets`), rien d'autre tant qu'elle n'est pas reposée.
- **Hot-seat** : écran de passage (`S.handoff`) entre les camps ; `S.view` = camp qui regarde l'écran. Les mains et les tuiles camouflées de l'autre camp sont masquées **à l'affichage seulement** — l'état complet est dans le navigateur.

## Versions et statistiques (v0.4.0, 02/11/2026)

- `SF.VERSION` ; chaque partie note sa version de départ (`S.version`, « 0.3 » pour les parties plus anciennes via `migrate`) et compte les travailleurs tués (`S.killed`).
- **Page périmée** : chaque requête de jeu envoie `cv` (version de la page) ; le serveur répond 409 `{reload: true}` si elle diffère (ou manque : pages d'avant la v0.4) → bandeau « Nouvelle version… Recharger ». Hors partie en ligne, la page interroge `/api/version` au chargement puis toutes les 5 min. (Cause du « déploiement refusé à l'Ouest » signalé par Oni le 02/11 : page ouverte avant une mise à jour des paliers.)
- **Enregistrement** : partie en ligne terminée → le serveur enregistre `BILAN.summary` + `BILAN.miniMap` (une fois, `room.recorded`) ; partie locale terminée → la page envoie `POST /api/resultat` (seulement si servie en http(s) ; `S.recorded`, nouvel essai au chargement). Stockage : `store.results` (mémoire en local, store Netlify Blobs « resultats » : `index` + `p/<id>`).
- **Consultation** : `GET /api/stats` (résumés), `GET /api/resultat?id=` (avec le SVG, affiché en `<img>` pour qu'un SVG envoyé par une page ne puisse rien exécuter) ; page Statistiques (accueil ou `?stats`) : tableau par version, dernières parties, plateau final, export CSV.
- **Parties de test** : `window.SF_TEST` ou `?test` (gardé en sessionStorage) → marquées `test`, masquées par défaut. Les robots e2e en ligne le posent.

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
- **Épines** (01/11) : de base 1 pour les Barbelés, Baraquement, Ligne de front, Réduit ; 2 pour Haie d'épines, Mur hérissé, Ronceraie ; 0 sinon. Bonus cumulable (`SF.epinesOf`) : +1 par Avant-poste (les supports de niveau 2 ne donnent plus d'Épines depuis le 04/11) dans les 8 cases autour (« Aura d'épines », `aura: 1`). Les Avant-postes sont posés **face visible** (Oni, 01/11 ; les Avant-postes déjà posés cachés sont retournés par `SF.migrate`). `epinesOf(S, k, true)` (affichage côté essaim) n'a plus d'effet tant qu'aucune tuile à aura n'est camouflée.
- **Renforcé X** remplace le Bouclier (02/11, Oni : « c'est le même effet ») : Égide et Dortoir sont Renforcé 2 ; `migrate` convertit `shield` en `ren`.
- **Forteresses** (01/11) : **Égide** (2 tours, 2 PV depuis le 04/11, Renforcé 2, camouflée, 3 ex.), **Archives** (2 tours, 3 PV, +1 technologie, face visible, 3 ex.), **Ronceraie** (3 tours, 2 PV, Renforcé 2, Épines 2, camouflée, 3 ex.), **Dortoir** revu (3 tours, 3 PV, Bouclier 2, +1 travailleur **temporaire**, 3 ex. ; avant 1 PV, travailleur permanent). Pioche : 54 forteresses (02/11 : Laboratoire et Observatoire à 3 ex., soit 3 ex. de chaque bâtiment à technologies ; Palissade et Muraille à 3 ex. au lieu de 6).
- **Siphon** (02/11) : piège camouflé, 2 tours, 2 PV, 3 ex. ; révélé par une attaque (pas par Vision ou Clairvoyance), l'essaim perd 3 biomasse, sans jamais descendre sous 3 (`SF.MIN_BIOMASS`).
- **Feu nourri** (02/11) : sort de soutien, 2 ex. (pioche de 28 sorts) : ce tour, chaque tourelle tire 2 fois (`S.doubleFire`, `SF.shotsLeft`). **Support de niveau 3** : +2 travailleurs (`SF.SUP3_WORKERS` ; +3 le 06/11 en journée puis retour à +2 le soir ; +3 du 02/11 au 04/11). Plus aucun travailleur permanent par bâtiment.
- **Piège** : 3 dégâts (`SF.TRAP_DMG`, avant 2), infligés **avant** que la créature frappe : si elle en meurt, elle n'inflige ni dégâts ni ne subit d'Épines (Oni, 01/11) ; un piège déjà vu (Vision, Clairvoyance) ne se déclenche plus.
- **Percée** (01/11) : les dégâts en trop ne passent qu'à la case **suivante** du chemin (bâtiment → il les subit ; fusée → −1 travailleur ; case vide → perdus) ; pas d'enchaînement (seulement depuis l'attaque principale). **Une tuile encore camouflée** (non retournée) ne subit ni la percée ni les spores et reste cachée (piège / Siphon non déclenchés) — Oni, 02/11 ; la Vision et la Clairvoyance la rendent vulnérable (Oni, 02/11).
- **Fusée** : coût d'un étage 2 points (étages 1-3), 4 (4-6), 6 (7-9), 8 (10-12) — `SF.floorCost(S)` (04/11 ; avant 2 / 3 / 4 / 5, à l'origine 3 / 4 / 5 / 6). Les points en trop passent à l'étage suivant.
- **Sortilèges** (01/11) : un sortilège non joué reste en main tant qu'il n'est pas joué, offensif comme de soutien, sans limite (avant : défaussé à la fin de sa fenêtre).
- **Créatures** (01/11) : aggros à 1 PV à tous les niveaux ; tanks à 1 ATQ à tous les niveaux. Carapace épaisse +1 PV, Blindage +2 PV (avant +2 / +4). **Phéromone** : Aura Leurre supprimée, remplacée par l'**Aura Butin** : quand une autre créature de sa case détruit un bâtiment (attaque, percée, spores), +1 biomasse en plus ; non cumulable (`destroyTile(S, k, why, by)`). **Sapeur** (01/11) : à son déploiement, détruit un bâtiment au choix de sa lane (`deploy(..., target)`, cible obligatoire si la lane a des bâtiments ; +1 biomasse ; avant : détruisait un chantier). Le journal ne nomme jamais une tuile camouflée détruite sans avoir été révélée. **Catalyseur** (02/11) : Aura Instinct supprimée (plus d'actions `instinct` / `instTarget`), remplacée par l'**Aura Cuirasse** : les créatures de sa case ne subissent pas les Épines (les pièges blessent toujours). La Furtivité ne vient plus que de Mue.
- **Bug corrigé** (01/11) : `SF.migrate` remettait les tuiles de départ à Épines 2 (celles de la Haie d'épines de la pioche) après un rechargement ; elles reviennent à 1.
- **Départ de l'essaim** (04/11) : **5 biomasse** ; premier tour (`S.startHand`, consommé par `attackerDraw`) : Écorcheur, Carapace et un soutien de niveau 1 au hasard, pris dans la pioche de niveau 1, payés normalement, **à la place** de la pioche. Le helper de tests `fresh()` supprime `startHand`.
- **Œil-sonde** (04/11, définitif) : Vision permanente — tant qu'il est en vie, les tuiles camouflées de sa lane sont révélées, y compris celles posées ensuite (`visionSweep`, appelé à chaque pose) ; une tuile révélée le reste.
- **Clairvoyance** (04/11, v0.4.12) : à l'acquisition, les Œil-sonde de la pioche sortent du jeu ; ceux en main ou en jeu restent mais ne reviennent plus dans la pioche (`toPile` / `retired`).
- **Équilibrage du 05/11 (v0.4.13)** : Glaneur Aura Soin 2 (`soinValue`) ; Mue = Aura Mobilité 1 + Aura +1 PV pour tous les soutiens, plus de Furtivité (`speedOf` compte les soutiens de la case avec la Mue) ; Mobilité donne aussi la Furtivité aux aggros (`isStealthy`).
- **Champ de stase** (04/11) : un seul bâtiment (`S.stase` = clés de tuiles) : aucun dégât ce tour, ses Épines suspendues. **Brouillage** (04/11) : n'importe quelle créature (via `resolveTarget`) ; `acted` + `jammed` : elle ne bouge ni n'attaque ce tour.
- **Améliorations de l'essaim** : rang 1 = 6 biomasse, rang 2 = 12 (avant 8 / 16).
- **Main de tuiles de la colonie** : 4, +1 à chaque palier de la fusée (étages 3, 6, 9) → 4 / 5 / 6 / 7 (`SF.handSize`). Le palier 6 donne toujours +1 chantier par lane mais ne double plus la main (avant : 8).
- **Biomasse** : 1 par tuile détruite ou support tombé (règle d'origine ; du 30/10 au 01/11, une tuile rapportait sa durée de construction).
- **Paliers de l'essaim** (02/11) : 4 paliers — départ (plafond 2, pioche 3·0·0), 9 (plafond 3, 3·2·0), 15 (plafond 4, 4·2·1), 21 (plafond 5, 4·3·3).
- **Auras** (02/11, Oni) : une aura ne profite qu'aux **autres** créatures de sa case, et **toutes se cumulent** (`countMates`) : Fureur, Griffes, Butin, Spores (2 dégâts par Sporeur, en une attaque), Frénésie (×2 par soutien qui choisit la créature : action `frenzy {src, target}`, `S.frenzy`, par défaut la plus forte ; `frenzyOf` / `frenzyCount`), Soin (Glaneur 1 + Régénération 2 par soutien), Mobilité du Glaneur, +1 PV de la Mue. **Glaneur** : + Aura Mobilité 1 (+1 case aux autres ; lui-même vitesse de base 2 ; `speedOf`, vitesses fixées au début de l'action de la case, les plus rapides partent devant). **Mue** (soutien A1) : Furtivité + Aura +1 PV (dans `bonusHp`), plus de +1 PV propre. **Provocation** = ancienne Protection (tank B1) ; les tanks ne subissent plus les Épines (02/11). Avant : départ 3 puis 6 / 9 / 12 / 15, plafonds 1 à 5 (à l'origine 4 / 7 / 10 / 13).
- **Blocs** : toutes les créatures d'une case avancent ensemble (`SF.actCase`, action `act` avec `{key, order}`). Dans une lane, les cases les plus proches de la fusée (chemin le plus court, `pathLen`) agissent d'abord (`SF.readyCases`) ; l'essaim choisit l'ordre d'attaque ; si la tuile tombe **et qu'il reste une créature qui doit frapper**, la case avance (dans la limite de ses déplacements du tour) juste avant son attaque (un bloc n'avance jamais après la dernière attaque — Oni, 01/11/2026) ; un bloc qui arrive sur une case occupée fusionne avec elle. `SF.act` (une seule créature) ne sert plus qu'aux tests ciblés.
- **Déplacements au choix** (04/11, v0.4.8, remplacent les blocs pour le jeu) : chaque créature seule ; action `move {id, u, k}` vers une case de `SF.reachable` (BFS sur les cases voisines de sa lane, entrées comprises, sans bâtiment, coin ni fusée ; `stepsLeft` = `c.spd` fixé au premier pas − `c.moved`) ; action `strike {id, target}` sur une cible de `SF.strikeTargets` (bâtiments orthogonalement voisins, ou "fusee") ; après une attaque `c.acted`. `endA` termine le tour à tout moment ; `autoAdvance` le termine si plus aucune créature ne peut agir (`canAct`). `actAll` = résolution automatique créature par créature (`autoCreature`). `actCase` / `act` (blocs) restent dans le moteur pour les tests ciblés et la compatibilité.
- **v0.5.0 (07/11, Oni)** :
  - Pioche au choix **par pile** (précisé par Oni : on choisit la pile, pas les créatures) : action `pick {n: [n1, n2, n3]}` (`SF.attackerPick`, `SF.pickRule` : total = `SF.tierCards` (somme des quotas du palier), niveaux = piles non vides ; le palier ne limite plus les niveaux, Oni 07/11) ; cartes tirées au hasard dans chaque pile ; total obligatoire (Oni : ni plus ni moins, sauf piles trop vides). L'action `draw` reste pour la main de départ (`startHand`, sans Œil-sonde) et les tests. Interface : `.pick`, `pickAdd` / `pickDel` (data-v = niveau) / `pickGo`.
  - Soutiens parachutés : `deploy(..., k)` et `SF.canDrop`.
  - Déplacement sur le chemin seulement (`SF.pathCells`, de 1 à `stepsLeft`), obligatoire avant d'attaquer si possible. Attaque facultative sur les 4 côtés (`strikeTargets`). `strikesPerTurn` (Carnage = 2), action `rest`. Bouton unique `actAll` « Tout résoudre et finir le tour ».
  - Améliorations : Mobilité +1 déplacement (plus de Furtivité : `isStealthy` toujours faux) ; Mue compte le soutien lui-même ; Provocation −1 dégât des tourelles (`fire`) ; Carapace épaisse = immunité aux Épines ; Réincarnation sur place (`reincQueue` garde `k`) ; Carnage = 2 attaques.
  - Créatures : Colosse et Massacreur 6 ; Catalyseur N1 0/2 ; Hurleur N2 0/4, Fureur +2. `migrate` remet les cartes dans la pioche de leur niveau.
  - Champ de stase : 0 dégât, mais `pierce(dmg)` et spores (`hitTile`).
  - Couleurs des directions : `colorDirs()` (ui.js) entoure Nord / Est / Sud / Ouest de `span.dir-N/E/S/O` après chaque rendu.
- **06/11 au soir (v0.4.19)** : Glaneur sans Aura Mobilité ni vitesse 2 (Aura Soin 2 seulement ; `baseSpeed` = 2 pour le niveau 3 seulement) ; `actAll` fait agir les soutiens d'abord (les créatures de la même case de départ les rejoignent et profitent de leurs auras).
- **Équilibrage et flux du 06/11 (v0.4.17)** : créatures de niveau 3 à 2 cases de base (`SF.baseSpeed`) ; pioche de l'essaim automatique (`autoDraw` dans ui.js : l'interface envoie `draw` dès que l'essaim regarde l'écran en A_start) ; déploiement et améliorations dans la même étape (l'action `endDeploy` enchaîne `toAttacks` ; A_upgrade ne sert plus qu'aux parties enregistrées avant). Interface : arbres d'amélioration en cartes (`treesHtml`, `.ucard`), pastilles d'effet « +1 ATQ » (`FX_LABEL`, `givenLabels`), aucun texte sous 1rem (sauf dans les cases du plateau sur téléphone), cadres de l'écran de passage (`images/pop up tour *.webp`, noms « Passage essaim / colonie »).
- **Déplacement automatique au choix de la créature** (06/11, v0.4.16, remplace les déplacements au choix pour le jeu) : en phase A_attack, toucher une créature qui peut agir envoie l'action `actOne {id}` (moteur : `autoCreature`, chemin `nextStep` vers la fusée, attaque de la case devant) ; `actAll` fait agir toutes les restantes ; `move` / `strike` restent dans le moteur mais l'interface ne s'en sert plus.
- **Déplacement** (02/11, ancien mode automatique) : **une case par tour** (`groupAct`, appelé par `actCase`) ; au contact d'une tuile ou de la fusée (avant ou après le pas), le bloc attaque aussitôt. Si la tuile tombe et qu'il reste des créatures à faire frapper, le bloc entre dans la case libérée **seulement s'il lui reste un déplacement** (choix d'Oni). `SF.act` (une créature, tests ciblés) garde l'ancien déplacement sans limite.
- **Mobilité** (aggro rang 1 ; 02/11) : **2 cases par tour** (`SF.speedOf`) ; dans une case mixte, les aggros mobiles **partent devant** (elles agissent d'abord, en bloc à part, puis le reste de la case). Plus de changement de lane (action `moveLane` supprimée).
- **Essaim agrandi** (aggro rang 2 côté B, ancien « Raid ») : +3 au plafond de population de chaque lane (`SF.capOf`).
- **Famine** (02/11) : ce tour, budget de l'essaim = biomasse ÷ 2 arrondie à l'inférieur (`SF.famineBudget` ; avant −5, à l'origine −2).
- **Renforcé** : 1 PV par tranche complète de X dégâts d'une même attaque, plusieurs PV possibles (02/11 : retour à la règle d'origine après un court essai à 1 PV maximum par attaque).
- **Soutiens** (02/11) : 2 / 4 / 6 PV selon le niveau (avant 2 / 5 / 8).
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
- Barbelés posés face visible (non camouflés).
- Percée qui atteint la fusée : 1 seul travailleur (interprétation).
- Bâtiment achevé sans case valable : retour en main (interprétation).
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
