# Branche `test` — « dégâts du tour : tout ou rien » (analyse, brouillon)

> **Statut : analyse seulement, rien n'est codé.** Branche `test`, partie de `staging` (sans l'extension Titans & Quarters) le
> 13/11/2026. Tout ce qui touche à ce changement vit sur cette branche, jamais sur `staging` ni `main` sans accord d'Oni.
> Objectif de fond (Oni) : **simplifier pour le jeu de plateau**. Compter des PV et des dégâts devient très lourd en fin de partie
> (5 créatures par lane), le jeu ressemble de plus en plus à un jeu vidéo.

## 1. La règle proposée

**Plus aucun point de vie n'est perdu durablement.** Pendant un tour, on cumule les dégâts reçus par chaque bâtiment ou créature (de
**toutes les sources**) ; s'ils **atteignent ses PV** dans le tour, il est détruit ; sinon, ils sont **effacés à la fin du tour**.

- Un bâtiment à 4 PV : il faut **au moins 4 dégâts dans le tour**. Deux créatures d'ATQ 2 qui le frappent le détruisent ; une créature
  d'ATQ 3 seule ne le détruira jamais.
- Une créature à 2 PV : une tourelle qui lui fait 1 dégât ne fait rien ; deux tourelles (ou une tourelle et un sort) dans le même tour la
  détruisent.
- Conséquence : **PV fixes imprimés** (plus de « 2/4 »), seulement un petit marqueur de dégâts temporaire pendant le tour.

### Moment où les dégâts s'effacent (proposition)
| Cible | Dégâts comptés pendant… | Effacés à… |
|---|---|---|
| Bâtiment | le tour de l'essaim (attaques, Percée, Spores) | la fin du tour de l'essaim |
| Créature | le tour de la colonie (tourelles, Feu nourri) | la fin du tour de la colonie |
| Créature | le tour de l'essaim (sorts de réaction, Épines, Mines) | la fin du tour de l'essaim |

Règle de table : **« à la fin de chaque tour, on retire tous les marqueurs de dégâts »**.

---

## 2. Ce que ça change, mécanique par mécanique

| Mécanique | Aujourd'hui | Avec la règle « tout ou rien » |
|---|---|---|
| **Attaque sur bâtiment** | PV perdus durablement | seuil à atteindre dans le tour ; plusieurs attaquants sur le même bâtiment s'additionnent |
| **Renforcé X** (−X par attaque) | inchangé | inchangé, mais **devient beaucoup plus fort** : il s'applique à chaque attaque, donc plusieurs petits attaquants sont tous réduits |
| **Bouclier** (jeton) | annule une attaque | inchangé |
| **Percée** | l'excédent passe derrière | l'excédent = dégâts **au-delà du seuil** de la cible (cumul du tour compris) ; à préciser |
| **Spores** (1 dégât, 8 cases) | érodent les bâtiments voisins | **n'ont plus d'effet durable** : ne détruisent que les bâtiments à 1 PV, ou complètent d'autres dégâts du même tour |
| **Épines / Mines** | usure des attaquants | tuent seulement si le **cumul du tour** atteint les PV de l'attaquant ; aucune usure d'un tour à l'autre (un tank n'est plus jamais « abîmé ») |
| **Tourelles** (1 à 4 / 2 dégâts) | usure des créatures | doivent **se concentrer sur la même cible dans le tour** |
| **Sortilèges de dégâts** | Barrage / Onde de choc : 1 ; Salve : 3 | Barrage et Onde de choc ne tuent que les créatures à 1 PV ; Salve tue ≤ 3 PV ; Frappe orbitale : déjà « détruit » |
| **Soins** (Glaneur, Régénération, sort Réparation) | rendent des PV | **sans objet** : les dégâts disparaissent seuls |
| **Coup de grâce** (Griffes : bâtiment à 1 PV détruit) | bâtiment à 1 PV | **sans objet** (pas de bâtiment « à 1 PV ») |
| **Échappée** | survit à 1 PV | « survit à la destruction et recule » (pas de PV à compter) |
| **Blindage** (jeton) | annule la prochaine perte de PV | « annule la première source de dégâts du tour » |
| **Provocation / Masse vivante** (−1 par tourelle) | réduisent l'usure | **intouchable** : une tourelle de niveau I à 1 dégât ne fait plus rien (à repenser) |
| **Fusée** | une attaque = −1 travailleur | inchangé (pas de PV) |
| **Nuke, Dépouille, Réincarnation, camouflage** | — | inchangés |

