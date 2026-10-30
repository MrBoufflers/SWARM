// Partie en ligne complète entre deux navigateurs (Playwright), en vrais clics souris, avec le serveur local (server/dev.js).
// Usage : node tests/e2e-en-ligne.js [largeur]   (ex. 400 pour un téléphone)
// E2E_URL=https://… pour jouer contre un site déployé au lieu du serveur local.
// Vérifie : création / code / rejoindre, aucune erreur JavaScript, aucun bouton cliqué recouvert,
// aucune information cachée dans les réponses du serveur reçues par chaque camp, reprise après rechargement, victoire.
const { chromium } = require('playwright');
const { start } = require('../server/dev.js');
const SF = require('../src/engine.js');
const W = Number(process.argv[2] || 1400), PORT = 8899, URL0 = process.env.E2E_URL || `http://localhost:${PORT}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const server = process.env.E2E_URL ? null : await start(PORT);
  const browser = await chromium.launch();
  const errs = [], leaks = [];
  let covered = 0;
  async function open(side) {
    const ctx = await browser.newContext({ viewport: { width: W, height: 1000 } });
    await ctx.addInitScript(POLL => { window.SF_POLL_MS = POLL; }, process.env.E2E_URL ? 400 : 150);
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(side + ' : ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && m.text().startsWith('animation')) errs.push(side + ' : ' + m.text()); });
    await page.addInitScript((() => { window.__fx = {}; new MutationObserver(ms => { for (const m of ms) if (m.target.id === 'fx') for (const n of m.addedNodes) if (n.classList) { const c = n.classList.contains('ghost') ? 'déplacement' : n.classList.contains('shot') ? 'tir' : n.classList.contains('spell-banner') ? 'sortilège' : n.classList.contains('turn-banner') ? 'bandeau' : n.classList.contains('float') ? 'chiffre' : 'autre'; window.__fx[c] = (window.__fx[c] || 0) + 1; } }).observe(document, { childList: true, subtree: true }); }));
    // contrôle anti-triche : chaque réponse du serveur reçue par ce camp ne contient rien de caché
    page.on('response', async res => {
      if (!res.url().includes('/api/')) return;
      let j; try { j = await res.json(); } catch (e) { return; }
      if (!j || !j.S) return;
      const S = j.S, bad = [];
      if ([1, 2, 3].some(l => S.piles[l].some(x => x !== null)) || S.tileDeck.some(x => x !== null) || S.spellDeck.some(x => x !== null)) bad.push('ordre des pioches');
      if (side === 'essaim') {
        if (S.hand.some(x => x !== null)) bad.push('main de la colonie');
        if (S.spells.some(x => x !== null)) bad.push('sortilèges');
        const clair = SF.clairvoyance(S);
        for (const t of Object.values(S.tiles)) if (t.camo && !t.revealed && !clair && t.name) bad.push('tuile camouflée ' + t.name);
        for (const l of SF.LANES) for (const ch of S.chantiers[l]) if (ch.tile && SF.TILES[ch.tile].camo) bad.push('chantier camouflé');
        for (const p of S.toPlace) if (p.tile && SF.TILES[p.tile].camo) bad.push('tuile à poser camouflée');
      } else if (S.handA.some(x => x !== null)) bad.push("main de l'essaim");
      if (bad.length) leaks.push(side + ' : ' + bad.join(', '));
    });
    await page.goto(URL0);
    return page;
  }
  const idle = async page => { for (let i = 0; i < 600; i++) { if ((await page.evaluate(() => document.body.dataset.busy !== '1' && document.body.dataset.anim !== '1'))) return; await sleep(20); } };
  const click = async (page, sel) => {
    await idle(page);
    const el = await page.$(sel); if (!el) return false;
    await el.evaluate(e => e.scrollIntoView({ block: 'center' }));
    const top = await el.evaluate(e => { const r = e.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return h === e || e.contains(h); });
    if (!top) covered++;
    await el.click(); await sleep(20); await idle(page); return true;
  };
  const phase = page => page.evaluate(() => (document.querySelector('.ph-head b') || {}).textContent);

  // 1. création et invitation
  const pE = await open('essaim');
  await click(pE, '[data-a="create"][data-side="essaim"]');
  const code = await pE.evaluate(() => (document.querySelector('.bigcode') || {}).textContent);
  const pC = await open('colonie');
  await pC.goto(URL0 + '?code=' + code);
  const pre = await pC.evaluate(() => document.querySelector('#joincode').value);
  await click(pC, '[data-a="join"]');
  await sleep(process.env.E2E_URL ? 1500 : 400);
  const started = await pE.evaluate(() => !document.querySelector('.bigcode') && !!document.querySelector('.board'));
  console.log('code :', code, '| prérempli par le lien :', pre === code, '| partie lancée chez le créateur :', started);

  // 2. partie complète : on joue sur la page dont c'est le tour
  const pages = { essaim: pE, colonie: pC }, seen = {};
  let reloaded = false, resumed = null, steps = 0, stuck = 0;
  for (; steps < 1500; steps++) {
    if (await pE.$('.banner.win') && await pC.$('.banner.win')) break;
    let page = null;
    for (const s of ['essaim', 'colonie']) if ((await pages[s].evaluate(() => document.body.dataset.myturn)) === '1') page = pages[s];
    if (!page) { if (++stuck > 400) { console.log('personne ne joue'); break; } await sleep(60); continue; }
    stuck = 0;
    const ph = await phase(page); seen[ph] = 1;
    // reprise après rechargement, une fois, en milieu de partie
    if (!reloaded && ph === 'Tour de la colonie') {
      reloaded = true; await pC.reload(); await sleep(1500); await idle(pC);
      resumed = await pC.evaluate(() => !!document.querySelector('.board') && document.body.dataset.myturn === '1');
      continue;
    }
    if (await click(page, '[data-a="famine"][data-v="1"]')) continue;
    if (await click(page, '[data-a="draw"]')) continue;
    if (ph === 'Déploiement') { if (!(await page.$('.ccard.sel'))) { if (await click(page, '[data-a="card"]:not([disabled])') && await click(page, '[data-a="deployAt"]')) continue; } await click(page, '[data-a="endDeploy"]'); continue; }
    if (ph === 'Améliorations') { await click(page, '[data-a="invest"][data-n="99"]'); await click(page, '[data-a="toAttacks"]'); continue; }
    if (ph === 'Réaction de la colonie') { if (await click(page, '[data-a="spell"]')) { if (!(await click(page, '[data-a="spellArg"]'))) await click(page, '[data-a="spellCancel"]'); } await click(page, '[data-a="reactDone"]'); continue; }
    if (ph === 'Attaques') { if (await click(page, '[data-a="ordGo"]')) continue; if (await click(page, '[data-a="act"]')) continue; await click(page, '[data-a="endA"]'); continue; }
    if (ph === 'Tour de la colonie') {
      if (!(await page.$('.tcard.sel'))) { if (await click(page, '[data-a="tile"]:not([disabled])') && await click(page, '[data-a="startCh"]')) continue; }
      for (let i = 0; i < 4; i++) { const bs = await page.$$('[data-a="alloc"][data-d="1"]'); if (!bs[i]) break; await bs[i].click(); await sleep(20); await idle(page); }
      await click(page, '[data-a="build"]'); continue;
    }
    if (ph === 'Pose des bâtiments') { if (await click(page, '[data-a="placeAt"]')) continue; console.log('pose impossible'); break; }
    if (ph === 'Tirs des supports') { if (await click(page, '[data-a="support"]') && await click(page, '[data-a="fireAt"]')) continue; await click(page, '[data-a="endD"]'); continue; }
    if (ph === 'Début du tour de l\'essaim') { await click(page, '[data-a="famine"][data-v="0"]'); continue; }
    console.log('bloqué :', ph); break;
  }
  await sleep(400);
  const fin = await pE.evaluate(() => (document.querySelector('.banner.win b') || {}).textContent || 'en cours');
  const finC = await pC.evaluate(() => (document.querySelector('.banner.win b') || {}).textContent || 'en cours');
  const fxE = await pE.evaluate(() => window.__fx), fxC = await pC.evaluate(() => window.__fx);
  console.log('animations jouées — essaim :', JSON.stringify(fxE), '| colonie :', JSON.stringify(fxC));
  const ok = fxE['déplacement'] > 0 && fxC['déplacement'] > 0 && fxC['bandeau'] > 0 && fxE['bandeau'] > 0 && !errs.length && !leaks.length && !covered && started && pre === code && resumed === true && fin !== 'en cours' && fin === finC;
  console.log('erreurs :', errs.length ? errs : 'aucune', '| fuites :', leaks.length ? [...new Set(leaks)] : 'aucune', '| boutons masqués :', covered,
    '| reprise après rechargement :', resumed, '| fin (essaim / colonie) :', fin, '/', finC, '| phases vues :', Object.keys(seen).join(', '));
  await browser.close(); if (server) server.close();
  process.exit(ok ? 0 : 1);
})();
