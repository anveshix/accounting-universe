/* Browser checks for the chapter-wise visual simulators: gallery, live controls, challenge → XP, class/option filtering. */
const { chromium } = require('playwright');
const { execSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const PORT = 4189,
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
  const srv = spawn('node', [hs, path.join(__dirname, '../apps/web/dist'), '-p', String(PORT), '-a', '127.0.0.1', '-c-1', '--silent'], { stdio: 'ignore' });
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
      await page.waitForFunction(() => !document.querySelector('.toast') && document.getAnimations().every(a => a.playState !== 'running'), null, { timeout: 12000 }).catch(() => {});
      await page.evaluate(AXE);
      const r = await page.evaluate(async () =>
        (await window.axe.run(document, { resultTypes: ['violations'] })).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => `${v.id}: ${v.nodes[0].target.join(' ')}`),
      );
      ok(r.length === 0, `axe ${label}: no serious/critical violations — ${r.join('; ')}`);
    };

    // ── discoverable from home and from the labs index, and it highlights Visual labs
    await go('#/');
    ok((await page.getAttribute('.sims-band a', 'href')) === '#/sims', 'home links to the simulator gallery');
    await go('#/sims');
    ok((await page.textContent('nav a[aria-current="page"]')) === 'Visual labs', 'the gallery lives under the Visual labs navigation item');
    ok((await page.$$eval('.labhead h2', h => h.map(x => x.textContent))).join() === 'Visual simulators', 'gallery heading');
    ok((await page.$$eval('.simchapter > .section-head h3', h => h.map(x => x.textContent))).length === 2, 'Class XI gallery is grouped into 2 chapters');
    ok((await page.$$eval('.simcard', c => c.length)) === 3, 'Class XI has 3 chapter simulators');
    ok(/0 of 3 solved/.test(await page.textContent('.simportop b')), 'progress starts at 0 of 3');
    ok(
      (await page.$$eval('.simcard p', p => p.map(x => x.textContent.trim()))).every(t => t.length > 30),
      'each card says why the chapter needs a picture',
    );
    await axe('gallery');

    // ── one simulator: the picture moves with the control
    await page.click('[data-sim="sim-brs"]');
    await page.waitForSelector('main[data-route="sim"]');
    await page.waitForSelector('#ctl-steps');
    ok((await page.textContent('.simhead b')).trim() === '₹38,900.00', 'BRS: default headline is the pass book balance');
    ok((await page.$$eval('.simrow', r => r.length)) === 5, 'BRS: one bar per reconciling item plus the starting balance');
    await page.$eval('#ctl-steps', el => {
      el.value = '0';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page
      .waitForFunction(() => document.querySelector('.simhead b')?.textContent.trim() === '₹40,000.00', null, { timeout: 3000 })
      .then(
        () => ok(true, ''),
        () => ok(false, 'BRS: moving the slider redraws the picture'),
      );
    ok((await page.textContent('.simrow:first-child .simval')).trim() === '₹40,000.00', 'BRS: the first bar is the untouched cash book');
    ok((await page.$$eval('.simnotes li', l => l.length)) === 3, 'BRS: three “what to notice” points');
    await axe('simulator');

    // ── the challenge: a wrong answer is explained and not scored, the right one pays XP
    const xpBefore = await page.getAttribute('.hud', 'data-xp');
    await page.click('.simchallenge .simactions button:nth-of-type(2)');
    ok(/Not that one/.test(await page.textContent('.simchallenge')), 'BRS: a wrong option says so in place');
    ok((await page.getAttribute('.hud', 'data-xp')) === xpBefore, 'BRS: a wrong answer earns no XP');
    await page.click('.simchallenge .simactions button:nth-of-type(1)');
    await page.waitForSelector('.simchallenge .note.good', { timeout: 4000 });
    ok(/Correct/.test(await page.textContent('.simchallenge')), 'BRS: the right option is confirmed with its reason');
    ok((await page.$$eval('.simchallenge button', b => b.length)) === 0, 'BRS: options are replaced once solved');
    await page
      .waitForFunction(() => document.querySelector('.hud')?.getAttribute('data-xp') === '20', null, { timeout: 4000 })
      .then(
        () => ok(true, ''),
        () => ok(false, 'BRS: solving pays 5 (first see the example) + 10 (solved) on top of the visit’s 5'),
      );

    // ── it is remembered
    await page.reload();
    await page.waitForSelector('main[data-route="sim"]');
    await page
      .waitForFunction(() => /Challenge solved/.test(document.querySelector('.simchallenge')?.textContent ?? ''), null, { timeout: 4000 })
      .then(
        () => ok(true, ''),
        () => ok(false, 'BRS: the solved challenge survives a reload'),
      );
    await page.goto(BASE + '#/sims');
    await page.waitForSelector('.simcard');
    ok((await page.textContent('.simportop b')).includes('1 of 3 solved'), 'gallery counts the solved challenge');
    ok((await page.getAttribute('[data-sim="sim-brs"]', 'data-solved')) === 'true', 'the solved card is marked');

    // ── Class XII is grouped by its own chapters, and Option II hides the Option I chapters
    await go('#/');
    await page.click('.classpick .bigchoice:nth-of-type(2)');
    await page.waitForTimeout(250);
    await page.goto(BASE + '#/sims');
    await page.waitForSelector('.simcard');
    ok((await page.$$eval('.simchapter', c => c.length)) === 4, 'Class XII gallery is grouped into 4 chapters');
    ok((await page.$$eval('.simcard', c => c.length)) === 4, 'Class XII Option I has 4 simulators');
    await go('#/');
    await page.click('input[name="route"][value="OPTION_II_COMPUTERISED"]');
    await page.waitForTimeout(250);
    await page.goto(BASE + '#/sims');
    await page.waitForSelector('.simcard');
    ok((await page.$$eval('.simcard', c => c.length)) === 2, 'Option II shows only the chapters it examines (partnership, companies)');
    await go('#/');
    await page.click('input[name="route"][value="OPTION_I_ANALYSIS"]');
    await page.waitForTimeout(200);

    // ── the badge shelf knows the new badge, still locked with one solve
    await go('#/progress');
    ok((await page.$$eval('[data-badge]', b => b.length)) === 9, '9 badges on the shelf (the new one is Visual Thinker)');
    ok((await page.getAttribute('[data-badge="visual-thinker"]', 'data-earned')) === 'false', 'Visual Thinker is still locked after one solve');
    ok(/5/.test(await page.textContent('[data-badge="visual-thinker"] small')), 'the locked badge says how to earn it');

    // ── phone width: no sideways scroll, bars stay inside the card
    const phone = await ctx.newPage();
    for (const w of [390, 360, 320]) {
      await phone.setViewportSize({ width: w, height: 780 });
      await phone.goto(BASE + '#/sim/sim-ratios');
      await phone.waitForSelector('.simrow');
      const over = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(over <= 1, `simulator at ${w}px does not scroll sideways (over by ${over}px)`);
      ok((await phone.$$eval('.simrow', r => r.length)) === 4, `ratios simulator draws its 4 bars at ${w}px`);
    }
    await phone.close();
  } catch (e) {
    fails.push('exception: ' + e.message);
    console.log(e);
  }
  ok(errors.length === 0, 'no console/page errors: ' + errors.join(' | '));
  await browser.close();
  srv.kill();
  console.log(`sims e2e: ${pass} passed, ${fails.length} failed`);
  process.exit(fails.length ? 1 : 0);
})();
