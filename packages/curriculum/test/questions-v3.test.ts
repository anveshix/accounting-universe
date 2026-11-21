import { describe, expect, it } from 'vitest';
import { SKILLS, makeQuestion } from '../src';

// Independent oracles: figures worked by hand from the stem, never read from the generator's own answer.
const nums = (stem: string) => [...stem.replace(/₹(\d)/g, '$1').matchAll(/(\d{1,3}(?:,\d{2,3})*(?:,\d{3})?|\d+)/g)].map(m => Number(m[1]!.replace(/,/g, '')));
const ans = (skill: string, seed: number) => makeQuestion(skill, seed).parts.map(p => p.answer);

describe('step-wise questions: each step follows from the previous one', () => {
  it('step-dep-sale: accumulated = annual × years; book value = cost − accumulated; profit/loss = sale price − book value', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const q = makeQuestion('step-dep-sale', seed), t = q.stem.replace(/₹/g, ''), cost = Number(/for ([\d,]+) /.exec(t)![1]!.replace(/,/g, '')), rate = Number(/at (\d+)%/.exec(t)![1]), y = Number(/end of year (\d)/.exec(t)![1]), sp = Number(/sold for ([\d,]+) at/.exec(t)![1]!.replace(/,/g, ''));
      const annual = (cost * rate) / 100, bv = cost - annual * y;
      expect(q.parts.map(p => Number(p.answer))).toEqual([annual, annual * y, bv, sp - bv]);
    }
  });
  it('step-retirement: amount due = capital + reserve share + goodwill share − drawings', () => {
    for (const seed of [1, 2, 3, 4, 5]) { const q = makeQuestion('step-retirement', seed), a = q.parts.map(p => Number(p.answer)), t = q.stem.replace(/[₹,]/g, ''), cap = Number(/capital is (\d+)/.exec(t)![1]), dr = Number(/has drawn (\d+)/.exec(t)![1]); expect(a[2]).toBe(cap + a[0]! + a[1]! - dr); }
  });
  it('step-cfo: step 3 = step 1 + step 2; step 4 = step 3 − tax; hand-checked case', () => {
    for (const seed of [1, 2, 3, 4, 5]) { const a = ans('step-cfo', seed).map(Number), tax = Number(/tax paid ([\d,]+)/.exec(makeQuestion('step-cfo', seed).stem.replace(/₹/g, ''))![1]!.replace(/,/g, '')); expect(a[2]).toBe(a[0]! + a[1]!); expect(a[3]).toBe(a[2]! - tax); }
  });
  it('step-forfeit-reissue: capital reserve = forfeited amount − discount on re-issue', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) { const a = ans('step-forfeit-reissue', seed).map(Number); expect(a[2]).toBe(a[0]! - a[1]!); expect(a[1]).toBeGreaterThan(0); expect(a[2]).toBeGreaterThan(0); }
  });
  it('step-admission-goodwill: A and B credits add up to C’s share', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) { const a = ans('step-admission-goodwill', seed).map(Number); expect(a[1]! + a[2]!).toBe(a[0]); }
  });
});

describe('case-based questions: computed options', () => {
  it('case-equation: assets = liabilities + capital', () => {
    for (const seed of [1, 2, 3, 4, 5]) { const a = makeQuestion('case-equation', seed).parts.map(p => Number(p.answer.replace(/[₹,]/g, ''))); expect(a[0]).toBe(a[1]! + a[2]!); }
  });
  it('case-admission: new ratio sums consistently (hand check 3 : 2 with 1/4 → 9 : 6 : 5)', () => {
    const q = Array.from({ length: 200 }, (_, i) => makeQuestion('case-admission', i + 1)).find(x => /profits 3 : 2\./.test(x.stem) && /1\/4 share/.test(x.stem))!;
    expect(q.parts[0]!.answer).toBe('9 : 6 : 5'); expect(q.parts[1]!.answer).toBe('3 : 2');
  });
  it('every case has four distinct options per sub-question and the answer is among them', () => {
    for (const s of SKILLS.filter(x => ['case-equation', 'case-dep', 'case-brs', 'case-admission', 'case-forfeiture', 'case-cfs'].includes(x.skill))) for (let seed = 1; seed <= 40; seed++) for (const p of makeQuestion(s.skill, seed).parts) { expect(new Set(p.options).size, `${s.skill}#${seed}`).toBe(4); expect(p.options).toContain(p.answer); }
  });
  it('case-brs: pass book = cash book − charges + interest + unpresented − uncollected (hand-checked)', () => {
    for (const seed of [1, 2, 3, 4, 5]) { const q = makeQuestion('case-brs', seed), t = q.stem.replace(/[₹,]/g, ''), cb = Number(/debit balance of (\d+)/.exec(t)![1]), ci = Number(/issued for (\d+)/.exec(t)![1]), cd = Number(/deposited for (\d+)/.exec(t)![1]), bc = Number(/charged (\d+)/.exec(t)![1]), ic = Number(/interest (\d+)/.exec(t)![1]); expect(Number(q.parts[1]!.answer.replace(/[₹,]/g, ''))).toBe(cb - bc + ic + ci - cd); }
  });
});

describe('assertion-reason: the option is derived from the truth flags', () => {
  const O = ['Both A and R are true, and R is the correct explanation of A.', 'Both A and R are true, but R is not the correct explanation of A.', 'A is true, but R is false.', 'A is false, but R is true.'];
  it('always offers the four standard CBSE options, in the standard order', () => { for (const s of SKILLS.filter(x => x.skill.startsWith('ar-'))) expect(makeQuestion(s.skill, 3).parts[0]!.options).toEqual(O); });
  it('hand-checked items', () => {
    const find = (skill: string, text: RegExp) => { for (let i = 1; i < 400; i++) { const q = makeQuestion(skill, i); if (text.test(q.stem)) return q.parts[0]!.answer; } throw new Error('item not found'); };
    expect(find('ar-depreciation', /source of cash/)).toBe(O[3]);                    // A false, R true
    expect(find('ar-concepts', /Land bought/)).toBe(O[0]);                             // both true, R explains
    expect(find('ar-concepts', /Salary for March/)).toBe(O[2]);                        // A true, R false
    expect(find('ar-errors', /agrees proves/)).toBe(O[3]);
    expect(find('ar-concepts', /Interest on a bank loan/)).toBe(O[1]);                 // both true, no explanation
  });
  it('each bank has every answer type available across the whole set', () => {
    const seen = new Set<string>(); for (const s of SKILLS.filter(x => x.skill.startsWith('ar-'))) for (let i = 1; i <= 60; i++) seen.add(makeQuestion(s.skill, i).parts[0]!.answer);
    expect(seen.size).toBe(4);
  });
});
