# Titans & Bastions — première extension (brouillon)

> **Statut : brouillon de conception, rien n'est codé.** Tout le travail de l'extension vit sur la **branche `extension`** (partie de
> `staging` le 13/11/2026), jamais sur `staging` ni `main` tant qu'Oni n'en a pas décidé. L'extension est **hors de la version de base** :
> elle s'active à la demande, sur l'accueil. Les décisions prises sont dans le journal en bas, les points à trancher dans
> « Questions ouvertes ».

## 1. Principe

Une extension optionnelle en deux modules, un par camp :

| Module | Camp | Idée |
|---|---|---|
| **Titans** | Essaim | Une pioche de **créatures mythiques**, accessible en fin de partie, pour donner un usage au surplus de biomasse. |
| **Quartiers** | Colonie | De grandes **tuiles transparentes** qui se posent sur une forme de bâtiments (ou la fusée) et leur donnent un bonus. |

> Nom : Oni a écrit « titans et quartier on va appeler ça » (13/11). Je lis : modules **Titans** et **Quartiers**. Le nom de l'extension
> reste « Titans & Bastions » en attendant : à confirmer (voir question 9).

Les deux modules sont indépendants dans les règles, mais l'extension s'active d'un bloc pour garder l'accueil simple.

## 2. Activation et interface

- **Interrupteur sur l'accueil** (« Titans & Bastions : oui / non »), mémorisé comme le thème.
- **Couleur du menu** : l'accent jaune orangé actuel devient un **vert acide** quand l'extension est active (accueil et barre de menu
  en jeu).
- **En ligne** : l'hôte choisit à la création de la partie ; l'extension est fixée pour toute la partie et affichée dans la salle
  d'attente.
- **Statistiques** : un marqueur « extension » sur les parties.
- **Zéro régression** : toutes les règles de l'extension sont conditionnées par `S.ext` ; extension éteinte, le jeu est identique à la base.

---

## 3. Module Titans (essaim)

### 3.1 Le problème visé
Compléter les 3 arbres d'amélioration coûte **54 biomasse** (3 × (6 + 12)). Au palier 4 (21 biomasse) avec 5 créatures par lane, le
surplus part en réserve et ne sert plus à rien.

### 3.2 Règles décidées (Oni, 13/11)
- **Condition** : les **3 arbres terminés** (rang 2 acheté dans chacun).
- **Pioche mythique** : 10 cartes au total, pas plus, face cachée.
- **Prix** : **15 de biomasse** pour piocher, **puis le coût de la carte pour la déployer** (5 à 8).
- **Pioche à 2 cartes** : on en tire 2 et on **en garde une**. (Proposition : l'autre repart **sous la pioche**, pour ne pas perdre une des
  10 cartes ; à confirmer.)
- **Une seule fois** : chaque mythique existe en un exemplaire ; une fois jouée, elle ne revient jamais dans la pioche (si elle meurt, elle
  est perdue pour la partie).
- **Plafond de lane** : une mythique **compte** dans le plafond de population de sa lane.
- **Interactions** : la Nuke les détruit comme les autres ; la Réincarnation ne s'applique pas aux mythiques ; en ligne, la pioche est
  cachée et la pose est publique.

### 3.3 Les 10 mythiques (pistes à valider carte par carte)
Effets simples, sans calcul, avec les jetons déjà connus (Blindage, Échappée) ; chaque carte a une **faiblesse lisible**.

1. **Briseur de coins** (aggro) : détruit directement un support (ignore les murs qui le tiennent).
2. **Léviathan** (tank) : tous les tirs de sa lane le visent ; arrive avec un jeton Blindage.
3. **Titan écorcheur** (aggro) : très grosse attaque, frappe deux bâtiments à la fois.
4. **Mère des spores** (soutien) : ses Spores font 3 dégâts.
5. **Ver des profondeurs** : se déploie directement en couronne 1.
6. **Oracle** (soutien) : révèle toutes les tuiles camouflées ; une tourelle de sa lane ne peut pas tirer ce tour.
7. **Phénix** (aggro) : revient une fois à sa mort.
8. **Dévoreur de technologies** : détruit tous les bâtiments de technologie d'une lane.
9. **Reine de la ruche** (soutien) : les créatures de sa lane gagnent Furtivité ou +1 vitesse.
10. **Source de biomasse** (soutien) : chaque bâtiment détruit rapporte +1 de biomasse en plus.

Les valeurs (ATQ / PV / vitesse / coût) ne sont pas fixées. Garde-fous : effets spectaculaires plutôt que gros chiffres ; toujours une
réponse côté colonie (Frappe orbitale, tourelles, Nuke) ; accès tardif (palier 4 minimum).

