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
  let MODE = "home"; // "home" (accueil), "local" (même appareil), "online" ou "stats" (statistiques des parties)
  const HTTP = /^https?:$/.test(location.protocol); // page servie par le site (serveur disponible), pas un fichier ouvert en local
  // parties de test (robots e2e) : marquées pour être exclues des statistiques
  const TEST = (() => {
    try { if (window.SF_TEST || new URLSearchParams(location.search).has("test")) sessionStorage.setItem("swarm-steel-test", "1"); return sessionStorage.getItem("swarm-steel-test") === "1"; }
    catch (e) { return !!window.SF_TEST; }
  })();
  // thème (Oni, 04/11/2026) : sombre par défaut, clair, ou auto (suit le système) ; mémorisé dans ce navigateur
  const THEME_KEY = "swarm-steel-theme", THEMES = ["dark", "light", "auto"], THEME_NAME = { dark: "sombre", light: "clair", auto: "auto" };
  let THEME = (() => { try { const t = localStorage.getItem(THEME_KEY); return THEMES.includes(t) ? t : "dark"; } catch (e) { return "dark"; } })();
  const sysDark = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
  function applyTheme() { const r = document.documentElement; r.dataset.theme = THEME; r.classList.toggle("sys-dark", !!(sysDark && sysDark.matches)); }
  applyTheme();
  if (sysDark && sysDark.addEventListener) sysDark.addEventListener("change", applyTheme);
  const themeBtn = () => `<button data-a="theme" class="ghost" title="Changer de thème">Thème : ${THEME_NAME[THEME]}</button>`;
  // musique (Oni, 07/11/2026) : bande originale en boucle dès l'accueil, puis en jeu ; coupure et volume mémorisés.
  // Les navigateurs bloquent le son tant que la page n'a pas été touchée : la musique démarre alors au premier geste.
  const MUSIC = (() => {
    const KEY = "swarm-steel-musique";
    let on = true, vol = 0.5;
    try { const m = JSON.parse(localStorage.getItem(KEY) || "{}"); if (m.on === false) on = false; if (typeof m.vol === "number") vol = Math.min(1, Math.max(0, m.vol)); } catch (e) { /* rien */ }
    const a = new Audio(); a.loop = true; a.preload = "auto"; a.src = "__MUSIC__"; a.volume = vol;
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ on, vol })); } catch (e) { /* rien */ } };
    const tryPlay = () => { if (on && a.paused) { const p = a.play(); if (p && p.catch) p.catch(() => { /* attend un geste */ }); } };
    for (const ev of ["pointerdown", "keydown", "touchstart"]) document.addEventListener(ev, tryPlay, { capture: true, passive: true });
    tryPlay();
    return {
      get on() { return on; }, get vol() { return vol; },
      toggle() { on = !on; save(); if (on) tryPlay(); else a.pause(); },
      setVol(v) { vol = Math.min(1, Math.max(0, v)); a.volume = vol; save(); },
    };
  })();
  const musicCtl = (cls = "ghost") => `<span class="music"><button data-a="music" class="${cls}" aria-pressed="${MUSIC.on}" title="${MUSIC.on ? "Couper la musique" : "Remettre la musique"}">Musique : ${MUSIC.on ? "oui" : "non"}</button><input type="range" class="music-vol" min="0" max="100" step="5" value="${Math.round(MUSIC.vol * 100)}" aria-label="Volume de la musique" title="Volume"></span>`;
  document.addEventListener("input", e => { if (e.target.classList && e.target.classList.contains("music-vol")) MUSIC.setVol(Number(e.target.value) / 100); });
  let STALE = null; // version plus récente du jeu annoncée par le serveur : la page doit être rechargée
  let STATS = null; // page Statistiques : { list, error, test, ver, plans: {id: svg} }
  // session en ligne : code de la partie, jeton du joueur (conservé pour la reconnexion), camp, version de l'état
  let NET = null;
  let busy = false;
  let UI = { sel: null, selCreature: null, spell: null, picks: [], support: null, blk: null, ord: [], sap: null, help: false, recoHand: null };

  const PHASE_TXT = {
    A_famine: ["colonie", "Début du tour de l'essaim", "La colonie peut jouer Famine avant que l'essaim calcule son budget."],
    A_start: ["essaim", "Tour de l'essaim", "Choisissez combien de cartes piocher dans chaque pile (niveau 1, 2, 3) : le palier fixe seulement le nombre total de cartes."],
    A_deploy: ["essaim", "Déploiement et améliorations", "Répartissez votre biomasse comme vous voulez : déployez des cartes (une carte, puis une case d'entrée dans une lane ; un soutien peut être parachuté sur n'importe quelle case libre) et investissez dans les arbres d'amélioration, dans l'ordre que vous voulez. Le budget du tour est dépensé en premier, puis la réserve. Ce qui reste du budget ira à la réserve."],
    A_upgrade: ["essaim", "Améliorations", "Investissez votre réserve dans une amélioration (panneau Essaim), puis passez aux attaques."],
    A_react: ["colonie", "Réaction de la colonie", "Avant les attaques, la colonie peut jouer ses sortilèges offensifs."],
    A_attack: ["essaim", "Attaques", "Touchez une créature : choisissez la case où elle avance sur son chemin vers la fusée (au moins 1 case, au plus sa vitesse), puis, si vous voulez, un bâtiment qui touche sa case (ou la fusée) à attaquer. « Tout résoudre et finir le tour » fait agir toutes les créatures restantes."],
    D_draw: ["colonie", "Pioche de la colonie", "Complétez votre main carte par carte : pour chaque tuile, choisissez sa pioche (renforts, actifs ou pièges)."],
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

  const newGid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  function newGame() { MODE = "local"; S = SF.newGame(); S.gid = newGid(); if (DISC) S.decouverte = true; S.handoff = "essaim"; S.view = null; UI = resetUI(); save(); render(); }
  const resetUI = () => ({ sel: null, selCreature: null, spell: null, picks: [], support: null, blk: null, ord: [], sap: null, help: false, recoHand: null });
  // fenêtres de réaction (Oni, 06/11/2026) : pas d'écran de passage pour entrer dans la réaction de la colonie (A_react)
  // ni pour en sortir ; un bandeau « RÉACTIONS ! » traverse l'écran à la place
  const REACT = ["A_famine", "A_react"];
  function setPhaseHandoff(prev) { // passe la main si le joueur actif change
    const w = who();
    if (S.view === w) return;
    if (S.phase === "A_react" || prev === "A_react") { S.view = w; S.handoff = null; UI = { ...resetUI(), help: UI.help }; return; }
    S.handoff = w; UI = { ...resetUI(), help: UI.help };
  }

  // ---------------------------------------------------------------- rendu
  // pioche automatique au début du tour de l'essaim (Oni, 06/11/2026) : dès que l'essaim regarde l'écran en phase A_start
  function autoDraw() {
    if (!S || S.winner || S.handoff || S.phase !== "A_start" || !S.startHand || autoDraw.busy) return; // main de départ seulement : ensuite, pioche au choix
    if (online() ? !myTurn() : S.view !== "essaim") return;
    autoDraw.busy = true; setTimeout(() => { autoDraw.busy = false; if (S && S.phase === "A_start" && !S.handoff) play("draw"); }, 250);
  }
  // couleurs des directions (Oni, 07/11/2026) : dans tous les textes, Nord / Est / Sud / Ouest prennent la couleur de leur
  // lane (Nord bleu, Est vert, Sud jaune, Ouest violet) — sur les nœuds de texte seulement, jamais dans les attributs
  const DIR_RE = /\b(Nord|Est|Sud|Ouest)\b/g, DIR_CLS = { Nord: "N", Est: "E", Sud: "S", Ouest: "O" };
  function colorDirs(root) {
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (DIR_RE.lastIndex = 0, DIR_RE.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest(".dir, script, style, textarea, input")) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) {
      const f = document.createDocumentFragment(); let last = 0; const v = n.nodeValue; DIR_RE.lastIndex = 0;
      for (let m; (m = DIR_RE.exec(v));) {
        if (m.index > last) f.appendChild(document.createTextNode(v.slice(last, m.index)));
        const sp = document.createElement("span"); sp.className = "dir dir-" + DIR_CLS[m[1]]; sp.textContent = m[1]; f.appendChild(sp);
        last = m.index + m[1].length;
      }
      if (last < v.length) f.appendChild(document.createTextNode(v.slice(last)));
      n.replaceWith(f);
    }
  }
  function render() { renderInner(); colorDirs($("#app")); }
  function renderInner() {
    document.documentElement.dataset.motion = animOn ? "on" : "off"; // animations CSS suivant le bouton « Animations »
    document.body.dataset.myturn = online() && S && myTurn() ? "1" : "0";
    const bar = staleBar();
    if (MODE === "stats" || MODE === "home" || !S) document.body.classList.remove("pc");
    if (MODE === "stats") { document.body.dataset.view = ""; $("#app").innerHTML = homeHeader() + bar + statsPage(); return; }
    const waiting = MODE !== "stats" && MODE !== "home" && S && online() && !NET.full;
    document.body.classList.toggle("on-home", MODE === "home" || !S || !!waiting);
    if (waiting) { document.body.dataset.view = ""; document.body.classList.remove("pc"); $("#app").innerHTML = bar + waitingRoom() + (UI.help ? help() : ""); return; }
    if (MODE === "home" || !S) { document.body.dataset.view = ""; $("#app").innerHTML = bar + home() + (UI.help ? help() : ""); return; }
    document.body.dataset.view = S.view || "";
    const pc = isPC() && !(online() && !NET.full);
    document.body.classList.toggle("pc", pc);
    if (pc) {
      const main = S.handoff && !online() ? pcHandoff() : pcLayout(false);
      $("#app").innerHTML = `<div class="pc-hot" aria-hidden="true"><span>Menu</span></div>` + header() + bar + main + (UI.help ? help() : "") + tipCard();
      placePop(); autoDraw();
      // carte de passage qui arrive en glissant : animation signalée comme les autres (data-anim), ou coupée
      const card = $(".pc-ho .ho-card:not(.leave)");
      if (card && !animOn) card.style.animation = "none";
      else if (card) {
        document.body.dataset.anim = "1";
        const done = () => { if (!FX.playing && !UI.leaving) document.body.dataset.anim = "0"; };
        card.addEventListener("animationend", done, { once: true }); setTimeout(done, 700);
      }
      return;
    }
    const main = online() && !NET.full ? waitingRoom() : S.handoff ? handoff() : S.winner ? winner() + layout() : layout();
    $("#app").innerHTML = header() + bar + main + (UI.help ? help() : "") + tipCard();
    autoDraw();
  }
  function header() {
    const p = PHASE_TXT[S.phase] || ["", "", ""];
    const menu = online()
      ? `<span class="code-chip" data-code="${E(NET.code)}">Partie <b>${E(NET.code)}</b> · ${E(SIDE[NET.side])}</span><button data-a="help" class="ghost">Règles</button><button data-a="quit" class="ghost">Quitter</button>`
      : `<button data-a="help" class="ghost">Règles</button><button data-a="home" class="ghost">Menu</button><button data-a="new" class="ghost">Nouvelle partie</button>`;
    const animBtn = `<button data-a="anim" class="ghost" aria-pressed="${animOn}">Animations : ${animOn ? "oui" : "non"}</button>`;
    return `<header class="top"><div class="brand"><span class="brand-mk" aria-hidden="true"></span><span class="brand-word" role="img" aria-label="Swarm &amp; Steel"></span><span>prototype v${SF.VERSION}</span></div>
      <div class="round">Manche <b>${S.round}</b><span class="dot ${p[0]}"></span>${E(p[1])}</div>
      <div class="menu">${animBtn}${themeBtn()}${musicCtl()}${menu}</div></header>`;
  }
  function homeHeader() {
    return `<header class="top"><div class="brand"><span class="brand-mk" aria-hidden="true"></span><span class="brand-word" role="img" aria-label="Swarm &amp; Steel"></span><span>prototype v${SF.VERSION}</span></div>
      <div class="menu">${themeBtn()}<button data-a="help" class="ghost">Règles</button></div></header>`;
  }
  function staleBar() {
    return STALE ? `<div class="stale" role="alert"><span>Nouvelle version du jeu disponible (v${E(STALE)}). Rechargez la page pour continuer avec les règles à jour.</span><button data-a="reload" class="primary">Recharger</button></div>` : "";
  }
  // ---------------------------------------------------------------- accueil et salle d'attente (jeu en ligne)
  // écran d'accueil « cinématique » (Oni, 06/11/2026) : champ de bataille en plein écran, emblème et titre massifs, menu de jeu
  function home() {
    const saved = load();
    const preset = new URLSearchParams(location.search).get("code") || "";
    const resume = saved && saved.phase;
    return `<section class="home2">${homeBackdrop()}
      <div class="h2-top"><button data-a="help" class="h2-ic" title="Règles">Règles</button>${themeBtn().replace('class="ghost"', 'class="h2-ic"')}</div>
      <div class="h2-hero">
        <div class="h2-emblem" aria-hidden="true"><span class="h2-glow"></span><span class="h2-mark"></span></div>
        <h1 class="h2-title"><span class="h2-word" aria-hidden="true"></span><span class="sr">Swarm &amp; Steel</span></h1>
        <p class="h2-tag">L'essaim dévore · La colonie bâtit · Un seul camp survivra</p>
      </div>
      <nav class="h2-menu" aria-label="Menu principal">
        ${resume ? `<button data-a="resume" class="h2-btn main">Reprendre la partie</button>` : ""}
        <button data-a="local" class="h2-btn${resume ? "" : " main"}">Nouvelle partie <small>sur cet appareil</small></button>
        <div class="h2-online"><span class="h2-k">En ligne</span>
          <div class="h2-row"><button data-a="create" data-side="essaim" class="h2-btn side essaim">${sideLogo("essaim")}Jouer l'essaim</button><button data-a="create" data-side="colonie" class="h2-btn side colonie">${sideLogo("colonie")}Jouer la colonie</button></div>
          <div class="h2-row join"><input id="joincode" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="CODE" aria-label="Code de la partie" value="${E(preset.toUpperCase())}"><button data-a="join" class="h2-btn">Rejoindre</button></div>
        </div>
        <div class="h2-row small"><button data-a="disc" aria-pressed="${DISC}" class="h2-btn ghost${DISC ? " on" : ""}">Mode découverte : ${DISC ? "oui" : "non"}</button>${HTTP ? `<button data-a="stats" class="h2-btn ghost">Statistiques</button>` : ""}</div>
      </nav>
      <div class="h2-music">${musicCtl("h2-ic")}</div>
      <p class="h2-ver">Prototype v${E(SF.VERSION)}</p>
    </section>`;
  }
  // salle d'attente en ligne (Oni, 06/11/2026) : même mise en scène que l'accueil
  function homeBackdrop() {
    const embers = Array.from({ length: 34 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${6 + (i * 7) % 9}s;--t:-${(i * 13) % 11}s;--s:${1 + (i % 2) * .8}px"></i>`).join("");
    return `<div class="h2-bg ${imCls("Champ de bataille")}" aria-hidden="true"></div><div class="h2-embers" aria-hidden="true">${embers}</div><div class="h2-fog" aria-hidden="true"></div>`;
  }
  function waitingRoom() {
    const link = location.origin + location.pathname + "?code=" + NET.code;
    return `<section class="home2 h2-wait ${NET.side}">${homeBackdrop()}
      <div class="h2-top"><button data-a="help" class="h2-ic">Règles</button></div>
      <div class="h2-hero small side-${NET.side}">
        <div class="h2-emblem" aria-hidden="true"><span class="h2-glow"></span><span class="h2-mark"></span></div>
        <h1 class="h2-title"><span class="h2-word" aria-hidden="true"></span><span class="sr">${NET.side === "essaim" ? "Essaim" : "Colonie"}</span></h1>
      </div>
      <div class="h2-panel">
        <p class="h2-side"><span>Vous jouez <b>${SIDE[NET.side]}</b></span></p>
        <p class="h2-k">Code de la partie</p>
        <p class="h2-code"><span class="bigcode" data-code="${E(NET.code)}">${E(NET.code)}</span></p>
        <p class="h2-help">Donnez ce code à votre adversaire, ou envoyez-lui ce lien :</p>
        <p class="h2-link">${E(link)}</p>
        <p class="h2-copy"><button data-a="copy" data-v="${E(NET.code)}" data-what="Code" class="h2-ic">Copier le code</button><button data-a="copy" data-v="${E(link)}" data-what="Lien" class="h2-ic">Copier le lien</button></p>
        <p class="h2-waitmsg">En attente de l'adversaire<span class="h2-dots"><i>.</i><i>.</i><i>.</i></span></p>
      </div>
      <div class="h2-menu h2-quit"><button data-a="quit" class="h2-btn">Quitter</button></div>
      <div class="h2-music">${musicCtl("h2-ic")}</div>
      <p class="h2-ver">Prototype v${E(SF.VERSION)}</p>
    </section>`;
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
  // Mise en page : le camp qui regarde a son panneau complet ; l'adversaire n'a qu'un résumé compact (Oni, 04/11/2026),
  // ce qui laisse plus de place au plateau. Sans camp (fin de partie en local), les deux panneaux complets.
  function layout() {
    const center = `<section class="center">${phaseBox()}<div class="board-wrap">${board()}</div>${detail()}</section>`;
    if (S.view === "essaim") return `<main class="layout me-essaim"><aside class="panel colonie mini">${colonySummary()}</aside>${center}
      <aside class="panel essaim">${swarmPanel()}${logPanel()}</aside></main>`;
    if (S.view === "colonie") return `<main class="layout me-colonie"><aside class="panel colonie">${colonyPanel()}${logPanel()}</aside>${center}
      <aside class="panel essaim mini">${swarmSummary()}</aside></main>`;
    return `<main class="layout"><aside class="panel colonie">${colonyPanel()}</aside>${center}
      <aside class="panel essaim">${swarmPanel()}${logPanel()}</aside></main>`;
  }
  // ce que fait chaque étage de la fusée (info-bulle)
  function floorTip(n) {
    const cost = SF.FLOOR_COSTS[Math.floor((n - 1) / 3)];
    const next = SF.FLOOR_COSTS[Math.floor(n / 3)];
    const extra = {
      3: `Palier 1 : +2 technologies · +1 tuile en main · tourelles I +1 dégât · étages suivants : ${next} points`,
      6: `Palier 2 : +1 chantier par lane · +1 tuile en main · tourelles I +1 dégât · étages suivants : ${next} points`,
      9: `Palier 3 : Nuke, toutes les créatures sont détruites · +1 tuile en main · tourelles I +1 dégât · étages suivants : ${next} points`,
      12: "Décollage : la colonie gagne",
    }[n];
    // avancement (Oni, 04/11/2026) : « Étage 5 : 1/4 travailleurs » (points déjà investis sur le coût de l'étage)
    const done = n <= S.floors ? cost : n === S.floors + 1 ? S.rocketPts : 0;
    return `Étage ${n} : ${done}/${cost} travailleurs${n <= S.floors ? " (achevé)" : ""}\n+1 travailleur une fois achevé${extra ? "\n" + extra : ""}`;
  }
  // résumé de la colonie vu par l'essaim : chiffres clés, fusée en colonne, ateliers
  function colonySummary() {
    const bonus = SF.bonusWorkers(S);
    const rocket = Array.from({ length: 12 }, (_, i) => {
      const n = i + 1, on = n <= S.floors, cur = n === S.floors + 1;
      const fill = cur ? Math.round(100 * S.rocketPts / SF.floorCost(S)) : 0;
      return `<i class="fl${on ? " on" : ""}${n % 3 === 0 ? " ms" : ""}${cur ? " cur" : ""}" tabindex="0" data-tip="${E(floorTip(n))}"${cur ? ` style="--p:${fill}%"` : ""}>${n % 3 === 0 ? n : ""}</i>`;
    }).join("");
    const ateliers = SF.LANES.map(l => {
      const chs = S.chantiers[l];
      const txt = chs.length ? chs.map(ch => `${E(!ch.tile || SF.TILES[ch.tile].camo ? "?" : short(ch.tile))} ${ch.left}`).join(" · ") : "—";
      return `<span class="sa lane-${l}" tabindex="0" data-tip="${E(`Atelier ${SF.LANE_NAME[l]} : ${chs.length ? chs.map(ch => `${!ch.tile || SF.TILES[ch.tile].camo ? "tuile cachée" : ch.tile}, ${ch.left} point${ch.left > 1 ? "s" : ""} restant${ch.left > 1 ? "s" : ""}`).join(" ; ") : "libre"}`)}"><b>${l}</b>${txt}</span>`;
    }).join("");
    return `<h3>${icon("fusee")} Colonie</h3>
      <div class="sum">
        <div class="rocket" aria-label="Fusée : ${S.floors} étages sur 12"><div class="floors v">${rocket}</div><span class="rk-lab"><b>${S.floors}</b>/12</span></div>
        <div class="kcs">
          <span class="kc" tabindex="0" data-tip="Travailleurs : ${S.workersBase} de base${bonus ? ` + ${bonus} grâce aux tuiles et supports` : ""}. L'essaim gagne quand la colonie n'en a plus.">${icon("travailleur")}<b>${S.workersBase}</b>${bonus ? `<small>+${bonus}</small>` : ""}</span>
          <span class="kc" tabindex="0" data-tip="Technologies : ${SF.tech(S)} → ${SF.spellsPerTurn(S)} sortilège(s) par tour">${icon("tech")}<b>${SF.tech(S)}</b><small>${SF.spellsPerTurn(S)} sort/t</small></span>
          <span class="kc" tabindex="0" data-tip="Fusée : ${S.rocketPts} / ${SF.floorCost(S)} points vers l'étage ${Math.min(12, S.floors + 1)}">${icon("fusee")}<b>${S.rocketPts}</b><small>/${SF.floorCost(S)} pts</small></span>
          <span class="kc" tabindex="0" data-tip="${S.hand.length} tuiles en main (cachées)">${icon("mur")}<b>${S.hand.length}</b><small>tuiles</small></span>
          <span class="kc" tabindex="0" data-tip="${S.spells.length} sortilège(s) en main (cachés)">${icon("sort")}<b>${S.spells.length}</b><small>sorts</small></span>
          <div class="sum-at" data-fx="ateliers">${ateliers}</div>
        </div>
      </div>`;
  }
  // icône de chaque nœud d'amélioration (résumé de l'essaim vu par la colonie)
  const NODE_ICON = {
    aggro: { A1: "ferocite", B1: "mobilite", A2: "carnage", C2: "deploiement", B2: "essaim" },
    tank: { A1: "carapace", B1: "protection", A2: "blindage", C2: "reincarnation", B2: "masse" },
    soutien: { A1: "mue", B1: "griffes", A2: "regeneration", C2: "clairvoyance", B2: "frenesie" },
  };
  // résumé de l'essaim vu par la colonie : chiffres clés et améliorations en icônes (détail au survol)
  function swarmSummary() {
    const t = SF.TIERS[SF.tier(S)], next = SF.TIERS[SF.tier(S) + 1];
    const POS = { A1: "rang 1, côté A", B1: "rang 1, côté B", A2: "rang 2, après A", C2: "rang 2, centre", B2: "rang 2, après B" };
    const trees = ["aggro", "tank", "soutien"].map(ty => {
      const T = SF.TREES[ty];
      const node = slot => {
        const st = SF.nodeState(S, ty, slot), cost = SF.nodeCost(slot), got = SF.invested(S, ty, slot);
        const state = st === "taken" ? "acquis" : st === "closed" ? "fermé" : st === "needR1" ? "demande d'abord un rang 1" : got ? `${got} / ${cost} investis` : `${cost} biomasse`;
        return `<span class="node un ${st}${got && st !== "taken" ? " prog" : ""}" data-node="${ty}:${slot}" tabindex="0" style="--p:${Math.round(100 * got / cost)}%"
          data-tip="${E(`${T[slot][0]} (${POS[slot]}) : ${T[slot][1]}\n${state}`)}">${icon(NODE_ICON[ty][slot])}<span class="bar"><i style="width:${Math.round(100 * got / cost)}%"></i></span></span>`;
      };
      return `<div class="utree ${ty}"><span class="ut" tabindex="0" data-tip="Améliorations ${ty}">${icon(ty)}</span>${node("A1")}${node("B1")}<span class="usep"></span>${node("A2")}${node("C2")}${node("B2")}</div>`;
    }).join("");
    const turn = ["A_deploy", "A_upgrade", "A_attack", "A_react"].includes(S.phase);
    return `<h3>${icon("spores")} Essaim</h3>
      <div class="kcs">
        <span class="kc" tabindex="0" data-tip="Biomasse : ${S.biomass}${next ? ` (palier suivant à ${next.min})` : ""}">${icon("biomasse")}<b>${S.biomass}</b><small>bio</small></span>
        <span class="kc" tabindex="0" data-tip="Palier ${SF.tier(S) + 1} : pioche de ${SF.tierCards(SF.tier(S))} cartes, plafond ${SF.capOf(S)} créatures par lane">${icon("palier")}<b>${SF.tier(S) + 1}</b><small>max ${SF.capOf(S)}/lane</small></span>
        ${turn ? `<span class="kc" data-fx="budget" tabindex="0" data-tip="Budget de ce tour${S.famine ? " (Famine : biomasse ÷ 2)" : ""}">${icon("biomasse")}<b>${S.budget}</b><small>budget</small></span>` : `<span class="kc" data-fx="budget" tabindex="0" data-tip="Réserve : biomasse non investie">${icon("biomasse")}<b>${S.reserve}</b><small>réserve</small></span>`}
        <span class="kc hidden-hand" tabindex="0" data-tip="${S.handA.length} cartes en main (cachées) · pioches ${S.piles[1].length} / ${S.piles[2].length} / ${S.piles[3].length}">${icon("sort")}<b>${S.handA.length}</b><small>cartes</small></span>
      </div>
      <h4>Améliorations</h4><div class="utrees">${trees}</div>`;
  }

  // ---------------------------------------------------------------- boîte d'action
  function phaseBox() {
    if (S.winner) return "";
    const { p, body, acts, waiting } = phaseParts();
    if (waiting) return `<section class="phase ${p[0]} waiting"><div class="ph-head"><span class="dot ${p[0]}"></span><b>${E(p[1])}</b><span class="side">${E(SIDE[p[0]])}</span></div>
      <p class="ph-txt">Au tour de ${E(SIDE[p[0]])} : en attente de votre adversaire…</p></section>`;
    return `<section class="phase ${p[0]}"><div class="ph-head"><span class="dot ${p[0]}"></span><b>${E(p[1])}</b><span class="side">${E(SIDE[p[0]])}</span></div>
      <p class="ph-txt">${E(p[2])}</p>${body}<div class="acts">${acts}</div></section>`;
  }
  // contenu de la boîte d'action (consignes, choix, boutons) : partagé par la mise en page mobile et la mise en page PC
  function phaseParts(sh) { // sh : textes courts (mise en page PC, le détail est au survol)
    const p = PHASE_TXT[S.phase];
    if (online() && !myTurn()) return { p, body: "", acts: "", waiting: true };
    let body = "", acts = "";
    const ph = S.phase;
    if (ph === "A_famine") {
      acts = `<button data-a="famine" data-v="1" class="primary">Jouer Famine</button><button data-a="famine" data-v="0">Ne pas jouer</button>`;
    } else if (ph === "A_start" && S.startHand) {
      acts = `<button data-a="draw" class="primary">Recevoir la main de départ</button>`;
    } else if (ph === "A_start") {
      // pioche au choix (Oni, 07/11/2026) : le palier donne le nombre de cartes ; l'essaim choisit combien il en pioche
      // dans chaque pile non vide, les créatures sont tirées au hasard
      const { total, levels } = SF.pickRule(S), sel = UI.pickSel || [0, 0, 0], n = sel.reduce((a, b) => a + b, 0);
      const rows = [1, 2, 3].map(l => {
        const q = sel[l - 1], left = S.piles[l].length, open = levels.includes(l);
        return `<div class="pick-row lvl${l}${open ? "" : " off"}"><span class="pick-nm"><b>Pile de niveau ${l}</b><small>${open ? `${left} carte${left > 1 ? "s" : ""} dans la pile` : "pile vide" + (l > 1 ? ` (amélioration de rang ${l - 1} nécessaire)` : "")}</small></span>
          <span class="step"><button data-a="pickDel" data-v="${l}" aria-label="Retirer"${q ? "" : " disabled"}>−</button><b>${q}</b><button data-a="pickAdd" data-v="${l}" aria-label="Ajouter"${open && n < total && q < left ? "" : " disabled"}>+</button></span></div>`;
      }).join("");
      body = `<p class="hint">Palier ${SF.tier(S) + 1} : piochez <b>${total}</b> carte${total > 1 ? "s" : ""} (${n}/${total}), réparties comme vous voulez entre les piles ; les créatures sont tirées au hasard.</p><div class="pick">${rows}</div>`;
      acts = `<button data-a="pickGo" class="primary"${n === total ? "" : " disabled"}>${n === total ? `Piocher ${n} carte${n > 1 ? "s" : ""}` : `Encore ${total - n} carte${total - n > 1 ? "s" : ""} à répartir`}</button>`;
    } else if (ph === "A_deploy" && UI.sap) {
      body = `<p class="hint">Sapeur : ${sh ? "bâtiment à détruire" : "choisissez le bâtiment à détruire"} dans la lane ${SF.LANE_NAME[UI.sap.lane]}.</p><div class="choices">` +
        SF.laneTiles(S, UI.sap.lane).map(k => `<button data-a="sapTarget" data-k="${k}">${E(tileLabel(k))}</button>`).join("") + `<button data-a="sapCancel">Annuler</button></div>`;
    } else if (ph === "A_deploy") {
      const para = UI.sel && SF.CREATURES[cardOf(UI.sel).name] && SF.CREATURES[cardOf(UI.sel).name].type === "soutien";
      body = UI.sel ? (sh ? `<p class="hint"><b>${E(cardOf(UI.sel).name)}</b> → cliquez ${para ? "une case surlignée (parachutage : n'importe quelle case libre)" : "une entrée surlignée"}.</p>` : `<p class="hint">Carte choisie : <b>${E(cardOf(UI.sel).name)}</b>. Cliquez ${para ? "une case surlignée : un soutien se parachute sur n'importe quelle case libre" : "une case d'entrée surlignée"}.</p>`) : (sh ? `<p class="hint">Choisissez une carte de votre main.</p>` : "");
      acts = `<button data-a="endDeploy" class="primary">Passer aux attaques</button>`;
    } else if (ph === "A_upgrade") {
      body = sh ? `<p class="hint">Réserve <b>${S.reserve}</b> : investissez-la dans un arbre, ou gardez-la.</p>` : `<p class="hint">Réserve disponible : <b>${S.reserve}</b>. Investissez-la dans un nœud des arbres (panneau Essaim) ou gardez-la pour plus tard.</p>`;
      acts = `<button data-a="toAttacks" class="primary">Passer aux attaques</button>`;
    } else if (ph === "A_react") {
      body = spellBox("off", sh);
      acts = `<button data-a="reactDone" class="primary">Terminer la réaction</button>`;
    } else if (ph === "A_attack") {
      // déplacements (Oni, 07/11/2026) : toucher une créature, puis une case de son chemin (1 case au moins, jusqu'à son
      // maximum), puis, si on le veut, un bâtiment qui touche sa case ; « Tout résoudre » fait agir les autres et finit le tour
      const sel = S.creatures.find(c => c.id === UI.selCreature && !c.acted);
      const left = S.creatures.filter(c => SF.canAct(S, c)).length;
      if (sel) {
        const t = SF.strikeTargets(S, sel), n = Object.keys(SF.reachable(S, sel)).length;
        const tb = t.length ? `<div class="choices">${t.map(k => `<button data-a="strike" data-k="${k}">Attaquer ${k === "fusee" ? "la fusée" : E(tileLabel(k))}</button>`).join("")}</div>` : "";
        const what = sel.struck ? (t.length ? "2ᵉ attaque possible (Carnage)" : "rien d'autre à attaquer") : n ? `avancez de 1 à ${n} case${n > 1 ? "s" : ""} (cases surlignées)` : SF.attacks(sel) ? (t.length ? "attaquez un bâtiment encadré, ou passez" : "rien à attaquer") : "un soutien n'attaque pas";
        body = `<p class="hint"><b>${E(sel.name)}</b>${sh ? "" : " · " + posTxt(sel)} : ${what}.</p>${tb}<div class="choices"><button data-a="rest" data-id="${sel.id}">${n && !sel.moved ? "Ne pas bouger" : "Terminer pour cette créature"}</button></div>`;
      } else body = `<p class="hint">Touchez une créature pour la déplacer puis attaquer${left ? ` (${left} peuvent agir)` : ""}.</p>`;
      acts = `<button data-a="actAll" class="primary">Tout résoudre et finir le tour</button>`;
    } else if (ph === "D_draw") {
      // pioche de la colonie (Oni, 07/11/2026) : une tuile à la fois, dans la pioche choisie
      const max = SF.handSize(S), CAT_HINT = { renfort: "murs, Épines, Renforcé (camouflés)", actif: "technologies, travailleurs, Avant-postes", piege: "Mines et Siphons" };
      body = `<p class="hint">Main : <b>${S.hand.length}</b>/${max}. Encore ${max - S.hand.length} tuile${max - S.hand.length > 1 ? "s" : ""} à piocher, une à une.</p><div class="pick col">` +
        SF.TILE_CATS.map(c => { const n = SF.tilesLeft(S, c); return `<div class="pick-row${n ? "" : " off"}"><span class="pick-nm"><b>${E(SF.CAT_NAME[c])}</b><small>${E(CAT_HINT[c])} · ${n} tuile${n > 1 ? "s" : ""}</small></span><span class="step"><button data-a="tdraw" data-v="${c}"${n ? "" : " disabled"}>Piocher</button></span></div>`; }).join("") + `</div>`;
    } else if (ph === "D_main") {
      body = spellBox("sup", sh) + (UI.sel !== null && sh ? `<p class="hint"><b>${E(S.hand[UI.sel])}</b> → « Construire » dans un atelier.</p>` : UI.sel !== null ? `<p class="hint">Tuile choisie : <b>${E(S.hand[UI.sel])}</b>. Choisissez la lane de son chantier : bouton « Construire ici » dans les ateliers (panneau Colonie). La case exacte sera choisie à la fin de la construction.</p>` : "");
      acts = `<button data-a="build" class="primary">Construire</button>`;
    } else if (ph === "D_place") {
      const p = S.toPlace[0];
      body = p && sh ? `<p class="hint"><b>${E(p.tile)}</b> achevé : cliquez une case surlignée${S.toPlace.length > 1 ? ` (encore ${S.toPlace.length - 1})` : ""}.</p>` : p ? `<p class="hint"><b>${E(p.tile)}</b> est achevé en lane ${SF.LANE_NAME[p.lane]} : cliquez une case surlignée.${S.toPlace.length > 1 ? ` Encore ${S.toPlace.length - 1} bâtiment${S.toPlace.length > 2 ? "s" : ""} à poser ensuite.` : ""}</p>` : "";
    } else if (ph === "D_fire") {
      if (UI.support) {
        const c = SF.supportTargets(S, UI.support);
        body = `<p class="hint">Tourelle ${["", "I", "II"][S.supports[UI.support]]} (${SF.turretDmg(S, S.supports[UI.support])} dégâts) : ${sh ? "touchez une cible" : "touchez une créature surlignée sur le plateau, ou choisissez-la ici"}.</p><div class="choices">` +
          c.map(o => `<button data-a="fireAt" data-id="${o.id}">${E(o.name)} · ${o.hp} PV · ${posTxt(o)}</button>`).join("") + `</div>`;
      } else {
        const ready = Object.keys(S.supports).filter(k => S.supports[k] < 3 && SF.shotsLeft(S, k) > 0 && SF.supportTargets(S, k).length);
        body = ready.length ? `<p class="hint">${sh ? "Cliquez une tourelle surlignée." : "Tourelles prêtes : cliquez une tourelle surlignée sur le plateau."}</p>` : `<p class="hint">Aucune tourelle n'a de cible.</p>`;
      }
      acts = `<button data-a="autoFire">Tirs automatiques</button><button data-a="endD" class="primary">Terminer le tour</button>`;
    }
    return { p, body, acts, waiting: false };
  }
  function spellBox(kind, sh) {
    const list = S.spells.map((s, i) => [s, i]).filter(([s]) => SF.SPELLS[s].kind === kind && !(kind === "off" && s === "Famine"));
    if (UI.spell !== null) return spellTargeting(sh);
    if (!list.length) return kind === "sup" ? "" : `<p class="hint">Aucun sortilège offensif jouable.</p>`;
    if (sh) return `<div class="spells sh">` + list.map(([s, i]) => `<button data-a="spell" data-i="${i}" class="spell ${kind}" data-tip="${E(SF.SPELLS[s].text)}">${icon(spellIcon(s))}<span><b>${E(s)}</b></span></button>`).join("") + `</div>`;
    return `<div class="spells">` + list.map(([s, i]) => `<button data-a="spell" data-i="${i}" class="spell ${kind}">${icon(spellIcon(s))}<span><b>${E(s)}</b><small>${E(SF.SPELLS[s].text)}</small></span></button>`).join("") + `</div>`;
  }
  function spellTargeting(sh) {
    const name = S.spells[UI.spell];
    const cancel = `<button data-a="spellCancel">Annuler</button>`;
    const crs = list => `<div class="choices">${list.map(c => `<button data-a="spellArg" data-v="${c.id}">${E(c.name)} · ${c.hp} PV · ${posTxt(c)}</button>`).join("")}${cancel}</div>`;
    const lanes = `<div class="choices">${SF.LANES.map(l => `<button data-a="spellArg" data-v="${l}">Lane ${SF.LANE_NAME[l]}</button>`).join("")}${cancel}</div>`;
    let inner = "";
    switch (name) {
      case "Frappe orbitale": case "Salve": inner = crs(S.creatures.filter(c => SF.targetable(S, c))); break;
      case "Brouillage": inner = crs(S.creatures.filter(c => SF.targetable(S, c) && !c.acted)); break;
      case "Barrage": inner = lanes; break;
      case "Champ de stase": inner = `<p class="hint">Bâtiment à protéger ce tour (aucun dégât, pas d'Épines) :</p><div class="choices">${Object.keys(S.tiles).map(k => `<button data-a="spellArg" data-v="${k}">${E(tileLabel(k))}</button>`).join("")}${cancel}</div>`; break;
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
    return `<div class="targeting"><p class="hint"${sh ? ` data-tip="${E(SF.SPELLS[name].text)}"` : ""}><b>${E(name)}</b>${sh ? "" : ` : ${E(SF.SPELLS[name].text)}`}</p>${inner}</div>`;
  }
  // carte de sortilège en main : type, moment où le jouer, effet complet
  function spellCard(s) {
    const sp = SF.SPELLS[s];
    const when = s === "Famine" ? "Offensif · au début du tour de l'essaim, avant qu'il calcule son budget"
      : sp.kind === "off" ? "Offensif · pendant le tour de l'essaim, juste avant ses attaques"
      : "Soutien · pendant votre tour, avant de passer aux tirs";
    return `<div class="spell ${sp.kind} card">${icon(spellIcon(s))}<span><b>${E(s)}</b><small class="when">${E(when)}</small><small>${E(sp.text)}</small><small class="lost">Reste en main tant qu'il n'est pas joué.</small></span></div>`;
  }
  const spellIcon = s => ({ "Frappe orbitale": "frappe", "Salve": "salve", "Barrage": "lane", "Onde de choc": "couronne", "Champ de stase": "stase", "Famine": "famine", "Brouillage": "brouillage", "Effort": "effort", "Cadence": "cadence", "Feu nourri": "tourelle", "Réparation": "reparation", "Renouvellement": "renouvellement", "Reconversion": "reconversion" }[s]);
  const capIcon = c => ({ vision: "vision", soin: "soin", fureur: "fureur", butin: "biomasse", percee: "percee", cuirasse: "renforce", sabotage: "sabotage", spores: "spores" }[c] || "aura");
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
    // créature choisie en phase d'attaque : cases où elle peut aller, cibles qu'elle peut attaquer
    const mover = S.phase === "A_attack" && S.view === "essaim" ? S.creatures.find(c => c.id === UI.selCreature && !c.acted) : null;
    const R = mover ? SF.reachable(S, mover) : {}, T = mover ? SF.strikeTargets(S, mover) : [];
    const mvAttr = k => R[k] ? ` data-a="moveTo" data-u="${R[k].u}" data-k="${R[k].k}"` : "";
    // portée des tourelles (supports I et II) : les 8 cases autour ; repère affiché sur les cases sans bâtiment (PC)
    const RNG = {};
    for (const [sk, l] of Object.entries(S.supports)) if (l < 3) {
      const [sx, sy] = SF.parse(sk);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (dx || dy) { const kk = SF.key(sx + dx, sy + dy); RNG[kk] = (RNG[kk] || 0) + 1; }
    }
    const rng = k => RNG[k] && !S.tiles[k] ? `<span class="rng" title="À portée de ${RNG[k]} tourelle${RNG[k] > 1 ? "s" : ""}">${icon("tourelle")}${RNG[k] > 1 ? `<b>${RNG[k]}</b>` : ""}</span>` : "";
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
        html += `<div class="cell entry lane-${lane}${hot ? " hot" : ""}${R[k] ? " mv" : ""}" data-xy="${k}" ${hot ? `data-a="deployAt" data-l="${lane}" data-u="${u}"` : mvAttr(k)}><span class="col">${SF.COLS[u + 2]}</span>${rng(k)}${tokens(crs)}</div>`;
        continue;
      }
      if (x === 0 && y === 0) {
        html += `<div class="cell core ${imCls("Fusée")}${T.includes("fusee") ? " atk" : ""}" data-xy="${k}"${T.includes("fusee") ? ` data-a="strike" data-k="fusee"` : ""}>${icon("fusee")}<b>${S.floors}/12</b><small>${S.workersBase} trav.</small></div>`;
        continue;
      }
      if (SF.isSupportCell(x, y)) {
        const lvl = S.supports[k];
        const ready = S.phase === "D_fire" && S.view === "colonie" && lvl && lvl < 3 && SF.shotsLeft(S, k) > 0 && SF.supportTargets(S, k).length;
        const fired = lvl && lvl < 3 && SF.shotsLeft(S, k) <= 0;
        html += lvl ? `<div class="cell sup ${imCls("support " + lvl)}${ready ? " hot" : ""}${UI.support === k ? " sel" : ""}${fired ? " spent" : ""}" data-xy="${k}" ${ready ? `data-a="support" data-k="${k}"` : ""}>
            <span class="lv">${["", "I", "II", "III"][lvl]}</span>${lvl < 3 ? icon("tourelle") + `<b>${SF.turretDmg(S, lvl)}</b>` : icon("travailleur") + `<b>+${SF.SUP3_WORKERS}</b>`}</div>`
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
          const ep = SF.epinesOf(S, k, S.view === "essaim");
          inner = `<div class="tile ${imCls(t.name)}${t.camo && !t.revealed ? " trap" : ""}" title="${t.camo && !t.revealed ? "Camouflée : l'essaim ne la voit pas" : ""}"><span class="tn">${E(short(t.name))}</span><b class="hp">${t.hp}<small>/${t.max}</small></b>
            <span class="tb">${ep ? icon("epines") + ep : ""}${t.ren ? icon("renforce") + t.ren : ""}${t.tech ? icon("tech") + t.tech : ""}${t.temp ? icon("temp") : ""}${t.trap ? icon("piege") + t.trap : ""}${t.siphon ? icon("biomasse") + t.siphon : ""}${t.shield ? `<span class="shield-tk" title="Bouclier : la prochaine attaque ne lui fait rien">${icon("protection")}</span>` : ""}</span></div>`;
        }
      }
      const stased = S.stase.includes(k);
      // soutien choisi en déploiement : parachutage sur n'importe quelle case libre (Oni, 07/11/2026)
      const [pu, pk] = SF.toLocal(lane, x, y);
      const drop = !t && S.phase === "A_deploy" && S.view === "essaim" && UI.sel && !UI.sap && SF.canDeploy(S, cardOf(UI.sel), lane) && SF.canDrop(S, cardOf(UI.sel).name, lane, pu, pk);
      const atk = !target && T.includes(k);
      html += `<div class="cell lane lane-${lane} r${r}${target || drop ? " hot" : ""}${R[k] ? " mv" : ""}${atk ? " atk" : ""}${stased ? " stase" : ""}" data-xy="${k}" ${target ? `data-a="placeAt" data-k="${k}"` : drop ? `data-a="deployAt" data-l="${lane}" data-u="${pu}" data-k="${pk}"` : atk ? `data-a="strike" data-k="${k}"` : mvAttr(k)}>${inner}${rng(k)}${tokens(crs)}</div>`;
    }
    return `<div class="board ${imCls("Champ de bataille")}" role="grid" aria-label="Plateau">${html}</div>
      <div class="legend"><span><i class="sw lane-N"></i>Nord</span><span><i class="sw lane-E"></i>Est</span><span><i class="sw lane-S"></i>Sud</span><span><i class="sw lane-O"></i>Ouest</span><span>Lettres : colonnes d'entrée</span></div>`;
  }
  // Carte de tuile en main : durée, PV, Épines et capacités (libellés du Catalogue du livret v0.3)
  function tileCard(name) {
    const t = SF.TILES[name], L = SF.LANE_NAME;
    const pv = t.pv === "ap" ? `2 (4 en lane ${L[t.dir]})` : t.pv === "front" ? "2 à 4" : t.pv === "reduit" ? "2 à 4" : t.pv;
    const caps = [];
    const cap = (ic, n, txt) => caps.push(`<span class="cap" tabindex="0" data-tip="${E(n + " : " + txt)}">${icon(ic)}${E(n)}</span>`);
    if (t.aura) cap("epines", "Aura d'épines", "+1 Épines à chaque bâtiment des 8 cases autour (cumulable).");
    if (t.pv === "ap") cap("cardinal", "Avant-poste", `+2 PV si posé dans la lane ${L[t.dir]} (4 PV), sinon 2 PV.`);
    if (t.pv === "front") cap("couronne", "Ligne de front", "PV = 1 + couronne (2 / 3 / 4) : plus solide loin de la fusée.");
    if (t.pv === "reduit") cap("couronne", "Réduit", "PV = 5 − couronne (4 / 3 / 2) : plus solide près de la fusée.");
    if (t.ren) cap("renforce", `Renforcé ${t.ren}`, `ne perd 1 PV que par tranche complète de ${t.ren} dégâts d'une même attaque.`);
    if (t.tech) cap("tech", `+${t.tech} technologie${t.tech > 1 ? "s" : ""}`, "compte dans votre total de technologies tant que la tuile tient.");
    if (t.temp) cap("temp", "Travailleur temporaire", "+1 travailleur tant que la tuile tient.");
    if (t.perm) cap("perm", "Travailleur permanent", "+1 travailleur gagné à la construction, conservé même si la tuile tombe.");
    if (t.camo) cap("piege", "Camouflage", "posée face cachée : l'essaim ne la voit pas. Retournée à la première attaque, ou révélée par un Œil-sonde vivant dans sa lane ou par la Clairvoyance.");
    if (t.siphon) cap("biomasse", `Siphon ${t.siphon}`, `révélé par une attaque de l'essaim, il lui retire ${t.siphon} biomasse (jamais sous ${SF.MIN_BIOMASS}). Ne se déclenche pas s'il a été vu par Vision ou Clairvoyance.`);
    if (t.shield) cap("protection", "Bouclier", "arrive avec un jeton : la prochaine attaque ne lui fait rien (comme en stase : la percée et les spores passent, pas d'Épines), puis le jeton est défaussé.");
    if (t.trap) cap("piege", `Mine ${t.trap}`, `${t.trap} dégât${t.trap > 1 ? "s" : ""} à la créature qui la révèle en l'attaquant, avant qu'elle frappe (si elle en meurt, elle ne frappe pas). Un piège rendu visible par Vision ou Clairvoyance ne se déclenche plus.`);
    if (t.ep) cap("epines", `Épines ${t.ep}`, `${t.ep} dégât${t.ep > 1 ? "s" : ""} à la créature qui l'attaque, après son attaque (+1 par Avant-poste dans les 8 cases autour).`);
    return `<span class="art ${imCls(name)}">${imCls(name) ? "" : icon("mur")}</span><b>${E(name)}</b><small>${icon("duree")} ${t.d} point${t.d > 1 ? "s" : ""} de construction</small>
      <span class="stats">${icon("pv")} ${pv} PV${t.ep ? ` · ${icon("epines")} Épines ${t.ep}` : ""}</span><span class="caps">${caps.join("")}</span>`;
  }
  // illustration d'une tuile, d'un support ou d'une créature : classe CSS « im im-… » ajoutée au build (vide si pas d'image)
  const imCls = n => (typeof IMG_CLASS !== "undefined" && IMG_CLASS[n]) || "";
  const short = n => ({ "Haie d'épines": "Haie", "Mur hérissé": "Hérissé", "Avant-poste du Nord": "Poste N", "Avant-poste de l'Est": "Poste E", "Avant-poste du Sud": "Poste S", "Avant-poste de l'Ouest": "Poste O", "Ligne de front": "Front", "Observatoire": "Observ.", "Laboratoire": "Labo", "Baraquement": "Baraq." }[n] || n);
  function tokens(crs) {
    if (!crs.length) return "";
    return `<div class="toks" style="--n:${Math.ceil(Math.sqrt(crs.length))}">` + crs.map(c => {
      const t = SF.CREATURES[c.name].type;
      // tourelle choisie : toucher une créature à portée la vise directement (Oni, 04/11/2026)
      const tgt = S.phase === "D_fire" && UI.support && SF.supportTargets(S, UI.support).includes(c);
      const cls = `tok ${t} ${imCls(c.name)}${UI.selCreature === c.id ? " sel" : ""}${S.phase === "A_attack" ? (SF.canAct(S, c) ? (S.view === "essaim" ? " go" : "") : " done") : ""}${c.new ? " new" : ""}${tgt ? " tgt" : ""}`;
      const au = auraOf(c);
      return `<button class="${cls}" data-a="${tgt ? "fireAt" : "creature"}" data-id="${c.id}" title="${E(c.name)}${au ? " · " + au.txt : ""}${tgt ? " : tirer dessus" : ""}">${au ? (crs.length === 1 && au.lab.length ? `<i class="au ${au.kind} lab">${au.lab.map(l => `<span>${E(l)}</span>`).join("")}</i>` : `<i class="au ${au.kind}">${icon(au.icon)}</i>`) : ""}<span class="ta">${SF.effAtq(S, c)}</span><span class="tp">${c.hp + SF.bonusHp(S, c)}</span></button>`;
    }).join("") + `</div>`;
  }
  // effet court de chaque aura ou capacité de soutien (pastilles, Oni 06/11/2026) : « +1 ATQ », « +1 DEF », « +2 HEAL »…
  const FX_LABEL = {
    soin: () => ["+2 HEAL"], fureur: () => ["+2 ATQ"], butin: () => ["+1 BIO"], percee: () => ["PERCÉE"],
    cuirasse: () => ["ANTI-ÉPINES"], spores: () => ["+2 SPORES"], vision: () => ["VISION"], sabotage: () => ["SABOTAGE"],
    mue: () => ["+1 MOV", "+1 DEF"], griffes: () => ["+1 ATQ"], regeneration: () => ["+2 HEAL"], frenesie: () => ["×2 ATQ"],
  };
  // somme des effets identiques (« +1 ATQ » deux fois → « +2 ATQ »)
  function sumLabels(list) {
    const n = {}, other = [];
    for (const l of list) { const m = /^\+(\d+) (.+)$/.exec(l); if (m) n[m[2]] = (n[m[2]] || 0) + Number(m[1]); else if (!other.includes(l)) other.push(l); }
    return [...Object.entries(n).map(([u, v]) => `+${v} ${u}`), ...other];
  }
  // effets donnés par un soutien : sa capacité (si c'est une aura) et les améliorations de soutien acquises
  function givenLabels(c) {
    const b = SF.CREATURES[c.name]; if (b.type !== "soutien") return [];
    const out = AURA_CAPS.includes(b.cap) ? FX_LABEL[b.cap]() : [];
    const u = S.upgrades.soutien;
    for (const r of ["r1", "r2"]) if (u[r] && UP_AURA[r][u[r]]) out.push(...FX_LABEL[UP_AURA[r][u[r]]]());
    return out;
  }
  // aura d'une créature (jetons) : un soutien qui en donne une (icône blanche), ou une créature qui en profite (icône violette)
  const AURA_CAPS = ["soin", "fureur", "butin", "percee", "cuirasse", "spores"];
  const UP_AURA = { r1: { A: "mue", B: "griffes" }, r2: { A: "regeneration", B: "frenesie" } };
  function auraGiven(c) { // icône et nom de l'aura donnée par ce soutien, ou null
    const b = SF.CREATURES[c.name]; if (b.type !== "soutien") return null;
    if (AURA_CAPS.includes(b.cap)) return { icon: capIcon(b.cap), name: b.capName };
    const u = S.upgrades.soutien;
    for (const r of ["r1", "r2"]) if (u[r] && UP_AURA[r][u[r]]) return { icon: UP_AURA[r][u[r]], name: SF.TREES.soutien[u[r] + r[1]][0] };
    return null;
  }
  function auraOf(c) {
    const g = auraGiven(c);
    if (g) return { kind: "give", icon: g.icon, txt: `donne : ${g.name}`, lab: sumLabels(givenLabels(c)) };
    const got = SF.caseMates(S, c).map(auraGiven).filter(Boolean);
    if (!got.length) return null;
    const icons = [...new Set(got.map(x => x.icon))];
    return { kind: "get", icon: icons.length === 1 ? icons[0] : "aura", txt: `profite de : ${[...new Set(got.map(x => x.name))].join(", ")}`,
      lab: sumLabels(SF.caseMates(S, c).flatMap(givenLabels)) };
  }
  function detail(id) {
    const c = S.creatures.find(o => o.id === (id === undefined ? UI.selCreature : id));
    if (!c) return `<p class="detail empty">Touchez une créature pour voir sa carte.</p>`;
    const b = SF.CREATURES[c.name];
    const extras = [];
    { const v = SF.speedOf(S, c); if (v > 1) extras.push(`${v} cases par tour (${[SF.baseSpeed(c) > 1 ? "niveau 3 : vitesse de base 2" : "", SF.hasMobility(S, c) ? "Mobilité" : "", S.upgrades.soutien.r1 === "A" && SF.caseMates(S, c).some(o => SF.CREATURES[o.name].type === "soutien") ? "Aura Mobilité (Mue)" : ""].filter(Boolean).join(" + ")})`); }
    if (SF.isStealthy(S, c)) extras.push("Furtivité");
    if (c.jammed) extras.push("brouillée ce tour : ne bouge pas et n'attaque pas");
    if (SF.caseMates(S, c).some(o => o.name === "Perforeur")) extras.push("Percée");
    let actions = "";
    // Frénésie : chaque soutien double les dégâts d'une autre créature de sa case, au choix de l'essaim (cumulable)
    if (b.type === "soutien" && S.upgrades.soutien.r2 === "B") {
      const cur = SF.frenzyOf(S, c), others = S.creatures.filter(o => o !== c && SF.posKey(o) === SF.posKey(c));
      const canSet = S.view === "essaim" && ["A_deploy", "A_upgrade", "A_attack"].includes(S.phase) && !c.acted;
      actions += `<p>Frénésie : ${cur ? `double les dégâts ${/^[AEIOUYÉÈÊŒ]/i.test(cur.name) ? "d'" : "de "}${E(cur.name)}` : "aucune autre créature sur sa case"}.</p>`;
      if (canSet && others.length > 1) actions += `<div class="choices"><span class="lab">Frénésie sur :</span>${others.map(o => `<button data-a="frenzy" data-id="${c.id}" data-v="${o.id}"${cur === o ? ` class="on" aria-pressed="true"` : ""}>${E(o.name)} · ATQ ${SF.effAtq(S, o)}</button>`).join("")}</div>`;
    }
    return `<section class="detail ${b.type}"><div class="d-head">${icon(b.type)}<b>${E(c.name)}</b><span>${b.type} · niveau ${["", "I", "II", "III"][b.lvl]}</span></div>
      <p>${icon("atq")} ATQ ${SF.effAtq(S, c)}${SF.attacks(c) ? "" : " (n'attaque pas : avance avec l'essaim)"} · ${icon("pv")} PV ${c.hp + SF.bonusHp(S, c)}/${SF.maxHp(S, c.name)} · ${posTxt(c)}</p>
      ${b.cap ? `<p class="capline">${icon(capIcon(b.cap))}<span><b>${E(b.capName)}</b> : ${E(b.capText)}</span></p>` : ""}${extras.length ? `<p>Gagne : ${extras.join(", ")}.</p>` : ""}${actions}</section>`;
  }

  // ---------------------------------------------------------------- panneaux
  // ateliers de la colonie : une ligne par lane (emplacements de chantier + travailleurs affectés) ;
  // pc : toujours 2 emplacements, le second verrouillé tant que le palier 6 n'est pas atteint
  function ateliersHtml(mine, pc) {
    let out = "";
    for (const l of SF.LANES) {
      const chs = S.chantiers[l];
      const n = pc ? Math.max(2, S.chPerLane) : S.chPerLane;
      const slots = Array.from({ length: n }, (_, i) => {
        const ch = chs[i];
        if (i >= S.chPerLane) return `<div class="slot empty lock" title="Second chantier au palier 6 de la fusée">${pc ? icon("fusee") + "6" : ""}</div>`;
        if (!ch) return mine && S.phase === "D_main" && UI.sel !== null && UI.spell === null && chs.length < S.chPerLane
          ? `<button data-a="startCh" data-l="${l}" class="slot empty go">${pc ? `Construire<small>${E(short(S.hand[UI.sel]))}</small>` : `Construire ici : ${E(S.hand[UI.sel])}`}</button>` : `<div class="slot empty">libre</div>`;
        const hide = !ch.tile || (SF.TILES[ch.tile].camo && !mine);
        const x = mine && ch.fresh && S.phase === "D_main" ? ` <button data-a="cancelCh" data-l="${l}" data-i="${i}" class="x" aria-label="Annuler">×</button>` : "";
        return pc ? `<div class="slot" title="${E(hide ? "Tuile cachée" : ch.tile)} : ${ch.left} point${ch.left > 1 ? "s" : ""} restant${ch.left > 1 ? "s" : ""}"><span class="sn">${E(hide ? "?" : short(ch.tile))}</span><b>${ch.left}</b>${x}</div>`
          : `<div class="slot">${E(hide ? "?" : ch.tile)} · ${ch.left} pt${ch.left > 1 ? "s" : ""}${x}</div>`;
      }).join("");
      const step = mine && S.phase === "D_main" ? `<span class="step"><button data-a="alloc" data-l="${l}" data-d="-1" aria-label="Retirer un point">−</button><b>${S.alloc[l]}</b><button data-a="alloc" data-l="${l}" data-d="1" aria-label="Ajouter un point">+</button></span>` : `<b class="pts">${S.alloc[l]}</b>`;
      out += `<div class="atelier lane-${l}"><span class="al">${l}</span><div class="slots">${slots}</div>${mine || !pc ? step : ""}</div>`;
    }
    return out;
  }
  const tileHandHtml = mine => mine
    ? `<div class="hand">${S.hand.map((t, i) => `<button data-a="tile" data-i="${i}" class="tcard${UI.sel === i ? " sel" : ""}"${S.phase === "D_main" ? "" : " disabled"}>${tileCard(t)}</button>`).join("")}</div>`
    : `<p class="hidden-hand">${S.hand.length} tuiles en main (cachées)</p>`;
  const spellsHtml = mine => mine ? (S.spells.length ? `<div class="spells">${S.spells.map(s => spellCard(s)).join("")}</div>` : `<span class="muted">aucun</span>`) : `<span class="muted">${S.spells.length} en main (cachés)</span>`;
  function colonyPanel() {
    const mine = S.view === "colonie";
    const pts = SF.totalPoints(S), used = SF.allocated(S);
    const floors = Array.from({ length: 12 }, (_, i) => `<i class="fl${i < S.floors ? " on" : ""}${[2, 5, 8, 11].includes(i) ? " ms" : ""}" tabindex="0" data-tip="${E(floorTip(i + 1))}">${i + 1}</i>`).join("");
    return `<h3>${icon("fusee")} Colonie</h3>
      <div class="kv"><span>Travailleurs</span><b>${S.workersBase}${SF.bonusWorkers(S) ? ` + ${SF.bonusWorkers(S)}` : ""}</b></div>
      <div class="kv"><span>Technologies</span><b>${SF.tech(S)} → ${SF.spellsPerTurn(S)} sort./tour</b></div>
      <div class="floors">${floors}</div><p class="small">Fusée : ${S.floors}/12 étages · ${S.rocketPts}/${SF.floorCost(S)} points vers le suivant. Un étage coûte 2 points (étages 1 à 3), puis 4, 6 et 8 après les paliers 3 · 6 · 9.</p>
      <h4 data-fx="ateliers">Ateliers ${mine && S.phase === "D_main" ? `<span class="small">points ${used}/${pts} · fusée ${pts - used}</span>` : ""}</h4>${ateliersHtml(mine, false)}
      <h4 data-fx="tilehand">Main de tuiles</h4>${tileHandHtml(mine)}<h4>Sortilèges</h4>${spellsHtml(mine)}`;
  }
  const acquiredUps = ty => { // améliorations acquises pour ce type
    const u = S.upgrades[ty], out = [];
    if (u.r1) out.push(SF.TREES[ty][u.r1 + "1"]);
    if (u.r2) out.push(SF.TREES[ty][u.r2 + "2"]);
    return out;
  };
  function swarmHandHtml(mine, sh) {
    if (!mine) return `<p class="hidden-hand">${S.handA.length} cartes en main (cachées)</p>`;
    if (!S.handA.length) return `<p class="muted">Pas de cartes en main.</p>`;
    return `<div class="hand">${S.handA.map(c => {
      const b = SF.CREATURES[c.name];
      const atq = SF.baseAtq(S, c.name), pv = SF.maxHp(S, c.name);
      if (sh) { // mots-clés seulement, le détail au survol (comme les tuiles)
        const capLab = b.cap ? (FX_LABEL[b.cap] ? FX_LABEL[b.cap]() : [b.capName]) : [];
        const chips = capLab.map(l => `<span class="cap" tabindex="0" data-tip="${E(b.capName + " : " + b.capText)}">${icon(capIcon(b.cap))}${E(l)}</span>`).join("")
          + acquiredUps(b.type).map(([n, txt]) => `<span class="cap up" tabindex="0" data-tip="${E(n + " : " + txt)}">${icon("palier")}${E(n)}</span>`).join("");
        return `<button data-a="card" data-uid="${c.uid}" class="ccard sh ${b.type}${c.free ? " free" : ""}${UI.sel === c.uid ? " sel" : ""}"${S.phase === "A_deploy" ? "" : " disabled"}><span class="cost">${c.free ? "0" : b.cost}</span>${imCls(c.name) ? `<span class="thumb ${imCls(c.name)}"></span>` : ""}
          <b>${E(c.name)}</b><small>${b.type} · niveau ${b.lvl}${c.free ? " · gratuit" : ""}</small>
          <span class="stats"><span class="st atq">${icon("atq")}${b.type === "soutien" ? 0 : atq}</span><span class="st pv">${icon("pv")}${pv}</span></span>${chips ? `<span class="caps">${chips}</span>` : ""}</button>`;
      }
      const ups = acquiredUps(b.type).map(([n, txt]) => `<span class="upline">${icon("palier")}<span><b>${E(n)}</b> : ${E(txt)}</span></span>`).join("");
      return `<button data-a="card" data-uid="${c.uid}" class="ccard ${b.type}${c.free ? " free" : ""}${UI.sel === c.uid ? " sel" : ""}"${S.phase === "A_deploy" ? "" : " disabled"}><span class="cost">${c.free ? "0" : b.cost}</span>${imCls(c.name) ? `<span class="thumb ${imCls(c.name)}"></span>` : ""}
        <b>${E(c.name)}</b><small>${b.type} · niveau ${b.lvl}${c.free ? " · gratuit" : ""}</small>
        <span class="stats">${b.type === "soutien" ? `${icon("atq")} 0 ATQ <em>(n'attaque pas)</em>` : `${icon("atq")} ${atq} ATQ${atq !== b.atq ? ` <em>(base ${b.atq})</em>` : ""}`} · ${icon("pv")} ${pv} PV${pv !== b.pv ? ` <em>(base ${b.pv})</em>` : ""}</span>
        ${b.cap ? `<span class="capline">${icon(capIcon(b.cap))}<span><b>${E(b.capName)}</b> : ${E(b.capText)}</span></span>` : `<span class="capline none">Aucune capacité propre.</span>`}${ups}</button>`;
    }).join("")}</div>`;
  }
  // arbres d'amélioration (maquette d'Oni, 06/11/2026) : une carte par nœud — icône ronde à gauche, côté et nom en haut,
  // effet au centre, barre d'investissement « 2/6 » en bas ; toucher une carte ouverte y investit tout ce qui est possible
  // fond de l'icône de chaque nœud (Oni, 06/11/2026) : visage d'une créature que ce rang ajoute à la pioche
  // (rang 1 → niveau 2, rang 2 → niveau 3)
  const NODE_FACE = {
    aggro: { A1: "Ravageur", B1: "Ravageur", A2: "Massacreur", C2: "Massacreur", B2: "Massacreur" },
    tank: { A1: "Béhémoth", B1: "Béhémoth", A2: "Colosse", C2: "Colosse", B2: "Colosse" },
    soutien: { A1: "Phéromone", B1: "Perforeur", A2: "Sapeur", C2: "Sporeur", B2: "Sapeur" },
  };
  function treesHtml(mine) {
    let trees = "";
    const POS = { A1: "Côté A", B1: "Côté B", A2: "Après A", C2: "Centre", B2: "Après B" };
    for (const ty of ["aggro", "tank", "soutien"]) {
      const u = S.upgrades[ty], T = SF.TREES[ty];
      const node = slot => {
        const st = SF.nodeState(S, ty, slot), cost = SF.nodeCost(slot), got = SF.invested(S, ty, slot);
        const avail = SF.investable(S);
        const canInv = mine && st === "open" && avail > 0 && ["A_deploy", "A_upgrade"].includes(S.phase);
        let state;
        if (st === "taken") state = "Acquis";
        else if (st === "closed") state = got ? "Fermé" : (u.r1 && !slot.endsWith("1") && slot !== "C2" && u.r1 !== slot[0] ? `Fermé : demande ${T[slot[0] + "1"][0]}` : "Fermé : biomasse déjà engagée sur l'autre choix de ce rang");
        else if (st === "needR1") state = "Demande d'abord un rang 1";
        else state = canInv ? `Toucher pour investir ${Math.min(avail, cost - got)}` : `${got} / ${cost} investis`;
        const pct = st === "taken" ? 100 : Math.round(100 * got / cost);
        const inv = canInv ? ` data-a="invest" data-t="${ty}" data-s="${slot}" data-n="99" role="button" tabindex="0"` : "";
        return `<div class="node ucard ${st}${canInv ? " can" : ""}" data-node="${ty}:${slot}"${inv} title="${E(state)}">
          <span class="uc-ic ${imCls("Visage " + NODE_FACE[ty][slot])}"></span>
          <span class="uc-body"><span class="uc-bgic" aria-hidden="true">${icon(NODE_ICON[ty][slot])}</span><span class="uc-top"><span class="uc-pos">${POS[slot]}</span><b class="uc-name">${E(T[slot][0])}</b></span>
            <span class="uc-txt">${E(T[slot][1])}</span>
            <span class="uc-foot"><span class="bar"><i style="width:${pct}%"></i></span>${canInv && cost - got > 1 ? `<button data-a="invest" data-t="${ty}" data-s="${slot}" data-n="1" class="uc-one" title="Investir 1">+1</button>` : ""}<b class="uc-n">${st === "taken" ? "Acquis" : `${got}/${cost}`}</b></span></span></div>`;
      };
      trees += `<div class="utree2 ${ty}"><span class="tt">${icon(ty)}${ty}<small>rang 1 : ${SF.COST_R1} · rang 2 : ${SF.COST_R2}</small></span>
        <div class="ur1">${node("A1")}${node("B1")}</div><div class="ur2">${node("A2")}${node("C2")}${node("B2")}</div></div>`;
    }
    return trees;
  }
  function swarmPanel() {
    const mine = S.view === "essaim";
    const t = SF.TIERS[SF.tier(S)];
    return `<h3>${icon("spores")} Essaim</h3>
      <div class="kv"><span>Biomasse</span><b>${S.biomass}</b></div>
      <div class="kv"><span>Palier</span><b>${SF.tier(S) + 1} · pioche ${SF.tierCards(SF.tier(S))} cartes · plafond ${SF.capOf(S)}</b></div>
      <div class="kv" data-fx="budget"><span>Budget du tour</span><b>${S.budget}${S.famine ? " (Famine : biomasse ÷ 2)" : ""}</b></div>
      <div class="kv"><span>Réserve (non investie)</span><b>${S.reserve}</b></div>
      <div class="kv"><span>Pioches N1 / N2 / N3</span><b>${S.piles[1].length} / ${S.piles[2].length} / ${S.piles[3].length}</b></div>
      <h4>Main</h4>${swarmHandHtml(mine)}<h4>Arbres d'amélioration</h4>${treesHtml(mine)}`;
  }
  // ================================================================ mise en page PC (Oni, 06/11/2026)
  // Écran ≥ 1100 px : plateau sur toute la hauteur, panneau du joueur d'un côté, résumé de l'adversaire de l'autre
  // (colonie toujours à gauche, essaim toujours à droite), menu escamotable en haut, rien ne fait défiler la page.
  const PC_MQ = window.matchMedia ? matchMedia("(min-width: 1100px) and (min-height: 620px)") : null;
  const isPC = () => !!(PC_MQ && PC_MQ.matches);
  if (PC_MQ && PC_MQ.addEventListener) PC_MQ.addEventListener("change", () => render());
  // étapes du tour de chaque camp (chevrons) ; la réaction de la colonie a lieu pendant le tour de l'essaim
  const PC_STEPS = {
    essaim: [["A_deploy", "Déployer & améliorer"], ["A_attack", "Attaques"]],
    colonie: [["A_react", "Réaction"], ["D_main", "Construction"], ["D_place", "Pose"], ["D_fire", "Tirs"]],
  };
  function pcSteps(side) {
    const ph = S.phase === "A_famine" ? "A_react" : S.phase === "A_upgrade" || S.phase === "A_start" ? "A_deploy" : S.phase === "D_draw" ? "D_main" : S.phase;
    const steps = PC_STEPS[side], cur = steps.findIndex(s => s[0] === ph);
    const items = steps.map(([k, n], i) => `<li class="${i === cur ? "on" : cur > i && !(side === "colonie" && i === 0) ? "done" : ""}"><span>${E(n)}</span></li>`).join("");
    return `<div class="pc-steps ${side}${cur < 0 ? " idle" : ""}"><ol class="chev">${items}</ol>${cur < 0 ? `<p class="small">Tour de ${E(SIDE[side === "essaim" ? "colonie" : "essaim"])}</p>` : ""}</div>`;
  }
  // fusée horizontale (étage 1 à gauche) ; grid : 6 × 2 dans le résumé étroit ; info-bulle de chaque étage
  function pcRocket(grid) {
    const fl = Array.from({ length: 12 }, (_, i) => {
      const n = i + 1, on = n <= S.floors, cur = n === S.floors + 1;
      const fill = cur ? Math.round(100 * S.rocketPts / SF.floorCost(S)) : 0;
      return `<i class="fl${on ? " on" : ""}${n % 3 === 0 ? " ms" : ""}${cur ? " cur" : ""}" tabindex="0" data-tip="${E(floorTip(n))}"${cur ? ` style="--p:${fill}%"` : ""}>${n}</i>`;
    }).join("");
    return `<div class="pc-rocket${grid ? " grid" : ""}" aria-label="Fusée : ${S.floors} étages sur 12"><span class="rk-lab">${icon("fusee")}<b>${S.floors}</b>/12 · ${S.rocketPts}/${SF.floorCost(S)} pts</span><div class="floors h">${fl}</div></div>`;
  }
  // logo d'un camp (Oni, 06/11/2026) : silhouette en masque CSS, à la couleur du camp
  const sideLogo = side => `<span class="logo-mk ${side}" aria-hidden="true"></span>`;
  // nom du camp dans la police du jeu (Ethnocentric, rendue en image : masque CSS, couleur du texte)
  const sideName = side => `<span class="side-nm ${side}" role="img" aria-label="${side === "essaim" ? "Essaim" : "Colonie"}"></span>`;
  const bigStat = (n, lab, tip, cls = "") => `<div class="pc-big ${cls}" tabindex="0" data-tip="${E(tip)}"><b>${n}</b><span>${lab}</span></div>`;
  const box2 = (n, lab, tip, extra = "") => `<div class="pc-box" tabindex="0" data-tip="${E(tip)}"${extra}><b>${n}</b><span>${lab}</span></div>`;
  // zone d'action du panneau du joueur : étape en cours (explication au survol de ⓘ), consigne courte et choix ; boutons en bas
  function pcAction(side) {
    if (S.winner) return { top: "", acts: "" };
    const { p, body, acts, waiting } = phaseParts(true);
    const head = `<div class="ph-head"><span class="dot ${p[0]}"></span><b>${E(p[1])}</b><span class="info" tabindex="0" data-tip="${E(p[2])}">i</span></div>`;
    if (waiting) return { top: `<section class="phase ${p[0]} waiting">${head}<p class="hint">En attente de votre adversaire…</p></section>`, acts: "" };
    return { top: `<section class="phase ${p[0]}">${head}${body}</section>`, acts: p[0] === side || !online() ? acts : "" };
  }
  function pcSwarmOwn() {
    const t = SF.TIERS[SF.tier(S)], next = SF.TIERS[SF.tier(S) + 1];
    const deploy = S.phase === "A_deploy";
    const full = S.famine ? SF.famineBudget(S.biomass) : S.biomass; // budget du tour (Famine : biomasse ÷ 2)
    const { top } = pcAction("essaim");
    const big = deploy
      ? bigStat(`${S.budget}<small>/${full}</small>`, "disponible / budget", `Biomasse disponible ce tour : ${S.budget} sur un budget de ${full}${S.famine ? " (Famine : biomasse ÷ 2)" : ""}. Le reste ira à la réserve.`, "bio")
      : bigStat(S.biomass, "biomasse", `Biomasse : ${S.biomass}${next ? ` · palier suivant à ${next.min}` : " · dernier palier atteint"}`, "bio");
    return `<aside class="panel essaim pc-own">
      <div class="po-head">${sideLogo("essaim")}${sideName("essaim")}<span class="bigwrap" data-fx="budget">${big}</span></div>
      <div class="pc-boxes">
        ${box2(S.reserve, "réserve", "Réserve : biomasse non investie, gardée d'un tour à l'autre")}
        ${deploy ? box2(S.biomass, "biomasse", `Biomasse totale : ${S.biomass}${next ? ` · palier suivant à ${next.min}` : ""}`) : ""}
        ${box2(SF.tier(S) + 1, "palier", `Palier ${SF.tier(S) + 1}${next ? ` · palier suivant à ${next.min} biomasse` : ""}`)}
        ${box2(SF.capOf(S), "max / lane", "Plafond de créatures par lane")}
      </div>
      <div class="pc-lines"><span>Cartes à piocher <b>${SF.tierCards(SF.tier(S))}</b></span><span>Pioche N1 / N2 / N3 <b>${S.piles[1].length} / ${S.piles[2].length} / ${S.piles[3].length}</b></span></div>
      <div class="po-scroll">
        <h4>Main <span class="small">${S.handA.length} carte${S.handA.length > 1 ? "s" : ""}</span></h4>${swarmHandHtml(true, true)}
        <h4>Arbres d'amélioration</h4>${treesHtml(true)}
        ${logPanel()}</div>
      <div class="po-bottom">${pcSteps("essaim")}${top}</div></aside>`;
  }
  function pcColonyOwn() {
    const pts = SF.totalPoints(S), used = SF.allocated(S), bonus = SF.bonusWorkers(S);
    const { top } = pcAction("colonie");
    return `<aside class="panel colonie pc-own"><div class="po-main">
      <div class="po-head">${sideLogo("colonie")}${sideName("colonie")}
        ${bigStat(`${S.workersBase}${bonus ? `<small>+${bonus}</small>` : ""}`, "travailleurs", `Travailleurs : ${S.workersBase} de base${bonus ? ` + ${bonus} grâce aux tuiles et supports` : ""}. L'essaim gagne quand la colonie n'en a plus.`, "wk")}</div>
      ${pcRocket(false)}
      <div class="pc-boxes">
        ${box2(SF.tech(S), "techno", `Technologies : ${SF.tech(S)} → ${SF.spellsPerTurn(S)} sortilège(s) par tour`)}
        ${box2(SF.spellsPerTurn(S), "sorts / tour", "Sortilèges piochés par tour")}
        ${box2(S.spells.length, "sorts en main", "Sortilèges en main")}
      </div>
      <h4 data-fx="ateliers">Ateliers ${S.phase === "D_main" && S.view === "colonie" ? `<span class="small">points ${used}/${pts} · fusée ${pts - used}</span>` : ""}</h4>
      <div class="pc-ateliers">${ateliersHtml(S.view === "colonie", true)}</div>
      <div class="po-scroll">
        <h4 data-fx="tilehand">Main de tuiles <span class="small">${S.hand.length} tuile${S.hand.length > 1 ? "s" : ""}</span></h4>${tileHandHtml(true)}
        <h4>Sortilèges</h4>${spellsHtml(true)}
        ${logPanel()}</div>
      <div class="po-bottom">${pcSteps("colonie")}${top}</div></div></aside>`;
  }
  // résumé de la colonie vu par l'essaim (colonne de gauche)
  function pcColonySum() {
    const bonus = SF.bonusWorkers(S);
    const at = SF.LANES.map(l => {
      const chs = S.chantiers[l];
      const blocks = Array.from({ length: Math.max(2, S.chPerLane) }, (_, i) => {
        if (i >= S.chPerLane) return `<span class="slot empty lock" title="Second chantier au palier 6"></span>`;
        const ch = chs[i]; if (!ch) return `<span class="slot empty"></span>`;
        const hide = !ch.tile || SF.TILES[ch.tile].camo;
        return `<span class="slot" tabindex="0" data-tip="${E(`${hide ? "Tuile cachée" : ch.tile} : ${ch.left} point${ch.left > 1 ? "s" : ""} restant${ch.left > 1 ? "s" : ""}`)}"><span class="sn">${E(hide ? "?" : short(ch.tile))}</span><b>${ch.left}</b></span>`;
      }).join("");
      return `<div class="atelier lane-${l}"><span class="al">${l}</span><div class="slots">${blocks}</div></div>`;
    }).join("");
    return `<aside class="panel colonie mini pc-sum"><div class="ps-main">
      <h3>${sideLogo("colonie")}${sideName("colonie")}</h3>
      ${bigStat(`${S.workersBase}${bonus ? `<small>+${bonus}</small>` : ""}`, "pop.", `Travailleurs : ${S.workersBase} de base${bonus ? ` + ${bonus} grâce aux tuiles et supports` : ""}. L'essaim gagne quand la colonie n'en a plus.`, "wk")}
      <div class="ps-rows">
        <span tabindex="0" data-tip="Technologies : ${SF.tech(S)} → ${SF.spellsPerTurn(S)} sortilège(s) par tour">${icon("tech")}<b>${SF.tech(S)}</b> techno</span>
        <span tabindex="0" data-tip="${S.spells.length} sortilège(s) en main (cachés)">${icon("sort")}<b>${S.spells.length}</b> sort${S.spells.length > 1 ? "s" : ""}</span>
        <span tabindex="0" data-tip="${S.hand.length} tuiles en main (cachées)">${icon("mur")}<b>${S.hand.length}</b> tuiles</span>
      </div>
      ${pcRocket(true)}
      <h4 data-fx="ateliers">Ateliers</h4><div class="pc-ateliers sum">${at}</div></div></aside>`;
  }
  // résumé de l'essaim vu par la colonie (colonne de droite) : améliorations en grosses icônes
  function pcSwarmSum() {
    const next = SF.TIERS[SF.tier(S) + 1];
    const turn = ["A_deploy", "A_upgrade", "A_attack", "A_react"].includes(S.phase);
    const POS = { A1: "rang 1, côté A", B1: "rang 1, côté B", A2: "rang 2, après A", C2: "rang 2, centre", B2: "rang 2, après B" };
    const trees = ["aggro", "tank", "soutien"].map(ty => {
      const T = SF.TREES[ty];
      const node = slot => {
        const st = SF.nodeState(S, ty, slot), cost = SF.nodeCost(slot), got = SF.invested(S, ty, slot);
        const state = st === "taken" ? "acquis" : st === "closed" ? "fermé" : st === "needR1" ? "demande d'abord un rang 1" : got ? `${got} / ${cost} investis` : `${cost} biomasse`;
        return `<span class="node un ${st}${got && st !== "taken" ? " prog" : ""}" data-node="${ty}:${slot}" tabindex="0"
          data-tip="${E(`${T[slot][0]} (${POS[slot]}) : ${T[slot][1]}\n${state}`)}">${icon(NODE_ICON[ty][slot])}<span class="bar"><i style="width:${Math.round(100 * got / cost)}%"></i></span></span>`;
      };
      return `<div class="utree ${ty}"><span class="ut">${icon(ty)}<small>${ty}</small></span><div class="ur">${node("A1")}${node("B1")}</div><div class="ur r2">${node("A2")}${node("C2")}${node("B2")}</div></div>`;
    }).join("");
    return `<aside class="panel essaim mini pc-sum"><div class="ps-main">
      <h3>${sideLogo("essaim")}${sideName("essaim")}</h3>
      ${bigStat(S.biomass, "biomasse", `Biomasse : ${S.biomass}${next ? ` · palier suivant à ${next.min}` : ""}`, "bio")}
      <div class="ps-rows">
        ${turn ? `<span data-fx="budget" tabindex="0" data-tip="Budget de ce tour${S.famine ? " (Famine : biomasse ÷ 2)" : ""}">${icon("biomasse")}<b>${S.budget}</b> budget</span>` : ""}
        <span tabindex="0" data-tip="Réserve : biomasse non investie">${icon("biomasse")}<b>${S.reserve}</b> réserve</span>
        <span tabindex="0" data-tip="Palier ${SF.tier(S) + 1} : pioche de ${SF.tierCards(SF.tier(S))} cartes">${icon("palier")}<b>${SF.capOf(S)}</b> max / lane</span>
        <span class="hidden-hand" tabindex="0" data-tip="${S.handA.length} cartes en main (cachées) · pioches ${S.piles[1].length} / ${S.piles[2].length} / ${S.piles[3].length}">${icon("sort")}<b>${S.handA.length}</b> cartes</span>
      </div>
      <h4>Améliorations</h4><div class="utrees big">${trees}</div></div></aside>`;
  }
  // plateau au centre, manche et camp qui joue dans les angles morts du haut
  // boutons de l'étape en cours : dans l'angle mort en bas du plateau, du côté du joueur
  const CHEV = "M22 40 H108 Q124 40 133 53 L249 240 Q258 256 249 272 L133 459 Q124 472 108 472 H22 Q2 472 13 455 L122 256 L13 57 Q2 40 22 40 Z";
  function pcButtons() {
    if (!S.view || S.winner || S.handoff) return "";
    const { acts } = pcAction(S.view);
    // double flèche d'Oni dessinée dans le bouton principal (une image de fond CSS ne s'affichait pas partout)
    const arrows = `<svg class="go-arr" viewBox="0 0 512 512" aria-hidden="true"><path d="${CHEV}"/><path d="${CHEV}" transform="translate(256 0)"/></svg>`;
    const html = acts.replace(/(<button [^>]*class="primary"[^>]*>)/, `$1${arrows}<span class="go-lab">`).replace(/(class="primary"[^>]*>[\s\S]*?)<\/button>/, "$1</span></button>");
    return acts ? `<div class="pc-go ${S.view === "colonie" ? "l" : "r"} ${S.view} acts">${html}</div>` : "";
  }
  function pcCenter() {
    const p = PHASE_TXT[S.phase] || ["", "", ""];
    const roundSide = S.view === "colonie" ? "l" : "r";
    const turn = S.winner ? `<b>Partie terminée</b>` : `<span class="k">À ${E(SIDE[p[0]])} de jouer</span><b>${E(p[1])}</b>`;
    return `<section class="pc-center"><div class="board-wrap">${board()}
      <div class="pc-corner ${roundSide} round"><span class="k">Manche</span><b>${S.round}</b></div>
      <div class="pc-corner ${roundSide === "l" ? "r" : "l"} turn ${p[0]}">${turn}</div>
      ${pcButtons()}
</div>${S.winner ? pcWin() : ""}${UI.pop != null && S.creatures.some(o => o.id === UI.pop) ? `<div class="cpop" role="dialog" aria-label="Détail de la créature"><button data-a="popClose" class="x close" aria-label="Fermer">×</button>${detail(UI.pop)}</div>` : ""}</section>`;
  }
  function pcLayout(bg) {
    const v = bg ? null : S.view;
    const left = v === "colonie" ? pcColonyOwn() : pcColonySum();
    const right = v === "essaim" ? pcSwarmOwn() : pcSwarmSum();
    return `<main class="pc-layout ${v === "colonie" ? "me-colonie" : v === "essaim" ? "me-essaim" : "me-none"}">${left}${pcCenter()}${right}</main>`;
  }
  // fenêtre de détail d'une créature : à côté de son jeton, sans sortir de l'écran
  function placePop() {
    const pop = $(".cpop"), tok = pop && $(`.board .tok[data-id="${UI.pop}"]`); if (!pop || !tok) return;
    const r = tok.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    let x = r.right + 12; if (x + w > innerWidth - 8) x = r.left - w - 12; x = Math.max(8, x);
    const y = Math.min(Math.max(8, r.top + r.height / 2 - h / 2), innerHeight - h - 8);
    pop.style.left = x + "px"; pop.style.top = y + "px";
  }
  // info-bulles en PC : une bulle flottante (jamais coupée par une zone défilante)
  function tipShow(el) {
    let t = $("#tipbox"); if (!t) { t = document.createElement("div"); t.id = "tipbox"; document.body.appendChild(t); }
    t.textContent = el.dataset.tip; t.hidden = false;
    const r = el.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
    let x = r.right + 10; if (x + w > innerWidth - 8) x = r.left - w - 10; if (x < 8) x = Math.min(innerWidth - w - 8, Math.max(8, r.left));
    let y = r.top + r.height / 2 - h / 2; if (x === r.left || (x > r.left && x < r.right)) y = r.bottom + 8;
    t.style.left = x + "px"; t.style.top = Math.min(Math.max(8, y), innerHeight - h - 8) + "px";
  }
  const tipHide = () => { const t = $("#tipbox"); if (t) t.hidden = true; };
  for (const ev of ["mouseover", "focusin"]) document.addEventListener(ev, e => {
    if (!document.body.classList.contains("pc")) return;
    const el = e.target.closest && e.target.closest("[data-tip]"); if (el) tipShow(el); else tipHide();
  });
  document.addEventListener("mouseout", e => { if (!e.relatedTarget || !(e.relatedTarget.closest && e.relatedTarget.closest("[data-tip]"))) tipHide(); });
  // écran de victoire (Oni, 06/11/2026) : le cadre du camp gagnant, « VICTOIRE », et le bouton pour rejouer
  function pcWin() {
    const w = S.winner;
    const sub = w === "colonie" ? "La fusée décolle, la colonie est sauvée !" : "L'essaim a décimé la colonie !";
    return `<section class="pc-ho pc-win ${w}"><div class="ho-card ho-frame ${imCls(w === "essaim" ? "Passage essaim" : "Passage colonie")} from-${w === "colonie" ? "l" : "r"}" role="dialog" aria-label="Victoire">
        <div class="hf-in"><p class="ho-k">Manche ${S.round}</p><h2>VICTOIRE</h2><p class="hf-sub">${E(sub)}</p></div>
        <button data-a="new" class="hf-go">Rejouer</button></div></section>`;
  }
  // écran de passage : la partie en fond (vue publique, sans les mains), assombrie ; la carte arrive du côté du joueur
  function pcHandoff() {
    const w = S.handoff, keep = S.view;
    S.view = "essaim"; // fond rendu comme le voit l'essaim : tuiles camouflées cachées, aucune main affichée
    let bgHtml; try { bgHtml = pcLayout(true); } finally { S.view = keep; }
    return `<div class="pc-bg" aria-hidden="true" inert>${bgHtml}</div>
      <section class="pc-ho ${w}"><div class="ho-card ho-frame ${imCls(w === "essaim" ? "Passage essaim" : "Passage colonie")} from-${w === "colonie" ? "l" : "r"}${UI.leaving ? " leave" : ""}" role="dialog" aria-label="C'est à ${SIDE[w]} de jouer">
        <div class="hf-in"><p class="ho-k">Manche ${S.round}</p><h2>C'est à ${SIDE[w]} de jouer</h2>
          <p class="ho-stat">${w === "colonie" ? `${icon("travailleur")}<b>${S.workersBase + SF.bonusWorkers(S)}</b> travailleurs` : `${icon("biomasse")}<b>${S.biomass}</b> biomasse`}</p></div>
        <button data-a="reveal" class="hf-go" aria-label="Je joue ${SIDE[w]}">${w === "colonie" ? "Je joue la colonie" : "Jouer"}</button></div></section>`;
  }
  function logPanel() {
    return `<h4>Journal</h4><ol class="log">${S.log.slice(0, 40).map(l => `<li class="${l.who}"><span>M${l.r}</span>${E(l.msg)}</li>`).join("")}</ol>`;
  }
  // Règles : trois onglets (Essaim, Colonie, Commun), générés par AIDE à partir du moteur (Oni, 04/11/2026)
  function help() {
    const tab = UI.helpTab || (S && S.view) || "commun";
    const tabs = [["essaim", "Essaim"], ["colonie", "Colonie"], ["commun", "Commun"]].map(([k, l]) => `<button data-a="helpTab" data-v="${k}" class="${tab === k ? "on" : ""}">${l}</button>`).join("");
    return `<div class="modal" role="dialog" aria-label="Règles"><div class="modal-card rules"><button data-a="help" class="x close" aria-label="Fermer">×</button>
      <h2>Règles</h2><div class="rtabs">${tabs}</div>
      <p class="small disc-line">Mode découverte : <b>${DISC ? "activé" : "désactivé"}</b> <button data-a="disc" class="ghost">${DISC ? "Désactiver" : "Activer"}</button>${DISC && SEEN.size ? ` <button data-a="discReset" class="ghost">Revoir tous les conseils</button>` : ""}</p>
      <div class="rbody">${AIDE.rules(tab, { E, icon, imCls })}</div></div></div>`;
  }
  // ---------------------------------------------------------------- mode découverte (conseils au fil de la partie)
  const DISC_KEY = "swarm-steel-decouverte", SEEN_KEY = "swarm-steel-vus";
  let DISC = (() => { try { return localStorage.getItem(DISC_KEY) === "1"; } catch (e) { return false; } })();
  let SEEN = (() => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch (e) { return new Set(); } })();
  function saveDisc() { try { localStorage.setItem(DISC_KEY, DISC ? "1" : "0"); localStorage.setItem(SEEN_KEY, JSON.stringify([...SEEN])); } catch (e) { /* rien */ } }
  function tipCard() {
    if (!DISC || !S || S.handoff || S.winner || !S.view || (online() && !NET.full) || FX.playing) return "";
    const t = AIDE.nextTip(S, S.view, SEEN); if (!t) return "";
    return `<aside class="tipcard ${S.view}" role="note" aria-label="Conseil">${t.img && imCls(t.img) ? `<div class="tc-img ${imCls(t.img)}"></div>` : ""}<div class="tc-body">
      <span class="tc-k">Mode découverte</span><b>${E(t.title)}</b><p>${E(t.text(S))}</p>
      <div class="tc-acts"><button data-a="tipOk" data-id="${t.id}" class="primary">Compris</button><button data-a="tipOff" class="ghost">Arrêter les conseils</button></div></div></aside>`;
  }

  // ---------------------------------------------------------------- actions
  // Les actions de jeu passent toutes par SF.apply (moteur) : en local directement, en ligne via le serveur.
  function play(type, args, onOk) {
    if (online()) { send(type, args, onOk); return; }
    S.fx = [];
    const prev = S.phase;
    const refused = SF.apply(S, who(), type, args || {});
    const events = S.fx; delete S.fx;
    if (!refused && onOk) onOk();
    if (!S.winner) setPhaseHandoff(prev);
    save();
    if (S.winner) recordLocal();
    const reacts = !REACT.includes(prev) && REACT.includes(S.phase);
    animate(events).then(() => { render(); afterRender(events); if (reacts) reactBanner(); });
  }
  function handle(a, d) {
    if (a === "help") { UI.help = !UI.help; render(); return; }
    if (a === "helpTab") { UI.helpTab = d.v; render(); return; }
    if (a === "disc") { DISC = !DISC; if (DISC && S && MODE === "local") { S.decouverte = true; save(); } saveDisc(); render(); return; }
    if (a === "discReset") { SEEN = new Set(); saveDisc(); render(); return; }
    if (a === "tipOk") { SEEN.add(d.id); saveDisc(); render(); return; }
    if (a === "tipOff") { DISC = false; saveDisc(); flash("Conseils désactivés. Vous pouvez les réactiver dans « Règles »."); render(); return; }
    if (a === "reload") { location.reload(); return; }
    if (a === "copy") { // salle d'attente : copier le code ou le lien d'invitation
      const ok = () => flash(`${d.what} copié : ${d.v}`), ko = () => flash("Copie impossible : sélectionnez le texte à la main.");
      try { navigator.clipboard.writeText(d.v).then(ok, ko); } catch (e) { ko(); }
      return;
    }
    if (a === "music") { MUSIC.toggle(); render(); return; }
    if (a === "theme") { THEME = THEMES[(THEMES.indexOf(THEME) + 1) % THEMES.length]; try { localStorage.setItem(THEME_KEY, THEME); } catch (e) { /* rien */ } applyTheme(); render(); return; }
    if (MODE === "stats") { statsAction(a, d); return; }
    if (a === "anim") { animOn = !animOn; try { localStorage.setItem(ANIM_KEY, animOn ? "1" : "0"); } catch (e) { /* rien */ } render(); return; }
    if (MODE === "home" || !S) { homeAction(a, d); return; }
    if (a === "home") { if (online()) return; MODE = "home"; render(); return; }
    if (a === "quit") { if (confirmQuit()) { setNet(null); MODE = "home"; S = null; UI = resetUI(); render(); } return; }
    if (a === "new") {
      if (online()) { if (S.winner) send("rematch", {}); return; }
      if (!S || S.winner || confirmNew()) { clearSave(); newGame(); } return;
    }
    if (a === "reveal") {
      if (online() || UI.leaving) return;
      const go = () => { UI.leaving = false; S.view = S.handoff; S.handoff = null; save(); render(); };
      const card = document.querySelector(".pc-ho .ho-card");
      if (card && animOn) { UI.leaving = true; card.classList.add("leave"); document.body.dataset.anim = "1"; setTimeout(() => { document.body.dataset.anim = "0"; go(); }, 320); } else go();
      return;
    }
    if (S.winner) return;
    switch (a) {
      // choix locaux (sans effet sur la partie)
      case "card": UI.sel = UI.sel === Number(d.uid) ? null : Number(d.uid); break;
      case "creature": { // toucher à nouveau la créature choisie la relâche (pour pouvoir en choisir une autre sur une case où elle peut aller)
        const id = Number(d.id);
        // attaques (Oni, 07/11/2026) : toucher une créature qui peut agir la choisit (cases de son chemin, puis cibles)
        const cr = S.creatures.find(o => o.id === id);
        if (S.phase === "A_attack" && S.view === "essaim" && cr && SF.canAct(S, cr)) { UI.pop = null; UI.selCreature = UI.selCreature === id ? null : id; break; }
        if (S.phase === "A_attack") { UI.pop = UI.pop === id ? null : id; break; }
        if (UI.selCreature === id) { UI.selCreature = null; UI.pop = null; break; }
        UI.selCreature = id; UI.pop = id; break;
      }
      case "popClose": UI.pop = null; break;
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
      case "moveTo": if (UI.selCreature !== null) { const id = UI.selCreature; return play("move", { id, u: Number(d.u), k: Number(d.k) }, () => { const c = S.creatures.find(o => o.id === id); if (!c || !SF.canAct(S, c)) UI.selCreature = null; }); } break;
      case "strike": if (UI.selCreature !== null) { const id = UI.selCreature; return play("strike", { id, target: d.k }, () => { const c = S.creatures.find(o => o.id === id); if (!c || !SF.canAct(S, c)) UI.selCreature = null; }); } break;
      case "rest": UI.selCreature = null; return play("rest", { id: Number(d.id) });
      case "pickAdd": { UI.pickSel = UI.pickSel || [0, 0, 0]; UI.pickSel[Number(d.v) - 1]++; break; }
      case "pickDel": { UI.pickSel = UI.pickSel || [0, 0, 0]; if (UI.pickSel[Number(d.v) - 1]) UI.pickSel[Number(d.v) - 1]--; break; }
      case "tdraw": return play("tdraw", { cat: d.v });
      case "pickGo": { const n = UI.pickSel || [0, 0, 0]; UI.pickSel = null; return play("pick", { n }); }
      case "ordPick": { const id = Number(d.id); UI.ord = UI.ord.includes(id) ? UI.ord.filter(x => x !== id) : [...UI.ord, id]; break; }
      case "ordCancel": UI.blk = null; UI.ord = []; break;
      case "ordGo": { const key = UI.blk, order = UI.ord; UI.blk = null; UI.ord = []; if (key) return play("act", { key, order }); break; }
      // actions de jeu
      case "famine": return play("famine", { play: d.v === "1" });
      case "draw": return play("draw");
      case "deployAt": {
        if (!UI.sel) break;
        // Sapeur : choisir d'abord le bâtiment de la lane à détruire ; k : case de parachutage d'un soutien
        const k = d.k !== undefined ? Number(d.k) : undefined;
        if (cardOf(UI.sel).name === "Sapeur" && SF.laneTiles(S, d.l).length) { UI.sap = { uid: UI.sel, lane: d.l, u: Number(d.u), k }; break; }
        return play("deploy", { uid: UI.sel, lane: d.l, u: Number(d.u), k }, () => { UI.sel = null; });
      }
      case "sapTarget": { const sp = UI.sap; UI.sap = null; if (sp) return play("deploy", { uid: sp.uid, lane: sp.lane, u: sp.u, k: sp.k, target: d.k }, () => { UI.sel = null; }); break; }
      case "sapCancel": UI.sap = null; break;
      case "frenzy": return play("frenzy", { src: Number(d.id), target: Number(d.v) });
      case "endDeploy": UI.sel = null; return play("endDeploy");
      case "invest": return play("invest", { t: d.t, s: d.s, n: Number(d.n) });
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
    if (a === "stats") { openStats(); return; }
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
      // chemin fourni par le moteur (déplacements au choix, retraite comprise), sinon le chemin vers la fusée
      const steps = e.path ? e.path.slice() : [];
      if (!e.path) { let [u, k] = e.from; for (let i = 0; i < 12 && !(u === e.to[0] && k === e.to[1]); i++) { [u, k] = SF.nextStep(u, k); steps.push([u, k]); } }
      for (const [u, k] of steps) {
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
        case "Champ de stase": { const c = cellAt(e.k); if (c) await sweep([c], "stase"); break; }
        case "Onde de choc": await sweep(ringCells(e.ring), "off", true); break;
        case "Famine": { const b = document.querySelector('[data-fx="budget"]'); if (b) { flashEl(b, "var(--off)"); float(b, "Budget ÷ 2", "cr-dmg"); } await wait(300); break; }
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
    async siphon(e) {
      const c = cellAt(e.k), b = document.querySelector('[data-fx="budget"]');
      if (c) float(c, "−" + e.n + " biomasse", "cr-dmg");
      if (b) flashEl(b, "var(--off)");
      await wait(300);
    },
    async sapeur(e) {
      const c = cellAt(e.k); if (!c) return;
      flashEl(c, "var(--soutien)"); float(c, "Sabotage", "aura");
      await wait(300);
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
  // bandeau « RÉACTIONS ! » (Oni, 06/11/2026) : arrive de la droite, reste 1 s au centre, repart vers la gauche
  function reactBanner() {
    const old = document.querySelector(".react-banner"); if (old) old.remove();
    const b = document.createElement("div");
    b.className = "react-banner" + (animOn ? "" : " still");
    b.setAttribute("role", "status");
    b.innerHTML = `<div class="rb-band"></div><div class="rb-txt"><b>RÉACTIONS !</b><span>${S.phase === "A_famine" ? "La colonie peut jouer Famine" : "La colonie peut jouer un sortilège offensif"}</span></div>`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), animOn ? 2300 : 1600);
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
  async function api(path, body) { // chaque requête porte la version de la page (cv) : le serveur refuse une page périmée
    const url = "/api/" + path + (body ? "" : (path.includes("?") ? "&" : "?") + "cv=" + encodeURIComponent(SF.VERSION));
    const res = await fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, cv: SF.VERSION }) } : { cache: "no-store" });
    let j = null; try { j = await res.json(); } catch (e) { /* réponse vide */ }
    if (res.status === 409 && j && j.reload) { if (STALE !== j.version) { STALE = j.version; render(); } }
    if (!res.ok) throw new Error((j && j.error) || "Serveur injoignable (" + res.status + ").");
    return j;
  }
  // page restée ouverte pendant une mise à jour : on vérifie la version du site de temps en temps (hors partie en ligne,
  // où chaque requête la vérifie déjà)
  async function checkVersion() {
    if (!HTTP || STALE || online()) return;
    try { const r = await fetch("/api/version", { cache: "no-store" }); const j = await r.json(); if (j.version && j.version !== SF.VERSION) { STALE = j.version; render(); } }
    catch (e) { /* hors ligne : on réessaiera */ }
  }
  setInterval(checkVersion, 5 * 60 * 1000);
  // ---------------------------------------------------------------- statistiques (parties terminées, par version)
  async function recordLocal() {
    if (!HTTP || !S || !S.winner || S.recorded) return;
    S.gid = S.gid || newGid();
    try {
      const r = await fetch("/api/resultat", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ record: BILAN.summary(S, { id: S.gid, mode: "local", test: TEST }), svg: BILAN.miniMap(S) }) });
      if (r.ok) { S.recorded = true; if (MODE === "local") save(); }
    } catch (e) { /* hors ligne : nouvel essai au prochain chargement de la partie */ }
  }
  function openStats() {
    MODE = "stats"; STATS = { list: null, error: "", test: false, ver: null, plans: {} }; render();
    fetch("/api/stats", { cache: "no-store" }).then(r => r.json()).then(j => {
      if (!j.results) throw new Error(j.error || "Statistiques indisponibles.");
      STATS.list = j.results.sort((a, b) => (a.date < b.date ? 1 : -1)); render();
    }).catch(e => { STATS.error = e.message || "Serveur injoignable."; render(); });
  }
  const pct = (a, n) => (n ? Math.round(100 * a / n) + " %" : "–");
  const avg = v => (Math.round(v * 10) / 10).toLocaleString("fr-FR");
  const shown = () => (STATS.list || []).filter(r => STATS.test || !r.test);
  function statsPage() {
    const head = `<div class="st-head"><h2>Statistiques des parties</h2><button data-a="statsBack" class="ghost">Retour</button></div>`;
    if (STATS.error) return `<section class="statpage">${head}<p>${E(STATS.error)}</p></section>`;
    if (!STATS.list) return `<section class="statpage">${head}<p>Chargement…</p></section>`;
    const list = shown(), rows = BILAN.byVersion(list);
    const nTest = STATS.list.filter(r => r.test).length;
    const table = rows.length ? `<div class="tbl"><table><thead><tr><th>Version</th><th>Parties</th><th>Essaim gagne</th><th>Colonie gagne</th><th>Manches</th><th>Biomasse finale</th><th>Travailleurs tués</th><th>Étages</th></tr></thead><tbody>${
      rows.map(r => `<tr class="${STATS.ver === r.version ? "sel" : ""}" data-a="statsVer" data-v="${E(r.version)}"><td><b>v${E(r.version)}</b></td><td>${r.n}</td><td>${pct(r.essaim, r.n)}</td><td>${pct(r.colonie, r.n)}</td><td>${avg(r.rounds)}</td><td>${avg(r.biomass)}</td><td>${avg(r.killed)}</td><td>${avg(r.floors)}</td></tr>`).join("")
    }</tbody></table></div><p class="small">Moyennes par partie. Touchez une version pour ne voir que ses parties.</p>` : `<p>Aucune partie terminée enregistrée pour l'instant.</p>`;
    const games = list.filter(r => !STATS.ver || r.version === STATS.ver).slice(0, 100);
    const card = r => `<div class="st-game"><div class="st-line"><b class="${r.winner}">${r.winner === "essaim" ? "Essaim" : "Colonie"}</b> · v${E(r.version)}${r.versionFin && r.versionFin !== r.version ? ` → v${E(r.versionFin)}` : ""} · ${E(r.mode)}${r.decouverte ? " · découverte" : ""}${r.test ? " · test" : ""} · ${E(new Date(r.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }))}</div>
      <div class="st-line small">${r.rounds} manches · biomasse ${r.biomass} · ${r.killed} travailleur${r.killed > 1 ? "s" : ""} tué${r.killed > 1 ? "s" : ""} · fusée ${r.floors}/12</div>
      ${STATS.plans[r.id] ? `<img class="st-plan" alt="Plateau en fin de partie" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(STATS.plans[r.id])}">` : `<button data-a="statsPlan" data-id="${E(r.id)}" class="ghost">Voir le plateau final</button>`}</div>`;
    return `<section class="statpage">${head}
      <p class="small">Version actuelle : v${E(SF.VERSION)} · ${list.length} partie${list.length > 1 ? "s" : ""} terminée${list.length > 1 ? "s" : ""}${STATS.test ? "" : ` (hors ${nTest} partie${nTest > 1 ? "s" : ""} de test)`}.</p>
      <div class="home-acts"><button data-a="statsTest" aria-pressed="${STATS.test}">Parties de test : ${STATS.test ? "affichées" : "masquées"}</button><button data-a="statsCsv">Exporter en CSV</button></div>
      ${table}
      <h3>${STATS.ver ? `Parties de la v${E(STATS.ver)}` : "Dernières parties"}${STATS.ver ? ` <button data-a="statsVer" data-v="" class="ghost">Toutes les versions</button>` : ""}</h3>
      <div class="st-games">${games.map(card).join("") || "<p>Aucune partie.</p>"}</div></section>`;
  }
  const CSV_COLS = ["id", "date", "version", "versionFin", "mode", "test", "decouverte", "winner", "rounds", "biomass", "reserve", "killed", "workers", "floors", "creatures", "buildings", "barbed", "supports", "upgrades"];
  function statsAction(a, d) {
    if (a === "statsBack" || a === "home") { MODE = "home"; STATS = null; history.replaceState(null, "", location.pathname); render(); return; }
    if (a === "help") { return; }
    if (!STATS) return;
    if (a === "statsTest") STATS.test = !STATS.test;
    if (a === "statsVer") STATS.ver = d.v || null;
    if (a === "statsPlan") {
      fetch("/api/resultat?id=" + encodeURIComponent(d.id), { cache: "no-store" }).then(r => r.json()).then(j => { if (j.svg) { STATS.plans[d.id] = j.svg; render(); } }).catch(() => flash("Plateau indisponible."));
      return;
    }
    if (a === "statsCsv") {
      const cell = v => { const s = String(v === undefined || v === null ? "" : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      const csv = [CSV_COLS.join(";"), ...shown().map(r => CSV_COLS.map(c => cell(r[c])).join(";"))].join("\n");
      const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = "swarm-steel-parties.csv"; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    render();
  }
  function receive(j) { // nouvel état envoyé par le serveur (vue filtrée pour notre camp)
    if (!j || !j.S) return;
    if (S && !REACT.includes(S.phase) && REACT.includes(j.S.phase)) NET.react = true;
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
    if (NET.react) { NET.react = false; NET.banner = false; reactBanner(); }
    if (NET.banner) { NET.banner = false; banner(`À vous de jouer · ${PHASE_TXT[S.phase][1]}`); }
  }
  async function withBusy(f) {
    if (busy) return; busy = true; document.body.dataset.busy = "1";
    try { await f(); } catch (e) { flash(e.message); } finally { busy = false; document.body.dataset.busy = "0"; render(); }
  }
  function createOnline(side) {
    withBusy(async () => {
      const j = await api("create", { side, test: TEST, disc: DISC });
      setNet({ code: j.code, token: j.token, side: j.side }); MODE = "online"; UI = resetUI(); receive(j);
      history.replaceState(null, "", location.pathname);
    });
  }
  function joinOnline(code) {
    withBusy(async () => {
      const j = await api("join", { code, disc: DISC });
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
    tipHide();
    // fenêtre de détail d'une créature : un clic ailleurs la ferme (la créature reste choisie pour ses déplacements)
    if (UI.pop != null && !e.target.closest(".cpop") && !(el && el.dataset.a === "creature")) { UI.pop = null; if (!el || el.disabled) { render(); return; } }
    if (!el || el.disabled) return;
    handle(el.dataset.a, el.dataset);
  });
  function upgradeSave(t) { SF.migrate(t); t.invest = t.invest || {}; t.toPlace = t.toPlace || []; for (const x of Object.values(t.tiles || {})) if (SF.TILES[x.name] && SF.TILES[x.name].camo && x.camo === undefined) x.camo = 1; return t; }
  // démarrage : partie en ligne en cours, sinon partie locale sauvegardée, sinon accueil
  // (un lien d'invitation « ?code=… » ouvre toujours l'accueil, code prérempli)
  let net0 = null; try { net0 = JSON.parse(localStorage.getItem(NET_KEY) || "null"); } catch (e) { /* rien */ }
  const saved = load();
  const invite = new URLSearchParams(location.search).get("code");
  if (new URLSearchParams(location.search).has("stats") && HTTP) openStats(); // lien direct vers les statistiques
  else if (net0 && net0.code && net0.token && (!invite || invite.toUpperCase() === net0.code)) resumeOnline(net0);
  else if (!invite && saved && saved.phase) { S = upgradeSave(saved); MODE = "local"; render(); if (S.winner) recordLocal(); }
  else render();
  checkVersion();
})();
