// Tests du serveur en ligne (server/core.js) avec un stockage en mémoire : lobby, codes, jetons, droits, vues filtrées.
const core = require("../server/core.js");
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log("ÉCHEC :", msg); } else console.log("ok   :", msg); };

(async () => {
  const store = core.memoryStore();
  const call = (m, route, body, q) => core.handle(store, m, route, q, body);

  // création : code de 5 caractères sans caractères ambigus, jeton, camp choisi
  const a = await call("POST", "create", { side: "colonie" });
  ok(a.status === 200 && /^[A-HJKMNP-Z2-9]{5}$/.test(a.json.code), "code de 5 caractères sans I, L, O, 0, 1 : " + a.json.code);
  ok(a.json.side === "colonie" && a.json.token && a.json.players.colonie && !a.json.players.essaim, "le créateur joue la colonie, l'essaim est libre");
  ok((await call("POST", "create", { side: "pirates" })).status === 400, "camp inconnu refusé");
  const code = a.json.code, ta = a.json.token;

  // avant l'arrivée de l'adversaire : pas d'action
  const early = await call("POST", "action", { code, token: ta, type: "draw" });
  ok(early.json.ok === false, "aucune action tant que l'adversaire n'a pas rejoint");

  // rejoindre : code en minuscules accepté, camp restant attribué
  const b = await call("POST", "join", { code: code.toLowerCase() });
  ok(b.status === 200 && b.json.side === "essaim" && b.json.token && b.json.token !== ta, "le second joueur rejoint et prend l'essaim");
  const tb = b.json.token;
  ok((await call("POST", "join", { code })).status === 409, "un troisième joueur est refusé (partie complète)");
  ok((await call("POST", "join", { code: "ZZZZZ" })).status === 404, "code inconnu : partie introuvable");
  const again = await call("POST", "join", { code, token: ta });
  ok(again.json.side === "colonie", "reconnexion avec son jeton : même camp");

  // droits : seul le camp dont c'est le tour agit ; jeton inconnu refusé
  const wrong = await call("POST", "action", { code, token: ta, type: "draw" });
  ok(wrong.json.ok === false && wrong.json.S.phase === "A_start", "la colonie ne peut pas piocher pour l'essaim");
  ok((await call("POST", "action", { code, token: "faux", type: "draw" })).status === 403, "jeton inconnu refusé");
  ok((await call("GET", "state", null, { code, token: "faux" })).status === 403, "lecture de l'état refusée sans jeton valide");
  const draw = await call("POST", "action", { code, token: tb, type: "draw" });
  ok(draw.json.ok && draw.json.S.phase === "A_deploy" && draw.json.S.handA.length > 0 && draw.json.S.handA[0].name, "l'essaim pioche et voit sa main");

  // vues filtrées
  const sa = await call("GET", "state", null, { code, token: ta, v: 0 });
  ok(sa.json.S.handA.every(x => x === null) && sa.json.S.hand.every(x => typeof x === "string"), "colonie : main de l'essaim cachée, sa propre main visible");
  ok(draw.json.S.hand.every(x => x === null) && draw.json.S.spells.every(x => x === null), "essaim : main et sortilèges de la colonie cachés");
  ok(!JSON.stringify(draw.json).includes(ta), "le jeton de l'adversaire n'est jamais envoyé");
  const same = await call("GET", "state", null, { code, token: ta, v: sa.json.v });
  ok(same.json.same === true, "état inchangé : réponse courte (pas de renvoi de l'état)");

  // action refusée : l'état n'est pas modifié
  const v0 = sa.json.v;
  const bad = await call("POST", "action", { code, token: tb, type: "deploy", args: { uid: 99999, lane: "N", u: 0 } });
  ok(bad.json.ok === false && bad.json.v === v0, "action refusée : version inchangée");
  const junk = await call("POST", "action", { code, token: tb, type: "invest", args: { t: "__proto__", s: "x", n: 1 } });
  ok(junk.json.ok === false, "paramètres invalides refusés sans planter");

  // partie complète jouée côté serveur jusqu'à la victoire (actions des deux camps, choix simples)
  const tok = { essaim: tb, colonie: ta };
  let st = (await call("GET", "state", null, { code, token: tb, v: 0 })).json, steps = 0;
  while (!st.S.winner && steps < 3000) {
    steps++;
    const side = require("../src/engine.js").actor(st.S);
    const view = (await call("GET", "state", null, { code, token: tok[side], v: 0 })).json.S;
    let type = null, args = {};
    switch (view.phase) {
      case "A_famine": type = "famine"; args = { play: true }; break;
      case "A_start": type = "draw"; break;
      case "A_deploy": { const c = view.handA[0]; if (c && steps % 3) { type = "deploy"; args = { uid: c.uid, lane: ["N", "E", "S", "O"][steps % 4], u: (steps % 5) - 2 }; } else type = "endDeploy"; break; }
      case "A_upgrade": type = view.reserve ? "invest" : "toAttacks"; args = { t: "aggro", s: view.upgrades.aggro.r1 ? "A2" : "A1", n: 99 }; break;
      case "A_react": type = "reactDone"; break;
      case "A_attack": type = view.creatures.some(c => !c.acted) ? "actAll" : "endA"; break;
      case "D_main": type = view.hand.length && !view.chantiers.N.length ? "startCh" : "toFire"; args = { i: 0, lane: "N" }; break;
      case "D_fire": type = "endD"; break;
      case "D_place": { const SF = require("../src/engine.js"); type = "placeAt"; args = { k: SF.placeTargets(view)[0] }; break; }
    }
    let r = await call("POST", "action", { code, token: tok[side], type, args });
    if (!r.json.ok && view.phase === "A_upgrade") r = await call("POST", "action", { code, token: tok[side], type: "toAttacks" });
    if (!r.json.ok && view.phase === "A_deploy") r = await call("POST", "action", { code, token: tok[side], type: "endDeploy" });
    if (!r.json.ok && view.phase === "A_attack") r = await call("POST", "action", { code, token: tok[side], type: "endA" });
    if (!r.json.ok && view.phase === "D_main") r = await call("POST", "action", { code, token: tok[side], type: "toFire" });
    if (!r.json.ok) { ok(false, `bloqué en ${view.phase} : ${r.json.error}`); break; }
    st = r.json;
  }
  ok(!!st.S.winner, `partie complète par le serveur : victoire de ${st.S.winner} en ${steps} actions`);
  const rm = await call("POST", "rematch", { code, token: ta });
  ok(rm.json.ok && !rm.json.S.winner && rm.json.S.round === 1, "revanche : nouvelle partie dans la même salle");

  // écriture concurrente : l'etag protège contre l'écrasement
  const r1 = await store.get(code), r2 = await store.get(code);
  ok(await store.update(code, r1.data, r1.etag) && !(await store.update(code, r2.data, r2.etag)), "écriture conditionnelle : la seconde écriture concurrente est refusée");

  console.log(fails ? `\n${fails} échec(s)` : "\nTous les tests du serveur passent.");
  process.exit(fails ? 1 : 0);
})();
