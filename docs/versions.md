# Swarm & Steel — journal des versions

Chaque mise à jour livrée reçoit un numéro : +1 au dernier chiffre (0.4.0, 0.4.1, 0.4.2…). Le numéro est affiché dans le jeu (en-tête et accueil) et accompagne chaque partie enregistrée : la page **Statistiques** du site regroupe les résultats par version.

Une partie garde la version à laquelle elle a commencé. Si une mise à jour arrive en cours de partie, la page Statistiques l'indique (« v0.4.0 → v0.4.1 »).

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
