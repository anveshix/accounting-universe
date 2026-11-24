/**
 * Chapter-wise teaching materials (notes, slide decks, lesson plans, worksheets): the pure rules shared by the
 * ingest command-line tool (tools/materials), the web app (#/materials) and the tests. No DOM, no Node APIs, no imports,
 * so Node can load this file directly (type stripping) and the browser bundles it unchanged.
 *
 * What it decides: which files are accepted, how a Google Drive link is turned into a download address, how a catalogue
 * entry looks, and how entries are grouped under the 54 syllabus topics. Every refusal is a sentence a teacher can act on.
 */
export type MaterialKind = 'NOTES' | 'PPT' | 'LESSON_PLAN' | 'WORKSHEET';
export const MATERIAL_KINDS: Readonly<Record<MaterialKind, string>> = { NOTES: 'Notes', PPT: 'Slides (PPT)', LESSON_PLAN: 'Lesson plan', WORKSHEET: 'Worksheet' };
export type MaterialLang = 'en' | 'hi' | 'en-hi';
export const MATERIAL_LANGS: Readonly<Record<MaterialLang, string>> = { en: 'English', hi: 'हिंदी', 'en-hi': 'English + हिंदी' };
export type MaterialSource = 'upload' | 'drive';

/** Largest file accepted (bytes). GitHub Pages and phones both cope with this; bigger decks should be split. */
export const MAX_MATERIAL_BYTES = 25 * 1024 * 1024;

