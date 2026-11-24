/* Browser checks for the 10 Flagship CBSE Class XI & XII Simulator & Visualiser Experiences (A–J). */
const { chromium } = require('playwright');
const { execSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const PORT = 4192,
  BASE = `http://127.0.0.1:${PORT}/`;
let pass = 0;
const fails = [];
const ok = (c, m) => {
  if (c) pass++;
  else {
    fails.push(m);
    console.log('  ✗', m);
  }
};
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js', { paths: [path.join(__dirname, '../apps/web'), path.join(__dirname, '..')] }), 'utf8');

(async () => {
  const hs = path.join(execSync('npm root -g').toString().trim(), 'http-server/bin/http-server');
  const srv = spawn('node', [hs, path.join(__dirname, '../apps/web/dist'), '-p', String(PORT), '-a', '127.0.0.1', '-c-1', '--silent'], {
    stdio: 'ignore',
  });
  await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => {
      if (m.type() === 'error') errors.push('console: ' + m.text());
    });
    const go = async hash => {
      await page.goto(BASE + '#/');
      await page.goto(BASE + hash);
      await page.waitForSelector('html[data-app="ready"]');
      await page.waitForSelector('main[data-route]');
      await page.waitForTimeout(200);
    };
    const axe = async label => {
      await page
        .waitForFunction(() => !document.querySelector('.toast') && document.getAnimations().every(a => a.playState !== 'running'), null, {
          timeout: 12000,
        })
        .catch(() => {});
      await page.evaluate(AXE);
      const r = await page.evaluate(async () =>
        (await window.axe.run(document, { resultTypes: ['violations'] })).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => `${v.id}: ${v.nodes[0].target.join(' ')}`),
      );
      ok(r.length === 0, `axe ${label}: no serious/critical violations — ${r.join('; ')}`);
    };

    // 1. Flagship Hub on #/sims
    await go('#/sims');
    ok((await page.$$eval('[data-core-card]', c => c.length)) === 7, 'Class XI shows 6 core XI labs + 1 XI CAS exposure');
    ok((await page.$$eval('[data-sim-badge]', b => b.length)) === 5, '5 simulator achievement badges shown on hub');
    await axe('flagship-hub');

    // 2. Experience A: Accounting Equation & Rules Lab
    await page.click('[data-core-card="equation-lab"]');
    await page.waitForSelector('[data-core-sim="equation-lab"]');
    ok((await page.textContent('nav a[aria-current="page"]')) === 'Visual labs', 'sim-lab highlights Visual labs nav');
    await page.click('[data-tier="PRACTICE"]');
    await page.click('[data-eq-model]');
    await page.click('[data-eq-verify]');
    await page.waitForSelector('.simlab-win');
    ok(/Mission Verified/.test(await page.textContent('.simlab-win')), 'Equation Lab mission awards verification & XP');
    await axe('equation-lab');

    // 3. Experience G: Partnership Accounting Lab (Class XII)
    await go('#/sim-lab/partnership-lab');
    await page.waitForSelector('[data-core-sim="partnership-lab"]');
    await page.click('[data-part-verify]');
    await page.waitForSelector('.simlab-win');
    ok(/Mission Verified/.test(await page.textContent('.simlab-win')), 'Partnership Lab verifies P&L Appropriation');
    await axe('partnership-lab');

    // 4. Experience J: Computerised Accounting Lab (Maker-Checker)
    await go('#/sim-lab/computerised-accounting-lab');
    await page.waitForSelector('[data-core-sim="computerised-accounting-lab"]');
    await page.click('[data-tier="PRACTICE"]');
    await page.click('[data-cas-queue]');
    await page.click('[data-cas-role="CHECKER"]');
    await page.click('[data-cas-verify-vch]');
    await page.waitForSelector('.simlab-win');
    ok(/Mission Verified/.test(await page.textContent('.simlab-win')), 'CAS Lab Maker-Checker flow verifies voucher');
    await axe('cas-lab');
  } catch (e) {
    fails.push('exception: ' + e.message);
    console.log(e);
  }
  ok(errors.length === 0, 'no console/page errors: ' + errors.join(' | '));
  await browser.close();
  srv.kill();
  console.log(`sim-labs e2e: ${pass} passed, ${fails.length} failed`);
  process.exit(fails.length ? 1 : 0);
})();
