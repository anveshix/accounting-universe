/* Browser checks for the Trial Balance Crisis challenge. The test plays like a student: it finds the difference from the totals on screen,
   finds the spoiled account by comparing each ledger account with the journal on screen, and derives the rectifying entry by the textbook rule
   (Suspense sits on the short side; the entry closes it from the other side). Nothing is read from the app's own answer until the solution panel is checked. */
const { chromium } = require('playwright');
const { spawn, execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const PORT = 4183,
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
const num = s => Number(String(s).replace(/[₹,\s]/g, ''));

(async () => {
  const hs = path.join(execSync('npm root -g').toString().trim(), 'http-server/bin/http-server');
  const srv = spawn('node', [hs, path.join(__dirname, '../apps/web/dist'), '-p', String(PORT), '-a', '127.0.0.1', '-c-1', '--silent'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  const st = () => page.$eval('.crisis', e => e.getAttribute('data-state'));
  const waitState = s => page.waitForSelector(`.crisis[data-machine="tb-crisis"][data-state="${s}"]`);
  const open = async seed => {
    await page.goto(BASE + '#/');
    await page.goto(BASE + `#/crisis/${seed}`);
    await page.waitForSelector('html[data-app="ready"]');
    await waitState('DIAGNOSE');
  };
  const hud = k => page.$eval(`[data-hud="${k}"]`, (e, k) => e.getAttribute('data-' + k), k);
  const axe = async label => {
    await page.evaluate(AXE);
    const r = await page.evaluate(async () =>
      (await window.axe.run(document, { resultTypes: ['violations'] })).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => `${v.id}: ${v.nodes[0].target.join(' ')}`),
    );
    ok(r.length === 0, `axe ${label}: no serious/critical violations — ${r.join('; ')}`);
  };

  /** what a student can work out from the screen (English mode) */
  const diagnose = async () => {
    const dr = num(await page.textContent('[data-total="dr"]')),
      cr = num(await page.textContent('[data-total="cr"]'));
    return { diff: Math.abs(dr - cr), side: dr < cr ? 'DR' : 'CR', dr, cr };
  };
  const audit = async () => {
    const journal = await page.$$eval('.crisis-journal li', ls =>
      ls.map(l => {
        const b = l.querySelectorAll('b');
        const m = /^(\d+) April: (.+) ₹([\d,.]+) —/.exec(l.textContent);
        return { day: Number(m[1]), amount: Number(m[3].replace(/,/g, '')), dr: b[0].textContent.replace(/ Dr\.$/, ''), cr: b[1].textContent.replace(/ Cr\.$/, '') };
      }),
    );
    const ids = await page.$$eval('[data-open]', bs => bs.map(b => [b.getAttribute('data-open'), b.textContent]));
    const bad = [];
    for (const [id, name] of ids) {
      await page.click(`[data-open="${id}"]`);
      const rows = await page.$$eval('.crisis-ledger tbody tr', trs =>
        trs.map(tr => {
          const td = tr.querySelectorAll('td');
          return `${parseInt(td[0].textContent, 10)}|${td[2].textContent === 'Dr.' ? 'DR' : 'CR'}|${Number(td[3].textContent.replace(/[₹,]/g, ''))}`;
        }),
      );
      const want = journal.filter(j => j.dr === name || j.cr === name).map(j => `${j.day}|${j.dr === name ? 'DR' : 'CR'}|${j.amount}`);
      if (JSON.stringify([...rows].sort()) !== JSON.stringify([...want].sort())) {
        const missing = want.filter(w => !rows.includes(w)),
          extra = rows.filter(r => !want.includes(r));
        const kind = extra.length === 0 ? 'OMITTED' : extra[0].split('|')[2] === missing[0].split('|')[2] ? 'WRONG_SIDE' : 'WRONG_AMOUNT';
        bad.push({ id, name, kind });
      }
    }
    return { bad, ids };
  };

  try {
    // ── a perfect run, played from what is on screen
    await open(7);
    ok(await page.isVisible('h2:has-text("Trial Balance Crisis")'), 'page opens with its title');
    ok((await hud('lives')) === '3' && (await hud('xp')) === '0', 'starts with 3 lives and 0 XP');
    ok((await page.$eval('.crisis-scale-text', e => e.getAttribute('data-balanced'))) === 'false', 'scale text says the totals differ');
    const d = await diagnose();
    ok(d.diff > 0, `the trial balance on screen really does not agree (Dr ${d.dr}, Cr ${d.cr})`);
    await page.fill('#c-diff', String(d.diff));
    await page.selectOption('#c-side', d.side);
    await page.click('.crisis-step button[type=submit]');
    await waitState('LOCATE');
    ok((await hud('xp')) === '10' && (await page.$('.xp-pop[data-pop="10"]')) !== null, 'step 1 right ⇒ +10 XP with a pop-up');
    ok(
      (await page.$('tr[data-account="Suspense"]')) !== null && num(await page.textContent('[data-total="dr"]')) === num(await page.textContent('[data-total="cr"]')),
      'a Suspense row now makes the totals agree for the time being',
    );
    ok((await page.$eval('.crisis-scale-text', e => e.getAttribute('data-balanced'))) === 'false', 'but the scale stays tilted until the error is rectified');
    const a = await audit();
    ok(a.bad.length === 1, `exactly one ledger account disagrees with the journal: ${JSON.stringify(a.bad)}`);
    const bad = a.bad[0];
    await page.click(`[data-open="${bad.id}"]`);
    await page.click(`[data-accuse="${bad.id}"]`);
    await waitState('CLASSIFY');
    ok((await hud('xp')) === '30' && (await hud('streak')) === '2', 'step 2 right ⇒ 30 XP, streak 2');
    await page.click(`[data-kind="${bad.kind}"]`);
    await waitState('RECTIFY');
    ok((await hud('xp')) === '52', 'step 3 on a streak ⇒ 15 × 1.5 = 22 ⇒ 52 XP (was ' + (await hud('xp')) + ')');
    const entry = { dr: d.side === 'DR' ? bad.id : 'Suspense', cr: d.side === 'DR' ? 'Suspense' : bad.id, amount: d.diff };
    await page.selectOption('#c-dr', entry.dr);
    await page.selectOption('#c-cr', entry.cr);
    await page.fill('#c-amt', String(entry.amount));
    await page.click('.crisis-step button[type=submit]');
    await waitState('WHAT_IF');
    ok((await hud('xp')) === '97', 'step 4 on a streak ⇒ 45 ⇒ 97 XP (was ' + (await hud('xp')) + ')');
    ok((await page.$eval('.crisis-scale-text', e => e.getAttribute('data-balanced'))) === 'true', 'the textbook entry levels the scale');
    ok(
      (await page.$('tr[data-account="Suspense"]')) === null && num(await page.textContent('[data-total="dr"]')) === num(await page.textContent('[data-total="cr"]')),
      'Suspense row is gone and the corrected totals agree',
    );
    const opts = await page.$$eval('[data-option]', bs => bs.map(b => b.textContent));
    await page.click(`[data-option="${opts.findIndex(o => /still agree/.test(o))}"]`);
    await waitState('CLEARED');
    const sol = await page.$eval('.solution', e => ({ ...e.dataset }));
    ok(
      sol.solAccount === bad.id &&
        sol.solKind === bad.kind &&
        sol.solDr === entry.dr &&
        sol.solCr === entry.cr &&
        num(sol.solAmount) === entry.amount &&
        sol.solSide === d.side &&
        num(sol.solDifference) === d.diff,
      'the solution panel equals what the test worked out from the screen: ' + JSON.stringify(sol),
    );
    ok(
      (await page.$eval('[data-earned]', e => e.getAttribute('data-earned'))) === '144',
      'perfect run: 10+20+22+45+37 = 134, plus 10 speed bonus = 144 XP (was ' + (await page.$eval('[data-earned]', e => e.getAttribute('data-earned'))) + ')',
    );
    ok((await page.$('[data-badge="suspense-slayer"]')) !== null, 'no life lost ⇒ Suspense Slayer badge');
    ok((await page.$eval('[data-total-xp]', e => e.getAttribute('data-total-xp'))) === '144', 'total XP is saved on the device');
    ok((await page.evaluate(() => window.__AU__.machines().find(m => m.id === 'tb-crisis').state)) === 'CLEARED', 'window.__AU__ reports the machine state');
    await axe('crisis (cleared)');

    // ── wrong answers: no life lost in step 1, lives lost in step 2, three strikes ⇒ FAILED with the solution
    await open(11);
    await page.fill('#c-diff', '1');
    await page.selectOption('#c-side', 'DR');
    await page.click('.crisis-step button[type=submit]');
    ok((await st()) === 'DIAGNOSE' && (await hud('lives')) === '3' && /bigger total/.test(await page.textContent('.note.warn')), 'step 1 wrong ⇒ a hint, no life lost');
    const d2 = await diagnose();
    await page.fill('#c-diff', String(d2.diff));
    await page.selectOption('#c-side', d2.side);
    await page.click('.crisis-step button[type=submit]');
    await waitState('LOCATE');
    ok((await hud('xp')) === '5', 'second try at step 1 ⇒ half XP (5)');
    const a2 = await audit(),
      innocents = a2.ids.map(x => x[0]).filter(id => id !== a2.bad[0].id);
    await page.click(`[data-open="${innocents[0]}"]`);
    await page.click(`[data-accuse="${innocents[0]}"]`);
    ok((await hud('lives')) === '2' && (await st()) === 'LOCATE' && /matches the journal/.test(await page.textContent('.note.bad')), 'wrong accusation ⇒ one life lost, with the reason');
    await page.click(`[data-open="${innocents[1]}"]`);
    await page.click(`[data-accuse="${innocents[1]}"]`);
    await page.click(`[data-open="${innocents[2] ?? innocents[0]}"]`);
    await page.click(`[data-accuse="${innocents[2] ?? innocents[0]}"]`);
    await waitState('FAILED');
    ok(
      (await page.$('[data-end="failed"]')) !== null && (await page.$eval('.solution', e => e.dataset.solAccount)) === a2.bad[0].id,
      'three strikes ⇒ FAILED and the solution names the account the test had found',
    );
    ok((await page.$eval('[data-total-xp]', e => e.getAttribute('data-total-xp'))) === '149', 'XP earned before failing is still kept (144 + 5)');
    await page.click('[data-again="same"]');
    await waitState('DIAGNOSE');
    ok((await hud('lives')) === '3', 'retry starts the same crisis afresh with 3 lives');

    // ── rectify step: each mistake gets its own reason and costs a life
    const d3 = await diagnose();
    await page.fill('#c-diff', String(d3.diff));
    await page.selectOption('#c-side', d3.side);
    await page.click('.crisis-step button[type=submit]');
    await waitState('LOCATE');
    await page.click(`[data-open="${a2.bad[0].id}"]`);
    await page.click(`[data-accuse="${a2.bad[0].id}"]`);
    await waitState('CLASSIFY');
    await page.click(`[data-kind="${a2.bad[0].kind}"]`);
    await waitState('RECTIFY');
    const good = { dr: d3.side === 'DR' ? a2.bad[0].id : 'Suspense', cr: d3.side === 'DR' ? 'Suspense' : a2.bad[0].id };
    await page.selectOption('#c-dr', good.cr);
    await page.selectOption('#c-cr', good.dr);
    await page.fill('#c-amt', String(d3.diff));
    await page.click('.crisis-step button[type=submit]');
    ok((await st()) === 'RECTIFY' && (await hud('lives')) === '2' && /Sides swapped/.test(await page.textContent('.note.bad')), 'swapped entry ⇒ "Sides swapped", one life lost');
    await page.selectOption('#c-dr', a2.bad[0].id);
    await page.selectOption('#c-cr', innocents[0]);
    await page.fill('#c-amt', String(d3.diff));
    await page.click('.crisis-step button[type=submit]');
    ok(/Suspense Account/.test(await page.textContent('.note.bad')) && (await hud('lives')) === '1', 'entry without Suspense ⇒ explained, one life lost');
    await page.selectOption('#c-dr', good.dr);
    await page.selectOption('#c-cr', good.cr);
    await page.fill('#c-amt', String(d3.diff));
    await page.click('.crisis-step button[type=submit]');
    await waitState('WHAT_IF');
    await page.click('[data-option="0"]');
    await waitState('CLEARED');
    ok((await page.$('[data-badge="suspense-slayer"]')) === null, 'lives were lost ⇒ no Suspense Slayer badge');

    // ── Hindi draft + mobile
    await page.click('[data-lang-toggle]');
    await page.waitForSelector('html[data-lang="hi"]');
    await open(7);
    ok(/तलपट संकट/.test(await page.textContent('h2')) && (await page.$('[data-hindi-draft="draft"]')) !== null, 'Hindi: title in Devanagari with the draft badge');
    ok(/[ऀ-ॿ]/.test(await page.textContent('.crisis-journal')) && /[ऀ-ॿ]/.test(await page.textContent('.crisis-tb tbody')), 'Hindi: journal and account names in Devanagari');
    const dh = await diagnose();
    await page.fill('#c-diff', String(dh.diff));
    await page.selectOption('#c-side', dh.side);
    await page.click('.crisis-step button[type=submit]');
    await waitState('LOCATE');
    ok(/उचंत/.test(await page.textContent('.note.good')), 'Hindi: feedback in Hindi');
    await axe('crisis (HI)');
    await page.setViewportSize({ width: 390, height: 844 });
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'mobile 390: no horizontal scroll');
    await page.click('[data-lang-toggle]');
    await page.waitForSelector('html[data-lang="en"]');
    await page.setViewportSize({ width: 1280, height: 900 });

    // ── reachable from the labs index
    await page.goto(BASE + '#/labs');
    await page.waitForSelector('main[data-route="labs"]');
    ok((await page.$('a[href="#/crisis"]')) !== null, 'the challenge is listed on the Visual Labs page');
  } catch (e) {
    fails.push('crash: ' + ((e && e.stack) || e));
  }
  ok(errors.length === 0, 'no console errors: ' + errors.join(' | '));
  await browser.close();
  srv.kill();
  console.log(`web-app-crisis: ${pass} passed, ${fails.length} failed`);
  if (fails.length) {
    for (const f of fails) console.log(' -', f);
    process.exit(1);
  }
})();
