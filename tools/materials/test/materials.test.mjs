import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { crc32, deflateRawSync } from 'node:zlib';
import { addMaterial, buildCatalogue, coverage, processIncoming, removeMaterial, reportOf, validateAll, writeCatalogue } from '../lib.mjs';
import { fetchDrive } from '../drive.mjs';
import { listZip, readZipText } from '../zip.mjs';

/** A real zip (deflated entries, CRCs, central directory), written here so the tests need no tools. */
function makeZip(entries) {
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
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, cd, end]));
}
const deck = (titles, extra = {}) =>
  makeZip({ 'ppt/presentation.xml': '<p/>', ...Object.fromEntries(titles.map((t, i) => [`ppt/slides/slide${i + 1}.xml`, `<p:sld><a:t>${t}</a:t></p:sld>`])), ...extra });
const docx = paras => makeZip({ 'word/document.xml': `<w:document>${paras.map(p => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join('')}</w:document>` });
const tmp = () => mkdtempSync(join(tmpdir(), 'materials-'));
const NOW = new Date('2026-11-24T10:00:00Z');

test('zip reader lists entries and reads one', () => {
  const z = Buffer.from(makeZip({ 'a.txt': 'hello', 'dir/b.xml': '<x>wörld ₹</x>' }));
  assert.deepEqual(
    listZip(z).map(e => e.name),
    ['a.txt', 'dir/b.xml'],
  );
  assert.equal(readZipText(z, 'dir/b.xml'), '<x>wörld ₹</x>');
  assert.equal(readZipText(z, 'missing'), null);
  assert.equal(readZipText(z, 'a.txt', 3), null, 'over the limit is refused');
  assert.deepEqual(listZip(Buffer.from('not a zip')), []);
});

test('adding a deck records slides, a summary from slide 1, and is repeatable', () => {
  const root = tmp();
  const bytes = deck(['Straight line and written down value methods compared', 'Slide two']);
  const a = addMaterial({ root, topic: 'XI.2.depreciation', name: 'SLM and WDV.pptx', bytes, now: NOW });
  assert.equal(a.status, 'added');
  assert.equal(a.meta.id, 'XI.2.depreciation/ppt-slm-and-wdv.pptx');
  assert.equal(a.meta.kind, 'PPT');
  assert.equal(a.meta.slides, 2);
  assert.equal(a.meta.addedAt, '2026-11-24');
  assert.equal(a.meta.summary, 'Straight line and written down value methods compared');
  assert.equal(a.meta.sha256.length, 64);
  assert.ok(existsSync(join(root, 'XI.2.depreciation/ppt-slm-and-wdv.pptx')) && existsSync(join(root, 'XI.2.depreciation/ppt-slm-and-wdv.pptx.meta.json')));
  assert.equal(addMaterial({ root, topic: 'XI.2.depreciation', name: 'SLM and WDV.pptx', bytes, now: NOW }).status, 'unchanged');
  assert.throws(() => addMaterial({ root, topic: 'XI.2.depreciation', name: 'SLM and WDV.pptx', bytes: deck(['Other']), now: NOW }), /different content/);
  assert.equal(addMaterial({ root, topic: 'XI.2.depreciation', name: 'SLM and WDV.pptx', bytes: deck(['Other']), now: NOW, replace: true }).status, 'added');
  rmSync(root, { recursive: true });
});

test('documents and markdown get summaries; Hindi titles get a checksum suffix so files never collide', () => {
  const root = tmp();
  const d = addMaterial({ root, topic: 'XII.1.goodwill', name: 'goodwill notes.docx', bytes: docx(['Short', 'Goodwill is the value of the firm’s reputation over its assets.']), now: NOW });
  assert.equal(d.meta.kind, 'NOTES');
  assert.match(d.meta.summary, /^Goodwill is the value/);
  const m = addMaterial({ root, topic: 'XII.1.goodwill', name: 'n.md', bytes: new TextEncoder().encode('# Title\n\nSuper profit is the excess of average profit over normal profit.\n'), now: NOW });
  assert.match(m.meta.summary, /^Super profit/);
  const h1 = addMaterial({ root, topic: 'XII.1.goodwill', name: 'a.md', title: 'ख्याति', bytes: new TextEncoder().encode('# ख्याति\n\nपहला\n'), lang: 'hi', now: NOW });
  const h2 = addMaterial({ root, topic: 'XII.1.goodwill', name: 'b.md', title: 'ख्याति', bytes: new TextEncoder().encode('# ख्याति\n\nदूसरा\n'), lang: 'hi', now: NOW });
  assert.notEqual(h1.meta.id, h2.meta.id);
  rmSync(root, { recursive: true });
});

