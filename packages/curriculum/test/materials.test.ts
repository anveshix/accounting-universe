import { describe, expect, it } from 'vitest';
import {
  CLAUSES,
  MAX_MATERIAL_BYTES,
  countsByTopic,
  describeSize,
  extOf,
  fileNameFor,
  formatSize,
  guessKind,
  inspectFile,
  materialsFor,
  parseCatalogue,
  parseDriveUrl,
  parseIncomingPath,
  problemsOf,
  slugify,
  topicsWithout,
  type MaterialMeta,
} from '../src';

const enc = (s: string) => new TextEncoder().encode(s);
const bytes = (...parts: (string | number[])[]) => Uint8Array.from(parts.flatMap(p => (typeof p === 'string' ? [...enc(p)] : p)));
const PK = [0x50, 0x4b, 0x03, 0x04];
/** A fake pptx: zip signature, then the part names a real one stores uncompressed. Enough for the rules, which read names only. */
const pptx = (slides: number, extra = '') => bytes(PK, 'ppt/presentation.xml', ...Array.from({ length: slides }, (_, i) => `ppt/slides/slide${i + 1}.xml`), 'ppt/slides/_rels/slide1.xml.rels', extra);
const TOPICS = new Set(CLAUSES.map(c => c.id));

describe('file names', () => {
  it('reads extensions and makes safe slugs', () => {
    expect(extOf('Notes v2.PDF')).toBe('pdf');
    expect(extOf('README')).toBe('');
    expect(slugify('SLM & WDV: Depreciation (Class XI)')).toBe('slm-wdv-depreciation-class-xi');
    expect(slugify('  café déjà vu ')).toBe('cafe-deja-vu');
    expect(slugify('मूल्य ह्रास')).toBe('untitled');
    expect(slugify('x'.repeat(200)).length).toBeLessThanOrEqual(60);
    expect(fileNameFor('LESSON_PLAN', 'Unit 2', 'docx')).toBe('lesson-plan-unit-2.docx');
  });
  it('guesses the kind', () => {
    expect(guessKind('deck.pptx')).toBe('PPT');
    expect(guessKind('Partnership worksheet.pdf')).toBe('WORKSHEET');
    expect(guessKind('lesson plan unit 1.docx')).toBe('LESSON_PLAN');
    expect(guessKind('chapter notes.pdf')).toBe('NOTES');
  });
  it('formats sizes', () => {
    expect(formatSize(900)).toBe('900 B');
    expect(formatSize(2048)).toBe('2 KB');
    expect(formatSize(1572864)).toBe('1.5 MB');
    expect(describeSize({ ext: 'pptx', slides: 24, bytes: 1572864 })).toBe('24 slides · 1.5 MB');
    expect(describeSize({ ext: 'pdf', pages: 1, bytes: 2048 })).toBe('1 page · 2 KB');
    expect(describeSize({ ext: 'docx', bytes: 2048 })).toBe('Word · 2 KB');
  });
});

