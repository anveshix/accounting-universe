/* Classroom TLM factory, Error Detective, six-item navigation, and "visits earn nothing" rewards. Build apps/web first. Optional SHOTS=<dir> saves screenshots + sample A4 PDFs. */
const { chromium } = require('playwright');
const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const PORT = 4182,
  BASE = `http://127.0.0.1:${PORT}/`,
  OUT = process.env.SHOTS || '';
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
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
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
  };
  const axe = async label => {
    await page.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 12000 }).catch(() => {});
    await page.evaluate(AXE);
    const r = await page.evaluate(async () =>
      (await window.axe.run(document, { resultTypes: ['violations'] })).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => `${v.id}: ${v.nodes[0].target.join(' ')}`),
    );
    ok(r.length === 0, `axe ${label}: no serious/critical violations — ${r.join('; ')}`);
  };
  const shot = async n => {
    if (OUT) {
      fs.mkdirSync(OUT, { recursive: true });
      await page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
    }
  };
  const xp = () => page.getAttribute('.hud', 'data-xp');
  try {
    // ── navigation: six items, Learn follows the chosen class, every old URL still works
    await go('#/');
    ok(
      JSON.stringify(await page.$$eval('header ~ nav a, nav#nav a', as => as.map(a => a.textContent))) === JSON.stringify(['Home', 'Learn', 'Explore', 'Challenge', 'My progress', 'Classroom TLM']),
      'nav: Home, Learn, Explore, Challenge, My progress, Classroom TLM',
    );
    ok((await page.getAttribute('nav#nav a:nth-child(3)', 'href')) === '#/class/XI', 'nav: Learn opens the chosen class (XI)');
    await page.click('.bigchoice:has-text("Class XII")');
    ok((await page.getAttribute('nav#nav a:nth-child(3)', 'href')) === '#/class/XII', 'nav: Learn follows the class choice (XII)');
    await page.click('.bigchoice:has-text("Class XI")');
    for (const [hash, label] of [
      ['#/study', 'Learn'],
      ['#/notes', 'Learn'],
      ['#/labs', 'Explore'],
      ['#/ledger', 'Explore'],
      ['#/crisis', 'Challenge'],
      ['#/practice', 'Challenge'],
      ['#/progress', 'My progress'],
      ['#/teacher', 'Classroom TLM'],
      ['#/tlm', 'Classroom TLM'],
      ['#/detective', 'Challenge'],
    ]) {
      await go(hash);
      ok((await page.textContent('nav a[aria-current="page"]')) === label, `${hash} highlights ${label}`);
    }
    // ── rewards: opening pages earns nothing
    await go('#/study/XI.2.journal');
    await go('#/labs');
    await go('#/lab/xi-brs');
    ok((await xp()) === '0' && (await page.getAttribute('.hud', 'data-streak')) === '0', 'rewards: opening study pages and labs earns 0 XP and no streak day');

    // ── TLM hub
    await go('#/tlm');
    ok((await page.$$eval('[data-tlm-topic]', c => c.length)) === 4, 'TLM hub lists 4 topic kits');
    await shot('tlm-hub');
    await axe('tlm hub');

    // ── TLM kit page: hand-worked numbers for set 7 (see packages/curriculum/test/tlm.test.ts)
    await go('#/tlm/XI.2.tb-s7');
    ok((await page.$$eval('.sheet', s => s.length)) === 4, 'kit: worksheet, key, transaction cards, account cards');
    const key = await page.$eval('[data-sheet="key"]', e => e.innerText);
    ok(/5,05,000\.00/.test(key) && /3,50,000\.00/.test(key) && /75,000\.00/.test(key), 'answer key: trial balance totals ₹5,05,000.00; cash ₹3,50,000.00; bank ₹75,000.00');
    ok((await page.$$eval('[data-sheet="txncards"] .pcard', c => c.length)) === 10, 'ten transaction cards');
    ok((await page.$$eval('[data-sheet="acctcards"] .pcard', c => c.length)) === 20, 'account cards: two of each of the ten accounts');
    ok((await page.$$eval('.tlm-preds > li', c => c.length)) === 11, 'eleven teacher prediction questions (ten entries + will the trial balance agree)');
    const wk = await page.$eval('[data-sheet="worksheet"]', e => e.innerText);
    ok(!/5,05,000/.test(wk), 'worksheet does not leak the answer total');
    ok((await page.inputValue('.tlm-link')).endsWith('#/tlm/XI.2.tb-s7-play'), 'student link is the same seeded set');
    await shot('tlm-kit');
    await axe('tlm kit');

    // ── print: only the chosen sheet is visible, chrome is hidden, A4 PDF is produced
    await page.evaluate(() => document.body.setAttribute('data-print', 'worksheet'));
    await page.emulateMedia({ media: 'print' });
    ok(
      (await page.isVisible('[data-sheet="worksheet"]')) && !(await page.isVisible('[data-sheet="key"]')) && !(await page.isVisible('header.top')) && !(await page.isVisible('.tlm-controls')),
      'print worksheet: only the worksheet shows',
    );
    if (OUT) await page.pdf({ path: `${OUT}/tlm-worksheet-XI.2.tb-s7.pdf`, format: 'A4', printBackground: true });
    await page.evaluate(() => document.body.setAttribute('data-print', 'key'));
    ok((await page.isVisible('[data-sheet="key"]')) && !(await page.isVisible('[data-sheet="worksheet"]')), 'print key: only the key shows');
    if (OUT) await page.pdf({ path: `${OUT}/tlm-key-XI.2.tb-s7.pdf`, format: 'A4', printBackground: true });
    await page.evaluate(() => document.body.setAttribute('data-print', 'match'));
    ok(
      (await page.isVisible('[data-sheet="txncards"]')) && (await page.isVisible('[data-sheet="acctcards"]')) && !(await page.isVisible('[data-sheet="key"]')),
      'print matching set: transaction + account cards only',
    );
    if (OUT) await page.pdf({ path: `${OUT}/tlm-cards-XI.2.tb-s7.pdf`, format: 'A4', printBackground: true });
    await page.evaluate(() => document.body.removeAttribute('data-print'));
    await page.emulateMedia({ media: 'screen' });

    // ── journal worksheet + key content (journal format, narration)
    await go('#/tlm/XI.2.journal-s7');
    ok(
      /Cash A\/c \.+ Dr\./.test(await page.$eval('[data-sheet="key"]', e => e.innerText)) && /To Capital A\/c/.test(await page.$eval('[data-sheet="key"]', e => e.innerText)),
      'journal key uses the Dr / To format',
    );
    await go('#/tlm/XI.2.ledger-s7');
    ok(
      (await page.$$eval('[data-sheet="key"] .tacct', c => c.length)) === 10 && /By Balance c\/d/.test(await page.$eval('[data-sheet="key"]', e => e.innerText)),
      'ledger key: ten balanced T-accounts',
    );

    // ── smartboard: predict → reveal → next, keyboard operable, machine-driven
    await go('#/tlm/XI.2.rules-s7');
    await page.click('[data-tlm-present]');
    await page.waitForSelector('.tlm-stage[data-machine="tlm-stage"][data-state="PREDICT"]');
    ok(!(await page.$('[data-answer]')), 'stage: the answer is hidden until the teacher reveals');
    await page.keyboard.press('ArrowRight');
    await page.waitForSelector('.tlm-stage[data-state="REVEALED"] [data-answer]');
    ok(/Cash/.test(await page.textContent('.stage-side.dr')) && /Capital/.test(await page.textContent('.stage-side.cr')), 'stage: transaction 1 reveals Dr Cash / Cr Capital');
    await shot('tlm-stage-reveal');
    await axe('tlm stage');
    await page.keyboard.press('ArrowLeft');
    ok((await page.getAttribute('.tlm-stage', 'data-state')) === 'PREDICT', 'stage: Back hides the answer again');
    for (let k = 0; k < 20; k++) await page.keyboard.press('ArrowRight');
    await page.waitForSelector('.tlm-stage[data-state="SUMMARY"]');
    ok(/5,05,000\.00/.test(await page.textContent('.stage-table')), 'stage: summary shows the trial balance total ₹5,05,000.00');
    await shot('tlm-stage-summary');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.tlm-stage', { state: 'hidden' });
    ok(true, 'stage: Escape closes the smartboard');

    // ── student activity from the shared link: records genuine attempts
    await go('#/tlm/XI.2.rules-s7-play');
    ok((await page.textContent('.stem')).includes('₹4,00,000'), 'student link opens the same set (first transaction ₹4,00,000)');
    await page.selectOption('#tdr', 'cash');
    await page.selectOption('#tcr', 'sales');
    await page.click('button[type=submit]');
    ok(/Not quite/.test(await page.textContent('[aria-live=polite]')) && (await xp()) === '0', 'student: a wrong answer is explained and earns 0 XP');
    await page.click('button.primary:not([type=submit])');
    await page.selectOption('#tdr', 'bank');
    await page.selectOption('#tcr', 'cash');
    await page.click('button[type=submit]');
    await page.waitForFunction(() => Number(document.querySelector('.hud')?.getAttribute('data-xp')) > 0);
    ok(Number(await xp()) > 0, 'student: a correct answer is a recorded attempt and earns XP');
    await shot('tlm-student');

    // ── Error Detective: find the "rent debited to Salary" case, solve it
    let found = false;
    for (let s = 1; s <= 60 && !found; s++) {
      await go('#/detective/' + s);
      found = /debited Salary A\/c/.test(await page.textContent('[data-detective]'));
    }
    ok(found, 'detective: a known case can be reached by seed');
    await shot('detective-case');
    await axe('detective');
    await page.click('button[type=submit]');
    ok(/Answer every step/.test(await page.textContent('[data-result]')), 'detective: unanswered steps are refused with a sentence');
    await page.selectOption('#dc-class', 'COMMISSION');
    await page.selectOption('#dc-tb', 'yes');
    await page.selectOption('#dc-dr', 'Rent');
    await page.selectOption('#dc-cr', 'Salary');
    const before = Number(await xp());
    await page.click('button[type=submit]');
    await page.waitForSelector('form[data-state="SOLVED"]');
    ok(/Case solved/.test(await page.textContent('[data-result]')) && /Dr Rent/.test(await page.textContent('[data-result]')), 'detective: correct solution is confirmed and explained');
    await page.waitForFunction(b => Number(document.querySelector('.hud')?.getAttribute('data-xp')) > b, before);
    ok(true, 'detective: a solved case earns XP through a recorded attempt');
    await shot('detective-solved');

    // ── home: decluttered, entries to the new experiences, mobile has no horizontal scroll
    await go('#/');
    ok(
      (await page.getAttribute('[data-home-detective]', 'href')) === '#/detective' && (await page.getAttribute('[data-home-tlm]', 'href')) === '#/tlm',
      'home: entries to Error Detective and Classroom TLM',
    );
    await shot('home-desktop');
    await page.setViewportSize({ width: 390, height: 800 });
    for (const h of ['#/', '#/tlm', '#/tlm/XI.2.journal-s7', '#/detective/1']) {
      await go(h);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `mobile: no horizontal page scroll on ${h}`);
      if (h === '#/') await shot('home-mobile');
      if (h === '#/tlm/XI.2.journal-s7') await shot('tlm-kit-mobile');
    }
  } catch (e) {
    fails.push('crash: ' + ((e && e.stack) || e));
  }
  ok(errors.length === 0, 'no console errors: ' + errors.join(' | '));
  await browser.close();
  srv.kill();
  console.log(`web-app-tlm: ${pass} passed, ${fails.length} failed`);
  if (fails.length) {
    for (const f of fails) console.log(' -', f);
    process.exit(1);
  }
})();
