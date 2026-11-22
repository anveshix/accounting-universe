/**
 * Local-first persistence. Progress lives in IndexedDB on the student's device; if IndexedDB is unavailable (private
 * mode, blocked storage) we fall back to memory so the app still works — and say so in the UI via `storageMode`.
 * Nothing here ever leaves the device.
 */
import { Machine } from '../../../packages/engine/src';
import { STORAGE, type Attempt, type Export, type Profile, type Seen } from '../../../packages/curriculum/src';
import { register } from './machine-dom';
export type { Attempt, Export, Profile, Seen };

export type StorageMode = 'indexeddb' | 'memory';
export let storageMode: StorageMode = 'memory';
/** Where progress lives right now (see the `storage` machine in docs/STATE_MACHINES.md). The shell shows a banner when it is MEMORY or DEGRADED. */
export const storage = new Machine(STORAGE);
register(storage);
storage.subscribe(m => { storageMode = m.is('INDEXEDDB') ? 'indexeddb' : 'memory'; });

const DB = 'accounting-universe', VER = 2;
const STORES = ['attempts', 'seen', 'profile', 'assignments', 'projects'];
let dbp: Promise<IDBDatabase | null> | null = null;
const mem: Record<string, unknown[]> = { attempts: [], seen: [], profile: [], assignments: [], projects: [] };

function open(): Promise<IDBDatabase | null> {
  if (dbp) return dbp;
  dbp = new Promise(resolve => {
    let settled = false;
    const done = (db: IDBDatabase | null) => { if (settled) return; settled = true; storage.send(db ? 'OPENED' : 'UNAVAILABLE'); resolve(db); };
    try {
      if (typeof indexedDB === 'undefined' || !indexedDB) return done(null);
      const req = indexedDB.open(DB, VER);
      req.onupgradeneeded = () => { const d = req.result; for (const s of STORES) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { autoIncrement: true }); };
      req.onsuccess = () => done(req.result);
      req.onerror = () => done(null);
      req.onblocked = () => done(null);
    } catch { done(null); }
  });
  return dbp;
}
const wrap = <T>(r: IDBRequest<T>) => new Promise<T>((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

async function add(store: string, v: unknown): Promise<void> {
  pending(1);                                     // <html data-saving="1"> while any write is still in flight (see replaceAll below)
  try {
    const db = await open();
    if (!db) { mem[store]!.push(v); return; }
    try { await wrap(db.transaction(store, 'readwrite').objectStore(store).add(v)); } catch { storage.send('WRITE_FAILED'); mem[store]!.push(v); }
  } finally { pending(-1); }
}
async function all<T>(store: string): Promise<T[]> {
  const db = await open();
  if (!db) return [...(mem[store] as T[])];
  try { return [...(await wrap(db.transaction(store).objectStore(store).getAll()) as T[]), ...(mem[store] as T[])]; } catch { return [...(mem[store] as T[])]; }
}
async function clearStore(store: string) {
  mem[store]!.length = 0;
  const db = await open();
  if (db) { try { await wrap(db.transaction(store, 'readwrite').objectStore(store).clear()); } catch { /* ignore */ } }
}

// ── replacing saves (profile, projects) ──
// These used to be "read everything, clear the store, add the records back" as separate steps. Two quick saves could interleave and leave the OLDER
// state on disk, and a reload between "clear" and "add" lost the data. Now each save is ONE IndexedDB transaction (all or nothing) and saves to the
// same store run strictly one after another. <html data-saving="0|1"> tells tests (and anyone curious) when nothing is waiting to be written.
let writing = 0;                                 // writes in flight (appends and replacing saves)
const queues: Record<string, Promise<unknown>> = {};
function pending(delta: number) { writing += delta; showSaving(); }
const showSaving = () => { if (typeof document !== 'undefined') document.documentElement.setAttribute('data-saving', writing > 0 ? '1' : '0'); };
showSaving();
function serial<T>(store: string, job: () => Promise<T>): Promise<T> {
  writing++; showSaving();
  const run = (queues[store] ?? Promise.resolve()).then(job, job);
  queues[store] = run.then(() => undefined, () => undefined).finally(() => { writing--; showSaving(); });
  return run;
}
function replaceAll<T>(store: string, next: (current: T[]) => T[]): Promise<void> {
  return serial(store, async () => {
    const db = await open();
    const inMemory = () => { const items = next(mem[store] as T[]); mem[store]!.splice(0, mem[store]!.length, ...items); };
    if (!db) { inMemory(); return; }
    try {
      await new Promise<void>((res, rej) => {
        const tx = db.transaction(store, 'readwrite'), os = tx.objectStore(store), got = os.getAll();
        got.onsuccess = () => { const items = next([...(got.result as T[]), ...(mem[store] as T[])]); os.clear(); for (const it of items) os.add(it); };
        tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
      });
      mem[store]!.length = 0;          // anything parked in memory by an earlier failed write is now on disk
    } catch { storage.send('WRITE_FAILED'); inMemory(); }
  });
}

export const recordAttempt = async (a: Attempt) => {
  const before = { attempts: await all<Attempt>('attempts'), seen: await all<Seen>('seen') };
  await add('attempts', a);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('au:attempt', { detail: { before, a } }));   // the rewards UI listens; the store stays ignorant of it
};
export const recordSeen = (s: Seen) => add('seen', s);
export const attempts = () => all<Attempt>('attempts');
export const seen = () => all<Seen>('seen');
export async function getProfile(): Promise<Profile | null> { const p = await all<Profile>('profile'); return p.length ? p[p.length - 1]! : null; }
export const setProfile = (p: Profile) => replaceAll<Profile>('profile', () => [p]);
export async function resetAll() { for (const s of STORES) await clearStore(s); }

// Assignments handed over by a teacher (files), and the student's own project notes. Both stay on this device.
export const saveAssignment = async (a: unknown & { id: string }) => { const cur = await assignmentsAll(); if (cur.some(x => x.id === a.id)) return false; await add('assignments', a); return true; };
export const assignmentsAll = () => all<{ id: string }>('assignments');
export async function getProject(key: string): Promise<Record<string, unknown> | null> { const p = await all<{ key: string; data: Record<string, unknown> }>('projects'); const hit = [...p].reverse().find(x => x.key === key); return hit ? hit.data : null; }
export const setProject = (key: string, data: Record<string, unknown>) => replaceAll<{ key: string; data: Record<string, unknown> }>('projects', cur => [...cur.filter(x => x.key !== key), { key, data }]);
export const ready = async () => { await open(); return storageMode; };

export async function exportAll(): Promise<Export> { return { app: 'accounting-universe', version: 1, exportedAt: Date.now(), profile: await getProfile(), attempts: await attempts(), seen: await seen() }; }
