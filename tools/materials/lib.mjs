// Ingest, catalogue and validation for chapter-wise materials. Pure Node, no packages. Every function takes the folders it works in,
// so the tests run in a temporary directory and the command-line tool runs on the real repository.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { CLAUSES } from '../../packages/curriculum/src/syllabus.ts';
import {
  FILE_TYPES,
  MATERIAL_KINDS,
  MATERIAL_LANGS,
  extOf,
  fileNameFor,
  guessKind,
  inspectFile,
  materialId,
  parseCatalogue,
  parseIncomingPath,
  slugify,
  topicsWithout,
} from '../../packages/curriculum/src/materials.ts';
import { fetchDrive } from './drive.mjs';
import { readZipText, textRuns } from './zip.mjs';

export const TOPICS = new Set(CLAUSES.map(c => c.id));
export const TOPIC_LIST = CLAUSES.map(c => c.id);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const META = '.meta.json';

/** "SLM and WDV.pptx" → "SLM and WDV"; underscores and dashes become spaces. */
export const titleFromName = name =>
  basename(name)
    .replace(/\.[A-Za-z0-9]{1,5}$/, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Untitled';

/** A one-line description taken from the file itself: a deck's first slide, a document's first paragraph, a markdown file's first sentence. */
export function summaryOf(ext, bytes) {
  const buf = Buffer.from(bytes);
  let t = '';
  if (ext === 'pptx') t = textRuns(readZipText(buf, 'ppt/slides/slide1.xml') ?? '', 'a:t');
  else if (ext === 'docx')
    t =
      (readZipText(buf, 'word/document.xml') ?? '')
        .split(/<\/w:p>/)
        .map(p => textRuns(p, 'w:t'))
        .find(x => x.length > 20) ?? '';
  else if (ext === 'md' || ext === 'txt')
    t =
      buf
        .toString('utf8')
        .split(/\n{2,}/)
        .map(p =>
          p
            .replace(/^#+\s*/gm, '')
            .replace(/[*_`>]/g, '')
            .trim(),
        )
        .find(p => p.length > 20 && !p.startsWith('---')) ?? '';
  t = t.replace(/\s+/g, ' ').trim();
  return t.length > 160 ? t.slice(0, 157).trimEnd() + '…' : t;
}

/**
 * Add one file. Returns { status: 'added'|'unchanged', meta } or throws an Error whose message tells the teacher what to fix.
 * source: 'upload' for files, 'drive' for links.
 */
export function addMaterial({ root, topic, kind, title, summary, lang = 'en', name, bytes, source = 'upload', now = new Date(), replace = false }) {
  if (!TOPICS.has(topic)) throw new Error(`“${topic}” is not a syllabus topic id. Examples: XI.2.depreciation, XII.1.goodwill. List them with: node tools/materials/cli.mjs topics`);
  if (!(lang in MATERIAL_LANGS)) throw new Error(`Language must be en, hi or en-hi (not “${lang}”).`);
  const check = inspectFile(name, bytes);
  if (!check.ok) throw new Error(check.reason);
  const k = kind ?? guessKind(name);
  if (!(k in MATERIAL_KINDS)) throw new Error(`Kind must be one of ${Object.keys(MATERIAL_KINDS).join(', ')} (not “${k}”).`);
  if (!check.type.kinds.includes(k)) throw new Error(`A .${check.ext} file cannot be ${MATERIAL_KINDS[k]}. Allowed kinds for .${check.ext}: ${check.type.kinds.join(', ')}.`);
  const ttl = (title ?? '').trim() || titleFromName(name);
  const digest = sha256(bytes);
  let fileName = fileNameFor(k, ttl, check.ext);
  if (slugify(ttl) === 'untitled') fileName = fileName.replace(/\.[a-z0-9]+$/, `-${digest.slice(0, 8)}.${check.ext}`);
  const dir = join(root, topic),
    path = join(dir, fileName),
    metaPath = path + META;
  if (existsSync(path)) {
    const old = JSON.parse(readFileSync(metaPath, 'utf8'));
    if (old.sha256 === digest) return { status: 'unchanged', meta: old };
    if (!replace) throw new Error(`“${topic}/${fileName}” already exists with different content. Give the new file a different title, or add --replace to overwrite it.`);
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(path, bytes);
  const meta = {
    id: materialId(topic, fileName),
    topic,
    kind: k,
    title: ttl,
    summary: (summary ?? '').trim() || summaryOf(check.ext, bytes) || `${MATERIAL_KINDS[k]} for this chapter.`,
    lang,
    file: materialId(topic, fileName),
    ext: check.ext,
    bytes: bytes.length,
    sha256: digest,
    ...(check.pages ? { pages: check.pages } : {}),
    ...(check.slides ? { slides: check.slides } : {}),
    source,
    addedAt: now.toISOString().slice(0, 10),
  };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  return { status: 'added', meta };
}

export async function addFromDrive(opts) {
  const { name, bytes } = await fetchDrive(opts.url, { fetchFn: opts.fetchFn });
  return addMaterial({ ...opts, name: opts.fileName ?? name, bytes, source: 'drive' });
}

/** Every sidecar under root, sorted for a stable catalogue. */
function sidecars(root) {
  const out = [];
  const walk = dir => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(META)) out.push(p);
    }
  };
  if (existsSync(root)) walk(root);
  return out.sort();
}

/** Rebuild catalogue.json from the sidecars. Deterministic: same files, same bytes, so a pull request shows only real changes. */
export function buildCatalogue(root) {
  const items = sidecars(root)
    .map(p => JSON.parse(readFileSync(p, 'utf8')))
    .sort((a, b) => TOPIC_LIST.indexOf(a.topic) - TOPIC_LIST.indexOf(b.topic) || a.id.localeCompare(b.id));
  const generatedAt = items.reduce((m, i) => (i.addedAt > m ? i.addedAt : m), '1970-01-01');
  const text = JSON.stringify({ version: 1, generatedAt, items }, null, 2) + '\n';
  return { text, items };
}
export function writeCatalogue(root) {
  mkdirSync(root, { recursive: true });
  const { text, items } = buildCatalogue(root);
  writeFileSync(join(root, 'catalogue.json'), text);
  return items;
}

/** Everything that can be wrong with the materials folder. An empty list means it is publishable. */
export function validateAll(root) {
  const problems = [];
  const { text, items } = buildCatalogue(root);
  const parsed = parseCatalogue({ items }, TOPICS);
  problems.push(...parsed.problems);
  for (const m of items) {
    const path = join(root, m.file);
    if (!existsSync(path)) {
      problems.push(`${m.id}: the file is missing`);
      continue;
    }
    const bytes = readFileSync(path);
    if (sha256(bytes) !== m.sha256) problems.push(`${m.id}: the file does not match its recorded checksum (edited after it was added?)`);
    const c = inspectFile(basename(m.file), bytes);
    if (!c.ok) problems.push(`${m.id}: ${c.reason}`);
  }
  // files without a sidecar would be published unlisted
  const known = new Set(items.map(m => m.file));
  const walk = dir => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (!e.name.endsWith(META) && e.name !== 'catalogue.json' && e.name !== 'README.md' && !known.has(relative(root, p).split('\\').join('/')))
        problems.push(`${relative(root, p)}: file has no ${META} record (add it with the ingest command)`);
    }
  };
  if (existsSync(root)) walk(root);
  const cat = join(root, 'catalogue.json');
  if (!existsSync(cat)) {
    if (items.length) problems.push('catalogue.json is missing: run  node tools/materials/cli.mjs build');
  } else if (readFileSync(cat, 'utf8') !== text) problems.push('catalogue.json is out of date: run  node tools/materials/cli.mjs build');
  return problems;
}

export function removeMaterial(root, id) {
  const path = join(root, id);
  if (!existsSync(path + META)) throw new Error(`No material with id “${id}”. List ids with: node tools/materials/cli.mjs list`);
  rmSync(path);
  rmSync(path + META);
  const dir = dirname(path);
  if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
}

export function coverage(root) {
  const { items } = buildCatalogue(root);
  const missing = topicsWithout(items, TOPIC_LIST);
  return { total: TOPIC_LIST.length, covered: TOPIC_LIST.length - missing.length, missing };
}

const walkFiles = dir => {
  const out = [];
  const go = d => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) go(p);
      else out.push(p);
    }
  };
  if (existsSync(dir)) go(dir);
  return out.sort();
};

/**
 * Process the `incoming/` drop folder: files placed as incoming/<topic>/[KIND/]<file>, and incoming/drive-links.txt with lines
 *   topic | kind(optional) | title(optional) | https://drive.google.com/...
 * Files that were added (or already present) are removed from incoming; failures stay so the teacher can see and fix them.
 * Returns the outcome of every item.
 */
export async function processIncoming({ incoming, root, fetchFn, now, lang = 'en' }) {
  const results = [];
  for (const p of walkFiles(incoming)) {
    const rel = relative(incoming, p).split('\\').join('/');
    if (rel === 'drive-links.txt' || rel === 'README.md' || rel.startsWith('.')) continue;
    const spec = parseIncomingPath(rel);
    if ('error' in spec) {
      results.push({ what: rel, ok: false, message: spec.error });
      continue;
    }
    try {
      const r = addMaterial({ root, topic: spec.topic, kind: spec.kind, name: spec.file, bytes: readFileSync(p), lang, now });
      results.push({ what: rel, ok: true, status: r.status, meta: r.meta });
      rmSync(p);
    } catch (e) {
      results.push({ what: rel, ok: false, message: e.message });
    }
  }
  const linksFile = join(incoming, 'drive-links.txt');
  if (existsSync(linksFile)) {
    const keep = [];
    for (const raw of readFileSync(linksFile, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) {
        keep.push(raw);
        continue;
      }
      const parts = line.split('|').map(s => s.trim());
      const url = parts[parts.length - 1],
        topic = parts[0],
        kind = parts.length >= 3 && parts[1] ? parts[1].toUpperCase().replace(/[- ]/g, '_') : undefined,
        title = parts.length >= 4 ? parts[2] : undefined;
      if (parts.length < 2) {
        results.push({ what: line, ok: false, message: 'Write each line as: topic | kind | title | link  (kind and title may be empty).' });
        keep.push(raw);
        continue;
      }
      try {
        const r = await addFromDrive({ root, topic, kind, title, url, lang, now, fetchFn });
        results.push({ what: `${topic} ← Drive`, ok: true, status: r.status, meta: r.meta });
      } catch (e) {
        results.push({ what: `${topic} ← ${url}`, ok: false, message: e.message });
        keep.push(raw);
      }
    }
    if (keep.every(l => !l.trim() || l.trim().startsWith('#'))) writeFileSync(linksFile, keep.join('\n').replace(/\n+$/, '') + (keep.length ? '\n' : ''));
    else writeFileSync(linksFile, keep.join('\n') + '\n');
  }
  return results;
}

/** Markdown summary of an ingest run, used as the pull request body and printed by the tool. */
export function reportOf(results) {
  const ok = results.filter(r => r.ok),
    bad = results.filter(r => !r.ok);
  const lines = [`## Materials ingest: ${ok.length} added or unchanged, ${bad.length} refused`, ''];
  if (ok.length) {
    lines.push('| Chapter | Kind | Title | File | Status |', '|---|---|---|---|---|');
    for (const r of ok)
      lines.push(
        `| ${r.meta.topic} | ${MATERIAL_KINDS[r.meta.kind]} | ${r.meta.title.replace(/\|/g, '/')} | ${r.meta.ext.toUpperCase()}, ${r.meta.slides ? r.meta.slides + ' slides' : r.meta.pages ? r.meta.pages + ' pages' : r.meta.bytes + ' B'} | ${r.status} |`,
      );
    lines.push('');
  }
  if (bad.length) {
    lines.push('### Refused (left in `incoming/`)', '');
    for (const r of bad) lines.push(`- \`${r.what}\`: ${r.message}`);
    lines.push('');
  }
  lines.push(
    'Reviewer checklist: the material is the uploader’s own or licensed for this use; it stays inside the official CBSE 2026-27 syllabus (no excluded topics); it has no student data; titles and summaries read well.',
  );
  return lines.join('\n');
}

export { FILE_TYPES, MATERIAL_KINDS, MATERIAL_LANGS, extOf, statSync };
