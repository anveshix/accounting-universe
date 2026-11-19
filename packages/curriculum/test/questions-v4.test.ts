import { describe, expect, it } from 'vitest';
import { SKILLS, makeQuestion } from '../src';

// Independent oracles: figures worked by hand from the stem, never read from the generator's own answer.
const clean = (s: string) => s.replace(/[₹,]/g, '');
const val = (stem: string, re: RegExp) => Number(re.exec(clean(stem))![1]);
const ans = (skill: string, seed: number) => makeQuestion(skill, seed).parts.map(p => Number(p.answer));

describe('V4 full problems agree with hand-worked arithmetic', () => {
  it('petty-cash: balance = imprest − total expenses; reimbursement = total expenses', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const q = makeQuestion('petty-cash', seed), t = clean(q.stem), imp = val(q.stem, /imprest of the petty cashier is (\d+)/);
      const spent = ['stationery', 'postage', 'conveyance', 'refreshments', 'sundry expenses'].map(k => Number(new RegExp(`${k} (\\d+)`).exec(t)![1]));
      const total = spent.reduce((a, b) => a + b, 0), a = ans('petty-cash', seed);
      expect(a).toEqual([total, imp - total, total]); expect(imp - total).toBeGreaterThan(0);
    }
  });
  it('brs-overdraft: step 1 = overdraft + charges + interest; step 2 = step 1 − unpresented + uncollected (hand-worked 50,000 → 51,500 → 46,500)', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const q = makeQuestion('brs-overdraft', seed), t = clean(q.stem), g = (re: RegExp) => Number(re.exec(t)![1]);
      const o = g(/overdraft \(credit balance\) of (\d+)/), bc = g(/charges (\d+) and/), io = g(/interest on the overdraft (\d+) which/), ci = g(/issued for (\d+)/), cd = g(/deposited for (\d+)/);
      expect(ans('brs-overdraft', seed)).toEqual([o + bc + io, o + bc + io - ci + cd]);
    }
    expect(50000 + 500 + 1000).toBe(51500); expect(51500 - 10000 + 5000).toBe(46500);
  });
  it('dep-machinery-account: closing = opening + purchase − total depreciation; half-year charge on the new machine', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const q = makeQuestion('dep-machinery-account', seed), t = clean(q.stem), b = Number(/value of (\d+) on 1 April/.exec(t)![1]), n = Number(/costing (\d+) is bought/.exec(t)![1]), rate = Number(/at (\d+)% per year/.exec(t)![1]);
      const d1 = (b * rate) / 100, d2 = (n * rate) / 100 / 2; expect(ans('dep-machinery-account', seed)).toEqual([d1, d2, d1 + d2, b + n - d1 - d2]);
    }
  });
  it('final-accounts-tb: the assets side of the balance sheet equals capital + liabilities (cross-check from the stem)', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const q = makeQuestion('final-accounts-tb', seed), t = clean(q.stem), g = (k: string) => Number(new RegExp(`${k} (\\d+)`).exec(t)![1]);
      const [gp, np, closeCap, total] = ans('final-accounts-tb', seed);
      const mach = g('Machinery'), furn = g('Furniture'), debt = g('Debtors'), cash = g('Cash'), close = g('closing stock'), dep = g('depreciation on machinery');
      expect(mach + furn + debt + cash + close - dep, `seed ${seed}: assets side`).toBe(total);        // independent route to the same total
      const sales = g('Sales'), open = g('Opening stock'), purch = g('Purchases'), carr = g('Carriage inwards'), wages = g('Wages');
      expect(gp).toBe(sales - (open + purch + carr + wages - close));
      expect(np).toBe(gp! + g('Commission received') - g('Rent') - g('Salaries') - g('salaries outstanding') - dep);
      expect(closeCap).toBe(g('Capital') + np! - g('Drawings'));
      expect(np).toBeGreaterThan(0);
    }
  });
  it('provision-discount: P&L charge = bad debts + (new PDD − old PDD) + provision for discount', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const q = makeQuestion('provision-discount', seed), t = clean(q.stem), d = val(q.stem, /end of the year are (\d+)/), bad = val(q.stem, /Bad debts of (\d+)/), p = Number(/of (\d+)% is to be kept/.exec(t)![1]), dsc = Number(/discount of (\d+)% on/.exec(t)![1]), old = val(q.stem, /doubtful debts was (\d+)/);
      const pdd = ((d - bad) * p) / 100, pd = ((d - bad - pdd) * dsc) / 100; expect(ans('provision-discount', seed)).toEqual([pdd, pd, bad + pdd - old + pd]);
    }
  });
  it('credit-purchases: closing + payments + discount + returns − opening', () => {
    for (const seed of [1, 2, 3]) { const t = clean(makeQuestion('credit-purchases', seed).stem), g = (re: RegExp) => Number(re.exec(t)![1]); expect(ans('credit-purchases', seed)[0]).toBe(g(/end (\d+)\./) + g(/creditors (\d+) discount/) + g(/received (\d+) and/) + g(/returned (\d+)\./) - g(/beginning (\d+) and/)); }
  });
  it('adj-abnormal: loss = cost − claim; adjusted profit = profit + goods drawn + claim', () => {
    for (const seed of [1, 2, 3, 4]) { const q = makeQuestion('adj-abnormal', seed), t = clean(q.stem), np = Number(/adjustments is (\d+)\./.exec(t)![1]), d = Number(/costing (\d+) for personal/.exec(t)![1]), s = Number(/Goods costing (\d+) were destroyed/.exec(t)![1]), c = Number(/claim of (\d+)\./.exec(t)![1]); expect(ans('adj-abnormal', seed)).toEqual([s - c, s, np + d + c]); }
  });
});

describe('Class XI is now covered by concept, assertion-reason and mastermind items in every examinable chapter', () => {
  const have = new Set(SKILLS.map(s => s.clause));
  for (const c of ['XI.2.ledger', 'XI.2.tb', 'XI.2.cashbook', 'XI.2.subsidiary', 'XI.2.provisions', 'XI.2.errors', 'XI.2.depreciation', 'XI.3.incomplete', 'XI.3.trading-pl']) it(`${c} has items`, () => expect(have.has(c)).toBe(true));
  it('each Class XI examinable clause now has at least two skills', () => {
    for (const c of ['XI.2.vouchers', 'XI.2.cashbook', 'XI.2.subsidiary', 'XI.2.ledger', 'XI.2.brs', 'XI.2.depreciation', 'XI.2.provisions', 'XI.2.tb', 'XI.2.errors', 'XI.3.concepts', 'XI.3.adjustments', 'XI.3.incomplete']) expect(SKILLS.filter(s => s.clause === c).length, c).toBeGreaterThanOrEqual(2);
  });
  it('error-type items keep four distinct options and the right answer is among them', () => {
    for (let seed = 1; seed <= 60; seed++) { const p = makeQuestion('mcq-error-types', seed).parts[0]!; expect(new Set(p.options).size).toBe(4); expect(p.options).toContain(p.answer); }
  });
});
