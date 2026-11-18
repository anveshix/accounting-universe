// Notes library: free vs locked, filters, access code unlock. Build apps/web first.
const { chromium } = require('playwright'); const { spawn } = require('child_process');
const srv = spawn('npx', ['vite', 'preview', '--port', '4177', '--strictPort'], { cwd: 'apps/web', stdio: 'ignore' });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  await new Promise(r => setTimeout(r, 2500));
  const b = await chromium.launch(), page = await b.newPage();
  await page.goto('http://localhost:4177/#/notes'); await page.waitForSelector('[data-note]');
  ok(await page.locator('[data-note][data-locked="false"]').count() > 0 && await page.locator('[data-note][data-locked="true"]').count() > 0, 'free and locked both shown');
  await page.click('button:has-text("Teacher resources")');
  ok(await page.locator('[data-note]').count() === 6, 'teacher filter shows 6 resources');
  await page.goto('http://localhost:4177/#/notes/act-xi-depn'); await page.waitForSelector('[data-note-open]');
  ok(await page.getAttribute('[data-note-open]', 'data-note-open') === 'locked' && await page.locator('.paywall').count() === 1, 'pro note is locked with paywall');
  await page.goto('http://localhost:4177/#/notes'); await page.fill('input[aria-label="Access code"]', 'AU-LEAR-N2X4'); await page.click('.unlock button');
  ok((await page.textContent('.unlock + p')).includes('not valid'), 'bad code refused with a reason');
  await page.fill('input[aria-label="Access code"]', 'AU-LEAR-N2XX'); await page.click('.unlock button');
  ok(await page.locator('[data-note][data-locked="true"]').count() === 0, 'valid code unlocks everything');
  await page.goto('http://localhost:4177/#/notes/act-xi-depn'); await page.waitForSelector('[data-note-open="open"]');
  ok(await page.locator('.paywall').count() === 0, 'unlocked note has no paywall');
  await b.close(); srv.kill(); process.exit(fails ? 1 : 0);
})();
