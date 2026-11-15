import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { LEGACY_V1 } from '../src/banks/legacy-v1';
import { classify } from '../src/banks/accounts-xi';
import { parseImpact, verifiedBanks, verifyAll, verifyM1, verifyM2, verifyM4, verifyM5, verifyTb, whyCoverage } from '../src/banks/verify';

describe('legacy Class XI banks (read-only extraction from index.html)', () => {
  it('were extracted from the current legacy file (re-run tools/extract-legacy-banks.mjs if this fails)', () => {
    const sha = createHash('sha256').update(readFileSync(new URL('../../../index.html', import.meta.url))).digest('hex');
    expect(LEGACY_V1.source.sha256).toBe(sha);
  });
  it('contain the expected number of items', () => {
    expect([LEGACY_V1.m1.length, LEGACY_V1.m2.length, LEGACY_V1.m4.length, LEGACY_V1.m5.length, LEGACY_V1.tbItems.length + LEGACY_V1.tbPool.length + LEGACY_V1.bal.length]).toEqual([50, 69, 49, 25, 80]);
  });
  it('every account name used is classified independently (except the three context-dependent distractors)', () => {
    const names = new Set([...LEGACY_V1.m1.flatMap(x => Object.keys(x.effectPer1000)), ...LEGACY_V1.m2.flatMap(s => s.pool.map(p => p.account)), ...LEGACY_V1.m4.flatMap(s => s.pool), ...LEGACY_V1.tbItems.map(x => x.account)]);
    expect([...names].filter(n => !classify(n) && !['Commission', 'Interest', 'Tax Expense'].includes(n))).toEqual([]);
  });
});

describe('engine re-verification', () => {
  it('finds NO error in any legacy item, and exactly these items need a reviewer', () => {
    const all = verifyAll();
    expect(all.filter(x => x.level === 'error')).toEqual([]);
    expect(all.filter(x => x.level === 'review').map(x => `${x.bank}#${x.index}`)).toEqual(['m2#5', 'm2#21', 'm2#22', 'm2#61', 'm2#62']);
  });
  it('rule-checks a large share of the written explanations', () => { expect(whyCoverage()).toBeGreaterThanOrEqual(120); });
  it('the verified banks keep every item without an error', () => {
    const v = verifiedBanks(); expect([v.m1.length, v.m2.length, v.m4.length, v.m5.length]).toEqual([50, 69, 49, 25]);
  });
});

describe('the checks can fail (each corruption must be caught)', () => {
  it('m1: an effect that breaks A = L + C', () => {
    const bad = [{ ...LEGACY_V1.m1[0]!, effectPer1000: { Cash: 1000, Capital: 900 } }];
    expect(verifyM1(bad).some(x => x.level === 'error' && /A 1000 ≠/.test(x.message))).toBe(true);
  });
  it('m1: a description arrow that contradicts the effect', () => {
    expect(verifyM1([{ ...LEGACY_V1.m1[0]!, desc: 'Cash ↓, Capital ↑' }]).some(x => /description says Cash ↓/.test(x.message))).toBe(true);
  });
  it('m2: debit and credit swapped', () => {
    const s = LEGACY_V1.m2[0]!; expect(verifyM2([{ ...s, debit: s.credit, credit: s.debit }]).some(x => x.level === 'error')).toBe(true);
  });
  it('m4: an explanation that states the wrong side', () => {
    const s = LEGACY_V1.m4[0]!; expect(verifyM4([{ ...s, why: 'Cash (Asset) ↑ → Credit.' }]).some(x => /says CR/.test(x.message))).toBe(true);
  });
  it('m4: an unknown account', () => {
    const s = LEGACY_V1.m4[0]!; expect(verifyM4([{ ...s, debit: ['Magic Beans'], pool: [...s.pool, 'Magic Beans'] }]).some(x => /unknown account/.test(x.message))).toBe(true);
  });
  it('m5: the wrong option marked as the answer', () => {
    expect(verifyM5([{ ...LEGACY_V1.m5[0]!, answer: 1 }, ...LEGACY_V1.m5.slice(1)]).some(x => x.index === 0 && /independent answer is option 1/.test(x.message))).toBe(true);
  });
  it('trial balance: an account on the wrong side', () => { expect(verifyTb([{ account: 'Creditors', side: 'dr' }])).toHaveLength(1); });
  it('impact parser reads the option formats used', () => {
    expect(parseImpact('Assets ↑, Liabilities ↑')).toEqual(['+', '+', '0']); expect(parseImpact('Assets ↑ and ↓ (No net change)')).toEqual(['±', '0', '0']);
    expect(parseImpact('No net change')).toEqual(['0', '0', '0']); expect(parseImpact('Liabilities ↓, Capital ↑')).toEqual(['0', '-', '+']); expect(parseImpact('banana')).toBeNull();
  });
});