---

## 4. Module Quartiers (colonie)

### 4.1 Principe
Une **pièce transparente teintée**, en forme de 2 à 5 cases, se pose **par-dessus** des bâtiments (et/ou la fusée). Tous les bâtiments
qui sont dessous gagnent le **bonus** du quartier. Le quartier ne coûte aucun point de construction, mais il est **conditionné** par ce
qu'il recouvre.

### 4.2 Règles décidées (Oni, 13/11)
- **Pas de lien à une lane** : un quartier peut recouvrir des cases de plusieurs lanes. **La fusée fait partie des cases qu'un quartier
  peut recouvrir et protéger** : ça ouvre beaucoup plus de placements.
- **Formes très variées, de 2 à 5 cases** : de deux cases côte à côte (horizontal ou vertical) jusqu'aux formes à 5 cases. **Plus la forme
  est grande, plus le quartier est puissant.**
- **Un bâtiment n'appartient qu'à un seul quartier.**
- **Coût** : aucun point de construction. **Condition** : le quartier exige quelque chose sous lui (par ex. au moins une tuile qui donne de
  la technologie, ou un piège). **Un seul quartier posé par tour.**
- **Bonus fixes, sans calcul**, et **pièces transparentes** posées au-dessus des tuiles de bâtiments.
- **Les Barbelés comptent** comme des bâtiments (pour former la forme et recevoir le bonus).
- **Chute du quartier** : il faut **détruire au moins 2 tuiles du quartier** pour qu'il tombe définitivement ; il **revient alors en main**.
  Détruire une seule tuile ne le fait pas tomber (ça évite les allers-retours de construction à chaque tuile détruite).
- **Pioche des quartiers** : **3 quartiers piochés au hasard** ; dès que l'on en pose un, on en repioche un pour **toujours avoir 3 choix** à
  poser. Quand un quartier revient en main, le quartier en trop est mis **sous la pioche** pour garder 3 choix (lecture à confirmer).
- **Visibilité** : les quartiers piochés sont **visibles** de l'adversaire dès la pioche (difficile de garder un secret au jeu de plateau).

### 4.3 Géométrie du plateau (vérifiée dans le moteur)
- Chaque lane est un triangle de **9 cases** : 1 en couronne 1, 3 en couronne 2, 5 en couronne 3. Au départ, les couronnes 1 et 2 portent
  **16 Barbelés**, seule la couronne 3 (5 cases par lane) est libre.
- Deux lanes **ne se touchent jamais par un côté** ; elles se rejoignent **par la fusée** (les quatre cases de couronne 1 touchent toutes
  la fusée) et **par les coins de support**. Un quartier inter-lane passe donc forcément par la **fusée** ou un **support**.
- Conséquence : comme les Barbelés comptent, des formes en T, L, éclair ou carré sont possibles dès le début, et un petit quartier
  de 2 cases peut se poser très tôt.

### 4.4 Pistes de quartiers (à valider un par un)
Forme et condition entre parenthèses ; bonus pour **chaque bâtiment dessous**, sauf mention « entier ».

| Quartier | Cases | Condition sous la pièce | Bonus |
|---|---|---|---|
| Poste de garde | 2 en ligne | un bâtiment à Épines | +1 Épines |
| Atelier | 2 en ligne | un bâtiment à travailleur | +1 travailleur (entier) |
| Laboratoire central | 3 en ligne | un bâtiment de technologie | +1 technologie (entier) |
| Mur renforcé | 3 en L | un bâtiment Renforcé | +1 Renforcé |
| Cellule piégée | 3 en L | un piège (Mine ou Siphon) | les pièges restent camouflés après une attaque |
| Bastion de tir | 4 en T | un bâtiment à Épines | les tourelles à portée font +1 dégât |
| Zone de recherche | 4 en éclair | deux bâtiments de technologie | +2 technologies (entier) |
| Quartier ouvrier | 4 en ligne | un bâtiment à travailleur | +2 travailleurs (entier) |
| Citadelle | 4 en carré | un Renforcé et une technologie | un jeton Bouclier rendu à chaque tour de la colonie |
| Sanctuaire de la fusée | 3 (fusée + 2) | un bâtiment à Épines | la fusée ne perd pas de travailleur par Percée ou Spores |
| Forteresse | 5 en croix | Renforcé, Épines et technologie | Bouclier et +1 Renforcé |

### 4.5 Risques à surveiller
- **Rythme** : un bâtiment par lane et par tour, un seul au premier tour. Les Barbelés (déjà posés) évitent que le premier quartier
  arrive trop tard.
