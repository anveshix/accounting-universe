// Ledger: 1,000+ accounts searchable, own accounts can be added and are remembered. Build apps/web first.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const srv = spawn('npx', ['vite', 'preview', '--port', '4179', '--strictPort'], { cwd: 'apps/web', stdio: 'ignore' });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  await new Promise(r => setTimeout(r, 2500));
  const b = await chromium.launch(), page = await b.newPage(), U = 'http://localhost:4179/';
  await page.goto(U + '#/ledger');
  await page.waitForSelector('.ledger-lab');
  ok((await page.locator('#acct-list option').count()) >= 1100, 'datalist offers 1,100+ accounts');
  const fill = async (narr, dr, cr, amt) => {
    await page.fill('#je-narr', narr);
    await page.fill('.linerow:nth-child(1) input[data-acct]', dr);
    await page.fill('.linerow:nth-child(2) input[data-acct]', cr);
    await page.fill('.linerow:nth-child(1) input[aria-label="Amount"]', amt);
    await page.fill('.linerow:nth-child(2) input[aria-label="Amount"]', amt);
  };
  await fill('Sold to a debtor', 'Ramesh Agarwal (Debtor)', 'Sales', '5000');
  await page.click('text=Post entry');
  ok((await page.locator('.journal-list tbody tr').count()) >= 1, 'entry with a named debtor account posts');
  await fill('Own account', 'Tuition Fees Receivable', 'Capital', '700');
  await page.click('text=Post entry');
  ok((await page.textContent('.formerr')).includes('new account'), 'unknown name asks for a type');
  await page.selectOption('.linerow:nth-child(1) select[data-newtype]', 'ASSET');
  await page.click('text=Post entry');
  ok((await page.textContent('main')).includes('Tuition Fees Receivable'), 'own account created and used in the books');
  await page.reload();
  await page.waitForSelector('.ledger-lab');
  ok((await page.locator('#acct-list option[value="Tuition Fees Receivable"]').count()) === 1, 'own account is remembered after reload');
  await b.close();
  srv.kill();
  process.exit(fails ? 1 : 0);
})();
