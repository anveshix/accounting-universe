import { describe, expect, it } from 'vitest';
import { NAV, hashFor, resolve } from '../../../apps/web/src/routes';

/** The router and header logic as it was BEFORE the route table (kept here as an oracle so the refactor is provably behaviour-preserving). */
const OLD_NAV: { label: string; match: (p: string[]) => boolean }[] = [
  { label: 'Home', match: p => p.length === 0 }, { label: 'Class XI', match: p => p[0] === 'class' && p[1] === 'XI' }, { label: 'Class XII', match: p => p[0] === 'class' && p[1] === 'XII' },
  { label: 'Visual labs', match: p => ['labs', 'lab', 'ledger', 'trainer', 'cas', 'cards', 'project'].includes(p[0] ?? '') },
  { label: 'Practice', match: p => ['practice', 'assignment', 'rescue'].includes(p[0] ?? '') }, { label: 'Notes', match: p => p[0] === 'notes' }, { label: 'Help', match: p => p[0] === 'tutor' },   // was 'AI tutor' until Phase 1: the page is an offline helper, not an AI
  { label: 'My progress', match: p => p[0] === 'progress' }, { label: 'Teacher dashboard', match: p => p[0] === 'teacher' },
];
const oldNav = (p: string[]) => OLD_NAV.find(n => n.match(p))?.label ?? null;
const oldPage = (p: string[]) => {
  if (p.length === 0) return 'home'; if (p[0] === 'class' && (p[1] === 'XI' || p[1] === 'XII')) return 'class'; if (p[0] === 'labs') return 'labs'; if (p[0] === 'lab' && p[1]) return 'lab';
  if (p[0] === 'ledger') return 'ledger'; if (p[0] === 'practice') return 'practice'; if (p[0] === 'cards') return 'cards'; if (p[0] === 'trainer') return 'trainer'; if (p[0] === 'cas') return 'cas';
  if (p[0] === 'project') return 'project'; if (p[0] === 'rescue') return 'rescue'; if (p[0] === 'assignment' && p[1]) return 'assignment'; if (p[0] === 'tutor') return 'tutor';
  if (p[0] === 'progress') return 'progress'; if (p[0] === 'teacher') return 'teacher'; return 'notfound';
};
const PATHS: string[][] = [[], ['class', 'XI'], ['class', 'XII'], ['class', 'X'], ['class'], ['labs'], ['lab'], ['lab', 'xi-brs'], ['lab', 'nope'], ['ledger'], ['practice'], ['practice', 'dep-wdv', '5', 'board'], ['cards'], ['cards', 'gst'], ['cards', 'zzz'],
  ['trainer'], ['cas'], ['project'], ['project', 'XII'], ['rescue'], ['rescue', 'XI.2.brs'], ['assignment'], ['assignment', 'A1-2'], ['tutor'], ['progress'], ['teacher'], ['nonsense'], ['teacher', 'extra'], ['', 'x']];

describe('route table', () => {
  it('agrees with the previous router and header highlighting on every path', () => {
    for (const p of PATHS) { const r = resolve(p); expect(r.id, JSON.stringify(p)).toBe(oldPage(p)); expect(r.nav, `nav ${JSON.stringify(p)}`).toBe(oldNav(p)); }
  });
  it('the header lists the same nine items in the same order, each linking to a route that resolves to it', () => {
    expect(NAV.map(n => n.key)).toEqual(OLD_NAV.map(n => n.label));
    for (const n of NAV) expect(resolve(n.hash.replace(/^#\/?/, '').split('/').filter(Boolean)).nav, n.key).toBe(n.key);
  });
  it('pages added after the refactor resolve too', () => { expect(resolve(['crisis'])).toEqual({ id: 'crisis', nav: 'Visual labs', rest: [] }); expect(resolve(['crisis', '42']).rest).toEqual(['42']); });
  it('the practice paper resolves under Practice and rejects malformed addresses', () => {
    expect(resolve(['paper'])).toEqual({ id: 'paper', nav: 'Practice', rest: [] });
    expect(resolve(['paper', 'XII', 'I', '5']).id).toBe('paper');
    expect(resolve(['paper', 'XI', '5']).id).toBe('paper');
    for (const bad of [['XIII', '1'], ['XII', 'III', '1'], ['XII', 'I', 'x'], ['XI']]) expect(resolve(['paper', ...bad]).id).toBe('notfound');
  });
  it('the study guide resolves for a class and for a topic, highlights its own class, and rejects malformed addresses', () => {
    expect(resolve(['study'])).toEqual({ id: 'study', nav: 'Class XI', rest: [] });
    expect(resolve(['study', 'XI'])).toEqual({ id: 'study', nav: 'Class XI', rest: ['XI'] });
    expect(resolve(['study', 'XII'])).toEqual({ id: 'study', nav: 'Class XII', rest: ['XII'] });
    expect(resolve(['study', 'XII.1.admission'])).toEqual({ id: 'study', nav: 'Class XII', rest: ['XII.1.admission'] });
    expect(resolve(['study', 'XI.2.journal']).nav).toBe('Class XI');
    for (const bad of [['study', 'foo'], ['study', 'XI', 'x'], ['study', 'XIII.1'], ['study', 'XI.2.a.b.c']]) expect(resolve(bad).id, JSON.stringify(bad)).toBe('notfound');
  });
  it('passes the rest of the path to the page', () => { expect(resolve(['practice', 'dep-wdv', '7', 'board']).rest).toEqual(['dep-wdv', '7', 'board']); });
  it('hashFor encodes segments', () => { expect(hashFor('rescue', 'XI.2.brs')).toBe('#/rescue/XI.2.brs'); expect(hashFor('lab', 'a b')).toBe('#/lab/a%20b'); });
});