- **Petites formes** : un quartier de 2 cases se pose très facilement ; son bonus doit rester faible, sinon on l'enchaîne tour après tour.
- **Cumul avec l'existant** : Épines, Renforcé et Bouclier existent déjà ; il faut un plafond (par ex. Renforcé limité à 3).
- **Chute à 2 tuiles** : pour un quartier de 2 cases, détruire ses deux tuiles le fait tomber, ce qui est cohérent ; pour un grand quartier
  (5 cases), 2 tuiles détruites sur 5 est un seuil bas.
- **Fusée dans un quartier** : à cadrer, car elle n'est pas un bâtiment (pas de PV) ; voir question 5.
- **IA** : elle doit chercher les formes réalisables (recherche de polyominos) et les placer ; l'IA de l'essaim doit viser les cases clés.
- **Matériel** : pièces transparentes teintées de 2 à 5 cases, à la taille exacte des cases ; une dizaine de formes distinctes (domino,
  trominos I et L, tétrominos I, O, T, L, S, croix…).

---

## 5. Impact technique prévu (quand on codera)
- État `S.ext` (par module), fixé à la création de la partie, sauvegardé ; `SF.migrate` (anciennes parties : désactivé).
- **Titans** : pioche `S.piles.mythic`, action de pioche payante (2 cartes, on en garde une), indicateur « arbres terminés ».
- **Quartiers** : pioche de quartiers visible, `S.quartiers` (posés / en main), détection de forme (rotations, symétries) avec fusée et
  supports comme cases, condition de pose, pose d'un quartier par tour, compteur de tuiles détruites sous le quartier (chute à 2), bonus
  lus dans `epinesOf`, Renforcé, `bonusWorkers`, `tech`, `turretDmg`.
- **Interface** : interrupteur d'accueil, thème vert acide, cartes de mythiques, pièces transparentes superposées au plateau, infobulles.
- **IA** : plans pour les deux modules. **Stats** : marqueur « extension ». **Tests** : règles dédiées, base inchangée extension éteinte.
- **Livret** : un chapitre d'extension séparé.

## 6. Questions ouvertes
1. **Adjacence inter-lane** : les **supports de coin** comptent-ils comme des cases pour former une forme (comme la fusée), ou seulement
   la fusée relie les lanes ? (Je recommande : fusée **et** supports comptent.)
2. **Chute à 2 tuiles** : 2 tuiles **détruites en même temps** (reconstruire sous le quartier le répare), ou **cumul** de 2 destructions
   dans la partie ? (Je recommande : en même temps.)
3. **Pioche de quartiers** : combien de quartiers au total dans la pioche ? (Proposition : 11 ou 12, un par piste du tableau.) Et que
   signifie exactement « on met l'autre en dessous de la pioche » (voir 4.2) ?
4. **Conditions** : quelle liste de critères possibles (technologie, piège, travailleur, Épines, Renforcé, camouflée, Bouclier…) ?
5. **Fusée dans un quartier** : quel bonus peut-elle recevoir (protection contre Percée / Spores, −1 dégât…) ? Y a-t-il une seule fusée
   par quartier, évidemment ?
6. **Titans** : l'autre carte de la pioche de 2 repart-elle **sous la pioche** ?
7. **Quartier posé sur un bâtiment détruit puis reconstruit** : le nouveau bâtiment reçoit-il le bonus ? (Je recommande : oui.)
8. **Pose pendant la manche 1** : autorisée ? (un seul bâtiment au tour 1, mais les Barbelés peuvent suffire à satisfaire la forme)
9. **Noms** : l'extension s'appelle-t-elle « Titans & Quartiers » plutôt que « Titans & Bastions » ?

## 7. Journal des décisions
- **13/11/2026 (Oni)** : extension « Titans & Bastions », **hors version de base**, activable sur l'accueil, menu vert acide (jaune orangé
  sans l'extension). Pioche mythique : 3 arbres terminés, 10 cartes, une seule fois chacune, **15 de biomasse**, **2 cartes on en garde
  une**, une mythique compte dans le plafond de lane.
- **13/11/2026 (Oni)** : **quartiers** pour la colonie : inter-lane, la fusée est protégeable, formes de 2 à 5 cases (grand = puissant), un
  bâtiment dans un seul quartier, sans coût de construction mais conditionné, un par tour, bonus fixes, pièces transparentes, Barbelés
  comptent, chute à 2 tuiles détruites (retour en main), 3 quartiers au hasard toujours disponibles, visibles dès la pioche.
- **13/11/2026** : tout le travail de l'extension est déplacé sur la branche **`extension`**, partie de `staging`.
