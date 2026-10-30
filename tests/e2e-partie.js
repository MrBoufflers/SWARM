// Partie complète jouée par de vrais clics souris dans Chromium (Playwright).
// Usage : node tests/e2e-partie.js [largeur]   (ex. 400 pour un téléphone)
// Vérifie : aucune erreur JavaScript, aucun bouton cliqué recouvert par un autre élément, la partie va jusqu'à une victoire.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage(); await page.setViewportSize({ width: Number(process.argv[2] || 1400), height: 1000 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && m.text().startsWith('animation')) errs.push(m.text()); });
  // compte les animations réellement jouées (éléments ajoutés au calque #fx)
  const watchFx = () => { window.__fx = {}; new MutationObserver(ms => { for (const m of ms) if (m.target.id === 'fx') for (const n of m.addedNodes) if (n.classList) { const c = n.classList.contains('ghost') ? 'déplacement' : n.classList.contains('shot') ? 'tir' : n.classList.contains('spell-banner') ? 'sortilège' : n.classList.contains('turn-banner') ? 'bandeau' : n.classList.contains('float') ? 'chiffre' : 'autre'; window.__fx[c] = (window.__fx[c] || 0) + 1; } }).observe(document, { childList: true, subtree: true }); };

  const html = fs.readFileSync(path.join(__dirname, '../dist/swarm-steel-jeu.html'), 'utf8');
  await page.setContent(html);
  await page.evaluate(watchFx);
  // vrais clics souris ; on vérifie que chaque bouton cliqué est bien l'élément au premier plan
  let covered = 0;
  const calm = async () => { for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => document.body.dataset.anim)) !== '1') return; await new Promise(r => setTimeout(r, 25)); } };
  const click = async sel => {
    await calm();
    const el = await page.$(sel); if (!el) return false;
    await el.evaluate(e => e.scrollIntoView({ block: 'center' }));
    const top = await el.evaluate(e => { const r = e.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return h === e || e.contains(h); });
    if (!top) covered++;
    await el.click(); await new Promise(r => setTimeout(r, 30)); await calm(); return true;
  };
  const phase = () => page.evaluate(() => (document.querySelector('.ph-head b') || document.querySelector('.ho-card h2') || {}).textContent);
  const shots = {};
  for (let step = 0; step < 800; step++) {
    if (await page.$('.banner.win')) break;
    if (await click('[data-a="local"]')) continue;
    if (await click('[data-a="reveal"]')) continue;
    if (await click('[data-a="famine"][data-v="1"]')) continue;
    if (await click('[data-a="draw"]')) continue;
    const ph = await phase();
    if (!shots[ph]) { shots[ph] = 1;  }
    if (ph === 'Déploiement') { if (!(await page.$('.ccard.sel'))) { if (await click('[data-a="card"]:not([disabled])') && await click('[data-a="deployAt"]')) continue; } await click('[data-a="endDeploy"]'); continue; }
    if (ph === 'Améliorations') { await click('[data-a="invest"][data-n="99"]'); await click('[data-a="toAttacks"]'); continue; }
    if (ph === 'Réaction de la colonie') { if (await click('[data-a="spell"]')) { if (!(await click('[data-a="spellArg"]'))) await click('[data-a="spellCancel"]'); } await click('[data-a="reactDone"]'); continue; }
    if (ph === 'Attaques') { if (await click('[data-a="ordGo"]')) continue; if (await click('[data-a="act"]')) continue; await click('[data-a="endA"]'); continue; }
    if (ph === 'Tour de la colonie') {
      if (!(await page.$('.tcard.sel'))) { if (await click('[data-a="tile"]:not([disabled])') && await click('[data-a="startCh"]')) continue; }
      for (let i = 0; i < 4; i++) { await calm(); const bs = await page.$$('[data-a="alloc"][data-d="1"]'); if (!bs[i]) break; await bs[i].click(); await new Promise(r => setTimeout(r, 20)); }
      await click('[data-a="toFire"]'); continue;
    }
    if (ph === 'Pose des bâtiments') { if (await click('[data-a="placeAt"]')) continue; console.log('pose impossible'); break; }
    if (ph === 'Tirs des supports') { if (await click('[data-a="support"]') && await click('[data-a="fireAt"]')) continue; await click('[data-a="endD"]'); continue; }
    console.log('bloqué :', ph); break;
  }
  console.log('journal :', await page.evaluate(() => [...document.querySelectorAll('.log li')].map(l => l.textContent).filter(t => /construit|→|reste en|fusée :|tourelle/.test(t)).slice(0, 10)));
  const fxSeen = await page.evaluate(() => window.__fx);
  console.log('animations jouées :', JSON.stringify(fxSeen));
  const ok = !errs.length && !covered && await page.$('.banner.win') && fxSeen['déplacement'] > 0 && fxSeen['chiffre'] > 0;
  console.log('erreurs :', errs.length ? errs : 'aucune', '| boutons masqués :', covered, '| fin :', await page.evaluate(() => (document.querySelector('.banner.win b') || {}).textContent || 'en cours'), '| phases vues :', Object.keys(shots).join(', '));
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
