import { describe, expect, it } from 'vitest';
import { CLAUSES, studyOf } from '../src';
import { CHECK } from './study-checklist';

/** The notes of a topic (everything a student reads) as one text. */
const textOf = (id: string) => {
  const g = studyOf(id)!;
  return [g.summary, ...g.mustKnow, ...(g.extra ?? []), ...(g.formats ?? []), ...(g.steps ?? []), ...g.mistakes, g.asked, g.example?.q ?? '', g.example?.a ?? ''].join(' \n ');
};

describe('every official sub-topic of the CBSE 2026-27 syllabus is taught in the notes of its topic', () => {
  it('there is a checklist for every one of the 54 topics', () => {
    for (const c of CLAUSES) expect(CHECK[c.id]?.length, c.id).toBeGreaterThan(0);
    expect(Object.keys(CHECK).sort()).toEqual(CLAUSES.map(c => c.id).sort());
  });
  it.each(CLAUSES.map(c => c.id))('%s: nothing from the official list is missing', id => {
    const text = textOf(id);
    const missing = CHECK[id]!.filter(([, re]) => !re.test(text)).map(([label]) => label);
    expect(missing, `${id} does not teach: ${missing.join('; ')}`).toEqual([]);
  });
  it('the checklist covers a meaningful number of official sub-topics (276)', () => {
    expect(Object.values(CHECK).reduce((s, v) => s + v.length, 0)).toBeGreaterThanOrEqual(270);
  });
});
