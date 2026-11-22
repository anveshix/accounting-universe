/* Study guide: a chapter index per class and a full page for every one of the 54 syllabus topics. */
const { chromium } = require('playwright');
const { spawn, execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const PORT = 4187,
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
    await page.waitForTimeout(120);
  };
  // reward toasts fade in and out: axe must measure the page, not a half-faded toast
  const axe = async label => {
    await page.waitForFunction(() => !document.querySelector('.toast') && document.getAnimations().every(a => a.playState !== 'running'), null, { timeout: 12000 }).catch(() => {});
    await page.evaluate(AXE);
    const r = await page.evaluate(async () =>
      (await window.axe.run(document, { resultTypes: ['violations'] })).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => `${v.id}: ${v.nodes[0].target.join(' ')}`),
    );
    ok(r.length === 0, `axe ${label}: no serious/critical violations — ${r.join('; ')}`);
  };
  try {
    // ── the two chapter indexes
    const ids = { XI: [], XII: [] };
    for (const cls of ['XI', 'XII']) {
      await go(`#/study/${cls}`);
      ids[cls] = await page.$$eval('[data-topic]', as => as.map(a => a.getAttribute('data-topic')));
      ok(ids[cls].length === (cls === 'XI' ? 24 : 30), `Class ${cls} index lists every topic (${ids[cls].length})`);
      ok((await page.$$eval('.unit', u => u.length)) === (cls === 'XI' ? 4 : 6), `Class ${cls} index has its units`);
      ok(
        /Chapter-wise study guide/i.test(await page.textContent('.eyebrow')) && /not yet reviewed/i.test(await page.textContent('.study-status')),
        `Class ${cls} index: title and the honest review status`,
      );
      ok((await page.$eval('nav a[aria-current="page"]', a => a.textContent)) === `Class ${cls}`, `Class ${cls} index highlights its own navigation item`);
    }
    await go('#/study');
    ok(/Class XI/.test(await page.textContent('main h2')), '#/study opens the learner’s own class');
    await axe('study index');

    // ── every topic page opens with real content
    for (const id of [...ids.XI, ...ids.XII]) {
      await go(`#/study/${id}`);
      const info = await page.evaluate(() => ({
        h2: document.querySelector('main h2')?.textContent ?? '',
        must: document.querySelectorAll('.study-list li').length,
        mis: document.querySelectorAll('.study-mistakes li').length,
        status: !!document.querySelector('.study-status'),
        lead: document.querySelector('.lead')?.textContent.length ?? 0,
        clause: document.querySelector('article.study')?.getAttribute('data-clause'),
      }));
      ok(info.clause === id && info.h2.length > 8 && info.must >= 3 && info.mis >= 2 && info.status && info.lead > 60, `${id}: topic page complete — ${JSON.stringify(info)}`);
    }
    // limits and examples
    await go('#/study/XII.1.goodwill');
    ok(/Only these three methods/.test(await page.textContent('.study-limit')), 'goodwill page shows the official limit');
    await go('#/study/XI.2.brs');
    ok((await page.isVisible('.example')) && /18,200/.test(await page.textContent('.ex-a')), 'BRS page has its worked example with the verified answer');
    await go('#/study/XI.1.intro');
    ok(
      (await page.isVisible('.example')) && /comparability/.test(await page.textContent('.ex-a')) && (await page.$('.study-limit')) === null,
      'a conceptual topic has a worked example and no limit banner',
    );
    await go('#/study/XII.4.preparation');
    ok(/2,00,000/.test(await page.textContent('.ex-a')), 'cash flow page shows its worked example with the verified answer');
    // every one of the 54 topic pages carries a worked example
    for (const id of [...ids.XI, ...ids.XII]) {
      await go('#/study/' + id);
      if (!(await page.$('.example .ex-a'))) ok(false, id + ': no worked example on the page');
    }
    ok(true, 'all topic pages were checked for a worked example');

    // ── tools: practice launch, labs, learning outcomes, pager
    await go('#/study/XI.2.ledger');
    ok(/#\/practice\/[\w-]+/.test(await page.getAttribute('a.button.primary', 'href')), 'topic page: “Practise this topic” points at a practice skill');
    ok(
      (await page.$$eval('.tool-links a', a => a.length)) >= 3 && (await page.$$eval('.outcomes [data-outcome]', a => a.length)) >= 1,
      'topic page lists labs/practice and the official learning outcomes',
    );
    await page.click('a.button.primary');
    await page.waitForSelector('main[data-route="practice"] .question');
    ok(true, 'the practice link opens a question');
    await go('#/study/XI.1.intro');
    ok((await page.$('a[rel="next"]')) !== null && (await page.$('a[rel="prev"]')) === null, 'first topic: next but no previous');
    await page.click('a[rel="next"]');
    await page.waitForFunction(() => document.querySelector('article.study')?.getAttribute('data-clause') === 'XI.1.terms').catch(() => {});
    ok((await page.getAttribute('article.study', 'data-clause')) === 'XI.1.terms', 'next goes to the next topic in syllabus order');
    await go(`#/study/${ids.XI.at(-1)}`);
    ok((await page.$('a[rel="next"]')) === null, 'last topic of the class has no next link');
    await go('#/study/XII.1.admission');
    ok((await page.$eval('nav a[aria-current="page"]', a => a.textContent)) === 'Class XII', 'a Class XII topic highlights Class XII');
    await go('#/study/XI.9.nothing');
    ok(/Topic not found/.test(await page.textContent('main')), 'an unknown topic says so');
    await go('#/study/foo');
    ok(/Page not found/.test(await page.textContent('main')), 'a malformed address is "page not found"');

    // ── from the class map, and progress
    await go('#/class/XI');
    await page.click('.clauselist a.study-link >> nth=0');
    await page.waitForSelector('article.study');
    ok((await page.getAttribute('article.study', 'data-clause')) === 'XI.1.intro', 'class map: a topic title opens its study page');
    await go('#/practice/ledger-balance/7/board');
    await page.waitForSelector('.question');
    await page.click('.question button[type=submit]');
    await page.waitForSelector('.question[data-state="SUBMITTED"]');
    await page.waitForSelector('html[data-saving="0"]'); // the attempt is on disk
    await go('#/study/XI.2.ledger');
    await page.waitForSelector('[data-study-progress]:not([hidden])');
    ok(/1 question/.test(await page.textContent('[data-study-progress]')), 'after practising, the topic page shows the learner’s own progress: ' + (await page.textContent('[data-study-progress]')));
    await go('#/study/XI');
    await page.waitForSelector('[data-progress="XI.2.ledger"]:not([hidden])');
    ok(true, 'and the chapter index shows it too');

    // ── print view hides the app chrome and keeps the notes
    await go('#/study/XII.1.admission');
    await page.emulateMedia({ media: 'print' });
    ok(
      !(await page.isVisible('header.top')) &&
        !(await page.isVisible('nav#nav')) &&
        !(await page.isVisible('[data-print]')) &&
        (await page.isVisible('main h2')) &&
        (await page.isVisible('.study-list')),
      'print: app chrome and buttons are hidden, the notes stay',
    );
    await page.emulateMedia({ media: 'screen' });

    // ── Hindi mode: titles for all topics; full Hindi notes where they exist; English notes marked lang="en" with a notice where they do not
    await page.click('[data-lang-toggle]');
    await page.waitForSelector('html[data-lang="hi"]');
    ok((await page.$('[data-english-only]')) === null, 'Hindi mode: study pages are no longer English-only');
    ok((await page.$$eval('[data-hindi-draft]', e => e.filter(x => !x.hidden).length)) === 1, 'Hindi mode: exactly one draft notice');
    ok((await page.$eval('html', e => e.getAttribute('lang'))) === 'hi', 'Hindi mode: page language is hi');
    await go('#/study/XI');
    const hiTitles = await page.$$eval('.topic-title', e => e.map(x => x.textContent));
    ok(hiTitles.length === 24 && hiTitles.every(t => /[\u0900-\u097F]/.test(t)), 'Hindi index: all 24 Class XI topic titles are in Hindi');
    ok(/अध्यायवार/.test(await page.textContent('.eyebrow')) && /कक्षा XI/.test(await page.textContent('h2')), 'Hindi index: heading is Hindi');
    await go('#/study/XII.1.admission');
    const adm = await page.textContent('article.study');
    ok(/त्याग अनुपात/.test(adm) && /12 : 8 : 5/.test(adm) && /3 : 2/.test(adm), 'Hindi topic with notes: Hindi text and the same figures (12 : 8 : 5)');
    ok((await page.$('.study-english')) === null, 'Hindi topic with notes: no "English notes" notice');
    ok(/हल किया हुआ उदाहरण/.test(await page.textContent('.example h3')) && /उत्तर/.test(await page.textContent('.ex-a summary')), 'Hindi topic: example headings are Hindi');
    // every one of the 54 topics now has full Hindi notes: no English-notes notice, and every point is Devanagari
    for (const id of [...ids.XI, ...ids.XII]) {
      await go('#/study/' + id);
      const bad = await page.evaluate(() => {
        const dev = /[\u0900-\u097F]/;
        const lis = [...document.querySelectorAll('.study-list li, .study-mistakes li, .study-steps li')];
        return {
          notice: !!document.querySelector('.study-english'),
          english: lis.filter(li => !dev.test(li.textContent)).length,
          n: lis.length,
          lead: dev.test(document.querySelector('.lead')?.textContent || ''),
          ex: dev.test(document.querySelector('.ex-a p')?.textContent || ''),
        };
      });
      if (bad.notice || bad.english || bad.n < 4 || !bad.lead || !bad.ex) ok(false, id + ': Hindi notes incomplete ' + JSON.stringify(bad));
    }
    ok(true, 'all 54 Hindi topic pages checked: full Hindi notes, no English-notes notice');
    await go('#/class/XI');
    ok(await page.$$eval('a.study-link', e => e.length > 20 && e.every(a => /[\u0900-\u097F]/.test(a.textContent))), 'Hindi class map: all topic titles are in Hindi');
    await go('#/study/XII.4.preparation');
    ok(/2,00,000/.test(await page.textContent('.ex-a')) && /रोकड़/.test(await page.textContent('.ex-a')), 'Hindi cash-flow example keeps ₹2,00,000');
    await axe('study topic (HI)');
    await go('#/study/XI.1.intro');
    await axe('study topic, XI.1.intro (HI)');
    await go('#/study/XI');
    await axe('study index (HI)');
    await page.click('[data-lang-toggle]');
    await page.waitForSelector('html[data-lang="en"]');
    await go('#/study/XII.1.admission');
    ok(/sacrificing ratio/i.test(await page.textContent('article.study')) && (await page.$('.study-english')) === null, 'back in English: the original notes are shown');

    // ── accessibility and phones
    await go('#/study/XII.1.admission');
    await axe('topic page');
    for (const w of [390, 360, 320])
      for (const h of ['#/study/XI', '#/study/XII.2.forfeiture']) {
        await page.setViewportSize({ width: w, height: 800 });
        await go(h);
        ok((await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1, `phone ${w}px: no sideways scroll on ${h}`);
      }
  } catch (e) {
    fails.push('crash: ' + ((e && e.stack) || e));
  }
  ok(errors.length === 0, 'no console errors: ' + errors.join(' | '));
  await browser.close();
  srv.kill();
  console.log(`web-app-study: ${pass} passed, ${fails.length} failed`);
  if (fails.length) {
    for (const f of fails) console.log(' -', f);
    process.exit(1);
  }
})();
