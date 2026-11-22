import { describe, expect, it } from 'vitest';
import {
  Fraction,
  Money,
  commissionAfterCharging,
  commissionBeforeCharging,
  depreciationSchedule,
  gainingRatioOnExit,
  goodwillCapitalisation,
  goodwillSuperProfit,
  inventoryTurnoverRatio,
  pct,
  profitByStatementOfAffairs,
  quickRatio,
  currentRatio,
  ratioChange,
} from '../../engine/src';
import { CLAUSES, SKILLS, STUDY, UNITS, outcomesOf, studyOf } from '../src';

const text = (g: (typeof STUDY)[string]) => [g.summary, ...g.mustKnow, ...(g.formats ?? []), ...(g.steps ?? []), ...g.mistakes, g.asked, ...(g.example ? [g.example.q, g.example.a] : [])];
const all = () => Object.values(STUDY).flatMap(text);
const R = (n: number) => Money.rupees(n);
const ind = (n: number) => n.toLocaleString('en-IN'); // 18,200 / 1,00,000

describe('study guide: completeness and scope', () => {
  it('has exactly one guide for every syllabus topic, and none for anything else', () => {
    expect(Object.keys(STUDY).sort()).toEqual(CLAUSES.map(c => c.id).sort());
    for (const c of CLAUSES) expect(studyOf(c.id)?.clause, c.id).toBe(c.id);
  });
  it('every guide is substantial: summary, at least three must-know points, at least one common mistake, how it is asked', () => {
    for (const g of Object.values(STUDY)) {
      expect(g.summary.length, g.clause).toBeGreaterThan(60);
      expect(g.mustKnow.length, g.clause).toBeGreaterThanOrEqual(3);
      expect(g.mistakes.length, g.clause).toBeGreaterThanOrEqual(2);
      expect(g.asked.length, g.clause).toBeGreaterThan(40);
      for (const line of text(g)) expect(line.trim().length, g.clause).toBeGreaterThan(0);
    }
  });
  it('no placeholder text, no markup, no emoji', () => {
    for (const t of all()) {
      expect(t).not.toMatch(/todo|lorem|sample notes|replace this|tbd|xxx/i);
      expect(t).not.toMatch(/<[a-z/]/i);
      expect(t).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    }
  });
  it('topics that the official syllabus excludes are only ever mentioned as excluded (AGENTS rule 3)', () => {
    const EXCLUDED =
      /piecemeal|insolvency of partners|sale to a company|conversion method|\bdirect method|change of (depreciation )?method|redemption (accounting|of debentures)|weighted average|\bTDS\b|tax deducted at source|interest on calls/i;
    for (const g of Object.values(STUDY))
      for (const t of text(g))
        for (const sentence of t.split(/(?<=[.;])\s+/))
          if (EXCLUDED.test(sentence)) expect(sentence, `${g.clause}: ${sentence}`).toMatch(/outside|excluded|not prescribed|not required|not in the syllabus|only/i);
  });
  it('states each official limit it relies on: three goodwill methods, indirect cash flow, balance-method trial balance', () => {
    expect(STUDY['XII.1.goodwill']!.summary).toMatch(/three methods/i);
    expect(STUDY['XII.4.preparation']!.summary).toMatch(/indirect method only/i);
    expect(STUDY['XI.2.tb']!.summary).toMatch(/balance method/i);
    expect(STUDY['XI.2.depreciation']!.summary).toMatch(/outside the syllabus/i);
    expect(STUDY['XII.1.dissolution']!.summary).toMatch(/outside the syllabus/i);
  });
  it('the study material is reachable from practice: topics with a guide that have practice skills are the same ones the practice page offers', () => {
    const withSkills = new Set(SKILLS.map(s => s.clause));
    for (const c of CLAUSES) if (withSkills.has(c.id)) expect(studyOf(c.id), c.id).toBeDefined();
    expect(UNITS.length).toBeGreaterThan(0);
    expect(outcomesOf('XI.2.ledger').length).toBeGreaterThan(0);
  });
});

