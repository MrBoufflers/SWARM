// Swarm & Steel — cœur du serveur en ligne (lobby, codes, jetons, actions).
// Le serveur fait autorité : il détient l'état complet S, exécute src/engine.js tel quel
// et n'envoie à chaque joueur que la vue filtrée de son camp (SF.viewFor).
// Le stockage est fourni par l'appelant (Netlify Blobs en production, mémoire en local) :
//   get(code) → { data, etag } | null ; create(code, data) → bool ; update(code, data, etag) → bool (écriture conditionnelle)
"use strict";
const crypto = require("crypto");
const SF = require("../src/engine.js");

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans I, L, O, 0, 1 (caractères ambigus)
const SIDES = ["essaim", "colonie"];
const RETRIES = 4;

function newCode() {
  let c = "";
  for (let i = 0; i < 5; i++) c += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return c;
}
const newToken = () => crypto.randomBytes(18).toString("base64url");
const normCode = c => String(c || "").trim().toUpperCase();
const validCode = c => c.length === 5 && [...c].every(ch => ALPHABET.includes(ch));
function sideOf(room, token) {
  if (typeof token !== "string" || !token) return null;
  return SIDES.find(s => room.tokens[s] && room.tokens[s] === token) || null;
}
function freshGame() { const S = SF.newGame(); S.handoff = null; return S; }
function pub(room, side, extra) {
  return { ...extra, code: room.code, side, v: room.v, players: { essaim: !!room.tokens.essaim, colonie: !!room.tokens.colonie }, S: SF.viewFor(room.S, side) };
}
const out = (status, json) => ({ status, json });
const err = (status, error) => out(status, { error });

async function handle(store, method, route, query, body) {
  body = body && typeof body === "object" ? body : {};
  query = query || {};
  if (method === "POST" && route === "create") {
    const side = body.side;
    if (!SIDES.includes(side)) return err(400, "Camp inconnu.");
    for (let i = 0; i < 8; i++) {
      const code = newCode(), token = newToken();
      const room = { code, tokens: { essaim: null, colonie: null }, S: freshGame(), v: 1, created: Date.now(), updated: Date.now() };
      room.tokens[side] = token;
      if (await store.create(code, room)) return out(200, pub(room, side, { token }));
    }
    return err(503, "Impossible de créer la partie, réessayez.");
  }
  if (method === "POST" && route === "join") {
    const code = normCode(body.code);
    if (!validCode(code)) return err(400, "Code invalide.");
    for (let i = 0; i < RETRIES; i++) {
      const r = await store.get(code);
      if (!r) return err(404, "Aucune partie avec ce code.");
      const room = r.data;
      const known = sideOf(room, body.token);
      if (known) return out(200, pub(room, known, { token: body.token }));
      const side = SIDES.find(s => !room.tokens[s]);
      if (!side) return err(409, "Cette partie est déjà complète.");
      const token = newToken();
      room.tokens[side] = token; room.v += 1; room.updated = Date.now();
      if (await store.update(code, room, r.etag)) return out(200, pub(room, side, { token }));
    }
    return err(503, "Partie occupée, réessayez.");
  }
  if (method === "GET" && route === "state") {
    const code = normCode(query.code);
    if (!validCode(code)) return err(400, "Code invalide.");
    const r = await store.get(code);
    if (!r) return err(404, "Aucune partie avec ce code.");
    const side = sideOf(r.data, query.token);
    if (!side) return err(403, "Jeton inconnu pour cette partie.");
    if (Number(query.v) === r.data.v) return out(200, { same: true, v: r.data.v });
    return out(200, pub(r.data, side));
  }
  if (method === "POST" && (route === "action" || route === "rematch")) {
    const code = normCode(body.code);
    if (!validCode(code)) return err(400, "Code invalide.");
    const type = route === "rematch" ? "rematch" : body.type;
    for (let i = 0; i < RETRIES; i++) {
      const r = await store.get(code);
      if (!r) return err(404, "Aucune partie avec ce code.");
      const room = r.data;
      const side = sideOf(room, body.token);
      if (!side) return err(403, "Jeton inconnu pour cette partie.");
      let refusal = "";
      if (!room.tokens.essaim || !room.tokens.colonie) refusal = "En attente de l'adversaire.";
      else if (type === "rematch") { if (room.S.winner) room.S = freshGame(); else refusal = "La partie n'est pas terminée."; }
      else {
        const before = JSON.stringify(room.S);
        try { refusal = SF.apply(room.S, side, type, body.args); } catch (e) { refusal = "action invalide"; }
        if (refusal) room.S = JSON.parse(before);
      }
      if (refusal) return out(200, pub(room, side, { ok: false, error: refusal.charAt(0).toUpperCase() + refusal.slice(1) + (refusal.endsWith(".") ? "" : ".") }));
      room.v += 1; room.updated = Date.now();
      if (await store.update(code, room, r.etag)) return out(200, pub(room, side, { ok: true }));
    }
    return err(503, "Partie occupée, réessayez.");
  }
  return err(404, "Route inconnue.");
}

// stockage en mémoire (serveur local et tests)
function memoryStore() {
  const m = new Map(); let n = 0;
  return {
    async get(code) { const r = m.get(code); return r ? { data: JSON.parse(r.s), etag: r.e } : null; },
    async create(code, data) { if (m.has(code)) return false; m.set(code, { s: JSON.stringify(data), e: String(++n) }); return true; },
    async update(code, data, etag) { const r = m.get(code); if (!r || r.e !== etag) return false; m.set(code, { s: JSON.stringify(data), e: String(++n) }); return true; },
  };
}

module.exports = { handle, memoryStore, ALPHABET, newCode };