export type FileFamily = 'pdf' | 'zip' | 'text';
export interface FileType {
  readonly label: string;
  readonly mime: string;
  readonly family: FileFamily;
  /** a part every genuine file of this type has inside its zip */ readonly mustHave?: string;
  readonly kinds: readonly MaterialKind[];
}
/** Accepted file types. Macro-enabled and legacy binary Office files are deliberately absent. */
export const FILE_TYPES: Readonly<Record<string, FileType>> = {
  pdf: { label: 'PDF', mime: 'application/pdf', family: 'pdf', kinds: ['NOTES', 'PPT', 'LESSON_PLAN', 'WORKSHEET'] },
  pptx: { label: 'PowerPoint', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', family: 'zip', mustHave: 'ppt/presentation.xml', kinds: ['PPT', 'LESSON_PLAN'] },
  docx: { label: 'Word', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', family: 'zip', mustHave: 'word/document.xml', kinds: ['NOTES', 'LESSON_PLAN', 'WORKSHEET'] },
  xlsx: { label: 'Excel', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', family: 'zip', mustHave: 'xl/workbook.xml', kinds: ['WORKSHEET'] },
  md: { label: 'Markdown', mime: 'text/markdown', family: 'text', kinds: ['NOTES', 'LESSON_PLAN', 'WORKSHEET'] },
  txt: { label: 'Text', mime: 'text/plain', family: 'text', kinds: ['NOTES', 'LESSON_PLAN', 'WORKSHEET'] },
};
export const ACCEPT_ATTR = Object.keys(FILE_TYPES)
  .map(e => '.' + e)
  .join(',');

export const extOf = (name: string): string => {
  const m = /\.([A-Za-z0-9]{1,5})$/.exec(name.trim());
  return m ? m[1]!.toLowerCase() : '';
};

/** Lower-case, ASCII, dash-separated: safe as a file name on every system and in a URL. Empty input gives "untitled". */
export function slugify(text: string): string {
  const s = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return s || 'untitled';
}

/** Which kind a file most likely is, from its extension and name; the uploader can always override. */
export function guessKind(name: string): MaterialKind {
  const e = extOf(name),
    n = name.toLowerCase();
  if (e === 'pptx') return 'PPT';
  if (e === 'xlsx' || /worksheet|practice|exercise/.test(n)) return 'WORKSHEET';
  if (/lesson[-_ ]?plan|unit[-_ ]?plan/.test(n)) return 'LESSON_PLAN';
  if (/\b(ppt|slides?|deck)\b/.test(n)) return 'PPT';
  return 'NOTES';
}

export type FileCheck = { readonly ok: true; readonly ext: string; readonly type: FileType; readonly pages?: number; readonly slides?: number } | { readonly ok: false; readonly reason: string };

const latin1 = (b: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return s;
};
const startsWith = (b: Uint8Array, sig: readonly number[]): boolean => sig.every((v, i) => b[i] === v);

/** Slide count read from the zip's file names (stored uncompressed): ppt/slides/slideN.xml. */
export function countSlides(zipLatin1: string): number {
  return new Set(zipLatin1.match(/ppt\/slides\/slide\d+\.xml/g) ?? []).size;
}
/** Page count of a PDF by counting page objects. A fast estimate: files that pack objects into compressed streams give no count. */
export function countPdfPages(pdfLatin1: string): number | undefined {
  const n = (pdfLatin1.match(/\/Type\s*\/Page(?![A-Za-z])/g) ?? []).length;
  return n > 0 ? n : undefined;
}

/**
 * Decide whether a file may be added. `bytes` is the whole file (the checks need only its start and its zip directory).
 * Nothing here runs or opens the file; it only looks at its signature and the names stored inside a zip.
 */
export function inspectFile(name: string, bytes: Uint8Array): FileCheck {
  const ext = extOf(name),
    type = FILE_TYPES[ext];
  if (!ext) return { ok: false, reason: `“${name}” has no file extension. Use a .pdf, .pptx, .docx, .xlsx, .md or .txt file.` };
  if (!type) {
    if (['ppt', 'doc', 'xls'].includes(ext))
      return { ok: false, reason: `Old .${ext} files are not accepted. In PowerPoint or Word choose Save As and pick the newer .${ext}x format, or export a PDF.` };
    if (['pptm', 'docm', 'xlsm', 'xlsb', 'exe', 'js', 'html', 'htm', 'zip', 'jar', 'bat', 'sh'].includes(ext))
      return { ok: false, reason: `.${ext} files are not accepted because they can contain programs. Export the content as .pptx, .docx or PDF.` };
    return { ok: false, reason: `.${ext} files are not accepted. Use .pdf, .pptx, .docx, .xlsx, .md or .txt.` };
  }
  if (bytes.length === 0) return { ok: false, reason: `“${name}” is empty.` };
  if (bytes.length > MAX_MATERIAL_BYTES)
    return { ok: false, reason: `“${name}” is ${(bytes.length / 1048576).toFixed(1)} MB; the limit is ${MAX_MATERIAL_BYTES / 1048576} MB. Compress the pictures or split the file by chapter.` };
  const head = latin1(bytes.subarray(0, 512)).trimStart().toLowerCase();
  if (head.startsWith('<!doctype html') || head.startsWith('<html'))
    return {
      ok: false,
      reason: `“${name}” is a web page, not a ${type.label} file. For a Google Drive link this usually means the file is not shared: set sharing to “Anyone with the link” and try again.`,
    };
  if (type.family === 'pdf') {
    if (!startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { ok: false, reason: `“${name}” is named .pdf but is not a PDF file. Open it and use Save As / Export to PDF again.` };
    const pages = countPdfPages(latin1(bytes));
    return pages ? { ok: true, ext, type, pages } : { ok: true, ext, type };
  }
  if (type.family === 'zip') {
    if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0])) return { ok: false, reason: `“${name}” is an old-format file with a new name. Open it and use Save As to create a real .${ext}.` };
    if (!startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return { ok: false, reason: `“${name}” is not a valid .${ext} file. Open it in ${type.label} and save it again.` };
    const z = latin1(bytes);
    if (z.includes('vbaProject.bin')) return { ok: false, reason: `“${name}” contains macros. Save a copy without macros (a plain .${ext}) and add that.` };
    if (!z.includes(type.mustHave!)) return { ok: false, reason: `“${name}” is a zip file but not a ${type.label} document. Open it in ${type.label} and save it again.` };
    const slides = ext === 'pptx' ? countSlides(z) : 0;
    return slides ? { ok: true, ext, type, slides } : { ok: true, ext, type };
  }
  // text
  if (bytes.subarray(0, 4096).includes(0)) return { ok: false, reason: `“${name}” looks like a binary file, not text.` };
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, reason: `“${name}” is not saved as UTF-8 text. Save it as UTF-8 so Hindi and ₹ show correctly.` };
  }
  return { ok: true, ext, type };
}

export type DriveLink =
  | { readonly ok: true; readonly id: string; readonly what: 'file' | 'document' | 'presentation' | 'spreadsheet'; readonly url: string; readonly ext?: string }
  | { readonly ok: false; readonly reason: string };
