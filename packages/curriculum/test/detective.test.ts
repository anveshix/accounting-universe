import { describe, expect, it } from 'vitest';
import { Money } from '../../engine/src';
import { DETECTIVE_TEMPLATE_COUNT, buildCase, detectiveAccountChoices } from '../src/detective';

describe('Error Detective', () => {
  it('hand-worked: rent debited to Salary is an error of commission; correct by Dr Rent, Cr Salary; trial balance agrees', () => {
    const c = [...Array(200).keys()].map(s => buildCase(s + 1)).find(x => x.id === 'rent-as-salary')!;
    expect(c.cls).toBe('COMMISSION');
    expect(c.affectsTb).toBe(false);
    expect(c.rectification).toMatchObject({ dr: 'Rent', cr: 'Salary', usesSuspense: false });
  });
  it('hand-worked: partial omission (Cr Sales only) is fixed by Dr Cash, Cr Suspense', () => {
    const c = [...Array(200).keys()].map(s => buildCase(s + 1)).find(x => x.id === 'cash-side-missed')!;
    // wrong: Cr Sales only. right: Dr Cash, Cr Sales. Fix = Dr Cash; Suspense A/c is credited to absorb the one-sided debit
    expect(c.affectsTb).toBe(true);
    expect(c.rectification).toMatchObject({ dr: 'Cash', cr: 'Suspense A/c', usesSuspense: true });
  });
  it('hand-worked: Rent Dr 6,000 / Cash Cr 5,500 is fixed by Dr Suspense, Cr Cash 500', () => {
    const c = [...Array(2000).keys()].map(s => buildCase(s + 1)).find(x => x.id === 'rent-short-credit')!;
    expect(c.rectification!.dr).toBe('Suspense A/c');
    expect(c.rectification!.cr).toBe('Cash');
    expect([500n, 1000n].map(n => Money.rupees(n).paise)).toContain(c.rectification!.amount.paise);
  });
  it('every template appears across seeds; every rectifying account is selectable; trial-balance effect matches suspense use', () => {
    const seen = new Set<string>(),
      choices = new Set(detectiveAccountChoices());
    for (let s = 1; s <= 3000; s++) {
      const c = buildCase(s);
      seen.add(c.id);
      if (c.rectification) {
        expect(choices.has(c.rectification.dr) && choices.has(c.rectification.cr), c.id).toBe(true);
        expect(c.rectification.usesSuspense, c.id).toBe(c.affectsTb);
        expect(c.rectification.amount.isPositive()).toBe(true);
      } else expect(c.cls).toBe('COMPENSATING');
    }
    expect(seen.size).toBe(DETECTIVE_TEMPLATE_COUNT);
  });
  it('is deterministic per seed', () => {
    expect(buildCase(42)).toEqual(buildCase(42));
  });
});
