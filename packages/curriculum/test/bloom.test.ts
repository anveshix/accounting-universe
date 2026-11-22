import { describe, expect, it } from 'vitest';
import { BAND_OF, BLOOM_BANK, BLOOM_GENERATORS, BLOOM_LEVELS, bloomItems } from '../src/bloom';
import { CLAUSES } from '../src/syllabus';
import { ALL_GENERATORS, checkAnswer, makeQuestion } from '../src/questions';

// Minimums per topic, set so that every topic can be practised at every level without seeing the same question straight away.
const MIN: Record<string, number> = { REMEMBER: 2, UNDERSTAND: 2, APPLY: 3, ANALYSE: 1, EVALUATE: 1, CREATE: 1 };

describe('Bloom practice bank', () => {
  it('covers every one of the 54 syllabus topics', () => {
    expect(CLAUSES.length).toBe(54);
    for (const c of CLAUSES) expect(BLOOM_BANK[c.id], c.id).toBeDefined();
    expect(Object.keys(BLOOM_BANK).filter(k => !CLAUSES.some(c => c.id === k))).toEqual([]);
  });

  it('gives every topic the minimum number of items at every Bloom level and at least 8 in all', () => {
    for (const c of CLAUSES) {
      for (const lv of BLOOM_LEVELS) expect(bloomItems(c.id, lv).length, `${c.id} ${lv}`).toBeGreaterThanOrEqual(MIN[lv]!);
      expect(BLOOM_BANK[c.id]!.length, c.id).toBeGreaterThanOrEqual(8);
    }
  });

  it('every item is well formed: unique question, distinct options, a reason', () => {
    const seen = new Set<string>();
    for (const [clause, items] of Object.entries(BLOOM_BANK)) {
      for (const [code, q, correct, wrong, why] of items) {
        expect('RUANEC'.includes(code), `${clause} ${q}`).toBe(true);
        const key = `${clause}|${q}`;
        expect(seen.has(key), `duplicate question in ${clause}: ${q}`).toBe(false);
        seen.add(key);
        const opts = [correct, ...wrong];
        expect(new Set(opts.map(o => o.trim().toLowerCase())).size, `${clause} ${q}`).toBe(4);
        expect(opts.every(o => o.trim().length > 0)).toBe(true);
        expect(why.trim().length, `${clause} ${q}`).toBeGreaterThan(5);
        expect(q.trim().length, `${clause} ${q}`).toBeGreaterThan(12);
      }
    }
  });

  it('length giveaway is bounded (known limitation, ratchet: the older concept banks sit near 45 %, this bank near 71 %)', () => {
    let longest = 0,
      total = 0;
    for (const items of Object.values(BLOOM_BANK))
      for (const [, , correct, wrong] of items) {
        total++;
        if (correct.length > Math.max(...wrong.map(w => w.length))) longest++;
      }
    expect(longest / total).toBeLessThan(0.75);
  });

  it('keeps to the official limits: no excluded topics appear', () => {
    const banned = /interest on calls in arrears|redemption of debentures|(?<!in)direct method|share[- ]?warrant|buy-?back|amalgamation|\bmanufacturing account\b|\bcash flow.*direct\b/i;
    for (const [clause, items] of Object.entries(BLOOM_BANK)) for (const it of items) expect(banned.test(it.slice(1).flat().join(' ')), `${clause}: ${it[1]}`).toBe(false);
  });

  it('every generator maps to one band and its questions carry the matching Bloom level', () => {
    expect(BLOOM_GENERATORS.length).toBeGreaterThan(100);
    for (const g of BLOOM_GENERATORS) {
      expect(ALL_GENERATORS.includes(g)).toBe(true);
      for (let seed = 1; seed <= 12; seed++) {
        const q = makeQuestion(g.skill, seed);
        expect(q.bloom, g.skill).toBeDefined();
        expect(BAND_OF[q.bloom!], g.skill).toBe(g.typology);
        const p = q.parts[0]!;
        expect(checkAnswer(p, p.answer)).toBe(true);
        for (const o of p.options!.filter(o => o !== p.answer)) expect(checkAnswer(p, o)).toBe(false);
      }
    }
  });

  it('one learner can meet every item of a band within a few seeds (seeds walk the bank)', () => {
    for (const g of BLOOM_GENERATORS) {
      const n = BLOOM_BANK[g.clause]!.filter(i => BAND_OF[({ R: 'REMEMBER', U: 'UNDERSTAND', A: 'APPLY', N: 'ANALYSE', E: 'EVALUATE', C: 'CREATE' } as const)[i[0]]] === g.typology).length;
      const stems = new Set<string>();
      for (let s = 1; s <= n * 40; s++) stems.add(makeQuestion(g.skill, s).stem);
      expect(stems.size, g.skill).toBe(n);
    }
  });
});
