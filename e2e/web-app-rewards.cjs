// Rewards: HUD, XP toast after a correct answer, quest board. Build apps/web first.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const srv = spawn('npx', ['vite', 'preview', '--port', '4178', '--strictPort'], { cwd: 'apps/web', stdio: 'ignore' });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  await new Promise(r => setTimeout(r, 2500));
  const b = await chromium.launch(), page = await b.newPage(), U = 'http://localhost:4178/';
  await page.goto(U + '#/progress');
  await page.waitForSelector('[data-quest]');
  ok((await page.getAttribute('.hud', 'data-xp')) === '0', 'new learner starts at 0 XP');
  ok((await page.locator('[data-badge]').count()) === 8 && (await page.locator('[data-badge][data-earned="true"]').count()) === 0, '8 badges, all locked at start');
  ok((await page.locator('.mcell').count()) > 20 && (await page.locator('.heat-c').count()) === 14, 'mastery map and 14-day strip drawn');
  await page.goto(U + '#/cards');
  await page.waitForSelector('a.card');
  const hrefs = await page.$$eval('a.card', as => as.map(a => a.getAttribute('href')));
  let got = false;
  for (const href of hrefs) {
    await page.goto(U + href);
    await page.waitForSelector('form.check');
    for (const f of await page.$$('form.check')) {
      await (await f.$('input[type=radio]')).check();
      await (await f.$('button[type=submit]')).click();
      await page.waitForTimeout(150);
      if (await page.locator('.toast.xp').count()) { got = true; break; }
    }
    if (got) break;
  }
  ok(got, 'a correct answer shows a +XP toast');
  ok(Number(await page.getAttribute('.hud', 'data-xp')) > 0, 'HUD XP went up');
  await page.goto(U + '#/progress');
  await page.waitForSelector('[data-quest]');
  ok((await page.locator('[data-badge="first-entry"][data-earned="true"]').count()) === 1, 'First Entry badge earned');
  ok((await page.getAttribute('.hud', 'data-streak')) === '1', 'streak is 1 day');
  await b.close();
  srv.kill();
  process.exit(fails ? 1 : 0);
})();
