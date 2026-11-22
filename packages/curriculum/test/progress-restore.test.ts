import { describe, expect, it } from 'vitest';
import { mergeAttempts, mergeProfile, mergeSeen, parseExport, restoreSummary, type Attempt, type Export, type Profile, type Seen } from '../src';

const at = (t: number, extra: Partial<Attempt> = {}): Attempt => ({
  t,
  skill: 'dep-wdv',
  clause: 'XI.2.depreciation',
  seed: 7,
  mode: 'PRACTICE',
  marks: 1,
  outOf: 2,
  hintsUsed: 0,
  mistakes: [],
  correctParts: 1,
  parts: 2,
  ...extra,
});
const sn = (t: number, lab = 'dep-lab'): Seen => ({ lab, tab: 'learn', t });
const prof = (name: string, cls: Profile['cls'] = 'XII'): Profile => ({ cls, route: 'OPTION_II_COMPUTERISED', name });

describe('restoring progress from an exported file (hand-worked)', () => {
  it('this device has attempts at times 1 and 3; the file has 2, 3 (the same one) and 4 → 1, 2, 3, 4 in time order; two are new', () => {
    const merged = mergeAttempts([at(1), at(3)], [at(2), at(3), at(4)]);
    expect(merged.map(a => a.t)).toEqual([1, 2, 3, 4]);
  });
  it('importing the same file twice adds nothing the second time', () => {
    const file = [at(5), at(6), at(7)];
    const once = mergeAttempts([], file);
    expect(once).toHaveLength(3);
    expect(mergeAttempts(once, file)).toHaveLength(3);
  });
  it('two genuinely different attempts at the same moment are both kept (different seed or marks)', () => {
    expect(mergeAttempts([at(9, { seed: 1 })], [at(9, { seed: 2 }), at(9, { seed: 1, marks: 2 })])).toHaveLength(3);
  });
  it('a fresh device gets every attempt, in order, even when the file lists them out of order', () => {
    expect(mergeAttempts([], [at(30), at(10), at(20)]).map(a => a.t)).toEqual([10, 20, 30]);
  });
  it('seen records merge the same way and malformed ones are dropped, never stored', () => {
    const bad = [{ lab: 5, t: 1, tab: 'learn' }, { lab: 'x', t: 'now', tab: 'learn' }, { lab: 'x', t: 1, tab: 'other' }, null, 'junk'];
    expect(mergeSeen([sn(1)], [sn(1), sn(2), ...bad]).map(x => x.t)).toEqual([1, 2]);
  });
  it('the profile on this device wins unless it has no name; then the file’s profile is taken', () => {
    expect(mergeProfile(prof('Asha', 'XI'), prof('Ravi'))!.name).toBe('Asha');
    expect(mergeProfile(prof(''), prof('Ravi'))!.name).toBe('Ravi');
    expect(mergeProfile(null, prof('Ravi'))!.name).toBe('Ravi');
    expect(mergeProfile(null, { cls: 'IX', name: 'x' })).toBeNull();
    expect(mergeProfile(prof(''), 'junk')!.name).toBe('');
  });
  it('the summary says what was added and what was already here', () => {
    const file: Export = { app: 'accounting-universe', version: 1, exportedAt: 0, profile: prof('Ravi'), attempts: [at(2), at(3), at(4)], seen: [sn(1), sn(2)] };
    const s = restoreSummary({ attempts: [at(1), at(3)], seen: [sn(1)], profile: null }, file);
    expect(s).toEqual({ attemptsAdded: 2, attemptsAlreadyHere: 1, seenAdded: 1, profileTaken: true });
  });
  it('a file that comes out of exportAll passes parseExport and restores completely on an empty device', () => {
    const file: Export = { app: 'accounting-universe', version: 1, exportedAt: 1, profile: prof('Ravi'), attempts: [at(1), at(2)], seen: [sn(1)] };
    const parsed = parseExport(JSON.parse(JSON.stringify(file)));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(restoreSummary({ attempts: [], seen: [], profile: null }, parsed.value)).toEqual({ attemptsAdded: 2, attemptsAlreadyHere: 0, seenAdded: 1, profileTaken: true });
  });
});
