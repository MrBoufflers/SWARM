# Titans & Quarters — première extension (brouillon)

> **Statut : brouillon de conception, rien n'est codé.** Tout le travail de l'extension vit sur la **branche `extension`** (partie de
> `staging` le 13/11/2026), jamais sur `staging` ni `main` tant qu'Oni n'en a pas décidé. L'extension est **hors de la version de base** :
> elle s'active à la demande, sur l'accueil. Les décisions prises sont dans le journal en bas, les points encore à trancher dans
> « Questions ouvertes ».

## 1. Principe

Une extension optionnelle en deux modules, un par camp :

| Module | Camp | Idée |
|---|---|---|
| **Titans** | Essaim | Une pioche de **créatures mythiques**, accessible en fin de partie, pour donner un usage au surplus de biomasse. |
| **Quartiers** (« quarters ») | Colonie | Des **pièces transparentes** posées sur une forme de bâtiments (fusée et supports compris) qui leur donnent un bonus. |

Nom de l'extension : **Titans & Quarters** (Oni, 13/11). Les deux modules sont indépendants dans les règles, mais l'extension s'active
d'un bloc pour garder l'accueil simple.

## 2. Activation et interface

- **Interrupteur sur l'accueil** (« Titans & Quarters : oui / non »), mémorisé comme le thème.
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
- **Pioche à 2 cartes** : on en tire 2 et on **en garde une** ; **l'autre repart sous la pioche** (elle n'est donc pas perdue).
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
Une **pièce transparente teintée**, de 2 à 5 cases, se pose **par-dessus** des bâtiments (ou la fusée, ou un support). Tout ce qui est
dessous gagne le **bonus** du quartier. Le quartier ne coûte aucun point de construction, mais il est **conditionné** par ce qu'il recouvre.

### 4.2 Règles décidées (Oni, 13/11)
- **Pas de lien à une lane** : un quartier peut recouvrir des cases de plusieurs lanes. Les lanes se rejoignent par la **fusée** et par
  les **supports de coin** : **la fusée et les supports comptent comme des cases** qu'un quartier peut recouvrir (certains quartiers
  l'exigent même).
- **Formes variées, de 2 à 5 cases** : de deux cases côte à côte (horizontal ou vertical) jusqu'aux formes à 5 cases. **Plus la forme est
  grande, plus le quartier est puissant.**
