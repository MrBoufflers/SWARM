# Swarm & Steel — journal des versions

Chaque mise à jour livrée reçoit un numéro : +1 au dernier chiffre (0.4.0, 0.4.1, 0.4.2…). Le numéro est affiché dans le jeu (en-tête et accueil) et accompagne chaque partie enregistrée : la page **Statistiques** du site regroupe les résultats par version.

Une partie garde la version à laquelle elle a commencé. Si une mise à jour arrive en cours de partie, la page Statistiques l'indique (« v0.4.0 → v0.4.1 »).

## v0.4.7 — 4 novembre 2026

Confort de jeu, sans changement de règles.

- **Travailleurs assignés d'office** : quand on lance un chantier, l'atelier reçoit juste assez de travailleurs pour le finir, dans la limite des travailleurs libres. Le reste va à la fusée, et la répartition reste modifiable avec + / −.
- **Fin de tour automatique** :
  - le bouton « Fin du tour de l'essaim » disparaît : le tour passe à la colonie dès que toutes les cases ont agi ;
  - la colonie passe la main dès qu'aucune tourelle ne peut plus tirer, y compris quand aucune créature n'est à portée ;
  - « Terminer le tour » reste, pour finir sans tirer à la main : il fait tirer automatiquement les tourelles restantes.
- **Tir direct** : après avoir choisi une tourelle, on peut toucher une créature surlignée sur le plateau. La liste de cibles reste disponible.
- **Tuiles en main** : grande illustration à gauche ; les capacités deviennent des pastilles, avec leur texte au survol (ou au toucher).
- **Supports** : contour turquoise, en pointillés quand la tourelle a déjà tiré.

## v0.4.6 — 4 novembre 2026

Interface seulement, sans changement de règles.

- **Mode sombre**, par défaut, dans l'esprit des illustrations : charbon, lueurs de braise, accents rouille et orange. Le champ de bataille sert de fond à l'accueil.
- Bouton **Thème** dans l'en-tête : sombre → clair → auto (suit le réglage de l'appareil). Le choix est mémorisé dans le navigateur.
- Sur téléphone, les boutons de l'en-tête passent à la ligne au lieu de déborder.

## v0.4.5 — 4 novembre 2026

Interface seulement, sans changement de règles.

