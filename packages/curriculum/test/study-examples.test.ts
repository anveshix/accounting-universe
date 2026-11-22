import { describe, expect, it } from 'vitest';
import { CLAUSES, STUDY, studyOf } from '../src';
import { MORE_EXAMPLES } from '../src/study-examples';

/** Every worked example added in study-examples.ts is re-worked here from the figures in its question (plain arithmetic, hand-checked), and its answer must contain the result. */
const has = (id: string, ...figs: string[]) => {
  const a = studyOf(id)!.example!.a;
  for (const f of figs) expect(a, `${id}: ${f}`).toContain(f);
};

describe('study guide: every topic now has a worked example', () => {
  it('all 54 topics have a question and an answer; the added examples are really attached', () => {
    for (const c of CLAUSES) {
      const ex = studyOf(c.id)!.example;
      expect(ex, c.id).toBeDefined();
      expect(ex!.q.length, c.id).toBeGreaterThan(30);
      expect(ex!.a.length, c.id).toBeGreaterThan(20);
    }
    for (const id of Object.keys(MORE_EXAMPLES))
      expect(
        CLAUSES.some(c => c.id === id),
        `unknown topic ${id}`,
      ).toBe(true);
    expect(Object.keys(STUDY)).toHaveLength(54);
  });
  it('an example written inline is never replaced', () => {
    expect(studyOf('XI.2.brs')!.example!.a).toContain('18,200');
  });
});

describe('Class XI worked examples (hand-worked)', () => {
  it('terms: capital 80,000 then 75,000 after drawings', () => {
    expect(50000 + 30000).toBe(80000);
    expect(80000 - 5000).toBe(75000);
    has('XI.1.terms', '80,000', '75,000');
  });
  it('basis: rent 9,000 cash vs 12,000 accrual, 3,000 outstanding', () => {
    expect(12000 - 9000).toBe(3000);
    has('XI.1.basis', '9,000', '12,000', '3,000');
  });
  it('equation: 1,00,000 → 1,30,000 (= 30,000 + 1,00,000) → 1,20,000 (= 20,000 + 1,00,000)', () => {
    expect(80000 + 20000).toBe(100000);
    expect(80000 + 20000 + 30000).toBe(30000 + 100000);
    expect(70000 + 20000 + 30000).toBe(20000 + 100000);
    has('XI.2.equation', '1,30,000', '1,20,000', '70,000');
  });
  it('journal: purchases 30,000 less return 2,000 = 28,000 owed; paid 26,000 + discount 2,000', () => {
    expect(30000 - 2000).toBe(28000);
    expect(28000 - 26000).toBe(2000);
    has('XI.2.journal', '28,000', '26,000', '2,000');
  });
  it('cash book: cash 10,000 and bank 33,000', () => {
    expect(10000 + 8000 - 5000 - 3000).toBe(10000);
    expect(40000 + 5000 - 12000).toBe(33000);
    has('XI.2.cashbook', '10,000', '33,000');
  });
  it('purchases book: 40,000 less 3,000 return = 37,000', () => {
    expect(12000 + 18000 + 10000).toBe(40000);
    expect(40000 - 3000).toBe(37000);
    has('XI.2.subsidiary', '40,000', '37,000', 'journal proper');
  });
  it('ledger: 70,000 less 35,000 = 35,000 balance', () => {
    expect(20000 + 50000).toBe(70000);
    expect(70000 - 35000).toBe(35000);
    has('XI.2.ledger', '70,000', '35,000');
  });
  it('trial balance: debits 2,30,000 − credits 1,70,000 = sales 60,000', () => {
    const dr = 30000 + 40000 + 60000 + 10000 + 70000 + 20000;
    expect(dr).toBe(230000);
    expect(dr - (150000 + 20000)).toBe(60000);
    has('XI.2.tb', '2,30,000', '1,70,000', '60,000');
  });
  it('errors: suspense 1,200 cleared against sales', () => {
    has('XI.2.errors', '1,200', 'Suspense A/c Dr 1,200', 'Sales A/c 1,200');
  });
  it('deferred revenue expenditure: 60,000 ÷ 3 = 20,000 a year, 40,000 carried forward', () => {
    expect(60000 / 3).toBe(20000);
    expect(60000 - 20000).toBe(40000);
    has('XI.3.concepts', '20,000', '40,000');
  });
  it('balance sheet: both sides 2,10,000', () => {
    expect(140000 + 50000 + 20000).toBe(210000);
    expect(90000 + 60000 + 40000 + 20000).toBe(210000);
    has('XI.3.balance-sheet', '2,10,000');
  });
});

