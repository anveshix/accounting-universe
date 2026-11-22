import { describe, expect, it } from 'vitest';
import { BAND_OF, BLOOM_BANK, BLOOM_GENERATORS, BLOOM_LEVELS, bloomHindi, bloomItems } from '../src/bloom';
import { CLAUSES } from '../src/syllabus';
import { ALL_GENERATORS, checkAnswer, makeQuestion } from '../src/questions';

// Minimums per topic, set so that every topic can be practised at every level without seeing the same question straight away.
const MIN: Record<string, number> = { REMEMBER: 2, UNDERSTAND: 2, APPLY: 3, ANALYSE: 2, EVALUATE: 2, CREATE: 1 };

describe('Bloom practice bank', () => {
  it('covers every one of the 54 syllabus topics', () => {
    expect(CLAUSES.length).toBe(54);
    for (const c of CLAUSES) expect(BLOOM_BANK[c.id], c.id).toBeDefined();
    expect(Object.keys(BLOOM_BANK).filter(k => !CLAUSES.some(c => c.id === k))).toEqual([]);
  });

  it('gives every topic the minimum number of items at every Bloom level and at least 12 in all', () => {
    for (const c of CLAUSES) {
      for (const lv of BLOOM_LEVELS) expect(bloomItems(c.id, lv).length, `${c.id} ${lv}`).toBeGreaterThanOrEqual(MIN[lv]!);
      expect(BLOOM_BANK[c.id]!.length, c.id).toBeGreaterThanOrEqual(12);
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

  it('the correct option is the strictly longest in about a quarter of the items, not most of them', () => {
    let longest = 0,
      total = 0;
    for (const items of Object.values(BLOOM_BANK))
      for (const [, , correct, wrong] of items) {
        total++;
        if (correct.length > Math.max(...wrong.map(w => w.length))) longest++;
      }
    expect(longest / total).toBeLessThan(0.3);
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

describe('Bloom Hindi (draft, all six levels)', () => {
  const DEV = /[ऀ-ॿ]/;
  const nums = (t: string) =>
    (t.match(/[₹\d][\d,.]*/g) ?? [])
      .map(x => x.replace(/[,.]+$/, ''))
      .sort()
      .join('|');
  it('every item has an aligned Hindi version with the same figures', () => {
    for (const [clause, items] of Object.entries(BLOOM_BANK)) {
      items.forEach((it, i) => {
        const h = bloomHindi(clause, i);
        if (!'RUANEC'.includes(it[0])) return;
        expect(h, `${clause}#${i}`).toBeDefined();
        const [q, correct, wrong, why] = h!;
        for (const t of [q, correct, why, ...wrong]) expect(t.trim().length, `${clause}#${i}`).toBeGreaterThan(0);
        expect(DEV.test(q), `${clause}#${i}`).toBe(true);
        expect(nums(correct), `${clause}#${i} correct figures`).toBe(nums(it[2]));
        expect(new Set([correct, ...wrong]).size, `${clause}#${i}`).toBe(4);
        expect(/[一-鿿]/.test([q, correct, why, ...wrong].join('')), `${clause}#${i} stray CJK`).toBe(false);
      });
    }
  });
  it('served questions carry Hindi whose options are in the same order as the English ones', () => {
    for (const g of BLOOM_GENERATORS) {
      for (let s = 1; s <= 8; s++) {
        const q = makeQuestion(g.skill, s);
        const hi = q.hi!;
        expect(hi, q.id).toBeDefined();
        const en = q.parts[0]!.options!,
          correctAt = en.indexOf(q.parts[0]!.answer);
        expect(hi.options![0]!.length).toBe(4);
        expect(nums(hi.options![0]![correctAt]!), q.id).toBe(nums(q.parts[0]!.answer));
        expect(hi.parts.length).toBe(1);
        expect(hi.hints.length).toBe(q.hints.length);
      }
    }
  });
});
