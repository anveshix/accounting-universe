/* Progress backup: Export, then Restore on a new device. A student who loses a phone or clears the browser must get their progress back, and restoring
   must merge (never replace), never duplicate, and refuse files that are not progress files. */
const { chromium } = require('playwright');
const { spawn, execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const PORT = 4211,
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
const FILE = path.join(require('node:os').tmpdir(), 'au-restore-test.json');
(async () => {
  const hs = path.join(execSync('npm root -g').toString().trim(), 'http-server/bin/http-server');
  const srv = spawn('node', [hs, path.join(__dirname, '../apps/web/dist'), '-p', String(PORT), '-a', '127.0.0.1', '-c-1', '--silent'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errors = [];
  const device = async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => {
      if (m.type() === 'error') errors.push('console: ' + m.text());
    });
    await page.goto(BASE + '#/');
    await page.waitForSelector('html[data-app="ready"]');
    return { ctx, page };
  };
  const go = async (page, hash) => {
    await page.goto(BASE + '#/');
    await page.goto(BASE + hash);
    await page.waitForSelector('main[data-route]');
    await page.waitForTimeout(150);
  };
  const answerWrong = async (page, skill, seed) => {
    await go(page, `#/practice/${skill}/${seed}/practice`);
    await page.waitForSelector('.question');
    await page.fill('#ans-0', '1');
    await page.click('button[type=submit]');
    await page.waitForSelector('.question[data-state="SUBMITTED"]');
    await page.waitForSelector('html[data-saving="0"]');
  };
  const attemptsShown = async page => {
    await go(page, '#/progress');
    await page.waitForSelector('.lead');
    return Number((await page.textContent('.lead')).match(/(\d+) practice attempts/)[1]);
  };
  try {
    // ── device A: three attempts, a name, then export
    const A = await device();
    for (const [s, seed] of [
      ['dep-wdv', 11],
      ['dep-slm', 12],
      ['dep-wdv', 13],
    ])
      await answerWrong(A.page, s, seed);
    await go(A.page, '#/progress');
    await A.page.fill('#pname', 'Asha');
    await A.page.click('text=Save name');
    await A.page.waitForSelector('html[data-saving="0"]');
    const [dl] = await Promise.all([A.page.waitForEvent('download'), A.page.click('text=Export my progress')]);
    await dl.saveAs(FILE);
    const exported = JSON.parse(fs.readFileSync(FILE));
    ok(exported.attempts.length === 3 && exported.profile?.name === 'Asha', 'export: three attempts and the name are in the file');
    ok(/Keep this file safe/.test(await A.page.textContent('main')), 'export: the page tells the student the file is their backup');
    await A.ctx.close();

    // ── device B: brand new. Restore.
    const B = await device();
    ok((await attemptsShown(B.page)) === 0, 'new device: starts at 0 attempts');
    await go(B.page, '#/progress');
    await B.page.setInputFiles('input[aria-label="Import a progress file"]', FILE);
    await B.page.waitForFunction(() => /Restored 3 attempts/.test(document.body.innerText) || performance.getEntriesByType('navigation').length > 0, null, { timeout: 8000 }).catch(() => {});
    await B.page.waitForTimeout(1600); // the page reloads itself
    await B.page.waitForSelector('html[data-app="ready"]');
    ok((await attemptsShown(B.page)) === 3, 'restore: the new device now shows all 3 attempts');
    ok((await B.page.$eval('#pname', e => e.value)) === 'Asha', 'restore: the name came back');
    ok(/3 practice attempts/.test(await B.page.textContent('.lead')), 'restore: the progress summary counts them');

    // ── restoring the same file again adds nothing
    await go(B.page, '#/progress');
    await B.page.setInputFiles('input[aria-label="Import a progress file"]', FILE);
    await B.page.waitForTimeout(900);
    ok(/Nothing new/.test(await B.page.textContent('main')), 'twice: the second restore says nothing is new');
    ok((await attemptsShown(B.page)) === 3, 'twice: still exactly 3 attempts (no duplicates)');
    await B.ctx.close();

    // ── device C already has its own two attempts: restore MERGES
    const C = await device();
    for (const [s, seed] of [
      ['dep-wdv', 21],
      ['dep-slm', 22],
    ])
      await answerWrong(C.page, s, seed);
    ok((await attemptsShown(C.page)) === 2, 'merge: this device has its own 2 attempts first');
    await go(C.page, '#/progress');
    await C.page.fill('#pname', 'Ravi');
    await C.page.click('text=Save name');
    await C.page.waitForSelector('html[data-saving="0"]');
    await C.page.setInputFiles('input[aria-label="Import a progress file"]', FILE);
    await C.page.waitForTimeout(1800);
    await C.page.waitForSelector('html[data-app="ready"]');
    ok((await attemptsShown(C.page)) === 5, 'merge: 2 own + 3 restored = 5, nothing replaced');
    ok((await C.page.$eval('#pname', e => e.value)) === 'Ravi', 'merge: the name already on this device is kept');
    // ── rewards come back with the attempts: a file of perfect attempts restores XP and a level (XP is worked out from attempts, wrong answers earn none)
    const perfect = {
      app: 'accounting-universe',
      version: 1,
      exportedAt: Date.now(),
      profile: { cls: 'XI', route: 'OPTION_I_ANALYSIS', name: 'Meera' },
      seen: [],
      attempts: Array.from({ length: 6 }, (_, i) => ({
        t: Date.now() - (6 - i) * 3600000,
        skill: 'dep-wdv',
        clause: 'XI.2.depreciation',
        seed: 100 + i,
        mode: 'PRACTICE',
        marks: 2,
        outOf: 2,
        hintsUsed: 0,
        mistakes: [],
        correctParts: 2,
        parts: 2,
      })),
    };
    fs.writeFileSync(FILE + '.perfect', JSON.stringify(perfect));
    const D = await device();
    await go(D.page, '#/progress');
    const xp0 = await D.page.$eval('.hud', e => Number(e.getAttribute('data-xp')));
    await D.page.setInputFiles('input[aria-label="Import a progress file"]', FILE + '.perfect');
    await D.page.waitForTimeout(1800);
    await D.page.waitForSelector('html[data-app="ready"]');
    await go(D.page, '#/progress');
    const xp1 = await D.page.$eval('.hud', e => Number(e.getAttribute('data-xp')));
    ok(xp0 === 0 && xp1 > 0, `restore: XP comes back with the attempts (${xp0} → ${xp1})`);
    ok((await D.page.$eval('#pname', e => e.value)) === 'Meera', 'restore: a file for a different student restores onto an empty device');
    await D.ctx.close();

    // ── refusals
    fs.writeFileSync(FILE + '.bad', '{"hello":1}');
    await go(C.page, '#/progress');
    await C.page.setInputFiles('input[aria-label="Import a progress file"]', FILE + '.bad');
    await C.page.waitForTimeout(500);
    ok(/Cannot restore: not an Accounting Universe progress file/.test(await C.page.textContent('main')), 'a file that is not a progress file is refused with a reason');
    fs.writeFileSync(FILE + '.junk', 'not json at all');
    await C.page.setInputFiles('input[aria-label="Import a progress file"]', FILE + '.junk');
    await C.page.waitForTimeout(500);
    ok(/not valid JSON/.test(await C.page.textContent('main')), 'text that is not JSON is refused');
    ok((await attemptsShown(C.page)) === 5, 'refusals change nothing (still 5)');
    await C.ctx.close();
  } catch (e) {
    fails.push('crash: ' + ((e && e.stack) || e));
  }
  ok(errors.length === 0, 'no console errors: ' + errors.join(' | '));
  await browser.close();
  srv.kill();
  console.log(`web-app-restore: ${pass} passed, ${fails.length} failed`);
  if (fails.length) {
    for (const f of fails) console.log(' -', f);
    process.exit(1);
  }
})();
