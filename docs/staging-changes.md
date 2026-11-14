# Changements en test (branche staging)

Liste affichée par le bouton « Changements » du jeu (accueil et menu en jeu). Une rubrique `## vX.Y.Z` par version de staging, des puces
dessous. **Vider ce fichier (sauf cet en-tête) quand staging est fusionné dans main** : le bouton disparaît alors.

## v0.6.13
- **Régénération** : plus de retour des jetons. Chaque soutien n'a qu'un seul jeton Échappée (le Blindage ne revient plus non plus).
- **Déploiement** : 1 carte de niveau 1 gratuite en plus (au lieu de 2).

## v0.6.12
- **Régénération = Aura Échappée** : chaque soutien porte un jeton Échappée qui sauve une créature de sa case de la destruction ; il revient au début de chaque tour (le jeton Soin disparaît).

## v0.6.11
- **Régénération** : chaque soutien porte un jeton Soin qui annule la première perte de PV d'une autre créature de sa case ; il revient à chaque tour (avant : un jeton pour toute la case, trop fort).

## v0.6.10
- **Provocation renforcée** (remplace le Bélier) : +1 PV pour les tanks ; les tourelles qui ont un tank à portée doivent le viser en priorité.
- **Régénération = Aura Soin de case** : au début de son tour, l'essaim donne un jeton Blindage à chaque créature qui partage sa case avec un soutien.

## v0.6.9
- Métamorphose : uniquement les aggros et les tanks (plus les soutiens).

## v0.6.8
- **Mue : Aura Métamorphose** à la place de l'Aura Échappée. En fin de tour, chaque soutien peut transformer une autre créature de sa case en la créature de niveau supérieur du même type, à condition que ce niveau soit déjà débloqué. Une fois par soutien et par tour.

## v0.6.7
- Les Barbelés de départ restent à Épines 1.

## v0.6.6
- L'IA de la colonie envoie les créatures chassées par un bâtiment sur une case battue par des tourelles, en priorité.

## v0.6.5
- **Boosts de départ** : chacun des 4 Barbelés de la couronne 1 reçoit au hasard un boost unique (Renforcé 1, Bouclier, Épines +1, +1 PV), perdu avec la tuile.
- **Bâtiment posé sur des créatures** : la colonie choisit la case voisine où les envoyer (au lieu d'un recul automatique).
- Bandeau « FIN DES RÉACTIONS » à la place de l'écran « À vous de jouer » après les réactions de la colonie.

## v0.6.4
- Population max par lane : 4 au plus (palier 4 : 4 au lieu de 5). Les paliers et le nombre de cartes ne changent pas.

## v0.6.3
- Ligne de front et Réduit : 4 PV.
- Tanks : PV 2 / 3 / 4 (Béhémoth 3 au lieu de 4, Colosse 4 au lieu de 6).

## v0.6.2
- **Ligne de front / Réduit** : PV fixes (3) et Épines 2 ; Front uniquement sur la 3e couronne, Réduit sur la 1re.
- **+1 Épines** sur tous les bâtiments qui en avaient (Baraquement 2, Haie 3, Mur hérissé 3, Ronceraie 3).
- Un support qui tombe ne donne plus de biomasse.
- Fusée : le 3e palier d'étages coûte 6 (au lieu de 7).
- « Essaim agrandi » : +2 de population par lane (au lieu de +3).

## v0.6.1
- **Nouvelle règle de combat « tout ou rien »** : un bâtiment ou une créature n'est détruit que si les dégâts du tour (toutes sources cumulées) atteignent ses PV ; sinon ils sont effacés à la fin du tour. Plus de soins.
- Stats : Carapace 1/2, Colosse 3/6, soutiens à 2 / 3 / 4 PV.
- Cartes revues : Carapace épaisse (insensible aux Épines et aux Mines), Provocation (sans −1 tourelle), Masse vivante → Bélier (+1 ATQ des tanks), Coup de grâce (s'il ne manque qu'1 dégât), Régénération (jetons Blindage et Échappée rendus à chaque tour), Glaneur → Aura Récolte (+1 biomasse), Réparation → Tir de précision (premier tir +2).
- Une aggro ou un tank doit avancer d'au moins une case s'il n'y a pas de bâtiment devant lui.
