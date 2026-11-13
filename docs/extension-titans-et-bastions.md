# Titans & Bastions — première extension (brouillon)

> **Statut : brouillon de conception, rien n'est codé.** L'extension est **hors de la version de base** : elle s'active à la demande,
> sur l'accueil. Document tenu par Oni et Claude ; les décisions prises sont dans le journal en bas, les points à trancher dans
> « Questions ouvertes ».

## 1. Principe

Une extension optionnelle en deux modules, un par camp :

| Module | Camp | Idée |
|---|---|---|
| **Titans** | Essaim | Une pioche de **créatures mythiques**, accessible en fin de partie, pour donner un usage au surplus de biomasse. |
| **Bastions** | Colonie | Des **quartiers** : de grandes tuiles transparentes qui se posent sur une forme de bâtiments et leur donnent un bonus. |

Les deux modules sont **indépendants** dans les règles (un camp peut jouer avec, l'autre sans) mais l'extension s'active d'un bloc, pour
garder l'accueil simple.

## 2. Activation et interface

- **Interrupteur sur l'accueil** (« Titans & Bastions : oui / non »), mémorisé comme le thème.
- **Couleur du menu** : l'accent jaune orangé actuel devient un **vert acide** quand l'extension est active (accueil et barre de menu
  en jeu), pour qu'on sache d'un coup d'œil dans quel mode on est.
- **En ligne** : c'est l'hôte qui choisit à la création de la partie ; l'extension est fixée pour toute la partie et affichée dans la
  salle d'attente. Les deux joueurs voient l'indicateur.
- **Statistiques** : un marqueur « extension » sur les parties, pour ne pas mélanger les résultats avec la base.
- **Versions** : l'extension suit le numéro de version du jeu ; rien dans la base ne change quand elle est désactivée (zéro régression
  voulue : toutes les règles de l'extension sont conditionnées par `S.ext`).

---

## 3. Module Titans (essaim)

### 3.1 Le problème visé
Compléter les 3 arbres d'amélioration coûte **54 biomasse** (3 × (6 + 12)). Au palier 4 (21 biomasse) avec 5 créatures par lane, le
surplus part en réserve et ne sert plus à rien.

### 3.2 La règle
- **Condition** : les **3 arbres terminés** (rang 2 acheté dans chacun des trois).
- **Pioche mythique** : une pioche supplémentaire, face cachée, de **10 cartes**, pas plus.
- **Prix** : **15 de biomasse pour piocher** une carte (à trancher : 15 ou 20), **puis le coût de la carte pour la déployer** (5 à 8).
- **Une seule fois** : chaque mythique existe en un exemplaire. Une fois jouée, elle ne revient jamais dans la pioche : si elle meurt,
  elle est perdue pour la partie.
- **Plafond de lane** : une mythique compte dans le plafond de population de sa lane.
- **Interactions** : la Nuke les détruit comme les autres ; la Réincarnation ne s'applique pas aux mythiques ; en ligne, la pioche est
  cachée et la pose est publique.

### 3.3 Les 10 mythiques (pistes à valider carte par carte)
Effets simples, sans calcul, avec les jetons déjà connus (Blindage, Échappée). Chaque carte a une **faiblesse lisible**.

1. **Briseur de coins** (aggro) : détruit directement un support (ignore les murs qui le tiennent). Réponse au problème des coins fermés.
2. **Léviathan** (tank) : tous les tirs de sa lane le visent ; arrive avec un jeton Blindage.
3. **Titan écorcheur** (aggro) : très grosse attaque, frappe deux bâtiments à la fois.
4. **Mère des spores** (soutien) : ses Spores font 3 dégâts.
5. **Ver des profondeurs** : se déploie directement en couronne 1.
6. **Oracle** (soutien) : révèle toutes les tuiles camouflées ; une tourelle de sa lane ne peut pas tirer ce tour.
7. **Phénix** (aggro) : revient une fois à sa mort (c'est son seul sursaut).
8. **Dévoreur de technologies** : détruit tous les bâtiments de technologie d'une lane.
9. **Reine de la ruche** (soutien) : les créatures de sa lane gagnent Furtivité ou +1 vitesse.
10. **Source de biomasse** (soutien) : chaque bâtiment détruit rapporte +1 de biomasse en plus (elle s'autofinance).

> Les valeurs (ATQ / PV / vitesse / coût) ne sont pas fixées : on les décide quand les principes sont validés.

### 3.4 Garde-fous d'équilibre
- Effet **spectaculaire plutôt que gros chiffres**, pour ne pas faire un bouton « j'ai gagné ».
- Toujours une réponse côté colonie (la Frappe orbitale détruit déjà n'importe quelle créature ; les tourelles et la Nuke restent des
  contres).
- Accès tardif (palier 4 minimum) : cela ne change rien aux premières manches.

---

## 4. Module Bastions (colonie) — les quartiers

### 4.1 Idée de départ (Oni, 13/11/2026)
Au début de la partie, la colonie pioche **3 méga-tuiles « quartier »**. On ne peut en construire une que si l'on a déjà des
bâtiments disposés selon une **forme** donnée (T, L, éclair, carré…). Le quartier se pose **par-dessus** les tuiles, en
transparence, et forme un « quartier ». Il procure un **bonus à tous les bâtiments qui sont dedans**.

### 4.2 Contraintes du plateau (vérifiées dans le moteur)
- Chaque **lane** est un triangle de **9 cases** : 1 case en couronne 1, 3 en couronne 2, 5 en couronne 3.
- Il n'y a **aucun contact orthogonal entre deux lanes** : les cases ne se touchent que par les coins de support. **Un quartier tient donc
  dans une seule lane.**
- Toutes les formes classiques y tiennent : droite de 4 (couronne 3), T, L, éclair, carré 2 × 2, croix de 5 (centrée sur la couronne 2).
- **Au départ, les couronnes 1 et 2 sont remplies de Barbelés (16) et seule la couronne 3 (5 cases par lane) est libre.** Sans règle
  particulière, seules les droites de 4 sont possibles au début : un T, un L, un éclair ou un carré ne deviennent constructibles qu'après
  la destruction des Barbelés par l'essaim.

### 4.3 Règles proposées
- **Forme** : toutes les rotations (et les symétries) sont autorisées. Les formes font **4 cases** (les plus gros quartiers, de 5 cases,
  sont plus puissants).
- **Les Barbelés comptent comme des bâtiments** pour former la forme (ils sont déjà là). Ils profitent donc aussi du bonus. C'est ce qui
  rend les formes en T, L, éclair et carré possibles dès le début, avec la couronne 3 et les Barbelés de la couronne 2.
- **Pose** : le quartier se place dans le tour de construction, sans coût en points (ou au coût de quelques points : à trancher), quand la
  forme est réalisée. Un bâtiment ne peut appartenir qu'à un seul quartier.
- **Quartier vivant** : si un bâtiment du quartier est détruit, le quartier est **rompu** (la tuile transparente revient en main, à
  reposer sur une forme valide, au prix d'un nouveau tour de construction). L'essaim a donc une raison de viser la forme : en détruisant
  la case clé, il fait tomber tous les bonus.
- **Bonus** : fixes et lisibles, jamais de calcul (même principe que Blindage et Échappée). Chaque bâtiment du quartier gagne le même effet.

### 4.4 Pistes de bonus (une par type de quartier)
| Quartier | Bonus pour chaque bâtiment dedans |
|---|---|
| Militaire | +1 Épines |
| Blindé | +1 Renforcé |
| Citadelle | un jeton Bouclier, rendu au début de chaque tour de la colonie |
| Scientifique | +1 technologie pour le quartier entier (pas par bâtiment) |
| Ouvrier | +1 travailleur pour le quartier entier |
| Fortin | les tourelles à portée du quartier font +1 dégât |
| Mimétique | les tuiles camouflées du quartier restent camouflées après avoir été attaquées une fois |

### 4.5 Risques à surveiller
- **Rythme** : un bâtiment par lane et par tour + un seul bâtiment au premier tour. Former une forme de 4 cases prend du temps : les
  Barbelés (4.3) sont ce qui évite que le quartier arrive trop tard.
- **Concentration** : un quartier pousse à construire en bloc dans une lane. Cela peut gêner l'étalement actuel (une lane par tour), et
  faire de la lane un objectif évident pour l'essaim (voulu).
- **Cumul avec les bonus actuels** : Épines, Renforcé et Bouclier existent déjà ; on évite d'empiler sans plafond (par ex. Renforcé
  limité à 3).
- **IA de la colonie** : elle devra chercher les formes réalisables (recherche de polyominos : simple) et protéger la case clé.
- **IA de l'essaim** : elle devra viser les cases clés. Valeur à ajouter dans l'évaluation (comme pour les coins).
- **Matériel physique** : les quartiers sont des pièces **transparentes teintées** en forme de tétromino, posées sur les tuiles. C'est
  très « jeu de plateau » ; la taille de la pièce doit correspondre exactement à celle des cases.
- **En ligne** : les quartiers piochés sont cachés à l'essaim jusqu'à leur pose, comme les tuiles de la main.

---

## 5. Impact technique prévu (quand on codera)
- Un état `S.ext` (par module), fixé à la création de la partie et sauvegardé ; `SF.migrate` pour les anciennes parties (désactivé).
- Titans : une pioche `S.piles.mythic`, une action de pioche payante, un indicateur « arbres terminés ».
- Bastions : `S.quartiers` (main de la colonie, posés), détection de forme (rotations, symétries), action de pose, retrait quand un
  bâtiment tombe, bonus lus dans `epinesOf`, Renforcé, `bonusWorkers`, `tech`, `turretDmg`.
- Interface : interrupteur d'accueil, thème vert acide, cartes de mythiques, superposition transparente des quartiers sur le plateau,
  infobulles (comme pour les icônes de bâtiments).
- IA : plans pour les deux modules.
- Stats : marqueur « extension ». Tests : règles dédiées, la base doit rester identique extension éteinte.
- Livret : un chapitre d'extension séparé.

## 6. Questions ouvertes
1. Titans : **prix** de la pioche, 15 ou 20 ? (je recommande 15 + coût de déploiement)
2. Titans : pioche **au hasard** ou **2 cartes, on en garde une** ?
3. Titans : une mythique **compte dans le plafond** de lane ? (je recommande oui)
4. Bastions : les **Barbelés comptent-ils** pour former les formes et reçoivent-ils le bonus ? (je recommande oui)
5. Bastions : **combien de cases** par quartier (4 ou 5), et la pose a-t-elle un **coût en points** ?
6. Bastions : un quartier **rompu** revient en main, ou est défaussé définitivement ?
7. Bastions : les 3 quartiers sont **imposés** au hasard ou on **pioche 5 et on en garde 3** ?
8. Bastions : les quartiers sont-ils **connus de l'essaim** (cartes posées visibles) dès la pioche, ou seulement à la pose ?
9. Nom des modules : « Titans » et « Bastions » conviennent-ils, ou « Bastions » est réservé à autre chose ?

## 7. Journal des décisions
- **13/11/2026 (Oni)** : l'extension s'appelle « Titans & Bastions », est **hors version de base**, s'active sur l'accueil, et change la
  couleur du menu (jaune orangé → vert acide). Accord sur les principes de la pioche mythique (3 arbres terminés, 15 ou 20 de biomasse,
  10 cartes, une seule fois par carte).
- **13/11/2026 (Oni)** : idée des **quartiers** pour la colonie (3 méga-tuiles piochées au début, formes de bâtiments, bonus pour les
  bâtiments dedans). À réfléchir avant de fixer les règles.