- **Un bâtiment n'appartient qu'à un seul quartier.**
- **Coût** : aucun point de construction. **Condition** : le quartier exige des choses précises sous lui (voir 4.4). **Un seul quartier
  posé par tour.** **Jamais au premier tour** (et la condition n'y serait de toute façon pas remplie).
- **Bonus fixes, sans calcul**, sur des **pièces transparentes** posées au-dessus des tuiles de bâtiments.
- **Les Barbelés comptent** comme des bâtiments pour former la forme et recevoir le bonus (mais pas pour remplir une condition, voir 4.4).
- **Chute du quartier** : le quartier tombe quand **2 cases** de sa pièce sont **vides en même temps** (bâtiments détruits ; pas
  forcément au même tour). Si l'on reconstruit sous la pièce avant, elle est réparée. Un bâtiment reconstruit sous le quartier reçoit
  de nouveau le bonus. Un quartier tombé **retourne en bas de la pioche de quartiers**.
- **Pioche de quartiers** : **10 quartiers**. Au début de la partie, la colonie en pioche **3 au hasard** ; dès qu'elle en pose un, elle en
  repioche un pour **toujours avoir 3 choix**. Ils sont **visibles** de l'adversaire dès la pioche.
- **Bonus sur la fusée** : certains quartiers donnent de l'**Épines** ou du **Renforcé** à la fusée (voir 4.6).

### 4.3 Géométrie du plateau (vérifiée dans le moteur)
- Chaque lane est un triangle de **9 cases** : 1 en couronne 1, 3 en couronne 2, 5 en couronne 3. Au départ, les couronnes 1 et 2 portent
  **16 Barbelés**, seule la couronne 3 est libre.
- Deux lanes **ne se touchent jamais par un côté** : elles se rejoignent **par la fusée** (les quatre cases de couronne 1 la touchent
  toutes) **et par les coins de support**. Comme les deux comptent comme des cases, les formes inter-lane sont nombreuses.
- Comme les Barbelés comptent, des formes en T, L, éclair ou carré sont possibles dès le début.

### 4.4 Les critères de condition (proposition)
Un critère se **vérifie à la pose** (ensuite seule la règle des 2 cases vides compte : on ne revérifie pas, pour rester simple). Il se
remplit avec un **bâtiment construit** (les Barbelés ne comptent pas, sinon « Épines » serait toujours vrai).

| Critère | Bâtiments qui le remplissent |
|---|---|
| **Épines** | Haie d'épines, Mur hérissé, Ronceraie, Ligne de front, Réduit, Baraquement |
| **Renforcé** | Rempart, Bastion, Dortoir, Ronceraie |
| **Technologie** | Antenne, Laboratoire, Observatoire, Archives |
| **Travailleur** | Baraquement, Dortoir, Abri blindé |
| **Bouclier** | Palissade, Égide, Observatoire, Archives, Abri blindé |
| **Piège** | Mine (3 niveaux), Siphon (3 niveaux) |
| **Support** | la pièce recouvre un support de coin |
| **Fusée** | la pièce recouvre la fusée |

**Principes d'équilibre**
1. **Taille = puissance = exigence** : 2 cases → 1 critère, 3 cases → 1 critère, 4 cases → 2 critères, 5 cases → 3 critères.
2. **Des bâtiments différents** pour chaque critère (un même bâtiment ne remplit pas deux critères du même quartier), pour récompenser la
   variété et empêcher de tout faire avec un Dortoir.
3. **Le bonus n'est pas de la même famille que la condition** (sauf pour les plus gros), pour que le quartier pousse à diversifier ses
   bâtiments au lieu de doubler ce qu'on a déjà. Exemple : il faut de la technologie pour obtenir des Épines.
4. **Plafonds** : un bâtiment n'a jamais plus de Renforcé 3 ni plus d'Épines 4 (intrinsèque + quartier). Un bâtiment ne pouvant être que
   dans un seul quartier, deux quartiers ne se cumulent jamais sur lui.
5. **Les critères les plus rares sont réservés aux gros quartiers** : Piège, Support et Fusée demandent soit un bâtiment spécifique, soit un
   emplacement précis, donc ils ne sont jamais le seul critère d'un petit quartier trop facile.

### 4.5 Bonus disponibles (tous fixes)
| Taille | Bonus possibles |
|---|---|
| 2 cases | +1 Épines ; ou un jeton Bouclier (une seule fois, non rendu) |
| 3 cases | +1 Renforcé ; ou +1 travailleur / +1 technologie pour le quartier entier |
| 4 cases | un jeton Bouclier **partagé** rendu à chaque tour de la colonie (la première attaque du tour de l'essaim contre un bâtiment du quartier ne fait rien) ; ou +2 travailleurs / +2 technologies ; ou les tourelles à portée font +1 dégât |
| 5 cases | deux bonus du tableau ci-dessus en même temps |

**Sur la fusée** : un quartier qui la recouvre peut lui donner **Épines X** (l'attaquant subit X dégâts) ou **Renforcé X** (une attaque
d'ATQ ≤ X ne tue aucun travailleur ; aujourd'hui toute attaque contre la fusée en tue un, quelle que soit sa force). **Sur un support** :
le support recouvert ne tombe plus tant que le quartier tient.

### 4.6 Les 10 quartiers (proposition)
Bonus pour **chaque bâtiment dessous**, sauf mention « entier ». Les critères sont ceux de 4.4 (bâtiments construits différents).

| # | Quartier | Forme | Critère(s) | Bonus |
|---|---|---|---|---|
| 1 | **Poste de garde** | 2 en ligne | Technologie | +1 Épines |
| 2 | **Atelier** | 2 en ligne | Renforcé | +1 travailleur (entier) |
| 3 | **Laboratoire central** | 3 en ligne | Piège | +1 technologie (entier) |
| 4 | **Mur d'enceinte** | 3 en L | Travailleur | +1 Renforcé |
| 5 | **Sanctuaire de la fusée** | 3 en L : fusée + 2 bâtiments | Renforcé | la fusée gagne Épines 2 |
| 6 | **Batterie** | 4 en T (recouvre un support) | Support + Épines | le support recouvert ne tombe plus ; ses tirs font +1 dégât |
| 7 | **Zone de recherche** | 4 en éclair | Technologie + Piège | jeton Bouclier partagé, rendu à chaque tour |
| 8 | **Quartier ouvrier** | 4 en ligne | Renforcé + Piège | +2 travailleurs (entier) |
| 9 | **Citadelle** | 4 en carré | Renforcé + Technologie | +1 Renforcé |
| 10 | **Forteresse** | 5 en croix | Renforcé + Épines + Technologie | +1 Épines, +1 Renforcé **et** un jeton Bouclier partagé |

Formes utilisées : domino (×2), trio droit, trio en L (×2), tétromino T, éclair, droit, carré, et la croix de 5 (soit 8 pièces physiques
distinctes à fabriquer).

### 4.7 Risques à surveiller
- **Petits quartiers** : très faciles à poser ; leur bonus doit rester léger, sinon on les enchaîne.
- **Rythme** : un seul quartier par tour, jamais au tour 1 ; le premier devrait arriver vers la manche 3 ou 4.
- **Grands quartiers** : 3 critères pour la Forteresse = une vraie planification ; sa chute (2 cases vides sur 5) est un seuil bas
  pour un tel investissement, à surveiller.
- **Fusée dans un quartier** : elle devient plus difficile à tuer. À tester : Épines 2 sur la fusée fait mal aux aggros (1 à 3 PV).
- **IA** : elle doit chercher les formes réalisables (recherche de polyominos) et les critères ; l'IA de l'essaim doit viser les cases clés.
- **Matériel** : 8 pièces transparentes teintées de 2 à 5 cases, à la taille exacte des cases.

---

## 5. Impact technique prévu (quand on codera)
- État `S.ext` (par module), fixé à la création de la partie, sauvegardé ; `SF.migrate` (anciennes parties : désactivé).
- **Titans** : pioche `S.piles.mythic`, action de pioche payante (2 cartes, on en garde une, l'autre sous la pioche), indicateur
  « arbres terminés ».
- **Quartiers** : pioche de 10 quartiers visible (3 en main toujours), `S.quartiers` (posés), détection de forme (rotations, symétries)
  avec fusée et supports comme cases, critères, pose d'un quartier par tour (jamais en manche 1), contrôle « 2 cases vides » après chaque
  destruction, bonus lus dans `epinesOf`, Renforcé (dont la fusée), `bonusWorkers`, `tech`, `turretDmg`, `checkSupportsFall`.
- **Interface** : interrupteur d'accueil, thème vert acide, cartes de mythiques, pièces transparentes superposées au plateau, infobulles.
- **IA** : plans pour les deux modules. **Stats** : marqueur « extension ». **Tests** : règles dédiées, base inchangée extension éteinte.
- **Livret** : un chapitre d'extension séparé.

## 6. Questions ouvertes
1. **Critères et bonus** (4.4 à 4.6) : cette proposition vous convient-elle ? Principe 2 (bâtiments différents pour chaque critère) et
   principe 3 (le bonus d'une autre famille que la condition) en particulier.
2. **Renforcé sur la fusée** : « une attaque d'ATQ ≤ X ne tue aucun travailleur » est-il le bon sens ? (les tanks à 1 ATQ seraient inoffensifs)
3. **Critère revérifié ?** On ne vérifie le critère qu'à la pose (si le bâtiment qui le remplit tombe ensuite, le quartier reste). À confirmer.
4. **Tirage des 3 quartiers** : tirage purement au hasard, ou possibilité d'échanger un quartier de départ une fois ?
5. **Quartier et support** : un support recouvert « ne tombe plus » tant que le quartier tient. Souhaité, ou trop fort ?
6. **Fusée** : un quartier qui la recouvre exige-t-il toujours des bâtiments autour (au moins un), ou la fusée seule avec un support suffit ?

## 7. Journal des décisions
- **13/11/2026 (Oni)** : extension **hors version de base**, activable sur l'accueil, menu vert acide (jaune orangé sans l'extension). Titans :
  3 arbres terminés, 10 cartes, une seule fois chacune, **15 de biomasse**, **2 cartes on en garde une**, mythique comptée dans le plafond de lane.
- **13/11/2026 (Oni)** : **quartiers** : inter-lane, fusée et supports comptent comme cases, formes de 2 à 5 cases (grand = puissant), un bâtiment
  dans un seul quartier, sans coût mais conditionné, un par tour, bonus fixes, pièces transparentes, Barbelés comptent, **chute quand 2 cases
  de la pièce sont vides en même temps**, 10 quartiers dont 3 piochés au hasard et toujours 3 disponibles, visibles, un quartier tombé retourne
  **en bas de la pioche**, jamais posé au premier tour, certains quartiers donnent de l'Épines ou du Renforcé (fusée comprise).
- **13/11/2026 (Oni)** : l'extension s'appelle **Titans & Quarters**. Tout le travail est sur la branche **`extension`**.
