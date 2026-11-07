// Swarm & Steel — aide de jeu : fiches de règles par camp (bouton « Règles ») et conseils du mode découverte.
// Les chiffres (coûts, paliers, dégâts…) sont lus dans le moteur (SF) : les textes suivent les changements de règles.
// Aucun accès direct au DOM : l'interface (ui.js) fournit les petites fonctions d'affichage h = { E, icon, imCls }.
"use strict";
const AIDE = (() => {
  const list = a => a.join(", ").replace(/, ([^,]*)$/, " et $1");
  const plural = (n, s, p) => `${n} ${n > 1 ? (p || s + "s") : s}`;

  // ------------------------------------------------------------------ fiches de règles
  function tiersTable(h) {
    const rows = SF.TIERS.map((t, i) => `<tr><td>${i + 1}</td><td>${i ? t.min + " et plus" : "départ"}</td><td>${SF.tierCards(i)}</td><td>${t.cap}</td></tr>`).join("");
    return `<table class="rt"><thead><tr><th>Palier</th><th>Biomasse</th><th>Cartes à piocher</th><th>Créatures max par lane</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  function creaturesTable(h) {
    const rows = Object.entries(SF.CREATURES).map(([n, c]) => `<tr><td><span class="rt-n">${c && h.imCls(n) ? `<i class="rt-img ${h.imCls(n)}"></i>` : ""}<b>${h.E(n)}</b></span></td><td>${c.type}</td><td>${c.lvl}</td><td>${c.cost}</td><td>${c.pv}</td><td>${c.atq}</td><td>${c.cap ? `<b>${h.E(c.capName)}</b> : ${h.E(c.capText)}` : "—"}</td></tr>`).join("");
    return `<div class="rt-wrap"><table class="rt"><thead><tr><th>Créature</th><th>Type</th><th>Niv.</th><th>Coût</th><th>PV</th><th>ATQ</th><th>Capacité</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function tilePv(t) { return t.pv === "ap" ? "2 (4 dans sa lane)" : t.pv === "front" ? "1 + couronne" : t.pv === "reduit" ? "5 − couronne" : t.pv; }
  function tilesTable(h) {
    const rows = Object.entries(SF.TILES).map(([n, t]) => {
      const caps = [];
      if (t.camo) caps.push("camouflée");
      if (t.ep) caps.push(`Épines ${t.ep}`);
      if (t.ren) caps.push(`Renforcé ${t.ren}`);
      if (t.tech) caps.push(`+${t.tech} technologie${t.tech > 1 ? "s" : ""}`);
      if (t.temp) caps.push("+1 travailleur");
      if (t.trap) caps.push(`mine (${t.trap} dégât${t.trap > 1 ? "s" : ""})`);
      if (t.shield) caps.push("Bouclier");
      if (t.siphon) caps.push(`Siphon (−${t.siphon} biomasse)`);
      if (t.aura) caps.push("Aura d'épines");
      return `<tr><td><span class="rt-n">${h.imCls(n) ? `<i class="rt-img ${h.imCls(n)}"></i>` : ""}<b>${h.E(n)}</b></span></td><td>${t.d}</td><td>${tilePv(t)}</td><td>${h.E(caps.join(" · ") || "—")}</td><td>${t.n}</td></tr>`;
    }).join("");
    return `<div class="rt-wrap"><table class="rt"><thead><tr><th>Bâtiment</th><th>Points</th><th>PV</th><th>Capacités</th><th>Ex.</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function spellsTable(h) {
    const rows = Object.entries(SF.SPELLS).map(([n, s]) => `<tr><td><b>${h.E(n)}</b></td><td>${s.kind === "off" ? "offensif" : "soutien"}</td><td>${h.E(s.text)}</td><td>${s.n}</td></tr>`).join("");
    return `<div class="rt-wrap"><table class="rt"><thead><tr><th>Sortilège</th><th>Type</th><th>Effet</th><th>Ex.</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function treesList(h) {
    const POS = { A1: "rang 1, côté A", B1: "rang 1, côté B", A2: "rang 2, après A", C2: "rang 2, centre", B2: "rang 2, après B" };
    return ["aggro", "tank", "soutien"].map(ty => `<h5>${h.icon(ty)} Arbre ${ty}</h5><ul>${["A1", "B1", "A2", "C2", "B2"].map(s => `<li><b>${h.E(SF.TREES[ty][s][0])}</b> (${POS[s]}) : ${h.E(SF.TREES[ty][s][1])}</li>`).join("")}</ul>`).join("");
  }
  const F = SF.FLOOR_COSTS;

  function common(h) {
    return `
      <h3>Le jeu en bref</h3>
      <p>Swarm &amp; Steel oppose deux camps asymétriques. La <b>colonie</b> défend sa fusée au centre du plateau et doit en achever les <b>${SF.FLOORS} étages</b>. L'<b>essaim</b> attaque depuis les bords : il gagne s'il tue <b>tous les travailleurs</b> de la colonie (une créature qui frappe la fusée tue 1 travailleur).</p>
      <h3>Le plateau</h3>
      <ul>
        <li>Une grille de 9 × 9 cases, la fusée au centre. Quatre <b>lanes</b> en partent : Nord, Est, Sud, Ouest (couleurs bleue, verte, jaune, violette).</li>
        <li>Autour de la fusée, trois <b>couronnes</b> (1 au contact de la fusée, 3 au bord). Au-delà, les <b>cases d'entrée</b> de chaque lane, colonnes A à E : c'est là que l'essaim déploie ses créatures.</li>
        <li>Les cases en diagonale de la fusée (les coins) accueillent les <b>supports</b> de la colonie ; les créatures n'y vont jamais.</li>
        <li>Au départ, ${plural(16, "Barbelé")} (1 PV, Épines 1) couvrent les couronnes 1 et 2, et les supports de niveau 1 et 2 sont déjà en place.</li>
      </ul>
      <h3>Une manche</h3>
      <p>L'essaim joue d'abord, puis la colonie. La colonie peut jouer certains sortilèges pendant le tour de l'essaim (fenêtres de réaction).</p>
      <h3>Combat</h3>
      <ul>
        <li><b>ATQ</b> : dégâts infligés par une attaque. <b>PV</b> : points de vie ; à 0, la créature ou le bâtiment est détruit.</li>
        <li><b>Épines X</b> : une créature qui attaque ce bâtiment subit X dégâts après son attaque. +1 par Avant-poste dans les 8 cases autour.</li>
        <li><b>Renforcé X</b> : le bâtiment perd 1 PV par tranche complète de X dégâts d'une même attaque (7 dégâts contre Renforcé 2 : −3 PV).</li>
        <li><b>Camouflage</b> : certains bâtiments sont posés face cachée. L'essaim ne voit ni leur nom ni leurs PV tant qu'il ne les a pas attaqués (ou révélés avec un Œil-sonde ou la Clairvoyance). Une <b>Mine</b> camouflée inflige 1, 2 ou 3 dégâts (mineure, majeure, supérieure) à la créature qui la révèle, avant qu'elle frappe ; un <b>Siphon</b> retire 1, 2 ou 3 biomasse à l'essaim (jamais sous ${SF.MIN_BIOMASS}). Une tuile encore cachée ne subit ni la percée ni les spores.</li>
        <li><b>Percée</b> (Aura du Perforeur) : les dégâts en trop après la destruction d'un bâtiment passent à la case suivante du chemin vers la fusée.</li>
        <li><b>Auras</b> : effets des soutiens sur les <b>autres</b> créatures de leur case ; elles se cumulent toutes.</li>
      </ul>
      <h3>Informations cachées</h3>
      <p>Chaque camp ne voit pas la main de l'autre. En partie sur un seul appareil, un écran de passage s'affiche à chaque changement de camp : passez l'appareil.</p>
      <h3>Jouer en ligne</h3>
      <p>Créez une partie en choisissant votre camp et donnez le code (ou le lien) à votre adversaire. Chaque joueur ne reçoit que ce que son camp a le droit de voir. Vous pouvez recharger la page : la partie reprend.</p>
      <h3>Mode découverte</h3>
      <p>Activé sur l'accueil ou ici, il affiche un conseil la première fois que chaque situation se présente, selon le camp que vous jouez. « Compris » le range ; il ne revient plus.</p>`;
  }

  function essaim(h) {
    return `
      <h3>Votre objectif</h3>
      <p>Tuer <b>tous les travailleurs</b> de la colonie avant qu'elle n'achève sa fusée. Chaque attaque contre la fusée tue 1 travailleur. La colonie en gagne 1 à chaque étage : frappez vite et souvent.</p>
      <h3>Vos ressources</h3>
      <ul>
        <li><b>Biomasse</b> : vous commencez avec 5. Elle n'est jamais dépensée : chaque tour, votre <b>budget</b> est égal à votre biomasse. Elle augmente de 1 par bâtiment détruit et par support tombé.</li>
        <li><b>Réserve</b> : le budget non dépensé à la fin du déploiement y est versé ; elle ne sert qu'aux améliorations.</li>
        <li><b>Paliers</b> : votre biomasse fixe votre pioche et le nombre maximum de créatures par lane.</li>
      </ul>
      ${tiersTable(h)}
      <h3>Votre tour</h3>
      <ol>
        <li><b>Pioche au choix</b> : votre palier vous donne seulement un nombre de cartes ; vous choisissez combien de cartes piocher dans chaque pile (niveau 1, 2, 3) ; les créatures sont tirées au hasard dans la pile, qui mélange les types débloqués par vos améliorations (les piles 2 et 3 restent vides sans amélioration de rang 1 ou 2). <b>Premier tour</b> : à la place, vous recevez un Écorcheur, une Carapace et un soutien de niveau 1 tiré au hasard (jamais un Œil-sonde).</li>
        <li><b>Déploiement et améliorations</b> (une seule étape) : répartissez votre biomasse comme vous voulez, dans l'ordre que vous voulez. <b>Déployer</b> : choisissez une carte, puis une case d'entrée (A à E) d'une lane — un <b>soutien</b> peut être parachuté sur n'importe quelle case libre d'une lane ; payez son coût, en respectant le maximum de créatures de la lane. <b>Améliorer</b> : investissez dans un nœud d'amélioration (voir plus bas). Le budget du tour est dépensé en premier, puis la réserve ; ce qui reste du budget va à la réserve. Les cartes non jouées retournent dans la pioche.</li>
        <li><b>Réaction de la colonie</b> : si elle tient un sortilège offensif, elle peut le jouer maintenant.</li>
        <li><b>Attaques</b> : pour chaque créature, dans l'ordre que vous voulez :
          <ul>
            <li><b>Déplacement</b> : elle avance sur son chemin vers la fusée, tout droit ou en escalier, sans diagonale, de <b>1 case jusqu'à son maximum</b>, au choix (1 case, 2 pour les créatures de niveau 3, +1 avec la Mobilité ou la Mue). Elle s'arrête devant un bâtiment ou la fusée. Si elle peut avancer, elle doit avancer d'au moins une case.</li>
            <li><b>Attaque, facultative</b> : elle frappe n'importe quel bâtiment qui touche sa case par un côté, ou la fusée. Avec Carnage, une aggro peut attaquer deux fois. Les soutiens n'attaquent jamais.</li>
          </ul>
          Touchez une créature, puis une case surlignée de son chemin, puis une cible encadrée (ou « Terminer pour cette créature »). « Tout résoudre et finir le tour » fait agir toutes les créatures restantes (elles avancent au maximum et frappent devant elles), puis termine le tour.</li>
        <li><b>Fin du tour</b> : les auras de soin agissent.</li>
      </ol>
      <h3>Vos créatures</h3>
      <ul>
        <li><b>Aggros</b> : grosse attaque, 1 PV. Elles meurent vite sur les Épines.</li>
        <li><b>Tanks</b> : beaucoup de PV, 1 ATQ. Ils encaissent les Épines et les tirs.</li>
        <li><b>Soutiens</b> : ils n'attaquent jamais, mais leurs <b>auras</b> renforcent les <b>autres</b> créatures de leur case ; toutes les auras se cumulent.</li>
        <li><b>Vitesse</b> : 1 case par tour, 2 pour les créatures de niveau 3 ; avec la Mue, chaque soutien donne +1 case à toutes les créatures de sa case, lui compris ; la Mobilité donne +1 case aux aggros. Le nombre de déplacements est fixé au premier pas du tour. En résolution automatique (« Tout résoudre »), les soutiens agissent en premier : les créatures parties de la même case les suivent et profitent encore de leurs auras quand elles attaquent.</li>
      </ul>
      ${creaturesTable(h)}
      <h3>Améliorations</h3>
      <p>Trois arbres (aggro, tank, soutien). <b>Rang 1</b> : ${SF.COST_R1} biomasse, un choix sur deux, et les cartes de niveau 2 de ce type rejoignent votre pioche. <b>Rang 2</b> : ${SF.COST_R2} biomasse, un choix sur trois (le côté du rang 1 choisi, ou le centre), et les cartes de niveau 3 arrivent. Un nœud se paie en plusieurs fois ; commencer à investir dans un nœud ferme les autres choix du même rang.</p>
      ${treesList(h)}
      <h3>Ce qui vous menace</h3>
      <ul>
        <li><b>Épines</b> des bâtiments, <b>pièges</b> et <b>Siphons</b> camouflés.</li>
        <li><b>Tourelles</b> : à la fin de son tour, chaque support de niveau 1 ou 2 tire sur une créature des 8 cases qui l'entourent.</li>
        <li><b>Sortilèges</b> de la colonie : dégâts, Champ de stase, Brouillage, et Famine (votre budget divisé par 2 au début de votre tour).</li>
        <li><b>Nuke</b> : quand la fusée atteint l'étage 9, toutes vos créatures sont détruites.</li>
      </ul>`;
  }

  function colonie(h) {
    return `
      <h3>Votre objectif</h3>
      <p>Achever les <b>${SF.FLOORS} étages</b> de la fusée. Vous perdez si l'essaim tue tous vos travailleurs : chaque attaque contre la fusée en tue 1.</p>
      <h3>Vos ressources</h3>
      <ul>
        <li><b>Travailleurs</b> : 3 au départ, +1 par étage achevé, +1 par bâtiment à travailleur temporaire encore debout, +${SF.SUP3_WORKERS} par support de niveau 3. Chaque travailleur donne <b>1 point de construction</b> par tour.</li>
        <li><b>Main de tuiles</b> : 4 tuiles, +1 à chaque palier de la fusée (étages 3, 6 et 9). Vous la complétez au début de votre tour, tuile par tuile, en choisissant à chaque fois la pioche : <b>renforts</b> (murs, Épines, Renforcé, camouflés), <b>actifs</b> (face visible : technologies, travailleurs, Avant-postes) ou <b>pièges</b> (Mines et Siphons).</li>
        <li><b>Bouclier</b> (Abri blindé) : la première attaque contre le bâtiment ne lui fait rien (comme en stase), puis le jeton est défaussé.</li>
        <li><b>Technologies</b> : à 3, 6 et 9 technologies, vous piochez 1, 2 ou 3 sortilèges à la fin de chaque tour. Elles viennent des bâtiments à technologies et du palier de l'étage 3 (+2).</li>
      </ul>
      <h3>Votre tour</h3>
      <ol>
        <li><b>Sortilèges de soutien</b> : jouez ceux que vous voulez.</li>
        <li><b>Chantiers</b> : touchez une tuile de votre main, puis un atelier (une lane). Le chantier demande autant de points que la durée de la tuile. Un chantier par lane (deux après l'étage 6). Juste assez de travailleurs y sont assignés d'office.</li>
        <li><b>Répartition</b> : ajustez les points de chaque atelier avec + / −. Les points non utilisés vont à la <b>fusée</b>, de même que les points en trop d'un atelier.</li>
        <li><b>Construire</b> : les chantiers avancent. Un bâtiment achevé se <b>pose</b> sur une case libre de sa lane qui touche un bâtiment, un support ou la fusée (sans diagonale). Les créatures présentes reculent d'une case. S'il n'y a aucune case possible, la tuile revient en main.</li>
        <li><b>Supports et fusée</b> : les nouveaux supports apparaissent, puis la fusée gagne ses étages.</li>
        <li><b>Tirs</b> : touchez une tourelle surlignée, puis une créature surlignée (ou « Tirs automatiques »). « Terminer le tour » fait tirer les tourelles restantes. Le tour passe seul quand plus aucune tourelle ne peut tirer.</li>
        <li><b>Pioche</b> de tuiles et de sortilèges.</li>
      </ol>
      <h3>La fusée</h3>
      <ul>
        <li>Un étage coûte <b>${F[0]} points</b> (étages 1 à 3), puis ${F[1]} (4 à 6), ${F[2]} (7 à 9) et ${F[3]} (10 à 12). Les points en trop passent à l'étage suivant. Chaque étage donne <b>+1 travailleur</b>.</li>
        <li><b>Étage 3</b> : +2 technologies. <b>Étage 6</b> : +1 chantier par lane. <b>Étage 9</b> : la <b>Nuke</b> détruit toutes les créatures. Chaque palier (3, 6, 9) donne aussi +1 tuile en main et +1 dégât aux tourelles de niveau 1.</li>
        <li><b>Étage 12</b> : décollage, vous gagnez.</li>
      </ul>
      <h3>Les supports</h3>
      <ul>
        <li>Ils apparaissent tout seuls sur un coin dès que ses <b>2 bâtiments côté fusée</b> sont posés, et tombent quand <b>tous</b> les bâtiments qui le touchent ont disparu (l'essaim gagne alors 1 biomasse).</li>
        <li><b>Niveau 1</b> (couronne 1) : tourelle, 1 dégât (+1 par palier de la fusée). <b>Niveau 2</b> (couronne 2) : tourelle, 2 dégâts. <b>Niveau 3</b> (couronne 3) : pas de tir, +${SF.SUP3_WORKERS} travailleurs.</li>
        <li>Une tourelle tire une fois par tour (deux avec Feu nourri) sur une créature des <b>8 cases</b> qui l'entourent, diagonales comprises.</li>
      </ul>
      <h3>Vos bâtiments</h3>
      <p>« Points » : points de construction à fournir. Les bâtiments camouflés sont posés face cachée. Épines, Renforcé, pièges : voir l'onglet « Commun ».</p>
      ${tilesTable(h)}
      <h3>Vos sortilèges</h3>
      <p><b>Soutien</b> : pendant votre tour. <b>Offensifs</b> : pendant le tour de l'essaim, juste avant ses attaques ; Famine se joue au tout début de son tour. Un sortilège non joué reste en main.</p>
      ${spellsTable(h)}
      <h3>Ce qui vous menace</h3>
      <ul>
        <li>Les <b>aggros</b> détruisent vite vos bâtiments ; les <b>tanks</b> encaissent vos tirs et vos Épines.</li>
        <li>Chaque bâtiment détruit et chaque support tombé rapporte de la <b>biomasse</b> à l'essaim, qui monte alors de palier (plus de cartes, de meilleur niveau).</li>
        <li>Le <b>Sapeur</b> détruit un bâtiment de sa lane à son arrivée ; l'<b>Œil-sonde</b> révèle vos tuiles camouflées de sa lane.</li>
      </ul>`;
  }

  function rules(tab, h) {
    return tab === "essaim" ? essaim(h) : tab === "colonie" ? colonie(h) : common(h);
  }

  // ------------------------------------------------------------------ mode découverte
  // Un conseil s'affiche la première fois que sa situation se présente, pour le camp qui joue.
  // when(S) : condition ; text(S) : texte (chiffres lus dans S et SF) ; img : nom d'une illustration.
  const hasTile = (S, f) => Object.values(S.tiles).some(t => t && f(t));
  const inHand = (S, f) => (S.hand || []).some(n => n && SF.TILES[n] && f(SF.TILES[n]));
  const nearRocket = S => S.creatures.some(c => c.k === 1 && c.u === 0);
  const TIPS = [
    // ---- essaim
    { id: "e-but", side: "essaim", img: "Massacreur", title: "Vous jouez l'essaim", when: () => true,
      text: () => `Votre but : tuer tous les travailleurs de la colonie en frappant sa fusée, au centre du plateau. Elle gagne si elle achève ses ${SF.FLOORS} étages avant. Chaque tour : vous choisissez vos cartes, puis vous déployez et améliorez (dans la même étape), puis vos créatures avancent et attaquent. Le bouton « Règles » détaille tout.` },
    { id: "e-pioche", side: "essaim", img: "Écorcheur", title: "La pioche au choix", when: S => S.phase === "A_start" && !S.startHand,
      text: () => `Votre palier, fixé par votre biomasse, vous donne un nombre de cartes. Répartissez-les toutes entre les piles de niveau 1, 2 et 3 avec + et −, puis « Piocher » : les créatures sont tirées au hasard dans chaque pile. Au premier tour, vous avez reçu à la place une aggro, un tank et un soutien.` },
    { id: "e-deploy", side: "essaim", img: "Carapace", title: "Déployer", when: S => S.phase === "A_deploy",
      text: S => `Touchez une carte, puis une case d'entrée (lettres A à E au bord) d'une lane ; un soutien se parachute sur n'importe quelle case libre. Chaque carte coûte de la biomasse. Votre budget du tour égale votre biomasse (${S.biomass}) : elle n'est jamais dépensée et revient chaque tour. Au plus ${SF.capOf(S)} créatures par lane. Dans la même étape, vous pouvez aussi investir dans les arbres d'amélioration. Le budget non dépensé va à la réserve.` },
    { id: "e-types", side: "essaim", img: "Hurleur", title: "Aggros, tanks et soutiens", when: S => S.phase === "A_deploy" && S.handA.length > 0,
      text: () => `Aggros : grosse attaque mais 1 PV. Tanks : beaucoup de PV, 1 ATQ. Soutiens : ils n'attaquent pas, mais leurs auras renforcent les autres créatures de leur case (les auras se cumulent). Touchez une carte pour voir sa capacité.` },
    { id: "e-ameli", side: "essaim", img: "Béhémoth", title: "Améliorations", when: S => S.phase === "A_deploy" && SF.investable(S) >= 4,
      text: () => `Pendant le déploiement, touchez une carte des arbres d'amélioration (panneau Essaim) pour y investir votre budget ou votre réserve : ${SF.COST_R1} biomasse au rang 1, ${SF.COST_R2} au rang 2, payables en plusieurs tours. Un rang 1 ajoute les cartes de niveau 2 de ce type à votre pioche, un rang 2 celles de niveau 3.` },
    { id: "e-attaque", side: "essaim", img: "Ravageur", title: "Déplacer et attaquer", when: S => S.phase === "A_attack",
      text: () => `Touchez une créature (cadre jaune), puis une case surlignée de son chemin : elle avance de 1 case jusqu'à son maximum, tout droit ou en escalier. Ensuite, si vous voulez, touchez un bâtiment encadré qui touche sa case. « Tout résoudre et finir le tour » fait agir les autres créatures et termine le tour.` },
    { id: "e-camo", side: "essaim", img: "Mine supérieure", title: "Tuiles camouflées", when: S => hasTile(S, t => t.hidden || (t.camo && !t.revealed && !SF.clairvoyance(S))),
      text: () => `Une tuile « ? » est camouflée : vous ignorez ce que c'est jusqu'à ce que vous l'attaquiez. Ce peut être une Mine (1 à 3 dégâts à votre créature avant qu'elle frappe) ou un Siphon (vous perdez 1 à 3 biomasse, jamais sous ${SF.MIN_BIOMASS}). Un Œil-sonde vivant révèle les tuiles camouflées de sa lane.` },
    { id: "e-epines", side: "essaim", img: "Haie d'épines", title: "Épines et Renforcé", when: S => S.phase === "A_attack" && Object.keys(S.tiles).some(k => S.tiles[k] && !S.tiles[k].hidden && !(S.tiles[k].camo && !S.tiles[k].revealed) && SF.epinesOf(S, k, true) > 0),
      text: () => `Le picto d'épines sur un bâtiment indique ses Épines : une créature qui l'attaque subit autant de dégâts après son attaque. Vos aggros n'ont qu'1 PV ! Renforcé X : le bâtiment ne perd qu'1 PV par tranche de X dégâts d'une même attaque.` },
    { id: "e-tourelles", side: "essaim", img: "support 2", title: "Les tourelles", when: S => S.phase === "A_attack" && S.creatures.some(c => c.k <= 3),
      text: () => `Les coins turquoise sont des supports. Ceux de niveau I et II sont des tourelles : à la fin de son tour, la colonie tire avec chacune sur une créature des 8 cases autour. Un support tombe quand tous les bâtiments qui le touchent sont détruits, et vous rapporte 1 biomasse.` },
    { id: "e-biomasse", side: "essaim", img: "Phéromone", title: "Gagner de la biomasse", when: S => S.biomass > 5,
      text: S => `Chaque bâtiment détruit et chaque support tombé rapporte 1 biomasse. Paliers suivants : ${SF.TIERS.slice(1).map(t => t.min).join(", ")} de biomasse. Ils donnent plus de cartes, de meilleur niveau, et plus de créatures par lane.` },
    { id: "e-fusee", side: "essaim", img: "Fusée", title: "Frapper la fusée", when: S => nearRocket(S),
      text: () => `Une créature qui touche la fusée peut l'attaquer : chaque attaque tue 1 travailleur, quelle que soit sa force. La colonie perd quand elle n'a plus de travailleurs.` },
    { id: "e-sorts", side: "essaim", img: null, title: "Les sortilèges de la colonie", when: S => (S.spells || []).length > 0,
      text: () => `La colonie tient des sortilèges. Les offensifs se jouent pendant votre tour : juste avant vos attaques (dégâts, Champ de stase, Brouillage…), et Famine au tout début (votre budget est alors divisé par 2).` },
    { id: "e-nuke", side: "essaim", img: "Fusée", title: "Attention à la Nuke", when: S => S.floors >= 6,
      text: () => `Quand la fusée atteindra l'étage 9, la Nuke détruira toutes vos créatures. Profitez-en pour frapper fort juste avant, ou gardez des créatures en réserve.` },
    // ---- colonie
    { id: "c-but", side: "colonie", img: "Fusée", title: "Vous jouez la colonie", when: () => true,
      text: () => `Votre but : achever les ${SF.FLOORS} étages de la fusée, au centre. Vous perdez si l'essaim tue tous vos travailleurs. Chaque tour : lancer des chantiers, répartir vos travailleurs entre ateliers et fusée, construire, poser les bâtiments, puis tirer avec vos tourelles. Le bouton « Règles » détaille tout.` },
    { id: "c-chantier", side: "colonie", img: "Muraille", title: "Lancer un chantier", when: S => S.phase === "D_main" && S.hand.length > 0,
      text: S => `Touchez une tuile de votre main, puis un atelier (une lane : N, E, S, O). Le chantier demande autant de points que sa durée. ${S.chPerLane > 1 ? "Deux chantiers" : "Un chantier"} par lane. Juste assez de travailleurs y sont assignés d'office.` },
    { id: "c-points", side: "colonie", img: "Baraquement", title: "Répartir les travailleurs", when: S => S.phase === "D_main",
      text: S => `Vos travailleurs donnent ${SF.totalPoints(S)} points ce tour. Les points d'un atelier font avancer son chantier ; tous les autres vont à la fusée. Ajustez avec + / −, puis touchez « Construire ».` },
    { id: "c-fusee", side: "colonie", img: "Fusée", title: "La fusée", when: S => S.phase === "D_main",
      text: () => `Un étage coûte ${F[0]} points (étages 1 à 3), puis ${F[1]}, ${F[2]} et ${F[3]}. Chaque étage donne +1 travailleur. Étage 3 : +2 technologies. Étage 6 : +1 chantier par lane. Étage 9 : la Nuke détruit toutes les créatures. Survolez les étages pour le détail.` },
    { id: "c-pose", side: "colonie", img: "Rempart", title: "Poser un bâtiment", when: S => S.phase === "D_place",
      text: () => `Le bâtiment est achevé : touchez une case surlignée. Elle doit être libre, dans sa lane, et toucher un bâtiment, un support ou la fusée. Les créatures présentes reculent d'une case.` },
    { id: "c-supports", side: "colonie", img: "support 1", title: "Les supports", when: S => S.phase === "D_place" || S.phase === "D_fire",
      text: () => `Un support apparaît sur un coin dès que ses 2 bâtiments côté fusée sont posés, et tombe quand tous ceux qui le touchent sont détruits. Niveau I (couronne 1) et II (couronne 2) : tourelles. Niveau III (couronne 3) : +${SF.SUP3_WORKERS} travailleurs.` },
    { id: "c-tirs", side: "colonie", img: "support 2", title: "Tirer", when: S => S.phase === "D_fire",
      text: () => `Touchez une tourelle surlignée, puis une créature surlignée (dans les 8 cases autour). Niveau I : 1 dégât, +1 par palier de la fusée ; niveau II : 2 dégâts. « Tirs automatiques » choisit pour vous ; « Terminer le tour » fait tirer les tourelles restantes.` },
    { id: "c-camo", side: "colonie", img: "Égide", title: "Le camouflage", when: S => inHand(S, t => t.camo),
      text: () => `Les tuiles marquées « Camouflage » sont posées face cachée : l'essaim ne sait pas ce que c'est avant de les attaquer. Les Mines blessent la créature qui les révèle ; les Siphons lui retirent de la biomasse. Un Œil-sonde ennemi révèle votre lane.` },
    { id: "c-epines", side: "colonie", img: "Mur hérissé", title: "Les Épines", when: S => inHand(S, t => t.ep > 0),
      text: () => `Épines : la créature qui attaque ce bâtiment subit autant de dégâts. Très efficace contre les aggros, qui n'ont qu'1 PV. Un Avant-poste ajoute +1 Épines aux bâtiments des 8 cases autour.` },
    { id: "c-tech", side: "colonie", img: "Laboratoire", title: "Les technologies", when: S => inHand(S, t => t.tech > 0) || SF.tech(S) > 0,
      text: () => `À 3, 6 et 9 technologies, vous piochez 1, 2 ou 3 sortilèges à la fin de chaque tour. Antenne, Laboratoire, Observatoire et Archives en donnent, tant qu'ils tiennent ; l'étage 3 de la fusée en donne 2 de plus.` },
    { id: "c-sorts", side: "colonie", img: null, title: "Vos sortilèges", when: S => (S.spells || []).some(Boolean),
      text: () => `Sortilèges de soutien (verts) : pendant votre tour. Offensifs (orange) : pendant le tour de l'essaim, juste avant ses attaques ; Famine au tout début de son tour. Le jeu vous propose de les jouer au bon moment. Un sortilège non joué reste en main.` },
    { id: "c-reaction", side: "colonie", img: null, title: "Fenêtre de réaction", when: S => S.phase === "A_react" || S.phase === "A_famine",
      text: () => `C'est le tour de l'essaim, mais vous pouvez jouer un sortilège offensif maintenant. Sinon, laissez passer.` },
    { id: "c-creatures", side: "colonie", img: "Colosse", title: "Les créatures de l'essaim", when: S => S.phase === "D_main" && S.creatures.length > 0,
      text: () => `Aggros : grosse attaque mais 1 PV. Tanks : beaucoup de PV. Soutiens : auras pour les autres créatures de leur case. Touchez une créature pour voir sa carte. Chaque bâtiment qu'elles détruisent rend l'essaim plus fort.` },
  ];
  function nextTip(S, side, seen) {
    for (const t of TIPS) if (t.side === side && !seen.has(t.id)) { try { if (t.when(S)) return t; } catch (e) { /* condition non applicable */ } }
    return null;
  }
  return { rules, nextTip, TIPS };
})();
if (typeof module !== "undefined") module.exports = AIDE;