const DRIVE_ID = /^[A-Za-z0-9_-]{15,}$/;
/**
 * Turn a Google Drive / Docs share link into the address that downloads the file. Only the owner-shared forms are understood;
 * a folder cannot be fetched without a Google account key, so it is refused with the way round it.
 */
export function parseDriveUrl(raw: string): DriveLink {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return { ok: false, reason: 'That is not a web address. Paste the full Google Drive link, starting with https://' };
  }
  if (u.protocol !== 'https:') return { ok: false, reason: 'Only https:// links are accepted.' };
  const host = u.hostname.toLowerCase();
  if (host !== 'drive.google.com' && host !== 'docs.google.com')
    return { ok: false, reason: 'Only Google Drive and Google Docs/Slides links are accepted. Upload the file instead, or share it from Google Drive.' };
  if (/\/folders\//.test(u.pathname) || /\/drive\/folders/.test(u.pathname))
    return { ok: false, reason: 'A folder link cannot be fetched. Open the folder, share each file with “Anyone with the link”, and add the files one by one (or upload them).' };
  const m = /\/(file|document|presentation|spreadsheets)\/d\/([^/]+)/.exec(u.pathname);
  const id = m?.[2] ?? u.searchParams.get('id') ?? '';
  if (!DRIVE_ID.test(id)) return { ok: false, reason: 'The link does not contain a file id. Copy it again using Share → Copy link.' };
  const part = m?.[1];
  if (part === 'document') return { ok: true, id, what: 'document', ext: 'docx', url: `https://docs.google.com/document/d/${id}/export?format=docx` };
  if (part === 'presentation') return { ok: true, id, what: 'presentation', ext: 'pptx', url: `https://docs.google.com/presentation/d/${id}/export/pptx` };
  if (part === 'spreadsheets') return { ok: true, id, what: 'spreadsheet', ext: 'xlsx', url: `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx` };
  return { ok: true, id, what: 'file', url: `https://drive.google.com/uc?export=download&id=${id}` };
}

export interface MaterialMeta {
  readonly id: string;
  /** syllabus topic id, e.g. "XI.2.depreciation" */
  readonly topic: string;
  readonly kind: MaterialKind;
  readonly title: string;
  readonly summary: string;
  readonly lang: MaterialLang;
  /** path under apps/web/public/materials/, e.g. "XI.2.depreciation/ppt-slm-and-wdv.pptx" */
  readonly file: string;
  readonly ext: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly pages?: number;
  readonly slides?: number;
  readonly source: MaterialSource;
  readonly addedAt: string;
}
export interface MaterialsCatalogue {
  readonly version: 1;
  readonly generatedAt: string;
  readonly items: readonly MaterialMeta[];
}

export const fileNameFor = (kind: MaterialKind, title: string, ext: string): string => `${kind.toLowerCase().replace('_', '-')}-${slugify(title)}.${ext}`;
export const materialId = (topic: string, fileName: string): string => `${topic}/${fileName}`;

