# Swarm & Steel — journal des versions

Chaque mise à jour livrée reçoit un numéro : +1 au dernier chiffre (0.4.0, 0.4.1, 0.4.2…). Le numéro est affiché dans le jeu (en-tête et accueil) et accompagne chaque partie enregistrée : la page **Statistiques** du site regroupe les résultats par version.

Une partie garde la version à laquelle elle a commencé. Si une mise à jour arrive en cours de partie, la page Statistiques l'indique (« v0.4.0 → v0.4.1 »).

## v0.5.8 — 8 novembre 2026

**Règles (Oni)** : **construction immédiate**, plus d'ateliers. Pendant son tour, la colonie construit ses bâtiments un par un : elle paie d'un coup les points de construction de la tuile avec ses travailleurs et la pose aussitôt sur une case valable. Toujours un bâtiment par lane et par tour (2 au palier 6). Les points non dépensés vont à la fusée. Les points du tour sont fixés au début du tour : un bâtiment ou un support posé ce tour ne donne ses travailleurs qu'au tour suivant.

## v0.5.7 — 8 novembre 2026

**Règles (Oni)**
- **Siphon** : selon la biomasse de l'essaim — mineur 1 + 1 par tranche de 10, majeur 2 + 2 par tranche de 10, supérieur 3 + 3 par tranche de 10 (jamais sous 5).
- **Hurleur** : Aura Fureur = +1 ATQ et +1 PV aux autres créatures de sa case (avant +2 ATQ).
- **Griffes** : ajoute l'Aura Mobilité 1 (comme la Mue).
- **Déploiement** (aggro) : en plus, une fois par tour pendant le déploiement, une aggro en jeu peut être redéployée à l'entrée de n'importe quelle lane.
- **Pioche de l'essaim** : carte par carte, en choisissant la pile à chaque fois (comme la colonie).

**Interface (Oni)**
- Colonie : un seul bouton « Tirer et finir le tour » (tirs restants automatiques).
- Sortilèges : la créature visée se choisit en touchant le jeton sur le plateau.
- Textes raccourcis (améliorations, capacités).

## v0.5.6 — 8 novembre 2026

**Règles (Oni)** : **Férocité** (aggro, rang 1, côté A) donne aussi la **Furtivité** aux aggros : pas de tir de tourelle ni de sortilège sur elles tant qu'une créature non furtive est sur leur case.

## v0.5.5 — 8 novembre 2026

**Règles (Oni)**
- **PV bonus perdus** : quand une créature perd un bonus de PV (soutien de la Mue mort ou parti, créature qui quitte la case, Masse vivante qui diminue), seul son maximum baisse ; une créature blessée garde ses PV (avant : elle perdait 1 PV, et pouvait en mourir).
- **Aura Spores** : les 8 cases autour de la cible, diagonales comprises et toutes lanes (avant : les 4 côtés). Un bâtiment de la couronne 1 attaqué diffuse les spores jusqu'à la fusée (−1 travailleur) ; une attaque sur la fusée les diffuse aux bâtiments qui l'entourent.

## v0.5.4 — 8 novembre 2026

**IA pour jouer en solo (Oni)**
- Accueil : « Solo contre l'IA » → jouer l'essaim ou la colonie ; l'IA joue l'autre camp et fait de son mieux pour gagner.
- IA honnête : elle ne voit que ce que voit un joueur (ni main adverse, ni sortilèges, ni tuiles camouflées, ni ordre des pioches) ; une tuile camouflée inconnue est estimée.
- Évaluation coup par coup : à chaque décision, elle essaie les actions possibles sur une copie, termine le tour avec un jeu par défaut (et, pour la colonie, la riposte probable des créatures en jeu), puis garde la meilleure note.
- Elle joue pas à pas avec les animations ; pas d'écran de passage en solo.
- Statistiques : parties marquées « contre l'IA », masquées par défaut (bouton « Parties contre l'IA »), colonne `ia` dans l'export CSV.

