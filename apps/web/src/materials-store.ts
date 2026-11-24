/**
 * Where chapter materials come from in the browser:
 *  - published: apps/web/public/materials/catalogue.json, written by the pipeline (tools/materials) and deployed with the site;
 *  - on this device: files a teacher or student adds in the page. They are kept in this browser's IndexedDB (database "au-materials"),
 *    never uploaded, never part of a progress backup, and can be removed at any time.
 */
import { CLAUSES, FILE_TYPES, fileNameFor, inspectFile, materialId, parseCatalogue, type MaterialKind, type MaterialLang, type MaterialMeta } from '../../../packages/curriculum/src';

export interface Listed extends MaterialMeta {
  readonly device: boolean;
}

const TOPICS: ReadonlySet<string> = new Set(CLAUSES.map(c => c.id));
const base = './materials/';
/** URL of a published file (each path segment encoded, so a chapter id or a file name can never break out of the folder). */
export const publishedUrl = (file: string) => base + file.split('/').map(encodeURIComponent).join('/');

let published: Promise<{ items: Listed[]; problems: string[] }> | null = null;
export function loadPublished(): Promise<{ items: Listed[]; problems: string[] }> {
  published ??= (async () => {
    try {
      const res = await fetch(base + 'catalogue.json', { cache: 'no-cache' });
      if (!res.ok) return { items: [], problems: res.status === 404 ? [] : [`catalogue answered ${res.status}`] };
      const { items, problems } = parseCatalogue(await res.json(), TOPICS);
      return { items: items.map(i => ({ ...i, device: false })), problems };
    } catch {
      return { items: [], problems: [] };
    } // offline with nothing cached: an empty library, not an error page
  })();
  return published;
}

// ── on this device ──
const DB = 'au-materials',
  STORE = 'files';
interface Row {
  id: string;
  meta: MaterialMeta;
  blob: Blob;
}
const mem = new Map<string, Row>();
let dbp: Promise<IDBDatabase | null> | null = null;
function open(): Promise<IDBDatabase | null> {
  dbp ??= new Promise(resolve => {
    try {
      if (typeof indexedDB === 'undefined' || !indexedDB) return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbp;
}
const wrap = <T>(r: IDBRequest<T>) =>
  new Promise<T>((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

async function rows(): Promise<Row[]> {
  const db = await open();
  if (!db) return [...mem.values()];
  try {
    return [...((await wrap(db.transaction(STORE).objectStore(STORE).getAll())) as Row[]), ...mem.values()];
  } catch {
    return [...mem.values()];
  }
}
export async function listDevice(): Promise<Listed[]> {
  return (await rows()).map(r => ({ ...r.meta, device: true }));
}

async function sha256(bytes: Uint8Array): Promise<string> {
  try {
    if (globalThis.crypto?.subtle) return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource))].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    /* insecure context: no checksum available */
  }
  return '0'.repeat(64);
}

export type AddResult = { ok: true; meta: Listed } | { ok: false; reason: string };
/** Check and keep a file on this device. The same rules as the pipeline apply, so a file that works here also works there. */
export async function addDevice(o: { topic: string; kind: MaterialKind; title: string; lang: MaterialLang; file: File }): Promise<AddResult> {
  if (!TOPICS.has(o.topic)) return { ok: false, reason: 'Choose a chapter first.' };
  const bytes = new Uint8Array(await o.file.arrayBuffer());
  const check = inspectFile(o.file.name, bytes);
  if (!check.ok) return check;
  if (!check.type.kinds.includes(o.kind)) return { ok: false, reason: `A .${check.ext} file cannot be filed as that kind. Allowed for .${check.ext}: ${check.type.kinds.join(', ')}.` };
  const title =
    o.title.trim() ||
    o.file.name
      .replace(/\.[A-Za-z0-9]{1,5}$/, '')
      .replace(/_/g, ' ')
      .trim() ||
    'Untitled';
  const name = fileNameFor(o.kind, title, check.ext),
    file = materialId(o.topic, name),
    digest = await sha256(bytes);
  const meta: MaterialMeta = {
    id: file,
    topic: o.topic,
    kind: o.kind,
    title,
    summary: `${FILE_TYPES[check.ext]!.label} file added on this device.`,
    lang: o.lang,
    file,
    ext: check.ext,
    bytes: bytes.length,
    sha256: digest,
    ...(check.pages ? { pages: check.pages } : {}),
    ...(check.slides ? { slides: check.slides } : {}),
    source: 'upload',
    addedAt: new Date().toISOString().slice(0, 10),
  };
  const row: Row = { id: file, meta, blob: new Blob([bytes as BlobPart], { type: check.type.mime }) };
  const db = await open();
  if (db) {
    try {
      await wrap(db.transaction(STORE, 'readwrite').objectStore(STORE).put(row));
    } catch {
      mem.set(file, row);
    }
  } else mem.set(file, row);
  return { ok: true, meta: { ...meta, device: true } };
}
export async function removeDevice(id: string): Promise<void> {
  mem.delete(id);
  const db = await open();
  if (db) {
    try {
      await wrap(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id));
    } catch {
      /* already gone */
    }
  }
}
/** A temporary address for a device file. The caller revokes it (URL.revokeObjectURL) when done. */
export async function deviceUrl(id: string): Promise<string | null> {
  const r = (await rows()).find(x => x.id === id);
  return r ? URL.createObjectURL(r.blob) : null;
}
