// Serveur local pour jouer en ligne sur son réseau ou tester : sert dist/siege-fusee-jeu.html et /api/*.
// Usage : npm run serveur  (port 8888 par défaut, ou PORT=…). Les parties sont gardées en mémoire.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const core = require("./core.js");

function start(port) {
  const store = core.memoryStore();
  const page = () => fs.readFileSync(path.join(__dirname, "../dist/siege-fusee-jeu.html"));
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://local");
    if (url.pathname.startsWith("/api/")) {
      let raw = "";
      req.on("data", c => { raw += c; if (raw.length > 1e6) req.destroy(); });
      req.on("end", async () => {
        let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch (e) { body = {}; }
        let r;
        try { r = await core.handle(store, req.method, url.pathname.slice(5), Object.fromEntries(url.searchParams), body); }
        catch (e) { console.error(e); r = { status: 500, json: { error: "Erreur du serveur." } }; }
        res.writeHead(r.status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        res.end(JSON.stringify(r.json));
      });
      return;
    }
    if (url.pathname === "/" || url.pathname === "/index.html") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(page()); return; }
    res.writeHead(404); res.end("introuvable");
  });
  return new Promise(ok => server.listen(port, () => ok(server)));
}
if (require.main === module) {
  const port = Number(process.env.PORT || 8888);
  start(port).then(() => console.log(`Siège & Fusée : http://localhost:${port}`));
}
module.exports = { start };
