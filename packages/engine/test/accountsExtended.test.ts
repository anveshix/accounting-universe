import { describe, expect, it } from 'vitest';
import { chartWithParties, extendedChartClassXI, personNames, starterChartClassXI } from '../src';

describe('extended charts', () => {
  it('keeps every starter account with the same id, name and type', () => {
    const big = extendedChartClassXI();
    for (const a of starterChartClassXI().list()) expect(big.get(a.id)).toEqual(a);
  });
  it('has well over 100 everyday accounts and no duplicate names', () => {
    const l = extendedChartClassXI().list(); expect(l.length).toBeGreaterThan(130);
    expect(new Set(l.map(a => a.name.toLowerCase())).size).toBe(l.length);
  });
  it('500 parties give 1000 personal accounts: 500 debtors (assets) and 500 creditors (liabilities)', () => {
    const l = chartWithParties(500).list(), base = extendedChartClassXI().list().length;
    expect(l.length).toBe(base + 1000);
    expect(l.filter(a => a.name.endsWith('(Debtor)') && a.type === 'ASSET')).toHaveLength(500);
    expect(l.filter(a => a.name.endsWith('(Creditor)') && a.type === 'LIABILITY')).toHaveLength(500);
  });
  it('person names are distinct and reproducible', () => { const a = personNames(1000); expect(new Set(a).size).toBe(1000); expect(personNames(1000)).toEqual(a); });
});
