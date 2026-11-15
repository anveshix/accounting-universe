import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { outcomesOf } from '../src';

const V1 = ['XI.2.equation', 'XI.2.rules', 'XI.2.journal', 'XI.2.ledger', 'XI.2.tb'];
const file = (c: string) => new URL(`../../../docs/academic-review/${c}.md`, import.meta.url);
describe('academic review records (T0.8)', () => {
  it('every V1 clause has a review file listing exactly the outcomes mapped in outcomes.ts', () => {
    for (const c of V1) {
      expect(existsSync(file(c)), c).toBe(true);
      const listed = [...readFileSync(file(c), 'utf8').matchAll(/^- (LO-[\w.]+-\d\d)/gm)].map(m => m[1]).sort();
      expect(listed, c).toEqual(outcomesOf(c).map(o => o.id).sort());
    }
  });
  it('no file claims a signature that has not happened (D11 pending)', () => {
    for (const c of V1) { const t = readFileSync(file(c), 'utf8'); expect(t, c).toMatch(/Status: \*\*UNSIGNED\*\*/); expect(t, c).not.toMatch(/- \[x\]/i); }
  });
});