test('refusals say what to do and leave nothing behind', () => {
  const root = tmp();
  const bad = (opts, re) => assert.throws(() => addMaterial({ root, now: NOW, ...opts }), re);
  bad({ topic: 'XI.9.nope', name: 'a.pdf', bytes: Buffer.from('%PDF-1.4') }, /not a syllabus topic/);
  bad({ topic: 'XI.2.tb', name: 'a.pptx', bytes: deck(['x'], { 'ppt/vbaProject.bin': 'MZ' }) }, /macros/);
  bad({ topic: 'XI.2.tb', name: 'a.pptx', kind: 'WORKSHEET', bytes: deck(['x']) }, /cannot be Worksheet/);
  bad({ topic: 'XI.2.tb', name: 'a.pdf', bytes: Buffer.from('<html>sign in</html>') }, /Anyone with the link/);
  bad({ topic: 'XI.2.tb', name: 'a.pdf', kind: 'SLIDES', bytes: Buffer.from('%PDF-1.4') }, /Kind must be/);
  bad({ topic: 'XI.2.tb', name: 'a.pdf', lang: 'fr', bytes: Buffer.from('%PDF-1.4') }, /Language/);
  assert.equal(buildCatalogue(root).items.length, 0);
  rmSync(root, { recursive: true });
});

test('catalogue is deterministic and validate catches every kind of damage', () => {
  const root = tmp();
  addMaterial({ root, topic: 'XI.2.tb', name: 'tb.pdf', bytes: Buffer.from('%PDF-1.4 /Type /Page'), now: NOW });
  addMaterial({ root, topic: 'XI.1.intro', name: 'intro.pdf', bytes: Buffer.from('%PDF-1.4 /Type /Page /Type /Page'), now: NOW });
  writeCatalogue(root);
  const first = readFileSync(join(root, 'catalogue.json'), 'utf8');
  writeCatalogue(root);
  assert.equal(readFileSync(join(root, 'catalogue.json'), 'utf8'), first, 'same input, same bytes');
  const cat = JSON.parse(first);
  assert.deepEqual(
    cat.items.map(i => i.topic),
    ['XI.1.intro', 'XI.2.tb'],
    'syllabus order, not alphabetical',
  );
  assert.equal(cat.items[0].pages, 2);
  assert.deepEqual(validateAll(root), []);
  // edited file
  writeFileSync(join(root, 'XI.2.tb/notes-tb.pdf'.replace('notes-tb', 'notes-tb')), 'x');
  const stray = join(root, 'XI.2.tb/stray.pdf');
  writeFileSync(stray, '%PDF-1.4');
  writeFileSync(join(root, 'XI.2.tb/notes-tb.pdf'), 'tampered');
  const p = validateAll(root).join('\n');
  assert.match(p, /checksum/);
  assert.match(p, /stray\.pdf.*no \.meta\.json/);
  rmSync(stray);
  writeFileSync(join(root, 'XI.2.tb/notes-tb.pdf'), Buffer.from('%PDF-1.4 /Type /Page'));
  assert.deepEqual(validateAll(root), []);
  addMaterial({ root, topic: 'XI.2.errors', name: 'e.pdf', bytes: Buffer.from('%PDF-1.4'), now: NOW });
  assert.match(validateAll(root).join(), /out of date/);
  assert.deepEqual(coverage(root).missing.includes('XI.2.errors'), false);
  rmSync(root, { recursive: true });
});

test('remove deletes the file, its record and an empty chapter folder', () => {
  const root = tmp();
  const { meta } = addMaterial({ root, topic: 'XI.2.tb', name: 'tb.pdf', bytes: Buffer.from('%PDF-1.4'), now: NOW });
  removeMaterial(root, meta.id);
  writeCatalogue(root);
  assert.equal(existsSync(join(root, 'XI.2.tb')), false);
  assert.throws(() => removeMaterial(root, meta.id), /No material/);
  rmSync(root, { recursive: true });
});

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
const respond = (bytes, headers = {}, status = 200) => new Response(bytes, { status, headers });

