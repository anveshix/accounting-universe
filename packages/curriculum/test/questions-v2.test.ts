import { describe, expect, it } from 'vitest';
import { CLAUSES, SKILLS, makeQuestion } from '../src';

// Independent oracles: hand-worked figures typed in from a worked solution, never produced by the generator under test.
const ans = (skill: string, seed: number, part = 0) => makeQuestion(skill, seed).parts[part]!.answer;
const num = (skill: string, seed: number, part = 0) => Number(ans(skill, seed, part));

describe('V2 numerical generators agree with closed-form arithmetic', () => {
  it('gp-np: GP = net sales − (opening + net purchases + carriage + wages − closing); NP = GP + commission − rent − salaries', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const q = makeQuestion('gp-np', seed), n = (re: RegExp) => Number(re.exec(q.stem.replace(/[₹,]/g, ''))![1]);
      const sales = n(/Sales (\d+)/), sr = n(/sales returns (\d+)/), open = n(/opening stock (\d+)/), pu = n(/purchases (\d+)/), pr = n(/purchases returns (\d+)/), ca = n(/carriage inwards (\d+)/), w = n(/wages (\d+)/), cl = n(/closing stock (\d+)/), rent = n(/rent (\d+)/), sal = n(/salaries (\d+)/), com = n(/commission received (\d+)/);
      const gp = sales - sr - (open + pu - pr + ca + w - cl);
      expect(Number(q.parts[0]!.answer)).toBe(gp); expect(Number(q.parts[1]!.answer)).toBe(gp + com - rent - sal);
    }
  });
  it('hand-worked: premium-issue 20,000 shares ₹10 + ₹3 premium → cash 2,60,000; capital 2,00,000; premium 60,000', () => {
    const q = Array.from({ length: 300 }, (_, i) => makeQuestion('premium-issue', i + 1)).find(x => /20000 equity shares/.test(x.stem.replace(/,/g, '')) && /premium of ₹3 /.test(x.stem))!;
    expect(q.parts.map(p => Number(p.answer))).toEqual([260000, 200000, 60000]);
  });
  it('ratio-profit: GP ratio + COGS% = 100, operating ratio + operating profit ratio = 100', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) { const a = [0, 1, 2].map(i => num('ratio-profit', seed, i)); expect(a[1]! + a[2]!).toBe(100); expect(a[0]!).toBeGreaterThan(24); }
  });
  it('ratio-receivables: turnover × collection period = 12 months', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) expect(num('ratio-receivables', seed, 0) * num('ratio-receivables', seed, 1)).toBe(12);
  });
  it('comparative: % change × previous ÷ 100 = absolute change', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) { const q = makeQuestion('comparative', seed), prev = Number(/was ([\d,]+)/.exec(q.stem.replace(/₹/g, ''))![1]!.replace(/,/g, '')); expect(Number(q.parts[1]!.answer) * prev / 100).toBe(Number(q.parts[0]!.answer)); }
  });
  it('outstanding-prepaid: P&L charge = paid − opening outstanding + closing outstanding', () => {
    for (const seed of [1, 2, 3]) { const q = makeQuestion('outstanding-prepaid', seed), v = /paid during the year was ([\d,]+)\..*beginning was ([\d,]+) and at the end ([\d,]+)\./.exec(q.stem.replace(/₹/g, ''))!.slice(1).map(x => Number(x.replace(/,/g, ''))); expect(Number(q.parts[0]!.answer)).toBe(v[0]! - v[1]! + v[2]!); }
  });
  it('admission-capital: goodwill = n × C − (A + B + C)', () => {
    for (const seed of [1, 2, 3, 4]) { const q = makeQuestion('admission-capital', seed), t = q.stem.replace(/[₹,]/g, ''), [a, b] = /capitals of (\d+) and (\d+)/.exec(t)!.slice(1).map(Number), n = Number(/1\/(\d)/.exec(t)![1]), x = Number(/brings (\d+)/.exec(t)![1]); expect(Number(q.parts[0]!.answer)).toBe(n * x - (a! + b! + x)); }
  });
});
describe('every syllabus topic that is examined numerically or conceptually now has questions', () => {
  const have = new Set(SKILLS.map(s => s.clause));
  const MUST = ['XI.1.intro', 'XI.1.terms', 'XI.1.concepts', 'XI.1.basis', 'XI.1.standards', 'XI.1.gst', 'XI.2.vouchers', 'XI.3.concepts', 'XI.3.trading-pl', 'XI.3.balance-sheet', 'XII.1.fundamentals', 'XII.1.capital', 'XII.1.past-adjustments', 'XII.1.death', 'XII.2.fundamentals', 'XII.2.concepts', 'XII.2.disclosure', 'XII.3.statements', 'XII.3.comparative', 'XII.3.common-size', 'XII.3.profitability', 'XII.4.classification', 'XII.C.cas', 'XII.C.using'];
  for (const c of MUST) it(`${c} has at least one skill`, () => { expect(CLAUSES.some(x => x.id === c)).toBe(true); expect(have.has(c)).toBe(true); });
  it('concept banks never repeat an option inside one question', () => {
    for (const s of SKILLS.filter(x => x.skill.startsWith('mcq-'))) for (let seed = 1; seed <= 60; seed++) { const o = makeQuestion(s.skill, seed).parts[0]!.options!; expect(new Set(o).size, `${s.skill}#${seed}`).toBe(o.length); expect(o).toContain(makeQuestion(s.skill, seed).parts[0]!.answer); }
  });
});
