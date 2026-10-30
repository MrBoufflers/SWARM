// Swarm & Steel — moteur de règles v0.3 (livret v0.3). Aucun accès au DOM : testable sous Node.
"use strict";
const SF = (() => {
  // ------------------------------------------------------------------ données
  const CREATURES = {
    "Écorcheur": { type: "aggro", lvl: 1, cost: 3, pv: 1, atq: 3 },
    "Ravageur": { type: "aggro", lvl: 2, cost: 4, pv: 2, atq: 5 },
    "Massacreur": { type: "aggro", lvl: 3, cost: 7, pv: 3, atq: 7 },
    "Carapace": { type: "tank", lvl: 1, cost: 3, pv: 3, atq: 1 },
    "Béhémoth": { type: "tank", lvl: 2, cost: 4, pv: 5, atq: 2 },
    "Colosse": { type: "tank", lvl: 3, cost: 7, pv: 7, atq: 3 },
    "Œil-sonde": { type: "soutien", lvl: 1, cost: 2, pv: 2, atq: 0, cap: "vision", capName: "Vision", capText: "Révèle les tuiles camouflées de sa lane." },
    "Glaneur": { type: "soutien", lvl: 1, cost: 2, pv: 2, atq: 0, cap: "soin", capName: "Aura Soin 1", capText: "En fin de tour de l'essaim, les autres créatures de sa case regagnent 1 PV." },
    "Hurleur": { type: "soutien", lvl: 1, cost: 2, pv: 2, atq: 0, cap: "fureur", capName: "Aura Fureur", capText: "+1 ATQ aux autres créatures de sa case." },
    "Phéromone": { type: "soutien", lvl: 2, cost: 3, pv: 5, atq: 0, cap: "leurre", capName: "Aura Leurre", capText: "Une tourelle ou un sortilège qui vise une créature de sa case doit viser celle qui a le plus de PV." },
    "Perforeur": { type: "soutien", lvl: 2, cost: 3, pv: 5, atq: 0, cap: "percee", capName: "Aura Percée", capText: "Les autres créatures de sa case gagnent la percée." },
    "Catalyseur": { type: "soutien", lvl: 2, cost: 3, pv: 5, atq: 0, cap: "instinct", capName: "Aura Instinct", capText: "Une autre créature de sa case gagne Mobilité ou Furtivité, au choix." },
    "Sapeur": { type: "soutien", lvl: 3, cost: 5, pv: 8, atq: 0, cap: "sabotage", capName: "Sabotage", capText: "Quand il est déployé, détruit une tuile en chantier dans l'atelier de sa lane." },
    "Sporeur": { type: "soutien", lvl: 3, cost: 5, pv: 8, atq: 0, cap: "spores", capName: "Aura Spores", capText: "Quand une autre créature de sa case attaque une tuile, chaque tuile qui touche cette tuile subit 1 dégât." },
  };
  const PILES = {
    1: { aggro: [["Écorcheur", 6]], tank: [["Carapace", 6]], soutien: [["Œil-sonde", 2], ["Glaneur", 2], ["Hurleur", 2]] },
    2: { aggro: [["Ravageur", 6]], tank: [["Béhémoth", 6]], soutien: [["Phéromone", 2], ["Perforeur", 2], ["Catalyseur", 2]] },
    3: { aggro: [["Massacreur", 6]], tank: [["Colosse", 6]], soutien: [["Sapeur", 3], ["Sporeur", 3]] },
  };
  // nom: durée, pv (nombre ou 'ap' / 'front' / 'reduit'), épines, renforcé, tech, temp, perm, piège, direction, exemplaires
  const TILES = {
    "Palissade": { d: 1, pv: 2, ep: 1, camo: 1, n: 6 },
    "Muraille": { d: 2, pv: 4, ep: 1, camo: 1, n: 6 },
    "Rempart": { d: 3, pv: 4, ep: 1, ren: 2, camo: 1, n: 3 },
    "Bastion": { d: 3, pv: 3, ep: 1, ren: 3, camo: 1, n: 2 },
    "Haie d'épines": { d: 1, pv: 1, ep: 2, camo: 1, n: 3 },
    "Mur hérissé": { d: 2, pv: 2, ep: 3, camo: 1, n: 2 },
    "Antenne": { d: 1, pv: 1, ep: 1, tech: 1, n: 3 },
    "Laboratoire": { d: 2, pv: 2, ep: 1, tech: 2, n: 2 },
    "Observatoire": { d: 3, pv: 3, ep: 1, tech: 3, n: 1 },
    "Baraquement": { d: 1, pv: 1, ep: 1, temp: 1, n: 3 },
    "Dortoir": { d: 3, pv: 1, ep: 1, perm: 1, n: 2 },
    "Avant-poste du Nord": { d: 2, pv: "ap", dir: "N", ep: 1, camo: 1, n: 1 },
    "Avant-poste de l'Est": { d: 2, pv: "ap", dir: "E", ep: 1, camo: 1, n: 1 },
    "Avant-poste du Sud": { d: 2, pv: "ap", dir: "S", ep: 1, camo: 1, n: 1 },
    "Avant-poste de l'Ouest": { d: 2, pv: "ap", dir: "O", ep: 1, camo: 1, n: 1 },
    "Ligne de front": { d: 2, pv: "front", ep: 1, camo: 1, n: 2 },
    "Réduit": { d: 2, pv: "reduit", ep: 1, camo: 1, n: 2 },
    "Piège": { d: 2, pv: 2, ep: 1, trap: 1, camo: 1, n: 3 },
  };
  const TILE_TEXT = {
    "Rempart": "Renforcé 2 : perd 1 PV par tranche de 2 dégâts.", "Bastion": "Renforcé 3 : perd 1 PV par tranche de 3 dégâts.",
    "Avant-poste du Nord": "2 PV ; 4 PV dans la lane Nord.", "Avant-poste de l'Est": "2 PV ; 4 PV dans la lane Est.",
    "Avant-poste du Sud": "2 PV ; 4 PV dans la lane Sud.", "Avant-poste de l'Ouest": "2 PV ; 4 PV dans la lane Ouest.",
    "Ligne de front": "PV = 1 + couronne (2 / 3 / 4).", "Réduit": "PV = 5 − couronne (4 / 3 / 2).",
    "Piège": "Camouflé. 2 dégâts à la créature qui le révèle en l'attaquant.",
    "Antenne": "+1 technologie.", "Laboratoire": "+2 technologies.", "Observatoire": "+3 technologies.",
    "Baraquement": "+1 travailleur tant que la tuile tient.", "Dortoir": "+1 travailleur permanent, gagné à la construction.",
  };
  const SPELLS = {
    "Frappe orbitale": { kind: "off", n: 3, text: "4 dégâts à 1 créature." },
    "Salve": { kind: "off", n: 3, text: "2 dégâts à 2 créatures de la même case." },
    "Barrage": { kind: "off", n: 2, text: "1 dégât à chaque créature d'une lane." },
    "Onde de choc": { kind: "off", n: 1, text: "1 dégât à chaque créature d'une couronne, sur les 4 lanes." },
    "Champ de stase": { kind: "off", n: 2, text: "Choisissez une lane : ses tuiles ne subissent aucun dégât ce tour." },
    "Famine": { kind: "off", n: 2, text: "Au début du tour de l'essaim : son budget baisse de 2 ce tour." },
    "Brouillage": { kind: "off", n: 2, text: "Annule le déploiement d'une créature posée ce tour ; la carte retourne dans sa pioche, la biomasse est perdue." },
    "Effort": { kind: "sup", n: 3, text: "+2 points de construction ce tour." },
    "Cadence": { kind: "sup", n: 1, text: "+2 points de construction ce tour." },
    "Réparation": { kind: "sup", n: 3, text: "Rendez 3 PV, répartis sur vos tuiles abîmées." },
    "Renouvellement": { kind: "sup", n: 2, text: "Défaussez des tuiles de votre main, puis repiochez-en autant." },
    "Reconversion": { kind: "sup", n: 2, text: "Échangez une tuile de votre main avec une tuile construite." },
  };
  const TIERS = [ // biomasse mini, N1, N2, N3, plafond
    { min: 0, n: [3, 0, 0], cap: 1 }, { min: 4, n: [3, 2, 0], cap: 2 }, { min: 7, n: [4, 2, 1], cap: 3 },
    { min: 10, n: [4, 3, 2], cap: 4 }, { min: 13, n: [4, 3, 3], cap: 5 },
  ];
  const TREES = {
    aggro: { A1: ["Férocité", "+1 ATQ."], B1: ["Mobilité", "Choisit sa cible parmi toutes les tuiles de sa lane."],
      A2: ["Carnage", "+2 ATQ (total +3)."], C2: ["Déploiement", "Chaque tour, 2 cartes de niveau 1 en plus, déployées gratuitement."],
      B2: ["Raid", "Une fois par tour, une créature aggro peut passer dans une lane voisine."] },
    tank: { A1: ["Carapace épaisse", "+2 PV."], B1: ["Protection", "Les tirs visant une créature non tank de sa case visent ce tank."],
      A2: ["Blindage", "+4 PV (total +6)."], C2: ["Réincarnation", "Une fois par tour, un tank mort revient au début de votre tour suivant."],
      B2: ["Masse vivante", "+1 PV par autre créature sur sa case."] },
    soutien: { A1: ["Mue", "+1 PV et Furtivité."], B1: ["Griffes", "Tous les soutiens gagnent l'Aura Griffes : +1 ATQ aux autres créatures de leur case."],
      A2: ["Régénération", "Tous les soutiens gagnent l'Aura Soin 2."], C2: ["Clairvoyance", "Tant qu'un soutien est en jeu, toutes les tuiles camouflées sont visibles."],
      B2: ["Frénésie", "Une autre créature de sa case inflige des dégâts doublés."] },
  };
  const COST_R1 = 8, COST_R2 = 16, FLOOR_COST = 3, FLOORS = 12;
  const LANES = ["N", "E", "S", "O"];
  const LANE_NAME = { N: "Nord", E: "Est", S: "Sud", O: "Ouest" };
  const COLS = ["A", "B", "C", "D", "E"];

  // ------------------------------------------------------------------ géométrie
  const key = (x, y) => x + "," + y;
  const parse = k => k.split(",").map(Number);
  const ring = (x, y) => Math.max(Math.abs(x), Math.abs(y));
  function cellLane(x, y) {
    if (Math.abs(y) > Math.abs(x)) return y > 0 ? "N" : "S";
    if (Math.abs(x) > Math.abs(y)) return x > 0 ? "E" : "O";
    return null;
  }
  // coordonnées locales d'une lane : u = décalage latéral (-2..2), k = couronne (4 = entrée, 0 = fusée)
  function toGlobal(lane, u, k) {
    if (k === 0) return [0, 0];
    if (lane === "N") return [u, k];
    if (lane === "S") return [-u, -k];
    if (lane === "E") return [k, -u];
    return [-k, u];
  }
  function toLocal(lane, x, y) {
    const k = ring(x, y);
    if (lane === "N") return [x, k];
    if (lane === "S") return [-x, k];
    if (lane === "E") return [-y, k];
    return [y, k];
  }
  // pas suivant, sans diagonale : descendre si la case du dessous est dans la lane, sinon pas de côté vers l'axe
  function nextStep(u, k) {
    if (k === 4) return [u, 3];
    if (k === 1) return [0, 0];
    if (Math.abs(u) <= k - 2) return [u, k - 1];
    return [u - Math.sign(u), k];
  }
  const isSupportCell = (x, y) => x !== 0 && Math.abs(x) === Math.abs(y) && ring(x, y) <= 3;
  const supportLanes = (x, y) => [y > 0 ? "N" : "S", x > 0 ? "E" : "O"];
  const supportInner = (x, y) => [key(x - Math.sign(x), y), key(x, y - Math.sign(y))];
  const neighbors = (x, y) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
  function supportWalls(x, y) {
    return neighbors(x, y).filter(([a, b]) => ring(a, b) <= 3 && cellLane(a, b)).map(([a, b]) => key(a, b));
  }

  // ------------------------------------------------------------------ outils
  let RNG = Math.random;
  const setRng = f => { RNG = f; };
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RNG() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // Événements visuels (animations) : S.fx n'existe que pendant une action, créé et vidé par l'appelant
  // (interface locale ou serveur). Purement descriptif : n'a aucun effet sur les règles.
  const fx = (S, e) => { if (S.fx) S.fx.push(e); };
  const log = (S, who, msg) => { S.log.unshift({ r: S.round, who, msg }); if (S.log.length > 250) S.log.pop(); };

  // ------------------------------------------------------------------ mise en place
  function newGame() {
    const S = {
      round: 1, phase: "A_start", view: "essaim", handoff: "essaim", winner: null, nextId: 1,
      tiles: {}, supports: {}, chantiers: { N: [], E: [], S: [], O: [] }, chPerLane: 1, toPlace: [], pendingRocket: 0,
      workersBase: 3, floors: 0, rocketPts: 0, techBonus: 0,
      tileDeck: [], tileDiscard: [], hand: [],
      spellDeck: [], spellDiscard: [], spells: [],
      alloc: { N: 0, E: 0, S: 0, O: 0 }, extraPts: 0, cadence: false, firedSupports: [],
      biomass: 3, budget: 0, reserve: 0, famine: 0,
      piles: { 1: [], 2: [], 3: [] }, handA: [], creatures: [], reincQueue: [], reincUsed: false, raidUsed: false,
      upgrades: { aggro: { r1: null, r2: null }, tank: { r1: null, r2: null }, soutien: { r1: null, r2: null } }, invest: {},
      stase: [], log: [],
    };
    for (const lane of LANES) {
      const [x, y] = toGlobal(lane, 0, 1);
      S.tiles[key(x, y)] = { name: "Mur de départ", hp: 2, max: 2, ep: 1, ren: 0, tech: 0, temp: 0, trap: 0, revealed: true };
    }
    for (const sx of [1, -1]) for (const sy of [1, -1]) S.supports[key(sx, sy)] = 1;
    for (const [n, t] of Object.entries(TILES)) for (let i = 0; i < t.n; i++) S.tileDeck.push(n);
    shuffle(S.tileDeck);
    for (const [n, s] of Object.entries(SPELLS)) for (let i = 0; i < s.n; i++) S.spellDeck.push(n);
    shuffle(S.spellDeck);
    addPile(S, 1, "aggro"); addPile(S, 1, "tank"); addPile(S, 1, "soutien");
    drawTiles(S);
    log(S, "jeu", "Nouvelle partie. L'essaim commence.");
    startAttackerTurn(S);
    return S;
  }
  function addPile(S, lvl, type) {
    for (const [name, n] of PILES[lvl][type]) for (let i = 0; i < n; i++) S.piles[lvl].push(name);
    shuffle(S.piles[lvl]);
  }

  // ------------------------------------------------------------------ dérivés
  const tier = S => { let t = 0; TIERS.forEach((r, i) => { if (S.biomass >= r.min) t = i; }); return t; };
  const capOf = S => TIERS[tier(S)].cap;
  const laneCount = (S, lane) => S.creatures.filter(c => c.lane === lane).length;
  const tech = S => Object.values(S.tiles).reduce((a, t) => a + (t.tech || 0), 0) + S.techBonus;
  const spellsPerTurn = S => { const t = tech(S); return t >= 9 ? 3 : t >= 6 ? 2 : t >= 3 ? 1 : 0; };
  const bonusWorkers = S => Object.values(S.tiles).reduce((a, t) => a + (t.temp || 0), 0) + 2 * Object.values(S.supports).filter(l => l === 3).length;
  const totalPoints = S => S.workersBase + bonusWorkers(S) + S.extraPts;
  const allocated = S => LANES.reduce((a, l) => a + S.alloc[l], 0);
  const handSize = S => 4 * S.chPerLane;
  const posKey = c => { const [x, y] = toGlobal(c.lane, c.u, c.k); return c.k === 4 ? "in:" + c.lane + ":" + c.u : key(x, y); };
  const caseMates = (S, c) => S.creatures.filter(o => o !== c && posKey(o) === posKey(c));
  const anySoutien = S => S.creatures.some(c => CREATURES[c.name].type === "soutien");
  const clairvoyance = S => S.upgrades.soutien.r2 === "C" && anySoutien(S);
  function hasMobility(S, c) {
    if (CREATURES[c.name].type === "aggro" && S.upgrades.aggro.r1 === "B") return true;
    return caseMates(S, c).some(o => o.name === "Catalyseur" && o.instinct === "mobilite" && o.instinctTarget === c.id);
  }
  function isStealthy(S, c) {
    if (CREATURES[c.name].type === "soutien" && S.upgrades.soutien.r1 === "A") return true;
    return caseMates(S, c).some(o => o.name === "Catalyseur" && o.instinct === "furtivite" && o.instinctTarget === c.id);
  }
  function hasPercee(S, c) { return caseMates(S, c).some(o => o.name === "Perforeur"); }
  function bonusHp(S, c) { return CREATURES[c.name].type === "tank" && S.upgrades.tank.r2 === "B" ? caseMates(S, c).length : 0; }
  function maxHp(S, name) {
    const b = CREATURES[name]; let m = b.pv;
    if (b.type === "tank") { if (S.upgrades.tank.r1 === "A") m += 2; if (S.upgrades.tank.r2 === "A") m += 4; }
    if (b.type === "soutien" && S.upgrades.soutien.r1 === "A") m += 1;
    return m;
  }
  function baseAtq(S, name) {
    const b = CREATURES[name]; let a = b.atq;
    if (b.type === "aggro") { if (S.upgrades.aggro.r1 === "A") a += 1; if (S.upgrades.aggro.r2 === "A") a += 2; }
    return a;
  }
  function frenzyTarget(S, c) { // la créature doublée par un soutien Frénésie de sa case : la plus forte des autres
    if (S.upgrades.soutien.r2 !== "B") return false;
    const mates = caseMates(S, c);
    const frenzySources = mates.filter(o => CREATURES[o.name].type === "soutien");
    if (!frenzySources.length) return false;
    // pour chaque soutien, l'autre créature de plus forte ATQ de la case est doublée
    return frenzySources.some(src => {
      const others = S.creatures.filter(o => o !== src && posKey(o) === posKey(src));
      others.sort((a, b) => baseAtq(S, b.name) - baseAtq(S, a.name) || a.id - b.id);
      return others[0] === c;
    });
  }
  function effAtq(S, c) {
    if (!attacks(c)) return 0;
    let a = baseAtq(S, c.name);
    if (caseMates(S, c).some(o => o.name === "Hurleur")) a += 1; // Aura Fureur, non cumulable
    if (S.upgrades.soutien.r1 === "B" && caseMates(S, c).some(o => CREATURES[o.name].type === "soutien")) a += 1; // Aura Griffes, non cumulable, cumulable avec Fureur
    if (frenzyTarget(S, c)) a *= 2;
    return a;
  }
  function soinValue(S, c) { // aura de soin la plus forte présente sur la case (hors soi)
    let v = 0;
    for (const o of caseMates(S, c)) {
      if (CREATURES[o.name].type !== "soutien") continue;
      if (S.upgrades.soutien.r2 === "A") v = Math.max(v, 2);
      if (o.name === "Glaneur") v = Math.max(v, 1);
    }
    return v;
  }

  // ------------------------------------------------------------------ tuiles et supports
  function tileStats(name, x, y) {
    const t = TILES[name], r = ring(x, y), lane = cellLane(x, y);
    let pv = t.pv;
    if (pv === "ap") pv = lane === t.dir ? 4 : 2;
    if (pv === "front") pv = 1 + r;
    if (pv === "reduit") pv = 5 - r;
    return { name, hp: pv, max: pv, ep: t.ep, ren: t.ren || 0, tech: t.tech || 0, temp: t.temp || 0, trap: t.trap || 0, camo: t.camo || 0, revealed: !t.camo };
  }
  function epinesOf(S, k) {
    let e = S.tiles[k].ep;
    if (Object.entries(S.supports).some(([sk, l]) => l === 2 && supportWalls(...parse(sk)).includes(k))) e += 1;
    return e;
  }
  function destroyTile(S, k, why) {
    const t = S.tiles[k]; if (!t) return;
    delete S.tiles[k];
    if (t.name !== "Mur de départ") S.tileDiscard.push(t.name);
    S.biomass += 1;
    fx(S, { t: "tileDown", k });
    log(S, "essaim", `${t.name} détruit${why ? " (" + why + ")" : ""} : +1 biomasse.`);
    checkSupportsFall(S);
  }
  function checkSupportsFall(S) {
    for (const sk of Object.keys(S.supports)) {
      if (!supportWalls(...parse(sk)).some(w => S.tiles[w])) {
        log(S, "essaim", `Le support de niveau ${S.supports[sk]} tombe : +1 biomasse.`);
        delete S.supports[sk];
        S.biomass += 1;
        fx(S, { t: "tileDown", k: sk });
      }
    }
  }
  function placeSupports(S) {
    for (let r = 1; r <= 3; r++) for (const sx of [1, -1]) for (const sy of [1, -1]) {
      const x = sx * r, y = sy * r, k = key(x, y);
      if (!S.supports[k] && supportInner(x, y).every(w => S.tiles[w])) {
        S.supports[k] = r;
        log(S, "colonie", `Un support de niveau ${r} apparaît en couronne ${r}.`);
      }
    }
  }
  // Un bâtiment qui sort de chantier sur une case occupée fait reculer les créatures d'une case vers le fond
  // (même colonne, couronne +1). Si cette case porte déjà une tuile, elles reculent jusqu'à la première case libre.
  function pushBack(S, k) {
    const here = S.creatures.filter(c => c.k < 4 && posKey(c) === k);
    if (!here.length) return;
    const { lane, u } = here[0];
    let nk = here[0].k + 1;
    while (nk < 4 && S.tiles[key(...toGlobal(lane, u, nk))]) nk++;
    for (const c of here) c.k = nk;
    const where = nk === 4 ? "sur la case d'entrée" : `en couronne ${nk}`;
    log(S, "colonie", `${here.map(c => c.name).join(", ")} recule${here.length > 1 ? "nt" : ""} ${where} pour laisser place au bâtiment.`);
  }
  function canTarget(S, lane, k) { // case cible valable pour un chantier de cette lane
    const [x, y] = parse(k);
    if (ring(x, y) > 3 || ring(x, y) < 1 || cellLane(x, y) !== lane) return false;
    if (S.tiles[k]) return false;
    return neighbors(x, y).some(([a, b]) => (a === 0 && b === 0) || S.tiles[key(a, b)] || S.supports[key(a, b)]);
  }

  // ------------------------------------------------------------------ créatures
  function makeCreature(S, name, lane, u, extra) {
    const c = { id: S.nextId++, name, lane, u, k: 4, hp: maxHp(S, name), new: true, acted: false, ...extra };
    if (name === "Catalyseur") { c.instinct = "mobilite"; c.instinctTarget = null; }
    return c;
  }
  function killCheck(S) {
    const dead = S.creatures.filter(c => c.hp + bonusHp(S, c) <= 0);
    for (const c of dead) {
      S.creatures.splice(S.creatures.indexOf(c), 1);
      fx(S, { t: "die", id: c.id });
      log(S, "colonie", `${c.name} est détruit.`);
      if (CREATURES[c.name].type === "tank" && S.upgrades.tank.r2 === "C" && !S.reincUsed) {
        S.reincUsed = true;
        S.reincQueue.push({ name: c.name, lane: c.lane, u: c.u });
        log(S, "essaim", `Réincarnation : ${c.name} reviendra au début du prochain tour de l'essaim.`);
      } else {
        S.piles[CREATURES[c.name].lvl].push(c.name); shuffle(S.piles[CREATURES[c.name].lvl]);
      }
    }
    // Catalyseur : la cible d'Instinct doit rester sur sa case
    for (const c of S.creatures) if (c.name === "Catalyseur") {
      const mates = caseMates(S, c);
      if (!mates.some(o => o.id === c.instinctTarget)) c.instinctTarget = mates.length ? mates[0].id : null;
    }
  }
  function damageCreature(S, c, n, why) {
    c.hp -= n;
    fx(S, { t: "dmg", id: c.id, n, hp: c.hp + bonusHp(S, c) });
    log(S, "colonie", `${c.name} subit ${n} dégât${n > 1 ? "s" : ""}${why ? " (" + why + ")" : ""}.`);
  }
  // cible imposée par Protection puis Leurre ; renvoie null si la créature est intouchable (Furtivité)
  function resolveTarget(S, c) {
    const mates = caseMates(S, c);
    if (isStealthy(S, c) && mates.some(o => !isStealthy(S, o))) return null;
    let t = c;
    if (CREATURES[t.name].type !== "tank" && S.upgrades.tank.r1 === "B") {
      const tank = mates.find(o => CREATURES[o.name].type === "tank");
      if (tank) t = tank;
    }
    const group = [t, ...caseMates(S, t)];
    if (group.some(o => o.name === "Phéromone")) {
      const visible = group.filter(o => !(isStealthy(S, o) && group.some(p => !isStealthy(S, p))));
      visible.sort((a, b) => (b.hp + bonusHp(S, b)) - (a.hp + bonusHp(S, a)) || a.id - b.id);
      t = visible[0] || t;
    }
    return t;
  }
  const targetable = (S, c) => resolveTarget(S, c) !== null;

  // trajet : renvoie {stand:[u,k], target:'fusee'|clé de tuile}
  function walk(S, c) {
    let u = c.u, k = c.k;
    for (;;) {
      const [nu, nk] = nextStep(u, k);
      if (nk === 0) return { stand: [u, k], target: "fusee" };
      const [x, y] = toGlobal(c.lane, nu, nk), tk = key(x, y);
      if (S.tiles[tk]) return { stand: [u, k], target: tk };
      u = nu; k = nk;
    }
  }
  function laneTiles(S, lane) { return Object.keys(S.tiles).filter(k => cellLane(...parse(k)) === lane); }

  const cellName = (u, k) => (k === 4 ? "entrée " + COLS[u + 2] : COLS[u + 2] + k);
  const attacks = c => CREATURES[c.name].type !== "soutien";
  function act(S, c, chosenTarget) {
    if (c.acted) return;
    c.acted = true;
    const w = walk(S, c), from = cellName(c.u, c.k);
    if (c.u !== w.stand[0] || c.k !== w.stand[1]) fx(S, { t: "move", id: c.id, lane: c.lane, from: [c.u, c.k], to: [w.stand[0], w.stand[1]] });
    c.u = w.stand[0]; c.k = w.stand[1];
    const to = cellName(c.u, c.k), tgt = w.target === "fusee" ? "la fusée" : `${cellName(...toLocal(c.lane, ...parse(w.target)))}`;
    log(S, "essaim", `${c.name} (lane ${LANE_NAME[c.lane]}) : ${from === to ? "reste en " + from : from + " → " + to}, devant ${tgt}.`);
    if (!attacks(c)) { // les soutiens avancent avec l'essaim mais n'attaquent jamais (ils ne s'empalent pas sur les Épines)
      log(S, "essaim", `${c.name} avance sans attaquer.`);
      return;
    }
    let target = w.target;
    if (chosenTarget && hasMobility(S, c) && laneTiles(S, c.lane).includes(chosenTarget)) target = chosenTarget;
    const dmg = effAtq(S, c);
    if (target === "fusee") {
      S.workersBase -= 1; // une attaque contre la fusée tue un seul travailleur, quelle que soit la force
      fx(S, { t: "rocket", id: c.id });
      log(S, "essaim", `${c.name} frappe la fusée : −1 travailleur.`);
      if (S.workersBase <= 0) { S.winner = "essaim"; log(S, "jeu", "La colonie n'a plus de travailleurs : l'essaim gagne."); }
      return;
    }
    hitTile(S, c, target, dmg, true);
    killCheck(S);
  }
  function hitTile(S, c, tk, dmg, primary) {
    const t = S.tiles[tk]; if (!t) return;
    const [x, y] = parse(tk), lane = cellLane(x, y);
    const epVal = epinesOf(S, tk); // calculé avant les dégâts : la tuile peut tomber
    if (t.camo && !t.revealed) { // Camouflage : la première attaque retourne la tuile
      t.revealed = true;
      if (t.trap) {
        if (!clairvoyance(S)) damageCreature(S, c, 2, "piège");
        log(S, "essaim", "Un piège est révélé.");
      } else log(S, "essaim", `Tuile camouflée révélée : ${t.name}.`);
    }
    if (S.stase.includes(lane)) {
      fx(S, { t: "hit", id: c.id, k: tk, n: 0, hp: t.hp });
      log(S, "colonie", `Champ de stase : ${t.name} ne subit aucun dégât.`);
    } else {
      const loss = t.ren ? Math.floor(dmg / t.ren) : dmg;
      const capacity = t.ren ? t.hp * t.ren : t.hp;
      const excess = dmg - capacity;
      t.hp -= loss;
      fx(S, { t: "hit", id: c.id, k: tk, n: Math.min(loss, t.hp + loss), hp: Math.max(0, t.hp) });
      log(S, "essaim", `${c.name} inflige ${dmg} à ${t.name} (−${Math.min(loss, t.hp + loss)} PV).`);
      if (primary && caseMates(S, c).some(o => o.name === "Sporeur")) {
        for (const [a, b] of neighbors(x, y)) {
          const nk = key(a, b), nt = S.tiles[nk];
          if (nt && !S.stase.includes(cellLane(a, b))) {
            nt.hp -= nt.ren ? Math.floor(1 / nt.ren) : 1;
            fx(S, { t: "hit", id: null, k: nk, n: nt.ren ? 0 : 1, hp: Math.max(0, nt.hp) });
            if (nt.hp <= 0) destroyTile(S, nk, "spores");
          }
        }
      }
      if (t.hp <= 0) {
        destroyTile(S, tk);
        if (excess > 0 && hasPercee(S, c)) {
          const [lu, lk] = toLocal(lane, x, y);
          const ghost = { ...c, u: lu, k: lk };
          const w = walk(S, ghost);
          if (w.target === "fusee") {
            S.workersBase -= 1;
            fx(S, { t: "rocket", id: c.id });
            log(S, "essaim", "Percée : la fusée est touchée, −1 travailleur.");
            if (S.workersBase <= 0) S.winner = "essaim";
          } else hitTile(S, c, w.target, excess, false);
        }
      }
    }
    if (primary && epVal > 0) damageCreature(S, c, epVal, "épines");
  }

  // ------------------------------------------------------------------ tour de l'essaim
  function startAttackerTurn(S) {
    S.phase = "A_start"; S.raidUsed = false; S.reincUsed = false; S.stase = [];
    for (const c of S.creatures) { c.new = false; c.acted = false; }
    // Réincarnation
    for (const r of S.reincQueue) {
      S.creatures.push(makeCreature(S, r.name, r.lane, r.u));
      log(S, "essaim", `${r.name} se réincarne à l'entrée de la lane ${LANE_NAME[r.lane]}.`);
    }
    S.reincQueue = [];
    S.famine = 0;
  }
  function attackerDraw(S) {
    const t = TIERS[tier(S)];
    S.handA = [];
    for (let lvl = 3; lvl >= 1; lvl--) {
      for (let i = 0; i < t.n[lvl - 1]; i++) {
        for (let l = lvl; l >= 1; l--) if (S.piles[l].length) { S.handA.push({ name: S.piles[l].pop(), free: false, uid: S.nextId++ }); break; }
      }
    }
    if (S.upgrades.aggro.r2 === "C") {
      for (let i = 0; i < 2; i++) if (S.piles[1].length) S.handA.push({ name: S.piles[1].pop(), free: true, uid: S.nextId++ });
    }
    S.budget = Math.max(0, S.biomass - S.famine);
    S.phase = "A_deploy";
    log(S, "essaim", `Palier ${tier(S) + 1} : ${S.handA.length} cartes, budget ${S.budget}.`);
  }
  function canDeploy(S, card, lane) {
    const cost = card.free ? 0 : CREATURES[card.name].cost;
    return S.phase === "A_deploy" && cost <= S.budget && laneCount(S, lane) < capOf(S);
  }
  function deploy(S, uid, lane, u) {
    const i = S.handA.findIndex(c => c.uid === uid); if (i < 0) return false;
    const card = S.handA[i];
    if (!canDeploy(S, card, lane)) return false;
    S.budget -= card.free ? 0 : CREATURES[card.name].cost;
    S.handA.splice(i, 1);
    const c = makeCreature(S, card.name, lane, u);
    S.creatures.push(c);
    fx(S, { t: "deploy", id: c.id });
    log(S, "essaim", `${card.name} déployé${card.free ? " gratuitement" : ""} en lane ${LANE_NAME[lane]}, colonne ${COLS[u + 2]}.`);
    if (card.name === "Sapeur" && S.chantiers[lane].length) {
      const ch = S.chantiers[lane].shift();
      S.tileDiscard.push(ch.tile);
      log(S, "essaim", `Sabotage : le chantier de la lane ${LANE_NAME[lane]} est détruit (${pubName(ch.tile)}).`);
    }
    if (card.name === "Œil-sonde") revealLane(S, lane);
    if (card.name === "Catalyseur") { const m = caseMates(S, c); c.instinctTarget = m.length ? m[0].id : null; }
    for (const o of S.creatures) if (o.name === "Catalyseur" && !o.instinctTarget) { const m = caseMates(S, o); o.instinctTarget = m.length ? m[0].id : null; }
    return true;
  }
  function revealLane(S, lane) {
    for (const k of laneTiles(S, lane)) if (S.tiles[k].camo && !S.tiles[k].revealed) { S.tiles[k].revealed = true; if (S.tiles[k].trap) S.tiles[k].disarmed = true; log(S, "essaim", `Vision : tuile camouflée révélée (${S.tiles[k].name}).`); }
  }
  function endDeploy(S) {
    if (S.budget > 0) { S.reserve += S.budget; log(S, "essaim", `${S.budget} biomasse versée à la réserve (réserve ${S.reserve}).`); }
    S.budget = 0;
    for (const c of S.handA) S.piles[CREATURES[c.name].lvl].push(c.name);
    for (const l of [1, 2, 3]) shuffle(S.piles[l]);
    S.handA = [];
    S.phase = "A_upgrade";
  }
  // Améliorations payées en plusieurs fois : on investit des points de biomasse dans un nœud précis.
  // Commencer à investir dans un nœud ferme l'autre choix du même rang.
  const nodeCost = slot => (slot.endsWith("1") ? COST_R1 : COST_R2);
  function invested(S, type, slot) { return (S.invest && S.invest[type + ":" + slot]) || 0; }
  function nodeState(S, type, slot) {
    const u = S.upgrades[type], r1 = slot.endsWith("1"), cur = r1 ? u.r1 : u.r2;
    if (cur === slot[0]) return "taken";
    if (cur) return "closed";
    const siblings = r1 ? ["A1", "B1"] : ["A2", "C2", "B2"];
    if (siblings.some(o => o !== slot && invested(S, type, o) > 0)) return "closed";
    if (!r1 && !u.r1) return "needR1";
    if (!r1 && slot !== "C2" && u.r1 !== slot[0]) return "closed";
    return "open";
  }
  function investable(S) {
    if (S.phase === "A_deploy") return S.budget + S.reserve;
    if (S.phase === "A_upgrade") return S.reserve;
    return 0;
  }
  function invest(S, type, slot, n) {
    if (nodeState(S, type, slot) !== "open") return false;
    const need = nodeCost(slot) - invested(S, type, slot);
    n = Math.min(n, need, investable(S));
    if (n <= 0) return false;
    let left = n;
    if (S.phase === "A_deploy") { const b = Math.min(left, S.budget); S.budget -= b; left -= b; }
    S.reserve -= left;
    S.invest = S.invest || {};
    S.invest[type + ":" + slot] = invested(S, type, slot) + n;
    log(S, "essaim", `${n} biomasse investie dans ${TREES[type][slot][0]} (${invested(S, type, slot)}/${nodeCost(slot)}).`);
    if (invested(S, type, slot) >= nodeCost(slot)) { delete S.invest[type + ":" + slot]; acquire(S, type, slot); }
    return true;
  }
  function acquire(S, type, slot) {
    const u = S.upgrades[type];
    const before = S.creatures.filter(c => CREATURES[c.name].type === type).map(c => [c, maxHp(S, c.name)]);
    if (slot.endsWith("1")) { u.r1 = slot[0]; addPile(S, 2, type); } else { u.r2 = slot[0]; addPile(S, 3, type); }
    for (const [c, m] of before) c.hp += maxHp(S, c.name) - m;
    log(S, "essaim", `Amélioration ${TREES[type][slot][0]} (${type}) acquise : les cartes de niveau ${slot.endsWith("1") ? 2 : 3} entrent dans la pioche.`);
    if (type === "soutien" && slot === "C2") log(S, "essaim", "Clairvoyance : les tuiles camouflées sont visibles tant qu'un soutien est en jeu.");
  }
  function canBuy(S, type, slot) { return nodeState(S, type, slot) === "open" && investable(S) + invested(S, type, slot) >= nodeCost(slot); }
  function buy(S, type, slot) { return canBuy(S, type, slot) && invest(S, type, slot, nodeCost(slot)); }
  function raid(S, id, toLane) {
    const c = S.creatures.find(o => o.id === id);
    if (!c || S.raidUsed || S.upgrades.aggro.r2 !== "B" || CREATURES[c.name].type !== "aggro") return false;
    const i = LANES.indexOf(c.lane), j = LANES.indexOf(toLane);
    if (!((i + 1) % 4 === j || (i + 3) % 4 === j)) return false;
    if (laneCount(S, toLane) >= capOf(S)) return false;
    c.lane = toLane; c.u = 0; c.k = 4; S.raidUsed = true;
    log(S, "essaim", `Raid : ${c.name} passe à l'entrée de la lane ${LANE_NAME[toLane]}.`);
    return true;
  }
  function startAttacks(S) { S.phase = "A_attack"; }
  function attackOrder(S) { return [...S.creatures].filter(c => !c.acted).sort((a, b) => a.k - b.k || a.id - b.id); }
  function endAttackerTurn(S) {
    if (S.winner) return;
    // auras de soin
    for (const c of S.creatures) {
      const v = soinValue(S, c), m = maxHp(S, c.name);
      if (v && c.hp < m) { c.hp = Math.min(m, c.hp + v); log(S, "essaim", `${c.name} regagne ${v} PV.`); }
    }
    // sortilèges offensifs non joués : défaussés
    const off = S.spells.filter(s => SPELLS[s].kind === "off");
    if (off.length) { S.spellDiscard.push(...off); S.spells = S.spells.filter(s => SPELLS[s].kind !== "off"); log(S, "colonie", `${off.length} sortilège${off.length > 1 ? "s" : ""} offensif${off.length > 1 ? "s" : ""} non joué${off.length > 1 ? "s" : ""} défaussé${off.length > 1 ? "s" : ""}.`); }
    S.stase = [];
    startDefenderTurn(S);
  }

  // ------------------------------------------------------------------ sortilèges
  function useSpell(S, idx, arg) {
    const name = S.spells[idx]; if (!name) return false;
    const sp = SPELLS[name];
    const ok = applySpell(S, name, arg);
    if (!ok) return false;
    S.spells.splice(idx, 1); S.spellDiscard.push(name);
    log(S, "colonie", `Sortilège joué : ${name}.`);
    killCheck(S);
    return true;
  }
  function applySpell(S, name, arg) {
    const cr = id => S.creatures.find(c => c.id === id);
    switch (name) {
      case "Frappe orbitale": { const c = cr(arg); if (!c) return false; const t = resolveTarget(S, c); if (!t) return false; damageCreature(S, t, 4, name); return true; }
      case "Salve": {
        const c = cr(arg); if (!c) return false;
        const group = [c, ...caseMates(S, c)].filter(o => targetable(S, o));
        if (!group.length) return false;
        const first = resolveTarget(S, c) || group[0];
        const rest = group.filter(o => o !== first).sort((a, b) => effAtq(S, b) - effAtq(S, a));
        damageCreature(S, first, 2, name); if (rest[0]) damageCreature(S, rest[0], 2, name);
        return true;
      }
      case "Barrage": { if (!LANES.includes(arg)) return false; for (const c of S.creatures.filter(c => c.lane === arg && targetable(S, c))) damageCreature(S, c, 1, name); return true; }
      case "Onde de choc": { const r = Number(arg); if (!(r >= 1 && r <= 3)) return false; for (const c of S.creatures.filter(c => c.k === r && targetable(S, c))) damageCreature(S, c, 1, name); return true; }
      case "Champ de stase": { if (!LANES.includes(arg)) return false; S.stase.push(arg); return true; }
      case "Famine": { if (S.phase !== "A_start") return false; S.famine += 2; return true; }
      case "Brouillage": {
        const c = cr(arg); if (!c || !c.new) return false;
        S.creatures.splice(S.creatures.indexOf(c), 1);
        S.piles[CREATURES[c.name].lvl].push(c.name); shuffle(S.piles[CREATURES[c.name].lvl]);
        log(S, "colonie", `Brouillage : le déploiement de ${c.name} est annulé.`);
        return true;
      }
      case "Effort": S.extraPts += 2; return true;
      case "Cadence": S.extraPts += 2; return true;
      case "Réparation": { // arg = liste de clés de tuiles, 3 PV au total
        if (!Array.isArray(arg) || !arg.length || arg.length > 3) return false;
        for (const k of arg) { const t = S.tiles[k]; if (t && t.hp < t.max) t.hp += 1; }
        return true;
      }
      case "Renouvellement": { // arg = indices de la main à défausser
        if (!Array.isArray(arg)) return false;
        const idx = [...arg].sort((a, b) => b - a);
        for (const i of idx) if (S.hand[i]) S.tileDiscard.push(S.hand.splice(i, 1)[0]);
        for (let i = 0; i < arg.length; i++) drawOneTile(S);
        return true;
      }
      case "Reconversion": { // arg = {hand: index, tile: clé}
        if (!arg || S.hand[arg.hand] === undefined || !S.tiles[arg.tile] || S.tiles[arg.tile].name === "Mur de départ") return false;
        const old = S.tiles[arg.tile], nn = S.hand[arg.hand];
        const [x, y] = parse(arg.tile);
        S.tiles[arg.tile] = tileStats(nn, x, y);
        if (TILES[nn].perm) S.workersBase += 1;
        S.hand[arg.hand] = old.name;
        log(S, "colonie", `Reconversion : ${pubName(nn)} remplace ${old.camo && !old.revealed ? "une tuile camouflée" : old.name}.`);
        return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------------ tour de la colonie
  function startDefenderTurn(S) {
    S.phase = "D_main"; S.alloc = { N: 0, E: 0, S: 0, O: 0 }; S.extraPts = 0; S.cadence = false; S.firedSupports = [];
  }
  const pubName = name => (TILES[name] && TILES[name].camo ? "tuile camouflée" : name);
  // Le chantier est affecté à une lane ; la case exacte n'est choisie qu'à la fin de la construction.
  function startChantier(S, handIdx, lane) {
    if (S.phase !== "D_main" || S.chantiers[lane].length >= S.chPerLane || S.hand[handIdx] === undefined) return false;
    const name = S.hand.splice(handIdx, 1)[0];
    S.chantiers[lane].push({ tile: name, left: TILES[name].d, fresh: true });
    log(S, "colonie", `Chantier lancé en lane ${LANE_NAME[lane]} : ${pubName(name)}.`);
    return true;
  }
  function cancelChantier(S, lane, i) {
    const ch = S.chantiers[lane][i]; if (!ch || !ch.fresh || S.phase !== "D_main") return false;
    S.chantiers[lane].splice(i, 1); S.hand.push(ch.tile); return true;
  }
  function supportTargets(S, sk) { // portée : les 8 cases autour du support (diagonales comprises)
    const [x, y] = parse(sk);
    return S.creatures.filter(c => { const [a, b] = toGlobal(c.lane, c.u, c.k); return Math.max(Math.abs(a - x), Math.abs(b - y)) === 1 && targetable(S, c); });
  }
  const rocketMilestones = S => [3, 6, 9].filter(f => S.floors >= f).length;
  const turretDmg = (S, l) => (l === 1 ? 1 + rocketMilestones(S) : l === 2 ? 2 : 0);
  function fire(S, sk, creatureId) {
    const lvl = S.supports[sk];
    if (!lvl || lvl === 3 || S.firedSupports.includes(sk)) return false;
    const c = S.creatures.find(o => o.id === creatureId);
    if (!c || !supportTargets(S, sk).includes(c)) return false;
    const t = resolveTarget(S, c);
    S.firedSupports.push(sk);
    fx(S, { t: "shot", sk, id: t.id });
    damageCreature(S, t, turretDmg(S, lvl), `tourelle de niveau ${lvl}`);
    killCheck(S);
    return true;
  }
  function autoFire(S) {
    const order = Object.keys(S.supports).sort((a, b) => S.supports[a] - S.supports[b]);
    for (const sk of order) {
      if (S.supports[sk] === 3 || S.firedSupports.includes(sk)) continue;
      const cands = supportTargets(S, sk); if (!cands.length) { S.firedSupports.push(sk); continue; }
      const d = turretDmg(S, S.supports[sk]);
      cands.sort((a, b) => ((resolveTarget(S, b).hp <= d) - (resolveTarget(S, a).hp <= d)) || a.k - b.k || effAtq(S, b) - effAtq(S, a));
      fire(S, sk, cands[0].id);
    }
  }
  function endDefenderTurn(S) {
    // tirs restants (automatiques)
    autoFire(S);
    // chantiers et débordement
    let rocket = totalPoints(S) - allocated(S);
    for (const lane of LANES) {
      let pts = S.alloc[lane];
      const done = [];
      for (const ch of S.chantiers[lane]) {
        const use = Math.min(pts, ch.left); ch.left -= use; pts -= use;
        if (ch.left === 0) done.push(ch);
      }
      rocket += pts;
      for (const ch of done) {
        S.chantiers[lane].splice(S.chantiers[lane].indexOf(ch), 1);
        S.toPlace.push({ tile: ch.tile, lane });
      }
    }
    for (const lane of LANES) for (const ch of S.chantiers[lane]) ch.fresh = false;
    S.pendingRocket = rocket;
    skipUnplaceable(S);
    if (S.toPlace.length) { S.phase = "D_place"; return; }
    finishDefenderTurn(S);
  }
  // pose d'un bâtiment achevé : la colonie choisit une case valable de sa lane
  function placeTargets(S) {
    const p = S.toPlace[0]; if (!p) return [];
    const out = [];
    for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) { const k = key(x, y); if (canTarget(S, p.lane, k)) out.push(k); }
    return out;
  }
  function skipUnplaceable(S) {
    while (S.toPlace.length && !placeTargets(S).length) {
      const p = S.toPlace.shift(); S.hand.push(p.tile);
      log(S, "colonie", `${pubName(p.tile)} : aucune case libre en lane ${LANE_NAME[p.lane]}, la tuile revient en main.`);
    }
  }
  function placeTile(S, k) {
    if (S.phase !== "D_place" || !placeTargets(S).includes(k)) return false;
    const p = S.toPlace.shift(), [x, y] = parse(k);
    pushBack(S, k);
    S.tiles[k] = tileStats(p.tile, x, y);
    if (TILES[p.tile].perm) { S.workersBase += 1; log(S, "colonie", "+1 travailleur permanent."); }
    log(S, "colonie", TILES[p.tile].camo ? `Une tuile camouflée est construite en lane ${LANE_NAME[p.lane]}.` : `${p.tile} construit en lane ${LANE_NAME[p.lane]}.`);
    skipUnplaceable(S);
    if (!S.toPlace.length) finishDefenderTurn(S);
    return true;
  }
  function finishDefenderTurn(S) {
    const rocket = S.pendingRocket || 0; S.pendingRocket = 0;
    // fusée
    S.rocketPts += Math.max(0, rocket);
    while (S.floors < FLOORS && S.rocketPts >= FLOOR_COST) {
      S.rocketPts -= FLOOR_COST; S.floors += 1; S.workersBase += 1;
      log(S, "colonie", `Étage ${S.floors} de la fusée achevé : +1 travailleur.`);
      if (S.floors === 3) { S.techBonus += 2; log(S, "colonie", "Palier 3 : +2 technologies permanentes."); }
      if (S.floors === 6) { S.chPerLane = 2; log(S, "colonie", "Palier 6 : +1 chantier par lane."); }
      if (S.floors === 9) {
        for (const c of S.creatures) S.piles[CREATURES[c.name].lvl].push(c.name);
        for (const l of [1, 2, 3]) shuffle(S.piles[l]);
        log(S, "colonie", `Palier 9 · Nuke : ${S.creatures.length} créature${S.creatures.length > 1 ? "s" : ""} détruite${S.creatures.length > 1 ? "s" : ""}.`);
        S.creatures = [];
      }
      if (S.floors === FLOORS) { S.winner = "colonie"; log(S, "jeu", "La fusée décolle : la colonie gagne."); return; }
    }
    placeSupports(S);
    // sortilèges de soutien non joués : défaussés
    const sup = S.spells.filter(s => SPELLS[s].kind === "sup");
    if (sup.length) { S.spellDiscard.push(...sup); S.spells = S.spells.filter(s => SPELLS[s].kind !== "sup"); }
    drawTiles(S);
    const n = spellsPerTurn(S);
    for (let i = 0; i < n; i++) {
      if (!S.spellDeck.length) { S.spellDeck = shuffle(S.spellDiscard); S.spellDiscard = []; }
      if (S.spellDeck.length) S.spells.push(S.spellDeck.pop());
    }
    if (n) log(S, "colonie", `${n} sortilège${n > 1 ? "s" : ""} pioché${n > 1 ? "s" : ""}.`);
    S.round += 1;
    startAttackerTurn(S);
  }
  function drawOneTile(S) {
    if (!S.tileDeck.length) { S.tileDeck = shuffle(S.tileDiscard); S.tileDiscard = []; }
    if (S.tileDeck.length) S.hand.push(S.tileDeck.pop());
  }
  function drawTiles(S) { while (S.hand.length < handSize(S)) { const before = S.hand.length; drawOneTile(S); if (S.hand.length === before) break; } }

  // ------------------------------------------------------------------ actions des joueurs
  // Point d'entrée unique, utilisé par l'interface locale et par le serveur en ligne :
  // vérifie le camp, la phase et les paramètres, puis appelle les fonctions de règles ci-dessus.
  // Les transitions de phase qui vivaient dans l'interface (fenêtres Famine / Réaction, passage aux tirs) sont ici.
  const PHASE_SIDE = { A_famine: "colonie", A_start: "essaim", A_deploy: "essaim", A_upgrade: "essaim", A_react: "colonie", A_attack: "essaim", D_main: "colonie", D_fire: "colonie", D_place: "colonie" };
  const actor = S => PHASE_SIDE[S.phase] || null;
  const isInt = v => Number.isInteger(v);
  const isLane = l => LANES.includes(l);
  const own = (o, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
  const creatureById = (S, id) => S.creatures.find(c => c.id === id);
  // à la fin du tour de la colonie : fenêtre Famine si la colonie tient Famine
  function openFamine(S) { if (!S.winner && S.phase === "A_start" && S.spells.includes("Famine")) S.phase = "A_famine"; }
  function spellArgOk(S, name, arg) {
    switch (name) {
      case "Frappe orbitale": case "Salve": case "Brouillage": return isInt(arg);
      case "Barrage": case "Champ de stase": return isLane(arg);
      case "Onde de choc": return [1, 2, 3, "1", "2", "3"].includes(arg);
      case "Réparation": return Array.isArray(arg) && arg.length >= 1 && arg.length <= 3 && arg.every(k => own(S.tiles, k));
      case "Renouvellement": return Array.isArray(arg) && arg.every(i => isInt(i) && i >= 0 && i < S.hand.length) && new Set(arg).size === arg.length;
      case "Reconversion": return !!arg && isInt(arg.hand) && arg.hand >= 0 && arg.hand < S.hand.length && own(S.tiles, arg.tile);
      default: return arg === null || arg === undefined;
    }
  }
  const ACTIONS = {
    famine: { phase: ["A_famine"], run(S, a) {
      S.phase = "A_start";
      if (a.play) { const i = S.spells.indexOf("Famine"); if (i >= 0) useSpell(S, i, null); }
      return true;
    } },
    draw: { phase: ["A_start"], run: S => { attackerDraw(S); return true; } },
    deploy: { phase: ["A_deploy"], run: (S, a) => isInt(a.uid) && isLane(a.lane) && isInt(a.u) && Math.abs(a.u) <= 2 && deploy(S, a.uid, a.lane, a.u) },
    endDeploy: { phase: ["A_deploy"], run: S => { endDeploy(S); return true; } },
    invest: { phase: ["A_deploy", "A_upgrade"], run: (S, a) => own(TREES, a.t) && own(TREES[a.t], a.s) && isInt(a.n) && a.n > 0 && invest(S, a.t, a.s, a.n) },
    raid: { phase: ["A_upgrade"], run: (S, a) => isInt(a.id) && isLane(a.lane) && raid(S, a.id, a.lane) },
    instinct: { phase: ["A_deploy", "A_upgrade"], run(S, a) {
      const c = creatureById(S, a.id);
      if (!c || c.name !== "Catalyseur" || !["mobilite", "furtivite"].includes(a.v)) return false;
      c.instinct = a.v; return true;
    } },
    instTarget: { phase: ["A_deploy", "A_upgrade"], run(S, a) {
      const c = creatureById(S, a.id);
      if (!c || c.name !== "Catalyseur" || !caseMates(S, c).some(m => m.id === a.v)) return false;
      c.instinctTarget = a.v; return true;
    } },
    toAttacks: { phase: ["A_upgrade"], run(S) {
      startAttacks(S);
      if (S.spells.some(s => SPELLS[s].kind === "off" && s !== "Famine")) S.phase = "A_react";
      return true;
    } },
    reactDone: { phase: ["A_react"], run: S => { S.phase = "A_attack"; return true; } },
    spell: { phase: ["A_react", "D_main"], run(S, a) {
      const name = isInt(a.i) ? S.spells[a.i] : undefined; if (!name) return false;
      const kind = S.phase === "A_react" ? "off" : "sup";
      if (SPELLS[name].kind !== kind || name === "Famine" || !spellArgOk(S, name, a.arg)) return false;
      return useSpell(S, a.i, a.arg === undefined ? null : a.arg);
    } },
    act: { phase: ["A_attack"], run(S, a) {
      const c = creatureById(S, a.id); if (!c || c.acted) return false;
      if (a.target !== undefined && a.target !== null && typeof a.target !== "string") return false;
      act(S, c, a.target || undefined); return true;
    } },
    actAll: { phase: ["A_attack"], run(S) {
      for (const c of attackOrder(S)) { if (S.winner) break; if (S.creatures.includes(c)) act(S, c); }
      return true;
    } },
    endA: { phase: ["A_attack"], run(S) { if (attackOrder(S).length) return false; endAttackerTurn(S); return true; } },
    startCh: { phase: ["D_main"], run: (S, a) => isInt(a.i) && isLane(a.lane) && startChantier(S, a.i, a.lane) },
    cancelCh: { phase: ["D_main"], run: (S, a) => isLane(a.lane) && isInt(a.i) && cancelChantier(S, a.lane, a.i) },
    alloc: { phase: ["D_main"], run(S, a) {
      if (!isLane(a.lane) || ![1, -1].includes(a.d)) return false;
      const v = S.alloc[a.lane] + a.d;
      if (v < 0 || allocated(S) + a.d > totalPoints(S)) return false;
      S.alloc[a.lane] = v; return true;
    } },
    toFire: { phase: ["D_main"], run: S => { S.phase = "D_fire"; return true; } },
    fire: { phase: ["D_fire"], run: (S, a) => own(S.supports, a.sk) && isInt(a.id) && fire(S, a.sk, a.id) },
    autoFire: { phase: ["D_fire"], run: S => { autoFire(S); return true; } },
    endD: { phase: ["D_fire"], run(S) { endDefenderTurn(S); openFamine(S); return true; } },
    placeAt: { phase: ["D_place"], run(S, a) { if (!placeTile(S, a.k)) return false; openFamine(S); return true; } },
  };
  // renvoie "" si l'action est appliquée, sinon la raison du refus (S n'est pas modifié dans ce cas)
  function apply(S, side, type, args) {
    const A = own(ACTIONS, type) ? ACTIONS[type] : null;
    if (!A) return "action inconnue";
    if (S.winner) return "la partie est terminée";
    if (side !== actor(S)) return "ce n'est pas votre tour";
    if (!A.phase.includes(S.phase)) return "action impossible dans cette phase";
    return A.run(S, args && typeof args === "object" ? args : {}) ? "" : "action refusée";
  }

  // ------------------------------------------------------------------ vue filtrée par camp (jeu en ligne)
  // Copie de S sans les informations cachées à ce camp. L'ordre des pioches n'est envoyé à personne :
  // les listes cachées sont remplacées par des listes de null de même longueur (seul le nombre est connu).
  const blank = a => a.map(() => null);
  function viewFor(S, side) {
    const V = JSON.parse(JSON.stringify(S));
    V.view = side; V.handoff = null;
    V.tileDeck = blank(V.tileDeck); V.tileDiscard = blank(V.tileDiscard);
    V.spellDeck = blank(V.spellDeck); V.spellDiscard = blank(V.spellDiscard);
    for (const l of [1, 2, 3]) V.piles[l] = blank(V.piles[l]);
    if (side === "colonie") V.handA = blank(V.handA);
    if (side === "essaim") {
      V.hand = blank(V.hand); V.spells = blank(V.spells);
      const hideName = n => (TILES[n] && TILES[n].camo ? null : n);
      for (const l of LANES) for (const ch of V.chantiers[l]) ch.tile = hideName(ch.tile);
      for (const p of V.toPlace) p.tile = hideName(p.tile);
      if (!clairvoyance(S)) for (const k of Object.keys(V.tiles)) {
        const t = V.tiles[k];
        if (t.camo && !t.revealed) V.tiles[k] = { name: null, camo: 1, revealed: false, hidden: true, hp: null, max: null, ep: 0, ren: 0, tech: 0, temp: 0, trap: 0 };
      }
    }
    return V;
  }

  // événements visuels envoyés à un camp : les PV d'une tuile camouflée encore cachée ne sont pas transmis à l'essaim
  function fxFor(S, side, events) {
    return events.map(e => {
      if (side === "essaim" && e.t === "hit") {
        const t = S.tiles[e.k];
        if (t && t.camo && !t.revealed && !clairvoyance(S)) return { ...e, n: null, hp: null };
      }
      return e;
    });
  }

  return {
    fxFor,
    PHASE_SIDE, ACTIONS, actor, apply, viewFor,
    CREATURES, TILES, TILE_TEXT, SPELLS, TIERS, TREES, LANES, LANE_NAME, COLS, COST_R1, COST_R2, FLOORS,
    key, parse, ring, cellLane, toGlobal, toLocal, nextStep, isSupportCell, supportLanes, supportWalls, setRng, shuffle,
    newGame, tier, capOf, laneCount, tech, spellsPerTurn, bonusWorkers, totalPoints, allocated, handSize, posKey, caseMates,
    clairvoyance, hasMobility, isStealthy, maxHp, baseAtq, effAtq, bonusHp, epinesOf, canTarget, walk, laneTiles,
    attacks, pushBack, act, attackerDraw, canDeploy, deploy, endDeploy, canBuy, buy, invest, invested, nodeState, investable, nodeCost, raid, startAttacks, attackOrder, endAttackerTurn,
    useSpell, startChantier, cancelChantier, placeTargets, placeTile, supportTargets, turretDmg, rocketMilestones, fire, autoFire, endDefenderTurn, targetable, resolveTarget,
    tileStats, placeSupports, killCheck, pubName,
  };
})();
if (typeof module !== "undefined") module.exports = SF;
