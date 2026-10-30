// Imprime docs/livret.html en PDF (Chromium via Playwright) : docs/swarm-steel-livret-v0.3.pdf
// Usage : npm run livret   (lance d'abord python3 tools/livret.py)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, '../docs/livret.html'));
  const title = await page.title();
  const out = path.join(__dirname, '../docs/swarm-steel-livret-v0.3.pdf');
  await page.pdf({
    path: out, format: 'A4', printBackground: true, displayHeaderFooter: true,
    margin: { top: '22mm', bottom: '20mm', left: '18mm', right: '18mm' },
    headerTemplate: `<div style="font-size:7px;color:#888;width:100%;padding:0 18mm;font-family:Arial">${title}</div>`,
    footerTemplate: '<div style="font-size:7px;color:#888;width:100%;padding:0 18mm;text-align:right;font-family:Arial">Page <span class="pageNumber"></span> sur <span class="totalPages"></span></div>',
  });
  await browser.close();
  console.log('ok', path.relative(path.join(__dirname, '..'), out));
})();
