// Swarm & Steel — moteur de règles v0.3 (livret v0.3). Aucun accès au DOM : testable sous Node.
"use strict";
const SF = (() => {
  // ------------------------------------------------------------------ données
  const CREATURES = {
    "Écorcheur": { type: "aggro", lvl: 1, cost: 3, pv: 1, atq: 3 },
    // aggros : toujours 1 PV, quel que soit le niveau (Oni, 01/11/2026 ; avant Ravageur 2, Massacreur 3)
    "Ravageur": { type: "aggro", lvl: 2, cost: 4, pv: 1, atq: 5 },
    "Massacreur": { type: "aggro", lvl: 3, cost: 7, pv: 1, atq: 7 },
    "Carapace": { type: "tank", lvl: 1, cost: 3, pv: 3, atq: 1 },
    // tous les tanks à 1 ATQ (Oni, 01/11/2026 ; avant Béhémoth 2, Colosse 3)
    "Béhémoth": { type: "tank", lvl: 2, cost: 4, pv: 5, atq: 1 },
    "Colosse": { type: "tank", lvl: 3, cost: 7, pv: 7, atq: 1 },
    // soutiens : 2 / 4 / 6 PV selon le niveau (Oni, 02/11/2026 ; avant 2 / 5 / 8)
    "Œil-sonde": { type: "soutien", lvl: 1, cost: 2, pv: 2, atq: 0, cap: "vision", capName: "Vision", capText: "Tant qu'il est en vie, toutes les tuiles camouflées de sa lane sont révélées, même celles posées ensuite." },
    "Glaneur": { type: "soutien", lvl: 1, cost: 2, pv: 2, atq: 0, cap: "soin", capName: "Aura Soin 2", capText: "En fin de tour de l'essaim, les autres créatures de sa case regagnent 2 PV." },
    "Hurleur": { type: "soutien", lvl: 1, cost: 2, pv: 2, atq: 0, cap: "fureur", capName: "Aura Fureur", capText: "+1 ATQ aux autres créatures de sa case." },
    // Phéromone (Oni, 01/11/2026) : l'Aura Leurre est remplacée par l'Aura Butin
    "Phéromone": { type: "soutien", lvl: 2, cost: 3, pv: 4, atq: 0, cap: "butin", capName: "Aura Butin", capText: "Chaque autre créature de sa case qui détruit un bâtiment rapporte +1 biomasse en plus." },
    "Perforeur": { type: "soutien", lvl: 2, cost: 3, pv: 4, atq: 0, cap: "percee", capName: "Aura Percée", capText: "Les autres créatures de sa case gagnent la percée." },
    // Catalyseur (Oni, 02/11/2026) : l'Aura Instinct (Mobilité ou Furtivité à une créature) est remplacée par l'Aura Cuirasse
    "Catalyseur": { type: "soutien", lvl: 2, cost: 3, pv: 4, atq: 0, cap: "cuirasse", capName: "Aura Cuirasse", capText: "Les autres créatures de sa case ne subissent pas les dégâts d'Épines." },
    // Sapeur (Oni, 01/11/2026) : à son déploiement, détruit un bâtiment au choix de sa lane (avant : un chantier de l'atelier)
    "Sapeur": { type: "soutien", lvl: 3, cost: 5, pv: 6, atq: 0, cap: "sabotage", capName: "Sabotage", capText: "Quand il est déployé, détruit un bâtiment au choix de sa lane." },
    "Sporeur": { type: "soutien", lvl: 3, cost: 5, pv: 6, atq: 0, cap: "spores", capName: "Aura Spores", capText: "Quand une autre créature de sa case attaque une tuile, chaque tuile qui touche cette tuile subit 2 dégâts par Sporeur de la case (sauf une tuile encore camouflée et non visible)." },
  };
  const PILES = {
    1: { aggro: [["Écorcheur", 6]], tank: [["Carapace", 6]], soutien: [["Œil-sonde", 2], ["Glaneur", 2], ["Hurleur", 2]] },
    2: { aggro: [["Ravageur", 6]], tank: [["Béhémoth", 6]], soutien: [["Phéromone", 2], ["Perforeur", 2], ["Catalyseur", 2]] },
    3: { aggro: [["Massacreur", 6]], tank: [["Colosse", 6]], soutien: [["Sapeur", 3], ["Sporeur", 3]] },
  };
  // nom: durée, pv (nombre ou 'ap' / 'front' / 'reduit'), épines, renforcé, tech, temp, perm, piège, direction, exemplaires
  const TILES = {
    "Palissade": { d: 1, pv: 2, ep: 0, camo: 1, n: 3 }, // 3 ex. (Oni, 02/11/2026 ; avant 6, puis 4)
    "Muraille": { d: 2, pv: 4, ep: 0, camo: 1, n: 3 }, // 3 ex. (Oni, 02/11/2026 ; avant 6, puis 4)
    "Rempart": { d: 3, pv: 4, ep: 0, ren: 2, camo: 1, n: 3 },
    "Bastion": { d: 3, pv: 3, ep: 0, ren: 3, camo: 1, n: 2 },
    "Haie d'épines": { d: 1, pv: 1, ep: 2, camo: 1, n: 3 },
    "Mur hérissé": { d: 2, pv: 2, ep: 2, camo: 1, n: 2 },
    "Antenne": { d: 1, pv: 1, ep: 0, tech: 1, n: 3 },
    "Laboratoire": { d: 2, pv: 2, ep: 0, tech: 2, n: 3 }, // 3 ex. (Oni, 02/11/2026 ; avant 2)
    "Observatoire": { d: 3, pv: 3, ep: 0, tech: 3, n: 3 }, // 3 ex. (Oni, 02/11/2026 ; avant 1)
    "Baraquement": { d: 1, pv: 1, ep: 1, temp: 1, n: 3 }, // Épines 1 (Oni, 01/11/2026)
    // Dortoir (Oni, 01/11/2026 ; avant 1 PV, travailleur permanent, 2 ex.) : 3 PV, Renforcé 2 (d'abord « Bouclier 2 »), +1 travailleur temporaire
    "Dortoir": { d: 3, pv: 3, ep: 0, ren: 2, temp: 1, n: 3 },
    // Archives (Oni, 01/11/2026) : 3 PV, +1 technologie, face visible
    "Archives": { d: 2, pv: 3, ep: 0, tech: 1, n: 3 },
    // Avant-postes : posés face visible (Oni, 01/11/2026), avec l'Aura d'épines
    "Avant-poste du Nord": { d: 2, pv: "ap", dir: "N", ep: 0, aura: 1, n: 1 },
    "Avant-poste de l'Est": { d: 2, pv: "ap", dir: "E", ep: 0, aura: 1, n: 1 },
    "Avant-poste du Sud": { d: 2, pv: "ap", dir: "S", ep: 0, aura: 1, n: 1 },
    "Avant-poste de l'Ouest": { d: 2, pv: "ap", dir: "O", ep: 0, aura: 1, n: 1 },
    "Ligne de front": { d: 2, pv: "front", ep: 1, camo: 1, n: 2 }, // Épines 1 (Oni, 01/11/2026)
    "Réduit": { d: 2, pv: "reduit", ep: 1, camo: 1, n: 2 }, // Épines 1 (Oni, 01/11/2026)
    "Piège": { d: 2, pv: 2, ep: 0, trap: 1, camo: 1, n: 3 }, // 3 dégâts quand il se déclenche (Oni, 01/11/2026 ; avant 2)
    // Siphon (Oni, 02/11/2026) : piège camouflé ; révélé par une attaque, il retire 3 biomasse à l'essaim (jamais sous 3)
    "Siphon": { d: 2, pv: 2, ep: 0, siphon: 3, camo: 1, n: 3 },
    // Ronceraie (Oni, 01/11/2026) : 3 tours, 2 PV, Renforcé 2, Épines 2, camouflée, 3 exemplaires
    "Ronceraie": { d: 3, pv: 2, ep: 2, ren: 2, camo: 1, n: 3 },
    // Égide (Oni, 01/11/2026) : Renforcé 2 (02/11/2026 : le Bouclier est fondu dans Renforcé)
    "Égide": { d: 2, pv: 2, ep: 0, ren: 2, camo: 1, n: 3 }, // 2 PV (Oni, 04/11/2026 ; avant 3)
  };
  const TILE_TEXT = {
    "Rempart": "Renforcé 2 : perd 1 PV par tranche de 2 dégâts.", "Bastion": "Renforcé 3 : perd 1 PV par tranche de 3 dégâts.",
    "Avant-poste du Nord": "2 PV ; 4 PV dans la lane Nord.", "Avant-poste de l'Est": "2 PV ; 4 PV dans la lane Est.",
    "Avant-poste du Sud": "2 PV ; 4 PV dans la lane Sud.", "Avant-poste de l'Ouest": "2 PV ; 4 PV dans la lane Ouest.",
    "Ligne de front": "PV = 1 + couronne (2 / 3 / 4).", "Réduit": "PV = 5 − couronne (4 / 3 / 2).",
    "Piège": "Camouflé. 3 dégâts à la créature qui le révèle en l'attaquant, avant qu'elle frappe.",
    "Ronceraie": "Camouflée. Renforcé 2, Épines 2.",
    "Siphon": "Camouflé. Révélé par une attaque de l'essaim : l'essaim perd 3 biomasse (jamais sous 3).",
    "Égide": "Camouflée. Renforcé 2 : perd 1 PV par tranche de 2 dégâts.",
    "Antenne": "+1 technologie.", "Laboratoire": "+2 technologies.", "Observatoire": "+3 technologies.",
    "Baraquement": "+1 travailleur tant que la tuile tient.", "Dortoir": "Renforcé 2. +1 travailleur tant que la tuile tient.", "Archives": "+1 technologie.",
  };
  const SPELLS = {
    "Frappe orbitale": { kind: "off", n: 3, text: "4 dégâts à 1 créature." },
    "Salve": { kind: "off", n: 3, text: "2 dégâts à 2 créatures de la même case." },
    "Barrage": { kind: "off", n: 2, text: "1 dégât à chaque créature d'une lane." },
    "Onde de choc": { kind: "off", n: 1, text: "1 dégât à chaque créature d'une couronne, sur les 4 lanes." },
    // Champ de stase (Oni, 04/11/2026 ; avant : toute une lane) : un seul bâtiment, et ses Épines sont suspendues
    "Champ de stase": { kind: "off", n: 2, text: "Choisissez un bâtiment : ce tour, il ne subit aucun dégât et les créatures qui l'attaquent ne subissent pas ses Épines." },
    "Famine": { kind: "off", n: 2, text: "Au début du tour de l'essaim : ce tour, son budget est sa biomasse divisée par 2 (arrondie à l'inférieur)." },
    // Brouillage (Oni, 04/11/2026 ; avant : annulait le déploiement d'une créature posée ce tour)
    "Brouillage": { kind: "off", n: 2, text: "Choisissez une créature : ce tour, elle ne bouge pas et n'attaque pas." },
    "Effort": { kind: "sup", n: 3, text: "+2 points de construction ce tour." },
    "Cadence": { kind: "sup", n: 1, text: "+2 points de construction ce tour." },
    // Feu nourri (Oni, 02/11/2026) : sort de soutien, 2 exemplaires
    "Feu nourri": { kind: "sup", n: 2, text: "Ce tour, chaque tourelle tire 2 fois." },
    "Réparation": { kind: "sup", n: 3, text: "Rendez 3 PV, répartis sur vos tuiles abîmées." },
    "Renouvellement": { kind: "sup", n: 2, text: "Défaussez des tuiles de votre main, puis repiochez-en autant." },
    "Reconversion": { kind: "sup", n: 2, text: "Échangez une tuile de votre main avec une tuile construite." },
  };
  const TIERS = [ // biomasse mini, N1, N2, N3, plafond
    // Oni, 02/11/2026 : 4 paliers, départ (plafond 2), puis 9, 15, 21 de biomasse (brièvement 10 / 15 / 20, puis 9 / 15 / 20)
    // (avant : 5 paliers, départ 3 puis 6 / 9 / 12 / 15, plafonds 1 à 5 ; à l'origine 4 / 7 / 10 / 13)
    { min: 0, n: [3, 0, 0], cap: 2 }, { min: 9, n: [3, 2, 0], cap: 3 }, { min: 15, n: [4, 2, 1], cap: 4 },
    { min: 21, n: [4, 3, 3], cap: 5 },
  ];
  const TREES = {
    aggro: { A1: ["Férocité", "+1 ATQ."], B1: ["Mobilité", "Les créatures aggro se déplacent de 2 cases par tour au lieu d'1 et gagnent la Furtivité."],
      A2: ["Carnage", "+2 ATQ (total +3)."], C2: ["Déploiement", "Chaque tour, 2 cartes de niveau 1 en plus, déployées gratuitement."],
      B2: ["Essaim agrandi", "+3 au plafond de population de chaque lane."] },
    // Provocation : ancien nom « Protection » (Oni, 02/11/2026)
    tank: { A1: ["Carapace épaisse", "+1 PV."], B1: ["Provocation", "Les tirs visant une créature non tank de sa case visent ce tank. Les tanks ne subissent plus les dégâts d'Épines."],
      A2: ["Blindage", "+2 PV (total +3)."], C2: ["Réincarnation", "Une fois par tour, un tank mort revient au début de votre tour suivant."],
      B2: ["Masse vivante", "+1 PV par autre créature sur sa case."] },
    soutien: { A1: ["Mue", "Tous les soutiens gagnent l'Aura Mobilité 1 (+1 case aux autres créatures de leur case) et l'Aura +1 PV (+1 PV aux autres créatures de leur case)."], B1: ["Griffes", "Tous les soutiens gagnent l'Aura Griffes : +1 ATQ aux autres créatures de leur case."],
      A2: ["Régénération", "Tous les soutiens gagnent l'Aura Soin 2 (qui s'ajoute à leurs autres auras de soin)."], C2: ["Clairvoyance", "Tant qu'un soutien est en jeu, toutes les tuiles camouflées sont visibles. Les Œil-sonde de la pioche sortent du jeu."],
      B2: ["Frénésie", "Chaque soutien double les dégâts d'une autre créature de sa case, au choix (cumulable : deux Frénésies sur la même créature la quadruplent)."] },
  };
  const COST_R1 = 6, COST_R2 = 12, FLOORS = 12;
  const MIN_BIOMASS = 3; // la biomasse de l'essaim ne descend jamais sous 3 (Oni, 02/11/2026)
  const TRAP_DMG = 3; // dégâts du Piège (Oni, 01/11/2026 ; avant 2)
  // Famine (Oni, 02/11/2026) : ce tour, le budget de l'essaim est sa biomasse divisée par 2, arrondie à l'inférieur (avant : −5)
  const famineBudget = b => Math.floor(b / 2);
  // coût d'un étage de la fusée selon le palier atteint : étages 1-3 → 3 points, 4-6 → 4, 7-9 → 5, 10-12 → 6 (décision d'Oni, 30/10/2026)
  const FLOOR_COSTS = [2, 4, 6, 8]; // Oni, 04/11/2026 (avant 2 / 3 / 4 / 5 ; à l'origine 3 / 4 / 5 / 6)
  const floorCost = S => FLOOR_COSTS[Math.min(3, Math.floor(S.floors / 3))];
  // tuiles de départ : 16 « Barbelé » (1 PV, Épines 1, face visible), repérées par start: true ; détruites, elles sont
  // retirées du jeu (pas de défausse). Noms successifs : « Mur de départ », « Haie de départ », « Haie d'épines » (Oni, 02/11/2026).
  const START_WALL = "Barbelé";
  // Version du jeu : +1 au dernier chiffre à chaque mise à jour livrée (journal : docs/versions.md).
  // Les statistiques de fin de partie sont regroupées par version ; le serveur refuse une page d'une autre version.
  const VERSION = "0.4.24";
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
      version: VERSION, round: 1, phase: "A_start", view: "essaim", handoff: "essaim", winner: null, nextId: 1, killed: 0,
      tiles: {}, supports: {}, chantiers: { N: [], E: [], S: [], O: [] }, chPerLane: 1, toPlace: [], pendingRocket: 0,
      workersBase: 3, floors: 0, rocketPts: 0, techBonus: 0,
      tileDeck: [], tileDiscard: [], hand: [],
      spellDeck: [], spellDiscard: [], spells: [],
      alloc: { N: 0, E: 0, S: 0, O: 0 }, extraPts: 0, cadence: false, firedSupports: [],
      biomass: 5, budget: 0, reserve: 0, famine: 0, startHand: true, // départ : 5 biomasse (Oni, 04/11/2026 ; avant 3)
      piles: { 1: [], 2: [], 3: [] }, handA: [], creatures: [], reincQueue: [], reincUsed: false, raidUsed: false,
      upgrades: { aggro: { r1: null, r2: null }, tank: { r1: null, r2: null }, soutien: { r1: null, r2: null } }, invest: {},
      stase: [], log: [],
    };
    // haies d'épines de départ : la couronne 1 et toute la couronne 2 (Oni, 01/11/2026) ; les supports de niveau 2 suivent
    for (const lane of LANES) for (const [u, k] of [[0, 1], [-1, 2], [0, 2], [1, 2]]) {
      const [x, y] = toGlobal(lane, u, k);
      S.tiles[key(x, y)] = { name: START_WALL, start: true, hp: 1, max: 1, ep: 1, ren: 0, tech: 0, temp: 0, trap: 0, revealed: true };
    }
    for (const sx of [1, -1]) for (const sy of [1, -1]) S.supports[key(sx, sy)] = 1;
    placeSupports(S); // supports de niveau 2 aux coins de la couronne 2 (leurs murs sont posés)
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
  // une carte revient dans sa pioche (créature morte, carte non jouée, Nuke) — sauf l'Œil-sonde une fois Clairvoyance
  // acquise : il sort du jeu (Oni, 04/11/2026)
  const retired = (S, name) => name === "Œil-sonde" && S.upgrades.soutien.r2 === "C";
  function toPile(S, name) { if (!retired(S, name)) S.piles[CREATURES[name].lvl].push(name); }
  function addPile(S, lvl, type) {
    for (const [name, n] of PILES[lvl][type]) for (let i = 0; i < n; i++) S.piles[lvl].push(name);
    shuffle(S.piles[lvl]);
  }

  // ------------------------------------------------------------------ dérivés
  const tier = S => { let t = 0; TIERS.forEach((r, i) => { if (S.biomass >= r.min) t = i; }); return t; };
  // plafond de population par lane : celui du palier, +3 avec l'amélioration aggro « Essaim agrandi » (décision d'Oni, 30/10/2026)
  const capOf = S => TIERS[tier(S)].cap + (S.upgrades.aggro.r2 === "B" ? 3 : 0);
  const laneCount = (S, lane) => S.creatures.filter(c => c.lane === lane).length;
  const tech = S => Object.values(S.tiles).reduce((a, t) => a + (t.tech || 0), 0) + S.techBonus;
  const spellsPerTurn = S => { const t = tech(S); return t >= 9 ? 3 : t >= 6 ? 2 : t >= 3 ? 1 : 0; };
  // support de niveau 3 : +3 travailleurs tant qu'il tient (Oni, 02/11/2026 ; avant +2)
  const SUP3_WORKERS = 2; // Oni, 06/11/2026 soir (+3 le 06/11 en journée, +2 du 04/11 au 06/11, +3 du 02/11 au 04/11)
  const bonusWorkers = S => Object.values(S.tiles).reduce((a, t) => a + (t.temp || 0), 0) + SUP3_WORKERS * Object.values(S.supports).filter(l => l === 3).length;
  const totalPoints = S => S.workersBase + bonusWorkers(S) + S.extraPts;
  const allocated = S => LANES.reduce((a, l) => a + S.alloc[l], 0);
  // main de tuiles : 4, +1 à chaque palier de la fusée atteint (étages 3, 6, 9) → 4 / 5 / 6 / 7 (décision d'Oni, 30/10/2026 ;
  // avant : 4, puis 8 à l'étage 6). Le 2ᵉ chantier par lane de l'étage 6 ne change plus la main.
  const handSize = S => 4 + rocketMilestones(S);
  const posKey = c => { const [x, y] = toGlobal(c.lane, c.u, c.k); return c.k === 4 ? "in:" + c.lane + ":" + c.u : key(x, y); };
  const caseMates = (S, c) => S.creatures.filter(o => o !== c && posKey(o) === posKey(c));
  const anySoutien = S => S.creatures.some(c => CREATURES[c.name].type === "soutien");
  const clairvoyance = S => S.upgrades.soutien.r2 === "C" && anySoutien(S);
  function hasMobility(S, c) {
    return CREATURES[c.name].type === "aggro" && S.upgrades.aggro.r1 === "B";
  }
  function isStealthy(S, c) {
    // Furtivité : donnée par la Mobilité aux aggros (Oni, 05/11/2026 ; avant : par la Mue aux soutiens)
    return CREATURES[c.name].type === "aggro" && S.upgrades.aggro.r1 === "B";
  }
  function hasPercee(S, c) {
    return caseMates(S, c).some(o => o.name === "Perforeur");
  }
  // Auras (Oni, 02/11/2026) : une aura profite toujours aux AUTRES créatures de sa case, jamais à elle-même, et toutes les
  // auras se cumulent (chaque source compte). countMates : nombre d'autres créatures de la case qui vérifient f.
  const countMates = (S, c, f) => caseMates(S, c).filter(f).length;
  const isSoutien = o => CREATURES[o.name].type === "soutien";
  function bonusHp(S, c) {
    let b = CREATURES[c.name].type === "tank" && S.upgrades.tank.r2 === "B" ? caseMates(S, c).length : 0; // Masse vivante
    if (S.upgrades.soutien.r1 === "A") b += countMates(S, c, isSoutien); // Mue : Aura +1 PV de chaque soutien de la case
    return b;
  }
  function maxHp(S, name) {
    const b = CREATURES[name]; let m = b.pv;
    if (b.type === "tank") { if (S.upgrades.tank.r1 === "A") m += 1; if (S.upgrades.tank.r2 === "A") m += 2; } // Oni, 01/11/2026 (avant +2 / +4)
    return m;
  }
  function baseAtq(S, name) {
    const b = CREATURES[name]; let a = b.atq;
    if (b.type === "aggro") { if (S.upgrades.aggro.r1 === "A") a += 1; if (S.upgrades.aggro.r2 === "A") a += 2; }
    return a;
  }
  // Frénésie (soutien, rang 2 côté B) : chaque soutien double les dégâts d'une autre créature de sa case, au choix de l'essaim
  // (S.frenzy[id du soutien] = id de la cible ; par défaut, l'autre créature de plus forte ATQ). Cumulable (Oni, 02/11/2026) :
  // ×2 par soutien qui la choisit (deux soutiens sur la même créature : ×4).
  function frenzyOf(S, src) {
    const others = S.creatures.filter(o => o !== src && posKey(o) === posKey(src));
    const chosen = S.frenzy && others.find(o => o.id === S.frenzy[src.id]);
    if (chosen) return chosen;
    others.sort((a, b) => baseAtq(S, b.name) - baseAtq(S, a.name) || a.id - b.id);
    return others[0] || null;
  }
  function frenzyCount(S, c) {
    if (S.upgrades.soutien.r2 !== "B") return 0;
    return caseMates(S, c).filter(o => isSoutien(o) && frenzyOf(S, o) === c).length;
  }
  function setFrenzy(S, srcId, targetId) {
    const src = S.creatures.find(o => o.id === srcId), t = S.creatures.find(o => o.id === targetId);
    if (S.upgrades.soutien.r2 !== "B" || !src || !t || src === t || !isSoutien(src) || posKey(src) !== posKey(t)) return false;
    S.frenzy = S.frenzy || {}; S.frenzy[src.id] = t.id;
    log(S, "essaim", `Frénésie : ${src.name} double les dégâts ${/^[AEIOUYÉÈÊŒ]/i.test(t.name) ? "d'" : "de "}${t.name}.`);
    return true;
  }
  function effAtq(S, c) {
    if (!attacks(c)) return 0;
    let a = baseAtq(S, c.name);
    a += countMates(S, c, o => o.name === "Hurleur"); // Aura Fureur : +1 par Hurleur de la case
    if (S.upgrades.soutien.r1 === "B") a += countMates(S, c, isSoutien); // Aura Griffes : +1 par soutien de la case
    a *= 2 ** frenzyCount(S, c); // Frénésie : ×2 par soutien qui choisit cette créature
    return a;
  }
  function soinValue(S, c) { // somme des auras de soin des autres créatures de la case : Glaneur 1, Régénération 2 par soutien
    let v = 0;
    for (const o of caseMates(S, c)) {
      if (o.name === "Glaneur") v += 2; // Aura Soin 2 (Oni, 05/11/2026 ; avant 1)
      if (S.upgrades.soutien.r2 === "A" && isSoutien(o)) v += 2;
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
    return { name, hp: pv, max: pv, ep: t.ep, ren: t.ren || 0, tech: t.tech || 0, temp: t.temp || 0, trap: t.trap || 0, siphon: t.siphon || 0, camo: t.camo || 0, revealed: !t.camo };
  }
  // Épines d'une tuile (Oni, 01/11/2026) : ses Épines propres, +1 par support de niveau 2 dans les 8 cases autour
  // (pour toute tuile, même sans Épines), +1 par Avant-poste dans les 8 cases autour (« Aura d'épines ») ; tout se cumule.
  // visibleOnly : pour l'affichage côté essaim, ne compte pas l'aura d'un Avant-poste encore caché.
  function epinesOf(S, k, visibleOnly) {
    let e = S.tiles[k].ep || 0;
    const [x, y] = parse(k), clair = clairvoyance(S);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const o = S.tiles[key(x + dx, y + dy)];
      if (!o || !TILES[o.name] || !TILES[o.name].aura) continue;
      if (visibleOnly && o.camo && !o.revealed && !clair) continue;
      e += 1;
    }
    return e;
  }
  // by : la créature dont l'attaque a détruit la tuile (attaque, percée ou spores), pour l'Aura Butin de la Phéromone
  function destroyTile(S, k, why, by) {
    const t = S.tiles[k]; if (!t) return;
    delete S.tiles[k];
    if (!t.start) S.tileDiscard.push(t.name);
    // biomasse gagnée : 1, quelle que soit la tuile détruite (Oni, 01/11/2026 ; du 30/10 au 01/11 : sa durée de construction)
    // Aura Butin : +1 par Phéromone sur la case de la créature (Oni, 01/11/2026 ; cumulable depuis le 02/11/2026)
    const butin = by ? countMates(S, by, o => o.name === "Phéromone") : 0;
    const gain = 1 + butin;
    S.biomass += gain;
    fx(S, { t: "tileDown", k, n: gain });
    const nm = t.camo && !t.revealed ? "Une tuile camouflée" : t.name; // ne pas nommer une tuile camouflée jamais révélée
    log(S, "essaim", `${nm} détruit${why ? " (" + why + ")" : ""} : +${gain} biomasse${butin ? " (Aura Butin)" : ""}.`);
    checkSupportsFall(S);
  }
  function checkSupportsFall(S) {
    for (const sk of Object.keys(S.supports)) {
      if (!supportWalls(...parse(sk)).some(w => S.tiles[w])) {
        log(S, "essaim", `Le support de niveau ${S.supports[sk]} tombe : +1 biomasse.`);
        delete S.supports[sk];
        S.biomass += 1;
        fx(S, { t: "tileDown", k: sk, n: 1 });
      }
    }
  }
  function placeSupports(S) {
    for (let r = 1; r <= 3; r++) for (const sx of [1, -1]) for (const sy of [1, -1]) {
      const x = sx * r, y = sy * r, k = key(x, y);
      if (!S.supports[k] && supportInner(x, y).every(w => S.tiles[w])) {
        S.supports[k] = r;
        fx(S, { t: "supUp", k });
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
    fx(S, { t: "push", ids: here.map(c => c.id), lane, u, to: nk });
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
        toPile(S, c.name); shuffle(S.piles[CREATURES[c.name].lvl]);
      }
    }
  }
  function damageCreature(S, c, n, why) {
    c.hp -= n;
    fx(S, { t: "dmg", id: c.id, n, hp: c.hp + bonusHp(S, c) });
    log(S, "colonie", `${c.name} subit ${n} dégât${n > 1 ? "s" : ""}${why ? " (" + why + ")" : ""}.`);
  }
  // cible imposée par Provocation (tank) ; renvoie null si la créature est intouchable (Furtivité)
  function resolveTarget(S, c) {
    const mates = caseMates(S, c);
    if (isStealthy(S, c) && mates.some(o => !isStealthy(S, o))) return null;
    let t = c;
    if (CREATURES[t.name].type !== "tank" && S.upgrades.tank.r1 === "B") {
      const tank = mates.find(o => CREATURES[o.name].type === "tank");
      if (tank) t = tank;
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
  // ---- blocs (décision d'Oni, 30/10/2026) : toutes les créatures d'une même case avancent ensemble.
  // Dans une lane, les cases les plus proches de la fusée agissent d'abord ; l'essaim choisit l'ordre d'attaque dans le bloc ;
  // quand la tuile visée tombe, tout le bloc avance jusqu'à la tuile suivante seulement s'il reste une créature qui doit encore
  // frapper (on n'avance qu'avant une attaque, jamais après la dernière).
  const pathLen = (u, k) => { let n = 0; while (k !== 0 && n < 12) { [u, k] = nextStep(u, k); n++; } return n; };
  const blockAt = (S, key) => S.creatures.filter(c => posKey(c) === key);
  function readyCases(S) {
    const un = S.creatures.filter(c => !c.acted);
    return [...new Set(un.map(posKey))].filter(key => {
      const c = un.find(o => posKey(o) === key), d = pathLen(c.u, c.k);
      return !un.some(o => o.lane === c.lane && pathLen(o.u, o.k) < d);
    }).sort((a, b) => { const ca = un.find(o => posKey(o) === a), cb = un.find(o => posKey(o) === b); return pathLen(ca.u, ca.k) - pathLen(cb.u, cb.k) || ca.id - cb.id; });
  }
  function auraFx(S, c) {
    const auras = [];
    if (caseMates(S, c).some(o => o.name === "Hurleur")) auras.push("Fureur");
    if (S.upgrades.soutien.r1 === "B" && caseMates(S, c).some(o => CREATURES[o.name].type === "soutien")) auras.push("Griffes");
    const fz = frenzyCount(S, c); if (fz) auras.push(fz > 1 ? `Frénésie ×${2 ** fz}` : "Frénésie");
    if (hasPercee(S, c)) auras.push("Percée");
    if (caseMates(S, c).some(o => o.name === "Catalyseur")) auras.push("Cuirasse");
    if (auras.length) fx(S, { t: "aura", id: c.id, names: auras });
  }
  function hitRocket(S, c) {
    S.workersBase -= 1; S.killed = (S.killed || 0) + 1; // une attaque contre la fusée tue un seul travailleur, quelle que soit la force
    fx(S, { t: "rocket", id: c.id });
    log(S, "essaim", `${c.name} frappe la fusée : −1 travailleur.`);
    if (S.workersBase <= 0) { S.winner = "essaim"; log(S, "jeu", "La colonie n'a plus de travailleurs : l'essaim gagne."); }
  }
  // Déplacement (Oni, 02/11/2026) : une case par tour, deux avec la Mobilité (aggros). Une créature qui arrive au contact
  // d'une tuile ou de la fusée attaque aussitôt. Les aggros mobiles quittent leur case et agissent d'abord, en bloc à part.
  // Aura Mobilité du Glaneur (Oni, 02/11/2026) : +1 case par Glaneur de la case, pour les autres créatures (cumulable) ;
  // le Glaneur lui-même avance de 2 cases (vitesse de base 2) pour suivre le groupe.
  // Aura Mobilité : +1 case par Glaneur de la case, et par soutien de la case avec la Mue (Oni, 05/11/2026) ; tout se cumule
  // vitesse de base : 2 pour le Glaneur et toutes les créatures de niveau 3 (Oni, 06/11/2026), sinon 1
  // (le Glaneur a perdu sa vitesse de 2 et son Aura Mobilité 1 le 06/11/2026, Oni)
  const baseSpeed = c => (CREATURES[c.name].lvl === 3 ? 2 : 1);
  const speedOf = (S, c) => baseSpeed(c) + (hasMobility(S, c) ? 1 : 0)
    + (S.upgrades.soutien.r1 === "A" ? countMates(S, c, isSoutien) : 0);
  function actCase(S, key, order) {
    if (!readyCases(S).includes(key)) return false;
    const block = blockAt(S, key).filter(c => !c.acted);
    for (const c of block) c.acted = true;
    // vitesses fixées au début de l'action ; les plus rapides partent devant, en blocs séparés
    const speed = new Map(block.map(c => [c, speedOf(S, c)]));
    for (const v of [...new Set(speed.values())].sort((a, b) => b - a)) {
      const group = block.filter(c => speed.get(c) === v && S.creatures.includes(c));
      if (group.length && !S.winner) groupAct(S, group, order, v);
    }
    return true;
  }
  function groupAct(S, group, order, steps) {
    const att = group.filter(attacks);
    const seq = [];
    for (const id of Array.isArray(order) ? order : []) { const c = att.find(o => o.id === id); if (c && !seq.includes(c)) seq.push(c); }
    for (const c of att) if (!seq.includes(c)) seq.push(c);
    let pos = { lane: group[0].lane, u: group[0].u, k: group[0].k };
    // avance case par case (sans diagonale) tant qu'il reste des déplacements ; renvoie la cible au contact, ou null
    const advance = () => {
      const members = group.filter(c => S.creatures.includes(c)), from = cellName(pos.u, pos.k);
      let target = null;
      for (;;) {
        const [nu, nk] = nextStep(pos.u, pos.k);
        if (nk === 0) { target = "fusee"; break; }
        const tk = key(...toGlobal(pos.lane, nu, nk));
        if (S.tiles[tk]) { target = tk; break; }
        if (steps <= 0) break;
        fx(S, { t: "move", ids: members.map(c => c.id), lane: pos.lane, from: [pos.u, pos.k], to: [nu, nk] });
        for (const c of members) { c.u = nu; c.k = nk; }
        pos = { lane: pos.lane, u: nu, k: nk }; steps--;
      }
      const to = cellName(pos.u, pos.k), tgt = target === "fusee" ? "devant la fusée" : target ? "devant " + cellName(...toLocal(pos.lane, ...parse(target))) : "pas encore au contact";
      log(S, "essaim", `${members.length > 1 ? `Bloc de ${members.length} (${members.map(c => c.name).join(", ")}, lane ${LANE_NAME[pos.lane]})` : `${members[0].name} (lane ${LANE_NAME[pos.lane]})`} : ${from === to ? "reste en " + from : from + " → " + to}, ${tgt}.`);
      return target;
    };
    let target = advance();
    for (const c of seq) {
      if (S.winner || !target) break;
      if (!S.creatures.includes(c)) continue; // tuée entre-temps (Épines, piège)
      // le bloc n'avance qu'AVANT une attaque (Oni, 01/11/2026) : si la tuile visée est tombée, il avance maintenant
      // (s'il lui reste un déplacement ce tour), juste avant que cette créature frappe
      if (target !== "fusee" && !S.tiles[target]) { target = advance(); if (!target) break; }
      auraFx(S, c);
      if (target === "fusee") { hitRocket(S, c); continue; }
      hitTile(S, c, target, effAtq(S, c), true);
      killCheck(S);
    }
  }
  // ---- Déplacements au choix (Oni, 04/11/2026) : chaque créature se déplace seule, case par case et sans diagonale,
  // sur toute case voisine de sa lane (cases d'entrée comprises), vers la fusée comme en arrière (retraite) ; jamais sur
  // un bâtiment, un coin de support ni la fusée. Ensuite, si elle le veut, elle attaque un bâtiment qui touche sa case
  // (ou la fusée) ; après une attaque, elle ne bouge plus. Son nombre de déplacements est fixé à son premier pas du tour
  // (vitesse de base, Mobilité, Aura Mobilité du Glaneur de sa case à ce moment-là).
  const gpos = c => toGlobal(c.lane, c.u, c.k);
  function walkable(S, lane, x, y) {
    if (cellLane(x, y) !== lane) return false;
    const r = ring(x, y);
    if (r === 4) return Math.abs(toLocal(lane, x, y)[0]) <= 2;
    return r >= 1 && r <= 3 && !S.tiles[key(x, y)];
  }
  function stepsLeft(S, c) { return c.acted ? 0 : Math.max(0, (c.spd !== undefined ? c.spd : speedOf(S, c)) - (c.moved || 0)); }
  function reachable(S, c) { // cases atteignables ce tour : { clé globale : { u, k, d (distance), prev (clé précédente) } }
    const left = stepsLeft(S, c), out = {};
    const [x0, y0] = gpos(c), start = key(x0, y0), seen = new Set([start]);
    let front = [[x0, y0]];
    for (let d = 1; d <= left; d++) {
      const next = [];
      for (const [x, y] of front) for (const [a, b] of neighbors(x, y)) {
        const k = key(a, b); if (seen.has(k) || !walkable(S, c.lane, a, b)) continue;
        seen.add(k); next.push([a, b]);
        const [u, kk] = toLocal(c.lane, a, b);
        out[k] = { u, k: kk, d, prev: key(x, y) };
      }
      front = next;
    }
    return out;
  }
  function strikeTargets(S, c) { // bâtiments qui touchent sa case (sans diagonale), ou la fusée
    if (c.acted || !attacks(c)) return [];
    const [x, y] = gpos(c), out = [];
    for (const [a, b] of neighbors(x, y)) { if (a === 0 && b === 0) out.push("fusee"); else if (S.tiles[key(a, b)]) out.push(key(a, b)); }
    return out;
  }
  const canAct = (S, c) => !c.acted && (strikeTargets(S, c).length > 0 || Object.keys(reachable(S, c)).length > 0);
  function moveCreature(S, id, u, k) {
    const c = S.creatures.find(o => o.id === id); if (!c || c.acted) return false;
    const R = reachable(S, c), dest = key(...toGlobal(c.lane, u, k)), r = R[dest];
    if (!r) return false;
    if (c.spd === undefined) c.spd = speedOf(S, c);
    const start = key(...gpos(c)), path = [];
    for (let cur = dest; cur && cur !== start; cur = R[cur] ? R[cur].prev : null) path.unshift([R[cur].u, R[cur].k]);
    const from = cellName(c.u, c.k);
    fx(S, { t: "move", ids: [c.id], lane: c.lane, from: [c.u, c.k], to: [u, k], path });
    c.u = u; c.k = k; c.moved = (c.moved || 0) + r.d;
    log(S, "essaim", `${c.name} (lane ${LANE_NAME[c.lane]}) : ${from} → ${cellName(u, k)}.`);
    return true;
  }
  function strikeAt(S, id, target) {
    const c = S.creatures.find(o => o.id === id); if (!c || !strikeTargets(S, c).includes(target)) return false;
    c.acted = true;
    auraFx(S, c);
    if (target === "fusee") hitRocket(S, c); else hitTile(S, c, target, effAtq(S, c), true);
    killCheck(S);
    return true;
  }
  // résolution automatique d'une créature (bouton « Tout résoudre ») : elle avance sur le chemin vers la fusée tant
  // qu'elle peut, puis attaque ce qui est devant elle s'il y a quelque chose
  function autoCreature(S, c) {
    if (c.acted) return;
    for (let i = 0; i < 8 && stepsLeft(S, c) > 0; i++) {
      const [nu, nk] = nextStep(c.u, c.k);
      if (nk === 0 || S.tiles[key(...toGlobal(c.lane, nu, nk))]) break;
      if (!moveCreature(S, c.id, nu, nk)) break;
    }
    const [nu, nk] = nextStep(c.u, c.k);
    const front = nk === 0 ? "fusee" : key(...toGlobal(c.lane, nu, nk));
    if (attacks(c) && strikeTargets(S, c).includes(front)) strikeAt(S, c.id, front);
    else c.acted = true;
  }
  // une seule créature, sans limite de déplacement (utilisé seulement par les tests de règles ciblés)
  function act(S, c) {
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
    auraFx(S, c);
    const target = w.target;
    if (target === "fusee") { hitRocket(S, c); return; }
    hitTile(S, c, target, effAtq(S, c), true);
    killCheck(S);
  }
  function hitTile(S, c, tk, dmg, primary) {
    const t = S.tiles[tk]; if (!t) return;
    const [x, y] = parse(tk), lane = cellLane(x, y);
    const epVal = epinesOf(S, tk); // calculé avant les dégâts : la tuile peut tomber
    // Une tuile encore camouflée ne subit rien des dégâts de percée (ni de zone) et reste cachée (Oni, 02/11/2026)
    if (!primary && t.camo && !t.revealed && !clairvoyance(S)) { // Vision et Clairvoyance la rendent vulnérable
      fx(S, { t: "hit", id: c.id, k: tk, n: 0, hp: t.hp });
      log(S, "essaim", "Percée : la tuile suivante est encore camouflée, les dégâts sont annulés.");
      return;
    }
    if (t.camo && !t.revealed) { // Camouflage : la première attaque retourne la tuile
      t.revealed = true;
      fx(S, { t: "reveal", k: tk, trap: !!t.trap });
      if (t.trap) {
        log(S, "essaim", "Un piège est révélé.");
        // le piège blesse la créature AVANT qu'elle frappe : si elle en meurt, elle n'inflige rien (Oni, 01/11/2026)
        if (!clairvoyance(S)) {
          damageCreature(S, c, TRAP_DMG, "piège");
          if (c.hp + bonusHp(S, c) <= 0) { log(S, "essaim", `${c.name} meurt dans le piège avant de frapper.`); return; }
        }
      } else log(S, "essaim", `Tuile camouflée révélée : ${t.name}.`);
      // Siphon : retire de la biomasse à l'essaim, sans jamais la faire passer sous 3 (Oni, 02/11/2026)
      if (t.siphon && !clairvoyance(S)) {
        const before = S.biomass; S.biomass = Math.max(MIN_BIOMASS, S.biomass - t.siphon);
        fx(S, { t: "siphon", k: tk, n: before - S.biomass });
        log(S, "colonie", `Siphon : l'essaim perd ${before - S.biomass} biomasse (biomasse ${S.biomass}).`);
      }
    }
    if (S.stase.includes(tk)) { // Champ de stase : ce bâtiment ne subit rien ce tour
      fx(S, { t: "hit", id: c.id, k: tk, n: 0, hp: t.hp });
      log(S, "colonie", `Champ de stase : ${t.camo && !t.revealed ? "le bâtiment" : t.name} ne subit aucun dégât.`);
    } else {
      // Renforcé X : 1 PV par tranche complète de X dégâts, plusieurs PV possibles d'un coup
      // (Oni, 02/11/2026 : retour à la règle d'origine après un essai à 1 PV maximum par attaque)
      const loss = t.ren ? Math.floor(dmg / t.ren) : dmg;
      const capacity = t.ren ? t.hp * t.ren : t.hp;
      const excess = dmg - capacity;
      t.hp -= loss;
      fx(S, { t: "hit", id: c.id, k: tk, n: Math.min(loss, t.hp + loss), hp: Math.max(0, t.hp) });
      log(S, "essaim", `${c.name} inflige ${dmg} à ${t.name} (−${Math.min(loss, t.hp + loss)} PV).`);
      const spores = primary ? 2 * countMates(S, c, o => o.name === "Sporeur") : 0; // 2 dégâts par Sporeur de la case (cumulable, Oni 02/11/2026)
      if (spores) {
        for (const [a, b] of neighbors(x, y)) {
          const nk = key(a, b), nt = S.tiles[nk];
          // les spores n'atteignent pas une tuile encore camouflée (Oni, 02/11/2026)
          if (nt && !(nt.camo && !nt.revealed && !clairvoyance(S)) && !S.stase.includes(nk)) {
            const sp = spores, spLoss = nt.ren ? Math.floor(sp / nt.ren) : sp;
            nt.hp -= spLoss;
            fx(S, { t: "hit", id: null, k: nk, n: spLoss, hp: Math.max(0, nt.hp) });
            if (nt.hp <= 0) destroyTile(S, nk, "spores", c);
          }
        }
      }
      if (t.hp <= 0) {
        destroyTile(S, tk, "", c);
        // Percée (Oni, 01/11/2026) : les dégâts en trop ne passent qu'à la case SUIVANTE du chemin, sans aller plus loin :
        // un bâtiment les subit, la fusée perd 1 travailleur, une case vide les perd. Pas d'enchaînement.
        if (primary && excess > 0 && hasPercee(S, c)) {
          const [nu, nk] = nextStep(...toLocal(lane, x, y));
          if (nk === 0) {
            S.workersBase -= 1; S.killed = (S.killed || 0) + 1;
            fx(S, { t: "rocket", id: c.id });
            log(S, "essaim", "Percée : la fusée est touchée, −1 travailleur.");
            if (S.workersBase <= 0) S.winner = "essaim";
          } else {
            const next = key(...toGlobal(lane, nu, nk));
            if (S.tiles[next]) hitTile(S, c, next, excess, false);
            else log(S, "essaim", `Percée : ${excess} dégât${excess > 1 ? "s" : ""} perdu${excess > 1 ? "s" : ""}, la case suivante est vide.`);
          }
        }
      }
    }
    // Aura Cuirasse (Catalyseur sur la case) : pas de dégâts d'Épines (Oni, 02/11/2026)
    if (primary && epVal > 0) {
      if (S.stase.includes(tk)) log(S, "colonie", `Champ de stase : pas d'Épines pour ${c.name}.`);
      else if (caseMates(S, c).some(o => o.name === "Catalyseur")) log(S, "essaim", `Aura Cuirasse : ${c.name} ne subit pas les Épines.`);
      // Provocation (tank, côté B) : les tanks ne subissent plus les Épines (Oni, 02/11/2026)
      else if (CREATURES[c.name].type === "tank" && S.upgrades.tank.r1 === "B") log(S, "essaim", `Provocation : ${c.name} ne subit pas les Épines.`);
      else damageCreature(S, c, epVal, "épines");
    }
  }

  // ------------------------------------------------------------------ tour de l'essaim
  function startAttackerTurn(S) {
    S.phase = "A_start"; S.raidUsed = false; S.reincUsed = false; S.stase = [];
    for (const c of S.creatures) { c.new = false; c.acted = false; delete c.mobUsed; delete c.jammed; delete c.moved; delete c.spd; }
    // Réincarnation
    for (const r of S.reincQueue) {
      const nc = makeCreature(S, r.name, r.lane, r.u);
      S.creatures.push(nc);
      fx(S, { t: "reinc", id: nc.id });
      log(S, "essaim", `${r.name} se réincarne à l'entrée de la lane ${LANE_NAME[r.lane]}.`);
    }
    S.reincQueue = [];
    S.famine = 0;
  }
  function attackerDraw(S) {
    const t = TIERS[tier(S)];
    S.handA = [];
    // Premier tour (Oni, 04/11/2026) : à la place de la pioche, une créature de niveau 1 de chaque type (aggro, tank, et un
    // soutien tiré au hasard), prises dans la pioche de niveau 1 et payées normalement
    if (S.startHand) {
      delete S.startHand;
      for (const type of ["aggro", "tank", "soutien"]) {
        const i = S.piles[1].findIndex(n => CREATURES[n].type === type); // pioche mélangée : le soutien est tiré au hasard
        if (i >= 0) S.handA.push({ name: S.piles[1].splice(i, 1)[0], free: false, uid: S.nextId++ });
      }
      S.budget = S.famine ? famineBudget(S.biomass) : S.biomass;
      fx(S, { t: "draw", n: S.handA.length });
      S.phase = "A_deploy";
      log(S, "essaim", `Main de départ : ${S.handA.map(c => c.name).join(", ")} ; budget ${S.budget}.`);
      return;
    }
    // Déploiement (aggro, centre du rang 2) : les 2 cartes gratuites de niveau 1 sont piochées EN PREMIER, sinon la pioche
    // normale (qui se rabat sur le niveau 1 quand les niveaux 2 et 3 sont vides) pouvait vider le niveau 1 avant elles.
    if (S.upgrades.aggro.r2 === "C") {
      let n = 0;
      for (let i = 0; i < 2; i++) if (S.piles[1].length) { S.handA.push({ name: S.piles[1].pop(), free: true, uid: S.nextId++ }); n++; }
      log(S, "essaim", n === 2 ? "Déploiement : 2 cartes de niveau 1 gratuites." : `Déploiement : pioche de niveau 1 ${n ? "presque vide, 1 seule carte gratuite" : "vide, aucune carte gratuite"}.`);
    }
    for (let lvl = 3; lvl >= 1; lvl--) {
      for (let i = 0; i < t.n[lvl - 1]; i++) {
        for (let l = lvl; l >= 1; l--) if (S.piles[l].length) { S.handA.push({ name: S.piles[l].pop(), free: false, uid: S.nextId++ }); break; }
      }
    }
    S.budget = S.famine ? famineBudget(S.biomass) : S.biomass;
    fx(S, { t: "draw", n: S.handA.length });
    S.phase = "A_deploy";
    log(S, "essaim", `Palier ${tier(S) + 1} : ${S.handA.length} cartes, budget ${S.budget}.`);
  }
  function canDeploy(S, card, lane) {
    const cost = card.free ? 0 : CREATURES[card.name].cost;
    return S.phase === "A_deploy" && cost <= S.budget && laneCount(S, lane) < capOf(S);
  }
  function deploy(S, uid, lane, u, target) {
    const i = S.handA.findIndex(c => c.uid === uid); if (i < 0) return false;
    const card = S.handA[i];
    if (!canDeploy(S, card, lane)) return false;
    // Sapeur : s'il y a des bâtiments dans sa lane, il faut en désigner un (target)
    if (card.name === "Sapeur" && laneTiles(S, lane).length && !laneTiles(S, lane).includes(target)) return false;
    S.budget -= card.free ? 0 : CREATURES[card.name].cost;
    S.handA.splice(i, 1);
    const c = makeCreature(S, card.name, lane, u);
    S.creatures.push(c);
    fx(S, { t: "deploy", id: c.id });
    log(S, "essaim", `${card.name} déployé${card.free ? " gratuitement" : ""} en lane ${LANE_NAME[lane]}, colonne ${COLS[u + 2]}.`);
    if (card.name === "Sapeur" && target && S.tiles[target]) {
      fx(S, { t: "sapeur", k: target });
      log(S, "essaim", `Sabotage : le Sapeur détruit un bâtiment de la lane ${LANE_NAME[lane]}.`);
      destroyTile(S, target, "sabotage", c);
    }
    if (card.name === "Œil-sonde") revealLane(S, lane);
    return true;
  }
  // Vision de l'Œil-sonde (Oni, 04/11/2026) : tant qu'il est en vie, les tuiles camouflées de sa lane sont révélées,
  // y compris celles posées plus tard (appelé au déploiement et à chaque pose de la colonie). Une tuile révélée le reste.
  function visionSweep(S) {
    const lanes = new Set(S.creatures.filter(c => c.name === "Œil-sonde").map(c => c.lane));
    for (const lane of lanes) if (laneTiles(S, lane).some(k => S.tiles[k].camo && !S.tiles[k].revealed)) revealLane(S, lane);
  }
  function revealLane(S, lane) {
    fx(S, { t: "vision", lane, keys: laneTiles(S, lane).filter(k => S.tiles[k].camo && !S.tiles[k].revealed) });
    for (const k of laneTiles(S, lane)) if (S.tiles[k].camo && !S.tiles[k].revealed) { S.tiles[k].revealed = true; if (S.tiles[k].trap) S.tiles[k].disarmed = true; log(S, "essaim", `Vision : tuile camouflée révélée (${S.tiles[k].name}).`); }
  }
  function endDeploy(S) {
    if (S.budget > 0) { S.reserve += S.budget; log(S, "essaim", `${S.budget} biomasse versée à la réserve (réserve ${S.reserve}).`); }
    S.budget = 0;
    for (const c of S.handA) toPile(S, c.name);
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
    fx(S, { t: "invest", type, slot, got: invested(S, type, slot), cost: nodeCost(slot) });
    log(S, "essaim", `${n} biomasse investie dans ${TREES[type][slot][0]} (${invested(S, type, slot)}/${nodeCost(slot)}).`);
    if (invested(S, type, slot) >= nodeCost(slot)) { delete S.invest[type + ":" + slot]; acquire(S, type, slot); }
    return true;
  }
  function acquire(S, type, slot) {
    const u = S.upgrades[type];
    const before = S.creatures.filter(c => CREATURES[c.name].type === type).map(c => [c, maxHp(S, c.name)]);
    if (slot.endsWith("1")) { u.r1 = slot[0]; addPile(S, 2, type); } else { u.r2 = slot[0]; addPile(S, 3, type); }
    fx(S, { t: "upgrade", type, slot, name: TREES[type][slot][0] });
    for (const [c, m] of before) c.hp += maxHp(S, c.name) - m;
    log(S, "essaim", `Amélioration ${TREES[type][slot][0]} (${type}) acquise : les cartes de niveau ${slot.endsWith("1") ? 2 : 3} entrent dans la pioche.`);
    if (type === "soutien" && slot === "C2") {
      log(S, "essaim", "Clairvoyance : les tuiles camouflées sont visibles tant qu'un soutien est en jeu.");
      // les Œil-sonde de la pioche sortent du jeu ; ceux en main ou sur le plateau restent, mais ne reviendront plus dans la pioche
      const n = S.piles[1].filter(x => x === "Œil-sonde").length;
      S.piles[1] = S.piles[1].filter(x => x !== "Œil-sonde");
      if (n) log(S, "essaim", `Clairvoyance : ${n} Œil-sonde ${n > 1 ? "sortent" : "sort"} de la pioche (plus utile${n > 1 ? "s" : ""}).`);
    }
  }
  function canBuy(S, type, slot) { return nodeState(S, type, slot) === "open" && investable(S) + invested(S, type, slot) >= nodeCost(slot); }
  function buy(S, type, slot) { return canBuy(S, type, slot) && invest(S, type, slot, nodeCost(slot)); }
  function startAttacks(S) { S.phase = "A_attack"; }
  function attackOrder(S) { return [...S.creatures].filter(c => !c.acted).sort((a, b) => a.k - b.k || a.id - b.id); }
  function endAttackerTurn(S) {
    if (S.winner) return;
    // auras de soin
    for (const c of S.creatures) {
      const v = soinValue(S, c), m = maxHp(S, c.name);
      if (v && c.hp < m) { const before = c.hp; c.hp = Math.min(m, c.hp + v); fx(S, { t: "cheal", id: c.id, n: c.hp - before, hp: c.hp + bonusHp(S, c) }); log(S, "essaim", `${c.name} regagne ${v} PV.`); }
    }
    // sortilèges non joués : ils restent en main jusqu'à ce qu'ils soient joués (Oni, 01/11/2026 ; avant : défaussés)
    S.stase = [];
    startDefenderTurn(S);
  }

  // ------------------------------------------------------------------ sortilèges
  function useSpell(S, idx, arg) {
    const name = S.spells[idx]; if (!name) return false;
    const sp = SPELLS[name];
    // événement visuel du sort, placé avant ses effets (dégâts, soins…) ; seules des informations publiques
    const at = S.fx ? S.fx.length : 0;
    const pubArg = ["Frappe orbitale", "Salve", "Brouillage"].includes(name) ? { id: arg } : name === "Barrage" ? { lane: arg } : name === "Champ de stase" ? { k: arg }
      : name === "Onde de choc" ? { ring: Number(arg) } : name === "Réparation" ? { keys: arg } : name === "Reconversion" ? { k: arg && arg.tile }
      : name === "Renouvellement" ? { n: Array.isArray(arg) ? arg.length : 0 } : {};
    fx(S, { t: "spell", name, kind: sp.kind, ...pubArg });
    const ok = applySpell(S, name, arg);
    if (!ok) { if (S.fx) S.fx.splice(at); return false; }
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
      case "Champ de stase": { if (typeof arg !== "string" || !S.tiles[arg]) return false; S.stase.push(arg); return true; }
      case "Famine": { if (S.phase !== "A_start") return false; S.famine = 1; return true; }
      case "Brouillage": { // la créature visée (Provocation et Furtivité s'appliquent) ne bouge pas et n'attaque pas ce tour
        const c0 = cr(arg); if (!c0) return false; const c = resolveTarget(S, c0); if (!c || c.acted) return false;
        c.acted = true; c.jammed = true;
        log(S, "colonie", `Brouillage : ${c.name} ne bouge pas et n'attaque pas ce tour.`);
        return true;
      }
      case "Effort": S.extraPts += 2; return true;
      case "Cadence": S.extraPts += 2; return true;
      case "Feu nourri": S.doubleFire = true; return true;
      case "Réparation": { // arg = liste de clés de tuiles, 3 PV au total
        if (!Array.isArray(arg) || !arg.length || arg.length > 3) return false;
        for (const k of arg) { const t = S.tiles[k]; if (t && t.hp < t.max) { t.hp += 1; fx(S, { t: "heal", k, n: 1, hp: t.hp }); } }
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
        if (!arg || S.hand[arg.hand] === undefined || !S.tiles[arg.tile] || S.tiles[arg.tile].start) return false;
        const old = S.tiles[arg.tile], nn = S.hand[arg.hand];
        const [x, y] = parse(arg.tile);
        S.tiles[arg.tile] = tileStats(nn, x, y);
        fx(S, { t: "place", k: arg.tile });
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
    S.phase = "D_main"; S.alloc = { N: 0, E: 0, S: 0, O: 0 }; S.extraPts = 0; S.cadence = false; S.firedSupports = []; S.doubleFire = false;
  }
  const pubName = name => (TILES[name] && TILES[name].camo ? "tuile camouflée" : name);
  // Le chantier est affecté à une lane ; la case exacte n'est choisie qu'à la fin de la construction.
  function startChantier(S, handIdx, lane) {
    if (S.phase !== "D_main" || S.chantiers[lane].length >= S.chPerLane || S.hand[handIdx] === undefined) return false;
    const name = S.hand.splice(handIdx, 1)[0];
    S.chantiers[lane].push({ tile: name, left: TILES[name].d, fresh: true });
    fx(S, { t: "chantier", lane });
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
  // tirs restants d'une tourelle ce tour : 1, ou 2 avec Feu nourri
  const shotsLeft = (S, sk) => (S.doubleFire ? 2 : 1) - S.firedSupports.filter(k => k === sk).length;
  function fire(S, sk, creatureId) {
    const lvl = S.supports[sk];
    if (!lvl || lvl === 3 || shotsLeft(S, sk) <= 0) return false;
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
    for (const sk of order) while (S.supports[sk] && S.supports[sk] !== 3 && shotsLeft(S, sk) > 0) {
      const cands = supportTargets(S, sk); if (!cands.length) { S.firedSupports.push(sk); continue; }
      const d = turretDmg(S, S.supports[sk]);
      cands.sort((a, b) => ((resolveTarget(S, b).hp <= d) - (resolveTarget(S, a).hp <= d)) || a.k - b.k || effAtq(S, b) - effAtq(S, a));
      if (!fire(S, sk, cands[0].id)) break;
    }
  }
  // Fin du tour de la colonie (ordre décidé par Oni le 30/10/2026) : chantiers et pose des bâtiments, nouveaux supports
  // (dès la pose), fusée (étages, paliers), PUIS tirs des tourelles (phase D_fire), puis pioches. Les supports apparus et les paliers atteints
  // pendant le tour comptent donc pour les tirs.
  function endDefenderTurn(S) {
    // chantiers et débordement
    let rocket = totalPoints(S) - allocated(S);
    for (const lane of LANES) {
      let pts = S.alloc[lane];
      const done = [];
      for (const ch of S.chantiers[lane]) {
        const use = Math.min(pts, ch.left); ch.left -= use; pts -= use;
        if (use) fx(S, { t: "work", lane, n: use });
        if (ch.left === 0) done.push(ch);
      }
      rocket += pts;
      for (const ch of done) {
        S.chantiers[lane].splice(S.chantiers[lane].indexOf(ch), 1);
        S.toPlace.push({ tile: ch.tile, lane });
      }
    }
    for (const lane of LANES) for (const ch of S.chantiers[lane]) ch.fresh = false;
    if (rocket > 0) fx(S, { t: "rocketPts", n: rocket });
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
    fx(S, { t: "place", k });
    if (TILES[p.tile].perm) { S.workersBase += 1; log(S, "colonie", "+1 travailleur permanent."); }
    placeSupports(S); // un support apparaît dès que ses murs sont construits
    log(S, "colonie", TILES[p.tile].camo ? `Une tuile camouflée est construite en lane ${LANE_NAME[p.lane]}.` : `${p.tile} construit en lane ${LANE_NAME[p.lane]}.`);
    visionSweep(S); // un Œil-sonde en vie dans la lane révèle aussitôt la nouvelle tuile camouflée
    skipUnplaceable(S);
    if (!S.toPlace.length) finishDefenderTurn(S);
    return true;
  }
  function finishDefenderTurn(S) {
    const rocket = S.pendingRocket || 0; S.pendingRocket = 0;
    placeSupports(S); // supports d'abord (au moment où les bâtiments sont construits), puis la fusée (ordre décidé par Oni, 30/10/2026)
    // fusée
    S.rocketPts += Math.max(0, rocket);
    while (S.floors < FLOORS && S.rocketPts >= floorCost(S)) {
      S.rocketPts -= floorCost(S); S.floors += 1; S.workersBase += 1;
      fx(S, { t: "floor", n: S.floors });
      log(S, "colonie", `Étage ${S.floors} de la fusée achevé : +1 travailleur.`);
      if (S.floors === 3) { S.techBonus += 2; log(S, "colonie", "Palier 3 : +2 technologies permanentes."); }
      if (S.floors === 6) { S.chPerLane = 2; log(S, "colonie", "Palier 6 : +1 chantier par lane."); }
      if (S.floors === 9) {
        fx(S, { t: "nuke", ids: S.creatures.map(c => c.id) });
        for (const c of S.creatures) toPile(S, c.name);
        for (const l of [1, 2, 3]) shuffle(S.piles[l]);
        log(S, "colonie", `Palier 9 · Nuke : ${S.creatures.length} créature${S.creatures.length > 1 ? "s" : ""} détruite${S.creatures.length > 1 ? "s" : ""}.`);
        S.creatures = [];
      }
      if (S.floors === FLOORS) { fx(S, { t: "liftoff" }); S.winner = "colonie"; log(S, "jeu", "La fusée décolle : la colonie gagne."); return; }
    }
    S.phase = "D_fire"; // les tourelles tirent maintenant (choix de la colonie, ou tirs automatiques)
  }
  function endColonyTurn(S) {
    autoFire(S); // tirs restants (automatiques)
    // sortilèges de soutien non joués : gardés en main (Oni, 01/11/2026)
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

  // Parties enregistrées avec d'anciennes règles : les tuiles de départ (« Mur de départ », « Haie de départ »,
  // « Haie d'épines » marquée start) deviennent des Barbelés
  // de départ (1 PV, Épines 1), et les Épines des tuiles posées suivent les nouvelles valeurs. Sans effet sur une partie à jour.
  function migrate(S) {
    if (!S.version) S.version = "0.3"; // partie commencée avant le suivi des versions
    if (S.killed === undefined) S.killed = 0;
    for (const t of Object.values(S.tiles || {})) if (t.shield) { t.ren = t.shield; delete t.shield; } // Bouclier → Renforcé (02/11/2026)
    for (const c of S.creatures || []) if (CREATURES[c.name] && c.hp > maxHp(S, c.name)) c.hp = maxHp(S, c.name); // Mue : plus de +1 PV au soutien
    for (const t of Object.values(S.tiles || {})) {
      if (t.name === "Mur de départ" || t.name === "Haie de départ") { t.start = true; t.max = 1; t.hp = Math.min(t.hp, 1); }
      if (t.start) { t.name = START_WALL; t.ep = 1; } // Barbelé : Épines 1
      else if (TILES[t.name]) t.ep = TILES[t.name].ep;
      if (TILES[t.name] && TILES[t.name].aura && t.camo) { t.camo = 0; t.revealed = true; } // Avant-postes désormais face visible
    }
    if (S.invest && S.upgrades) for (const [key, got] of Object.entries(S.invest)) {
      const [type, slot] = key.split(":");
      if (TREES[type] && TREES[type][slot] && got >= nodeCost(slot) && nodeState(S, type, slot) === "open") { delete S.invest[key]; acquire(S, type, slot); }
    }
    for (const list of [S.tileDiscard, S.tileDeck, S.hand]) if (Array.isArray(list)) for (let i = list.length - 1; i >= 0; i--) if (list[i] === "Mur de départ" || list[i] === "Haie de départ") list.splice(i, 1);
    return S;
  }

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
      case "Barrage": return isLane(arg);
      case "Champ de stase": return typeof arg === "string" && /^-?\d,-?\d$/.test(arg);
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
    frenzy: { phase: ["A_deploy", "A_upgrade", "A_attack"], run: (S, a) => isInt(a.src) && isInt(a.target) && setFrenzy(S, a.src, a.target) },
    deploy: { phase: ["A_deploy"], run: (S, a) => isInt(a.uid) && isLane(a.lane) && isInt(a.u) && Math.abs(a.u) <= 2 && (a.target === undefined || typeof a.target === "string") && deploy(S, a.uid, a.lane, a.u, a.target) },
    // déploiement et améliorations dans la même étape (Oni, 06/11/2026) : terminer le déploiement passe directement aux attaques
    // (la biomasse non dépensée va à la réserve) ; l'étape A_upgrade ne sert plus qu'aux parties enregistrées avant
    endDeploy: { phase: ["A_deploy"], run: S => { endDeploy(S); ACTIONS.toAttacks.run(S); return true; } },
    invest: { phase: ["A_deploy", "A_upgrade"], run: (S, a) => own(TREES, a.t) && own(TREES[a.t], a.s) && isInt(a.n) && a.n > 0 && invest(S, a.t, a.s, a.n) },
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
    act: { phase: ["A_attack"], run(S, a) { // a.key : la case (bloc) qui agit ; a.order : ordre d'attaque (identifiants)
      if (typeof a.key !== "string" || (a.order !== undefined && !(Array.isArray(a.order) && a.order.every(isInt)))) return false;
      return actCase(S, a.key, a.order);
    } },
    // déplacements au choix (Oni, 04/11/2026)
    move: { phase: ["A_attack"], run: (S, a) => isInt(a.id) && isInt(a.u) && isInt(a.k) && moveCreature(S, a.id, a.u, a.k) },
    strike: { phase: ["A_attack"], run: (S, a) => isInt(a.id) && (a.target === "fusee" || (typeof a.target === "string" && /^-?\d,-?\d$/.test(a.target))) && strikeAt(S, a.id, a.target) },
    // déplacement automatique au choix de la créature (Oni, 06/11/2026) : l'essaim choisit quelle créature agit ;
    // elle suit seule son chemin vers la fusée (tout droit ou en escalier), puis attaque ce qui est devant elle
    actOne: { phase: ["A_attack"], run(S, a) {
      const c = isInt(a.id) && S.creatures.find(o => o.id === a.id);
      if (!c || !canAct(S, c)) return false;
      autoCreature(S, c); return true;
    } },
    actAll: { phase: ["A_attack"], run(S) { // les créatures qui n'ont pas encore agi avancent et attaquent devant elles, les plus avancées d'abord
      // les soutiens agissent d'abord (Oni, 06/11/2026) : les créatures de leur case de départ qui les suivent profitent
      // encore de leurs auras quand elles attaquent ; puis les plus avancées d'abord
      const sup = c => (CREATURES[c.name].type === "soutien" ? 0 : 1);
      const todo = S.creatures.filter(c => !c.acted).sort((a, b) => sup(a) - sup(b) || pathLen(a.u, a.k) - pathLen(b.u, b.k) || a.id - b.id);
      for (const c of todo) { if (S.winner) break; if (S.creatures.includes(c)) autoCreature(S, c); }
      return true;
    } },
    endA: { phase: ["A_attack"], run(S) { endAttackerTurn(S); return true; } }, // fin du tour : les créatures restantes ne font rien
    startCh: { phase: ["D_main"], run(S, a) {
      if (!(isInt(a.i) && isLane(a.lane) && startChantier(S, a.i, a.lane))) return false;
      // travailleurs assignés d'office (Oni, 04/11/2026) : juste assez pour finir les chantiers de la lane, dans la
      // limite des travailleurs libres ; toujours modifiable avec + / −
      const need = S.chantiers[a.lane].reduce((n, ch) => n + ch.left, 0);
      const free = totalPoints(S) - allocated(S);
      S.alloc[a.lane] = Math.max(S.alloc[a.lane], Math.min(need, S.alloc[a.lane] + free));
      return true;
    } },
    cancelCh: { phase: ["D_main"], run: (S, a) => isLane(a.lane) && isInt(a.i) && cancelChantier(S, a.lane, a.i) },
    alloc: { phase: ["D_main"], run(S, a) {
      if (!isLane(a.lane) || ![1, -1].includes(a.d)) return false;
      const v = S.alloc[a.lane] + a.d;
      if (v < 0 || allocated(S) + a.d > totalPoints(S)) return false;
      S.alloc[a.lane] = v; return true;
    } },
    build: { phase: ["D_main"], run: S => { endDefenderTurn(S); return true; } }, // construction et fusée, puis tirs
    toFire: { phase: ["D_main"], run: S => { endDefenderTurn(S); return true; } }, // ancien nom (pages encore ouvertes)
    fire: { phase: ["D_fire"], run: (S, a) => own(S.supports, a.sk) && isInt(a.id) && fire(S, a.sk, a.id) },
    autoFire: { phase: ["D_fire"], run: S => { autoFire(S); return true; } },
    endD: { phase: ["D_fire"], run(S) { endColonyTurn(S); openFamine(S); return true; } },
    placeAt: { phase: ["D_place"], run(S, a) { if (!placeTile(S, a.k)) return false; openFamine(S); return true; } },
  };
  // renvoie "" si l'action est appliquée, sinon la raison du refus (S n'est pas modifié dans ce cas)
  function apply(S, side, type, args) {
    const A = own(ACTIONS, type) ? ACTIONS[type] : null;
    if (!A) return "action inconnue";
    if (S.winner) return "la partie est terminée";
    if (side !== actor(S)) return "ce n'est pas votre tour";
    if (!A.phase.includes(S.phase)) return "action impossible dans cette phase";
    if (!A.run(S, args && typeof args === "object" ? args : {})) return "action refusée";
    autoAdvance(S);
    return "";
  }
  // Passage automatique (Oni, 04/11/2026) : quand le camp n'a plus rien à faire dans l'étape, le tour passe seul
  // (plus de bouton « Fin du tour de l'essaim » ; la colonie passe la main dès qu'aucune tourelle ne peut plus tirer).
  function canStillFire(S) {
    return Object.entries(S.supports).some(([k, l]) => l < 3 && shotsLeft(S, k) > 0 && supportTargets(S, k).length);
  }
  function autoAdvance(S) {
    if (S.winner) return;
    if (S.phase === "A_attack" && !S.creatures.some(c => canAct(S, c))) {
      log(S, "essaim", "Plus aucune créature ne peut agir : fin du tour de l'essaim.");
      endAttackerTurn(S);
    }
    if (S.phase === "D_fire" && !canStillFire(S) && !S.winner) {
      log(S, "colonie", "Plus aucune tourelle ne peut tirer : fin du tour de la colonie.");
      endColonyTurn(S); openFamine(S);
    }
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
        if (t.camo && !t.revealed) V.tiles[k] = { name: null, camo: 1, revealed: false, hidden: true, hp: null, max: null, ep: 0, ren: 0, tech: 0, temp: 0, trap: 0, shield: 0 };
      }
    }
    return V;
  }

  // événements visuels envoyés à un camp : les PV d'une tuile camouflée encore cachée ne sont pas transmis à l'essaim
  function fxFor(S, side, events) {
    return events.map(e => {
      if (side === "essaim" && (e.t === "hit" || e.t === "heal")) {
        const t = S.tiles[e.k];
        if (t && t.camo && !t.revealed && !clairvoyance(S)) return { ...e, n: null, hp: null };
      }
      return e;
    });
  }

  return {
    VERSION,
    fxFor, migrate, famineBudget, MIN_BIOMASS, shotsLeft, SUP3_WORKERS, TRAP_DMG, floorCost, FLOOR_COSTS, START_WALL,
    PHASE_SIDE, ACTIONS, actor, apply, viewFor,
    CREATURES, TILES, TILE_TEXT, SPELLS, TIERS, TREES, LANES, LANE_NAME, COLS, COST_R1, COST_R2, FLOORS,
    key, parse, ring, cellLane, toGlobal, toLocal, nextStep, isSupportCell, supportLanes, supportWalls, setRng, shuffle,
    newGame, tier, capOf, laneCount, tech, spellsPerTurn, bonusWorkers, totalPoints, allocated, handSize, posKey, caseMates,
    clairvoyance, reachable, strikeTargets, stepsLeft, canAct, moveCreature, strikeAt, frenzyOf, frenzyCount, hasMobility, hasPercee, isStealthy, maxHp, baseAtq, effAtq, bonusHp, epinesOf, canTarget, walk, laneTiles,
    attacks, pushBack, act, actCase, readyCases, blockAt, pathLen, attackerDraw, canDeploy, deploy, endDeploy, canBuy, buy, invest, invested, nodeState, investable, nodeCost, speedOf, baseSpeed, startAttacks, attackOrder, endAttackerTurn,
    useSpell, startChantier, cancelChantier, placeTargets, placeTile, supportTargets, turretDmg, rocketMilestones, fire, autoFire, endDefenderTurn, endColonyTurn, targetable, resolveTarget,
    tileStats, placeSupports, killCheck, pubName,
  };
})();
if (typeof module !== "undefined") module.exports = SF;
