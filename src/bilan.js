// Swarm & Steel — bilan de fin de partie, pour les statistiques par version :
// résumé chiffré (vainqueur, manches, biomasse finale, travailleurs tués…) et mini-plan schématique du plateau (SVG).
// Aucun accès au DOM : utilisé par la page (parties locales) et par le serveur (parties en ligne).
"use strict";
const BILAN = (() => {
  const E = typeof SF !== "undefined" ? SF : require("./engine.js");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // résumé d'une partie terminée ; extra = { id, mode: "local" | "en ligne", test }
  function summary(S, extra) {
    const tiles = Object.values(S.tiles || {});
    return {
      id: String(extra.id || ""), mode: extra.mode, test: !!extra.test, decouverte: !!(extra.decouverte || S.decouverte), ia: S.ia === "essaim" || S.ia === "colonie" ? S.ia : null,
      version: S.version || E.VERSION, versionFin: E.VERSION, date: new Date().toISOString(),
      winner: S.winner, rounds: S.round, biomass: S.biomass, reserve: S.reserve || 0,
      killed: S.killed || 0, workers: S.workersBase, floors: S.floors,
      creatures: (S.creatures || []).length, buildings: tiles.filter(t => !t.start).length, barbed: tiles.filter(t => t.start).length,
      supports: Object.keys(S.supports || {}).length,
      upgrades: ["aggro", "tank", "soutien"].map(ty => [ty, S.upgrades[ty].r1 || "-", S.upgrades[ty].r2 || "-"].join(":")).join(" "),
    };
  }

  // mini-plan : grille 9 × 9 (fusée au centre), bâtiments (nom abrégé, PV), supports (niveau), créatures (nombre par type)
  const C = 30, PAD = 4, COL = { aggro: "#e0604f", tank: "#4f8fe0", soutien: "#a46ee0" };
  const LANE_TINT = { N: "#1d2a3a", E: "#1d3328", S: "#3a321d", O: "#33213a" };
  function miniMap(S) {
    const parts = [];
    const W = 9 * C + 2 * PAD;
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" font-family="Arial, sans-serif">`);
    parts.push(`<rect width="${W}" height="${W}" rx="6" fill="#15181c"/>`);
    const crAt = {};
    for (const c of S.creatures || []) {
      const [x, y] = E.toGlobal(c.lane, c.u, c.k), k = x + "," + y;
      const t = (E.CREATURES[c.name] || {}).type || "aggro";
      (crAt[k] = crAt[k] || { aggro: 0, tank: 0, soutien: 0 })[t]++;
    }
    for (let y = 4; y >= -4; y--) for (let x = -4; x <= 4; x++) {
      const k = x + "," + y, r = E.ring(x, y), lane = E.cellLane(x, y);
      const px = PAD + (x + 4) * C, py = PAD + (4 - y) * C;
      const cell = (fill, stroke) => parts.push(`<rect x="${px + 1}" y="${py + 1}" width="${C - 2}" height="${C - 2}" rx="3" fill="${fill}"${stroke ? ` stroke="${stroke}"` : ""}/>`);
      const text = (s, dy, size, fill) => parts.push(`<text x="${px + C / 2}" y="${py + dy}" font-size="${size}" text-anchor="middle" fill="${fill}">${esc(s)}</text>`);
      if (r === 4) { // cases d'entrée : seulement les 5 colonnes de chaque lane
        if (!lane || E.toLocal(lane, x, y)[0] < -2 || E.toLocal(lane, x, y)[0] > 2) continue;
        cell("#1b1f24", "#3a3f46");
      } else if (r === 0) {
        cell("#e8e6e1"); text("FUSÉE", 12, 6.5, "#222"); text(`${S.floors}/12`, 23, 9, "#222");
      } else if (E.isSupportCell(x, y)) {
        const lv = (S.supports || {})[k];
        if (lv) { cell("#1f6f63"); text("S" + lv, 19, 11, "#e8fff9"); } else cell("#202429");
      } else {
        const t = (S.tiles || {})[k];
        if (t) {
          cell(t.start ? "#4a3d30" : "#6b4a2b", t.camo && !t.revealed ? "#d0a24a" : null);
          text(t.start ? "Barb." : String(t.name).slice(0, 6), 11, 6.5, "#f4e9da");
          text(`${Math.max(0, t.hp)}/${t.max}`, 22, 8.5, "#f4e9da");
        } else cell(LANE_TINT[lane] || "#202429");
      }
      const cr = crAt[k];
      if (cr) { // pastilles : une par type présent, avec le nombre
        const types = ["aggro", "tank", "soutien"].filter(ty => cr[ty]);
        types.forEach((ty, i) => {
          const cx = px + C / 2 + (i - (types.length - 1) / 2) * 9, cy = py + C - 6;
          parts.push(`<circle cx="${cx}" cy="${cy}" r="4.5" fill="${COL[ty]}"/><text x="${cx}" y="${cy + 2.5}" font-size="6.5" text-anchor="middle" fill="#fff">${cr[ty]}</text>`);
        });
      }
    }
    parts.push(`</svg>`);
    return parts.join("");
  }

  // comparaison de numéros de version (« 0.4.10 » après « 0.4.9 »)
  function cmpVersion(a, b) {
    const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
    return 0;
  }

  // agrégats par version (pour la page Statistiques) à partir des résumés
  function byVersion(list) {
    const g = {};
    for (const r of list) {
      const v = r.version || "?";
      const a = g[v] = g[v] || { version: v, n: 0, essaim: 0, colonie: 0, rounds: 0, biomass: 0, killed: 0, floors: 0 };
      a.n++; if (r.winner === "essaim") a.essaim++; else if (r.winner === "colonie") a.colonie++;
      a.rounds += r.rounds || 0; a.biomass += r.biomass || 0; a.killed += r.killed || 0; a.floors += r.floors || 0;
    }
    return Object.values(g).sort((x, y) => cmpVersion(y.version, x.version)).map(a => ({
      ...a, rounds: a.rounds / a.n, biomass: a.biomass / a.n, killed: a.killed / a.n, floors: a.floors / a.n,
    }));
  }

  return { summary, miniMap, cmpVersion, byVersion };
})();
if (typeof module !== "undefined") module.exports = BILAN;
