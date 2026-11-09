// Partie complète jouée par de vrais clics souris dans Chromium (Playwright).
// Usage : node tests/e2e-partie.js [largeur] [solo]   (ex. 400 pour un téléphone ; solo = essaim ou colonie : le robot
//         joue ce camp contre l'IA, qui joue l'autre)
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
    try { await el.click(); } catch (e) { if (!/not attached|detached/i.test(e.message)) throw e; return false; } // page redessinée pendant le clic
    await new Promise(r => setTimeout(r, 30)); await calm(); return true;
  };
  const phase = () => page.evaluate(() => (document.querySelector('.ph-head b') || document.querySelector('.ho-card h2') || {}).textContent);
  const shots = {}, solo = process.argv[3];
  let waits = 0;
  for (let step = 0; step < 7000; step++) {
    if (await page.$('.banner.win, .pc-win')) break;
    if (solo) {
      if (await click(`[data-a="solo"][data-side="${solo}"]`)) continue;
      if (await page.$('.phase.waiting')) { if (++waits > 20000) { console.log('l\'IA ne joue plus'); break; } step--; await new Promise(r => setTimeout(r, 50)); continue; }
    }
    if (await click('[data-a="local"]')) continue;
    if (await click('[data-a="reveal"]')) continue;
    if (await click('[data-a="famine"][data-v="1"]')) continue;
    if (await click('[data-a="draw"]')) continue;
    if (await page.evaluate(() => { const b = [...document.querySelectorAll('[data-a="pickOne"]:not([disabled])')]; if (!b.length) return false; b[b.length - 1 - Math.floor(Math.random() * Math.min(3, b.length))].dataset.robot = '1'; return true; }) && await click('[data-a="pickOne"][data-robot]')) continue; // pioche au choix : prendre le maximum de cartes
    if (await click('[data-a="pickGo"]')) continue;
    if (await click('[data-a="spellPick"]')) continue; // un sortilège parmi deux
    if (await click('[data-a="relocate"]')) continue; // Reconversion
    if (await page.evaluate(() => { const b = [...document.querySelectorAll('[data-a="tdraw"]:not([disabled])')]; if (!b.length) return false; b[Math.floor(Math.random() * b.length)].dataset.robot = '1'; return true; }) && await click('[data-a="tdraw"][data-robot]')) continue; // pioche de la colonie, tuile par tuile
    const ph = await phase();
    if (!shots[ph]) { shots[ph] = 1;  }
    if (ph === 'Déploiement et améliorations') { if (await click('[data-a="sapTarget"]')) continue; if (!(await page.$('.ccard.sel'))) { if (await click('[data-a="card"]:not([disabled])') && await click('[data-a="deployAt"]')) continue; } await click('[data-a="invest"][data-n="99"]'); await click('[data-a="endDeploy"]'); continue; }
    if (ph === 'Améliorations') { await click('[data-a="invest"][data-n="99"]'); await click('[data-a="toAttacks"]'); continue; }
    if (ph === 'Réaction de la colonie') { if (await click('[data-a="spell"]')) { if (!(await click('[data-a="spellArg"]'))) await click('[data-a="spellCancel"]'); } await click('[data-a="reactDone"]'); continue; }
    if (ph === 'Attaques') { // une créature à la main (chemin, puis attaque), puis « Tout résoudre et finir le tour »
      if (await click('.board .cell.mv')) continue; if (await click('[data-a="strike"]')) continue; if (await click('[data-a="rest"]')) continue;
      if (!(await page.$('.board .tok.go[data-done-robot]')) && await page.evaluate(() => { const t = document.querySelector('.board .tok.go'); if (!t || window.__robotOne) return false; window.__robotOne = 1; return true; }) && await click('.board .tok.go')) continue;
      await page.evaluate(() => { window.__robotOne = 0; }); await click('[data-a="actAll"]'); continue; }
    if (ph === 'Tour de la colonie') {
      if (!(await page.$('.tcard.sel'))) { if (await click('[data-a="tile"]:not([disabled])') && await click('[data-a="buildAt"]')) continue; } // construction immédiate : tuile puis case
      await click('[data-a="build"]'); continue;
    }
    if (ph === 'Pose des bâtiments') { if (await click('[data-a="placeAt"]')) continue; console.log('pose impossible'); break; }
    if (ph === 'Tirs des supports') { if (await click('[data-a="support"]') && await click('[data-a="fireAt"]')) continue; await click('[data-a="endD"]'); continue; }
    console.log('bloqué :', ph); break;
  }
  console.log('journal :', await page.evaluate(() => [...document.querySelectorAll('.log li')].map(l => l.textContent).filter(t => /construit|→|reste en|fusée :|tourelle/.test(t)).slice(0, 10)));
  const fxSeen = await page.evaluate(() => window.__fx);
  console.log('animations jouées :', JSON.stringify(fxSeen));
  const ok = !errs.length && !covered && await page.$('.banner.win, .pc-win') && fxSeen['déplacement'] > 0 && fxSeen['chiffre'] > 0;
  console.log('erreurs :', errs.length ? errs : 'aucune', '| boutons masqués :', covered, '| fin :', await page.evaluate(() => (document.querySelector('.banner.win b, .pc-win .hf-sub') || {}).textContent || 'en cours'), '| phases vues :', Object.keys(shots).join(', '));
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