/** Human size such as "1.4 MB". */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
/** "24 slides", "9 pages" or the type label, for the card. */
export function describeSize(m: Pick<MaterialMeta, 'ext' | 'pages' | 'slides' | 'bytes'>): string {
  const part = m.slides ? `${m.slides} slide${m.slides === 1 ? '' : 's'}` : m.pages ? `${m.pages} page${m.pages === 1 ? '' : 's'}` : (FILE_TYPES[m.ext]?.label ?? m.ext.toUpperCase());
  return `${part} · ${formatSize(m.bytes)}`;
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Check one catalogue entry; returns the problems (empty when it is fine). `topics` is the set of valid topic ids. */
export function problemsOf(m: unknown, topics: ReadonlySet<string>): string[] {
  const p: string[] = [];
  if (typeof m !== 'object' || m === null) return ['entry is not an object'];
  const r = m as Record<string, unknown>;
  for (const k of ['id', 'topic', 'kind', 'title', 'summary', 'lang', 'file', 'ext', 'sha256', 'source', 'addedAt']) if (typeof r[k] !== 'string') p.push(`${k} is missing`);
  if (!isNum(r.bytes)) p.push('bytes is missing');
  if (!isStr(r.title)) p.push('title is empty');
  if (isStr(r.topic) && !topics.has(r.topic)) p.push(`topic “${r.topic}” is not a syllabus topic`);
  if (!isStr(r.kind) || !(r.kind in MATERIAL_KINDS)) p.push(`kind “${String(r.kind)}” is not one of ${Object.keys(MATERIAL_KINDS).join(', ')}`);
  if (!isStr(r.lang) || !(r.lang in MATERIAL_LANGS)) p.push(`lang “${String(r.lang)}” is not one of en, hi, en-hi`);
  if (r.source !== 'upload' && r.source !== 'drive') p.push('source must be upload or drive');
  if (isStr(r.ext) && !(r.ext in FILE_TYPES)) p.push(`file type .${r.ext} is not accepted`);
  if (isStr(r.sha256) && !/^[0-9a-f]{64}$/.test(r.sha256)) p.push('sha256 is not a 64-character hex string');
  if (isStr(r.file) && (r.file.includes('..') || r.file.startsWith('/') || r.file.includes('\\') || !/^[A-Za-z0-9._/-]+$/.test(r.file))) p.push('file path is not safe');
  if (isStr(r.file) && isStr(r.topic) && !r.file.startsWith(r.topic + '/')) p.push('file is not inside its topic folder');
  if (isStr(r.id) && isStr(r.file) && r.id !== r.file) p.push('id must equal file');
  if (isNum(r.bytes) && r.bytes > MAX_MATERIAL_BYTES) p.push('file is over the size limit');
  return p;
}

/** Read a catalogue file safely: bad entries are dropped and reported, so one mistake never hides the rest. */
export function parseCatalogue(json: unknown, topics: ReadonlySet<string>): { items: MaterialMeta[]; problems: string[] } {
  const items: MaterialMeta[] = [],
    problems: string[] = [];
  const list = typeof json === 'object' && json !== null ? (json as { items?: unknown }).items : undefined;
  if (!Array.isArray(list)) return { items, problems: ['catalogue has no items list'] };
  const seen = new Set<string>();
  list.forEach((m, i) => {
    const bad = problemsOf(m, topics);
    const id = (m as { id?: string })?.id ?? `#${i}`;
    if (!bad.length && seen.has(id)) bad.push('duplicate id');
    if (bad.length) {
      problems.push(`${id}: ${bad.join('; ')}`);
      return;
    }
    seen.add(id);
    items.push(m as MaterialMeta);
  });
  return { items, problems };
}

/** Items of one topic, newest first within each kind order. */
export function materialsFor(items: readonly MaterialMeta[], topic: string): MaterialMeta[] {
  const order = Object.keys(MATERIAL_KINDS);
  return items.filter(m => m.topic === topic).sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || b.addedAt.localeCompare(a.addedAt) || a.title.localeCompare(b.title));
}
/** How many items each topic has, by kind: the chapter outline's badges. */
export function countsByTopic(items: readonly MaterialMeta[]): Record<string, Partial<Record<MaterialKind, number>>> {
  const out: Record<string, Partial<Record<MaterialKind, number>>> = {};
  for (const m of items) {
    const t = (out[m.topic] ??= {});
    t[m.kind] = (t[m.kind] ?? 0) + 1;
  }
  return out;
}
/** The teacher-facing coverage line: which of the given topics still have no material of any kind. */
export function topicsWithout(items: readonly MaterialMeta[], topics: readonly string[]): string[] {
  const have = new Set(items.map(m => m.topic));
  return topics.filter(t => !have.has(t));
}

/** Parse the `incoming/` convention: incoming/<topic>/<KIND>/<file> or incoming/<topic>/<file>. */
export function parseIncomingPath(rel: string): { topic: string; kind?: MaterialKind; file: string } | { error: string } {
  const parts = rel.split('/').filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return { error: `“${rel}” should be incoming/<topic>/<file> or incoming/<topic>/<KIND>/<file>.` };
  const topic = parts[0]!,
    file = parts[parts.length - 1]!;
  if (parts.length === 2) return { topic, file };
  const k = parts[1]!.toUpperCase().replace(/[- ]/g, '_');
  if (!(k in MATERIAL_KINDS)) return { error: `“${parts[1]}” is not a kind folder. Use NOTES, PPT, LESSON_PLAN or WORKSHEET.` };
  return { topic, kind: k as MaterialKind, file };
}
