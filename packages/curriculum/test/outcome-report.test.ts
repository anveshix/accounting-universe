import { describe, expect, it } from 'vitest';
import { outcomeCsv, outcomeReport, type Attempt } from '../src';
const at = (clause: string, marks: number, skill = 's'): Attempt => ({ t: 1, skill, clause, seed: 1, mode: 'PRACTICE', marks, outOf: 1, hintsUsed: 0, mistakes: [], correctParts: marks, parts: 1 });
const file = (name: string, attempts: Attempt[]) => ({ file: `${name}.json`, data: { app: 'accounting-universe', version: 1, exportedAt: 0, profile: { cls: 'XI', route: 'OPTION_I_ANALYSIS', name }, attempts, seen: [] } });
describe('teacher report by learning outcome', () => {
  // Asha: 2 wrong ledger attempts (struggling); Ravi: 1 right ledger + 1 right equation attempt
  const rows = outcomeReport([file('Asha', [at('XI.2.ledger', 0), at('XI.2.ledger', 0)]), file('Ravi', [at('XI.2.ledger', 1), at('XI.2.equation', 1)]), { file: 'bad.json', data: { x: 1 } }]);
  it('rolls topic attempts up to the outcomes they map to (hand-worked)', () => {
    const ledger = rows.find(r => r.outcome === 'LO-XI.2-09')!;          // posting to the ledger
    expect([ledger.students, ledger.attempts, ledger.accuracy, ledger.struggling]).toEqual([2, 3, 1 / 3, 1]);
    const eq1 = rows.find(r => r.outcome === 'LO-XI.2-01')!;             // accounting equation
    expect([eq1.students, eq1.attempts, eq1.accuracy, eq1.struggling]).toEqual([1, 1, 1, 0]);
  });
  it('lists only outcomes someone practised, and ignores invalid files', () => { expect(rows.map(r => r.outcome).sort()).toEqual(['LO-XI.2-01', 'LO-XI.2-02', 'LO-XI.2-09']); });
  it('exports CSV with the outcome text quoted safely', () => {
    const csv = outcomeCsv(rows); expect(csv.split('\n')[0]).toMatch(/^outcome,unit,topics/); expect(csv).toMatch(/LO-XI\.2-09,XI\.2,XI\.2\.ledger,2,3,33,1,"appreciate that/);
  });
});
