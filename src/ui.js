// Swarm & Steel — interface : 2 joueurs sur le même écran (local) ou sur deux appareils (en ligne)
"use strict";
(() => {
  const $ = s => document.querySelector(s);
  const E = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const icon = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;
  const SAVE = "swarm-steel-v03";
  const NET_KEY = "swarm-steel-en-ligne";
  // reprise des sauvegardes faites sous l'ancien nom du jeu (Siège & Fusée)
  try {
    for (const [o, n] of [["siege-fusee-v03", SAVE], ["siege-fusee-en-ligne", NET_KEY]]) {
      const v = localStorage.getItem(o);
      if (v !== null && localStorage.getItem(n) === null) localStorage.setItem(n, v);
      localStorage.removeItem(o);
    }
  } catch (e) { /* stockage indisponible */ }
  let S = null;
  let MODE = "home"; // "home" (accueil), "local" (même appareil) ou "online"
  // session en ligne : code de la partie, jeton du joueur (conservé pour la reconnexion), camp, version de l'état
  let NET = null;
  let busy = false;
  let UI = { sel: null, selCreature: null, spell: null, picks: [], support: null, blk: null, ord: [], help: false, recoHand: null };

  const PHASE_TXT = {
    A_famine: ["colonie", "Début du tour de l'essaim", "La colonie peut jouer Famine avant que l'essaim calcule son budget."],
    A_start: ["essaim", "Tour de l'essaim", "Piochez vos cartes selon votre palier."],
    A_deploy: ["essaim", "Déploiement", "Choisissez une carte, puis une case d'entrée (bord du plateau) dans une lane. Vous pouvez aussi investir votre budget dans une amélioration (panneau Essaim). Le budget non dépensé ira à la réserve."],
    A_upgrade: ["essaim", "Améliorations", "Investissez votre réserve dans une amélioration (panneau Essaim), puis passez aux attaques."],
    A_react: ["colonie", "Réaction de la colonie", "Avant les attaques, la colonie peut jouer ses sortilèges offensifs."],
    A_attack: ["essaim", "Attaques", "Chaque case avance d'un bloc puis ses créatures attaquent, dans l'ordre de votre choix ; les cases les plus proches de la fusée d'abord."],
    D_main: ["colonie", "Tour de la colonie", "Sortilèges de soutien, chantiers, puis répartition des travailleurs. Ensuite : construction et fusée, puis tirs des tourelles."],
    D_fire: ["colonie", "Tirs des supports", "Construction et fusée faites : les nouveaux supports et les paliers atteints comptent. Choisissez une tourelle puis sa cible (une créature sur l'une des 8 cases qui l'entourent), ou laissez les tirs automatiques."],
    D_place: ["colonie", "Pose des bâtiments", "Un chantier est achevé : choisissez la case de sa lane où poser le bâtiment. Les créatures présentes reculent d'une case."],
  };
  const who = () => SF.actor(S) || "essaim";
  const online = () => MODE === "online";
  const myTurn = () => online() && NET.full && !S.winner && SF.actor(S) === NET.side;
  const SIDE = { essaim: "l'essaim", colonie: "la colonie" };

  // ---------------------------------------------------------------- sauvegarde
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } }
  function load() { try { const t = localStorage.getItem(SAVE); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
  function clearSave() { try { localStorage.removeItem(SAVE); } catch (e) { /* rien */ } }

  function newGame() { MODE = "local"; S = SF.newGame(); S.handoff = "essaim"; S.view = null; UI = resetUI(); save(); render(); }
  const resetUI = () => ({ sel: null, selCreature: null, spell: null, picks: [], support: null, blk: null, ord: [], help: false, recoHand: null });
  function setPhaseHandoff() { // passe la main si le joueur actif change
    const w = who();
    if (S.view !== w) { S.handoff = w; UI = { ...resetUI(), help: UI.help }; }
  }

  // ---------------------------------------------------------------- rendu
  function render() {
    document.body.dataset.myturn = online() && S && myTurn() ? "1" : "0";
    if (MODE === "home" || !S) { document.body.dataset.view = ""; $("#app").innerHTML = homeHeader() + home() + (UI.help ? help() : ""); return; }
    document.body.dataset.view = S.view || "";
    const main = online() && !NET.full ? waitingRoom() : S.handoff ? handoff() : S.winner ? winner() + layout() : layout();
    $("#app").innerHTML = header() + main + (UI.help ? help() : "");
  }
  function header() {
    const p = PHASE_TXT[S.phase] || ["", "", ""];
    const menu = online()
      ? `<span class="code-chip" data-code="${E(NET.code)}">Partie <b>${E(NET.code)}</b> · ${E(SIDE[NET.side])}</span><button data-a="help" class="ghost">Règles</button><button data-a="quit" class="ghost">Quitter</button>`
      : `<button data-a="help" class="ghost">Règles</button><button data-a="home" class="ghost">Menu</button><button data-a="new" class="ghost">Nouvelle partie</button>`;
    const animBtn = `<button data-a="anim" class="ghost" aria-pressed="${animOn}">Animations : ${animOn ? "oui" : "non"}</button>`;
    return `<header class="top"><div class="brand">${icon("fusee")}<b>Swarm &amp; Steel</b><span>prototype v0.3</span></div>
      <div class="round">Manche <b>${S.round}</b><span class="dot ${p[0]}"></span>${E(p[1])}</div>
      <div class="menu">${animBtn}${menu}</div></header>`;
  }
  function homeHeader() {
    return `<header class="top"><div class="brand">${icon("fusee")}<b>Swarm &amp; Steel</b><span>prototype v0.3</span></div>
      <div class="menu"><button data-a="help" class="ghost">Règles</button></div></header>`;
  }
  // ---------------------------------------------------------------- accueil et salle d'attente (jeu en ligne)
  function home() {
    const saved = load();
    const preset = new URLSearchParams(location.search).get("code") || "";
    return `<section class="handoff home"><div class="ho-card">${icon("fusee", "i big")}
      <h2>Swarm &amp; Steel</h2>
      <p class="ho-k">Sur cet appareil</p>
      <div class="home-acts">${saved && saved.phase ? `<button data-a="resume" class="primary">Reprendre la partie locale</button>` : ""}
        <button data-a="local"${saved && saved.phase ? "" : ` class="primary"`}>Nouvelle partie locale</button></div>
      <p class="ho-k">En ligne · créer une partie</p>
      <div class="home-acts"><button data-a="create" data-side="essaim">Je joue l'essaim</button><button data-a="create" data-side="colonie">Je joue la colonie</button></div>
      <p class="ho-k">En ligne · rejoindre</p>
      <div class="home-acts join"><input id="joincode" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Code" aria-label="Code de la partie" value="${E(preset.toUpperCase())}"><button data-a="join" class="primary">Rejoindre</button></div>
    </div></section>`;
  }
  function waitingRoom() {
    const link = location.origin + location.pathname + "?code=" + NET.code;
    return `<section class="handoff ${NET.side}"><div class="ho-card">${icon(NET.side === "essaim" ? "spores" : "fusee", "i big")}
      <p class="ho-k">Vous jouez ${SIDE[NET.side]}</p><h2>Code : <span class="bigcode" data-code="${E(NET.code)}">${E(NET.code)}</span></h2>
      <p>Donnez ce code à votre adversaire, ou envoyez-lui ce lien :</p><p class="link">${E(link)}</p>
      <p>En attente de l'adversaire…</p></div></section>`;
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
    if (online() && !myTurn()) return `<section class="phase ${p[0]} waiting"><div class="ph-head"><span class="dot ${p[0]}"></span><b>${E(p[1])}</b><span class="side">${E(SIDE[p[0]])}</span></div>
      <p class="ph-txt">Au tour de ${E(SIDE[p[0]])} : en attente de votre adversaire…</p></section>`;
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
      const ready = SF.readyCases(S), crOf = k => S.creatures.filter(c => SF.posKey(c) === k && !c.acted);
      const blockTxt = k => { const cs = crOf(k); return `${posTxt(cs[0])} : ${cs.map(c => c.name + (SF.attacks(c) ? "" : " (avance)")).join(", ")}`; };
      if (UI.blk && ready.includes(UI.blk)) { // choix de l'ordre d'attaque dans le bloc
        const att = crOf(UI.blk).filter(SF.attacks);
        body = `<p class="hint">Bloc ${E(blockTxt(UI.blk))}. Touchez les créatures dans l'ordre où elles attaqueront (les autres suivront).</p><div class="choices">` +
          att.map(c => { const n = UI.ord.indexOf(c.id); return `<button data-a="ordPick" data-id="${c.id}" class="${n >= 0 ? "on" : ""}">${n >= 0 ? (n + 1) + ". " : ""}${E(c.name)} · ATQ ${SF.effAtq(S, c)} · ${c.hp + SF.bonusHp(S, c)} PV</button>`; }).join("") + `</div>`;
        acts = `<button data-a="ordGo" class="primary">Attaquer</button><button data-a="ordCancel">Annuler</button>`;
      } else {
        const waiting = [...new Set(S.creatures.filter(c => !c.acted).map(SF.posKey))].filter(k => !ready.includes(k));
        body = ready.length ? `<p class="hint">Chaque case avance d'un bloc ; dans une lane, les cases les plus proches de la fusée agissent d'abord.</p><div class="choices">` + ready.map(k => `<button data-a="act" data-k="${k}">${E(blockTxt(k))}</button>`).join("") + `</div>` +
          (waiting.length ? `<p class="small">En attente : ${waiting.map(k => E(blockTxt(k))).join(" · ")}</p>` : "") : `<p class="hint">Toutes les créatures ont agi.</p>`;
        acts = (ready.length ? `<button data-a="actAll">Tout résoudre (les plus avancées d'abord)</button>` : "") + `<button data-a="endA" class="primary"${ready.length ? " disabled" : ""}>Fin du tour de l'essaim</button>`;
      }
    } else if (ph === "D_main") {
      body = spellBox("sup") + (UI.sel !== null ? `<p class="hint">Tuile choisie : <b>${E(S.hand[UI.sel])}</b>. Choisissez la lane de son chantier : bouton « Construire ici » dans les ateliers (panneau Colonie). La case exacte sera choisie à la fin de la construction.</p>` : "");
      acts = `<button data-a="build" class="primary">Construire, puis passer aux tirs</button>`;
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
      acts = `<button data-a="autoFire">Tirs automatiques</button><button data-a="endD" class="primary">Terminer le tour</button>`;
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
          : `<p class="hint">Elle remplace quelle tuile construite ?</p><div class="choices">${Object.keys(S.tiles).filter(k => !S.tiles[k].start).map(k => `<button data-a="spellArg" data-v="${k}">${E(tileLabel(k))}</button>`).join("")}${cancel}</div>`;
        break;
      default: inner = `<div class="choices"><button data-a="spellArg" data-v="go" class="primary">Jouer ${E(name)}</button>${cancel}</div>`;
    }
    return `<div class="targeting"><p class="hint"><b>${E(name)}</b> : ${E(SF.SPELLS[name].text)}</p>${inner}</div>`;
  }
  // carte de sortilège en main : type, moment où le jouer, effet complet
  function spellCard(s) {
    const sp = SF.SPELLS[s];
    const when = s === "Famine" ? "Offensif · au début du tour de l'essaim, avant qu'il calcule son budget"
      : sp.kind === "off" ? "Offensif · pendant le tour de l'essaim, juste avant ses attaques"
      : "Soutien · pendant votre tour, avant de passer aux tirs";
    return `<div class="spell ${sp.kind} card">${icon(spellIcon(s))}<span><b>${E(s)}</b><small class="when">${E(when)}</small><small>${E(sp.text)}</small><small class="lost">Non joué dans sa fenêtre : défaussé.</small></span></div>`;
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
        html += `<div class="cell entry lane-${lane}${hot ? " hot" : ""}" data-xy="${k}" ${hot ? `data-a="deployAt" data-l="${lane}" data-u="${u}"` : ""}><span class="col">${SF.COLS[u + 2]}</span>${tokens(crs)}</div>`;
        continue;
      }
      if (x === 0 && y === 0) {
        html += `<div class="cell core" data-xy="${k}">${icon("fusee")}<b>${S.floors}/12</b><small>${S.workersBase} trav.</small></div>`;
        continue;
      }
      if (SF.isSupportCell(x, y)) {
        const lvl = S.supports[k];
        const ready = S.phase === "D_fire" && S.view === "colonie" && lvl && lvl < 3 && !S.firedSupports.includes(k) && SF.supportTargets(S, k).length;
        const fired = S.firedSupports.includes(k);
        html += lvl ? `<div class="cell sup${ready ? " hot" : ""}${UI.support === k ? " sel" : ""}${fired ? " spent" : ""}" data-xy="${k}" ${ready ? `data-a="support" data-k="${k}"` : ""}>
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
            <span class="tb">${ep ? icon("epines") + ep : ""}${t.ren ? icon("renforce") + t.ren : ""}${t.tech ? icon("tech") + t.tech : ""}${t.temp ? icon("temp") : ""}</span></div>`;
        }
      }
      const stased = S.stase.includes(lane);
      html += `<div class="cell lane lane-${lane} r${r}${target ? " hot" : ""}${stased ? " stase" : ""}" data-xy="${k}" ${target ? `data-a="placeAt" data-k="${k}"` : ""}>${inner}${tokens(crs)}</div>`;
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
    if (t.ep) cap("epines", `Épines ${t.ep}`, `${t.ep} dégât${t.ep > 1 ? "s" : ""} à la créature qui l'attaque, après son attaque (+1 si la tuile touche un support de niveau 2).`);
    return `<b>${E(name)}</b><small>${icon("duree")} ${t.d} point${t.d > 1 ? "s" : ""} de construction</small>
      <span class="stats">${icon("pv")} ${pv} PV${t.ep ? ` · ${icon("epines")} Épines ${t.ep}` : " · sans Épines"}</span>${caps.join("")}`;
  }
  const short = n => ({ "Haie d'épines": "Haie", "Mur hérissé": "Hérissé", "Avant-poste du Nord": "Av.-poste N", "Avant-poste de l'Est": "Av.-poste E", "Avant-poste du Sud": "Av.-poste S", "Avant-poste de l'Ouest": "Av.-poste O", "Ligne de front": "Front", "Observatoire": "Observ.", "Laboratoire": "Labo", "Baraquement": "Baraq." }[n] || n);
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
    if (S.view === "essaim" && S.phase === "A_upgrade" && SF.hasMobility(S, c) && !c.mobUsed) {
      const i = SF.LANES.indexOf(c.lane);
      actions += `<div class="choices"><span class="lab">Mobilité :</span>${[SF.LANES[(i + 1) % 4], SF.LANES[(i + 3) % 4]].map(l => `<button data-a="moveLane" data-id="${c.id}" data-v="${l}"${SF.laneCount(S, l) >= SF.capOf(S) ? " disabled" : ""}>Vers ${SF.LANE_NAME[l]}</button>`).join("")}</div>`;
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
        const hide = !ch.tile || (SF.TILES[ch.tile].camo && !mine);
        return `<div class="slot">${E(hide ? "?" : ch.tile)} · ${ch.left} pt${ch.left > 1 ? "s" : ""}${mine && ch.fresh && S.phase === "D_main" ? ` <button data-a="cancelCh" data-l="${l}" data-i="${i}" class="x" aria-label="Annuler">×</button>` : ""}</div>`;
      }).join("");
      const step = mine && S.phase === "D_main" ? `<span class="step"><button data-a="alloc" data-l="${l}" data-d="-1" aria-label="Retirer un point">−</button><b>${S.alloc[l]}</b><button data-a="alloc" data-l="${l}" data-d="1" aria-label="Ajouter un point">+</button></span>` : `<b class="pts">${S.alloc[l]}</b>`;
      ateliers += `<div class="atelier lane-${l}"><span class="al">${l}</span><div class="slots">${slots}</div>${step}</div>`;
    }
    const hand = mine
      ? `<div class="hand">${S.hand.map((t, i) => `<button data-a="tile" data-i="${i}" class="tcard${UI.sel === i ? " sel" : ""}"${S.phase === "D_main" ? "" : " disabled"}>${tileCard(t)}</button>`).join("")}</div>`
      : `<p class="hidden-hand">${S.hand.length} tuiles en main (cachées)</p>`;
    const spells = mine ? (S.spells.length ? `<div class="spells">${S.spells.map(s => spellCard(s)).join("")}</div>` : `<span class="muted">aucun</span>`) : `<span class="muted">${S.spells.length} en main (cachés)</span>`;
    return `<h3>${icon("fusee")} Colonie</h3>
      <div class="kv"><span>Travailleurs</span><b>${S.workersBase}${SF.bonusWorkers(S) ? ` + ${SF.bonusWorkers(S)}` : ""}</b></div>
      <div class="kv"><span>Technologies</span><b>${SF.tech(S)} → ${SF.spellsPerTurn(S)} sort./tour</b></div>
      <div class="floors">${floors}</div><p class="small">Fusée : ${S.floors}/12 étages · ${S.rocketPts}/${SF.floorCost(S)} points vers le suivant. Un étage coûte 3 points (étages 1 à 3), puis 4, 5 et 6 après les paliers 3 · 6 · 9.</p>
      <h4 data-fx="ateliers">Ateliers ${mine && S.phase === "D_main" ? `<span class="small">points ${used}/${pts} · fusée ${pts - used}</span>` : ""}</h4>${ateliers}
      <h4 data-fx="tilehand">Main de tuiles</h4>${hand}<h4>Sortilèges</h4>${spells}`;
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
        return `<div class="node ${cls}${canInv ? " can" : ""}" data-node="${ty}:${slot}"><span class="np">${POS[slot]}</span><b>${E(T[slot][0])}</b><span class="nt">${E(T[slot][1])}</span>${bar}<span class="ns">${E(state)}</span>${btns}</div>`;
      };
      trees += `<div class="tree ${ty}"><span class="tt">${icon(ty)}${ty}</span>
        <span class="rk">Rang 1 · ${SF.COST_R1} biomasse · 1 choix sur 2 · ajoute les cartes de niveau 2</span><div class="r">${node("A1")}${node("B1")}</div>
        <span class="rk">Rang 2 · ${SF.COST_R2} biomasse · 1 choix sur 3 · ajoute les cartes de niveau 3</span><div class="r r3">${node("A2")}${node("C2")}${node("B2")}</div></div>`;
    }
    return `<h3>${icon("spores")} Essaim</h3>
      <div class="kv"><span>Biomasse</span><b>${S.biomass}</b></div>
      <div class="kv"><span>Palier</span><b>${SF.tier(S) + 1} · pioche ${t.n.join("/")} · plafond ${SF.capOf(S)}</b></div>
      <div class="kv" data-fx="budget"><span>Budget du tour</span><b>${S.budget}${S.famine ? ` (Famine −${S.famine})` : ""}</b></div>
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
      <p><b>Essaim.</b> Budget = biomasse. Piochez selon le palier (3 · 6 · 9 · 12 · 15 de biomasse), déployez sur une case d'entrée en respectant le plafond par lane (1 / 2 / 3 / 4 / 5 selon le palier, +3 avec Essaim agrandi), ou investissez dans un nœud d'amélioration (rang 1 : 6, rang 2 : 12, payable en plusieurs fois) ; le reste va à la réserve. Puis chaque case avance d'un bloc, case par case, sans diagonale, jusqu'à la première tuile ou la fusée (les plus proches de la fusée d'abord) ; ses créatures attaquent dans l'ordre choisi, et si la tuile tombe, tout le bloc avance jusqu'à la suivante (une attaque contre la fusée tue un seul travailleur). Mobilité : une fois par tour, une aggro peut passer à l'entrée d'une lane voisine. Les soutiens avancent aussi mais n'attaquent jamais. Une tuile détruite rapporte autant de biomasse que sa durée de construction (1, 2 ou 3 ; 1 pour une haie de départ) ; un support qui tombe, 1.</p>
      <p><b>Colonie.</b> Lancez une tuile par chantier libre : le chantier appartient à une lane. Quand il est achevé, posez le bâtiment sur une case de cette lane qui touche une tuile, un support ou la fusée ; les créatures présentes reculent d'une case vers le fond. Répartissez vos travailleurs : les points d'une lane avancent son chantier, le reste va à la fusée (3 points par étage, puis 4, 5 et 6 après les paliers 3, 6 et 9 ; +1 travailleur par étage ; étage 3 : +2 technologies, 6 : 2ᵉ chantier par lane, 9 : nuke ; la main de tuiles gagne +1 à chaque palier : 4, 5, 6 puis 7).</p>
      <p><b>Combat.</b> Seules les Haies d'épines de départ (1 PV, Épines 1), les Haies d'épines construites et le Mur hérissé (Épines 2) ont des Épines : dégâts à la créature qui les attaque (+1 si elles touchent un support de niveau 2). Renforcé X : 1 PV perdu par tranche de X dégâts. Les auras ne touchent que les créatures de la même case. Les supports tirent à la toute fin du tour de la colonie (après la construction, la fusée et l'apparition des nouveaux supports) sur une créature des 8 cases qui les entourent (I : 1 dégât, +1 aux étages 3, 6 et 9 ; II : 2) et tombent quand tous leurs murs voisins ont disparu.</p>
      <p><b>Écrans de passage.</b> En partie locale, à chaque changement de camp, passez l'appareil : chaque joueur ne voit que sa main.</p>
      <p><b>En ligne.</b> Créez une partie et donnez le code (ou le lien) à votre adversaire. Chaque joueur ne reçoit que ce que son camp a le droit de voir. Vous pouvez recharger la page : la partie reprend.</p></div></div>`;
  }

  // ---------------------------------------------------------------- actions
  // Les actions de jeu passent toutes par SF.apply (moteur) : en local directement, en ligne via le serveur.
  function play(type, args, onOk) {
    if (online()) { send(type, args, onOk); return; }
    S.fx = [];
    const refused = SF.apply(S, who(), type, args || {});
    const events = S.fx; delete S.fx;
    if (!refused && onOk) onOk();
    if (!S.winner) setPhaseHandoff();
    save();
    animate(events).then(() => { render(); afterRender(events); });
  }
  function handle(a, d) {
    if (a === "help") { UI.help = !UI.help; render(); return; }
    if (a === "anim") { animOn = !animOn; try { localStorage.setItem(ANIM_KEY, animOn ? "1" : "0"); } catch (e) { /* rien */ } render(); return; }
    if (MODE === "home" || !S) { homeAction(a, d); return; }
    if (a === "home") { if (online()) return; MODE = "home"; render(); return; }
    if (a === "quit") { if (confirmQuit()) { setNet(null); MODE = "home"; S = null; UI = resetUI(); render(); } return; }
    if (a === "new") {
      if (online()) { if (S.winner) send("rematch", {}); return; }
      if (!S || S.winner || confirmNew()) { clearSave(); newGame(); } return;
    }
    if (a === "reveal") { if (online()) return; S.view = S.handoff; S.handoff = null; save(); render(); return; }
    if (S.winner) return;
    switch (a) {
      // choix locaux (sans effet sur la partie)
      case "card": UI.sel = UI.sel === Number(d.uid) ? null : Number(d.uid); break;
      case "creature": UI.selCreature = Number(d.id); break;
      case "tile": UI.sel = UI.sel === Number(d.i) ? null : Number(d.i); break;
      case "spell": UI.spell = Number(d.i); UI.picks = []; UI.recoHand = null; break;
      case "spellCancel": UI.spell = null; UI.picks = []; UI.recoHand = null; break;
      case "pick": if (UI.picks.length < 3) UI.picks.push(d.k); break;
      case "pickHand": { const i = Number(d.i); UI.picks = UI.picks.includes(i) ? UI.picks.filter(p => p !== i) : [...UI.picks, i]; break; }
      case "recoHand": UI.recoHand = Number(d.i); break;
      case "support": UI.support = UI.support === d.k ? null : d.k; break;
      case "act": { // une case (bloc) : choix de l'ordre si au moins 2 créatures attaquent
        const att = S.creatures.filter(c => SF.posKey(c) === d.k && !c.acted && SF.attacks(c));
        if (att.length >= 2) { UI.blk = d.k; UI.ord = []; break; }
        return play("act", { key: d.k });
      }
      case "ordPick": { const id = Number(d.id); UI.ord = UI.ord.includes(id) ? UI.ord.filter(x => x !== id) : [...UI.ord, id]; break; }
      case "ordCancel": UI.blk = null; UI.ord = []; break;
      case "ordGo": { const key = UI.blk, order = UI.ord; UI.blk = null; UI.ord = []; if (key) return play("act", { key, order }); break; }
      // actions de jeu
      case "famine": return play("famine", { play: d.v === "1" });
      case "draw": return play("draw");
      case "deployAt": if (UI.sel) return play("deploy", { uid: UI.sel, lane: d.l, u: Number(d.u) }, () => { UI.sel = null; }); break;
      case "endDeploy": UI.sel = null; return play("endDeploy");
      case "invest": return play("invest", { t: d.t, s: d.s, n: Number(d.n) });
      case "moveLane": return play("moveLane", { id: Number(d.id), lane: d.v });
      case "instinct": return play("instinct", { id: Number(d.id), v: d.v });
      case "instTarget": return play("instTarget", { id: Number(d.id), v: Number(d.v) });
      case "toAttacks": return play("toAttacks");
      case "reactDone": UI.spell = null; return play("reactDone");
      case "actAll": return play("actAll");
      case "endA": return play("endA");
      case "startCh": if (UI.sel !== null) return play("startCh", { i: UI.sel, lane: d.l }, () => { UI.sel = null; }); break;
      case "placeAt": return play("placeAt", { k: d.k });
      case "cancelCh": return play("cancelCh", { lane: d.l, i: Number(d.i) });
      case "alloc": return play("alloc", { lane: d.l, d: Number(d.d) });
      case "spellArg": {
        const name = S.spells[UI.spell];
        let arg = d.v;
        if (["Frappe orbitale", "Salve", "Brouillage"].includes(name)) arg = Number(d.v);
        if (d.v === "picks") arg = UI.picks;
        if (name === "Reconversion") arg = { hand: UI.recoHand, tile: d.v };
        if (d.v === "go") arg = null;
        const i = UI.spell;
        UI.spell = null; UI.picks = []; UI.recoHand = null;
        return play("spell", { i, arg });
      }
      case "build": UI.sel = null; UI.spell = null; return play("build");
      case "fireAt": if (UI.support) { const sk = UI.support; UI.support = null; return play("fire", { sk, id: Number(d.id) }); } break;
      case "autoFire": UI.support = null; return play("autoFire");
      case "endD": return play("endD");
    }
    if (!online() && !S.winner) setPhaseHandoff();
    if (!online()) save();
    render();
  }
  function homeAction(a, d) {
    if (a === "resume") { const t = load(); if (t && t.phase) { S = upgradeSave(t); MODE = "local"; UI = resetUI(); render(); } return; }
    if (a === "local") { MODE = "local"; clearSave(); newGame(); return; }
    if (a === "create") { createOnline(d.side); return; }
    if (a === "join") { const c = ($("#joincode").value || "").trim().toUpperCase(); if (c.length !== 5) { flash("Le code fait 5 caractères."); return; } joinOnline(c); }
  }
  function confirmQuit() { return UI.confirmQuit ? true : (UI.confirmQuit = true, setTimeout(() => { UI.confirmQuit = false; }, 4000), flash("Touchez encore « Quitter » : vous ne pourrez plus revenir dans cette partie depuis cet appareil."), false); }

  // ---------------------------------------------------------------- animations (lot 1)
  // Rejouées par-dessus le plateau encore à l'ancien état, à partir des événements du moteur (S.fx) ;
  // l'état final est affiché ensuite. Sobres et courtes ; un toucher les termine ; réglage « Animations ».
  const ANIM_KEY = "swarm-steel-anim";
  let animOn = (() => {
    try { const v = localStorage.getItem(ANIM_KEY); if (v !== null) return v === "1"; } catch (e) { /* rien */ }
    return !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  })();
  const FX = { playing: false, skip: false, ghosts: {}, speed: 1 };
  const wait = ms => new Promise(res => setTimeout(res, FX.skip ? 0 : ms * FX.speed));
  const dur = ms => (FX.skip ? 1 : ms * FX.speed);
  function layer() { let l = $("#fx"); if (!l) { l = document.createElement("div"); l.id = "fx"; document.body.appendChild(l); } return l; }
  function box(el) { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, cx: r.left + scrollX + r.width / 2, cy: r.top + scrollY + r.height / 2 }; }
  const cellAt = k => document.querySelector(`.board [data-xy="${k}"]`);
  const tokAt = id => FX.ghosts[id] || document.querySelector(`.board .tok[data-id="${id}"]`);
  function ghost(id) { // jeton flottant qui remplace le vrai jeton pendant qu'il se déplace
    if (FX.ghosts[id]) return FX.ghosts[id];
    const t = document.querySelector(`.board .tok[data-id="${id}"]`); if (!t) return null;
    const b = box(t), g = t.cloneNode(true);
    g.removeAttribute("data-a"); g.classList.add("ghost");
    Object.assign(g.style, { left: b.x + "px", top: b.y + "px", width: b.w + "px", height: b.h + "px" });
    layer().appendChild(g); t.style.visibility = "hidden";
    return (FX.ghosts[id] = g);
  }
  function glide(g, cx, cy, ms) {
    const nx = cx - g.offsetWidth / 2, ny = cy - g.offsetHeight / 2;
    const a = g.animate([{ left: g.style.left, top: g.style.top }, { left: nx + "px", top: ny + "px" }], { duration: dur(ms), easing: "ease-in-out", fill: "forwards" });
    g.style.left = nx + "px"; g.style.top = ny + "px";
    return a.finished.catch(() => {});
  }
  function lunge(el, toward, ms) { // petit élan vers la cible, puis retour
    if (!el || !toward) return Promise.resolve();
    const a = box(el), b = box(toward), dx = (b.cx - a.cx) * 0.3, dy = (b.cy - a.cy) * 0.3;
    return el.animate([{ transform: "translate(0,0)" }, { transform: `translate(${dx}px,${dy}px)` }, { transform: "translate(0,0)" }], { duration: dur(ms), easing: "ease-out" }).finished.catch(() => {});
  }
  function float(el, text, cls) { // chiffre qui monte et s'efface (n'attend pas)
    if (!el || FX.skip) return;
    const b = box(el), f = document.createElement("div");
    f.className = "float " + (cls || ""); f.textContent = text;
    Object.assign(f.style, { left: b.cx + "px", top: b.y + "px" });
    layer().appendChild(f);
    f.animate([{ transform: "translate(-50%, 0)", opacity: 1 }, { transform: "translate(-50%, -26px)", opacity: 0 }], { duration: 900, easing: "ease-out", fill: "forwards" }).finished.then(() => f.remove(), () => f.remove());
  }
  const shake = el => el && el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-3px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }], { duration: dur(220) });
  const fade = el => el ? el.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.4)" }], { duration: dur(260), fill: "forwards" }).finished.catch(() => {}) : Promise.resolve();
  function flashEl(el, color) { el.animate([{ boxShadow: `0 0 0 0 ${color}` }, { boxShadow: `0 0 0 4px ${color}` }, { boxShadow: `0 0 0 0 ${color}` }], { duration: dur(420) }); }
  const flip = el => el ? el.animate([{ transform: "rotateY(0)" }, { transform: "rotateY(90deg)" }, { transform: "rotateY(0)" }], { duration: dur(320) }).finished.catch(() => {}) : Promise.resolve();
  function laneCells(lane) { // de l'entrée vers la fusée
    const out = [];
    for (let k = 4; k >= 1; k--) for (let u = -2; u <= 2; u++) { const c = cellAt(SF.toGlobal(lane, u, k).join(",")); if (c && !out.includes(c)) out.push(c); }
    return out;
  }
  function ringCells(r) { return [...document.querySelectorAll(".board .cell.lane.r" + r)]; }
  async function sweep(cells, kind, together) { // vague sobre sur des cases (lane ou couronne)
    const color = kind === "stase" ? "var(--support)" : kind === "vision" ? "var(--essaim)" : "var(--off)";
    for (const c of cells) {
      c.animate([{ boxShadow: `inset 0 0 0 0 ${color}` }, { boxShadow: `inset 0 0 0 3px ${color}` }, { boxShadow: `inset 0 0 0 0 ${color}` }], { duration: dur(380) });
      if (!together) await wait(35);
    }
    await wait(together ? 300 : 200);
  }
  async function beam(tok, n) { // trait vertical qui tombe sur la créature
    const b = box(tok);
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div"); d.className = "beam";
      Object.assign(d.style, { left: b.cx + "px", top: (b.cy - 60) + "px" });
      layer().appendChild(d);
      await d.animate([{ transform: "translate(-50%, -20px) scaleY(.2)", opacity: 0 }, { transform: "translate(-50%, 0) scaleY(1)", opacity: 1, offset: .6 }, { transform: "translate(-50%, 0) scaleY(1)", opacity: 0 }], { duration: dur(260) }).finished.catch(() => {});
      d.remove();
    }
  }
  function spellBanner(name, kind, raw) {
    const b = document.createElement("div");
    b.className = "turn-banner spell-banner " + (kind || ""); b.textContent = raw ? name : "Sortilège : " + name;
    layer().appendChild(b);
    b.animate([{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .8 }, { opacity: 0 }], { duration: FX.skip ? 1 : 1400, fill: "forwards" }).finished.then(() => b.remove(), () => b.remove());
  }
  const STEP = {
    async move(e) { // tout le bloc glisse ensemble, case par case
      const gs = (e.ids || [e.id]).map(ghost).filter(Boolean); if (!gs.length) return;
      let [u, k] = e.from;
      for (let i = 0; i < 12 && !(u === e.to[0] && k === e.to[1]); i++) {
        [u, k] = SF.nextStep(u, k);
        const c = cellAt(SF.toGlobal(e.lane, u, k).join(","));
        if (c) { const b = box(c); await Promise.all(gs.map((g, j) => glide(g, b.cx + (j - (gs.length - 1) / 2) * 8, b.cy, 130))); }
      }
    },
    async hit(e) {
      const cell = cellAt(e.k), tile = cell && cell.querySelector(".tile");
      await lunge(e.id !== null ? tokAt(e.id) : null, cell, 200);
      shake(tile || cell);
      if (e.n !== null) float(tile || cell, e.n ? "−" + e.n : "0", "tile-dmg");
      const hp = tile && tile.querySelector(".hp");
      if (hp && e.hp !== null && hp.firstChild) hp.firstChild.textContent = e.hp;
      await wait(180);
    },
    async tileDown(e) {
      const cell = cellAt(e.k); if (!cell) return;
      float(cell, "+" + (e.n || 1) + " biomasse", "bio");
      await fade(cell.querySelector(".tile") || cell.firstElementChild);
    },
    async dmg(e) {
      const t = tokAt(e.id); if (!t) return;
      float(t, "−" + e.n, "cr-dmg");
      t.animate([{ filter: "brightness(1.9)" }, { filter: "none" }], { duration: dur(220) });
      const spans = t.querySelectorAll("span"); if (spans[1]) spans[1].textContent = e.hp;
      await wait(160);
    },
    async die(e) { await fade(tokAt(e.id)); },
    async rocket(e) {
      const core = cellAt("0,0"); if (!core) return;
      await lunge(tokAt(e.id), core, 220);
      core.animate([{ boxShadow: "0 0 0 0 var(--danger)" }, { boxShadow: "0 0 0 6px var(--danger)" }, { boxShadow: "0 0 0 0 var(--danger)" }], { duration: dur(420) });
      float(core, "−1 travailleur", "cr-dmg");
      await wait(300);
    },
    // ---- lot 2 : sortilèges, piège, chantiers, poses, supports
    async spell(e) {
      spellBanner(e.name, e.kind);
      const tok = e.id !== undefined ? tokAt(e.id) : null;
      switch (e.name) {
        case "Frappe orbitale": case "Salve": if (tok) await beam(tok, e.name === "Salve" ? 2 : 1); break;
        case "Brouillage": if (tok) { await tok.animate([{ transform: "translateX(0)" }, { transform: "translateX(-2px)" }, { transform: "translateX(2px)" }, { transform: "translateX(-2px)" }, { transform: "translateX(0)" }], { duration: dur(260) }).finished.catch(() => {}); await fade(tok); } break;
        case "Barrage": await sweep(laneCells(e.lane), "off"); break;
        case "Champ de stase": await sweep(laneCells(e.lane), "stase"); break;
        case "Onde de choc": await sweep(ringCells(e.ring), "off", true); break;
        case "Famine": { const b = document.querySelector('[data-fx="budget"]'); if (b) { flashEl(b, "var(--off)"); float(b, "−2 budget", "cr-dmg"); } await wait(300); break; }
        case "Effort": case "Cadence": { const h = document.querySelector('[data-fx="ateliers"]'); if (h) { flashEl(h, "var(--sup)"); float(h, "+2 points", "heal"); } await wait(300); break; }
        case "Renouvellement": { const h = document.querySelector('[data-fx="tilehand"]'); if (h) { flashEl(h, "var(--sup)"); float(h, "↻ " + e.n, "heal"); } await wait(300); break; }
        case "Reconversion": { const c = cellAt(e.k); if (c) await flip(c.querySelector(".tile") || c); break; }
        default: await wait(250);
      }
    },
    async heal(e) {
      const cell = cellAt(e.k), tile = cell && cell.querySelector(".tile");
      if (e.hp !== null) float(tile || cell, "+" + e.n + " PV", "heal");
      const hp = tile && tile.querySelector(".hp");
      if (hp && e.hp !== null && hp.firstChild) hp.firstChild.textContent = e.hp;
      if (tile) flashEl(tile, "var(--sup)");
      await wait(180);
    },
    async reveal(e) {
      const cell = cellAt(e.k); if (!cell) return;
      await flip(cell.querySelector(".tile") || cell);
      if (e.trap) float(cell, "Piège !", "cr-dmg");
    },
    async sabotage(e) {
      const slot = document.querySelector(`.atelier.lane-${e.lane} .slot:not(.empty)`);
      if (slot) { shake(slot); await fade(slot); }
    },
    async work(e) {
      const a = document.querySelector(`.atelier.lane-${e.lane} .slots`);
      if (a) { float(a, "+" + e.n, "heal"); flashEl(a, "var(--sup)"); }
      await wait(120);
    },
    async rocketPts(e) { const core = cellAt("0,0"); if (core) float(core, "+" + e.n + " fusée", "heal"); await wait(200); },
    async push(e) { // créatures qui reculent pour laisser place au bâtiment
      const dest = cellAt(SF.toGlobal(e.lane, e.u, e.to).join(","));
      if (!dest) return;
      const b = box(dest);
      await Promise.all(e.ids.map(id => { const g = ghost(id); return g ? glide(g, b.cx, b.cy, 260) : null; }));
    },
    // ---- lot 3 : fusée, Nuke, décollage, améliorations, auras, Vision, Raid
    async vision(e) {
      await sweep(laneCells(e.lane), "vision");
      for (const k of e.keys || []) { const c = cellAt(k); if (c) flip(c.querySelector(".tile") || c); }
      if ((e.keys || []).length) await wait(320);
    },
    async invest(e) {
      const node = document.querySelector(`.node[data-node="${e.type}:${e.slot}"]`), bar = node && node.querySelector(".bar i");
      if (bar) await bar.animate([{ width: bar.style.width || "0%" }, { width: Math.round(100 * e.got / e.cost) + "%" }], { duration: dur(320), easing: "ease-out", fill: "forwards" }).finished.catch(() => {});
    },
    async upgrade(e) {
      const node = document.querySelector(`.node[data-node="${e.type}:${e.slot}"]`);
      if (node) { flashEl(node, "var(--hot)"); float(node, "Acquis : " + e.name, "up"); }
      await wait(380);
    },
    async raid(e) {
      const g = ghost(e.id), c = cellAt(SF.toGlobal(e.lane, 0, 4).join(","));
      if (g && c) { const b = box(c); await glide(g, b.cx, b.cy, 380); }
    },
    async aura(e) {
      const t = tokAt(e.id); if (!t) return;
      t.animate([{ boxShadow: "0 0 0 0 var(--soutien)" }, { boxShadow: "0 0 0 4px var(--soutien)" }, { boxShadow: "0 0 0 0 var(--soutien)" }], { duration: dur(360) });
      float(t, e.names.join(" · "), "aura");
      await wait(220);
    },
    async cheal(e) {
      const t = tokAt(e.id); if (!t) return;
      float(t, "+" + e.n + " PV", "heal");
      const spans = t.querySelectorAll("span"); if (spans[1]) spans[1].textContent = e.hp;
      await wait(160);
    },
    async floor(e) {
      const fl = document.querySelectorAll(".floors .fl")[e.n - 1], core = cellAt("0,0");
      if (fl) { fl.classList.add("on"); fl.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: dur(360) }); }
      if (core) { const b = core.querySelector("b"); if (b) b.textContent = e.n + "/12"; float(core, `Étage ${e.n} · +1 travailleur`, "heal"); }
      const bonus = { 3: "Palier 3 : +2 technologies", 6: "Palier 6 : +1 chantier par lane", 9: "Palier 9 : Nuke !" }[e.n];
      if (bonus) { if (core) flashEl(core, "var(--hot)"); spellBanner(bonus, "sup", true); await wait(700); }
      await wait(260);
    },
    async nuke(e) {
      const board = document.querySelector(".board"); if (!board) return;
      const b = box(board), f = document.createElement("div"); f.className = "nuke";
      Object.assign(f.style, { left: b.x + "px", top: b.y + "px", width: b.w + "px", height: b.h + "px" });
      layer().appendChild(f);
      f.animate([{ opacity: 0 }, { opacity: .85, offset: .3 }, { opacity: 0 }], { duration: dur(700) }).finished.then(() => f.remove(), () => f.remove());
      await Promise.all(e.ids.map(id => fade(tokAt(id))));
      await wait(250);
    },
    async liftoff() {
      const core = cellAt("0,0"), ic = core && core.querySelector("svg"); if (!ic) return;
      float(core, "Décollage !", "heal");
      await ic.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-140px)", opacity: 0 }], { duration: dur(1000), easing: "ease-in", fill: "forwards" }).finished.catch(() => {});
    },
    async shot(e) {
      const from = cellAt(e.sk), to = tokAt(e.id); if (!from || !to) return;
      const a = box(from), b = box(to), d = document.createElement("div");
      d.className = "shot"; Object.assign(d.style, { left: a.cx + "px", top: a.cy + "px" });
      layer().appendChild(d);
      await d.animate([{ transform: "translate(-50%,-50%)" }, { transform: `translate(calc(-50% + ${b.cx - a.cx}px), calc(-50% + ${b.cy - a.cy}px))` }], { duration: dur(220), easing: "ease-in" }).finished.catch(() => {});
      d.remove();
    },
  };
  async function animate(events) {
    if (!animOn || !events || !events.length || !document.querySelector(".board")) return;
    FX.playing = true; FX.skip = false; FX.ghosts = {}; FX.speed = events.length > 40 ? 0.6 : 1;
    document.body.dataset.anim = "1";
    try { for (const e of events) if (STEP[e.t]) await STEP[e.t](e); }
    catch (err) { console.error("animation :", err); } // une animation ratée ne doit jamais bloquer le jeu
    finally {
      for (const g of Object.values(FX.ghosts)) g.remove();
      FX.ghosts = {}; FX.playing = false; document.body.dataset.anim = "0";
    }
  }
  function afterRender(events) { // apparitions, une fois le nouvel état affiché
    if (!animOn || !events) return;
    if (S && S.winner && events.length) { const w = document.querySelector(".banner.win"); if (w) w.animate([{ transform: "scale(.9)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 420, easing: "ease-out" }); }
    const pop = el => el && el.animate([{ transform: "scale(.2)", opacity: 0 }, { transform: "scale(1.12)", opacity: 1, offset: .7 }, { transform: "scale(1)", opacity: 1 }], { duration: 300, easing: "ease-out" });
    for (const e of events) {
      if (e.t === "deploy") pop(document.querySelector(`.board .tok[data-id="${e.id}"]`));
      if (e.t === "place") { const c = cellAt(e.k); pop(c && (c.querySelector(".tile") || c)); }
      if (e.t === "supUp") pop(cellAt(e.k));
      if (e.t === "reinc") pop(document.querySelector(`.board .tok[data-id="${e.id}"]`));
      if (e.t === "draw") {
        const cards = document.querySelectorAll(".panel.essaim .hand .ccard");
        if (cards.length) cards.forEach((c, i) => c.animate([{ transform: "translateY(-14px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], { duration: 260, delay: i * 90, easing: "ease-out", fill: "backwards" }));
        else pop(document.querySelector(".panel.essaim .hidden-hand"));
      }
      if (e.t === "chantier") { const sl = document.querySelectorAll(`.atelier.lane-${e.lane} .slot:not(.empty)`); pop(sl[sl.length - 1]); }
    }
  }
  function banner(text) { // bandeau de changement de tour (jeu en ligne)
    const b = document.createElement("div");
    b.className = "turn-banner " + (SF.actor(S) || ""); b.textContent = text;
    layer().appendChild(b);
    const kf = animOn ? [{ opacity: 0, transform: "translate(-50%, -12px)" }, { opacity: 1, transform: "translate(-50%, 0)", offset: .15 }, { opacity: 1, transform: "translate(-50%, 0)", offset: .8 }, { opacity: 0, transform: "translate(-50%, -12px)" }]
      : [{ opacity: 1 }, { opacity: 1 }];
    b.animate(kf, { duration: 1800, fill: "forwards" }).finished.then(() => b.remove(), () => b.remove());
  }

  // ---------------------------------------------------------------- jeu en ligne
  const POLL_MS = window.SF_POLL_MS || 2000;
  function setNet(n) { NET = n; try { if (n) localStorage.setItem(NET_KEY, JSON.stringify({ code: n.code, token: n.token, side: n.side })); else localStorage.removeItem(NET_KEY); } catch (e) { /* stockage indisponible */ } }
  async function api(path, body) {
    const res = await fetch("/api/" + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
    let j = null; try { j = await res.json(); } catch (e) { /* réponse vide */ }
    if (!res.ok) throw new Error((j && j.error) || "Serveur injoignable (" + res.status + ").");
    return j;
  }
  function receive(j) { // nouvel état envoyé par le serveur (vue filtrée pour notre camp)
    if (!j || !j.S) return;
    if (Number.isInteger(j.fxN)) NET.fx = j.fxN;
    const had = !!S, turnBefore = had && myTurn();
    if (j.S.winner !== (S && S.winner) || (S && S.round !== j.S.round)) UI = { ...resetUI(), help: UI.help };
    S = j.S; NET.v = j.v; NET.full = j.players.essaim && j.players.colonie;
    if (!turnBefore && myTurn()) { UI = { ...resetUI(), help: UI.help, selCreature: UI.selCreature }; NET.banner = had; }
  }
  // animations des événements reçus (sur l'ancien plateau), puis nouvel état
  async function show(j, onOk) {
    await animate(j.fx || []);
    receive(j);
    if (j.ok && onOk) onOk(); // ex. désélectionner la carte jouée, avant de redessiner
    render(); afterRender(j.fx || []);
    if (NET.banner) { NET.banner = false; banner(`À vous de jouer · ${PHASE_TXT[S.phase][1]}`); }
  }
  async function withBusy(f) {
    if (busy) return; busy = true; document.body.dataset.busy = "1";
    try { await f(); } catch (e) { flash(e.message); } finally { busy = false; document.body.dataset.busy = "0"; render(); }
  }
  function createOnline(side) {
    withBusy(async () => {
      const j = await api("create", { side });
      setNet({ code: j.code, token: j.token, side: j.side }); MODE = "online"; UI = resetUI(); receive(j);
      history.replaceState(null, "", location.pathname);
    });
  }
  function joinOnline(code) {
    withBusy(async () => {
      const j = await api("join", { code });
      setNet({ code: j.code, token: j.token, side: j.side }); MODE = "online"; UI = resetUI(); receive(j);
      history.replaceState(null, "", location.pathname);
    });
  }
  function send(type, args, onOk) {
    withBusy(async () => {
      const j = await api("action", { code: NET.code, token: NET.token, type, args: args || {}, f: NET.fx });
      await show(j, onOk);
      if (!j.ok) flash(j.error || "Action refusée.");
    });
  }
  async function poll() {
    if (!online() || busy || document.visibilityState === "hidden") return;
    if (NET.full && myTurn()) return; // c'est notre tour : rien ne peut changer sans nous
    try {
      const j = await api(`state?code=${encodeURIComponent(NET.code)}&token=${encodeURIComponent(NET.token)}&v=${NET.v || 0}&f=${NET.fx || 0}`);
      if (busy || !online() || j.same) return;
      busy = true; document.body.dataset.busy = "1";
      try { await show(j); } finally { busy = false; document.body.dataset.busy = "0"; }
    } catch (e) { /* réseau momentanément indisponible : on réessaiera */ }
  }
  function resumeOnline(n) {
    NET = { ...n, v: 0, full: false }; MODE = "online";
    withBusy(async () => {
      try { const j = await api(`state?code=${encodeURIComponent(n.code)}&token=${encodeURIComponent(n.token)}&v=0`); receive(j); }
      catch (e) { setNet(null); MODE = "home"; S = null; throw new Error("Impossible de reprendre la partie en ligne : " + e.message); }
    });
  }
  setInterval(poll, POLL_MS);

  function confirmNew() { return UI.confirm ? true : (UI.confirm = true, setTimeout(() => { UI.confirm = false; }, 4000), flash("Touchez encore « Nouvelle partie » pour confirmer."), false); }
  function flash(msg) { const f = $("#flash"); f.textContent = msg; f.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => { f.hidden = true; }, 3500); }

  document.addEventListener("click", e => {
    if (FX.playing) { FX.skip = true; return; } // un toucher pendant une animation la termine
    const el = e.target.closest("[data-a]");
    if (!el || el.disabled) return;
    handle(el.dataset.a, el.dataset);
  });
  function upgradeSave(t) { SF.migrate(t); t.invest = t.invest || {}; t.toPlace = t.toPlace || []; for (const x of Object.values(t.tiles || {})) if (SF.TILES[x.name] && SF.TILES[x.name].camo && x.camo === undefined) x.camo = 1; return t; }
  // démarrage : partie en ligne en cours, sinon partie locale sauvegardée, sinon accueil
  // (un lien d'invitation « ?code=… » ouvre toujours l'accueil, code prérempli)
  let net0 = null; try { net0 = JSON.parse(localStorage.getItem(NET_KEY) || "null"); } catch (e) { /* rien */ }
  const saved = load();
  const invite = new URLSearchParams(location.search).get("code");
  if (net0 && net0.code && net0.token && (!invite || invite.toUpperCase() === net0.code)) resumeOnline(net0);
  else if (!invite && saved && saved.phase) { S = upgradeSave(saved); MODE = "local"; render(); }
  else render();
})();
