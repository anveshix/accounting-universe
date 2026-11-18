import { describe, expect, it } from 'vitest';
import { NOTES, audienceOf, canOpen, counts, filterNotes, makeCode, redeemCode } from '../src';

describe('notes freemium rules', () => {
  it('free opens for everyone, pro only on the Pro plan', () => {
    const free = NOTES.find(n => n.tier === 'FREE')!, pro = NOTES.find(n => n.tier === 'PRO')!;
    expect(canOpen(free, 'FREE').ok).toBe(true);
    const g = canOpen(pro, 'FREE'); expect(g.ok).toBe(false); if (!g.ok) expect(g.reason).toContain(pro.title);
    expect(canOpen(pro, 'PRO').ok).toBe(true);
  });
  it('catalogue is consistent: unique ids, some free, most locked, teacher kinds map to TEACHER', () => {
    expect(new Set(NOTES.map(n => n.id)).size).toBe(NOTES.length);
    const c = counts(NOTES); expect(c.free).toBeGreaterThan(0); expect(c.pro).toBeGreaterThan(c.free);
    expect(audienceOf('PPT')).toBe('TEACHER'); expect(audienceOf('LESSON_PLAN')).toBe('TEACHER'); expect(audienceOf('NOTES')).toBe('STUDENT');
    for (const s of ['ACT', 'BST', 'ETP'] as const) for (const k of ['XI', 'XII'] as const) expect(NOTES.some(n => n.subject === s && n.cls === k)).toBe(true);
  });
  it('filters by class, subject, audience and text', () => {
    expect(filterNotes(NOTES, { cls: 'XII', subject: 'BST' }).every(n => n.cls === 'XII' && n.subject === 'BST')).toBe(true);
    expect(filterNotes(NOTES, { audience: 'TEACHER' }).every(n => n.kind === 'PPT' || n.kind === 'LESSON_PLAN')).toBe(true);
    expect(filterNotes(NOTES, { q: 'depreciation' }).length).toBeGreaterThan(0);
    expect(filterNotes(NOTES, { q: 'zzzz' })).toEqual([]);
  });
  it('access codes: hand-computed check character (LEARN2X: 573 mod 36 = 33 -> X)', () => {
    expect(makeCode('LEARN2X')).toBe('AU-LEAR-N2XX');
    expect(redeemCode(' au-lear-n2xx ').ok).toBe(true);
    expect(redeemCode('AU-LEAR-N2X4').ok).toBe(false);
    expect(redeemCode('hello').ok).toBe(false);
  });
});