test('Drive: downloads a shared file and takes its name from the response', async () => {
  const seen = [];
  const f = async url => {
    seen.push(url);
    return respond(Buffer.from('%PDF-1.4 /Type /Page'), { 'content-disposition': `attachment; filename="Partnership notes.pdf"; filename*=UTF-8''Partnership%20notes.pdf` });
  };
  const r = await fetchDrive(`https://drive.google.com/file/d/${ID}/view?usp=sharing`, { fetchFn: f });
  assert.equal(r.name, 'Partnership notes.pdf');
  assert.equal(seen[0], `https://drive.google.com/uc?export=download&id=${ID}`);
});
test('Drive: Google Slides are exported as pptx and named', async () => {
  const f = async url => {
    assert.match(url, /\/export\/pptx$/);
    return respond(deck(['Hi']));
  };
  const r = await fetchDrive(`https://docs.google.com/presentation/d/${ID}/edit`, { fetchFn: f });
  assert.match(r.name, /\.pptx$/);
});
test('Drive: the big-file confirmation page is followed once', async () => {
  const html = `<html><body>Google Drive can't scan this file for viruses. <form action="https://drive.usercontent.google.com/download" method="get"><input type="hidden" name="id" value="${ID}"><input type="hidden" name="confirm" value="t"><input type="submit" value="Download anyway"></form></body></html>`;
  const seen = [];
  const f = async url => {
    seen.push(url);
    return seen.length === 1 ? respond(html, { 'content-type': 'text/html' }) : respond(Buffer.from('%PDF-1.4'), { 'content-disposition': 'attachment; filename="big.pdf"' });
  };
  const r = await fetchDrive(`https://drive.google.com/file/d/${ID}/view`, { fetchFn: f });
  assert.equal(r.name, 'big.pdf');
  assert.match(seen[1], /^https:\/\/drive\.usercontent\.google\.com\/download\?id=.*&confirm=t$/);
});
test('Drive: refusals are plain sentences (not shared, missing, too big, folder, other site)', async () => {
  const code = status => async () => respond('', {}, status);
  await assert.rejects(fetchDrive(`https://drive.google.com/file/d/${ID}/view`, { fetchFn: code(403) }), /Anyone with the link/);
  await assert.rejects(fetchDrive(`https://drive.google.com/file/d/${ID}/view`, { fetchFn: code(404) }), /does not exist/);
  await assert.rejects(fetchDrive(`https://drive.google.com/file/d/${ID}/view`, { fetchFn: async () => respond(Buffer.alloc(2000), {}), maxBytes: 1000 }), /larger than/);
  await assert.rejects(
    fetchDrive(`https://drive.google.com/file/d/${ID}/view`, {
      fetchFn: async () => {
        throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
      },
    }),
    /Could not reach Google Drive \(ECONNREFUSED\)/,
  );
  await assert.rejects(fetchDrive(`https://drive.google.com/drive/folders/${ID}`), /folder/);
  await assert.rejects(fetchDrive('https://example.com/x'), /Only Google Drive/);
});

test('incoming folder: files and Drive links are filed by chapter; failures stay put', async () => {
  const root = tmp(),
    incoming = tmp();
  mkdirSync(join(incoming, 'XI.2.depreciation/PPT'), { recursive: true });
  mkdirSync(join(incoming, 'XII.1.goodwill'), { recursive: true });
  writeFileSync(join(incoming, 'XI.2.depreciation/PPT/deck.pptx'), deck(['Depreciation']));
  writeFileSync(join(incoming, 'XII.1.goodwill/notes.pdf'), '%PDF-1.4 /Type /Page');
  writeFileSync(join(incoming, 'XII.1.goodwill/bad.exe'), 'MZ');
  mkdirSync(join(incoming, 'nonsense'), { recursive: true });
  writeFileSync(join(incoming, 'nonsense/x.pdf'), '%PDF-1.4');
  writeFileSync(
    join(incoming, 'drive-links.txt'),
    [
      '# topic | kind | title | link',
      `XII.2.issue | NOTES | Share issue notes | https://drive.google.com/file/d/${ID}/view`,
      `XII.2.forfeiture | | | https://drive.google.com/drive/folders/${ID}`,
      'bad line',
    ].join('\n') + '\n',
  );
  const f = async () => respond(Buffer.from('%PDF-1.4'), { 'content-disposition': 'attachment; filename="x.pdf"' });
  const res = await processIncoming({ incoming, root, fetchFn: f, now: NOW });
  const ok = res
    .filter(r => r.ok)
    .map(r => r.meta.id)
    .sort();
  assert.deepEqual(ok, ['XI.2.depreciation/ppt-deck.pptx', 'XII.1.goodwill/notes-notes.pdf', 'XII.2.issue/notes-share-issue-notes.pdf']);
  assert.equal(res.filter(r => !r.ok).length, 4);
  assert.equal(existsSync(join(incoming, 'XI.2.depreciation/PPT/deck.pptx')), false, 'added files leave incoming');
  assert.equal(existsSync(join(incoming, 'XII.1.goodwill/bad.exe')), true, 'refused files stay');
  const left = readFileSync(join(incoming, 'drive-links.txt'), 'utf8');
  assert.match(left, /folders/);
  assert.match(left, /bad line/);
  assert.doesNotMatch(left, /Share issue notes/);
  writeCatalogue(root);
  assert.deepEqual(validateAll(root), []);
  const md = reportOf(res);
  assert.match(md, /3 added or unchanged, 4 refused/);
  assert.match(md, /Reviewer checklist/);
  assert.match(md, /bad\.exe.*programs/);
  rmSync(root, { recursive: true });
  rmSync(incoming, { recursive: true });
});
