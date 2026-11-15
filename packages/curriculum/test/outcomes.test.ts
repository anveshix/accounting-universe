import { describe, expect, it } from 'vitest';
import { CLAUSES, CLAUSES_WITHOUT_OFFICIAL_OUTCOME, OUTCOMES, OUTCOMES_PER_UNIT, SOURCE, UNITS, outcomesOf } from '../src';

describe('learning outcomes (official PDF, verbatim)', () => {
  it('match the per-unit counts printed in the PDF', () => {
    const got: Record<string, number> = {}; for (const o of OUTCOMES) got[o.unit] = (got[o.unit] ?? 0) + 1;
    expect(got).toEqual(OUTCOMES_PER_UNIT); expect(OUTCOMES.length).toBe(77);
  });
  it('have unique ids in the LO-<unit>-NN format, cite the pinned PDF, and contain no column bleed', () => {
    expect(new Set(OUTCOMES.map(o => o.id)).size).toBe(OUTCOMES.length);
    for (const o of OUTCOMES) {
      expect(o.id).toMatch(/^LO-X(I|II)\.\d-\d\d$/); expect(o.source).toBe(SOURCE.sha256);
      expect(o.text, o.id).toMatch(/[.a-z]$/);                  // verbatim: LO-XII.1-07 has no full stop in the PDF
      expect(o.text.length, o.id).toBeLessThan(400);
      expect(o.text, o.id).not.toMatch(/ ce$|capital t accounts| n it |Paper Design|NCERT Publication/);
    }
  });
  it('map only to existing topics of their own unit', () => {
    const ids = new Set(CLAUSES.map(c => c.id));
    for (const o of OUTCOMES) for (const c of o.clauses) { expect(ids.has(c), `${o.id} → ${c}`).toBe(true); expect(c.startsWith(o.unit + '.'), `${o.id} → ${c}`).toBe(true); }
  });
  it('every topic of a unit that has outcomes is covered — except the documented ones the PDF gives no outcome for', () => {
    const withLo = new Set(OUTCOMES.map(o => o.unit));
    const uncovered = CLAUSES.filter(c => withLo.has(c.unit) && outcomesOf(c.id).length === 0).map(c => c.id);
    expect(uncovered).toEqual([...CLAUSES_WITHOUT_OFFICIAL_OUTCOME]);
  });
  it('the units without an outcome block are exactly Option II and the projects', () => {
    expect(UNITS.filter(u => !OUTCOMES.some(o => o.unit === u.id)).map(u => u.id)).toEqual(['XI.P', 'XII.C', 'XII.P']);
  });
  it('the Class XI core (V1) topics each have at least one outcome', () => {
    for (const c of ['XI.2.equation', 'XI.2.rules', 'XI.2.journal', 'XI.2.ledger', 'XI.2.tb']) expect(outcomesOf(c).length, c).toBeGreaterThan(0);
  });
});
