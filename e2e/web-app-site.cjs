/* The published site layout: the new app at /, the old single-file app at /legacy/, and nothing else from the repo root.
   Also proves the new app's service worker (registered on the first visit) does not take over /legacy/. */
const { chromium } = require('playwright');
const { spawn, execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const nodeCrypto = require('node:crypto');
const PORT = 4184,
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
const sha = f => nodeCrypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

(async () => {
  const root = path.join(__dirname, '..'),
    dist = path.join(root, 'apps/web/dist'),
    site = fs.mkdtempSync(path.join(os.tmpdir(), 'au-site-'));
  fs.cpSync(dist, site, { recursive: true }); // assemble a copy so the local dist stays as built
  execSync(`node ${JSON.stringify(path.join(root, 'tools/assemble-site.mjs'))} ${JSON.stringify(site)}`, { stdio: 'pipe' });
  ok(sha(path.join(site, 'legacy/index.html')) === sha(path.join(root, 'index.html')), 'legacy/index.html is the repo-root index.html, byte for byte');
  ok(sha(path.join(site, 'index.html')) === sha(path.join(dist, 'index.html')), 'the root of the site is still the new app');
  ok(
    fs.readdirSync(site).every(f => !/backup|error_state|test|check_syntax/.test(f)),
    'no backup or scratch files are published: ' + fs.readdirSync(site).join(', '),
  );
  let refused = false;
  try {
    execSync(`node ${JSON.stringify(path.join(root, 'tools/assemble-site.mjs'))} ${JSON.stringify(path.join(site, 'nope'))}`, { stdio: 'pipe' });
  } catch {
    refused = true;
  }
  ok(refused, 'assembling without a built app is refused');

  const hs = path.join(execSync('npm root -g').toString().trim(), 'http-server/bin/http-server');
  const srv = spawn('node', [hs, site, '-p', String(PORT), '-a', '127.0.0.1', '-c-1', '--silent'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errors = [];
  try {
    const ctx = await browser.newContext(),
      page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    await page.goto(BASE);
    await page.waitForSelector('html[data-app="ready"]');
    ok(/Accounting Universe/.test(await page.title()), 'the root serves the new app');
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true)); // the new app's worker is now controlling the origin
    await page.reload();
    await page.waitForSelector('html[data-app="ready"]');
    ok(await page.evaluate(() => !!navigator.serviceWorker.controller), 'the service worker controls the root page');
    await page.goto(BASE + 'legacy/');
    await page.waitForLoadState('load');
    ok(/Touch\. Drag\. Learn/.test(await page.title()), '/legacy/ serves the old app even with the new worker installed: ' + (await page.title()));
    ok((await page.$('html[data-app]')) === null, '/legacy/ is not the new app');
    await page.goto(BASE + 'legacy');
    await page.waitForLoadState('load');
    ok(/Touch\. Drag\. Learn/.test(await page.title()), '/legacy (no trailing slash) also reaches the old app');
    await page.goto(BASE);
    await page.waitForSelector('html[data-app="ready"]');
    ok(true, 'and the new app still works afterwards');
  } catch (e) {
    fails.push('crash: ' + ((e && e.stack) || e));
  }
  ok(errors.length === 0, 'no page errors: ' + errors.join(' | '));
  await browser.close();
  srv.kill();
  fs.rmSync(site, { recursive: true, force: true });
  console.log(`web-app-site: ${pass} passed, ${fails.length} failed`);
  if (fails.length) {
    for (const f of fails) console.log(' -', f);
    process.exit(1);
  }
})();