### Ce qui disparaît ou se simplifie
- Tout le **code et les règles de soin** (Aura Soin, Régénération, Réparation, Coup de grâce).
- Le suivi des **PV courants** (marqueurs de dégâts permanents, `bonusHp` / `syncBonus` hérités des anciennes versions).
- Le texte « perd X PV » dans les infobulles : on ne parle plus que de **seuil**.

---

## 3. Équilibrage : ce que montrent les chiffres actuels

### 3.1 Bâtiments : combien d'attaquants pour en détruire un ?
(Après Renforcé ; « 1 » = une seule attaque suffit.)

| Famille | Bâtiments | ATQ 3 (Écorcheur) | ATQ 4 | ATQ 5 | ATQ 7 |
|---|---|---|---|---|---|
| **1 PV** | Palissade (+Bouclier), Haie d'épines, Antenne, Baraquement, Mine / Siphon mineurs | 1 | 1 | 1 | 1 |
| **2-3 PV, sans Renforcé** | Laboratoire, Observatoire, Archives, Abri blindé, Égide, Mur hérissé, Mines / Siphons majeurs et supérieurs | 1 | 1 | 1 | 1 |
| **Ronceraie** (2 PV, Renf. 1) | | 1 | 1 | 1 | 1 |
| **Dortoir** (3 PV, Renf. 1) | | **2** | 1 | 1 | 1 |
| **Muraille** (4 PV), **Avant-postes** (4 PV) | | **2** | 1 | 1 | 1 |
| **Rempart** (4 PV, Renf. 1) | | **2** | **2** | 1 | 1 |
| **Bastion** (3 PV, Renf. 2) | | **3** | **2** | 1 | 1 |

**Lecture** : avec les PV actuels, **la plupart des bâtiments tombent déjà en une seule attaque d'ATQ ≥ 3**. La règle ne pénalise donc
l'essaim que sur les **bâtiments à 4 PV ou à Renforcé** (Muraille, Rempart, Avant-postes, Dortoir, Bastion) : il lui faut 2 ou 3
attaquants **sur la même cible dans le tour**. Mais ces bâtiments étaient justement l'usure principale de la colonie (« 4 PV » rongés
sur deux tours) : l'usure disparaît.

**Contrainte de placement** : les attaquants qui frappent le même bâtiment doivent être **adjacents à lui**. Les créatures d'une
**même case** (un bloc) frappent toutes le même bâtiment : les blocs avec soutiens deviennent le moyen de concentrer. Deux lanes ne se
touchent pas, donc on ne concentre pas à travers les lanes.

