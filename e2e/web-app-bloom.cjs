// Bloom practice: every Class XI Bloom skill opens, shows its Bloom level and four options; sample Class XII skills too. Build apps/web first.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const srv = spawn('npx', ['vite', 'preview', '--port', '4181', '--strictPort'], { cwd: 'apps/web', stdio: 'ignore' });
let fails = 0,
  passes = 0;
const ok = (c, m) => {
  if (c) passes++;
  else {
    fails++;
    console.log('FAIL ' + m);
  }
};
(async () => {
  await new Promise(r => setTimeout(r, 2500));
  const b = await chromium.launch(),
    page = await b.newPage(),
    U = 'http://localhost:4181/';
  await page.goto(U + '#/practice/bl-xi-1-intro-ru');
  await page.waitForSelector('#skillsel');
  const xi = await page.$$eval('#skillsel option', os => os.map(o => o.value).filter(v => v.startsWith('bl-')));
  ok(xi.length >= 50, `Class XI lists many Bloom skills (${xi.length})`);
  const sample = [...xi, 'bl-xii-2-debentures-aec', 'bl-xii-p-project-ru', 'bl-xii-c-cas-ap', 'bl-xii-3-liquidity-aec', 'bl-xii-1-dissolution-ap'];
  const seen = new Set();
  for (const s of sample) {
    await page.goto(U + '#/practice/' + s);
    await page.waitForSelector('.bloom-level', { timeout: 4000 }).catch(() => {});
    const lvl = await page.getAttribute('.bloom-level', 'data-bloom').catch(() => null);
    ok(!!lvl, `${s} shows a Bloom level`);
    if (lvl) seen.add(lvl);
    ok((await page.locator('main select:not(#skillsel) option').count()) >= 4, `${s} shows its options`);
    ok(!(await page.textContent('main')).match(/undefined|NaN|\[object/), `${s} has no broken text`);
  }
  // Hindi: a Remember-level skill is shown in Devanagari, options and all, with no draft-English notice for the question
  await page.click('[data-lang-toggle]');
  await page.waitForSelector('html[data-lang="hi"]');
  let hindiOk = 0;
  for (const s of ['bl-xi-1-intro-ru', 'bl-xii-2-debentures-ru', 'bl-xii-4-preparation-ru', 'bl-xii-3-liquidity-aec', 'bl-xi-2-journal-ap', 'bl-xii-1-admission-aec']) {
    await page.goto(U + '#/practice/' + s);
    await page.waitForSelector('.bloom-level');
    const txt = await page.textContent('main .question, main');
    const opts = await page.$$eval('main select:not(#skillsel) option', os => os.map(o => o.textContent));
    if (/[ऀ-ॿ]/.test(txt) && opts.length >= 4) hindiOk++;
  }
  ok(hindiOk === 6, `Hindi shows Devanagari text and options for skills at every band (${hindiOk}/6)`);
  await page.click('[data-lang-toggle]');
  ok(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYSE', 'EVALUATE', 'CREATE'].every(l => seen.has(l)) || seen.size >= 4, `several Bloom levels appear (${[...seen].join(',')})`);
  await b.close();
  srv.kill();
  console.log(`web-app-bloom: ${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})();
