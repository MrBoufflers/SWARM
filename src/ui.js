// Siège & Fusée — interface 2 joueurs sur le même écran
"use strict";
(() => {
  const $ = s => document.querySelector(s);
  const E = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const icon = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;
  const SAVE = "siege-fusee-v03";
  let S = null;
  let UI = { sel: null, selCreature: null, spell: null, picks: [], support: null, mob: null, help: false, recoHand: null };

  const PHASE_TXT = {
    A_famine: ["colonie", "Début du tour de l'essaim", "La colonie peut jouer Famine avant que l'essaim calcule son budget."],
    A_start: ["essaim", "Tour de l'essaim", "Piochez vos cartes selon votre palier."],
    A_deploy: ["essaim", "Déploiement", "Choisissez une carte, puis une case d'entrée (bord du plateau) dans une lane. Vous pouvez aussi investir votre budget dans une amélioration (panneau Essaim). Le budget non dépensé ira à la réserve."],
    A_upgrade: ["essaim", "Améliorations", "Investissez votre réserve dans une amélioration (panneau Essaim), puis passez aux attaques."],
    A_react: ["colonie", "Réaction de la colonie", "Avant les attaques, la colonie peut jouer ses sortilèges offensifs."],
    A_attack: ["essaim", "Attaques", "Chaque créature se déplace puis attaque, une par une, dans l'ordre de votre choix."],
    D_main: ["colonie", "Tour de la colonie", "Sortilèges de soutien, chantiers, puis répartition des travailleurs."],
    D_fire: ["colonie", "Tirs des supports", "Choisissez une tourelle puis sa cible (une créature sur l'une des 8 cases qui l'entourent), ou laissez les tirs automatiques."],
    D_place: ["colonie", "Pose des bâtiments", "Un chantier est achevé : choisissez la case de sa lane où poser le bâtiment. Les créatures présentes reculent d'une case."],
  };
  const who = () => PHASE_TXT[S.phase] ? PHASE_TXT[S.phase][0] : "essaim";
  const SIDE = { essaim: "l'essaim", colonie: "la colonie" };

  // ---------------------------------------------------------------- sauvegarde
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } }
  function load() { try { const t = localStorage.getItem(SAVE); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
  function clearSave() { try { localStorage.removeItem(SAVE); } catch (e) { /* rien */ } }

  function newGame() { S = SF.newGame(); S.handoff = "essaim"; S.view = null; UI = resetUI(); save(); render(); }
  const resetUI = () => ({ sel: null, selCreature: null, spell: null, picks: [], support: null, mob: null, help: false, recoHand: null });
  function setPhaseHandoff() { // passe la main si le joueur actif change
    const w = who();
    if (S.view !== w) { S.handoff = w; UI = { ...resetUI(), help: UI.help }; }
  }

  // ---------------------------------------------------------------- rendu
  function render() {
    if (!S) return;
    document.body.dataset.view = S.view || "";
    $("#app").innerHTML = header() + (S.handoff ? handoff() : S.winner ? winner() + layout() : layout()) + (UI.help ? help() : "");
  }
  function header() {
    const p = PHASE_TXT[S.phase] || ["", "", ""];
    return `<header class="top"><div class="brand">${icon("fusee")}<b>Siège &amp; Fusée</b><span>prototype v0.3</span></div>
      <div class="round">Manche <b>${S.round}</b><span class="dot ${p[0]}"></span>${E(p[1])}</div>
      <div class="menu"><button data-a="help" class="ghost">Règles</button><button data-a="new" class="ghost">Nouvelle partie</button></div></header>`;
  }
  function handoff() {
    const w = S.handoff;
    return `<section class="handoff ${w}"><div class="ho-card">${icon(w === "essaim" ? "spores" : "fusee", "i big")}
      <p class="ho-k">Manche ${S.round}</p><h2>Au tour de ${SIDE[w]}</h2>
      <p>Passez l'appareil. Les mains et les tuiles camouflées de l'autre camp restent cachées.</p>
      <button data-a="reveal" class="primary">Je joue ${SIDE[w]}</button></div></section>`;
  }
  function winner() {
    return `<section class="banner win ${S.winner}">${icon(S.winner === "essaim" ? "spores" : "fusee")}<b>${S.winner === "essaim" ? "L'essaim gagne : la colonie n'a plus de travailleurs." : "La fusée décolle : la colonie gagne."}</b>
      <button data-a="new" class="primary">Rejouer</button></section>`;
  }
  function layout() {
    return `<main class="layout"><aside class="panel colonie">${colonyPanel()}</aside>
      <section class="center">${phaseBox()}<div class="board-wrap">${board()}</div>${detail()}</section>
      <aside class="panel essaim">${swarmPanel()}${logPanel()}</aside></main>`;
  }

  // ---------------------------------------------------------------- boîte d'action
  function phaseBox() {
    if (S.winner) return "";
    const p = PHASE_TXT[S.phase];
    let body = "", acts = "";
    const ph = S.phase;
    if (ph === "A_famine") {
      acts = `<button data-a="famine" data-v="1" class="primary">Jouer Famine</button><button data-a="famine" data-v="0">Ne pas jouer</button>`;
    } else if (ph === "A_start") {
      acts = `<button data-a="draw" class="primary">Piocher (palier ${SF.tier(S) + 1})</button>`;
    } else if (ph === "A_deploy") {
      body = UI.sel ? `<p class="hint">Carte choisie : <b>${E(cardOf(UI.sel).name)}</b>. Cliquez une case d'entrée surlignée.</p>` : "";
      acts = `<button data-a="endDeploy" class="primary">Terminer les déploiements</button>`;
    } else if (ph === "A_upgrade") {
      body = `<p class="hint">Réserve disponible : <b>${S.reserve}</b>. Investissez-la dans un nœud des arbres (panneau Essaim) ou gardez-la pour plus tard.</p>`;
      acts = `<button data-a="toAttacks" class="primary">Passer aux attaques</button>`;
    } else if (ph === "A_react") {
      body = spellBox("off");
      acts = `<button data-a="reactDone" class="primary">Terminer la réaction</button>`;
    } else if (ph === "A_attack") {
      if (UI.mob) {
        const c = S.creatures.find(o => o.id === UI.mob);
        body = `<p class="hint">${E(c.name)} a la Mobilité : choisissez sa cible dans la lane ${SF.LANE_NAME[c.lane]}.</p><div class="choices">` +
          SF.laneTiles(S, c.lane).map(k => `<button data-a="mobTarget" data-k="${k}">${E(tileLabel(k))}</button>`).join("") +
          `<button data-a="mobTarget" data-k="" class="primary">Cible normale</button></div>`;
      } else {
        const order = SF.attackOrder(S);
        body = order.length ? `<div class="choices">` + order.map(c => `<button data-a="act" data-id="${c.id}">${E(c.name)} · ${posTxt(c)}${SF.attacks(c) ? "" : " · avance"}</button>`).join("") + `</div>` : `<p class="hint">Toutes les créatures ont agi.</p>`;
        acts = (order.length ? `<button data-a="actAll">Tout résoudre (les plus avancées d'abord)</button>` : "") + `<button data-a="endA" class="primary"${order.length ? " disabled" : ""}>Fin du tour de l'essaim</button>`;
      }
    } else if (ph === "D_main") {
      body = spellBox("sup") + (UI.sel !== null ? `<p class="hint">Tuile choisie : <b>${E(S.hand[UI.sel])}</b>. Choisissez la lane de son chantier : bouton « Construire ici » dans les ateliers (panneau Colonie). La case exacte sera choisie à la fin de la construction.</p>` : "");
      acts = `<button data-a="toFire" class="primary">Passer aux tirs</button>`;
    } else if (ph === "D_place") {
      const p = S.toPlace[0];
      body = p ? `<p class="hint"><b>${E(p.tile)}</b> est achevé en lane ${SF.LANE_NAME[p.lane]} : cliquez une case surlignée.${S.toPlace.length > 1 ? ` Encore ${S.toPlace.length - 1} bâtiment${S.toPlace.length > 2 ? "s" : ""} à poser ensuite.` : ""}</p>` : "";
    } else if (ph === "D_fire") {
      if (UI.support) {
        const c = SF.supportTargets(S, UI.support);
        body = `<p class="hint">Tourelle de niveau ${S.supports[UI.support]} (${SF.turretDmg(S, S.supports[UI.support])} dégâts) : choisissez la cible.</p><div class="choices">` +
          c.map(o => `<button data-a="fireAt" data-id="${o.id}">${E(o.name)} · ${o.hp} PV · ${posTxt(o)}</button>`).join("") + `</div>`;
      } else {
        const ready = Object.keys(S.supports).filter(k => S.supports[k] < 3 && !S.firedSupports.includes(k) && SF.supportTargets(S, k).length);
        body = ready.length ? `<p class="hint">Tourelles prêtes : cliquez une tourelle surlignée sur le plateau.</p>` : `<p class="hint">Aucune tourelle n'a de cible.</p>`;
      }
      acts = `<button data-a="autoFire">Tirs automatiques</button><button data-a="endD" class="primary">Terminer le tour (construction et fusée)</button>`;
    }
    return `<section class="phase ${p[0]}"><div class="ph-head"><span class="dot ${p[0]}"></span><b>${E(p[1])}</b><span class="side">${E(SIDE[p[0]])}</span></div>
      <p class="ph-txt">${E(p[2])}</p>${body}<div class="acts">${acts}</div></section>`;
  }
  function spellBox(kind) {
    const list = S.spells.map((s, i) => [s, i]).filter(([s]) => SF.SPELLS[s].kind === kind && !(kind === "off" && s === "Famine"));
    if (UI.spell !== null) return spellTargeting();
    if (!list.length) return kind === "sup" ? "" : `<p class="hint">Aucun sortilège offensif jouable.</p>`;
    return `<div class="spells">` + list.map(([s, i]) => `<button data-a="spell" data-i="${i}" class="spell ${kind}">${icon(spellIcon(s))}<span><b>${E(s)}</b><small>${E(SF.SPELLS[s].text)}</small></span></button>`).join("") + `</div>`;
  }
  function spellTargeting() {
    const name = S.spells[UI.spell];
    const cancel = `<button data-a="spellCancel">Annuler</button>`;
    const crs = list => `<div class="choices">${list.map(c => `<button data-a="spellArg" data-v="${c.id}">${E(c.name)} · ${c.hp} PV · ${posTxt(c)}</button>`).join("")}${cancel}</div>`;
    const lanes = `<div class="choices">${SF.LANES.map(l => `<button data-a="spellArg" data-v="${l}">Lane ${SF.LANE_NAME[l]}</button>`).join("")}${cancel}</div>`;
    let inner = "";
    switch (name) {
      case "Frappe orbitale": case "Salve": inner = crs(S.creatures.filter(c => SF.targetable(S, c))); break;
      case "Brouillage": inner = crs(S.creatures.filter(c => c.new)); break;
      case "Barrage": case "Champ de stase": inner = lanes; break;
      case "Onde de choc": inner = `<div class="choices">${[1, 2, 3].map(r => `<button data-a="spellArg" data-v="${r}">Couronne ${r}</button>`).join("")}${cancel}</div>`; break;
      case "Réparation": {
        const dmg = Object.keys(S.tiles).filter(k => S.tiles[k].hp < S.tiles[k].max);
        inner = `<p class="hint">Points posés : ${UI.picks.length} / 3.</p><div class="choices">` +
          dmg.map(k => `<button data-a="pick" data-k="${k}">+1 · ${E(tileLabel(k))} (${S.tiles[k].hp + UI.picks.filter(p => p === k).length}/${S.tiles[k].max})</button>`).join("") +
          `<button data-a="spellArg" data-v="picks" class="primary"${UI.picks.length ? "" : " disabled"}>Valider</button>${cancel}</div>`;
        break;
      }
      case "Renouvellement":
        inner = `<p class="hint">Choisissez les tuiles à défausser.</p><div class="choices">` +
          S.hand.map((t, i) => `<button data-a="pickHand" data-i="${i}" class="${UI.picks.includes(i) ? "on" : ""}">${E(t)}</button>`).join("") +
          `<button data-a="spellArg" data-v="picks" class="primary">Défausser et repiocher</button>${cancel}</div>`;
        break;
      case "Reconversion":
        inner = UI.recoHand === null
          ? `<p class="hint">Choisissez la tuile de votre main.</p><div class="choices">${S.hand.map((t, i) => `<button data-a="recoHand" data-i="${i}">${E(t)}</button>`).join("")}${cancel}</div>`
          : `<p class="hint">Elle remplace quelle tuile construite ?</p><div class="choices">${Object.keys(S.tiles).filter(k => S.tiles[k].name !== "Mur de départ").map(k => `<button data-a="spellArg" data-v="${k}">${E(tileLabel(k))}</button>`).join("")}${cancel}</div>`;
        break;
      default: inner = `<div class="choices"><button data-a="spellArg" data-v="go" class="primary">Jouer ${E(name)}</button>${cancel}</div>`;
    }
    return `<div class="targeting"><p class="hint"><b>${E(name)}</b> : ${E(SF.SPELLS[name].text)}</p>${inner}</div>`;
  }
  const spellIcon = s => ({ "Frappe orbitale": "frappe", "Salve": "salve", "Barrage": "lane", "Onde de choc": "couronne", "Champ de stase": "stase", "Famine": "famine", "Brouillage": "brouillage", "Effort": "effort", "Cadence": "cadence", "Réparation": "reparation", "Renouvellement": "renouvellement", "Reconversion": "reconversion" }[s]);
  const capIcon = c => ({ vision: "vision", soin: "soin", fureur: "fureur", leurre: "leurre", percee: "percee", instinct: "instinct", sabotage: "sabotage", spores: "spores" }[c] || "aura");
  const cardOf = uid => S.handA.find(c => c.uid === uid) || { name: "?" };
  function posTxt(c) { return c.k === 4 ? `entrée ${SF.LANE_NAME[c.lane]} ${SF.COLS[c.u + 2]}` : `${SF.LANE_NAME[c.lane]} ${SF.COLS[c.u + 2]}${c.k}`; }
  function tileLabel(k) {
    const [x, y] = SF.parse(k), l = SF.cellLane(x, y), [u, r] = SF.toLocal(l, x, y);
    return `${S.tiles[k] ? (hiddenTrap(S.tiles[k]) ? "Tuile camouflée" : S.tiles[k].name) : "case"} · ${SF.LANE_NAME[l]} ${SF.COLS[u + 2]}${r}`;
  }

  // ---------------------------------------------------------------- plateau
  function hiddenTrap(t) { return t.camo && !t.revealed && S.view === "essaim" && !SF.clairvoyance(S); }
  function board() {
    const canDeployHere = (lane, u) => S.phase === "A_deploy" && S.view === "essaim" && UI.sel && SF.canDeploy(S, cardOf(UI.sel), lane);
    const placeHot = S.phase === "D_place" && S.view === "colonie" ? SF.placeTargets(S) : [];
    let html = "";
    for (let y = 4; y >= -4; y--) for (let x = -4; x <= 4; x++) {
      const r = SF.ring(x, y), k = SF.key(x, y);
      if (r === 4) { // entrées
        const lane = SF.cellLane(x, y);
        if (!lane) { html += `<div class="cell void"></div>`; continue; }
        const [u] = SF.toLocal(lane, x, y);
        if (Math.abs(u) > 2) { html += `<div class="cell void"></div>`; continue; }
        const crs = S.creatures.filter(c => c.lane === lane && c.k === 4 && c.u === u);
        const hot = canDeployHere(lane, u);
        html += `<div class="cell entry lane-${lane}${hot ? " hot" : ""}" ${hot ? `data-a="deployAt" data-l="${lane}" data-u="${u}"` : ""}><span class="col">${SF.COLS[u + 2]}</span>${tokens(crs)}</div>`;
        continue;
      }
      if (x === 0 && y === 0) {
        html += `<div class="cell core">${icon("fusee")}<b>${S.floors}/12</b><small>${S.workersBase} trav.</small></div>`;
        continue;
      }
      if (SF.isSupportCell(x, y)) {
        const lvl = S.supports[k];
        const ready = S.phase === "D_fire" && S.view === "colonie" && lvl && lvl < 3 && !S.firedSupports.includes(k) && SF.supportTargets(S, k).length;
        const fired = S.firedSupports.includes(k);
        html += lvl ? `<div class="cell sup${ready ? " hot" : ""}${UI.support === k ? " sel" : ""}${fired ? " spent" : ""}" ${ready ? `data-a="support" data-k="${k}"` : ""}>
            <span class="lv">${["", "I", "II", "III"][lvl]}</span>${lvl < 3 ? icon("tourelle") + `<b>${SF.turretDmg(S, lvl)}</b>` : icon("travailleur") + "<b>+2</b>"}</div>`
          : `<div class="cell corner"><span class="lv">${["", "I", "II", "III"][r]}</span></div>`;
        continue;
      }
      const lane = SF.cellLane(x, y);
      const t = S.tiles[k];
      const crs = S.creatures.filter(c => c.k < 4 && SF.posKey(c) === k);
      const target = placeHot.includes(k);
      let inner = "";
      if (t) {
        if (hiddenTrap(t)) inner = `<div class="tile hidden"><b>?</b><small>camouflée</small></div>`;
        else {
          const ep = SF.epinesOf(S, k);
          inner = `<div class="tile${t.camo && !t.revealed ? " trap" : ""}" title="${t.camo && !t.revealed ? "Camouflée : l'essaim ne la voit pas" : ""}"><span class="tn">${E(short(t.name))}</span><b class="hp">${t.hp}<small>/${t.max}</small></b>
            <span class="tb">${icon("epines")}${ep}${t.ren ? icon("renforce") + t.ren : ""}${t.tech ? icon("tech") + t.tech : ""}${t.temp ? icon("temp") : ""}</span></div>`;
        }
      }
      const stased = S.stase.includes(lane);
      html += `<div class="cell lane lane-${lane} r${r}${target ? " hot" : ""}${stased ? " stase" : ""}" ${target ? `data-a="placeAt" data-k="${k}"` : ""}>${inner}${tokens(crs)}</div>`;
    }
    return `<div class="board" role="grid" aria-label="Plateau">${html}</div>
      <div class="legend"><span><i class="sw lane-N"></i>Nord</span><span><i class="sw lane-E"></i>Est</span><span><i class="sw lane-S"></i>Sud</span><span><i class="sw lane-O"></i>Ouest</span><span>Lettres : colonnes d'entrée</span></div>`;
  }
  // Carte de tuile en main : durée, PV, Épines et capacités (libellés du Catalogue du livret v0.3)
  function tileCard(name) {
    const t = SF.TILES[name], L = SF.LANE_NAME;
    const pv = t.pv === "ap" ? `2 (4 en lane ${L[t.dir]})` : t.pv === "front" ? "2 à 4" : t.pv === "reduit" ? "2 à 4" : t.pv;
    const caps = [];
    const cap = (ic, n, txt) => caps.push(`<span class="capline">${icon(ic)}<span><b>${E(n)}</b> : ${E(txt)}</span></span>`);
    if (t.pv === "ap") cap("cardinal", "Avant-poste", `+2 PV si posé dans la lane ${L[t.dir]} (4 PV), sinon 2 PV.`);
    if (t.pv === "front") cap("couronne", "Ligne de front", "PV = 1 + couronne (2 / 3 / 4) : plus solide loin de la fusée.");
    if (t.pv === "reduit") cap("couronne", "Réduit", "PV = 5 − couronne (4 / 3 / 2) : plus solide près de la fusée.");
    if (t.ren) cap("renforce", `Renforcé ${t.ren}`, `ne perd 1 PV que par tranche complète de ${t.ren} dégâts d'une même attaque.`);
    if (t.tech) cap("tech", `+${t.tech} technologie${t.tech > 1 ? "s" : ""}`, "compte dans votre total de technologies tant que la tuile tient.");
    if (t.temp) cap("temp", "Travailleur temporaire", "+1 travailleur tant que la tuile tient.");
    if (t.perm) cap("perm", "Travailleur permanent", "+1 travailleur gagné à la construction, conservé même si la tuile tombe.");
    if (t.camo) cap("piege", "Camouflage", "posée face cachée : l'essaim ne la voit pas. Retournée à la première attaque ou par Vision / Clairvoyance.");
    if (t.trap) cap("piege", "Piège", "2 dégâts à la créature qui le révèle en l'attaquant. Un piège rendu visible par Vision ou Clairvoyance ne se déclenche plus.");
    cap("epines", `Épines ${t.ep}`, `${t.ep} dégât${t.ep > 1 ? "s" : ""} à la créature qui l'attaque, après son attaque (+1 si la tuile touche un support de niveau 2).`);
    return `<b>${E(name)}</b><small>${icon("duree")} ${t.d} point${t.d > 1 ? "s" : ""} de construction</small>
      <span class="stats">${icon("pv")} ${pv} PV · ${icon("epines")} Épines ${t.ep}</span>${caps.join("")}`;
  }
  const short = n => ({ "Mur de départ": "Départ", "Haie d'épines": "Haie", "Mur hérissé": "Hérissé", "Avant-poste du Nord": "Av.-poste N", "Avant-poste de l'Est": "Av.-poste E", "Avant-poste du Sud": "Av.-poste S", "Avant-poste de l'Ouest": "Av.-poste O", "Ligne de front": "Front", "Observatoire": "Observ.", "Laboratoire": "Labo", "Baraquement": "Baraq." }[n] || n);
  function tokens(crs) {
    if (!crs.length) return "";
    return `<div class="toks">` + crs.map(c => {
      const t = SF.CREATURES[c.name].type;
      const cls = `tok ${t}${UI.selCreature === c.id ? " sel" : ""}${c.acted && S.phase === "A_attack" ? " done" : ""}${c.new ? " new" : ""}`;
      return `<button class="${cls}" data-a="creature" data-id="${c.id}" title="${E(c.name)}"><span>${SF.effAtq(S, c)}</span><span>${c.hp + SF.bonusHp(S, c)}</span></button>`;
    }).join("") + `</div>`;
  }
  function detail() {
    const c = S.creatures.find(o => o.id === UI.selCreature);
    if (!c) return `<p class="detail empty">Touchez une créature pour voir sa carte.</p>`;
    const b = SF.CREATURES[c.name];
    const extras = [];
    if (SF.hasMobility(S, c)) extras.push("Mobilité");
    if (SF.isStealthy(S, c)) extras.push("Furtivité");
    if (SF.caseMates(S, c).some(o => o.name === "Perforeur")) extras.push("Percée");
    let actions = "";
    if (S.view === "essaim" && c.name === "Catalyseur" && ["A_deploy", "A_upgrade"].includes(S.phase)) {
      const mates = SF.caseMates(S, c);
      actions += `<div class="choices"><span class="lab">Instinct :</span>` +
        ["mobilite", "furtivite"].map(v => `<button data-a="instinct" data-id="${c.id}" data-v="${v}" class="${c.instinct === v ? "on" : ""}">${v === "mobilite" ? "Mobilité" : "Furtivité"}</button>`).join("") +
        mates.map(m => `<button data-a="instTarget" data-id="${c.id}" data-v="${m.id}" class="${c.instinctTarget === m.id ? "on" : ""}">→ ${E(m.name)}</button>`).join("") + `</div>`;
    }
    if (S.view === "essaim" && S.phase === "A_upgrade" && b.type === "aggro" && S.upgrades.aggro.r2 === "B" && !S.raidUsed) {
      const i = SF.LANES.indexOf(c.lane);
      actions += `<div class="choices"><span class="lab">Raid :</span>${[SF.LANES[(i + 1) % 4], SF.LANES[(i + 3) % 4]].map(l => `<button data-a="raid" data-id="${c.id}" data-v="${l}">Vers ${SF.LANE_NAME[l]}</button>`).join("")}</div>`;
    }
    return `<section class="detail ${b.type}"><div class="d-head">${icon(b.type)}<b>${E(c.name)}</b><span>${b.type} · niveau ${["", "I", "II", "III"][b.lvl]}</span></div>
      <p>${icon("atq")} ATQ ${SF.effAtq(S, c)}${SF.attacks(c) ? "" : " (n'attaque pas : avance avec l'essaim)"} · ${icon("pv")} PV ${c.hp + SF.bonusHp(S, c)}/${SF.maxHp(S, c.name)} · ${posTxt(c)}</p>
      ${b.cap ? `<p class="capline">${icon(capIcon(b.cap))}<span><b>${E(b.capName)}</b> : ${E(b.capText)}</span></p>` : ""}${extras.length ? `<p>Gagne : ${extras.join(", ")}.</p>` : ""}${actions}</section>`;
  }

  // ---------------------------------------------------------------- panneaux
  function colonyPanel() {
    const mine = S.view === "colonie";
    const pts = SF.totalPoints(S), used = SF.allocated(S);
    const floors = Array.from({ length: 12 }, (_, i) => `<i class="fl${i < S.floors ? " on" : ""}${[2, 5, 8, 11].includes(i) ? " ms" : ""}">${i + 1}</i>`).join("");
    let ateliers = "";
    for (const l of SF.LANES) {
      const chs = S.chantiers[l];
      const slots = Array.from({ length: S.chPerLane }, (_, i) => {
        const ch = chs[i];
        if (!ch) return mine && S.phase === "D_main" && UI.sel !== null && UI.spell === null && chs.length < S.chPerLane
          ? `<button data-a="startCh" data-l="${l}" class="slot empty go">Construire ici : ${E(S.hand[UI.sel])}</button>` : `<div class="slot empty">libre</div>`;
        const hide = SF.TILES[ch.tile].camo && !mine;
        return `<div class="slot">${E(hide ? "?" : ch.tile)} · ${ch.left} pt${ch.left > 1 ? "s" : ""}${mine && ch.fresh && S.phase === "D_main" ? ` <button data-a="cancelCh" data-l="${l}" data-i="${i}" class="x" aria-label="Annuler">×</button>` : ""}</div>`;
      }).join("");
      const step = mine && S.phase === "D_main" ? `<span class="step"><button data-a="alloc" data-l="${l}" data-d="-1" aria-label="Retirer un point">−</button><b>${S.alloc[l]}</b><button data-a="alloc" data-l="${l}" data-d="1" aria-label="Ajouter un point">+</button></span>` : `<b class="pts">${S.alloc[l]}</b>`;
      ateliers += `<div class="atelier lane-${l}"><span class="al">${l}</span><div class="slots">${slots}</div>${step}</div>`;
    }
    const hand = mine
      ? `<div class="hand">${S.hand.map((t, i) => `<button data-a="tile" data-i="${i}" class="tcard${UI.sel === i ? " sel" : ""}"${S.phase === "D_main" ? "" : " disabled"}>${tileCard(t)}</button>`).join("")}</div>`
      : `<p class="hidden-hand">${S.hand.length} tuiles en main (cachées)</p>`;
    const spells = mine ? (S.spells.length ? S.spells.map(s => `<span class="chip ${SF.SPELLS[s].kind}">${E(s)}</span>`).join("") : `<span class="muted">aucun</span>`) : `<span class="muted">${S.spells.length} en main (cachés)</span>`;
    return `<h3>${icon("fusee")} Colonie</h3>
      <div class="kv"><span>Travailleurs</span><b>${S.workersBase}${SF.bonusWorkers(S) ? ` + ${SF.bonusWorkers(S)}` : ""}</b></div>
      <div class="kv"><span>Technologies</span><b>${SF.tech(S)} → ${SF.spellsPerTurn(S)} sort./tour</b></div>
      <div class="floors">${floors}</div><p class="small">Fusée : ${S.floors}/12 étages · ${S.rocketPts}/3 points vers le suivant. Paliers 3 · 6 · 9.</p>
      <h4>Ateliers ${mine && S.phase === "D_main" ? `<span class="small">points ${used}/${pts} · fusée ${pts - used}</span>` : ""}</h4>${ateliers}
      <h4>Main de tuiles</h4>${hand}<h4>Sortilèges</h4><div class="chips">${spells}</div>`;
  }
  function swarmPanel() {
    const mine = S.view === "essaim";
    const t = SF.TIERS[SF.tier(S)];
    const acquired = ty => { // améliorations acquises pour ce type
      const u = S.upgrades[ty], out = [];
      if (u.r1) out.push(SF.TREES[ty][u.r1 + "1"]);
      if (u.r2) out.push(SF.TREES[ty][u.r2 + "2"]);
      return out;
    };
    const hand = mine
      ? (S.handA.length ? `<div class="hand">${S.handA.map(c => {
        const b = SF.CREATURES[c.name];
        const atq = SF.baseAtq(S, c.name), pv = SF.maxHp(S, c.name);
        const ups = acquired(b.type).map(([n, txt]) => `<span class="upline">${icon("palier")}<span><b>${E(n)}</b> : ${E(txt)}</span></span>`).join("");
        return `<button data-a="card" data-uid="${c.uid}" class="ccard ${b.type}${UI.sel === c.uid ? " sel" : ""}"${S.phase === "A_deploy" ? "" : " disabled"}><span class="cost">${c.free ? "0" : b.cost}</span>
          <b>${E(c.name)}</b><small>${b.type} · niveau ${b.lvl}${c.free ? " · gratuit" : ""}</small>
          <span class="stats">${b.type === "soutien" ? `${icon("atq")} 0 ATQ <em>(n'attaque pas)</em>` : `${icon("atq")} ${atq} ATQ${atq !== b.atq ? ` <em>(base ${b.atq})</em>` : ""}`} · ${icon("pv")} ${pv} PV${pv !== b.pv ? ` <em>(base ${b.pv})</em>` : ""}</span>
          ${b.cap ? `<span class="capline">${icon(capIcon(b.cap))}<span><b>${E(b.capName)}</b> : ${E(b.capText)}</span></span>` : `<span class="capline none">Aucune capacité propre.</span>`}${ups}</button>`;
      }).join("")}</div>` : `<p class="muted">Pas de cartes en main.</p>`)
      : `<p class="hidden-hand">${S.handA.length} cartes en main (cachées)</p>`;
    let trees = "";
    const POS = { A1: "Côté A", B1: "Côté B", A2: "Après A", C2: "Centre", B2: "Après B" };
    for (const ty of ["aggro", "tank", "soutien"]) {
      const u = S.upgrades[ty], T = SF.TREES[ty];
      const node = slot => {
        const st = SF.nodeState(S, ty, slot), cost = SF.nodeCost(slot), got = SF.invested(S, ty, slot);
        const avail = SF.investable(S);
        const canInv = mine && st === "open" && avail > 0 && ["A_deploy", "A_upgrade"].includes(S.phase);
        let state, cls = st;
        if (st === "taken") state = "Acquis";
        else if (st === "closed") state = got ? "Fermé" : (u.r1 && !slot.endsWith("1") && slot !== "C2" && u.r1 !== slot[0] ? `Fermé : demande ${T[slot[0] + "1"][0]}` : "Fermé : biomasse déjà engagée sur l'autre choix de ce rang");
        else if (st === "needR1") state = "Demande d'abord un rang 1";
        else state = `${got} / ${cost} investis`;
        const bar = st === "open" || got ? `<span class="bar"><i style="width:${Math.round(100 * got / cost)}%"></i></span>` : "";
        const btns = canInv ? `<span class="inv"><button data-a="invest" data-t="${ty}" data-s="${slot}" data-n="1">+1</button><button data-a="invest" data-t="${ty}" data-s="${slot}" data-n="99">Tout investir (${Math.min(avail, cost - got)})</button></span>` : "";
        return `<div class="node ${cls}${canInv ? " can" : ""}"><span class="np">${POS[slot]}</span><b>${E(T[slot][0])}</b><span class="nt">${E(T[slot][1])}</span>${bar}<span class="ns">${E(state)}</span>${btns}</div>`;
      };
      trees += `<div class="tree ${ty}"><span class="tt">${icon(ty)}${ty}</span>
        <span class="rk">Rang 1 · ${SF.COST_R1} biomasse · 1 choix sur 2 · ajoute les cartes de niveau 2</span><div class="r">${node("A1")}${node("B1")}</div>
        <span class="rk">Rang 2 · ${SF.COST_R2} biomasse · 1 choix sur 3 · ajoute les cartes de niveau 3</span><div class="r r3">${node("A2")}${node("C2")}${node("B2")}</div></div>`;
    }
    return `<h3>${icon("spores")} Essaim</h3>
      <div class="kv"><span>Biomasse</span><b>${S.biomass}</b></div>
      <div class="kv"><span>Palier</span><b>${SF.tier(S) + 1} · pioche ${t.n.join("/")} · plafond ${t.cap}</b></div>
      <div class="kv"><span>Budget du tour</span><b>${S.budget}${S.famine ? ` (Famine −${S.famine})` : ""}</b></div>
      <div class="kv"><span>Réserve (non investie)</span><b>${S.reserve}</b></div>
      <div class="kv"><span>Pioches N1 / N2 / N3</span><b>${S.piles[1].length} / ${S.piles[2].length} / ${S.piles[3].length}</b></div>
      <h4>Main</h4>${hand}<h4>Arbres d'amélioration</h4>${trees}`;
  }
  function logPanel() {
    return `<h4>Journal</h4><ol class="log">${S.log.slice(0, 40).map(l => `<li class="${l.who}"><span>M${l.r}</span>${E(l.msg)}</li>`).join("")}</ol>`;
  }
  function help() {
    return `<div class="modal" role="dialog" aria-label="Règles"><div class="modal-card"><button data-a="help" class="x close" aria-label="Fermer">×</button>
      <h2>Règles en bref</h2>
      <p><b>But.</b> La colonie gagne quand le 12ᵉ étage de la fusée est achevé. L'essaim gagne quand la colonie n'a plus de travailleurs.</p>
      <p><b>Essaim.</b> Budget = biomasse. Piochez selon le palier (3 · 4 · 7 · 10 · 13 de biomasse), déployez sur une case d'entrée en respectant le plafond par lane (1 / 2 / 3 / 4 / 5 selon le palier), ou investissez dans un nœud d'amélioration (rang 1 : 8, rang 2 : 16, payable en plusieurs fois) ; le reste va à la réserve. Puis chaque créature se déplace case par case, sans diagonale, et attaque la première tuile ou la fusée (une attaque contre la fusée tue un seul travailleur). Les soutiens avancent aussi mais n'attaquent jamais. +1 biomasse par tuile détruite.</p>
      <p><b>Colonie.</b> Lancez une tuile par chantier libre : le chantier appartient à une lane. Quand il est achevé, posez le bâtiment sur une case de cette lane qui touche une tuile, un support ou la fusée ; les créatures présentes reculent d'une case vers le fond. Répartissez vos travailleurs : les points d'une lane avancent son chantier, le reste va à la fusée (3 points par étage, +1 travailleur par étage ; étage 3 : +2 technologies, 6 : 2ᵉ chantier, 9 : nuke).</p>
      <p><b>Combat.</b> Toute forteresse a Épines 1. Renforcé X : 1 PV perdu par tranche de X dégâts. Les auras ne touchent que les créatures de la même case. Les supports tirent en fin de tour de la colonie sur une créature des 8 cases qui les entourent (I : 1 dégât, +1 aux étages 3, 6 et 9 ; II : 2) et tombent quand tous leurs murs voisins ont disparu.</p>
      <p><b>Écrans de passage.</b> À chaque changement de camp, passez l'appareil : chaque joueur ne voit que sa main.</p></div></div>`;
  }

  // ---------------------------------------------------------------- actions
  function handle(a, d) {
    if (a === "new") { if (!S || S.winner || confirmNew()) { clearSave(); newGame(); } return; }
    if (a === "help") { UI.help = !UI.help; render(); return; }
    if (a === "reveal") { S.view = S.handoff; S.handoff = null; save(); render(); return; }
    if (S.winner) return;
    switch (a) {
      case "famine":
        S.phase = "A_start";
        if (d.v === "1") { const i = S.spells.indexOf("Famine"); if (i >= 0) SF.useSpell(S, i, null); }
        break;
      case "draw": SF.attackerDraw(S); break;
      case "card": UI.sel = UI.sel === Number(d.uid) ? null : Number(d.uid); break;
      case "deployAt": if (UI.sel && SF.deploy(S, UI.sel, d.l, Number(d.u))) UI.sel = null; break;
      case "endDeploy": SF.endDeploy(S); UI.sel = null; break;
      case "buy": SF.buy(S, d.t, d.s); break;
      case "invest": SF.invest(S, d.t, d.s, Number(d.n)); break;
      case "raid": SF.raid(S, Number(d.id), d.v); break;
      case "instinct": { const c = S.creatures.find(o => o.id === Number(d.id)); if (c) c.instinct = d.v; break; }
      case "instTarget": { const c = S.creatures.find(o => o.id === Number(d.id)); if (c) c.instinctTarget = Number(d.v); break; }
      case "toAttacks":
        SF.startAttacks(S);
        if (S.spells.some(s => SF.SPELLS[s].kind === "off" && s !== "Famine")) S.phase = "A_react";
        break;
      case "reactDone": S.phase = "A_attack"; UI.spell = null; break;
      case "creature": UI.selCreature = Number(d.id); break;
      case "act": {
        const c = S.creatures.find(o => o.id === Number(d.id));
        if (!c) break;
        if (SF.hasMobility(S, c) && SF.laneTiles(S, c.lane).length > 1) { UI.mob = c.id; break; }
        SF.act(S, c); break;
      }
      case "mobTarget": { const c = S.creatures.find(o => o.id === UI.mob); UI.mob = null; if (c) SF.act(S, c, d.k || null); break; }
      case "actAll": for (const c of SF.attackOrder(S)) { if (S.winner) break; if (S.creatures.includes(c)) SF.act(S, c); } break;
      case "endA":
        SF.endAttackerTurn(S); break;
      case "tile": UI.sel = UI.sel === Number(d.i) ? null : Number(d.i); break;
      case "startCh": if (UI.sel !== null && SF.startChantier(S, UI.sel, d.l)) UI.sel = null; break;
      case "placeAt": SF.placeTile(S, d.k); break;
      case "cancelCh": SF.cancelChantier(S, d.l, Number(d.i)); break;
      case "alloc": {
        const v = S.alloc[d.l] + Number(d.d);
        if (v >= 0 && SF.allocated(S) + Number(d.d) <= SF.totalPoints(S)) S.alloc[d.l] = v; break;
      }
      case "spell": UI.spell = Number(d.i); UI.picks = []; UI.recoHand = null; break;
      case "spellCancel": UI.spell = null; UI.picks = []; UI.recoHand = null; break;
      case "pick": if (UI.picks.length < 3) UI.picks.push(d.k); break;
      case "pickHand": { const i = Number(d.i); UI.picks = UI.picks.includes(i) ? UI.picks.filter(p => p !== i) : [...UI.picks, i]; break; }
      case "recoHand": UI.recoHand = Number(d.i); break;
      case "spellArg": {
        const name = S.spells[UI.spell];
        let arg = d.v;
        if (["Frappe orbitale", "Salve", "Brouillage"].includes(name)) arg = Number(d.v);
        if (d.v === "picks") arg = UI.picks;
        if (name === "Reconversion") arg = { hand: UI.recoHand, tile: d.v };
        if (d.v === "go") arg = null;
        SF.useSpell(S, UI.spell, arg);
        UI.spell = null; UI.picks = []; UI.recoHand = null; break;
      }
      case "toFire": S.phase = "D_fire"; UI.sel = null; UI.spell = null; break;
      case "support": UI.support = UI.support === d.k ? null : d.k; break;
      case "fireAt": if (UI.support) { SF.fire(S, UI.support, Number(d.id)); UI.support = null; } break;
      case "autoFire": SF.autoFire(S); UI.support = null; break;
      case "endD":
        SF.endDefenderTurn(S);
        if (!S.winner && S.spells.includes("Famine")) S.phase = "A_famine";
        break;
    }
    if (!S.winner) setPhaseHandoff();
    save(); render();
  }
  function confirmNew() { return UI.confirm ? true : (UI.confirm = true, setTimeout(() => { UI.confirm = false; }, 4000), flash("Touchez encore « Nouvelle partie » pour confirmer."), false); }
  function flash(msg) { const f = $("#flash"); f.textContent = msg; f.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => { f.hidden = true; }, 3500); }

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-a]");
    if (!el || el.disabled) return;
    handle(el.dataset.a, el.dataset);
  });
  // démarrage : reprendre la partie sauvegardée si elle existe
  const saved = load();
  if (saved && saved.phase) { S = saved; S.invest = S.invest || {}; S.toPlace = S.toPlace || []; for (const t of Object.values(S.tiles || {})) if (SF.TILES[t.name] && SF.TILES[t.name].camo && t.camo === undefined) t.camo = 1; render(); } else newGame();
})();