describe('what may be added', () => {
  it('accepts a PDF, a deck (and counts its slides), a docx, markdown', () => {
    const pdf = inspectFile('a.pdf', bytes('%PDF-1.7\n1 0 obj << /Type /Page >> endobj\n2 0 obj << /Type /Pages >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R >>'));
    expect(pdf.ok && pdf.pages).toBe(2);
    const deck = inspectFile('d.pptx', pptx(3));
    expect(deck.ok && deck.slides).toBe(3);
    expect(inspectFile('n.docx', bytes(PK, 'word/document.xml')).ok).toBe(true);
    expect(inspectFile('m.md', enc('# हिंदी नोट्स ₹100')).ok).toBe(true);
  });
  it('refuses the unsafe and the unusable, each with a sentence that says what to do', () => {
    const why = (name: string, b: Uint8Array) => {
      const r = inspectFile(name, b);
      return r.ok ? '' : r.reason;
    };
    expect(why('x.pptm', pptx(1))).toMatch(/programs/);
    expect(why('x.exe', bytes('MZ'))).toMatch(/programs/);
    expect(why('x.ppt', bytes([0xd0, 0xcf, 0x11, 0xe0]))).toMatch(/Save As/);
    expect(why('x.pptx', bytes([0xd0, 0xcf, 0x11, 0xe0, 1, 2]))).toMatch(/old-format/);
    expect(why('x.pptx', pptx(2, 'ppt/vbaProject.bin'))).toMatch(/macros/);
    expect(why('x.pptx', bytes(PK, 'word/document.xml'))).toMatch(/not a PowerPoint/);
    expect(why('x.pdf', bytes('hello world'))).toMatch(/not a PDF/);
    expect(why('x.pdf', bytes('<!DOCTYPE html><html>sign in</html>'))).toMatch(/Anyone with the link/);
    expect(why('x.docx', enc('  <html><body>login'))).toMatch(/web page/);
    expect(why('x.md', bytes('ok', [0, 1, 2]))).toMatch(/binary/);
    expect(why('x.md', Uint8Array.from([0xff, 0xfe, 0x41]))).toMatch(/UTF-8/);
    expect(why('noext', bytes('x'))).toMatch(/no file extension/);
    expect(why('x.pdf', new Uint8Array(0))).toMatch(/empty/);
    expect(why('x.pdf', new Uint8Array(MAX_MATERIAL_BYTES + 1))).toMatch(/25 MB/);
  });
});

describe('Google Drive links', () => {
  const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
  it('turns share links into download addresses', () => {
    expect(parseDriveUrl(`https://drive.google.com/file/d/${id}/view?usp=sharing`)).toEqual({ ok: true, id, what: 'file', url: `https://drive.google.com/uc?export=download&id=${id}` });
    expect(parseDriveUrl(`https://drive.google.com/open?id=${id}`)).toMatchObject({ ok: true, id, what: 'file' });
    expect(parseDriveUrl(`https://docs.google.com/presentation/d/${id}/edit#slide=id.p`)).toEqual({
      ok: true,
      id,
      what: 'presentation',
      ext: 'pptx',
      url: `https://docs.google.com/presentation/d/${id}/export/pptx`,
    });
    expect(parseDriveUrl(`https://docs.google.com/document/d/${id}/edit`)).toMatchObject({ ok: true, ext: 'docx', url: `https://docs.google.com/document/d/${id}/export?format=docx` });
    expect(parseDriveUrl(`https://docs.google.com/spreadsheets/d/${id}/edit`)).toMatchObject({ ok: true, ext: 'xlsx' });
  });
  it('refuses folders, other sites, plain http and links without an id', () => {
    const why = (u: string) => {
      const r = parseDriveUrl(u);
      return r.ok ? '' : r.reason;
    };
    expect(why(`https://drive.google.com/drive/folders/${id}`)).toMatch(/folder/);
    expect(why('https://evil.example.com/file/d/' + id)).toMatch(/Only Google Drive/);
    expect(why('https://drive.google.com.evil.example/file/d/' + id)).toMatch(/Only Google Drive/);
    expect(why(`http://drive.google.com/file/d/${id}`)).toMatch(/https/);
    expect(why('https://drive.google.com/file/d/short/view')).toMatch(/file id/);
    expect(why('not a link')).toMatch(/web address/);
  });
});