## v0.5.3 — 7 novembre 2026

**Interface (Oni)** : la puissance des pièges apparaît dans leurs capacités : « Mine 1 / 2 / 3 », « Siphon 1 / 2 / 3 » (cartes de tuiles, aide), et sur la tuile posée (vue de la colonie).

## v0.5.2 — 7 novembre 2026

**Colonie (Oni)**
- **Trois pioches de tuiles** : renforts (murs, Épines, Renforcé, camouflés), actifs (face visible, effet direct) et pièges. Au **début** de son tour, la colonie complète sa main **tuile par tuile** en choisissant chaque fois la pioche (nouvelle étape « Pioche de la colonie » ; avant : pioche unique mélangée, en fin de tour). Main vide à la mise en place.
- **Pièges** : Mine mineure / majeure / supérieure (1 / 2 / 3 dégâts) et Siphon mineur / majeur / supérieur (1 / 2 / 3 biomasse) ; 1 / 2 / 3 points et PV ; 2 exemplaires chacun ; ils remplacent le Piège et le Siphon. Un Siphon ne fait plus descendre l'essaim sous **5** biomasse (avant 3).
- **Bouclier** : jeton qui annule la prochaine attaque (comme en stase : percée et spores passent, pas d'Épines), puis défaussé. **Abri blindé** : 2 points, 2 PV, +1 travailleur, Bouclier, face visible, 3 exemplaires.
- **Renouvellement** : chaque tuile défaussée est remplacée par une tuile de la même pioche.
- Parties en cours : le Piège devient Mine supérieure, le Siphon Siphon supérieur ; la pioche est répartie en trois et les nouvelles tuiles y sont ajoutées.

## v0.5.1 — 7 novembre 2026

**Pioche (Oni)** : le palier ne fixe plus que le nombre de cartes (3, 5, 7, 10) ; l'essaim pioche dans n'importe quelle pile qui contient des cartes. Les piles 2 et 3 sont grisées tant qu'elles sont vides (« amélioration de rang 1 / 2 nécessaire »). Panneau et aide : « Cartes à piocher » au lieu de la répartition par niveau.

**Musique (Oni)** : bande originale « Swarm & Steel » en boucle dès l'accueil, qui continue en jeu. Bouton « Musique : oui / non » et réglette de volume en bas à gauche de l'accueil (et de la salle d'attente en ligne) et dans le menu en jeu ; réglages gardés par le navigateur. Les navigateurs bloquent le son tant que la page n'a pas été touchée : la musique démarre alors au premier clic ou à la première touche.

## v0.5.0 — 7 novembre 2026

**Règles (Oni)**
- **Pioche au choix** : le palier donne un nombre de cartes (somme de ses quotas : 3, 5, 7 puis 10) et les niveaux accessibles ; l'essaim choisit combien de cartes il pioche dans chaque pile (niveau 1, 2, 3), les créatures étant tirées au hasard dans la pile (toujours le total exact du palier, sauf si les piles n'ont plus assez de cartes). Le premier tour garde la main de départ imposée, **sans Œil-sonde**.
- **Soutiens parachutés** : n'importe quelle case libre de leur lane (plafond de population inchangé), puis ils se déplacent normalement.
- **Déplacements** : la vitesse est un maximum ; chaque créature avance de 1 case à sa vitesse, au choix, uniquement sur son chemin en escalier vers la fusée (plus de pas de côté ni de retraite) ; elle doit avancer d'au moins 1 case si elle le peut.
- **Attaque facultative** de n'importe quel bâtiment qui touche sa case par un côté (4 côtés), ou de la fusée.
- **Améliorations** : Mobilité = +1 déplacement aux aggros (plus de Furtivité) ; l'Aura Mobilité de la Mue profite aussi au soutien qui la donne ; Provocation = les tanks subissent 1 dégât de moins des tourelles ; Carapace épaisse = +1 PV et plus de dégâts d'Épines pour les tanks ; Réincarnation = le tank revient là où il est mort ; Carnage = les aggros attaquent 2 fois (plus de +2 ATQ).
- **Créatures** : Colosse et Massacreur coûtent 6 (au lieu de 7) ; Catalyseur passe au niveau 1 (0 / 2) ; Hurleur passe au niveau 2 (0 / 4), Aura Fureur +2 ATQ.
- **Champ de stase** : l'attaque fait 0 dégât au bâtiment, mais toute l'attaque passe en percée et les spores touchent les tuiles voisines.

**Interface**
- Écran de pioche : + / − par pile (niveau 1, 2, 3).
- Attaques : toucher une créature montre les cases où elle peut aller et les bâtiments qu'elle peut frapper ; boutons « Ne pas bouger » / « Terminer pour cette créature ». Un seul bouton de fin : **« Tout résoudre et finir le tour »**.
- Parachutage : les cases possibles s'allument quand un soutien est choisi.
- Les mots Nord, Est, Sud, Ouest prennent la couleur de leur lane partout dans le jeu.
- Les parties en cours sont mises à jour (Hurleur et Catalyseur changent de pioche).
- Après une attaque, une créature ne propose plus de cases où aller (avec Carnage, la cible détruite libérait le chemin : impasse corrigée).

## v0.4.28 — 6 novembre 2026

**Interface (Oni)**
- **Réactions** : quand la colonie peut réagir (Famine, sortilèges offensifs), un bandeau « RÉACTIONS ! » traverse l'écran (arrivée par la droite, 1 s au centre, départ par la gauche). Sur un même appareil, plus d'écran de passage pour entrer dans la réaction de la colonie ni pour en sortir (choix d'Oni : l'essaim peut alors voir la main de la colonie). En ligne, le bandeau s'affiche chez les deux joueurs.
- Double flèche du bouton de passage dessinée dans le bouton (elle ne s'affichait pas sur tous les navigateurs) ; bouton de la colonie raccourci en « Construire » (la construction et les tirs sont deux étapes).
- Étapes du tour en chevrons : textes bien plus grands.
- Cartes d'amélioration : plus de rond blanc ; l'icône est en grand, discrète, derrière le texte.

## v0.4.27 — 6 novembre 2026

**Interface (Oni)** : boutons de l'étape (coin du plateau) dans le style de l'accueil ; le bouton principal jaune porte une grande double flèche en fond (dessin d'Oni).

## v0.4.26 — 6 novembre 2026

**Interface (Oni)** : accueil et salle d'attente — le fond est centré sur le contenu (le cercle central du champ de bataille au centre de l'écran) ; le lent travelling zoome sans plus glisser de côté.
- **Salle d'attente** : le logo et le nom du camp choisi (« ESSAIM » ou « COLONIE », en Ethnocentric rendu en image) remplacent ceux du jeu ; « Vous jouez … » reste, sans logo.
- **En partie** : le nom du camp en tête des panneaux (« ESSAIM », « COLONIE ») est dans la police du jeu.
- **Menu en partie** (et page Statistiques) dans le style de l'accueil : emblème et titre du jeu, boutons anguleux en capitales (« Nouvelle partie » / « Quitter » en jaune) ; languette « Menu » agrandie, plus facile à survoler.

## v0.4.25 — 6 novembre 2026

**Interface (Oni)** : salle d'attente en ligne — bouton « Quitter » sous le panneau, dans le style des boutons de l'accueil.

## v0.4.24 — 6 novembre 2026

**Interface (Oni)** : salle d'attente en ligne — boutons « Copier le code » et « Copier le lien ».

## v0.4.23 — 6 novembre 2026

**Interface (Oni)** : la **salle d'attente** en ligne reprend le style de l'accueil (champ de bataille animé, braises, emblème et titre), avec le logo du camp choisi, le code en grand, le lien d'invitation et « En attente de l'adversaire… » ; boutons Règles et Quitter en haut à droite.

## v0.4.22 — 6 novembre 2026

**Interface (Oni)** : écran d'accueil — braises plus discrètes (plus petites, moins lumineuses) qui s'éteignent aux trois quarts de la hauteur de l'écran.

## v0.4.21 — 6 novembre 2026

**Interface (Oni)** : nouvel **écran d'accueil** façon jeu vidéo : champ de bataille en plein écran (lent travelling, braises, brume), emblème du jeu et titre « SWARM & STEEL » en blanc (police Ethnocentric, livrée en image fixe comme le permet sa licence), accroche, et menu massif (nouvelle partie ou reprise, en ligne, mode découverte, statistiques ; règles et thème en haut à droite).

## v0.4.20 — 6 novembre 2026

**Interface (Oni)** : nouvel **écran de victoire** sur PC, avec le cadre illustré du camp gagnant : « VICTOIRE », puis « La fusée décolle, la colonie est sauvée ! » ou « L'essaim a décimé la colonie ! », et le bouton « Rejouer » (plaque jaune ou orbe). Même animation d'apparition que l'écran de passage.

## v0.4.19 — 6 novembre 2026

**Règles (Oni)**
- **Glaneur** : il perd son Aura Mobilité 1 et sa vitesse de 2 (1 case par tour) ; il garde l'Aura Soin 2.
- **Tout résoudre automatiquement** : les soutiens agissent en premier ; les créatures parties de la même case les suivent et profitent encore de leurs auras quand elles attaquent.
- **Support de niveau 3** : retour à **+2 travailleurs**.

## v0.4.18 — 6 novembre 2026

**Correction (Oni)** : sur un ordinateur réglé pour « réduire les animations », les animations CSS (arrivée et départ de l'écran de passage, halo des étapes, bouton qui pulse…) restaient coupées même avec « Animations : oui » dans le jeu. Elles suivent maintenant le bouton du jeu (toujours « non » par défaut sur ces ordinateurs).

**Écran de passage (Oni)** : la carte apparaît en zoom de 0,5 à 1 avec une opacité progressive (0,3 s, cubic-bezier(0.64, 0, 0.78, 0)), et disparaît à l'inverse.

## v0.4.17 — 6 novembre 2026

**Règles (Oni)**
- **Créatures de niveau 3** (Massacreur, Colosse, Sapeur, Sporeur) : **2 cases de base** par tour (au lieu d'1) ; la Mobilité et les Auras Mobilité s'ajoutent.
- **Pioche automatique** au début du tour de l'essaim.
- **Déploiement et améliorations dans la même étape** : l'essaim répartit sa biomasse comme il veut entre cartes et améliorations, dans l'ordre qu'il veut ; « Passer aux attaques » termine l'étape (le budget restant va à la réserve).

**Interface (Oni)**
- **Arbres d'amélioration** redessinés en cartes (icône ronde, côté, nom, effet, barre « 2/6 ») ; toucher une carte ouverte y investit tout ce qui est possible, « +1 » pour investir un point.
- **Pastilles d'effet** des soutiens : « +1 ATQ », « +1 DEF », « +2 HEAL », « +1 MOV »… sur les cartes en main et sur le jeton quand il est seul sur sa case (le jeton qui en profite affiche le total en violet).
- **Aucun texte sous 1rem** (16 px) dans toute l'application.
- Avant-postes abrégés « Poste N / E / S / O » sur le plateau.
- **Écran de passage** : nouveaux cadres illustrés d'Oni (essaim : bouton sur l'orbe ; colonie : bouton sur la plaque jaune), avec la biomasse de l'essaim ou les travailleurs de la colonie ; arrivée et départ en 0,3 s avec une opacité progressive.
- Téléphone : le minimum de 1rem ne s'applique pas encore dans les cases du plateau (trop petites), en attendant la version mobile.
- **Logos des camps** (Oni) en haut des panneaux, et en filigrane très grand dans le fond, coupé par le bord côté plateau.
- **Cartes d'amélioration** : visage d'une créature du niveau débloqué derrière l'icône (rang 1 : niveau 2, rang 2 : niveau 3).
- **Mains** : l'illustration occupe la moitié de la carte, en fondu progressif (à droite pour les créatures de l'essaim, à gauche pour les tuiles de la colonie).

## v0.4.16 — 6 novembre 2026

**Règles (Oni, après test)**
- **Déplacement automatique** : pendant les attaques, l'essaim choisit quelle créature agit en la touchant (cadre jaune) ; elle avance seule vers la fusée sur son chemin, tout droit ou en escalier (1 case, 2 avec la Mobilité ou un Glaneur), puis attaque le bâtiment ou la fusée devant elle. Plus de déplacement libre (côté, retraite) ni de choix de la cible. « Tout résoudre automatiquement » reste.
- **Support de niveau 3** (couronne 3) : **+3 travailleurs** (au lieu de +2).

**Correction (téléphone)** : quand plusieurs créatures partagent une case, leurs jetons se rangent en grille carrée dans la case (comme sur PC) ; avant, certains dépassaient et ne pouvaient pas être touchés.

## v0.4.15 — 6 novembre 2026

**Correction (Oni)** : une case où l'on peut agir (déplacement d'une créature, déploiement, pose d'un bâtiment, cible d'attaque) reçoit le clic même quand des créatures la remplissent ; avant, le clic tombait sur le jeton. Toucher à nouveau la créature choisie la relâche, pour pouvoir en choisir une autre.

## v0.4.14 — 6 novembre 2026

**Interface PC (Oni, d'après ses maquettes)** : sur un écran d'au moins 1100 px de large, nouvelle mise en page « jeu PC ». L'affichage sur téléphone et tablette ne change pas. Aucune règle modifiée.
- Plateau sur toute la hauteur de l'écran ; la colonie toujours à gauche, l'essaim toujours à droite ; le camp qui joue a son panneau complet, l'adversaire un résumé (améliorations de l'essaim en grosses icônes). La page ne défile plus : la main, les arbres et le journal défilent dans le panneau.
- Menu du haut escamotable : il descend par-dessus le jeu quand la souris touche le haut de l'écran.
- Manche et camp qui joue affichés dans les angles vides du haut du plateau ; bouton de fin d'étape (jaune) dans l'angle vide du bas, côté joueur.
- Étapes du tour en chevrons (l'étape en cours a un halo qui pulse doucement) et consigne courte en bas du panneau ; l'explication complète est au survol du « i ».
- Pendant le déploiement, l'essaim voit « biomasse disponible / budget du tour ». Fusée horizontale (12 étages).
- Tuiles : nom en haut, PV au centre, capacités en bas, en plus gros. Supports : icône et dégâts agrandis. Repère de portée des tourelles sur les cases visées.
- Créatures : jetons carrés qui remplissent la case et rétrécissent avec leur nombre ; attaque et PV en gros ; icône d'aura en haut à droite (blanche sur le soutien qui la donne, violette sur les créatures qui en profitent). Un clic sur une créature ouvre sa fiche à côté de son jeton ; un clic ailleurs la ferme.
- Cartes de créatures en main : mots-clés seulement, détail au survol. Info-bulles qui suivent le thème clair / sombre.
- Écran de passage : la partie en fond, assombrie ; la carte arrive du côté du joueur et repart de l'autre côté.

## v0.4.13 — 5 novembre 2026

**Équilibrage (Oni)**
- **Glaneur** : **Aura Soin 2** (au lieu de 1). Il donne toujours +1 case aux autres créatures de sa case, et fait lui-même 2 cases.
- **Mue** (soutien, côté A) : tous les soutiens gagnent l'**Aura Mobilité 1** (+1 case aux autres créatures de leur case) et gardent l'Aura +1 PV. Ils **perdent la Furtivité**. Les auras se cumulent : un Glaneur avec la Mue donne +2 cases.
- **Mobilité** (aggro, côté B) : en plus des 2 cases par tour, les aggros gagnent la **Furtivité** (pas de tir de tourelle ni de sortilège sur elles tant qu'une créature non furtive est sur leur case).

## v0.4.12 — 4 novembre 2026

**Règle (Oni)** : quand l'essaim acquiert **Clairvoyance**, les Œil-sonde de la pioche sortent du jeu. Ceux en main ou sur le plateau restent jouables, mais ne reviennent plus dans la pioche (carte non jouée, créature morte, Nuke).

**Interface** : au survol d'un étage de la fusée (résumé de la colonie et panneau de la colonie), la bulle indique son avancement, par exemple « Étage 5 : 1/4 travailleurs » (« achevé » pour les étages déjà construits).

## v0.4.11 — 4 novembre 2026

Aide pour les nouveaux joueurs, sans changement de règles.

- **Règles par camp** : le bouton « Règles » ouvre trois onglets.
  - **Essaim** : objectif, ressources, paliers, déroulé du tour, créatures, améliorations, menaces.
  - **Colonie** : objectif, ressources, déroulé du tour, fusée, supports, bâtiments, sortilèges, menaces.
  - **Commun** : plateau, manche, combat, informations cachées, jeu en ligne.

  Les tableaux (paliers, créatures, bâtiments, sortilèges, améliorations) et les chiffres sont générés depuis le moteur : ils suivent chaque changement de règle.
- **Mode découverte** (accueil, ou fenêtre des règles) : un conseil s'affiche la première fois que chaque situation se présente, selon le camp joué. Il y a 13 conseils pour l'essaim et 13 pour la colonie (déployer, attaquer, tuiles camouflées, Épines, tourelles, chantiers, fusée, pose, tirs, sortilèges…). « Compris » le range, « Arrêter les conseils » coupe le mode, et « Revoir tous les conseils » les remet à zéro.
- Les parties jouées en mode découverte sont marquées « découverte » dans les statistiques et l'export CSV.
- Texte de la Mobilité mis à jour : il évoquait encore les blocs.

## v0.4.10 — 4 novembre 2026

Correctif d'affichage : l'illustration de la fusée n'apparaissait pas sur sa case en mode sombre (le fond uni du thème la masquait). Elle s'affiche maintenant dans tous les thèmes.

## v0.4.9 — 4 novembre 2026

Interface seulement : illustration de la **Palissade** ; tous les bâtiments ont maintenant leur image.

## v0.4.8 — 4 novembre 2026

**Règles (Oni) : déplacements au choix**
- Les créatures ne se déplacent plus toutes seules. L'essaim choisit, pour **chaque créature**, où elle va : n'importe quelle case voisine de sa lane, sans diagonale (vers la fusée, sur le côté ou **en retraite** jusqu'aux entrées). Une créature fait 1 case (2 avec la Mobilité ou un Glaneur).
- Ensuite, l'attaque est **facultative** : la créature peut frapper **le bâtiment de son choix** parmi ceux qui touchent sa case, ou la fusée. Après une attaque, elle ne bouge plus.
- Les créatures d'une même case ne bougent plus ensemble, et il n'y a plus d'ordre imposé (les plus proches de la fusée d'abord).
- Le bouton **Fin du tour** revient pour l'essaim, puisqu'on peut choisir d'attendre. Le tour passe aussi tout seul quand plus aucune créature ne peut agir.
- « **Tout résoudre automatiquement** » joue les créatures restantes comme avant : elles avancent sur le chemin, puis attaquent ce qui est devant elles.
- La Percée envoie toujours ses dégâts en trop à la case suivante du chemin, après le bâtiment détruit.

**Interface** : touchez une créature, puis une case surlignée pour la déplacer, ou une cible encadrée de rouge pour attaquer (aussi en boutons dans l'encadré de l'étape).

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
