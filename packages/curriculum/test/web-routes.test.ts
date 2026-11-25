import { describe, expect, it } from 'vitest';
import { NAV, hashFor, resolve } from '../../../apps/web/src/routes';

/** The grouping of every route under the six header items (Home, Learn, Explore, Challenge, My progress, Classroom TLM), written out independently of routes.ts as an oracle. Page ids are unchanged from the original router. */
const OLD_NAV: { label: string; match: (p: string[]) => boolean }[] = [
  { label: 'Home', match: p => p.length === 0 },
  { label: 'Learn', match: p => ['class', 'study', 'notes', 'materials', 'tutor', 'about'].includes(p[0] ?? '') && !(p[0] === 'class' && p[1] !== 'XI' && p[1] !== 'XII') },
  { label: 'Explore', match: p => ['labs', 'lab', 'sims', 'sim', 'sim-lab', 'ledger', 'build', 'trainer', 'cas', 'cards', 'project'].includes(p[0] ?? '') },
  { label: 'Challenge', match: p => ['practice', 'paper', 'crisis', 'rescue', 'assignment', 'detective'].includes(p[0] ?? '') },
  { label: 'My progress', match: p => p[0] === 'progress' },
  { label: 'Classroom TLM', match: p => p[0] === 'teacher' || p[0] === 'tlm' },
];
const oldNav = (p: string[]) => OLD_NAV.find(n => n.match(p))?.label ?? null;
const oldPage = (p: string[]) => {
  if (p.length === 0) return 'home';
  if (p[0] === 'class' && (p[1] === 'XI' || p[1] === 'XII')) return 'class';
  if (p[0] === 'labs') return 'labs';
  if (p[0] === 'lab' && p[1]) return 'lab';
  if (p[0] === 'ledger') return 'ledger';
  if (p[0] === 'practice') return 'practice';
  if (p[0] === 'cards') return 'cards';
  if (p[0] === 'trainer') return 'trainer';
  if (p[0] === 'cas') return 'cas';
  if (p[0] === 'project') return 'project';
  if (p[0] === 'rescue') return 'rescue';
  if (p[0] === 'assignment' && p[1]) return 'assignment';
  if (p[0] === 'tutor') return 'tutor';
  if (p[0] === 'progress') return 'progress';
  if (p[0] === 'teacher') return 'teacher';
  return 'notfound';
};
const PATHS: string[][] = [
  [],
  ['class', 'XI'],
  ['class', 'XII'],
  ['class', 'X'],
  ['class'],
  ['labs'],
  ['lab'],
  ['lab', 'xi-brs'],
  ['lab', 'nope'],
  ['ledger'],
  ['practice'],
  ['practice', 'dep-wdv', '5', 'board'],
  ['cards'],
  ['cards', 'gst'],
  ['cards', 'zzz'],
  ['trainer'],
  ['cas'],
  ['project'],
  ['project', 'XII'],
  ['rescue'],
  ['rescue', 'XI.2.brs'],
  ['assignment'],
  ['assignment', 'A1-2'],
  ['tutor'],
  ['progress'],
  ['teacher'],
  ['nonsense'],
  ['teacher', 'extra'],
  ['', 'x'],
];