const ok = (over: Partial<MaterialMeta> = {}): MaterialMeta => ({
  id: 'XI.2.depreciation/ppt-slm.pptx',
  topic: 'XI.2.depreciation',
  kind: 'PPT',
  title: 'SLM',
  summary: 's',
  lang: 'en',
  file: 'XI.2.depreciation/ppt-slm.pptx',
  ext: 'pptx',
  bytes: 10,
  sha256: 'a'.repeat(64),
  source: 'upload',
  addedAt: '2026-11-24',
  ...over,
});
describe('catalogue rules', () => {
  it('accepts a good entry and names every problem in a bad one', () => {
    expect(problemsOf(ok(), TOPICS)).toEqual([]);
    expect(problemsOf(ok({ topic: 'XI.9.nothing', file: 'XI.9.nothing/a.pptx', id: 'XI.9.nothing/a.pptx' }), TOPICS).join()).toMatch(/not a syllabus topic/);
    expect(problemsOf(ok({ file: 'XI.2.depreciation/../../etc/passwd', id: 'XI.2.depreciation/../../etc/passwd' }), TOPICS).join()).toMatch(/not safe/);
    expect(problemsOf(ok({ file: 'XI.1.intro/a.pptx' }), TOPICS).join()).toMatch(/topic folder/);
    expect(problemsOf(ok({ sha256: 'xyz' }), TOPICS).join()).toMatch(/sha256/);
    expect(problemsOf(ok({ ext: 'exe' }), TOPICS).join()).toMatch(/not accepted/);
    expect(problemsOf(ok({ bytes: MAX_MATERIAL_BYTES + 1 }), TOPICS).join()).toMatch(/size limit/);
    expect(problemsOf(null, TOPICS)).toEqual(['entry is not an object']);
  });
  it('drops bad entries, keeps the rest, rejects duplicates', () => {
    const r = parseCatalogue({ version: 1, items: [ok(), { nonsense: true }, ok(), ok({ id: 'XI.2.depreciation/b.pdf', file: 'XI.2.depreciation/b.pdf', ext: 'pdf', kind: 'NOTES' })] }, TOPICS);
    expect(r.items.map(i => i.id)).toEqual(['XI.2.depreciation/ppt-slm.pptx', 'XI.2.depreciation/b.pdf']);
    expect(r.problems.length).toBe(2);
    expect(parseCatalogue('x', TOPICS).items).toEqual([]);
    expect(parseCatalogue({ items: 'x' }, TOPICS).problems[0]).toMatch(/no items list/);
  });
  it('groups by topic in kind order and counts', () => {
    const items = [
      ok({ id: 'XI.2.depreciation/n.pdf', file: 'XI.2.depreciation/n.pdf', ext: 'pdf', kind: 'NOTES', title: 'B notes' }),
      ok(),
      ok({ id: 'XI.2.depreciation/m.pdf', file: 'XI.2.depreciation/m.pdf', ext: 'pdf', kind: 'NOTES', title: 'A notes' }),
      ok({ id: 'XI.2.tb/t.pdf', file: 'XI.2.tb/t.pdf', topic: 'XI.2.tb', ext: 'pdf', kind: 'NOTES' }),
    ];
    expect(materialsFor(items, 'XI.2.depreciation').map(m => m.title)).toEqual(['A notes', 'B notes', 'SLM']);
    expect(countsByTopic(items)).toEqual({ 'XI.2.depreciation': { NOTES: 2, PPT: 1 }, 'XI.2.tb': { NOTES: 1 } });
    expect(topicsWithout(items, ['XI.2.tb', 'XI.2.errors', 'XI.2.depreciation'])).toEqual(['XI.2.errors']);
  });
  it('reads the incoming folder convention', () => {
    expect(parseIncomingPath('XI.2.depreciation/ppt/deck.pptx')).toEqual({ topic: 'XI.2.depreciation', kind: 'PPT', file: 'deck.pptx' });
    expect(parseIncomingPath('XII.1.goodwill/lesson-plan/lp.docx')).toEqual({ topic: 'XII.1.goodwill', kind: 'LESSON_PLAN', file: 'lp.docx' });
    expect(parseIncomingPath('XII.1.goodwill/notes.pdf')).toEqual({ topic: 'XII.1.goodwill', file: 'notes.pdf' });
    expect(parseIncomingPath('onlyone')).toHaveProperty('error');
    expect(parseIncomingPath('XI.1.intro/SLIDES/a.pptx')).toHaveProperty('error');
  });
});
