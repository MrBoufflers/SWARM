// Logos des camps (Oni, 06/11/2026) : images/logo colonie.svg et images/logo essaim.svg → assets/logos/*.png (512 px, fond transparent).
// Silhouettes noires utilisées comme masques CSS (build.py) : la couleur vient du camp. À relancer quand un logo change :
//   node tools/logos.js
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const LOGOS = { colonie: 'logo colonie.svg', essaim: 'logo essaim.svg' };
(async () => {
  const out = path.join(ROOT, 'assets/logos'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  for (const [k, f] of Object.entries(LOGOS)) {
    const svg = fs.readFileSync(path.join(ROOT, 'images', f), 'utf8').replace(/<svg([^>]*?)\swidth="\d+"\s+height="\d+"/, '<svg$1');
    // le SVG remplit la page (512 × 512) ; viewBox ajouté s'il manque (logo de la colonie : 2048 × 2048)
    const fixed = /viewBox=/.test(svg) ? svg : svg.replace('<svg', '<svg viewBox="0 0 2048 2048"');
    await p.setContent(`<style>html,body{margin:0;background:transparent}svg{width:512px;height:512px;display:block}</style>${fixed}`);
    await p.screenshot({ path: path.join(out, k + '.png'), omitBackground: true });
    console.log('ok', k, fs.statSync(path.join(out, k + '.png')).size, 'octets');
  }
  await b.close();
})();
