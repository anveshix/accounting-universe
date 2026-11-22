import { describe, expect, it } from 'vitest';
import { CLAUSES, STUDY, STUDY_HI, TITLE_HI, studyOf } from '../src';

const DEVANAGARI = /[ऀ-ॿ]/;
/** Every number in a text (₹ figures with Indian commas, decimals, ratios): a translation must not change any of them. */
const nums = (...texts: (string | undefined)[]) =>
  texts
    .join(' ')
    .match(/\d[\d,]*(?:\.\d+)?/g)
    ?.map(x => x.replace(/,$/, ''))
    .sort() ?? [];

describe('Hindi study guide (draft, unreviewed)', () => {
  it('every one of the 54 topics has a Hindi title with Devanagari, and there are no extras', () => {
    for (const c of CLAUSES) {
      expect(TITLE_HI[c.id], c.id).toBeDefined();
      expect(TITLE_HI[c.id], c.id).toMatch(DEVANAGARI);
    }
    expect(Object.keys(TITLE_HI).sort()).toEqual(CLAUSES.map(c => c.id).sort());
  });
  it('the Hindi titles keep every number of the English titles (AS 26, 1932, 3 …)', () => {
    for (const c of CLAUSES) expect(nums(TITLE_HI[c.id]), c.id).toEqual(nums(c.title));
  });
  it('each Hindi guide belongs to a real topic and has Devanagari text', () => {
    expect(Object.keys(STUDY_HI).length).toBeGreaterThanOrEqual(12);
    for (const [id, g] of Object.entries(STUDY_HI)) {
      expect(studyOf(id), id).toBeDefined();
      for (const t of [g.summary, ...g.mustKnow, ...(g.formats ?? []), ...(g.steps ?? []), ...g.mistakes, g.asked, g.example.q, g.example.a]) expect(t, id).toMatch(DEVANAGARI);
    }
  });
  it('the lists line up with the English ones (same number of points, formats, steps and mistakes)', () => {
    for (const [id, g] of Object.entries(STUDY_HI)) {
      const e = STUDY[id]!;
      expect(g.mustKnow.length, `${id} mustKnow`).toBe(e.mustKnow.length);
      expect(g.mistakes.length, `${id} mistakes`).toBe(e.mistakes.length);
      expect(g.formats?.length, `${id} formats`).toBe(e.formats?.length);
      expect(g.steps?.length, `${id} steps`).toBe(e.steps?.length);
    }
  });
  it('NO figure is changed by the translation: every number in the English example and rules appears the same number of times in the Hindi', () => {
    for (const [id, g] of Object.entries(STUDY_HI)) {
      const e = STUDY[id]!;
      expect(nums(g.example.q, g.example.a), `${id} example`).toEqual(nums(e.example!.q, e.example!.a));
      expect(nums(...g.mustKnow), `${id} mustKnow`).toEqual(nums(...e.mustKnow));
      expect(nums(...(g.formats ?? [])), `${id} formats`).toEqual(nums(...(e.formats ?? [])));
    }
  });
  it('the Hindi never teaches a topic the syllabus excludes, except to say it is excluded', () => {
    const banned = /टुकड़ों में वितरण|पेशकश|ब्याज.{0,12}याचना बकाया|मोचन प्रविष्टि|(?<!अ)प्रत्यक्ष पद्धति/;
    for (const [id, g] of Object.entries(STUDY_HI)) expect([g.summary, ...g.mustKnow, ...g.mistakes, g.example.q, g.example.a].join(' '), id).not.toMatch(banned);
  });
});
