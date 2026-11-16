/* Browser checks for lab UX: live recompute, focus on error, in-place reset/clear, session persistence, share link. */
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const PORT = 4177,
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

(async () => {
  const hs = path.join(require('child_process').execSync('npm root -g').toString().trim(), 'http-server/bin/http-server');
  const srv = spawn('node', [hs, path.join(__dirname, '../apps/web/dist'), '-p', String(PORT), '-a', '127.0.0.1', '-c-1', '--silent'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => {
      if (m.type() === 'error') errors.push('console: ' + m.text());
    });
    await page.goto(BASE + '#/lab/xi-depreciation');
    await page.waitForSelector('article[data-tab]');
    await page.click('#tab-try');
    await page.waitForSelector('.result[data-state="OK"]');

    // live recompute: change the cost, no button press
    await page.fill('#f-cost', '80000');
    await page.fill('#f-rate', '12.5');
    await page
      .waitForFunction(() => document.querySelector('.result')?.textContent?.includes('₹10,000.00') && document.querySelector('.result')?.textContent?.includes('8,750'), null, { timeout: 3000 })
      .then(
        () => ok(true, ''),
        () => ok(false, 'labs: result updates live as the student types'),
      );

    // focus moves to the failing field on submit; error is linked
    await page.fill('#f-years', 'abc');
    await page.click('button:has-text("Work it out")');
    await page.waitForSelector('.result[data-state="ERROR"]');
    ok(await page.evaluate(() => document.activeElement?.id === 'f-years'), 'labs: focus moves to the invalid field');
    ok((await page.getAttribute('#f-years', 'aria-describedby')) === 'lab-error', 'labs: invalid field is described by the error message');

    // reset keeps the page and refills in place
    await page.click('button:has-text("Reset to example")');
    await page.waitForSelector('.result[data-state="OK"]');
    ok((await page.inputValue('#f-cost')) === '100000', 'labs: reset restores the example in place');

    // clear shows a friendly note, not an error wall
    await page.click('button:has-text("Clear all")');
    ok((await page.$('.result .note.bad')) === null && /empty/.test(await page.textContent('.result')), 'labs: clear all shows a neutral hint, not errors');

    await page.click('button:has-text("Reset to example")');
    // what-if chip applies a change and highlights what moved
    await page.click('button[data-whatif="Use SLM instead"]');
    await page.waitForSelector('.result td.moved', { timeout: 3000 }).then(
      () => ok(true, ''),
      () => ok(false, 'labs: what-if highlights changed figures'),
    );
    ok((await page.inputValue('#f-method')) === 'SLM', 'labs: what-if sets the field in place');
    ok(/Straight line charges/.test(await page.textContent('.whatif-prompt')), 'labs: what-if explains what to look for');
    await page.click('button:has-text("Reset to example")');

    // persistence across navigation (same tab)
    await page.fill('#f-cost', '55000');
    await page.goto(BASE + '#/labs');
    await page.goto(BASE + '#/lab/xi-depreciation');
    await page.waitForSelector('article[data-tab]');
    await page.click('#tab-try');
    ok((await page.inputValue('#f-cost')) === '55000', 'labs: numbers survive leaving and returning (this tab)');

    // share link round trip into a fresh context
    await page.click('button:has-text("Copy link")');
    const link = await page.evaluate(() => navigator.clipboard.readText());
    ok(/#\/lab\/xi-depreciation\/[A-Za-z0-9_-]+$/.test(link), 'labs: copied link carries the numbers');
    const p2 = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await p2.goto(link);
    await p2.waitForSelector('article[data-tab="try"]');
    ok((await p2.inputValue('#f-cost')) === '55000', 'labs: opening the shared link restores the numbers on the Try tab');
    await p2.goto(BASE + '#/lab/xi-depreciation/@@bad@@');
    await p2.waitForSelector('article[data-tab]');
    ok(await p2.$eval('article', a => a.getAttribute('data-tab') === 'learn'), 'labs: a corrupt link falls back to the normal lab');

    // Hindi draft: labelled as a draft, teaching text in Hindi, figures untouched
    const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await p3.goto(BASE + '#/lab/xi-brs');
    await p3.waitForSelector('article[data-tab]');
    await p3.click('[data-lang-toggle]');
    await p3.waitForSelector('[data-draft="hi-lab"]', { timeout: 3000 }).then(
      () => ok(true, ''),
      () => ok(false, 'labs: Hindi lab shows the draft banner'),
    );
    ok(/बैंक समाधान/.test(await p3.textContent('.labhead h2')), 'labs: Hindi title shown');
    await p3.click('#tab-example');
    ok(/56,500/.test(await p3.textContent('.walk')) && /₹56,500\.00/.test(await p3.textContent('#labpanel')), 'labs: Hindi walkthrough keeps the engine figures');
    await p3.goto(BASE + '#/lab/xi-gst');
    await p3.waitForSelector('article[data-tab]');
    ok((await p3.$('[data-draft="hi-lab"]')) === null, 'labs: untranslated labs stay English without a false Hindi banner');
  } catch (e) {
    fails.push('exception: ' + e.message);
    console.log(e);
  }
  ok(errors.length === 0, 'no console/page errors: ' + errors.join(' | '));
  await browser.close();
  srv.kill();
  console.log(`labs e2e: ${pass} passed, ${fails.length} failed`);
  process.exit(fails.length ? 1 : 0);
})();
