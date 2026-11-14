# Swarm & Steel — prototype (dépôt SWARM)

Jeu de société asymétrique 2 joueurs (Essaim contre Colonie) conçu par **Oni**, game designer francophone. Prototype HTML/JS : hot-seat, en ligne (code à 5 caractères) ou solo contre l'IA. Version du jeu : `SF.VERSION` (0.6.1 au 13/11/2026). Le module moteur s'appelle `SF` (ancien nom « Siège & Fusée »).
Tout est **en français** : réponds à Oni en français.

Historique détaillé (décisions, lots, anciennes règles) : `docs/historique-claude.md`. Journal des versions : `docs/versions.md`. Livret : `docs/regles-v0.3.md` (le jeu fait foi en cas d'écart).

## Règles de travail (Oni)

- **Co-pilote prudent** : aucun changement de gameplay (valeurs, règles, capacités) sans validation d'Oni. Une tâche technique ne change pas les règles.
- Remonter les décisions, poser des questions si une demande est floue, **signaler les incohérences** (moteur / interface / livret) au lieu de corriger en silence.
- **Pas de simulation** ni d'étude d'équilibrage automatique sans demande explicite.
- **Vérification** : `npm test` seulement (inclut une partie IA contre IA). **Pas de partie robot e2e** (Oni, 09/11 : économiser les tokens). Au besoin, un contrôle ciblé dans le navigateur.
- **Économiser les tokens** : lire le code par extraits ciblés (grep / sed -n), réponses courtes.
- **Livraison (workflow staging, Oni 12/11)** : on travaille et on pousse **directement sur la branche `staging`** (site staging-swarm.netlify.app, Netlify configuré par Oni), sans PR. À chaque fix : `SF.VERSION` +1 au dernier chiffre (0.5.22, 0.5.23…), entrée dans `docs/versions.md` (un test le vérifie), **puce dans `docs/staging-changes.md`** (alimente le bouton « Changements » du jeu), `npm run build`, commit, push sur `staging`. **Pas de `npm test` ni de parties de test sur staging** : seulement si Oni le demande, ou avant la fusion dans `main` (Oni, 12/11). Quand Oni juge staging stable (« passe en prod ») : PR `staging` → `main` sur MrBoufflers/swarm, fusion, **version mineure +1 (0.6.0)**, `docs/staging-changes.md` vidé (le bouton disparaît), puis `staging` recalée sur `main`.
- Honnêteté plutôt que diplomatie.

## Arborescence

```
src/engine.js   Moteur pur (SF), sans DOM, navigateur + Node
src/ia.js       IA solo (IA.decide / belief / score / fallback ; colonie : colonyLong ; essaim : PLANS assaut/rempart/percee via planOf(gid), swarmLong, planInvest), sans DOM
src/ui.js       Interface (innerHTML, clics délégués [data-a] → handle(a, d)), page Stats
src/bilan.js    Bilan de fin de partie, agrégats par version (page + serveur)
src/aide.js     Fiches de règles et conseils du mode découverte (AIDE)
src/style.css   Styles (thèmes sombre/clair/auto, plateau 9 × 9)
tools/build.py  → dist/swarm-steel-jeu.html (page autonome) ; --site → site/ (Netlify)
tools/livret.py + livret-pdf.js  → docs/livret.html + PDF
server/core.js  Serveur en ligne (lobby, jetons, actions, résultats, stats) ; server/dev.js = local
netlify/functions/api.mjs  Même serveur sur Netlify (Blobs « parties », « resultats »)
tests/rules.test.js  Scénarios de règles ; tests/serveur.test.js  serveur + robot
assets/  miniatures, logos, audio/musique.mp3 ; images/ = originaux d'Oni
```

## Architecture

- **État** `S` unique, sérialisable (localStorage `swarm-steel-v03`), `SF.newGame(solo)`, `SF.migrate` pour les anciennes parties.
- **Actions** : `SF.apply(S, camp, type, args)` (table `SF.ACTIONS`) → `""` ou raison du refus, puis `autoAdvance`. Interface locale, IA et serveur passent par là. `SF.viewFor(S, camp)` = vue filtrée. `S.fx` = événements d'animation (sans effet sur les règles). Hasard : `SF.setRng`.
- **Phases** : Essaim `A_start` (pioche `pickOne`) → `A_deploy` (`deploy`, `teleport`, `invest`) → `A_react` (colonie) → `A_attack` (blocs, `actCase`) ; `A_famine` (colonie). Colonie `D_draw` (`tdraw {cat}`) → `D_main` (sorts, `buildAt {i,k}`, `relocate`, `build` = fin) → `D_fire` (`fire`, `fireAt`) → `D_spell` (`spellPick {i}`).
- **UI (13/11)** : `tierTip()` (paliers), `ic()` (icônes de bâtiments avec `data-tip`), aperçu d'attaque `strikePreview` / `pvShow` / `pvClear` (simulation de `SF.strikeAt` sur une copie, PV en rouge, `#pvcard`), pastille `newBadge` (`t.new` posé dans `putTile`, effacé par `startDefenderTurn` ; `c.new` pour les créatures).
- **UI** : `pcLayout` (écran ≥ 1100 × 620, colonie à gauche / essaim à droite) sinon `layout()` ; `phaseParts`, `pcHandoff`, `tileTargets()`, `spellCreatures()`, `iaTick()` (S.ia = camp de l'IA), `NET` / `receive` (en ligne, écran de passage `NET.ho`), `MUSIC`.
- **Stats** : `BILAN.summary` enregistré en fin de partie (`/api/resultat`), page Statistiques par version, `balanceTables` (victoires par amélioration / bâtiment), durée (`minutes`), marqueurs `test`, `ia`, `decouverte`. Page périmée → 409 `{reload}`.

## En ligne : informations cachées

Serveur qui fait autorité, clients qui envoient des actions, vue filtrée :
- à l'essaim, jamais : main de tuiles, sortilèges, `spellOffer`, nom/PV des tuiles camouflées non révélées (sauf Clairvoyance) ;
- à la colonie, jamais : `handA` ;
- à personne : ordre des pioches (seulement les nombres). La **défausse des sortilèges est publique**. Le journal évite de nommer les tuiles camouflées (`pubName`).
Fenêtres `A_famine` / `A_react` seulement si la colonie tient le bon sort (validé). Netlify : interrogation toutes les 2 s, écriture conditionnelle (etag).

## Règles en vigueur (résumé, v0.6.1)

- **Pioche essaim** carte par carte (palier = total 3/5/7/10) ; main de départ sans Œil-sonde.
- **Mouvement en blocs** (`moveBlock`) : même case = avance ensemble à la vitesse du plus lent ; les soutiens restent avec un compagnon immobile. Carnage : pas d'avancée après la frappe (`c.struck`).
- **Construction immédiate** : points du tour fixés au début (`S.turnPts`), un bâtiment par lane et par tour, le reste va à la fusée. **Manche 1 : un seul bâtiment au total** (`firstTurnCap`).
- **Renforcé X (12/11)** : −X dégâts par attaque, sans minimum (Rempart 1, Bastion 2, Dortoir 1, Ronceraie 1 ; `S.renfV` pour convertir les anciennes parties). **Avant-postes** : 4 PV, construits seulement dans leur lane (`dir`).
- **Tuiles** : 3 pioches (renfort / actif / piège). Mines 1/3/5. Siphon = niveau × (1 + biomasse ÷ 10), plancher 5. Bouclier sur Abri blindé, Palissade (1 PV), Égide (sans Renforcé), Archives et Observatoire (2 PV) ; Épines s'appliquent malgré le Bouclier.
- **Améliorations (11/11)** : plus aucun bonus de PV variable (`bonusHp` = 0). Carapace épaisse +1 PV, Épines, −1 Mines ; Blindage = jeton `c.blind` à l'achat (tanks en jeu) et à l'arrivée ; Provocation (tirs + sortilèges) −1 tourelle, Masse vivante −1 tourelle, cumulables ; Mue = Mobilité + Métamorphose (14/11 : étape `A_morph` en fin de tour, `morph`/`morphDone`, un soutien transforme une autre créature de sa case en celle du niveau supérieur, si débloqué ; l'Échappée est supprimée) ; Griffes = Mobilité + Coup de grâce ; Régénération = Aura Soin total (autres créatures de la case d'un soutien), Glaneurs retirés de la pioche (`retired`).
- **Améliorations** : Corrosion (soutien B2, ignore Renforcé, détruit le Bouclier) remplace Frénésie ; Griffes = aussi Aura Mobilité 1 ; Férocité donne Furtivité aux aggros ; Déploiement = `teleport` 1×/tour. `invest` prend la réserve d'abord. Réincarnation : tous les tanks morts mis de côté (`reincQueue`) ; Nuke comprise ; au début du tour de l'essaim, 1 revient d'office, plusieurs → étape `A_reinc` (action `reinc {i}`), les autres retournent en pioche. Déplacements = maximum (« Tout résoudre » ne relance pas une créature déjà déplacée).
- **Dégâts du tour (13/11) : tout ou rien** : les PV ne se perdent pas durablement ; la cible n'est détruite que si les dégâts du tour (toutes sources) atteignent ses PV ; `clearDamage` les efface au début de chaque tour. **Créatures** : ATQ/PV aggros 3/1, 4/2, 5/3 ; tanks 1/2, 2/4, 3/6 ; soutiens 2 / 3 / 4 PV. Aggro et tank doivent avancer d'au moins une case s'il n'y a rien devant (`mustAdvance`). Cartes : Carapace épaisse = insensible Épines et Mines ; Provocation renforcée (tank B2, remplace Bélier : +1 PV des tanks, tourelles visent un tank à portée en priorité) ; Aura Récolte (Glaneur) ; Tir de précision ; Régénération = Aura Échappée (jeton `c.esc` par soutien, sauve une créature de sa case qui devrait mourir ; revient chaque tour ; à l'arrivée et à l'achat) ; plus de soins. Fusée : étages à 2 / 4 / 7 / 10 points (`FLOOR_COSTS`).
- **Percée** : l'excédent passe à la case derrière la cible, du côté opposé à l'attaquant (`pierce` dans `hitTile`, d'après `gpos(c)`), pas toujours vers la fusée.
- **Créatures** : Charognard = Dépouille (jeton `S.depouilles` sur la case d'une créature morte avec une Charognard vivant ; bloque `canTarget` ; retiré par un tir de tourelle I/II à portée, action `fireDep {sk,k}`, ou par la Nuke, Barrage (lane), Onde de choc (couronne) ; ex-Phéromone) ; Hurleur +2 ATQ (cumulable, plus de PV) ; Spores 1 dégât par Sporeur sur les 8 cases autour (fusée = −1 travailleur) ; perte de PV bonus = baisse du maximum seulement (`syncBonus`).
- **Sortilèges** : 1 exemplaire chacun (14), Cadence retirée ; fin de tour : garder 1 des 2 du dessus, l'autre à la défausse. Frappe orbitale détruit ; Salve 3 dégâts à 2 créatures ; Brouillage immobilise toute une case ; Double bouclier (2 tuiles) ; Renouvellement +1 point ; Reconversion = déplacer un bâtiment.

## Points ouverts (ne pas trancher sans Oni)

- **Règle « tout ou rien » (v0.6.1, ex-branche `test`, fusionnée dans `staging` le 13/11)** : à tester en jouant ; **`tests/rules.test.js` n'est pas réécrit pour elle** (une soixantaine de vérifications portent sur l'ancien modèle de PV : `npm test` échouera tant qu'on ne les a pas adaptées). Détail et plan d'équilibrage : `docs/test-degats-par-tour.md`.

- **Extension « Titans & Quarters »** : tout son travail (document de conception, futur code) va sur la **branche `extension`** (partie de `staging` le 13/11), **jamais sur `staging`** tant qu'Oni n'a pas décidé de la fusionner.

- Livret de référence (document Claude d'Oni) à mettre à jour depuis le jeu.
- Coûts aggros/tanks (3/4/7), exemplaires des soutiens ; « Déploiement » = nom d'amélioration et d'étape.
- Barbelés face visible ; Percée sur la fusée = 1 travailleur ; bâtiment sans case valable → retour en main (interprétations).
- Cas d'« escalier bloqué » signalé une fois, non reproduit (le journal trace les déplacements).

## Commandes

```
npm run build      # dist/swarm-steel-jeu.html
npm test           # règles + serveur (seule vérification habituelle)
npm run serveur    # http://localhost:8888
python3 tools/livret.py && node -r <scratchpad>/pw-pre.js tools/livret-pdf.js   # livret PDF
```
Chromium : `/opt/pw-browsers/chromium` (ne pas réinstaller Playwright ; `pw-pre.js` force ce chemin).
Tests de règles : `SF.tileStats` est enveloppé dans rules.test.js (valeurs LEGACY pour Palissade/Égide/Archives des vieux scénarios) ; les vraies valeurs sont dans `TILESTATS`.
