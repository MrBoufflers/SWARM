// Fonction Netlify : expose server/core.js sur /api/*. L'état des parties est stocké dans Netlify Blobs
// (store « parties », lecture fortement cohérente, écriture conditionnelle sur l'etag pour éviter les collisions),
// et les résultats des parties terminées dans le store « resultats » (statistiques par version).
import { getStore } from "@netlify/blobs";
import core from "../../server/core.js";

export default async (req) => {
  const store = getStore({ name: "parties", consistency: "strong" });
  const adapter = {
    async get(code) {
      const r = await store.getWithMetadata(code, { type: "json" });
      return r ? { data: r.data, etag: r.etag } : null;
    },
    async create(code, data) { const r = await store.setJSON(code, data, { onlyIfNew: true }); return !!r.modified; },
    async update(code, data, etag) { const r = await store.setJSON(code, data, { onlyIfMatch: etag }); return !!r.modified; },
  };
  // statistiques (store « resultats ») : un index des résumés (écriture conditionnelle) + une entrée par partie avec son mini-plan
  const res = getStore({ name: "resultats", consistency: "strong" });
  adapter.results = {
    async add(rec, svg) {
      if (await res.get("p/" + rec.id)) return false;
      await res.setJSON("p/" + rec.id, { ...rec, svg });
      for (let i = 0; i < 6; i++) {
        const cur = await res.getWithMetadata("index", { type: "json" });
        const list = cur ? cur.data : [];
        if (list.some(r => r.id === rec.id)) return true;
        list.push(rec);
        const w = cur ? await res.setJSON("index", list, { onlyIfMatch: cur.etag }) : await res.setJSON("index", list, { onlyIfNew: true });
        if (w.modified) return true;
      }
      return false;
    },
    async list() { return (await res.get("index", { type: "json" })) || []; },
    async get(id) { return /^[\w.-]+$/.test(id) ? await res.get("p/" + id, { type: "json" }) : null; },
  };
  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/api\/?/, "");
  let body = {};
  if (req.method === "POST") { try { body = await req.json(); } catch (e) { body = {}; } }
  let r;
  try { r = await core.handle(adapter, req.method, route, Object.fromEntries(url.searchParams), body); }
  catch (e) { console.error(e); r = { status: 500, json: { error: "Erreur du serveur." } }; }
  return Response.json(r.json, { status: r.status, headers: { "cache-control": "no-store" } });
};

export const config = { path: "/api/*" };
