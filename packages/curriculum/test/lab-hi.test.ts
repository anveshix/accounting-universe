import { describe, expect, it } from 'vitest';
import { ALL_LABS } from '../../../apps/web/src/labs';
import { LAB_HI } from '../../../apps/web/src/labs/hi';

const nums = (s: string) => (s.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(x => x.replace(/,/g, '')).sort();

describe('Hindi lab text (draft)', () => {
  it('only covers labs that exist, with the same number of walkthrough steps and concept paragraphs', () => {
    for (const [id, hi] of Object.entries(LAB_HI)) {
      const en = ALL_LABS.find(l => l.id === id);
      expect(en, id).toBeDefined();
      expect(hi.walkthrough.length, id).toBe(en!.walkthrough.length);
      expect(hi.concept.length, id).toBe(en!.concept.length);
    }
  });
  it('every walkthrough step carries exactly the same figures as the English one (no translation can change a number)', () => {
    for (const [id, hi] of Object.entries(LAB_HI)) {
      const en = ALL_LABS.find(l => l.id === id)!;
      hi.walkthrough.forEach((line, i) => expect(nums(line), `${id} step ${i + 1}`).toEqual(nums(en.walkthrough[i]!)));
      expect(nums(hi.realWorld), `${id} realWorld`).toEqual(nums(en.realWorld));
    }
  });
  it('is written in Devanagari and names the four highest-traffic labs', () => {
    expect(Object.keys(LAB_HI).sort()).toEqual(['xi-brs', 'xi-depreciation', 'xi-final-accounts', 'xii-admission']);
    for (const hi of Object.values(LAB_HI)) for (const t of [hi.title, hi.summary, ...hi.concept, hi.realWorld, ...hi.walkthrough]) expect(t).toMatch(/[ऀ-ॿ]/);
  });
});
