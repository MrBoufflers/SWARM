# Changements en test (branche staging)

Liste affichée par le bouton « Changements » du jeu (accueil et menu en jeu). Une rubrique `## vX.Y.Z` par version de staging, des puces
dessous. **Vider ce fichier (sauf cet en-tête) quand staging est fusionné dans main** : le bouton disparaît alors.

## v0.5.22
- Nouveau bouton « Changements » (accueil et menu en jeu) : liste de ce qui est sur le staging et pas encore sur main.

## v0.5.23
- Règle : au premier tour de la colonie, un seul bâtiment au total (les points restants vont à la fusée).

## v0.5.24
- Phéromone : plus d'Aura Butin (+1 biomasse), remplacée par Dépouille — une créature morte sur sa case laisse un jeton qui bloque la construction jusqu'à ce qu'une tourelle à portée tire dessus.

## v0.5.25
- La Phéromone s'appelle maintenant Charognard (même effet : Dépouille).
- Les jetons Dépouille sont dégagés par la Nuke, et par les sortilèges Barrage (sa lane) et Onde de choc (sa couronne).
- Correctif : le résumé « Sur cette case » est visible dès qu'on sélectionne une créature (avant, seulement après son déplacement).

## v0.5.26
- Échappée (Mue) : chaque soutien a un jeton qui ne sauve qu'une seule créature, puis il est défaussé (plus de limite par tour).

## v0.5.27
- Percée : les dégâts en trop passent derrière la cible, du côté opposé à l'attaquant (plus toujours vers la fusée).

## v0.5.28
- Sporeur : ses spores font 1 dégât (au lieu de 2) par Sporeur sur les 8 cases autour de la cible.

## v0.5.29
- Renforcé X : −X dégâts à chaque attaque, sans minimum. Valeurs réduites de 1 (Rempart 1, Bastion 2, Dortoir 1, Ronceraie 1).
- Avant-postes : toujours 4 PV, mais seulement dans leur propre lane.

## v0.5.30
- Paliers de biomasse : au survol de la biomasse ou du palier, tous les paliers et ce qu'ils apportent.
- Infobulles sur toutes les icônes des bâtiments du plateau (Épines, Renforcé, tech, Mines, Siphons, Bouclier, supports, fusée…).
- Aperçu de la résolution d'une attaque au survol d'un bâtiment (créature choisie) : PV en rouge, Percée, Spores, Épines, Bouclier, Renforcé.
- Nouvelle icône de construction : travailleur avec clé à molette (à la place du sablier).
- Pastille NEW sur ce que l'adversaire a posé à son dernier tour.

## v0.5.31
- La pastille NEW est verticale, en haut à gauche (ne cache plus les noms).

## v0.5.32
- Correctif : les bâtiments camouflés (vue colonie) remplissent de nouveau toute leur case.

## v0.5.33
- La pastille NEW devient un petit rond jaune avec un « N » centré.

## Branche test : dégâts du tour « tout ou rien »
- Une créature ou un bâtiment n'est détruit que si les dégâts du tour (toutes sources) atteignent ses PV ; sinon ils sont effacés à la fin du tour.
- Stats : Carapace 1/2, Colosse 3/6, soutiens 2 / 3 / 4 PV. Plus aucun soin.
- Cartes revues : Carapace épaisse, Provocation, Bélier (ex-Masse vivante), Coup de grâce, Régénération, Glaneur (Aura Récolte), Tir de précision (ex-Réparation).
