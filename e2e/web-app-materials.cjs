/* Chapter materials: the page lists published material by chapter, files open, a teacher can add a file on this device (checked first, kept in this
   browser only, survives a reload, can be removed), and the study page shows the chapter's material. Build apps/web first.
   The published items are fixtures written into dist/materials with the same pipeline code the command-line tool uses. */
const { chromium } = require('playwright');
const { spawn, execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { deflateRawSync, crc32 } = require('node:zlib');
const PORT = 4212,
  BASE = `http://127.0.0.1:${PORT}/`;
const DIST = path.join(__dirname, '../apps/web/dist');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js', { paths: [path.join(__dirname, '../apps/web'), path.join(__dirname, '..')] }), 'utf8');
let pass = 0;
const fails = [];
const ok = (c, m) => {
  if (c) pass++;
  else {
    fails.push(m);
    console.log('  ✗', m);
  }
};

function zip(entries) {
  const locals = [],
    centrals = [];
  let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const raw = Buffer.from(text),
      comp = deflateRawSync(raw),
      nm = Buffer.from(name),
      crc = crc32(raw);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(nm.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nm.length, 28);
    ch.writeUInt32LE(offset, 42);
    locals.push(lh, nm, comp);
    centrals.push(ch, nm);
    offset += 30 + nm.length + comp.length;
  }
  const cd = Buffer.concat(centrals),
    end = Buffer.alloc(22),
    n = Object.keys(entries).length;
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(n, 8);
  end.writeUInt16LE(n, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
const deck = n =>
  zip({ 'ppt/presentation.xml': '<p/>', ...Object.fromEntries(Array.from({ length: n }, (_, i) => [`ppt/slides/slide${i + 1}.xml`, `<a:t>Slide ${i + 1} on depreciation methods</a:t>`])) });
const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Page >> endobj\n2 0 obj << /Type /Page >> endobj\n');

(async () => {
  const lib = await import(path.join(__dirname, '../tools/materials/lib.mjs'));
  const root = path.join(DIST, 'materials');
  fs.rmSync(root, { recursive: true, force: true });
  const now = new Date('2026-11-24T00:00:00Z');
  lib.addMaterial({ root, topic: 'XI.2.depreciation', name: 'SLM and WDV.pptx', bytes: deck(3), now });
  lib.addMaterial({ root, topic: 'XI.2.depreciation', name: 'Depreciation notes.pdf', bytes: pdf, title: 'Depreciation notes', lang: 'en-hi', now });
  lib.addMaterial({ root, topic: 'XII.1.goodwill', name: 'goodwill worksheet.pdf', bytes: pdf, now });
  lib.writeCatalogue(root);
  ok(lib.validateAll(root).length === 0, 'fixtures pass the pipeline validation');

  const hs = path.join(execSync('npm root -g').toString().trim(), 'http-server/bin/http-server');
  const srv = spawn('node', [hs, DIST, '-p', String(PORT), '-a', '127.0.0.1', '-c-1', '--silent'], { stdio: 'ignore' });
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
    await page.waitForSelector('main[data-route]');
    await page.waitForSelector('[data-materials], [data-study-materials], .panel');
    await page.waitForTimeout(250);
  };
  const axe = async label => {
    await page.evaluate(AXE);
    const r = await page.evaluate(async () =>
      (await window.axe.run(document, { resultTypes: ['violations'] })).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => `${v.id}: ${v.nodes[0].target.join(' ')}`),
    );
    ok(r.length === 0, `axe ${label}: no serious/critical violations — ${r.join('; ')}`);
  };
  const addFile = async (topic, name, buffer, mimeType = 'application/octet-stream', kind) => {
    await page.selectOption('#mat-topic', topic);
    await page.setInputFiles('#mat-file', { name, mimeType, buffer });
    if (kind) await page.selectOption('#mat-kind', kind);
    await page.click('.material-form button[type=submit]');
    await page.waitForFunction(() => document.querySelector('#mat-result')?.textContent?.trim());
    return page.$eval('#mat-result', e => e.innerText);
  };

  try {
    // ── published material, by chapter ──
    await page.goto(BASE + '#/');
    await page.waitForSelector('html[data-app="ready"]');
    await go('#/materials');
    ok((await page.$eval('main', e => e.getAttribute('data-route'))) === 'materials', 'route #/materials renders');
    ok((await page.locator('details.material-topic').count()) >= 20, 'Class XI chapters are listed (a row per syllabus chapter)');
    ok(/3 published items across 2 of 54 chapters/.test(await page.$eval('.labhead [role=status]', e => e.innerText)), 'status line counts published items and chapters');
    ok((await page.locator('details[data-topic="XI.2.depreciation"] li.material').count()) === 2, 'Depreciation shows its two items');
    ok((await page.locator('details[data-topic="XI.2.depreciation"]').getAttribute('open')) !== null, 'a chapter with material is open');
    ok((await page.locator('details[data-topic="XI.2.tb"]').getAttribute('open')) === null, 'a chapter without material is collapsed');
    ok(/no material yet/.test(await page.locator('details[data-topic="XI.2.tb"] summary').innerText()), 'and says so');
    const deckCard = page.locator('li.material[data-kind="PPT"]');
    ok(/3 slides/.test(await deckCard.innerText()) && /Slide 1 on depreciation methods/.test(await deckCard.innerText()), 'the deck card shows its slide count and a summary taken from slide 1');
    ok(/English \+ हिंदी/.test(await page.locator('li.material[data-kind="NOTES"]').innerText()), 'language is shown');
    // the file itself opens
    const href = await deckCard.locator('a[data-open]').getAttribute('href');
    const res = await page.request.get(new URL(href, BASE + 'x/').toString().replace('/x/', '/'));
    ok(res.status() === 200 && (await res.body()).equals(deck(3)), 'the published file downloads byte for byte');
    const pdfHref = await page.locator('li.material[data-kind="NOTES"] a[data-open]').getAttribute('href');
    ok((await page.locator('li.material[data-kind="NOTES"] a[data-open]').getAttribute('target')) === '_blank' && /\.pdf$/.test(pdfHref), 'a PDF opens in a new tab');
    await page.click('button[data-class="XII"]');
    ok((await page.locator('details[data-topic="XII.1.goodwill"] li.material').count()) === 1, 'Class XII tab shows its chapter');
    await page.click('button[data-class="XI"]');
    await page.click('.notes-filters button:has-text("Slides (PPT)")');
    ok((await page.locator('li.material').count()) === 1, 'the kind filter narrows to slides');
    await page.click('.notes-filters button:has-text("All kinds")');
    await page.fill('input[type=search]', 'zzzz');
    ok((await page.locator('li.material').count()) === 0, 'search with no match shows nothing');
    await page.fill('input[type=search]', '');
    await axe('materials page');

    // ── the chapter's study page ──
    await go('#/study/XI.2.depreciation');
    ok((await page.locator('[data-study-materials]:not([hidden]) li.material').count()) === 2, 'the study page shows the chapter’s material');
    await go('#/study/XI.2.tb');
    ok((await page.locator('[data-study-materials]').getAttribute('hidden')) !== null, 'a chapter without material shows no empty section');
    await go('#/materials/XII.1.goodwill');
    ok((await page.locator('details[data-topic="XII.1.goodwill"]').getAttribute('open')) !== null, '#/materials/<chapter> opens that chapter');
    await go('#/materials/XI.9.nothing');
    ok(/Chapter not found/.test(await page.innerText('main')), 'an unknown chapter id is a not-found page');

    // ── adding on this device ──
    await go('#/materials/XI.2.tb');
    const refusals = [
      ['macro.pptx', deck(1).toString('latin1') + 'ppt/vbaProject.bin', /macros/],
      ['script.exe', 'MZ', /programs/],
      ['fake.pdf', '<html><body>Sign in</body></html>', /Anyone with the link|web page/],
      ['old.ppt', Buffer.from([0xd0, 0xcf, 0x11, 0xe0]), /Save As/],
    ];
    for (const [name, content, re] of refusals) {
      const out = await addFile('XI.2.tb', name, Buffer.from(content, 'latin1'));
      ok(re.test(out), `refused ${name}: ${out.slice(0, 80)}`);
    }
    ok((await page.locator('li.material[data-device="true"]').count()) === 0, 'nothing was kept after the refusals');
    const mismatch = await addFile('XI.2.tb', 'deck.pptx', deck(2), 'application/octet-stream', 'WORKSHEET');
    ok(/cannot be filed as that kind/.test(mismatch), 'a deck cannot be filed as a worksheet');
    const good = await addFile('XI.2.tb', 'Trial balance revision.pdf', pdf, 'application/pdf', 'NOTES');
    ok(/Added “Trial balance revision”/.test(good) && /not shared with anyone/.test(good), 'a good file is added and the message says it stays private');
    ok((await page.locator('details[data-topic="XI.2.tb"] li.material[data-device="true"]').count()) === 1, 'it appears under its chapter');
    ok(/On this device only/.test(await page.locator('li.material[data-device="true"]').innerText()), 'and is marked “On this device only”');
    ok(/2 pages/.test(await page.locator('li.material[data-device="true"]').innerText()), 'with its page count');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('li.material[data-device="true"] button[data-open]')]);
    ok(/trial-balance-revision\.pdf$/.test(dl.suggestedFilename()), 'the device file can be opened/downloaded');
    await page.reload();
    await page.waitForSelector('li.material[data-device="true"]');
    ok(true, 'it survives a reload');
    await axe('materials page with a device file');
    const other = await ctx.newPage();
    await other.goto(BASE + '#/');
    await other.waitForSelector('html[data-app="ready"]');
    const dbs = await other.evaluate(async () => (await indexedDB.databases()).map(d => d.name));
    ok(dbs.includes('au-materials'), 'device files live in their own database, apart from progress');
    await other.goto(BASE + '#/progress');
    await other.waitForSelector('text=Export my progress');
    const [exportDl] = await Promise.all([other.waitForEvent('download'), other.click('text=Export my progress')]);
    const exportText = fs.readFileSync(await exportDl.path(), 'utf8');
    ok(JSON.parse(exportText).app === 'accounting-universe' && !/Trial balance revision|trial-balance-revision/.test(exportText), 'and are not in the progress backup file');
    await other.close();
    await go('#/study/XI.2.tb');
    ok((await page.locator('[data-study-materials]:not([hidden]) li.material[data-device="true"]').count()) === 1, 'the study page shows device files too');
    await go('#/materials/XI.2.tb');
    await page.click('button[data-remove]');
    await page.waitForFunction(() => !document.querySelector('li.material[data-device="true"]'));
    ok(true, 'Remove deletes it');
    await page.reload();
    await page.waitForSelector('details.material-topic');
    ok((await page.locator('li.material[data-device="true"]').count()) === 0, 'and it stays deleted after a reload');
    ok(
      /How to publish for everyone/.test(await page.locator('#publish h3').innerText()) && /incoming\//.test(await page.locator('#publish').innerText()),
      'the page explains how to publish for everyone',
    );
    ok(
      /Chapter materials/.test(
        await (async () => {
          await go('#/notes');
          return page.innerText('main');
        })(),
      ),
      'the Notes page links to chapter materials',
    );
    ok(errors.length === 0, 'no console or page errors: ' + errors.join(' | '));
  } catch (e) {
    ok(false, 'unexpected error: ' + e.stack);
  }
  await browser.close();
  srv.kill();
  // put the real (committed) materials folder back so later suites see the site as built
  fs.rmSync(root, { recursive: true, force: true });
  fs.cpSync(path.join(__dirname, '../apps/web/public/materials'), root, { recursive: true });
  console.log(`web-app-materials: ${pass} passed, ${fails.length} failed`);
  process.exit(fails.length ? 1 : 0);
})();