describe('Class XII worked examples (hand-worked)', () => {
  it('partnership defaults: 45,000 each; loan interest 6% of 50,000 = 3,000', () => {
    expect(90000 / 2).toBe(45000);
    expect((50000 * 6) / 100).toBe(3000);
    has('XII.1.fundamentals', '45,000', '3,000', '6%');
  });
  it('capitals: fixed current account 70,000; fluctuating capital 5,70,000', () => {
    expect(80000 + 30000 - 40000).toBe(70000);
    expect(500000 + 80000 + 30000 - 40000).toBe(570000);
    has('XII.1.capital', '70,000', '5,70,000');
  });
  it('appropriation: 70,000 shared 42,000 / 28,000; each partner 50,000 in all', () => {
    const rest = 100000 - 8000 - 4000 - 18000;
    expect(rest).toBe(70000);
    expect((rest * 3) / 5).toBe(42000);
    expect((rest * 2) / 5).toBe(28000);
    expect(8000 + 42000).toBe(50000);
    expect(4000 + 18000 + 28000).toBe(50000);
    has('XII.1.appropriation', '70,000', '42,000', '28,000', '50,000');
  });
  it('guarantee: C 20,000 → shortfall 10,000; final A 42,000, B 28,000, C 30,000 = 1,00,000', () => {
    const c = 100000 / 5,
      short = 30000 - c;
    expect(short).toBe(10000);
    const a = (80000 * 3) / 5 - (short * 3) / 5,
      b = (80000 * 2) / 5 - (short * 2) / 5;
    expect([a, b, 30000]).toEqual([42000, 28000, 30000]);
    expect(a + b + 30000).toBe(100000);
    has('XII.1.guarantee', '20,000', '10,000', '42,000', '28,000', '30,000');
  });
  it('past adjustment: A should get 60,000 not 50,000; B pays 10,000', () => {
    expect((100000 * 3) / 5 - 50000).toBe(10000);
    expect(50000 - (100000 * 2) / 5).toBe(10000);
    has('XII.1.past-adjustments', '10,000', 'B’s Capital A/c Dr 10,000');
  });
  it('death: 1,20,000 × 6/12 × 1/6 = 10,000', () => {
    expect((120000 * 6) / 12).toBe(60000);
    expect(60000 / 6).toBe(10000);
    has('XII.1.death', '60,000', '10,000');
  });
  it('dissolution: realisation loss 32,000 (28,000 on assets and creditors + 4,000 expenses), 16,000 each', () => {
    const dr = 240000 + 48000 + 4000,
      cr = 50000 + 210000;
    expect(dr).toBe(292000);
    expect(cr).toBe(260000);
    expect(dr - cr).toBe(32000);
    expect(240000 - 210000 - (50000 - 48000) + 4000).toBe(32000);
    expect(32000 / 2).toBe(16000);
    has('XII.1.dissolution', '2,92,000', '2,60,000', '32,000', '16,000');
  });
  it('share capital: 50,00,000 / 40,00,000 / 38,00,000 / 30,40,000 / 30,00,000', () => {
    expect(500000 * 10).toBe(5000000);
    expect(400000 * 10).toBe(4000000);
    expect(380000 * 10).toBe(3800000);
    expect(380000 * 8).toBe(3040000);
    expect(3040000 - 40000).toBe(3000000);
    has('XII.2.fundamentals', '50,00,000', '40,00,000', '38,00,000', '30,40,000', '30,00,000');
  });
  it('shares for machinery: 12,000 = 10,000 capital + 2,000 premium', () => {
    expect(1000 * 12).toBe(12000);
    expect(1000 * 10 + 1000 * 2).toBe(12000);
    has('XII.2.concepts', '12,000', '10,000', '2,000');
  });
  it('disclosure: 5,80,000 + (20,000 − 4,000) = 5,96,000', () => {
    expect(58000 * 10).toBe(580000);
    expect(2000 * 10 - 2000 * 2).toBe(16000);
    expect(580000 + 16000).toBe(596000);
    has('XII.2.disclosure', '5,80,000', '16,000', '5,96,000');
  });
  it('debentures: 95,000 received, 5,000 discount, interest 12,000', () => {
    expect(1000 * 95).toBe(95000);
    expect(1000 * 100 - 95000).toBe(5000);
    expect((100000 * 12) / 100).toBe(12000);
    has('XII.2.debentures', '95,000', '5,000', '1,00,000', '12,000');
  });
  it('comparative: revenue +1,00,000 (20%); receivables −8,000 (10%)', () => {
    expect(600000 - 500000).toBe(100000);
    expect((100000 * 100) / 500000).toBe(20);
    expect(80000 - 72000).toBe(8000);
    expect((8000 * 100) / 80000).toBe(10);
    has('XII.3.comparative', '1,00,000', '20%', '8,000', '10%');
  });
  it('common-size: 50 / 15 / 10 %, total 75 %, PBT 2,00,000 = 25 %', () => {
    expect((400000 * 100) / 800000).toBe(50);
    expect((120000 * 100) / 800000).toBe(15);
    expect((80000 * 100) / 800000).toBe(10);
    expect(400000 + 120000 + 80000).toBe(600000);
    expect(800000 - 600000).toBe(200000);
    expect((200000 * 100) / 800000).toBe(25);
    has('XII.3.common-size', '50%', '15%', '10%', '75%', '2,00,000', '25%');
  });
  it('solvency: 0.5, 4, 0.5, 0.33, 6', () => {
    expect(400000 / 800000).toBe(0.5);
    expect(1600000 / 400000).toBe(4);
    expect(800000 / 1600000).toBe(0.5);
    expect(+(400000 / (800000 + 400000)).toFixed(2)).toBe(0.33);
    expect(240000 / 40000).toBe(6);
    has('XII.3.solvency', '0.5 : 1', '4 : 1', '0.33 : 1', '6 times', '12,00,000');
  });
  it('profitability: 40 %, 80 %, 20 %, 10 %', () => {
    expect(((1000000 - 600000) * 100) / 1000000).toBe(40);
    expect(((600000 + 200000) * 100) / 1000000).toBe(80);
    expect(((1000000 - 800000) * 100) / 1000000).toBe(20);
    expect((100000 * 100) / 1000000).toBe(10);
    has('XII.3.profitability', '40%', '80%', '20%', '10%');
  });
  it('cash flow classification: six items, each labelled', () => {
    has('XII.4.classification', '(a) Operating', '(b) Investing', '(c) Financing', '(d) Investing', '(e) Financing', '(f) Financing');
  });
  it('cash from operations: 2,45,000 → 2,40,000 → 2,00,000', () => {
    const op = 200000 + 30000 + 10000 + 5000;
    expect(op).toBe(245000);
    const gen = op - 20000 + 15000;
    expect(gen).toBe(240000);
    expect(gen - 40000).toBe(200000);
    has('XII.4.preparation', '2,45,000', '2,40,000', '2,00,000');
  });
  it('spreadsheet: 10,000, 90,000, 9,000', () => {
    expect(100000 * 0.1).toBe(10000);
    expect(100000 - 10000).toBe(90000);
    expect(90000 * 0.1).toBe(9000);
    has('XII.C.spreadsheet', '=B2*B3', '10,000', '=B2-B4', '90,000', '=B5*B3', '9,000');
  });
});
