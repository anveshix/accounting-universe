import { describe, expect, it } from 'vitest';
import { JOURNAL_CASES, parseRupees, sameEntry } from '../src/journal';
import { starterChartClassXI } from '../../engine/src';

/**
 * The Journal Builder shows these cases to students and marks their entries against them, so the bank itself must be
 * proved: every entry balances, every account exists, and no case quietly repeats a line.
 */
describe('the Journal Builder case bank', () => {
  const chart = starterChartClassXI();

  it.each(JOURNAL_CASES.map(c => [c.text, c] as const))('balances: %s', (_text, c) => {
    const dr = c.lines.filter(l => l.side === 'DR').reduce((n, l) => n + l.rupees, 0);
    const cr = c.lines.filter(l => l.side === 'CR').reduce((n, l) => n + l.rupees, 0);
    expect(dr).toBe(cr);
    expect(dr).toBeGreaterThan(0);
    expect(c.lines.length).toBeGreaterThanOrEqual(2);
  });

  it.each(JOURNAL_CASES.map(c => [c.text, c] as const))('uses only real Class XI accounts: %s', (_text, c) => {
    for (const l of c.lines) expect(chart.has(l.account), `${l.account} in “${c.text}”`).toBe(true);
  });

  it('never lists the same account twice on the same side', () => {
    for (const c of JOURNAL_CASES) {
      const keys = c.lines.map(l => `${l.account}|${l.side}`);
      expect(new Set(keys).size, c.text).toBe(keys.length);
    }
  });

  it('includes compound entries, because that is where students get stuck', () => {
    expect(JOURNAL_CASES.filter(c => c.lines.length > 2).length).toBeGreaterThanOrEqual(3);
  });
});

describe('parseRupees', () => {
  it('reads Indian grouping, the ₹ sign and bare digits', () => {
    expect(parseRupees('1,00,000')).toBe(100_000);
    expect(parseRupees('₹5,000')).toBe(5_000);
    expect(parseRupees(' 2500 ')).toBe(2_500);
    expect(parseRupees('0')).toBe(0);
  });
  it('refuses anything that is not a whole rupee amount', () => {
    for (const bad of ['', '12.5', '1,2,3x', '-50', '₹ 1e5']) expect(parseRupees(bad), bad).toBeNull();
  });
});

describe('sameEntry', () => {
  const c = JOURNAL_CASES[1]!; // machinery: 40,000 Dr; 15,000 + 25,000 Cr
  const good = c.lines.map(l => ({ account: l.account, side: l.side, amount: String(l.rupees) }));

  it('accepts the right entry in any order', () => {
    expect(sameEntry(good, c.lines)).toBe(true);
    expect(sameEntry([...good].reverse(), c.lines)).toBe(true);
  });
  it('accepts amounts typed with Indian grouping', () => {
    const pretty = good.map(l => ({ ...l, amount: l.amount === '40000' ? '40,000' : l.amount }));
    expect(sameEntry(pretty, c.lines)).toBe(true);
  });
  it('rejects a wrong amount, a wrong side, a missing line and an extra line', () => {
    expect(
      sameEntry(
        good.map((l, i) => (i === 0 ? { ...l, amount: '4000' } : l)),
        c.lines,
      ),
    ).toBe(false);
    expect(
      sameEntry(
        good.map((l, i) => (i === 1 ? { ...l, side: 'DR' as const } : l)),
        c.lines,
      ),
    ).toBe(false);
    expect(sameEntry(good.slice(0, 2), c.lines)).toBe(false);
    expect(sameEntry([...good, { account: 'rent', side: 'DR' as const, amount: '1' }], c.lines)).toBe(false);
  });
  it('rejects an unparsable amount instead of treating it as zero', () => {
    expect(
      sameEntry(
        good.map((l, i) => (i === 1 ? { ...l, amount: 'abc' } : l)),
        c.lines,
      ),
    ).toBe(false);
  });
});