### 3.2 Créatures : combien de tirs pour les détruire ?
Tourelle de niveau I : 1 dégât (+1 par palier de la fusée, jusqu'à 4) ; niveau II : 2 dégâts.

| Créature | PV | Tirs de niveau I (1 / 2 / 3 / 4 dégâts) | Tirs de niveau II (2) |
|---|---|---|---|
| Écorcheur | 1 | 1 | 1 |
| Ravageur | 2 | 2 / 1 / 1 / 1 | 1 |
| Massacreur, Carapace | 3 | 3 / 2 / 1 / 1 | 2 |
| Béhémoth, Charognard, Perforeur, Hurleur | 4 | 4 / 2 / 2 / 1 | 2 |
| Colosse | 5 | 5 / 3 / 2 / 2 | 3 |
| Sapeur, Sporeur | 6 | 6 / 3 / 2 / 2 | 3 |

**Lecture** : les aggros (1 à 3 PV) tombent facilement ; **les tanks et les gros soutiens (4 à 6 PV) demandent 2 à 3 tourelles ou un
sort dans le même tour**. Or une créature n'est à portée que de **1 ou 2 tourelles** (certaines cases, comme le milieu de la couronne 3,
ne sont à portée d'**aucune**). **Les tanks deviennent quasi intouchables** par les tourelles, surtout avec Provocation et Masse vivante
(−1 chacune).

### 3.3 Effet global attendu
- **Avantage à l'essaim** : plus d'usure par les tourelles, les Épines et les Mines sur ses gros porteurs ; les blocs de tanks avancent.
- **Avantage à la colonie** sur 4 PV / Renforcé : un attaquant isolé n'abîme plus ses murs.
- **Jeu plus tactique, plus simple à compter** : on ne retient que « combien faut-il pour détruire », pas l'état de chaque unité.
- **Risque de blocage** : une colonie bien fournie en murs à 4 PV face à un essaim trop petit ne cède jamais ; le plafond de population par
  lane (2 au palier 1, 3 au palier 2…) limite la concentration au début de partie.

### 3.4 Leviers d'équilibrage à décider
1. **Tourelles plus fortes** : par exemple niveau I à 2 dégâts, niveau II à 3 (et la suppression du « +1 par palier » en parallèle : c'est
   une simplification de plus). Avec 3 dégâts, un tir de niveau II détruit un Massacreur ou une Carapace.
2. **Provocation et Masse vivante** : supprimer le « −1 dégât de tourelle » (il rend les tanks intouchables) ; garder « les tirs et sorts
   visent ce tank ».
3. **PV des bâtiments** : relever les murs (Muraille et Rempart à 5 ?) pour que 2 attaquants d'ATQ 3 soient vraiment nécessaires, ou
   baisser leurs PV pour rendre les murs plus faciles à abattre. À décider en jouant.
4. **Spores** : passer à 2 dégâts ou les rendre « détruit un bâtiment à 1 PV autour de la cible » (plus lisible).
5. **PV des créatures** : une échelle plus resserrée (tanks 3 / 4 / 5 déjà en place ; soutiens à 2 / 4 / 6) reste cohérente.
6. **Soins** : retirer Glaneur « Aura Soin », Régénération, Réparation et Coup de grâce, ou leur donner un nouvel effet (Régénération :
   « tous vos tanks sont immunisés aux Épines » ; Réparation : « un bâtiment est protégé jusqu'à la fin du tour »…).

---

## 4. Impact technique prévu

| Zone | Travail |
|---|---|
| **Moteur** (`engine.js`) | `hp` devient fixe (= PV max) ; un compteur `dmg` par bâtiment et par créature, remis à 0 en fin de tour ; `hitTile` (`dmg += perte`, détruit si `dmg ≥ hp`, excédent de Percée), `damageCreature`, `killCheck`, `fire`, sorts ; retrait de `soinValue`, `bonusHp`, `syncBonus`, Réparation, Coup de grâce ; `migrate` (anciennes parties : `hp = max`, `dmg = 0`). Environ 32 usages de `.hp` et 14 appels à `damageCreature` / `hitTile` à revoir. |
| **Interface** (`ui.js`) | PV fixes affichés (plus de « 2/4 ») ; marqueur « dégâts ce tour » rouge pendant le tour ; aperçu d'attaque (déjà construit) à adapter pour montrer « cumul / seuil » ; infobulles. Environ 19 usages de `.hp`. |
| **IA** (`ia.js`) | **Le point le plus délicat** : un coup qui ne détruit rien n'apporte aucune valeur isolée, donc l'IA ne coordonne plus d'elle-même ; il faut un **crédit partiel** dans l'évaluation (progression vers le seuil pendant le tour) et une logique de **concentration** (tourelles sur la même cible, attaquants sur le même bâtiment). |
| **Serveur / en ligne** | les compteurs de dégâts sont publics (ou nuls hors tour) ; peu de changement. |
| **Tests** | environ 65 vérifications de `.hp` dans `rules.test.js` à réécrire ; la partie IA contre IA servira de contrôle. |
| **Aide / livret** | règles de combat et infobulles à réécrire (beaucoup plus courtes). |

---

## 4 bis. Vue d'ensemble des changements proposés (13/11/2026, après les réponses d'Oni)

### Décisions d'Oni
- Recommandations validées : dégâts effacés à la fin de chaque tour ; Percée = dégâts au-delà du seuil ; soins retirés ; « −1 tourelle » de
  Provocation et Masse vivante supprimé ; dégâts du tour visibles ; PV des bâtiments inchangés pour la première version.
- **Spores : restent à 1 dégât** (elles détruisent les Barbelés et les bâtiments à 1 PV autour de la cible).
- **Tourelles : inchangées** (niveau I : 1 dégât, +1 par palier de la fusée, jusqu'à 4 ; niveau II : 2).
- Principe demandé : **les PV de la créature la plus solide = le maximum de dégâts de 2 tourelles** ; et **progression** : les bâtiments les plus
  durs ne tombent (presque) que devant les meilleures créatures.

### A. Créatures (ATQ / PV)
| | Niveau 1 | Niveau 2 | Niveau 3 | Changement |
|---|---|---|---|---|
| **Aggros** | 3 / 1 | 4 / 2 | 5 / 3 | aucun |
| **Tanks** | 1 / **2** | 2 / 4 | 3 / **6** | Carapace 3 → 2 PV, Colosse 5 → 6 PV |
| **Soutiens** | 0 / 2 | 0 / **3** | 0 / **4** | niveau 2 : 4 → 3 PV, niveau 3 : 6 → 4 PV |

Pourquoi :
- **Tank = 2 × les PV de l'aggro du même niveau** (2 / 4 / 6) : une règle facile à retenir.
- **Deux tourelles (I + II) suivent la progression des tanks** : au départ 1 + 2 = 3 (Carapace 2 ✓), après le palier 3 : 2 + 2 = 4 (Béhémoth 4 ✓),
  après le palier 9 : 4 + 2 = 6 (Colosse 6 ✓). Le plus gros tank tombe exactement devant le maximum de 2 tourelles I + II.
- **Carapace à 2 PV** : devant la fusée (couronne 1), elle est à portée de deux tourelles de niveau I (1 + 1 = 2) : elle ne va plus
  « jusqu'au bout sans rien risquer ». Les Épines 2 (Haie d'épines, Mur hérissé, Ronceraie) la tuent aussi quand elle les attaque.
- **Soutiens plus fragiles** (2 / 3 / 4) : ils ne se battent pas, une seule grosse tourelle ou deux petites doivent pouvoir les abattre.

### B. Bâtiments : l'échelle existe déjà (valeurs inchangées)
Qui détruit quoi **seul, en une attaque** (Renforcé déduit) :

| Attaquant | Bâtiments qu'il détruit seul |
|---|---|
| Tanks (ATQ 1 à 3) | Barbelés et bâtiments à 1 PV ; le Colosse (3) jusqu'à 3 PV |
| **Écorcheur** (ATQ 3) | tout ce qui a 3 PV ou moins sans Renforcé, et la Ronceraie |
| **Ravageur** (ATQ 4) | + **Muraille**, **Avant-postes** (4 PV), **Dortoir** (3 PV, Renforcé 1) |
| **Massacreur** (ATQ 5) | + **Rempart** (4 PV, Renforcé 1), **Bastion** (3 PV, Renforcé 2) |

Les bâtiments à 3 points (Rempart, Bastion) demandent donc un Massacreur, ou plusieurs attaquants de la même case, ou un Hurleur (+2 ATQ).
À revoir plus tard : Ligne de front et Réduit (PV variables selon la couronne), formule du Siphon.

### C. Épines, Mines, sorts : ce qui tue qui (dégâts cumulés pendant le tour de l'essaim)
- **Épines 1** (Barbelé, Baraquement) : tuent l'Écorcheur. **Épines 2** : tuent aussi Ravageur et Carapace. Avec Carnage (2 attaques), les Épines
  comptent deux fois.
- **Mines 1 / 3 / 5** : la Mine supérieure tue tout sauf le Colosse.
- **Sorts de réaction + Épines se cumulent** dans le même tour : Salve (3) + Épines 1 tue un Béhémoth qui attaque ; Barrage ou Onde de choc (1)
  préparent le terrain. **Feu nourri** (2 tirs par tourelle) devient un sort clé.

### D. Améliorations et cartes à revoir
| Carte | Aujourd'hui | Proposition |
|---|---|---|
| **Carapace épaisse** (tank A1) | +1 PV, immunité Épines, −1 Mines | **Insensibles aux Épines et aux Mines** (plus de chiffre ; le +1 PV casserait l'échelle des tourelles) |
| **Provocation** (tank B1) | tirs et sorts redirigés, −1 tourelle | tirs et sorts redirigés (sans le −1, déjà validé) |
| **Blindage** (tank A2) | jeton : annule la prochaine perte de PV | jeton : annule **une source de dégâts**, puis défaussé (inchangé dans l'esprit) |
| **Masse vivante** (tank B2) | −1 tourelle | à remplacer. Proposition : **« Bélier » : +1 ATQ pour les tanks** (ils aident enfin à franchir les seuils) |
| **Griffes** (soutien B1) | Mobilité + Coup de grâce (bâtiment à 1 PV détruit) | Mobilité + **Coup de grâce : s'il ne manque qu'1 dégât à un bâtiment attaqué depuis sa case, il est détruit** |
| **Régénération** (soutien A2) | Aura Soin total | sans objet. Proposition : **les jetons Blindage et Échappée utilisés reviennent au début de chaque tour de l'essaim** |
| **Glaneur** (soutien N1) | Aura Soin 2 | sans objet. Proposition : **Aura Récolte : +1 biomasse quand une créature de sa case détruit un bâtiment** (l'ancien Butin, qui va bien à son nom) |
| **Échappée** (Mue) | survit à 1 PV et recule | survit à la destruction et recule (plus de PV à noter) |
| **Sort Réparation** | rend 3 PV | sans objet. Proposition : **« Tir de précision » : une tourelle fait +2 dégâts ce tour** (aide à concentrer) |
| Férocité, Carnage, Mobilité, Déploiement, Essaim agrandi, Réincarnation, Clairvoyance, Corrosion, Hurleur, Perforeur, Sporeur, Catalyseur, Charognard, Sapeur | — | inchangés (Férocité +1 ATQ, Carnage et Hurleur +2 ATQ deviennent les outils pour franchir les seuils) |

### E. Points d'attention
- **Renforcé X** reste une soustraction par attaque. Piste de simplification pour plus tard : « Blindé X : les attaques d'ATQ ≤ X ne comptent
  pas » (aucun calcul, seulement un filtre).
- **Début de partie** : plafond de 2 créatures par lane ; une Muraille (4 PV) demande alors Écorcheur + Carapace sur la même case (3 + 1).
- **Fusée** : toute attaque tue toujours 1 travailleur, quelle que soit l'ATQ ; les tanks restent donc utiles au contact.

## 5. Questions à trancher avant de coder
1. **Moment d'effacement** des dégâts sur les créatures : à la fin de chaque tour (essaim puis colonie) comme dans le tableau 1 ?
2. **Percée** : l'excédent est-il bien « les dégâts au-delà du seuil de la cible » ? (avec plusieurs attaquants, c'est celui qui franchit
   le seuil qui fait passer l'excédent)
3. **Spores** : passer à 2 dégâts, ou changer d'effet ?
4. **Soins** : tout retirer, ou donner un autre effet aux cartes concernées (Glaneur, Régénération, Réparation, Coup de grâce) ?
5. **Provocation / Masse vivante** : supprimer le « −1 dégât de tourelle » ?
6. **Tourelles** : faut-il relever les dégâts (niveau I = 2, niveau II = 3) en retirant le « +1 par palier » ?
7. **PV des bâtiments** : on garde les valeurs actuelles pour la première version de test, puis on ajuste en jouant ?
8. **Dégâts du tour visibles** de l'adversaire (marqueurs sur le plateau) : oui ?

## 6. Plan de développement proposé (sur la branche `test`)
1. **Moteur** : règle de base + migration, sans toucher aux chiffres.
2. **Interface** : PV fixes, marqueur de dégâts du tour, aperçu d'attaque adapté.
3. **IA** : crédit partiel et concentration des tirs et des attaques ; contrôle par parties IA contre IA.
4. **Tests** de règles réécrits.
5. **Équilibrage** chiffré (leviers 3.4) à partir de parties jouées, puis éventuellement 10 parties IA contre IA sur demande.

## 7. Journal
- **13/11/2026 (Oni)** : recommandations validées sauf Spores (restent à 1) et tourelles (inchangées) ; demande d'une vue d'ensemble des stats (section 4 bis).
- **13/11/2026 (Oni)** : nouvelle règle à tester sur une branche `test` partie de `staging` : un bâtiment ou une créature n'est détruit que si
  les dégâts **du tour** atteignent ses PV (toutes sources cumulées) ; sinon rien ne reste. But : simplifier au maximum pour le jeu de plateau.
