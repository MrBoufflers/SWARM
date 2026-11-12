// Swarm & Steel — moteur de règles v0.3 (livret v0.3). Aucun accès au DOM : testable sous Node.
"use strict";
const SF = (() => {
  // ------------------------------------------------------------------ données
  const CREATURES = {
    "Écorcheur": { type: "aggro", lvl: 1, cost: 3, pv: 1, atq: 3 },
    // niveaux 2 et 3 : +1/+1 et +2/+2 par rapport au niveau 1 (Oni, 11/11/2026 ; aggros à 1 PV du 01/11 au 11/11)
    "Ravageur": { type: "aggro", lvl: 2, cost: 4, pv: 2, atq: 4 }, // niveau 2 = niveau 1 +1 ATQ +1 PV (Oni, 11/11/2026 ; avant 5/1)
    "Massacreur": { type: "aggro", lvl: 3, cost: 6, pv: 3, atq: 5 }, // niveau 3 = niveau 1 +2 ATQ +2 PV (Oni, 11/11/2026 ; avant 7/1) // coût 6 (Oni, 07/11/2026 ; avant 7)
    "Carapace": { type: "tank", lvl: 1, cost: 3, pv: 3, atq: 1 },
    // tanks : 1/3, 2/4, 3/5 (ATQ/PV, Oni 11/11/2026 ; tous à 1 ATQ du 01/11 au 11/11)
    "Béhémoth": { type: "tank", lvl: 2, cost: 4, pv: 4, atq: 2 }, // Oni, 11/11/2026 (avant 1/5)
    "Colosse": { type: "tank", lvl: 3, cost: 6, pv: 5, atq: 3 }, // Oni, 11/11/2026 (avant 1/7) // coût 6 (Oni, 07/11/2026 ; avant 7)
    // soutiens : 2 / 4 / 6 PV selon le niveau (Oni, 02/11/2026 ; avant 2 / 5 / 8)
    "Œil-sonde": { type: "soutien", lvl: 1, cost: 2, pv: 2, atq: 0, cap: "vision", capName: "Vision", capText: "Tant qu'il est en vie, toutes les tuiles camouflées de sa lane sont révélées, même celles posées ensuite." },
    "Glaneur": { type: "soutien", lvl: 1, cost: 2, pv: 2, atq: 0, cap: "soin", capName: "Aura Soin 2", capText: "En fin de tour de l'essaim, les autres créatures de sa case regagnent 2 PV." },
    // Catalyseur passe au niveau 1 (0/2) et le Hurleur au niveau 2 (0/4, Aura Fureur +2 ATQ) — Oni, 07/11/2026
    "Catalyseur": { type: "soutien", lvl: 1, cost: 2, pv: 2, atq: 0, cap: "cuirasse", capName: "Aura Cuirasse", capText: "Les autres créatures de sa case ne subissent pas les dégâts d'Épines." },
    // Phéromone : Aura Butin (01/11/2026), remplacée par Dépouille (Oni, 12/11/2026)
    "Phéromone": { type: "soutien", lvl: 2, cost: 3, pv: 4, atq: 0, cap: "depouille", capName: "Dépouille", capText: "Quand une autre créature de sa case meurt, elle laisse un jeton Dépouille sur sa case : la colonie ne peut plus y construire tant qu'une tourelle à portée n'a pas tiré dessus (un tir)." },
    "Perforeur": { type: "soutien", lvl: 2, cost: 3, pv: 4, atq: 0, cap: "percee", capName: "Aura Percée", capText: "Les autres créatures de sa case gagnent la percée." },
    "Hurleur": { type: "soutien", lvl: 2, cost: 3, pv: 4, atq: 0, cap: "fureur", capName: "Aura Fureur", capText: "+2 ATQ aux autres créatures de sa case (cumulable)." },
    // Sapeur (Oni, 01/11/2026) : à son déploiement, détruit un bâtiment au choix de sa lane (avant : un chantier de l'atelier)
    "Sapeur": { type: "soutien", lvl: 3, cost: 5, pv: 6, atq: 0, cap: "sabotage", capName: "Sabotage", capText: "Quand il est déployé, détruit un bâtiment au choix de sa lane." },
    "Sporeur": { type: "soutien", lvl: 3, cost: 5, pv: 6, atq: 0, cap: "spores", capName: "Aura Spores", capText: "Quand une autre créature de sa case attaque, les 8 cases autour de la cible subissent 2 dégâts par Sporeur ; la fusée touchée perd 1 travailleur." },
  };
  const PILES = {
    1: { aggro: [["Écorcheur", 6]], tank: [["Carapace", 6]], soutien: [["Œil-sonde", 2], ["Glaneur", 2], ["Catalyseur", 2]] },
    2: { aggro: [["Ravageur", 6]], tank: [["Béhémoth", 6]], soutien: [["Phéromone", 2], ["Perforeur", 2], ["Hurleur", 2]] },
    3: { aggro: [["Massacreur", 6]], tank: [["Colosse", 6]], soutien: [["Sapeur", 3], ["Sporeur", 3]] },
  };
  // nom: durée, pv (nombre ou 'ap' / 'front' / 'reduit'), épines, renforcé, tech, temp, perm, piège, direction, exemplaires
  const TILES = {
    "Palissade": { d: 1, pv: 1, ep: 0, camo: 1, shield: 1, n: 3 }, // 1 PV + Bouclier (Oni, 09/11/2026 ; avant 2 PV) // 3 ex. (Oni, 02/11/2026 ; avant 6, puis 4)
    "Muraille": { d: 2, pv: 4, ep: 0, camo: 1, n: 3 }, // 3 ex. (Oni, 02/11/2026 ; avant 6, puis 4)
    "Rempart": { d: 3, pv: 4, ep: 0, ren: 2, camo: 1, n: 3 },
    "Bastion": { d: 3, pv: 3, ep: 0, ren: 3, camo: 1, n: 2 },
    "Haie d'épines": { d: 1, pv: 1, ep: 2, camo: 1, n: 3 },
    "Mur hérissé": { d: 2, pv: 2, ep: 2, camo: 1, n: 2 },
    "Antenne": { d: 1, pv: 1, ep: 0, tech: 1, n: 3 },
    "Laboratoire": { d: 2, pv: 2, ep: 0, tech: 2, n: 3 }, // 3 ex. (Oni, 02/11/2026 ; avant 2)
    "Observatoire": { d: 3, pv: 2, ep: 0, tech: 3, shield: 1, n: 3 }, // 2 PV + Bouclier (Oni, 09/11/2026 ; avant 3 PV) // 3 ex. (Oni, 02/11/2026 ; avant 1)
    "Baraquement": { d: 1, pv: 1, ep: 1, temp: 1, n: 3 }, // Épines 1 (Oni, 01/11/2026)
    // Dortoir (Oni, 01/11/2026 ; avant 1 PV, travailleur permanent, 2 ex.) : 3 PV, Renforcé 2 (d'abord « Bouclier 2 »), +1 travailleur temporaire
    "Dortoir": { d: 3, pv: 3, ep: 0, ren: 2, temp: 1, n: 3 },
    // Archives (Oni, 01/11/2026) : 3 PV, +1 technologie, face visible
    "Archives": { d: 2, pv: 2, ep: 0, tech: 1, shield: 1, n: 3 }, // 2 PV + Bouclier (Oni, 09/11/2026 ; avant 3 PV)
    // Avant-postes : posés face visible (Oni, 01/11/2026), avec l'Aura d'épines
    "Avant-poste du Nord": { d: 2, pv: "ap", dir: "N", ep: 0, aura: 1, n: 1 },
    "Avant-poste de l'Est": { d: 2, pv: "ap", dir: "E", ep: 0, aura: 1, n: 1 },
    "Avant-poste du Sud": { d: 2, pv: "ap", dir: "S", ep: 0, aura: 1, n: 1 },
    "Avant-poste de l'Ouest": { d: 2, pv: "ap", dir: "O", ep: 0, aura: 1, n: 1 },
    "Ligne de front": { d: 2, pv: "front", ep: 1, camo: 1, n: 2 }, // Épines 1 (Oni, 01/11/2026)
    "Réduit": { d: 2, pv: "reduit", ep: 1, camo: 1, n: 2 }, // Épines 1 (Oni, 01/11/2026)
    // Pièges (Oni, 07/11/2026 ; remplacent le Piège à 3 dégâts et le Siphon à 3 biomasse) : effet = PV = tours de construction
    "Mine mineure": { d: 1, pv: 1, ep: 0, trap: 1, camo: 1, n: 2 },
    "Mine majeure": { d: 2, pv: 2, ep: 0, trap: 3, camo: 1, n: 2 }, // dégâts 1 / 3 / 5 (Oni, 09/11/2026 ; avant 1 / 2 / 3)
    "Mine supérieure": { d: 3, pv: 3, ep: 0, trap: 5, camo: 1, n: 2 },
    "Siphon mineur": { d: 1, pv: 1, ep: 0, siphon: 1, camo: 1, n: 2 },
    "Siphon majeur": { d: 2, pv: 2, ep: 0, siphon: 2, camo: 1, n: 2 },
    "Siphon supérieur": { d: 3, pv: 3, ep: 0, siphon: 3, camo: 1, n: 2 },
    // Abri blindé (Oni, 07/11/2026) : +1 travailleur tant qu'il tient, Bouclier (jeton qui annule la prochaine attaque), face visible
    "Abri blindé": { d: 2, pv: 2, ep: 0, temp: 1, shield: 1, n: 3 },
    // Ronceraie (Oni, 01/11/2026) : 3 tours, 2 PV, Renforcé 2, Épines 2, camouflée, 3 exemplaires
    "Ronceraie": { d: 3, pv: 2, ep: 2, ren: 2, camo: 1, n: 3 },
    // Égide (Oni, 01/11/2026) : Renforcé 2 (02/11/2026 : le Bouclier est fondu dans Renforcé)
    "Égide": { d: 2, pv: 2, ep: 0, camo: 1, shield: 1, n: 3 }, // Bouclier au lieu de Renforcé 2 (Oni, 09/11/2026) // 2 PV (Oni, 04/11/2026 ; avant 3)
  };
  const TILE_TEXT = {
    "Rempart": "Renforcé 2 : perd 1 PV par tranche de 2 dégâts.", "Bastion": "Renforcé 3 : perd 1 PV par tranche de 3 dégâts.",
    "Avant-poste du Nord": "2 PV ; 4 PV dans la lane Nord.", "Avant-poste de l'Est": "2 PV ; 4 PV dans la lane Est.",
    "Avant-poste du Sud": "2 PV ; 4 PV dans la lane Sud.", "Avant-poste de l'Ouest": "2 PV ; 4 PV dans la lane Ouest.",
    "Ligne de front": "PV = 1 + couronne (2 / 3 / 4).", "Réduit": "PV = 5 − couronne (4 / 3 / 2).",
    "Mine mineure": "Camouflée. 1 dégât à la créature qui la révèle en l'attaquant, avant qu'elle frappe.",
    "Mine majeure": "Camouflée. 3 dégâts à la créature qui la révèle en l'attaquant, avant qu'elle frappe.",
    "Mine supérieure": "Camouflée. 5 dégâts à la créature qui la révèle en l'attaquant, avant qu'elle frappe.",
    "Siphon mineur": "Camouflé. Révélé par une attaque : l'essaim perd 1 biomasse, +1 par tranche de 10 qu'il possède (jamais sous 5).",
    "Siphon majeur": "Camouflé. Révélé par une attaque : l'essaim perd 2 biomasse, +2 par tranche de 10 qu'il possède (jamais sous 5).",
    "Siphon supérieur": "Camouflé. Révélé par une attaque : l'essaim perd 3 biomasse, +3 par tranche de 10 qu'il possède (jamais sous 5).",
    "Abri blindé": "+1 travailleur tant que la tuile tient. Bouclier : la prochaine attaque ne lui fait rien (le jeton est alors défaussé).",
    "Ronceraie": "Camouflée. Renforcé 2, Épines 2.",
    "Égide": "Camouflée. Bouclier : la prochaine attaque ne lui fait rien.",
    "Antenne": "+1 technologie.", "Laboratoire": "+2 technologies.", "Observatoire": "+3 technologies. Bouclier.",
    "Baraquement": "+1 travailleur tant que la tuile tient.", "Dortoir": "Renforcé 2. +1 travailleur tant que la tuile tient.", "Archives": "+1 technologie. Bouclier.",
  };
  const SPELLS = {
    // un seul exemplaire de chaque sortilège ; Cadence retirée (doublon d'Effort) — Oni, 09/11/2026
    "Frappe orbitale": { kind: "off", n: 1, text: "Détruit une créature." },
    "Salve": { kind: "off", n: 1, text: "3 dégâts à 2 créatures de la même case." },
    "Barrage": { kind: "off", n: 1, text: "1 dégât à chaque créature d'une lane." },
    "Onde de choc": { kind: "off", n: 1, text: "1 dégât à chaque créature d'une couronne, sur les 4 lanes." },
    // Champ de stase (Oni, 04/11/2026 ; avant : toute une lane) : un seul bâtiment, et ses Épines sont suspendues
    "Champ de stase": { kind: "off", n: 1, text: "Choisissez un bâtiment : ce tour, il ne subit aucun dégât et les créatures qui l'attaquent ne subissent pas ses Épines ; l'attaque passe quand même en percée et les spores touchent ses voisins." },
    "Famine": { kind: "off", n: 1, text: "Au début du tour de l'essaim : ce tour, son budget est sa biomasse divisée par 2 (arrondie à l'inférieur)." },
    // Brouillage (Oni, 04/11/2026 ; avant : annulait le déploiement d'une créature posée ce tour)
    "Brouillage": { kind: "off", n: 1, text: "Choisissez une case : ce tour, ses créatures ne bougent pas et n'attaquent pas." },
    "Effort": { kind: "sup", n: 1, text: "+2 points de construction ce tour." },
    // Feu nourri (Oni, 02/11/2026) : sort de soutien, 2 exemplaires
    "Feu nourri": { kind: "sup", n: 1, text: "Ce tour, chaque tourelle tire 2 fois." },
    "Réparation": { kind: "sup", n: 1, text: "Rendez 3 PV, répartis sur vos tuiles abîmées." },
    "Double bouclier": { kind: "sup", n: 1, text: "Deux bâtiments au choix gagnent un jeton Bouclier." }, // Oni, 09/11/2026
    "Renouvellement": { kind: "sup", n: 1, text: "Défaussez des tuiles de votre main, puis repiochez-en autant (chacune dans la même pioche) ; +1 point de construction ce tour." },
    "Reconversion": { kind: "sup", n: 1, text: "Une tuile de votre main remplace une tuile construite, qui est aussitôt reposée sur une autre case de votre choix." },
  };
  const TIERS = [ // biomasse mini, N1, N2, N3, plafond
    // Oni, 02/11/2026 : 4 paliers, départ (plafond 2), puis 9, 15, 21 de biomasse (brièvement 10 / 15 / 20, puis 9 / 15 / 20)
    // (avant : 5 paliers, départ 3 puis 6 / 9 / 12 / 15, plafonds 1 à 5 ; à l'origine 4 / 7 / 10 / 13)
    { min: 0, n: [3, 0, 0], cap: 2 }, { min: 9, n: [3, 2, 0], cap: 3 }, { min: 15, n: [4, 2, 1], cap: 4 },
    { min: 21, n: [4, 3, 3], cap: 5 },
  ];
  const TREES = {
    aggro: { A1: ["Férocité", "+1 ATQ. Furtivité."], B1: ["Mobilité", "+1 vitesse."],
      A2: ["Carnage", "Attaquent 2 fois par tour."], C2: ["Déploiement", "Chaque tour : 2 cartes de niveau 1 gratuites en plus, et une aggro redéployée à l'entrée de n'importe quelle lane."],
      B2: ["Essaim agrandi", "+3 au plafond de population de chaque lane."] },
    // Provocation : ancien nom « Protection » (Oni, 02/11/2026)
    tank: { A1: ["Carapace épaisse", "+1 PV. Insensibles aux Épines. −1 dégât des Mines."], B1: ["Provocation", "Les tirs et les sortilèges visant une autre créature de sa case visent ce tank. −1 dégât des tourelles."],
      A2: ["Blindage", "Chaque tank en jeu, et chaque tank qui arrive ensuite, reçoit un jeton Blindage : la prochaine perte de PV qu'il subirait est annulée, puis le jeton est défaussé."], C2: ["Réincarnation", "Au début de son tour, l'essaim choisit un tank mort depuis son tour précédent : il revient là où il est mort."],
      B2: ["Masse vivante", "−1 dégât des tourelles (cumulable avec Provocation)."] },
    soutien: { A1: ["Mue", "Aura Mobilité 1 (+1 vitesse) et Aura Échappée : une fois pendant chaque tour (essaim, colonie), une créature de sa case qui devrait mourir recule d'une case avec 1 PV."],
      B1: ["Griffes", "Aura Coup de grâce : un bâtiment laissé à 1 PV par une attaque de sa case est détruit. Aura Mobilité 1 (+1 vitesse)."],
      A2: ["Régénération", "Aura Soin total : en fin de tour de l'essaim, les autres créatures de sa case retrouvent tous leurs PV. Les Glaneurs quittent la pioche."], C2: ["Clairvoyance", "Tant qu'un soutien est en jeu, les tuiles camouflées sont visibles. Les Œil-sonde quittent la pioche."],
      B2: ["Corrosion", "Aura Corrosion : contre les attaques de sa case, Renforcé sans effet et Bouclier détruit."] },
  };
  const COST_R1 = 6, COST_R2 = 12, FLOORS = 12;
  const MIN_BIOMASS = 5; // un Siphon ne fait jamais descendre l'essaim sous 5 biomasse (Oni, 07/11/2026 ; avant 3)
  const TRAP_DMG = 3; // dégâts de l'ancien Piège (avant le 07/11/2026 : les Mines ont chacune leurs dégâts, tuile.trap)
  // catégories de tuiles et pioches séparées (Oni, 07/11/2026) : renforts (PV, Renforcé, Épines, camouflés), actifs (face
  // visible, effet direct), pièges (Mines et Siphons)
  const TILE_CATS = ["renfort", "actif", "piege"], CAT_NAME = { renfort: "Renforts", actif: "Actifs", piege: "Pièges" };
  const tileCat = name => { const t = TILES[name]; return !t ? "renfort" : t.trap || t.siphon ? "piege" : !t.camo ? "actif" : "renfort"; };
  // anciens noms (parties en cours) : le Piège et le Siphon deviennent leur version supérieure
  const OLD_TILE = { "Piège": "Mine supérieure", "Siphon": "Siphon supérieur" };
  // Famine (Oni, 02/11/2026) : ce tour, le budget de l'essaim est sa biomasse divisée par 2, arrondie à l'inférieur (avant : −5)
  const famineBudget = b => Math.floor(b / 2);
  // coût d'un étage de la fusée selon le palier atteint : étages 1-3 → 3 points, 4-6 → 4, 7-9 → 5, 10-12 → 6 (décision d'Oni, 30/10/2026)
  const FLOOR_COSTS = [2, 4, 7, 10]; // Oni, 11/11/2026 (2 / 4 / 6 / 8 depuis le 04/11/2026 (avant 2 / 3 / 4 / 5 ; à l'origine 3 / 4 / 5 / 6)
  const floorCost = S => FLOOR_COSTS[Math.min(3, Math.floor(S.floors / 3))];
  // tuiles de départ : 16 « Barbelé » (1 PV, Épines 1, face visible), repérées par start: true ; détruites, elles sont
  // retirées du jeu (pas de défausse). Noms successifs : « Mur de départ », « Haie de départ », « Haie d'épines » (Oni, 02/11/2026).
  const START_WALL = "Barbelé";
  // Version du jeu : +1 au dernier chiffre à chaque mise à jour livrée (journal : docs/versions.md).
  // Les statistiques de fin de partie sont regroupées par version ; le serveur refuse une page d'une autre version.
  const VERSION = "0.5.24";
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
      tiles: {}, supports: {}, depouilles: [], chantiers: { N: [], E: [], S: [], O: [] }, chPerLane: 1, toPlace: [], pendingRocket: 0,
      workersBase: 3, floors: 0, rocketPts: 0, techBonus: 0,
      tileDecks: { renfort: [], actif: [], piege: [] }, tileDiscards: { renfort: [], actif: [], piege: [] }, hand: [],
      spellDeck: [], spellDiscard: [], spells: [],
      alloc: { N: 0, E: 0, S: 0, O: 0 }, extraPts: 0, cadence: false, firedSupports: [],
      biomass: 5, budget: 0, reserve: 0, famine: 0, startHand: true, // départ : 5 biomasse (Oni, 04/11/2026 ; avant 3)
      piles: { 1: [], 2: [], 3: [] }, handA: [], creatures: [], reincQueue: [], raidUsed: false,
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
    for (const [n, t] of Object.entries(TILES)) for (let i = 0; i < t.n; i++) S.tileDecks[tileCat(n)].push(n);
    for (const c of TILE_CATS) shuffle(S.tileDecks[c]);
    for (const [n, s] of Object.entries(SPELLS)) for (let i = 0; i < s.n; i++) S.spellDeck.push(n);
    shuffle(S.spellDeck);
    addPile(S, 1, "aggro"); addPile(S, 1, "tank"); addPile(S, 1, "soutien");
    // main de la colonie : vide au départ ; elle la compose au début de son premier tour (pioche au choix, D_draw)
    log(S, "jeu", "Nouvelle partie. L'essaim commence.");
    startAttackerTurn(S);
    return S;
  }
  // une carte revient dans sa pioche (créature morte, carte non jouée, Nuke) — sauf l'Œil-sonde une fois Clairvoyance
  // acquise : il sort du jeu (Oni, 04/11/2026)
  const retired = (S, name) => (name === "Œil-sonde" && S.upgrades.soutien.r2 === "C") || (name === "Glaneur" && S.upgrades.soutien.r2 === "A");
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
  // Furtivité : donnée aux aggros par Férocité (Oni, 08/11/2026 ; du 05 au 07/11 par Mobilité, avant par Mue)
  function isStealthy(S, c) {
    return !!(S && c && CREATURES[c.name] && CREATURES[c.name].type === "aggro" && S.upgrades.aggro.r1 === "A");
  }
  function hasPercee(S, c) {
    return caseMates(S, c).some(o => o.name === "Perforeur");
  }
  // Auras (Oni, 02/11/2026) : une aura profite toujours aux AUTRES créatures de sa case, jamais à elle-même, et toutes les
  // auras se cumulent (chaque source compte). countMates : nombre d'autres créatures de la case qui vérifient f.
  const countMates = (S, c, f) => caseMates(S, c).filter(f).length;
  const isSoutien = o => CREATURES[o.name].type === "soutien";
  function bonusHp(S, c) {
    // plus aucun bonus de PV variable depuis le 11/11/2026 (Oni : difficile à compter sur un plateau) : Masse vivante,
    // Aura +1 PV de la Mue et +1 PV du Hurleur sont retirés. La fonction reste pour les anciennes parties et le code commun.
    return 0;
  }
  function maxHp(S, name) {
    const b = CREATURES[name]; let m = b.pv;
    if (b.type === "tank") { if (S.upgrades.tank.r1 === "A") m += 1; } // Carapace épaisse +1 ; Blindage ne donne plus de PV (jeton, Oni 11/11/2026)
    return m;
  }
  function baseAtq(S, name) {
    const b = CREATURES[name]; let a = b.atq;
    if (b.type === "aggro" && S.upgrades.aggro.r1 === "A") a += 1; // Carnage ne donne plus d'ATQ (2 attaques, Oni 07/11/2026)
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
    return 0; // Frénésie remplacée par Corrosion (Oni, 09/11/2026)
    if (S.upgrades.soutien.r2 !== "B") return 0;
    return caseMates(S, c).filter(o => isSoutien(o) && frenzyOf(S, o) === c).length;
  }
  function setFrenzy(S, srcId, targetId) {
    const src = S.creatures.find(o => o.id === srcId), t = S.creatures.find(o => o.id === targetId);
    if (true || S.upgrades.soutien.r2 !== "B" || !src || !t || src === t || !isSoutien(src) || posKey(src) !== posKey(t)) return false;
    S.frenzy = S.frenzy || {}; S.frenzy[src.id] = t.id;
    log(S, "essaim", `Frénésie : ${src.name} double les dégâts ${/^[AEIOUYÉÈÊŒ]/i.test(t.name) ? "d'" : "de "}${t.name}.`);
    return true;
  }
  function effAtq(S, c) {
    if (!attacks(c)) return 0;
    let a = baseAtq(S, c.name);
    a += 2 * countMates(S, c, o => o.name === "Hurleur"); // Aura Fureur : +2 ATQ par Hurleur de la case (Oni, 11/11/2026 ; du 08/11 au 11/11 +1 ATQ +1 PV)
    a *= 2 ** frenzyCount(S, c); // Frénésie : ×2 par soutien qui choisit cette créature
    return a;
  }
  function soinValue(S, c) { // somme des auras de soin des autres créatures de la case : Glaneur 1, Régénération 2 par soutien
    let v = 0;
    for (const o of caseMates(S, c)) {
      if (o.name === "Glaneur") v += 2; // Aura Soin 2 (Oni, 05/11/2026 ; avant 1)
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
    return { name, hp: pv, max: pv, ep: t.ep, ren: t.ren || 0, tech: t.tech || 0, temp: t.temp || 0, trap: t.trap || 0, siphon: t.siphon || 0, camo: t.camo || 0, revealed: !t.camo, ...(t.shield ? { shield: t.shield } : {}) };
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
    if (!t.start) S.tileDiscards[tileCat(t.name)].push(t.name);
    // biomasse gagnée : 1, quelle que soit la tuile détruite (Oni, 01/11/2026 ; du 30/10 au 01/11 : sa durée de construction)
    const gain = 1; // plus d'Aura Butin (Phéromone → Dépouille, Oni 12/11/2026)
    S.biomass += gain;
    fx(S, { t: "tileDown", k, n: gain });
    const nm = t.camo && !t.revealed ? "Une tuile camouflée" : t.name; // ne pas nommer une tuile camouflée jamais révélée
    log(S, "essaim", `${nm} détruit${why ? " (" + why + ")" : ""} : +${gain} biomasse.`);
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
    if (S.tiles[k] || (S.depouilles || []).includes(k)) return false; // un jeton Dépouille bloque la case (Oni, 12/11/2026)
    return neighbors(x, y).some(([a, b]) => (a === 0 && b === 0) || S.tiles[key(a, b)] || S.supports[key(a, b)]);
  }

  // ------------------------------------------------------------------ créatures
  function makeCreature(S, name, lane, u, extra) {
    const c = { id: S.nextId++, name, lane, u, k: 4, hp: maxHp(S, name), new: true, acted: false, ...extra };
    if (CREATURES[name].type === "tank" && S.upgrades.tank.r2 === "A") c.blind = 1; // Blindage : jeton à l'arrivée (Oni, 11/11/2026)
    return c;
  }
  // PV bonus perdus (Oni, 08/11/2026) : quand un bonus de PV disparaît (soutien de la Mue mort ou parti, créature qui
  // quitte la case, Masse vivante qui diminue), seul le maximum baisse : une créature blessée garde ses PV, sans dépasser
  // son nouveau maximum. c.lastB = bonus au dernier passage.
  function syncBonus(S) {
    for (const c of S.creatures) {
      const b = bonusHp(S, c), last = c.lastB === undefined ? b : c.lastB;
      if (b < last) {
        const eff = c.hp + last, cap = maxHp(S, c.name) + b;
        if (eff > 0) c.hp = Math.min(eff, cap) - b;
      }
      c.lastB = b;
    }
  }
  function killCheck(S) {
    syncBonus(S);
    const dead = S.creatures.filter(c => c.hp + bonusHp(S, c) <= 0);
    const deadSet = new Set(dead);
    for (const c of dead) {
      if (escape(S, c)) { deadSet.delete(c); continue; }
      // Dépouille (Phéromone, Oni 12/11/2026) : une créature qui meurt hors de la case d'entrée, avec une Phéromone vivante sur sa case, laisse un jeton
      if (c.k < 4 && S.creatures.some(o => o !== c && o.name === "Phéromone" && !deadSet.has(o) && posKey(o) === posKey(c))) {
        const dk = posKey(c); S.depouilles = S.depouilles || [];
        if (!S.depouilles.includes(dk)) { S.depouilles.push(dk); fx(S, { t: "depouille", k: dk }); log(S, "essaim", `Dépouille : ${c.name} laisse un jeton sur la case ${cellName(c.u, c.k)} (lane ${LANE_NAME[c.lane]}) : plus de construction possible.`); }
      }
      S.creatures.splice(S.creatures.indexOf(c), 1);
      fx(S, { t: "die", id: c.id });
      log(S, "colonie", `${c.name} est détruit.`);
      // Réincarnation (Oni, 10/11/2026) : chaque tank mort est mis de côté ; au début de son tour, l'essaim choisit celui qui
      // revient (là où il est mort, Oni 07/11/2026), les autres retournent dans leur pioche (avant : le premier mort seulement)
      if (CREATURES[c.name].type === "tank" && S.upgrades.tank.r2 === "C") {
        if (!S.reincQueue) S.reincQueue = [];
        S.reincQueue.push({ name: c.name, lane: c.lane, u: c.u, k: c.k });
        log(S, "essaim", `Réincarnation : ${c.name} pourra revenir au début du prochain tour de l'essaim.`);
      } else {
        toPile(S, c.name); shuffle(S.piles[CREATURES[c.name].lvl]);
      }
    }
    if (dead.length) syncBonus(S); // les survivants qui perdent un bonus (soutien mort) gardent leurs PV
  }
  // Échappée (Mue, Oni 11/11/2026) : une fois par case pendant chaque tour (essaim, puis colonie), une créature accompagnée d'un autre soutien qui devrait
  // mourir recule d'une case (même colonne, vers l'entrée, au-delà des bâtiments) avec 1 PV ; sur la case d'entrée, elle reste
  function escape(S, c) {
    if (S.upgrades.soutien.r1 !== "A" || !caseMates(S, c).some(o => isSoutien(o) && o.hp + bonusHp(S, o) > 0)) return false;
    const from = posKey(c);
    S.escaped = S.escaped || [];
    if (S.escaped.includes(from)) return false;
    S.escaped.push(from);
    let nk = Math.min(4, c.k + 1);
    while (nk < 4 && S.tiles[key(...toGlobal(c.lane, c.u, nk))]) nk++;
    c.hp = 1;
    if (nk !== c.k) { fx(S, { t: "push", ids: [c.id], lane: c.lane, u: c.u, to: nk }); c.k = nk; }
    fx(S, { t: "cheal", id: c.id, n: 1, hp: 1 });
    log(S, "essaim", `Échappée : ${c.name} survit avec 1 PV et recule ${nk === 4 ? "sur la case d'entrée" : "en " + cellName(c.u, nk)}.`);
    return true;
  }
  function damageCreature(S, c, n, why) {
    if (n > 0 && c.blind) { // Blindage (Oni, 11/11/2026) : la prochaine perte de PV est annulée, puis le jeton est défaussé
      c.blind = 0;
      fx(S, { t: "dmg", id: c.id, n: 0, hp: c.hp });
      log(S, "essaim", `Blindage : ${c.name} ne perd rien${why ? " (" + why + ")" : ""} ; le jeton est défaussé.`);
      return;
    }
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
    if (S.workersBase <= 0) { S.winner = "essaim"; log(S, "jeu", "La colonie n'a plus de travailleurs : l'essaim gagne."); return; }
    sporeBurst(S, c, 0, 0); // les spores touchent aussi les 8 cases autour de la fusée (Oni, 08/11/2026)
  }
  // Aura Spores (2 dégâts par Sporeur de la case, cumulable, Oni 02/11/2026) : quand une autre créature de la case attaque,
  // les 8 cases autour de la cible (diagonales comprises, toutes lanes ; Oni 08/11/2026, avant : les 4 côtés) sont touchées.
  // La fusée parmi elles : −1 travailleur. Pas sur une tuile encore camouflée, ni en stase ; un Bouclier les absorbe.
  function sporeBurst(S, c, x, y) {
    const spores = 2 * countMates(S, c, o => o.name === "Sporeur");
    if (!spores) return;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const a = x + dx, b = y + dy;
      if (a === 0 && b === 0) {
        S.workersBase -= 1; S.killed = (S.killed || 0) + 1;
        fx(S, { t: "rocket", id: c.id });
        log(S, "essaim", "Spores : la fusée est touchée, −1 travailleur.");
        if (S.workersBase <= 0) { S.winner = "essaim"; log(S, "jeu", "La colonie n'a plus de travailleurs : l'essaim gagne."); return; }
        continue;
      }
      const nk = key(a, b), nt = S.tiles[nk];
      if (!nt || (nt.camo && !nt.revealed && !clairvoyance(S)) || S.stase.includes(nk)) continue;
      if (nt.shield > 0) { // Bouclier : il absorbe les spores
        nt.shield = 0; fx(S, { t: "hit", id: null, k: nk, n: 0, hp: nt.hp });
        log(S, "colonie", `Bouclier : ${nt.name} ne subit rien des spores ; le jeton est défaussé.`);
        continue;
      }
      const spLoss = nt.ren ? Math.floor(spores / nt.ren) : spores;
      nt.hp -= spLoss;
      fx(S, { t: "hit", id: null, k: nk, n: spLoss, hp: Math.max(0, nt.hp) });
      if (nt.hp <= 0) destroyTile(S, nk, "spores", c);
    }
  }
  // Déplacement (Oni, 02/11/2026) : une case par tour, deux avec la Mobilité (aggros). Une créature qui arrive au contact
  // d'une tuile ou de la fusée attaque aussitôt. Les aggros mobiles quittent leur case et agissent d'abord, en bloc à part.
  // Aura Mobilité du Glaneur (Oni, 02/11/2026) : +1 case par Glaneur de la case, pour les autres créatures (cumulable) ;
  // le Glaneur lui-même avance de 2 cases (vitesse de base 2) pour suivre le groupe.
  // Aura Mobilité : +1 case par Glaneur de la case, et par soutien de la case avec la Mue (Oni, 05/11/2026) ; tout se cumule
  // vitesse de base : 2 pour le Glaneur et toutes les créatures de niveau 3 (Oni, 06/11/2026), sinon 1
  // (le Glaneur a perdu sa vitesse de 2 et son Aura Mobilité 1 le 06/11/2026, Oni)
  const baseSpeed = c => (CREATURES[c.name].lvl === 3 ? 2 : 1);
  // Mue : l'Aura Mobilité 1 profite aussi au soutien qui la donne (Oni, 07/11/2026)
  const speedOf = (S, c) => baseSpeed(c) + (hasMobility(S, c) ? 1 : 0)
    + (S.upgrades.soutien.r1 ? countMates(S, c, isSoutien) + (isSoutien(c) ? 1 : 0) : 0); // Aura Mobilité 1 : Mue, et Griffes depuis le 08/11/2026
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
  // Déplacements (Oni, 07/11/2026) : la créature avance sur son chemin en escalier vers la fusée (jamais sur les côtés ni vers
  // l'extérieur, hormis le pas de côté de l'escalier), de 1 case jusqu'à son maximum, au choix ; elle s'arrête devant un
  // bâtiment ou la fusée. Si elle peut avancer, elle doit le faire d'au moins une case avant d'attaquer.
  // Blocs (Oni, 08/11/2026) : les créatures d'une même case qui peuvent encore avancer bougent ensemble, d'autant de cases
  // que la plus lente d'entre elles (leurs vitesses sont fixées ensemble, auras de la case comprises) ; celles à qui il reste
  // des déplacements peuvent ensuite continuer (nouveau bloc, plus petit).
  const moveBlock = (S, c) => S.creatures.filter(o => o.lane === c.lane && o.u === c.u && o.k === c.k && !o.acted && !o.struck && stepsLeft(S, o) > 0);
  function blockSteps(S, c) {
    if (c.acted || c.struck || stepsLeft(S, c) <= 0) return 0;
    return Math.min(...moveBlock(S, c).map(o => stepsLeft(S, o)));
  }
  function pathCells(S, c) {
    const out = []; let u = c.u, k = c.k;
    if (c.struck) return out; // après une attaque, plus de déplacement (même si la cible est tombée et libère le chemin)
    for (let d = 1; d <= blockSteps(S, c); d++) {
      const [nu, nk] = nextStep(u, k);
      if (nk === 0 || S.tiles[key(...toGlobal(c.lane, nu, nk))]) break;
      out.push({ u: nu, k: nk, d, prev: key(...toGlobal(c.lane, u, k)) });
      u = nu; k = nk;
    }
    return out;
  }
  function reachable(S, c) { // cases atteignables ce tour : { clé globale : { u, k, d (distance), prev (clé précédente) } }
    const out = {};
    for (const p of pathCells(S, c)) out[key(...toGlobal(c.lane, p.u, p.k))] = p;
    return out;
  }
  // nombre d'attaques par tour : 1, 2 pour les aggros avec Carnage (Oni, 07/11/2026)
  const strikesPerTurn = (S, c) => (CREATURES[c.name].type === "aggro" && S.upgrades.aggro.r2 === "A" ? 2 : 1);
  // Attaque (Oni, 07/11/2026) : facultative, sur n'importe quel bâtiment qui touche sa case par un côté, ou la fusée ;
  // seulement après avoir avancé d'au moins une case quand elle le pouvait
  function strikeTargets(S, c) {
    if (c.acted || !attacks(c)) return [];
    if (!c.moved && !c.struck && pathCells(S, c).length) return [];
    const [x, y] = gpos(c), out = [];
    for (const [a, b] of neighbors(x, y)) { if (a === 0 && b === 0) out.push("fusee"); else if (S.tiles[key(a, b)]) out.push(key(a, b)); }
    return out;
  }
  const canAct = (S, c) => !c.acted && (strikeTargets(S, c).length > 0 || (!c.struck && pathCells(S, c).length > 0));
  function moveCreature(S, id, u, k) {
    const c = S.creatures.find(o => o.id === id); if (!c || c.acted || c.struck) return false;
    // vitesses de toute la case fixées ensemble, avant que quiconque parte (les auras de mobilité comptent toutes)
    for (const o of S.creatures) if (o.lane === c.lane && o.u === c.u && o.k === c.k && o.spd === undefined) o.spd = speedOf(S, o);
    const R = reachable(S, c), dest = key(...toGlobal(c.lane, u, k)), r = R[dest];
    if (!r) return false;
    const block = moveBlock(S, c);
    const path = pathCells(S, c).slice(0, r.d).map(p => [p.u, p.k]);
    const from = cellName(c.u, c.k);
    fx(S, { t: "move", ids: block.map(o => o.id), lane: c.lane, from: [c.u, c.k], to: [u, k], path });
    for (const o of block) { o.u = u; o.k = k; o.moved = (o.moved || 0) + r.d; }
    log(S, "essaim", `${block.map(o => o.name).join(", ")} (lane ${LANE_NAME[c.lane]}) : ${from} → ${cellName(u, k)}.`);
    return true;
  }
  function strikeAt(S, id, target) {
    const c = S.creatures.find(o => o.id === id); if (!c || !strikeTargets(S, c).includes(target)) return false;
    c.struck = (c.struck || 0) + 1;
    if (c.struck >= strikesPerTurn(S, c)) c.acted = true;
    auraFx(S, c);
    if (target === "fusee") hitRocket(S, c); else hitTile(S, c, target, effAtq(S, c), true);
    killCheck(S);
    return true;
  }
  // la créature renonce à agir (ou à sa 2ᵉ attaque) pour ce tour
  function restCreature(S, id) {
    const c = S.creatures.find(o => o.id === id); if (!c || c.acted) return false;
    c.acted = true; return true;
  }
  // résolution automatique d'une créature (bouton « Tout résoudre ») : elle avance au maximum sur son chemin, puis attaque
  // ce qui est devant elle (sinon un autre bâtiment voisin), deux fois avec Carnage
  function autoCreature(S, c) {
    if (c.acted) return;
    // un soutien (ou un groupe de soutiens) qui accompagne une autre créature restée sur place reste avec elle, au lieu
    // d'avancer seul (Oni, 09/11/2026 : les soutiens partaient dans la brèche et cessaient de la renforcer)
    if (isSoutien(c) && caseMates(S, c).some(o => !isSoutien(o) && (o.acted || o.struck || !pathCells(S, o).length))) { c.acted = true; return; }
    // avance avec son bloc, puis seule (ou avec les plus rapides) tant qu'il lui reste des déplacements ; une créature que le
    // joueur a déjà déplacée ce tour garde la case choisie (le déplacement est un maximum, Oni 10/11/2026)
    const manual = !!c.moved;
    for (let i = 0; i < 6 && !manual && !c.struck && !c.acted; i++) {
      const p = pathCells(S, c);
      if (!p.length || !moveCreature(S, c.id, p[p.length - 1].u, p[p.length - 1].k)) break;
    }
    while (!c.acted && S.creatures.includes(c) && !S.winner) {
      const [nu, nk] = nextStep(c.u, c.k);
      const front = nk === 0 ? "fusee" : key(...toGlobal(c.lane, nu, nk));
      const t = strikeTargets(S, c);
      if (!t.length) { c.acted = true; break; }
      strikeAt(S, c.id, t.includes(front) ? front : t[0]);
    }
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
      fx(S, { t: "reveal", k: tk, trap: !!t.trap, name: t.name, hp: t.hp, max: t.max }); // contenu montré à l'essaim (Oni, 09/11/2026)
      if (t.trap) {
        log(S, "essaim", "Un piège est révélé.");
        // le piège blesse la créature AVANT qu'elle frappe : si elle en meurt, elle n'inflige rien (Oni, 01/11/2026)
        if (!clairvoyance(S)) {
          const cara = CREATURES[c.name].type === "tank" && S.upgrades.tank.r1 === "A"; // Carapace épaisse : −1 dégât des Mines (Oni, 11/11/2026)
          damageCreature(S, c, Math.max(0, t.trap - (cara ? 1 : 0)), cara ? "piège, Carapace épaisse −1" : "piège");
          if (c.hp + bonusHp(S, c) <= 0) { log(S, "essaim", `${c.name} meurt dans le piège avant de frapper.`); return; }
        }
      } else log(S, "essaim", `Tuile camouflée révélée : ${t.name}.`);
      // Siphon : retire de la biomasse à l'essaim, sans jamais la faire passer sous 3 (Oni, 02/11/2026)
      if (t.siphon && !clairvoyance(S)) {
        // effet selon la biomasse de l'essaim (Oni, 08/11/2026) : niveau × (1 + 1 par tranche complète de 10)
        const before = S.biomass; S.biomass = Math.max(MIN_BIOMASS, S.biomass - siphonLoss(t.siphon, S.biomass));
        fx(S, { t: "siphon", k: tk, n: before - S.biomass });
        log(S, "colonie", `Siphon : l'essaim perd ${before - S.biomass} biomasse (biomasse ${S.biomass}).`);
      }
    }
    // spores (2 dégâts par Sporeur de la case, cumulable, Oni 02/11/2026) sur les tuiles qui touchent la cible
    const sporesAround = () => { if (primary) sporeBurst(S, c, x, y); };
    // Percée (Oni, 01/11/2026) : les dégâts en trop ne passent qu'à la case SUIVANTE du chemin, sans aller plus loin :
    // un bâtiment les subit, la fusée perd 1 travailleur, une case vide les perd. Pas d'enchaînement.
    const pierce = excess => {
      if (!(primary && excess > 0 && hasPercee(S, c))) return;
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
    };
    // Corrosion (soutien, rang 2 côté B ; Oni, 09/11/2026 ; remplace Frénésie) : contre l'attaque d'une créature accompagnée
    // d'un soutien, le Bouclier est défaussé sans effet et le Renforcé ne compte pas
    const corr = primary && S.upgrades.soutien.r2 === "B" && countMates(S, c, isSoutien) > 0;
    if (corr && t.shield > 0 && !S.stase.includes(tk)) { t.shield = 0; log(S, "essaim", `Corrosion : le Bouclier de ${t.name} est détruit.`); }
    const shielded = !S.stase.includes(tk) && t.shield > 0;
    if (shielded) { // Bouclier (Oni, 07/11/2026) : comme en stase pour cette attaque, puis le jeton est défaussé
      t.shield = 0;
      fx(S, { t: "hit", id: c.id, k: tk, n: 0, hp: t.hp });
      log(S, "colonie", `Bouclier : ${t.name} ne subit rien de cette attaque ; le jeton est défaussé.`);
      sporesAround();
      pierce(dmg);
    } else if (S.stase.includes(tk)) {
      // Champ de stase (Oni, 07/11/2026) : l'attaque a lieu mais ne fait rien au bâtiment ; toute l'attaque passe en percée,
      // et les spores touchent les tuiles voisines
      fx(S, { t: "hit", id: c.id, k: tk, n: 0, hp: t.hp });
      log(S, "colonie", `Champ de stase : ${t.camo && !t.revealed ? "le bâtiment" : t.name} ne subit aucun dégât.`);
      sporesAround();
      pierce(dmg);
    } else {
      // Renforcé X : 1 PV par tranche complète de X dégâts, plusieurs PV possibles d'un coup
      // (Oni, 02/11/2026 : retour à la règle d'origine après un essai à 1 PV maximum par attaque)
      const ren = corr ? 0 : t.ren; // Corrosion : Renforcé sans effet
      const loss = ren ? Math.floor(dmg / ren) : dmg;
      const capacity = ren ? t.hp * ren : t.hp;
      const excess = dmg - capacity;
      t.hp -= loss;
      fx(S, { t: "hit", id: c.id, k: tk, n: Math.min(loss, t.hp + loss), hp: Math.max(0, t.hp) });
      log(S, "essaim", `${c.name} inflige ${dmg} à ${t.name} (−${Math.min(loss, t.hp + loss)} PV).`);
      sporesAround();
      // Coup de grâce (Griffes, Oni 11/11/2026) : un bâtiment laissé à 1 PV par l'attaque d'une créature accompagnée d'un soutien est détruit
      if (t.hp === 1 && loss > 0 && primary && S.upgrades.soutien.r1 === "B" && countMates(S, c, isSoutien) > 0) {
        t.hp = 0; fx(S, { t: "hit", id: c.id, k: tk, n: 1, hp: 0 }); log(S, "essaim", `Coup de grâce : ${t.name} est achevé.`);
      }
      if (t.hp <= 0) { destroyTile(S, tk, "", c); pierce(excess); }
    }
    // Aura Cuirasse (Catalyseur sur la case) : pas de dégâts d'Épines (Oni, 02/11/2026)
    if (primary && epVal > 0) {
      if (S.stase.includes(tk)) log(S, "colonie", `Champ de stase : pas d'Épines pour ${c.name}.`);
      else if (caseMates(S, c).some(o => o.name === "Catalyseur")) log(S, "essaim", `Aura Cuirasse : ${c.name} ne subit pas les Épines.`);
      // Carapace épaisse (tank, côté A) : les tanks ne subissent plus les Épines (Oni, 07/11/2026 ; avant : Provocation)
      else if (CREATURES[c.name].type === "tank" && S.upgrades.tank.r1 === "A") log(S, "essaim", `Carapace épaisse : ${c.name} ne subit pas les Épines.`);
      else damageCreature(S, c, epVal, "épines");
    }
  }

  // ------------------------------------------------------------------ tour de l'essaim
  function startAttackerTurn(S) {
    S.phase = "A_start"; S.raidUsed = false; S.stase = []; S.escaped = []; S.tpUsed = false; delete S.pickTotal;
    for (const c of S.creatures) { c.new = false; c.acted = false; delete c.mobUsed; delete c.jammed; delete c.moved; delete c.spd; delete c.struck; }
    // Réincarnation : un seul tank mort → il revient ; plusieurs → l'essaim choisit (étape A_reinc, action reinc)
    S.reincQueue = S.reincQueue || [];
    if (S.reincQueue.length === 1) reincarnate(S, 0);
    else if (S.reincQueue.length > 1) S.phase = "A_reinc";
    S.famine = 0;
  }
  function reincarnate(S, i) {
    const q = S.reincQueue || [], r = q[i]; if (!r) return false;
    // là où il est mort (Oni, 07/11/2026) ; si un bâtiment occupe désormais cette case, à l'entrée de sa colonne
    const k = r.k && r.k < 4 && !S.tiles[key(...toGlobal(r.lane, r.u, r.k))] ? r.k : 4;
    const nc = makeCreature(S, r.name, r.lane, r.u, { k });
    S.creatures.push(nc);
    fx(S, { t: "reinc", id: nc.id });
    log(S, "essaim", `${r.name} se réincarne ${k === 4 ? "à l'entrée de la lane " + LANE_NAME[r.lane] : "là où il est mort (" + LANE_NAME[r.lane] + " " + cellName(r.u, k) + ")"}.`);
    q.forEach((o, j) => { if (j !== i) { toPile(S, o.name); shuffle(S.piles[CREATURES[o.name].lvl]); log(S, "essaim", `${o.name} retourne dans la pioche.`); } });
    S.reincQueue = [];
    return true;
  }
  function attackerDraw(S) {
    const t = TIERS[tier(S)];
    S.handA = [];
    // Premier tour (Oni, 04/11/2026) : à la place de la pioche, une créature de niveau 1 de chaque type (aggro, tank, et un
    // soutien tiré au hasard), prises dans la pioche de niveau 1 et payées normalement
    if (S.startHand) {
      delete S.startHand;
      for (const type of ["aggro", "tank", "soutien"]) {
        // pioche mélangée : le soutien est tiré au hasard, jamais l'Œil-sonde (Oni, 07/11/2026 : inutile au premier tour)
        const i = S.piles[1].findIndex(n => CREATURES[n].type === type && n !== "Œil-sonde");
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
  // Pioche au choix (Oni, 07/11/2026) : le palier ne fixe que le nombre de cartes (somme de ses quotas : 3, 5, 7, 10) ;
  // l'essaim choisit combien il en pioche dans chaque pile (niveau 1, 2, 3) qui contient des cartes — les piles 2 et 3
  // se remplissent avec les améliorations. Les cartes sont tirées au hasard dans la pile : il ne choisit pas les créatures.
  // Le total est obligatoire : il ne baisse que si les piles n'ont pas assez de cartes.
  const tierCards = i => TIERS[i].n.reduce((a, b) => a + b, 0);
  const pickRule = S => {
    const levels = [1, 2, 3].filter(l => S.piles[l].length > 0);
    const total = Math.min(tierCards(tier(S)), levels.reduce((a, l) => a + S.piles[l].length, 0));
    return { total, levels };
  };
  const siphonLoss = (lvl, bio) => lvl * (1 + Math.floor(bio / 10));
  // pioche de l'essaim carte par carte (Oni, 08/11/2026) : comme la colonie, une carte à la fois dans la pile choisie ;
  // le total (S.pickTotal) est fixé à la première carte
  function pickOne(S, l) {
    if (S.startHand || ![1, 2, 3].includes(l) || !S.piles[l].length) return false;
    if (S.pickTotal == null) { S.pickTotal = pickRule(S).total; S.handA = []; }
    S.handA.push({ name: S.piles[l].pop(), free: false, uid: S.nextId++ });
    if (S.handA.length >= S.pickTotal || ![1, 2, 3].some(x => S.piles[x].length)) {
      const n = [1, 2, 3].map(x => S.handA.filter(c => CREATURES[c.name].lvl === x).length);
      delete S.pickTotal; finishPick(S, n);
    }
    return true;
  }
  function finishPick(S, counts) {
    if (S.upgrades.aggro.r2 === "C") { // Déploiement : 2 cartes de niveau 1 gratuites, au hasard, en plus
      let m = 0;
      for (let i = 0; i < 2; i++) if (S.piles[1].length) { S.handA.push({ name: S.piles[1].pop(), free: true, uid: S.nextId++ }); m++; }
      log(S, "essaim", m === 2 ? "Déploiement : 2 cartes de niveau 1 gratuites." : `Déploiement : pioche de niveau 1 ${m ? "presque vide, 1 seule carte gratuite" : "vide, aucune carte gratuite"}.`);
    }
    S.budget = S.famine ? famineBudget(S.biomass) : S.biomass;
    fx(S, { t: "draw", n: S.handA.length });
    S.phase = "A_deploy";
    log(S, "essaim", `Palier ${tier(S) + 1} : pioche ${counts.join(" · ")} (niveaux 1 · 2 · 3), budget ${S.budget}.`);
  }
  // Déploiement (aggro C2, Oni 08/11/2026) : une fois par tour, pendant le déploiement, une aggro en jeu est redéployée
  // à l'entrée (colonne u) de n'importe quelle lane, dans la limite de population
  function teleport(S, id, lane, u) {
    const c = S.creatures.find(o => o.id === id);
    if (S.upgrades.aggro.r2 !== "C" || S.tpUsed || !c || CREATURES[c.name].type !== "aggro" || Math.abs(u) > 2) return false;
    if (c.lane !== lane && laneCount(S, lane) >= capOf(S)) return false;
    const from = `${LANE_NAME[c.lane]} ${cellName(c.u, c.k)}`;
    c.lane = lane; c.u = u; c.k = 4; S.tpUsed = true;
    fx(S, { t: "deploy", id: c.id });
    log(S, "essaim", `Déploiement : ${c.name} redéployé de ${from} à l'entrée de la lane ${LANE_NAME[lane]}, colonne ${COLS[u + 2]}.`);
    return true;
  }
  function attackerPick(S, counts) {
    if (S.startHand) { attackerDraw(S); return true; } // premier tour : main de départ imposée
    const { total, levels } = pickRule(S);
    if (counts.reduce((a, b) => a + b, 0) !== total) return false; // ni plus ni moins que le palier
    for (const l of [1, 2, 3]) if (counts[l - 1] && (!levels.includes(l) || counts[l - 1] > S.piles[l].length)) return false;
    S.handA = []; delete S.pickTotal;
    for (const l of [1, 2, 3]) for (let i = 0; i < counts[l - 1]; i++) S.handA.push({ name: S.piles[l].pop(), free: false, uid: S.nextId++ });
    finishPick(S, counts);
    return true;
  }
  function canDeploy(S, card, lane) {
    const cost = card.free ? 0 : CREATURES[card.name].cost;
    return S.phase === "A_deploy" && cost <= S.budget && laneCount(S, lane) < capOf(S);
  }
  // soutiens « parachutables » (Oni, 07/11/2026) : n'importe quelle case libre de la lane (sans bâtiment, coin ni fusée),
  // pas seulement l'entrée ; la limite de population de la lane s'applique comme d'habitude
  function canDrop(S, name, lane, u, k) {
    if (k === undefined || k === 4) return Math.abs(u) <= 2;
    if (CREATURES[name].type !== "soutien") return false;
    const [x, y] = toGlobal(lane, u, k);
    return walkable(S, lane, x, y);
  }
  function deploy(S, uid, lane, u, target, k) {
    const i = S.handA.findIndex(c => c.uid === uid); if (i < 0) return false;
    const card = S.handA[i];
    if (!canDeploy(S, card, lane) || !canDrop(S, card.name, lane, u, k)) return false;
    // Sapeur : s'il y a des bâtiments dans sa lane, il faut en désigner un (target)
    if (card.name === "Sapeur" && laneTiles(S, lane).length && !laneTiles(S, lane).includes(target)) return false;
    S.budget -= card.free ? 0 : CREATURES[card.name].cost;
    S.handA.splice(i, 1);
    const c = makeCreature(S, card.name, lane, u, k && k < 4 ? { k } : {});
    S.creatures.push(c);
    fx(S, { t: "deploy", id: c.id });
    log(S, "essaim", `${card.name} ${k && k < 4 ? "parachuté" : "déployé"}${card.free ? " gratuitement" : ""} en lane ${LANE_NAME[lane]}, ${k && k < 4 ? "case " + cellName(u, k) : "colonne " + COLS[u + 2]}.`);
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
    // la réserve d'abord, pour garder le budget du tour pour les créatures (Oni, 09/11/2026)
    const r = Math.min(left, S.reserve); S.reserve -= r; left -= r;
    if (left > 0 && S.phase === "A_deploy") { const b = Math.min(left, S.budget); S.budget -= b; left -= b; }
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
    if (type === "tank" && slot === "A2") { // Blindage : les tanks déjà en jeu reçoivent aussi leur jeton (Oni, 11/11/2026)
      for (const c of S.creatures) if (CREATURES[c.name].type === "tank") c.blind = 1;
    }
    if (type === "soutien" && slot === "A2") { // Régénération : les Glaneurs de la pioche sortent du jeu (Oni, 11/11/2026)
      const n = S.piles[1].filter(x => x === "Glaneur").length;
      S.piles[1] = S.piles[1].filter(x => x !== "Glaneur");
      if (n) log(S, "essaim", `Régénération : ${n} Glaneur${n > 1 ? "s sortent" : " sort"} de la pioche.`);
    }
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
    // Régénération = Aura Soin total (Oni, 11/11/2026) : les autres créatures de la case d'un soutien retrouvent tous leurs PV
    for (const c of S.creatures) {
      const regen = S.upgrades.soutien.r2 === "A" && countMates(S, c, isSoutien) > 0;
      const m = maxHp(S, c.name), v = regen ? m : soinValue(S, c);
      if (v && c.hp < m) { const before = c.hp; c.hp = Math.min(m, c.hp + v); fx(S, { t: "cheal", id: c.id, n: c.hp - before, hp: c.hp + bonusHp(S, c) }); log(S, "essaim", `${c.name} regagne ${c.hp - before} PV.`); }
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
      : name === "Double bouclier" ? { keys: arg } : name === "Onde de choc" ? { ring: Number(arg) } : name === "Réparation" ? { keys: arg } : name === "Reconversion" ? { k: arg && arg.tile }
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
      case "Frappe orbitale": { const c = cr(arg); if (!c) return false; const t = resolveTarget(S, c); if (!t) return false; damageCreature(S, t, t.hp + bonusHp(S, t), name); return true; } // détruit la créature visée (Oni, 09/11/2026 ; avant 4 puis 5 dégâts)
      case "Salve": {
        const c = cr(arg); if (!c) return false;
        const group = [c, ...caseMates(S, c)].filter(o => targetable(S, o));
        if (!group.length) return false;
        const first = resolveTarget(S, c) || group[0];
        const rest = group.filter(o => o !== first).sort((a, b) => effAtq(S, b) - effAtq(S, a));
        damageCreature(S, first, 3, name); if (rest[0]) damageCreature(S, rest[0], 3, name); // 3 dégâts (Oni, 09/11/2026 ; avant 2)
        return true;
      }
      case "Barrage": { if (!LANES.includes(arg)) return false; for (const c of S.creatures.filter(c => c.lane === arg && targetable(S, c))) damageCreature(S, c, 1, name); return true; }
      case "Onde de choc": { const r = Number(arg); if (!(r >= 1 && r <= 3)) return false; for (const c of S.creatures.filter(c => c.k === r && targetable(S, c))) damageCreature(S, c, 1, name); return true; }
      case "Champ de stase": { if (typeof arg !== "string" || !S.tiles[arg]) return false; S.stase.push(arg); return true; }
      case "Famine": { if (S.phase !== "A_start") return false; S.famine = 1; return true; }
      case "Brouillage": { // stase de toute une case (Oni, 09/11/2026) : ses créatures ne bougent pas et n'attaquent pas ce tour
        const c0 = cr(arg); if (!c0) return false;
        const group = [c0, ...caseMates(S, c0)].filter(o => !o.acted); if (!group.length) return false;
        for (const c of group) { c.acted = true; c.jammed = true; }
        log(S, "colonie", `Brouillage : ${group.map(c => c.name).join(", ")} ne bougent pas et n'attaquent pas ce tour.`);
        return true;
      }
      case "Effort": S.extraPts += 2; return true;
      case "Feu nourri": S.doubleFire = true; return true;
      case "Double bouclier": { // arg = 1 ou 2 clés de tuiles : chacune gagne un jeton Bouclier (non cumulable)
        if (!Array.isArray(arg) || !arg.length || arg.length > 2) return false;
        for (const k of arg) { const t = S.tiles[k]; if (t) { t.shield = 1; fx(S, { t: "heal", k, n: 0, hp: t.hp }); } }
        return true;
      }
      case "Réparation": { // arg = liste de clés de tuiles, 3 PV au total
        if (!Array.isArray(arg) || !arg.length || arg.length > 3) return false;
        for (const k of arg) { const t = S.tiles[k]; if (t && t.hp < t.max) { t.hp += 1; fx(S, { t: "heal", k, n: 1, hp: t.hp }); } }
        return true;
      }
      case "Renouvellement": { // arg = indices de la main à défausser
        if (!Array.isArray(arg)) return false;
        const idx = [...arg].sort((a, b) => b - a);
        // chaque tuile défaussée est remplacée par une tuile de la même pioche (renforts, actifs ou pièges)
        const cats = [];
        for (const i of idx) if (S.hand[i]) { const n = S.hand.splice(i, 1)[0]; S.tileDiscards[tileCat(n)].push(n); cats.push(tileCat(n)); }
        for (const c of cats) drawOneTile(S, c);
        S.extraPts += 1; // +1 point de construction (Oni, 09/11/2026)
        return true;
      }
      case "Reconversion": { // arg = {hand: index, tile: clé}
        if (!arg || S.hand[arg.hand] === undefined || !S.tiles[arg.tile] || S.tiles[arg.tile].start) return false;
        const old = S.tiles[arg.tile], nn = S.hand[arg.hand];
        const [x, y] = parse(arg.tile);
        S.tiles[arg.tile] = tileStats(nn, x, y);
        fx(S, { t: "place", k: arg.tile });
        if (TILES[nn].perm) S.workersBase += 1;
        S.hand.splice(arg.hand, 1);
        log(S, "colonie", `Reconversion : ${pubName(nn)} remplace ${old.camo && !old.revealed ? "une tuile camouflée" : old.name}.`);
        // la tuile remplacée ne revient plus en main : on la repose aussitôt où l'on veut (Oni, 09/11/2026)
        S.relocate = old;
        if (!relocateTargets(S).length) { S.hand.push(old.name); delete S.relocate; log(S, "colonie", "Aucune case libre : la tuile remplacée revient en main."); }
        return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------------ tour de la colonie
  // pioche de la colonie (Oni, 07/11/2026) : au début de son tour, elle complète sa main carte par carte en choisissant à
  // chaque fois la pioche (renforts, actifs ou pièges)
  const tilesLeft = (S, c) => S.tileDecks[c].length + S.tileDiscards[c].length;
  const needDraw = S => S.hand.length < handSize(S) && TILE_CATS.some(c => tilesLeft(S, c) > 0);
  function drawTileFrom(S, cat) {
    if (S.phase !== "D_draw" || !TILE_CATS.includes(cat) || !tilesLeft(S, cat) || !needDraw(S)) return false;
    drawOneTile(S, cat);
    fx(S, { t: "tdraw", cat });
    if (!needDraw(S)) { S.phase = "D_main"; log(S, "colonie", `Main de ${S.hand.length} tuile${S.hand.length > 1 ? "s" : ""}.`); }
    return true;
  }
  function startDefenderTurn(S) {
    S.phase = needDraw(S) ? "D_draw" : "D_main"; S.alloc = { N: 0, E: 0, S: 0, O: 0 }; S.extraPts = 0; S.cadence = false; S.firedSupports = []; S.doubleFire = false;
    S.escaped = []; // Échappée : une fois par case pendant le tour de l'essaim, et encore une fois pendant celui de la colonie (Oni, 11/11/2026)
    // construction immédiate (Oni, 08/11/2026) : points du tour fixés au début du tour (un bâtiment posé ce tour, ou un
    // support de niveau 3 apparu, ne donne ses travailleurs qu'au tour suivant), dépensés bâtiment par bâtiment
    S.turnPts = S.workersBase + bonusWorkers(S); S.spent = 0; S.built = { N: 0, E: 0, S: 0, O: 0 };
  }
  // points de construction encore disponibles ce tour (le reste ira à la fusée)
  const pointsLeft = S => (S.turnPts != null ? S.turnPts + S.extraPts : totalPoints(S)) - (S.spent || 0) - allocated(S);
  // Construction immédiate (Oni, 08/11/2026 ; remplace les ateliers) : on paie d'un coup les points de construction d'une
  // tuile de la main et on la pose aussitôt sur une case valable ; un bâtiment par lane et par tour (2 au palier 6)
  // Premier tour de la colonie (Oni, 12/11/2026) : un seul bâtiment au total ; les points non dépensés vont à la fusée
  const firstTurnCap = S => S.round === 1 && LANES.reduce((n, l) => n + ((S.built && S.built[l]) || 0), 0) >= 1;
  function canBuildAt(S, name, k) {
    const t = TILES[name]; if (!t || S.phase !== "D_main" || S.relocate) return false;
    if (firstTurnCap(S)) return false;
    const lane = cellLane(...parse(k)); if (!lane) return false;
    if (((S.built && S.built[lane]) || 0) + S.chantiers[lane].length >= S.chPerLane) return false;
    return t.d <= pointsLeft(S) && canTarget(S, lane, k);
  }
  function buildTargets(S, i) {
    const name = S.hand[i], out = [];
    if (!name) return out;
    for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) { const k = key(x, y); if (canBuildAt(S, name, k)) out.push(k); }
    return out;
  }
  function buildAt(S, i, k) {
    const name = S.hand[i];
    if (!name || !canBuildAt(S, name, k)) return false;
    const lane = cellLane(...parse(k));
    S.hand.splice(i, 1);
    S.spent = (S.spent || 0) + TILES[name].d;
    S.built = S.built || { N: 0, E: 0, S: 0, O: 0 }; S.built[lane] += 1;
    fx(S, { t: "work", lane, n: TILES[name].d });
    putTile(S, name, k, lane);
    return true;
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
    // Provocation (tank, côté B) : les tanks subissent 1 dégât de moins des tourelles (Oni, 07/11/2026)
    // Blindage (tank, rang 2 côté A) : aussi −1 dégât des tourelles (Oni, 09/11/2026)
    // −1 par Provocation et −1 par Masse vivante, cumulables (Oni, 11/11/2026 ; avant Provocation ou Blindage)
    const tk = CREATURES[t.name].type === "tank", red = [tk && S.upgrades.tank.r1 === "B" ? "Provocation −1" : "", tk && S.upgrades.tank.r2 === "B" ? "Masse vivante −1" : ""].filter(Boolean);
    damageCreature(S, t, Math.max(0, turretDmg(S, lvl) - red.length), `tourelle de niveau ${lvl}${red.length ? ", " + red.join(", ") : ""}`);
    killCheck(S);
    return true;
  }
  // Dépouille : cases à portée (8 cases autour) d'une tourelle, que la colonie peut nettoyer avec un tir (Oni, 12/11/2026)
  function depTargets(S, sk) {
    const [x, y] = parse(sk);
    return (S.depouilles || []).filter(k => { const [a, b] = parse(k); return Math.max(Math.abs(a - x), Math.abs(b - y)) === 1; });
  }
  function fireDep(S, sk, k) {
    const lvl = S.supports[sk];
    if (!lvl || lvl === 3 || shotsLeft(S, sk) <= 0 || !depTargets(S, sk).includes(k)) return false;
    S.firedSupports.push(sk);
    S.depouilles = S.depouilles.filter(o => o !== k);
    fx(S, { t: "shot", sk, k });
    log(S, "colonie", `Une tourelle de niveau ${lvl} tire sur la Dépouille : la case est libérée.`);
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
    let rocket = pointsLeft(S); // points non dépensés (construction immédiate) et non affectés aux anciens chantiers
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
    const p = S.toPlace.shift();
    putTile(S, p.tile, k, p.lane);
    skipUnplaceable(S);
    if (!S.toPlace.length) finishDefenderTurn(S);
    return true;
  }
  // pose d'une tuile (chantier achevé ou construction immédiate)
  function putTile(S, name, k, lane) {
    const [x, y] = parse(k);
    pushBack(S, k);
    S.tiles[k] = tileStats(name, x, y);
    S.builtCount = S.builtCount || {}; S.builtCount[name] = (S.builtCount[name] || 0) + 1; // statistiques (Oni, 09/11/2026)
    fx(S, { t: "place", k });
    if (TILES[name].perm) { S.workersBase += 1; log(S, "colonie", "+1 travailleur permanent."); }
    placeSupports(S); // un support apparaît dès que ses murs sont construits
    log(S, "colonie", TILES[name].camo ? `Une tuile camouflée est construite en lane ${LANE_NAME[lane]}.` : `${name} construit en lane ${LANE_NAME[lane]}.`);
    visionSweep(S); // un Œil-sonde en vie dans la lane révèle aussitôt la nouvelle tuile camouflée
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
        // Réincarnation (Oni, 10/11/2026) : les tanks détruits par la Nuke sont mis de côté comme les autres tanks morts
        const reinc = S.upgrades.tank.r2 === "C";
        for (const c of S.creatures) {
          if (reinc && CREATURES[c.name].type === "tank") { S.reincQueue = S.reincQueue || []; S.reincQueue.push({ name: c.name, lane: c.lane, u: c.u, k: c.k }); }
          else toPile(S, c.name);
        }
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
    // sortilèges de soutien non joués : gardés en main (Oni, 01/11/2026) ; les tuiles se piochent au début du tour suivant
    // pioche des sortilèges (Oni, 09/11/2026) : pour chaque sortilège, la colonie choisit une des deux premières cartes
    // et défausse l'autre (étape D_spell) ; pioche vide : on remélange la défausse
    S.spellDraws = spellsPerTurn(S);
    if (!offerSpell(S)) finishColonyTurn(S);
  }
  function spellCard(S) {
    if (!S.spellDeck.length) { S.spellDeck = shuffle(S.spellDiscard); S.spellDiscard = []; }
    return S.spellDeck.length ? S.spellDeck.pop() : null;
  }
  function offerSpell(S) {
    if (!(S.spellDraws > 0)) return false;
    const a = spellCard(S); if (!a) return false;
    const b = spellCard(S);
    S.spellOffer = b ? [a, b] : [a]; S.phase = "D_spell";
    return true;
  }
  function pickSpell(S, i) {
    if (S.phase !== "D_spell" || !S.spellOffer || !S.spellOffer[i]) return false;
    const got = S.spellOffer[i];
    S.spells.push(got);
    for (const [j, n] of S.spellOffer.entries()) if (j !== i) S.spellDiscard.push(n);
    S.spellOffer = null; S.spellDraws -= 1;
    log(S, "colonie", "Un sortilège pioché.");
    if (!offerSpell(S)) finishColonyTurn(S);
    return true;
  }
  function finishColonyTurn(S) {
    S.spellOffer = null; S.spellDraws = 0;
    S.round += 1;
    startAttackerTurn(S);
  }
  // Reconversion : cases où reposer la tuile remplacée (libres, valables pour leur lane)
  function relocateTargets(S) {
    if (!S.relocate) return [];
    const out = [];
    for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) { const k = key(x, y), lane = cellLane(x, y); if (lane && canTarget(S, lane, k)) out.push(k); }
    return out;
  }
  function relocate(S, k) {
    if (!S.relocate || !relocateTargets(S).includes(k)) return false;
    const t = S.relocate; delete S.relocate;
    pushBack(S, k); S.tiles[k] = t;
    fx(S, { t: "place", k });
    placeSupports(S); visionSweep(S);
    log(S, "colonie", `Reconversion : ${t.camo && !t.revealed ? "la tuile camouflée" : t.name} est reposée en lane ${LANE_NAME[cellLane(...parse(k))]}.`);
    return true;
  }
  function drawOneTile(S, cat) {
    if (!S.tileDecks[cat].length) { S.tileDecks[cat] = shuffle(S.tileDiscards[cat]); S.tileDiscards[cat] = []; }
    if (S.tileDecks[cat].length) S.hand.push(S.tileDecks[cat].pop());
  }

  // Parties enregistrées avec d'anciennes règles : les tuiles de départ (« Mur de départ », « Haie de départ »,
  // « Haie d'épines » marquée start) deviennent des Barbelés
  // de départ (1 PV, Épines 1), et les Épines des tuiles posées suivent les nouvelles valeurs. Sans effet sur une partie à jour.
  function migrate(S) {
    if (!S.version) S.version = "0.3"; // partie commencée avant le suivi des versions
    if (!S.depouilles) S.depouilles = [];
    delete S.reincUsed; // Réincarnation au choix (v0.5.14)
    if (S.killed === undefined) S.killed = 0;
    // v0.5 : Hurleur et Catalyseur changent de niveau, donc de pioche
    if (S.piles && S.piles[1]) for (const l of [1, 2, 3]) {
      const wrong = S.piles[l].filter(n => CREATURES[n] && CREATURES[n].lvl !== l);
      if (wrong.length) { S.piles[l] = S.piles[l].filter(n => !wrong.includes(n)); for (const n of wrong) S.piles[CREATURES[n].lvl].push(n); }
    }
    // ancien « Bouclier X » → Renforcé X (02/11/2026) ; le Bouclier de l'Abri blindé (jeton, 07/11/2026) n'est pas concerné
    for (const t of Object.values(S.tiles || {})) if (t.shield && !(TILES[t.name] && TILES[t.name].shield)) { t.ren = t.shield; delete t.shield; }
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
    // Cadence retirée (Oni, 09/11/2026) : en main, elle devient Effort (même effet) ; elle sort des pioches
    if (Array.isArray(S.spells)) S.spells = S.spells.map(n => (n === "Cadence" ? "Effort" : n));
    for (const k of ["spellDeck", "spellDiscard"]) if (Array.isArray(S[k])) S[k] = S[k].filter(n => n !== "Cadence");
    // pioches de tuiles par catégorie (Oni, 07/11/2026) : Piège et Siphon renommés, pioche unique répartie en trois
    const ren = n => OLD_TILE[n] || n;
    if (Array.isArray(S.hand)) S.hand = S.hand.map(n => (n === null ? n : ren(n)));
    for (const t of Object.values(S.tiles || {})) if (OLD_TILE[t.name]) t.name = ren(t.name);
    for (const l of Object.keys(S.chantiers || {})) for (const ch of S.chantiers[l]) if (ch && ch.tile) ch.tile = ren(ch.tile);
    for (const p of S.toPlace || []) if (p && p.tile) p.tile = ren(p.tile);
    if (!S.tileDecks && Array.isArray(S.tileDeck)) {
      S.tileDecks = { renfort: [], actif: [], piege: [] }; S.tileDiscards = { renfort: [], actif: [], piege: [] };
      for (const n of S.tileDeck) if (n) S.tileDecks[tileCat(ren(n))].push(ren(n));
      for (const n of S.tileDiscard || []) if (n) S.tileDiscards[tileCat(ren(n))].push(ren(n));
      // nouvelles tuiles (Mines mineure / majeure, Siphons mineur / majeur, Abri blindé) ajoutées à leur pioche
      for (const n of ["Mine mineure", "Mine majeure", "Siphon mineur", "Siphon majeur", "Abri blindé"]) for (let i = 0; i < TILES[n].n; i++) S.tileDecks[tileCat(n)].push(n);
      for (const c of TILE_CATS) shuffle(S.tileDecks[c]);
      delete S.tileDeck; delete S.tileDiscard;
    }
    return S;
  }

  // ------------------------------------------------------------------ actions des joueurs
  // Point d'entrée unique, utilisé par l'interface locale et par le serveur en ligne :
  // vérifie le camp, la phase et les paramètres, puis appelle les fonctions de règles ci-dessus.
  // Les transitions de phase qui vivaient dans l'interface (fenêtres Famine / Réaction, passage aux tirs) sont ici.
  const PHASE_SIDE = { A_reinc: "essaim", D_spell: "colonie", D_draw: "colonie", A_famine: "colonie", A_start: "essaim", A_deploy: "essaim", A_upgrade: "essaim", A_react: "colonie", A_attack: "essaim", D_main: "colonie", D_fire: "colonie", D_place: "colonie" };
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
      case "Double bouclier": return Array.isArray(arg) && arg.length >= 1 && arg.length <= 2 && new Set(arg).size === arg.length && arg.every(k => own(S.tiles, k));
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
    // Réincarnation : l'essaim choisit le tank qui revient (Oni, 10/11/2026) ; ensuite, fenêtre Famine éventuelle
    reinc: { phase: ["A_reinc"], run(S, a) { if (!isInt(a.i) || !reincarnate(S, a.i)) return false; S.phase = "A_start"; openFamine(S); return true; } },
    draw: { phase: ["A_start"], run: S => { attackerDraw(S); return true; } }, // pioche au hasard (premier tour, tests)
    pickOne: { phase: ["A_start"], run: (S, a) => isInt(a.l) && pickOne(S, a.l) }, // une carte dans la pile choisie
    teleport: { phase: ["A_deploy"], run: (S, a) => isInt(a.id) && isLane(a.lane) && isInt(a.u) && teleport(S, a.id, a.lane, a.u) },
    pick: { phase: ["A_start"], run: (S, a) => Array.isArray(a.n) && a.n.length === 3 && a.n.every(x => isInt(x) && x >= 0) && attackerPick(S, a.n) },
    frenzy: { phase: ["A_deploy", "A_upgrade", "A_attack"], run: (S, a) => isInt(a.src) && isInt(a.target) && setFrenzy(S, a.src, a.target) },
    deploy: { phase: ["A_deploy"], run: (S, a) => isInt(a.uid) && isLane(a.lane) && isInt(a.u) && Math.abs(a.u) <= 2 && (a.target === undefined || typeof a.target === "string") && (a.k === undefined || (isInt(a.k) && a.k >= 1 && a.k <= 4)) && deploy(S, a.uid, a.lane, a.u, a.target, a.k) },
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
      const name = isInt(a.i) ? S.spells[a.i] : undefined; if (!name || S.relocate) return false;
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
    rest: { phase: ["A_attack"], run: (S, a) => isInt(a.id) && restCreature(S, a.id) }, // la créature n'agit plus ce tour
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
    tdraw: { phase: ["D_draw"], run: (S, a) => drawTileFrom(S, a.cat) }, // pioche d'une tuile dans la pioche choisie
    buildAt: { phase: ["D_main"], run: (S, a) => isInt(a.i) && typeof a.k === "string" && /^-?\d,-?\d$/.test(a.k) && buildAt(S, a.i, a.k) },
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
    build: { phase: ["D_main"], run: S => { if (S.relocate) return false; endDefenderTurn(S); return true; } }, // construction et fusée, puis tirs
    relocate: { phase: ["D_main"], run: (S, a) => typeof a.k === "string" && relocate(S, a.k) }, // Reconversion : repose la tuile remplacée
    spellPick: { phase: ["D_spell"], run(S, a) { if (!(isInt(a.i) && pickSpell(S, a.i))) return false; openFamine(S); return true; } },
    toFire: { phase: ["D_main"], run: S => { endDefenderTurn(S); return true; } }, // ancien nom (pages encore ouvertes)
    fire: { phase: ["D_fire"], run: (S, a) => own(S.supports, a.sk) && isInt(a.id) && fire(S, a.sk, a.id) },
    fireDep: { phase: ["D_fire"], run: (S, a) => own(S.supports, a.sk) && typeof a.k === "string" && fireDep(S, a.sk, a.k) },
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
    syncBonus(S); // déplacements, déploiements : bonus de PV à jour
    autoAdvance(S);
    return "";
  }
  // Passage automatique (Oni, 04/11/2026) : quand le camp n'a plus rien à faire dans l'étape, le tour passe seul
  // (plus de bouton « Fin du tour de l'essaim » ; la colonie passe la main dès qu'aucune tourelle ne peut plus tirer).
  function canStillFire(S) {
    return Object.entries(S.supports).some(([k, l]) => l < 3 && shotsLeft(S, k) > 0 && (supportTargets(S, k).length || depTargets(S, k).length));
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
    V.tileDecks = Object.fromEntries(TILE_CATS.map(c => [c, blank(V.tileDecks[c])])); V.tileDiscards = Object.fromEntries(TILE_CATS.map(c => [c, blank(V.tileDiscards[c])]));
    V.spellDeck = blank(V.spellDeck); // la défausse des sortilèges est publique (Oni, 09/11/2026)
    for (const l of [1, 2, 3]) V.piles[l] = blank(V.piles[l]);
    if (side === "colonie") V.handA = blank(V.handA);
    if (side === "essaim") {
      V.hand = blank(V.hand); V.spells = blank(V.spells); if (V.spellOffer) V.spellOffer = blank(V.spellOffer);
      if (V.relocate) V.relocate = { hidden: true };
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
    fxFor, migrate, firstTurnCap, damageCreature, hitTile, famineBudget, MIN_BIOMASS, siphonLoss, relocateTargets, buildTargets, canBuildAt, pointsLeft, TILE_CATS, CAT_NAME, tileCat, tilesLeft, needDraw, shotsLeft, SUP3_WORKERS, TRAP_DMG, floorCost, FLOOR_COSTS, START_WALL,
    PHASE_SIDE, ACTIONS, actor, apply, viewFor,
    CREATURES, TILES, TILE_TEXT, SPELLS, TIERS, TREES, LANES, LANE_NAME, COLS, COST_R1, COST_R2, FLOORS,
    key, parse, ring, cellLane, toGlobal, toLocal, nextStep, isSupportCell, supportLanes, supportWalls, setRng, shuffle,
    newGame, tier, capOf, laneCount, tech, spellsPerTurn, bonusWorkers, totalPoints, allocated, handSize, posKey, caseMates,
    clairvoyance, reachable, pathCells, pickRule, tierCards, attackerPick, canDrop, strikeTargets, strikesPerTurn, restCreature, stepsLeft, canAct, moveCreature, strikeAt, frenzyOf, frenzyCount, hasMobility, hasPercee, isStealthy, maxHp, baseAtq, effAtq, bonusHp, epinesOf, canTarget, walk, laneTiles,
    attacks, pushBack, act, actCase, readyCases, blockAt, pathLen, attackerDraw, canDeploy, deploy, endDeploy, canBuy, buy, invest, invested, nodeState, investable, nodeCost, speedOf, baseSpeed, startAttacks, attackOrder, endAttackerTurn,
    useSpell, startChantier, cancelChantier, placeTargets, placeTile, supportTargets, depTargets, fireDep, turretDmg, rocketMilestones, fire, autoFire, endDefenderTurn, endColonyTurn, targetable, resolveTarget,
    tileStats, placeSupports, killCheck, pubName,
  };
})();
if (typeof module !== "undefined") module.exports = SF;