describe('study guide: every worked example is recomputed independently and through the engine', () => {
  const ex = (id: string) => STUDY[id]!.example!;
  const has = (id: string, ...figures: string[]) => {
    for (const f of figures) expect(ex(id).a, `${id}: ${f}`).toContain(f);
  };

  it('every example has a question and an answer', () => {
    const ids = Object.values(STUDY)
      .filter(g => g.example)
      .map(g => g.clause);
    expect(ids.length).toBeGreaterThanOrEqual(14);
    for (const id of ids) {
      expect(ex(id).q.length, id).toBeGreaterThan(30);
      expect(ex(id).a.length, id).toBeGreaterThan(15);
    }
  });
  it('BRS: 20,000 + 3,000 + 400 − 5,000 − 200 = 18,200', () => {
    expect(20000 + 3000 + 400 - 5000 - 200).toBe(18200);
    has('XI.2.brs', '18,200');
  });
  it('depreciation: SLM 18,000 a year; WDV 20,000 then 16,000 (hand-worked and by the engine)', () => {
    expect((100000 - 10000) / 5).toBe(18000);
    expect(100000 * 0.2).toBe(20000);
    expect(80000 * 0.2).toBe(16000);
    const slm = depreciationSchedule({ cost: R(100000), method: 'SLM', years: 1, lifeYears: 5, scrap: R(10000) });
    expect(slm[0]!.depreciation.equals(R(18000))).toBe(true);
    const wdv = depreciationSchedule({ cost: R(100000), method: 'WDV', years: 2, rate: pct(20) });
    expect(wdv.map(r => r.depreciation.toString())).toEqual([R(20000).toString(), R(16000).toString()]);
    has('XI.2.depreciation', '18,000', '20,000', '16,000');
  });
  it('provision for bad debts: (50,000 − 2,000) × 5% = 2,400', () => {
    expect(((50000 - 2000) * 5) / 100).toBe(2400);
    has('XI.2.provisions', '2,400');
  });
  it('trading account: cost of goods sold 1,00,000; gross profit 50,000', () => {
    const cogs = 20000 + 100000 + 5000 - 25000;
    expect(cogs).toBe(100000);
    expect(150000 - cogs).toBe(50000);
    has('XI.3.trading-pl', '1,00,000', '50,000');
  });
  it('manager’s commission: 10,000 after charging, 11,000 before (hand-worked and by the engine)', () => {
    expect(Math.round((110000 * 10) / 110)).toBe(10000);
    expect(110000 * 0.1).toBe(11000);
    expect(commissionAfterCharging(R(110000), 10n).equals(R(10000))).toBe(true);
    expect(commissionBeforeCharging(R(110000), 10n).equals(R(11000))).toBe(true);
    has('XI.3.adjustments', '10,000', '11,000');
  });
  it('statement of affairs: profit 50,000', () => {
    expect(140000 - 100000 + 20000 - 10000).toBe(50000);
    expect(profitByStatementOfAffairs({ openingCapital: R(100000), closingCapital: R(140000), drawings: R(20000), additionalCapital: R(10000) }).equals(R(50000))).toBe(true);
    has('XI.3.incomplete', '50,000');
  });
  it('goodwill: normal profit 40,000, super profit 20,000, goodwill 60,000; capitalisation 6,00,000 − 4,00,000 = 2,00,000', () => {
    expect(400000 * 0.1).toBe(40000);
    expect(60000 - 40000).toBe(20000);
    expect(20000 * 3).toBe(60000);
    expect(60000 / 0.1 - 400000).toBe(200000);
    const sp = goodwillSuperProfit(R(60000), R(400000), 10n, 3n);
    expect(sp.normalProfit.equals(R(40000)) && sp.superProfit.equals(R(20000)) && sp.goodwill.equals(R(60000))).toBe(true);
    const cap = goodwillCapitalisation(R(60000), 10n, R(400000));
    expect(cap.capitalisedValue.equals(R(600000)) && cap.goodwill.equals(R(200000))).toBe(true);
    has('XII.1.goodwill', '40,000', '20,000', '60,000', '6,00,000', '2,00,000');
  });
  it('change of ratio 3:2 → 2:3: A sacrifices 1/5, B gains 1/5', () => {
    const c = ratioChange({ A: Fraction.of(3, 5), B: Fraction.of(2, 5) }, { A: Fraction.of(2, 5), B: Fraction.of(3, 5) });
    expect(c.sacrifice.A!.toString()).toBe('1/5');
    expect(c.gain.B!.toString()).toBe('1/5');
    has('XII.1.ratio-change', '1/5');
  });
  it('admission: new ratio 12:8:5; sacrifice A 3/25, B 2/25 (sacrificing ratio 3:2)', () => {
    // C gets 1/5; A and B share 4/5 in 3:2 → 12/25 and 8/25; C = 5/25
    const c = ratioChange({ A: Fraction.of(3, 5), B: Fraction.of(2, 5), C: Fraction.ZERO }, { A: Fraction.of(12, 25), B: Fraction.of(8, 25), C: Fraction.of(1, 5) });
    expect(c.sacrifice.A!.toString()).toBe('3/25');
    expect(c.sacrifice.B!.toString()).toBe('2/25');
    expect(c.gain.C!.toString()).toBe('1/5');
    expect(12 + 8 + 5).toBe(25);
    has('XII.1.admission', '12/25', '8/25', '5/25', '12 : 8 : 5', '3/25', '2/25', '3 : 2');
  });
  it('retirement: C leaves a 5:3:2 firm, A and B continue 3:2 → gaining ratio 1:1', () => {
    const g = gainingRatioOnExit({ A: Fraction.of(5, 10), B: Fraction.of(3, 10), C: Fraction.of(2, 10) }, { A: Fraction.of(3, 5), B: Fraction.of(2, 5) }, 'C');
    expect(g.A!.toString()).toBe('1/10');
    expect(g.B!.toString()).toBe('1/10');
    has('XII.1.retirement', '1/10', '1 : 1');
  });
  it('pro-rata allotment: 10,000 ÷ 15,000 = 2/3', () => {
    expect(Fraction.of(10000, 15000).toString()).toBe('2/3');
    has('XII.2.issue', '2/3', '5,000');
  });
  it('forfeiture and re-issue: 800 / 500 / 300; re-issue 900, discount 100, capital reserve 400', () => {
    const called = 100 * 8,
      received = 100 * 5;
    expect(called).toBe(800);
    expect(received).toBe(500);
    expect(called - received).toBe(300);
    const reissueCash = 100 * 9,
      discount = 100 * 10 - reissueCash;
    expect(reissueCash).toBe(900);
    expect(discount).toBe(100);
    expect(received - discount).toBe(400);
    has('XII.2.forfeiture', '800', '500', '300', '900', '100', '1,000', '400');
  });
  it('liquidity: current ratio 2 : 1; quick ratio 1.53 : 1', () => {
    expect(300000 / 150000).toBe(2);
    expect(((300000 - 60000 - 10000) / 150000).toFixed(2)).toBe('1.53');
    expect(currentRatio(R(300000), R(150000)).display).toBe('2.00 : 1');
    expect(quickRatio(R(300000), R(60000), R(10000), R(150000)).display).toBe('1.53 : 1');
    has('XII.3.liquidity', '2 : 1', '1.53 : 1', '2,30,000');
  });
  it('inventory turnover: average 1,00,000; 6 times', () => {
    expect((90000 + 110000) / 2).toBe(100000);
    expect(600000 / 100000).toBe(6);
    expect(inventoryTurnoverRatio(R(600000), R(90000), R(110000)).display).toBe('6.00 times');
    has('XII.3.activity', '1,00,000', '6 times');
  });
  it('the Indian grouping used in the text is the grouping the app prints', () => {
    expect(ind(1000000)).toBe('10,00,000');
    expect(ind(18200)).toBe('18,200');
  });
});
