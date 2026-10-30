// Fonction Netlify : expose server/core.js sur /api/*. L'état des parties est stocké dans Netlify Blobs
// (store « parties », lecture fortement cohérente, écriture conditionnelle sur l'etag pour éviter les collisions).
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
