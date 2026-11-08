// IA pour jouer en solo (Oni, 08/11/2026) : joue l'essaim ou la colonie et fait de son mieux pour gagner.
// - Honnête : elle ne décide qu'à partir de la vue de son camp (SF.viewFor) ; ce qui est caché (main adverse,
//   sortilèges, tuiles camouflées, pioches) est remplacé par des estimations.
// - Évaluation coup par coup : pour chaque décision, elle essaie les actions possibles sur une copie de la partie,
//   termine le tour avec un jeu par défaut (et, pour la colonie, la riposte probable de l'essaim), puis note le résultat.
// Aucun accès au DOM : utilisable dans la page (après engine.js) et sous Node (tests).
const IA = (() => {
  const E = typeof SF !== "undefined" ? SF : require("./engine.js");
  const clone = o => JSON.parse(JSON.stringify(o));
  const other = side => (side === "essaim" ? "colonie" : "essaim");
  const ok = (V, side, type, args) => E.apply(V, side, type, args || {}) === "";

  // ------------------------------------------------------------ état « croyance » (ce que le camp voit + estimations)
  function belief(S, side) {
    const V = E.viewFor(S, side);
    V.log = []; delete V.fx;
    V.spellDeck = []; V.spellDiscard = [];
    // pioches de créatures : seulement leur nombre de cartes (cases vides), ce qui suffit pour la pioche au choix
    if (side === "essaim") {
      V.hand = []; V.spells = []; // l'essaim ignore la main et les sortilèges de la colonie
      for (const k of Object.keys(V.tiles)) {
        const t = V.tiles[k];
        if (t.hidden) { // tuile camouflée inconnue : estimée comme une Palissade (2 PV), sans piège
          const [x, y] = E.parse(k);
          V.tiles[k] = Object.assign(E.tileStats("Palissade", x, y), { revealed: false });
        }
      }
      for (const l of E.LANES) for (const ch of V.chantiers[l]) if (!ch.tile) ch.tile = "Palissade";
      for (const p of V.toPlace) if (!p.tile) p.tile = "Palissade";
    } else {
      V.handA = [];
    }
    return V;
  }

  // ------------------------------------------------------------ évaluation (positive = bon pour l'essaim)
  const dist = c => { let u = c.u, k = c.k, n = 0; while (k !== 0 && n < 12) { [u, k] = E.nextStep(u, k); n++; } return n; };
  function score(S) {
    if (S.winner === "essaim") return 1e6;
    if (S.winner === "colonie") return -1e6;
    let s = 0;
    const rocket = S.floors + S.rocketPts / E.floorCost(S);
    s -= rocket * 45;                       // la fusée est la menace principale pour l'essaim
    s -= S.workersBase * 22;                // chaque travailleur tué rapproche l'essaim de la victoire
    s -= E.tech(S) * 2.5;
    s += S.biomass * 3.5 + (S.reserve || 0) * 0.8;
    for (const v of Object.values(S.invest || {})) s += v * 1.1;
    for (const t of ["aggro", "tank", "soutien"]) for (const r of ["r1", "r2"]) if (S.upgrades[t][r]) s += r === "r1" ? 12 : 22;
    for (const c of S.creatures) {
      const b = E.CREATURES[c.name], hp = c.hp + E.bonusHp(S, c), d = dist(c);
      const base = b.cost * 2 + E.effAtq(S, c) * 1.6 + hp * 0.9;
      s += base * (1 + Math.max(0, 7 - d) * 0.12) + (d <= 1 ? 6 : 0);
    }
    for (const [k, t] of Object.entries(S.tiles)) {
      if (t.start) { s -= t.hp * 2; continue; }
      const r = E.ring(...E.parse(k));
      s -= (t.hp * 2.5 + (t.ren || 0) * 1.5 + (t.ep || 0) * 1.5 + (t.tech || 0) * 4 + (t.temp || 0) * 6 + (t.shield ? 3 : 0) + (t.trap || t.siphon ? 2 : 0)) * (1 + (3 - Math.min(3, r)) * 0.15);
    }
    for (const l of Object.values(S.supports)) s -= 5 + l * 3;
    s -= (S.hand || []).length * 2 + (S.spells || []).length * 3;
    return s;
  }
  const val = (S, side) => (side === "essaim" ? score(S) : -score(S));

  // ------------------------------------------------------------ fins de tour par défaut (simulations)
  // essaim : termine son tour (déploiement fini, réaction passée, toutes les créatures agissent)
  function finishSwarm(V) {
    for (let i = 0; i < 6 && !V.winner; i++) {
      if (V.phase === "A_deploy") ok(V, "essaim", "endDeploy");
      else if (V.phase === "A_upgrade") ok(V, "essaim", "toAttacks");
      else if (V.phase === "A_react") ok(V, "colonie", "reactDone");
      else if (V.phase === "A_attack") { if (!ok(V, "essaim", "actAll")) ok(V, "essaim", "endA"); }
      else break;
    }
    return V;
  }
  // colonie : termine son tour (construction, pose, tirs), puis riposte de l'essaim avec les créatures déjà en jeu
  function finishColony(V) {
    for (let i = 0; i < 20 && !V.winner; i++) {
      if (V.phase === "D_draw") { const c = E.TILE_CATS.find(c => E.tilesLeft(V, c) > 0); if (!c || !ok(V, "colonie", "tdraw", { cat: c })) break; }
      else if (V.phase === "D_main") ok(V, "colonie", "build");
      else if (V.phase === "D_place") { const t = E.placeTargets(V); if (!t.length || !ok(V, "colonie", "placeAt", { k: bestPlaceGuess(V, t) })) break; }
      else if (V.phase === "D_fire") ok(V, "colonie", "endD");
      else break;
    }
    return swarmThreat(V);
  }
  // riposte probable : toutes les créatures en jeu avancent et attaquent (sans déploiement : la main de l'essaim est cachée)
  function swarmThreat(V) {
    if (V.winner) return V;
    for (const c of V.creatures) { c.acted = false; c.new = false; delete c.moved; delete c.spd; delete c.struck; delete c.jammed; }
    V.stase = []; V.phase = "A_attack";
    try { E.ACTIONS.actAll.run(V); } catch (e) { /* estimation : on garde l'état atteint */ }
    return V;
  }
  // case de pose estimée (simulations) : la plus menacée = celle où le plus de créatures de la lane passent
  function bestPlaceGuess(V, targets) {
    let best = targets[0], bs = -1;
    for (const k of targets) {
      const [x, y] = E.parse(k), r = E.ring(x, y);
      const near = V.creatures.filter(c => { const [a, b] = E.toGlobal(c.lane, c.u, c.k); return Math.abs(a - x) + Math.abs(b - y) <= 2; }).length;
      const s = near * 3 + (4 - r);
      if (s > bs) { bs = s; best = k; }
    }
    return best;
  }

  // choisit parmi des candidats { type, args } celui qui donne la meilleure note après la fin de tour simulée
  function best(V, side, cands, finish) {
    let top = null, ts = -Infinity;
    for (const c of cands) {
      const W = clone(V);
      if (!ok(W, side, c.type, c.args)) continue;
      const s = val(finish(W), side) - (c.cost || 0);
      if (s > ts) { ts = s; top = c; }
    }
    return { move: top, s: ts };
  }

  // ------------------------------------------------------------ décisions de l'essaim
  const AVG_COST = { 1: 2.6, 2: 3.5, 3: 5.5 };
  function swarmPick(V) {
    const { total, levels } = E.pickRule(V);
    const budget = V.famine ? Math.floor(V.biomass / 2) : V.biomass;
    // les piles sont cachées : on ne connaît que leur nombre de cartes (__pileN)
    const n = [0, 0, 0], avail = { 1: V.__pileN[1], 2: V.__pileN[2], 3: V.__pileN[3] };
    // tout en niveau 1, puis on monte de niveau tant que le coût moyen reste à portée du budget (un peu plus, pour choisir)
    while (n[0] < Math.min(total, avail[1])) n[0]++;
    for (let i = 0; i < total; i++) {
      const cost = n.reduce((a, q, j) => a + q * AVG_COST[j + 1], 0);
      let moved = false;
      for (const l of [3, 2]) {
        if (!levels.includes(l) || n[l - 1] >= avail[l]) continue;
        const from = n[0] > 0 ? 1 : n[1] > 0 && l === 3 ? 2 : 0;
        if (!from) continue;
        const extra = AVG_COST[l] - AVG_COST[from];
        if (cost + extra <= budget * 1.25) { n[from - 1]--; n[l - 1]++; moved = true; break; }
      }
      if (!moved) break;
    }
    // pile 1 trop courte : compléter avec les autres
    let miss = total - n.reduce((a, b) => a + b, 0);
    for (const l of [2, 3, 1]) while (miss > 0 && n[l - 1] < avail[l] && levels.includes(l)) { n[l - 1]++; miss--; }
    return { type: "pick", args: { n } };
  }
  // ordre de préférence des améliorations
  const NODES = [["aggro", "A1"], ["soutien", "B1"], ["aggro", "A2"], ["tank", "A1"], ["soutien", "B2"], ["tank", "A2"], ["aggro", "C2"], ["aggro", "B1"], ["aggro", "B2"], ["tank", "B1"], ["tank", "C2"], ["tank", "B2"], ["soutien", "A1"], ["soutien", "A2"], ["soutien", "C2"]];
  function swarmInvest(V) {
    const can = (V.budget || 0) + (V.reserve || 0);
    if (can <= 0) return null;
    // un nœud déjà entamé d'abord, sinon le premier ouvert de la liste
    const st = (t, s) => E.nodeState(V, t, s);
    const started = NODES.find(([t, s]) => (V.invest || {})[t + ":" + s] > 0 && st(t, s) === "open");
    const node = started || NODES.find(([t, s]) => st(t, s) === "open");
    return node ? { type: "invest", args: { t: node[0], s: node[1], n: 99 } } : null;
  }
  function deployCands(V) {
    const out = [], seen = new Set();
    for (const card of V.handA) {
      const key = card.name + (card.free ? "*" : "");
      if (seen.has(key)) continue; seen.add(key);
      const sap = card.name === "Sapeur";
      for (const lane of E.LANES) {
        const targets = sap ? E.laneTiles(V, lane) : [undefined];
        for (const target of targets.length ? targets : [undefined]) {
          for (let u = -2; u <= 2; u++) out.push({ type: "deploy", args: { uid: card.uid, lane, u, target }, cost: card.free ? 0 : E.CREATURES[card.name].cost * 0.8 });
          if (E.CREATURES[card.name].type === "soutien") for (let u = -2; u <= 2; u++) for (let k = 1; k <= 3; k++) if (E.canDrop(V, card.name, lane, u, k)) out.push({ type: "deploy", args: { uid: card.uid, lane, u, target, k }, cost: E.CREATURES[card.name].cost * 0.8 });
        }
      }
    }
    return out;
  }
  function swarmDeploy(V) {
    const base = val(finishSwarm(clone(V)), "essaim");
    const { move, s } = best(V, "essaim", deployCands(V), finishSwarm);
    if (move && s > base + 0.5) return move;
    return swarmInvest(V) || { type: "endDeploy" };
  }
  function swarmAttack(V) {
    const cands = [{ type: "actAll" }];
    for (const c of V.creatures) {
      if (!E.canAct(V, c)) continue;
      if (!c.struck) for (const p of E.pathCells(V, c)) cands.push({ type: "move", args: { id: c.id, u: p.u, k: p.k } });
      for (const t of E.strikeTargets(V, c)) cands.push({ type: "strike", args: { id: c.id, target: t } });
    }
    if (cands.length === 1) return cands[0];
    const { move } = best(V, "essaim", cands, finishSwarm);
    return move || { type: "actAll" };
  }

  // ------------------------------------------------------------ décisions de la colonie
  function colonyReact(V) {
    const cands = [{ type: "reactDone" }];
    V.spells.forEach((name, i) => {
      const sp = E.SPELLS[name]; if (!sp || sp.kind !== "off" || name === "Famine") return;
      const args = name === "Barrage" ? E.LANES : name === "Onde de choc" ? [1, 2, 3] : name === "Champ de stase" ? Object.keys(V.tiles)
        : ["Frappe orbitale", "Salve", "Brouillage"].includes(name) ? V.creatures.map(c => c.id) : [];
      for (const arg of args) cands.push({ type: "spell", args: { i, arg }, cost: 9 }); // un sortilège gardé a de la valeur
    });
    if (cands.length === 1) return cands[0];
    const fin = W => { if (W.phase === "A_react") ok(W, "colonie", "reactDone"); return finishSwarm(W); };
    return best(V, "colonie", cands, fin).move || { type: "reactDone" };
  }
  function colonyDraw(V) {
    const max = E.handSize(V), have = { renfort: 0, actif: 0, piege: 0 };
    for (const n of V.hand) have[E.tileCat(n)]++;
    const near = V.creatures.filter(c => dist(c) <= 3).length;
    const want = { renfort: 0.45 + near * 0.04, actif: 0.4 - near * 0.03, piege: 0.15 };
    let top = null, td = -Infinity;
    for (const c of E.TILE_CATS) {
      if (!E.tilesLeft(V, c)) continue;
      const d = want[c] * max - have[c];
      if (d > td) { td = d; top = c; }
    }
    return { type: "tdraw", args: { cat: top || "renfort" } };
  }
  function colonyMain(V) {
    // sortilèges de soutien utiles tout de suite
    for (let i = 0; i < V.spells.length; i++) {
      const name = V.spells[i];
      if (name === "Effort" || name === "Cadence") return { type: "spell", args: { i } };
      if (name === "Feu nourri" && Object.keys(V.supports).some(sk => V.supports[sk] !== 3 && E.supportTargets(V, sk).length)) return { type: "spell", args: { i } };
      if (name === "Réparation") {
        const hurt = Object.entries(V.tiles).filter(([, t]) => t.hp < t.max && !t.start).sort((a, b) => (b[1].max - b[1].hp) - (a[1].max - a[1].hp)).slice(0, 3).map(([k]) => k);
        if (hurt.length) return { type: "spell", args: { i, arg: hurt } };
      }
    }
    // chantiers : la meilleure tuile et la meilleure lane, tant que ça améliore la position
    const cands = [{ type: "build" }];
    V.hand.forEach((n, i) => { for (const lane of E.LANES) if (V.chantiers[lane].length < V.chPerLane) cands.push({ type: "startCh", args: { i, lane } }); });
    if (cands.length === 1) return cands[0];
    return best(V, "colonie", cands, finishColony).move || { type: "build" };
  }
  function colonyPlace(V) {
    const cands = E.placeTargets(V).map(k => ({ type: "placeAt", args: { k } }));
    return best(V, "colonie", cands, finishColony).move || cands[0];
  }
  function colonyFire(V) {
    const cands = [{ type: "endD" }];
    for (const sk of Object.keys(V.supports)) {
      if (V.supports[sk] === 3 || E.shotsLeft(V, sk) <= 0) continue;
      for (const c of E.supportTargets(V, sk)) cands.push({ type: "fire", args: { sk, id: c.id } });
    }
    if (cands.length === 1) return cands[0];
    // tirs : note immédiate (créatures tuées ou blessées), la fin de tour faisant de toute façon les tirs restants
    let top = cands[0], ts = -Infinity;
    for (const c of cands) {
      const W = clone(V);
      if (!ok(W, "colonie", c.type, c.args)) continue;
      const s = val(W, "colonie") + (c.type === "endD" ? -0.5 : 0);
      if (s > ts) { ts = s; top = c; }
    }
    return top;
  }

  // ------------------------------------------------------------ point d'entrée
  // décision du camp `side` pour l'état S (complet) : renvoie { type, args } ou null si ce n'est pas son tour
  function decide(S, side) {
    if (S.winner || E.actor(S) !== side) return null;
    const V = belief(S, side);
    V.__pileN = { 1: S.piles[1].length, 2: S.piles[2].length, 3: S.piles[3].length }; // nombres seulement (publics pour l'essaim)
    try {
      switch (V.phase) {
        case "A_famine": return { type: "famine", args: { play: V.spells.includes("Famine") } };
        case "A_start": { // pioche carte par carte : la pile la plus haute encore prévue par le plan
          if (V.startHand) return { type: "draw" };
          const plan = swarmPick(V).args.n, got = [1, 2, 3].map(l => V.handA.filter(c => V.pickTotal != null && c.name && E.CREATURES[c.name].lvl === l).length);
          const l = [3, 2, 1].find(l => plan[l - 1] > got[l - 1] && V.__pileN[l] > 0) || [1, 2, 3].find(l => V.__pileN[l] > 0);
          return { type: "pickOne", args: { l } };
        }
        case "A_deploy": return swarmDeploy(V);
        case "A_upgrade": return swarmInvest(V) || { type: "toAttacks" };
        case "A_react": return colonyReact(V);
        case "A_attack": return swarmAttack(V);
        case "D_draw": return colonyDraw(V);
        case "D_main": return colonyMain(V);
        case "D_place": return colonyPlace(V);
        case "D_fire": return colonyFire(V);
      }
    } catch (e) {
      if (typeof console !== "undefined") console.error("IA :", e);
    }
    return fallback(S, side);
  }
  // action de secours (jamais de blocage) : termine l'étape en cours
  function fallback(S, side) {
    switch (S.phase) {
      case "A_famine": return { type: "famine", args: { play: false } };
      case "A_start": {
        if (S.startHand) return { type: "draw" };
        return { type: "pickOne", args: { l: [1, 2, 3].find(l => S.piles[l].length > 0) } };
      }
      case "A_deploy": return { type: "endDeploy" };
      case "A_upgrade": return { type: "toAttacks" };
      case "A_react": return { type: "reactDone" };
      case "A_attack": return { type: "actAll" };
      case "D_draw": return { type: "tdraw", args: { cat: E.TILE_CATS.find(c => E.tilesLeft(S, c) > 0) } };
      case "D_main": return { type: "build" };
      case "D_place": return { type: "placeAt", args: { k: E.placeTargets(S)[0] } };
      case "D_fire": return { type: "endD" };
    }
    return null;
  }
  return { decide, fallback, score, belief, other };
})();
if (typeof module !== "undefined") module.exports = IA;