describe('route table', () => {
  it('agrees with the previous router and header highlighting on every path', () => {
    for (const p of PATHS) {
      const r = resolve(p);
      expect(r.id, JSON.stringify(p)).toBe(oldPage(p));
      expect(r.nav, `nav ${JSON.stringify(p)}`).toBe(oldNav(p));
    }
  });
  it('the header lists the six items in order, each linking to a route that resolves to it', () => {
    expect(NAV.map(n => n.key)).toEqual(OLD_NAV.map(n => n.label));
    for (const n of NAV) expect(resolve(n.hash.replace(/^#\/?/, '').split('/').filter(Boolean)).nav, n.key).toBe(n.key);
  });
  it('pages added after the refactor resolve too', () => {
    expect(resolve(['crisis'])).toEqual({ id: 'crisis', nav: 'Challenge', rest: [] });
    expect(resolve(['crisis', '42']).rest).toEqual(['42']);
  });
  it('the Journal Builder resolves under Explore and takes no extra segments', () => {
    expect(resolve(['build'])).toEqual({ id: 'build', nav: 'Explore', rest: [] });
    expect(resolve(['build', 'x']).id).toBe('notfound');
  });
  it('the chapter-wise simulators resolve under Explore: a gallery and one page per simulator', () => {
    expect(resolve(['sims'])).toEqual({ id: 'sims', nav: 'Explore', rest: [] });
    expect(resolve(['sim', 'sim-brs'])).toEqual({ id: 'sim', nav: 'Explore', rest: ['sim-brs'] });
    expect(resolve(['sim-lab', 'equation-lab'])).toEqual({ id: 'sim-lab', nav: 'Explore', rest: ['equation-lab'] });
    for (const bad of [['sims', 'x'], ['sim'], ['sim-lab'], ['sim-lab', 'a', 'b']]) expect(resolve(bad).id, JSON.stringify(bad)).toBe('notfound');
  });
  it('the about page resolves under Learn and takes no extra segments', () => {
    expect(resolve(['about'])).toEqual({ id: 'about', nav: 'Learn', rest: [] });
    expect(resolve(['about', 'x']).id).toBe('notfound');
  });
  it('the practice paper resolves under Challenge and rejects malformed addresses', () => {
    expect(resolve(['paper'])).toEqual({ id: 'paper', nav: 'Challenge', rest: [] });
    expect(resolve(['paper', 'XII', 'I', '5']).id).toBe('paper');
    expect(resolve(['paper', 'XI', '5']).id).toBe('paper');
    for (const bad of [['XIII', '1'], ['XII', 'III', '1'], ['XII', 'I', 'x'], ['XI']]) expect(resolve(['paper', ...bad]).id).toBe('notfound');
  });
  it('the study guide resolves for a class and for a topic, highlights Learn, and rejects malformed addresses', () => {
    expect(resolve(['study'])).toEqual({ id: 'study', nav: 'Learn', rest: [] });
    expect(resolve(['study', 'XI'])).toEqual({ id: 'study', nav: 'Learn', rest: ['XI'] });
    expect(resolve(['study', 'XII'])).toEqual({ id: 'study', nav: 'Learn', rest: ['XII'] });
    expect(resolve(['study', 'XII.1.admission'])).toEqual({ id: 'study', nav: 'Learn', rest: ['XII.1.admission'] });
    expect(resolve(['study', 'XI.2.journal']).nav).toBe('Learn');
    for (const bad of [
      ['study', 'foo'],
      ['study', 'XI', 'x'],
      ['study', 'XIII.1'],
      ['study', 'XI.2.a.b.c'],
    ])
      expect(resolve(bad).id, JSON.stringify(bad)).toBe('notfound');
  });
  it('Classroom TLM and Error Detective resolve, take at most one segment, and sit under their nav items', () => {
    expect(resolve(['tlm'])).toEqual({ id: 'tlm', nav: 'Classroom TLM', rest: [] });
    expect(resolve(['tlm', 'XI.2.journal-s7-play']).id).toBe('tlm');
    expect(resolve(['tlm', 'a', 'b']).id).toBe('notfound');
    expect(resolve(['teacher']).nav).toBe('Classroom TLM');
    expect(resolve(['detective', '12'])).toEqual({ id: 'detective', nav: 'Challenge', rest: ['12'] });
    expect(resolve(['detective', 'a', 'b']).id).toBe('notfound');
  });
  it('every pre-existing URL still resolves to the page it did before the navigation regrouping', () => {
    for (const p of PATHS) expect(resolve(p).id, JSON.stringify(p)).toBe(oldPage(p));
  });
  it('passes the rest of the path to the page', () => {
    expect(resolve(['practice', 'dep-wdv', '7', 'board']).rest).toEqual(['dep-wdv', '7', 'board']);
  });
  it('hashFor encodes segments', () => {
    expect(hashFor('rescue', 'XI.2.brs')).toBe('#/rescue/XI.2.brs');
    expect(hashFor('lab', 'a b')).toBe('#/lab/a%20b');
  });
});