- **Panneau de l'adversaire réduit à un résumé compact**, ce qui laisse plus de place au plateau et à son propre panneau (au moins 330 px de large).
  - Vu par l'essaim, la colonie montre la fusée en colonne : étage 1 en bas, 12 en haut, avec l'effet de chaque étage au survol. À côté, ses chiffres clés (travailleurs, technologies, points vers l'étage suivant, tuiles et sorts en main), puis les ateliers en colonne.
  - Vu par la colonie, l'essaim montre ses chiffres clés et ses améliorations en icônes : pleine si acquise, avec une barre si en cours, pâle si fermée, et le détail au survol. 9 nouveaux pictos d'amélioration.
- **Info-bulles** au survol, ou au toucher sur téléphone.
- **Nouvelles illustrations d'Oni** :
  - toutes les créatures et tous les bâtiments, sauf la Palissade ;
  - une même image pour les quatre Avant-postes ;
  - la fusée sur la case centrale ;
  - le champ de bataille en fond du plateau.
- Correctif : les cartes en main avaient de grands vides, à cause d'un conflit de style avec la page Statistiques.

## v0.4.4 — 4 novembre 2026

**Règles (Oni)**
- **Supports de niveau 2** : ils ne donnent plus d'Épines aux tuiles voisines.
- **Fusée** : un étage coûte 2, **4, 6 puis 8** points selon le palier (au lieu de 2, 3, 4, 5).
- **Supports de niveau 3** : **+2 travailleurs** (au lieu de +3).
- **Égide** : **2 PV** (au lieu de 3).
- **Champ de stase** : protège **un seul bâtiment** ce tour (aucun dégât, ni attaque ni percée ni spores), et ses Épines sont suspendues pour les créatures qui l'attaquent.
- **Brouillage** : sur n'importe quelle créature ; ce tour, elle ne bouge pas et n'attaque pas (au lieu d'annuler un déploiement).

**Interface**
- Illustrations d'Oni (dossier `images/`) en fond des tuiles, des supports et des jetons de créatures, et en vignette sur les cartes en main. Il n'y a pas encore d'image pour : Perforeur, Catalyseur, Sapeur, Sporeur, Palissade, Baraquement, Dortoir, Archives, Avant-postes, Ligne de front, Réduit, Piège, Siphon, Ronceraie, Égide.
- Plateau agrandi (cases jusqu'à 96 px, 84 px sur un écran de 1400 px avec les deux panneaux).

## v0.4.3 — 4 novembre 2026

**Règles (Oni)**
- **Départ de l'essaim** : **5 de biomasse** (au lieu de 3).
- **Premier tour de l'essaim** : à la place de la pioche, une créature de niveau 1 de chaque type : Écorcheur, Carapace et un soutien tiré au hasard (Œil-sonde, Glaneur ou Hurleur). Elles se paient normalement. La pioche normale reprend au 2ᵉ tour.
- **Œil-sonde** (changement définitif) : tant qu'il est en vie, toutes les tuiles camouflées de sa lane sont révélées, y compris celles posées après lui. Une tuile révélée le reste après sa mort.

## v0.4.2 — 2 novembre 2026

**Règles (Oni)**
- **Glaneur** : vitesse de base de **2 cases** par tour, pour suivre le groupe qu'il accélère avec son Aura Mobilité.
- **Provocation** (tank, côté B) : en plus d'attirer les tirs, les tanks ne subissent plus les dégâts d'Épines.

## v0.4.1 — 2 novembre 2026

**Règles (Oni)**
- **Renforcé** remplace le Bouclier : Égide et Dortoir sont **Renforcé 2**. Rappel : 1 PV perdu par tranche complète de X dégâts, plusieurs PV possibles d'un coup.
- **Paliers de l'essaim** : départ, puis 9 / 15 / **21** de biomasse.
- **Auras** : une aura ne profite qu'aux autres créatures de sa case, jamais à elle-même, et **toutes se cumulent** (une par source) : Fureur, Griffes, Butin, Spores, Soin, Mobilité, +1 PV.
- **Glaneur** : Aura Soin 1 et **Aura Mobilité 1** (+1 case aux autres créatures de sa case, qui partent devant lui).
- **Mue** (soutien, côté A) : les soutiens gagnent la Furtivité et l'**Aura +1 PV**. Ils n'ont plus +1 PV eux-mêmes.
- **Régénération** : l'Aura Soin 2 s'ajoute à l'Aura Soin 1 du Glaneur (soin 3).
- **Provocation** : nouveau nom de la Protection (tank, côté B).
- **Aura Spores** : **2 dégâts** par Sporeur de la case (en une seule attaque, donc soumise à Renforcé).
- **Frénésie** : chaque soutien choisit la créature de sa case dont il double les dégâts (fiche du soutien, « Frénésie sur : … » ; par défaut la plus forte). Cumulable : deux Frénésies sur la même créature la quadruplent.

## v0.4.0 — 2 novembre 2026

Début du suivi des versions et des statistiques.

**Suivi des parties**
- Chaque partie terminée est enregistrée, en ligne comme en local (page ouverte depuis le site) : version, mode, vainqueur, nombre de manches, biomasse finale, travailleurs tués, étages de la fusée, et un mini-plan du plateau final.
- Page **Statistiques des parties** (bouton sur l'accueil, ou adresse `?stats`) :
  - par version : nombre de parties, victoires de chaque camp, moyennes de manches, de biomasse finale, de travailleurs tués et d'étages ;
  - liste des dernières parties avec leur plateau final ;
  - export CSV.
- Les parties jouées par les robots de test sont marquées « test » et masquées par défaut.

**Version de la page**
- Le serveur refuse une page d'une autre version et demande de la recharger (bandeau « Nouvelle version du jeu disponible »).
- Une page ouverte depuis le site vérifie aussi la version toutes les 5 minutes.
- Cause du refus de déploiement signalé : une page restée ouverte pendant une mise à jour gardait les anciens paliers, alors que le serveur appliquait les nouveaux.

**Règles (Oni, 2 novembre 2026)**
- **Paliers de l'essaim** : 4 paliers.

  | Biomasse | Plafond par lane | Pioche N1 · N2 · N3 |
  |---|---|---|
  | départ | 2 | 3 · 0 · 0 |
  | 9 | 3 | 3 · 2 · 0 |
  | 15 | 4 | 4 · 2 · 1 |
  | 20 | 5 | 4 · 3 · 3 |

- **Renforcé X** : de nouveau 1 PV par tranche complète de X dégâts, plusieurs PV possibles d'un coup (fin de l'essai à 1 PV maximum par attaque).
- **Déplacement** : une case par tour ; au contact d'une tuile ou de la fusée, la créature attaque aussitôt. Après une casse, le bloc n'entre dans la case libérée que s'il lui reste un déplacement.
- **Mobilité** (aggro, rang 1) : 2 cases par tour ; les aggros mobiles partent devant leur case. Le changement de lane est supprimé.
- **Camouflage** : une tuile encore camouflée ne subit ni la percée ni les spores, sauf si la Vision ou la Clairvoyance la rend visible.

## Avant la v0.4

Prototype « v0.3 ». Les changements de règles du 30 octobre au 2 novembre 2026 sont résumés en tête du livret (`docs/regles-v0.3.md`, section « Changements depuis la v0.3 d'origine »). Les parties commencées avant la v0.4 sont notées « 0.3 ».
