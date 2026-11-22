/* Practice paper: set-up, the board-pattern sheet, marking scheme, print view, share links. */
const { chromium } = require('playwright');
const { spawn, execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
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
    // ── set-up page
    await go('#/paper');
    ok(/board pattern/i.test(await page.textContent('h2')) && (await page.$$('input[name="paper-cls"]')).length === 2, 'set-up: heading and class choice');
    ok(
      /not reviewed|No subject teacher has reviewed/i.test(await page.textContent('main')) && /not an official blueprint/i.test(await page.textContent('main')),
      'set-up: says honestly what is and is not official',
    );
    await axe('paper set-up');
    await page.check('input[name="paper-cls"][value="XII"]');
    await page.fill('#paper-seed', '77');
    await page.click('button[type=submit]');
    await page.waitForSelector('[data-paper]');
    ok(page.url().endsWith('#/paper/XII/I/77'), 'set-up: the link carries class, option and number: ' + page.url());

    // ── Class XII Option I sheet
    ok((await page.$$('.pq')).length === 34, 'XII: 34 questions on the sheet');
    const marks = await page.$$eval('.pq', qs => qs.map(q => Number(q.getAttribute('data-marks'))));
    ok(marks.reduce((a, b) => a + b, 0) === 80, 'XII: the marks of the questions add up to 80');
    const count = m => marks.filter(x => x === m).length;
    ok(count(1) === 20 && count(3) === 6 && count(4) === 3 && count(6) === 5, `XII: 20×1, 6×3, 3×4, 5×6 (${[1, 3, 4, 6].map(count)})`);
    ok((await page.$$('.ppart[data-part="A"] .pq')).length === 26 && (await page.$$('.ppart[data-part="B"] .pq')).length === 8, 'XII: Part A has 26 questions and Part B has 8');
    ok((await page.$$('.por')).length === 6, 'XII: six questions have internal choice (OR)');
    ok(/3 hours/.test(await page.textContent('.paper-title')) && /Maximum marks: 80/.test(await page.textContent('.paper-title')), 'XII: time and maximum marks are printed');
    ok(/Not reviewed by a subject teacher/i.test(await page.textContent('.paper-status')), 'XII: the review status is stated');
    await axe('paper sheet');

    // ── marking scheme is hidden until asked for, and its marks add up
    ok(!(await page.isVisible('[data-scheme]')), 'scheme: hidden at first');
    await page.click('[data-scheme-toggle] > summary');
    await page.waitForSelector('[data-scheme]', { state: 'visible' });
    const lines = await page.$$eval('.ps-q', qs =>
      qs.map(q => ({ no: q.getAttribute('data-q'), sum: [...q.querySelectorAll(':scope > table tbody tr')].reduce((s, tr) => s + Number(tr.lastElementChild.textContent), 0) })),
    );
    ok(lines.length === 34 && lines.every((l, i) => l.sum === marks[i]), 'scheme: the marks of the answer lines equal the marks of each question');
    await axe('paper with scheme');

    // ── same number, same paper; another number, another paper
    const sig = async () => (await page.$$eval('.pq', qs => qs.map(q => q.textContent))).join('|');
    const first = await sig();
    await go('#/paper/XII/I/77');
    ok((await sig()) === first, 'share link: the same number gives the same paper');
    await page.click('text=Another paper');
    await page.waitForSelector('[data-paper="XII-I-78"]');
    ok((await sig()) !== first, 'another paper: a different number gives a different paper');

    // ── Option II and Class XI
    await go('#/paper/XII/II/5');
    ok((await page.$$('.pq')).length === 34 && /Computerised Accounting/.test(await page.textContent('.ppart[data-part="B"]')), 'XII Option II: 34 questions, Part B says Computerised Accounting');
    await go('#/paper/XI/5');
    ok((await page.$$('.pq')).length === 34 && /not an official blueprint/i.test(await page.textContent('.paper-title')), 'XI: 34 questions and labelled as not an official blueprint');
    await axe('paper XI');

    // ── print view: chrome is hidden, the sheet stays
    await page.emulateMedia({ media: 'print' });
    ok(!(await page.isVisible('header.top')) && !(await page.isVisible('.actions')) && (await page.isVisible('.paper-sheet')), 'print: navigation and buttons are hidden, the sheet is shown');
    await page.emulateMedia({ media: 'screen' });

    // ── Hindi mode (draft): the page chrome, headings, marks and scheme are Hindi; question text without Hindi stays English, marked, with a notice
    await go('#/paper');
    await page.click('[data-lang-toggle]');
    await page.waitForSelector('html[data-lang="hi"]');
    ok((await page.$('[data-english-only]')) === null, 'Hindi paper set-up: not English-only any more');
    ok(/बोर्ड के प्रारूप/.test(await page.textContent('h2')) && /प्रामाणिक/.test(await page.textContent('main')), 'Hindi paper set-up: heading and honesty section are Hindi');
    await axe('paper set-up (HI)');
    await go('#/paper/XII/I/77');
    ok((await page.$$('.pq')).length === 34, 'Hindi paper: still 34 questions');
    const hiSheet = await page.textContent('.paper-sheet');
    ok(/भाग अ/.test(hiSheet) && /भाग ब/.test(hiSheet) && /\[6 अंक\]/.test(hiSheet) && /अथवा/.test(hiSheet) && /पूर्णांक: 80/.test(hiSheet), 'Hindi paper: parts, marks, OR and maximum marks are Hindi');
    ok(
      (await page.isVisible('.paper-english')) && (await page.$$eval('.pstem [lang="en"], .pstem[lang="en"]', e => e.length)) > 0,
      'Hindi paper: a notice says some questions are English, and they are marked lang="en"',
    );
    await page.click('[data-scheme-toggle] > summary');
    await page.waitForSelector('[data-scheme]', { state: 'visible' });
    ok(/अंकन योजना/.test(await page.textContent('[data-scheme] h3')) && (await page.$$('.ps-q')).length === 34, 'Hindi paper: marking scheme heading is Hindi and all 34 answers are there');
    const answers = await page.$$eval('.ps-q', qs => qs.map(q => [...q.querySelectorAll(':scope > table tbody tr')].reduce((t, tr) => t + Number(tr.lastElementChild.textContent), 0)));
    ok(
      answers.every((a, i) => a === marks[i]),
      'Hindi paper: scheme marks still equal the question marks',
    );
    ok(/प्रश्न-पत्र रिपोर्ट/.test(await page.textContent('.prep')), 'Hindi paper: report heading is Hindi');
    await axe('paper sheet (HI)');
    await go('#/paper/XI/5');
    ok(/आधिकारिक ब्लूप्रिंट नहीं/.test(await page.textContent('.paper-title')), 'Hindi Class XI paper: says it is not an official blueprint');
    await page.click('[data-lang-toggle]');
    await page.waitForSelector('html[data-lang="en"]');
    await go('#/paper/XII/I/77');
    ok(/Maximum marks: 80/.test(await page.textContent('.paper-title')) && (await sig()) === first, 'back in English: same paper, English wording');

    // ── bad addresses are not found
    for (const bad of ['#/paper/XIII/1', '#/paper/XII/III/1', '#/paper/XII/I/abc', '#/paper/XI']) {
      await go(bad);
      ok((await page.getAttribute('main', 'data-route')) === 'notfound', 'bad address is not found: ' + bad);
    }
    // ── About and trust page
    await go('#/paper');
    await page.click('a[href="#/about"]');
    await page.waitForSelector('.aboutpage');
    const about = await page.textContent('.aboutpage');
    ok(
      /54 syllabus topics/.test(about) && /saved on this device only/i.test(about) && /not been reviewed/i.test(about) && /Class XI practice paper is labelled as not official/i.test(about),
      'about: counts, data handling and review status are stated',
    );
    await axe('about');
    // ── Practice page links to it
    await go('#/practice');
    ok(await page.isVisible('.paper-link a[href="#/paper"]'), 'practice page links to the paper builder');
  } catch (e) {
    fails.push('crash: ' + ((e && e.stack) || e));
  }
  ok(errors.length === 0, 'no console errors: ' + errors.join(' | '));
  await browser.close();
  srv.kill();
  console.log(`web-app-paper: ${pass} passed, ${fails.length} failed`);
  if (fails.length) {
    for (const f of fails) console.log(' -', f);
    process.exit(1);
  }
})();
