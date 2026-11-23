import { describe, expect, it } from 'vitest';
import { DAY_MS, dueReviews, gradeOf, relativeDay, reviewCards, reviewSummary, skillTitle, upcomingReviews } from '../src/review';
import type { Attempt } from '../src/progress';
import { SKILLS } from '../src/questions';

/**
 * Independent oracle: the interval sequence below is worked out by hand from SuperMemo-2, NOT read back from the
 * implementation. Starting ease 2.5, every clean answer adds 0.1:
 *   n=1 → 1 day (ease 2.6) · n=2 → 6 days (2.7) · n=3 → round(6 × 2.8) = 17 · n=4 → round(17 × 2.9) = 49
 *   n=5 → round(49 × 3.0) = 147 (ease capped at 3.0)
 * A miss drops ease by 0.8 (q=0), resets reps and brings the card back after 1 day.
 */
const DAY = (n: number) => n * DAY_MS;
const attempt = (t: number, over: Partial<Attempt> = {}): Attempt => ({
  t,
  skill: 'journal-entry',
  clause: 'XI.2.journal',
  seed: 1,
  mode: 'PRACTICE',
  marks: 1,
  outOf: 1,
  hintsUsed: 0,
  mistakes: [],
  correctParts: 1,
  parts: 1,
  ...over,
});

describe('gradeOf', () => {
  it('maps marks to SM-2 quality and charges one grade for a hint', () => {
    expect(gradeOf(attempt(0))).toBe(5);
    expect(gradeOf(attempt(0, { marks: 0 }))).toBe(0);
    expect(gradeOf(attempt(0, { marks: 4, outOf: 5 }))).toBe(4);
    expect(gradeOf(attempt(0, { marks: 3, outOf: 5 }))).toBe(3);
    expect(gradeOf(attempt(0, { marks: 1, outOf: 1, hintsUsed: 1 }))).toBe(4);
    expect(gradeOf(attempt(0, { marks: 1, outOf: 1, hintsUsed: 3 }))).toBe(4); // only one grade is charged
    expect(gradeOf(attempt(0, { marks: 0, outOf: 0 }))).toBe(0);
  });
});

describe('reviewCards', () => {
  it('starts a clean first answer on a one-day interval and a 2.6 ease', () => {
    const [c] = reviewCards([attempt(DAY(0))]);
    expect(c).toMatchObject({ skill: 'journal-entry', intervalDays: 1, reps: 1, lapses: 0, ease: 2.6, dueAt: DAY(1), lastScore: 1 });
  });

  it('follows the hand-worked SM-2 sequence 1, 6, 17, 49, 147', () => {
    const days = [0, 2, 9, 27, 77];
    const cards = reviewCards(days.map((d, i) => attempt(DAY(d) + i)));
    expect(cards).toHaveLength(1);
    const c = cards[0]!;
    // the last attempt (day 77) schedules 147 days out
    expect(c.dueAt).toBe(DAY(77) + 4 + 147 * DAY_MS);
    expect(c.intervalDays).toBe(147);
    expect(c.ease).toBe(3.0);

    const step = (n: number) => reviewCards(days.slice(0, n).map((d, i) => attempt(DAY(d) + i)))[0]!;
    expect([step(1).intervalDays, step(2).intervalDays, step(3).intervalDays, step(4).intervalDays, step(5).intervalDays]).toEqual([1, 6, 17, 49, 147]);
  });

  it('a miss resets the streak, records a lapse and returns in one day; the next two answers rebuild 1 → 6', () => {
    const a = [attempt(DAY(0)), attempt(DAY(2)), attempt(DAY(9), { marks: 0 }), attempt(DAY(10)), attempt(DAY(12))];
    const c = reviewCards(a)[0]!;
    expect(c.lapses).toBe(1);
    expect(c.reps).toBe(2); // two clean answers after the miss
    expect(c.intervalDays).toBe(6);
    expect(c.dueAt).toBe(DAY(12) + 6 * DAY_MS);
    // ease: 2.5 → 2.6 → 2.7 → miss 1.9 → 2.0 → 2.1
    expect(c.ease).toBeCloseTo(2.1, 10);
  });

  it('partial marks grade 3 (success) and a hint lowers the grade without breaking the schedule', () => {
    const partial = reviewCards([attempt(DAY(0), { marks: 3, outOf: 5 })])[0]!;
    expect(partial.ease).toBeCloseTo(2.36, 10);
    expect(partial.intervalDays).toBe(1);
    const hinted = reviewCards([attempt(DAY(0), { hintsUsed: 1 })])[0]!;
    expect(hinted.ease).toBe(2.5);
  });

  it('never lets ease fall below 1.3 however many misses in a row', () => {
    const cards = reviewCards(Array.from({ length: 8 }, (_, i) => attempt(DAY(i), { marks: 0 })));
    expect(cards[0]!.ease).toBe(1.3);
    expect(cards[0]!.lapses).toBe(8);
  });

  it('is deterministic and independent of input order', () => {
    const xs = [attempt(DAY(3)), attempt(DAY(0)), attempt(DAY(6), { skill: 'dep-wdv', clause: 'XI.6.dep' })];
    const a = reviewCards(xs),
      b = reviewCards([...xs].reverse());
    expect(a).toEqual(b);
  });

  it('keeps one card per skill and remembers each skill’s own clause', () => {
    const cards = reviewCards([attempt(DAY(0)), attempt(DAY(1), { skill: 'dep-wdv', clause: 'XI.6.dep' }), attempt(DAY(2))]);
    expect(cards.map(c => c.skill).sort()).toEqual(['dep-wdv', 'journal-entry']);
    expect(cards.find(c => c.skill === 'dep-wdv')!.clause).toBe('XI.6.dep');
  });
});

describe('dueReviews', () => {
  it('returns only cards whose day has come, most overdue first, ties by skill id', () => {
    const xs = [attempt(DAY(0), { skill: 'b-skill' }), attempt(DAY(0), { skill: 'a-skill' }), attempt(DAY(5), { skill: 'c-skill' })];
    expect(dueReviews(xs, DAY(1)).map(c => c.skill)).toEqual(['a-skill', 'b-skill']); // due exactly now
    expect(dueReviews(xs, DAY(0))).toEqual([]);
    expect(dueReviews(xs, DAY(6)).map(c => c.skill)).toEqual(['a-skill', 'b-skill', 'c-skill']);
  });

  it('an overdue card shows how late it is', () => {
    const now = new Date(2026, 0, 10, 12).getTime(); // local noon, 10 Jan 2026
    const card = reviewCards([attempt(now - 3 * DAY_MS)])[0]!; // due 2 days ago
    expect(relativeDay(card.dueAt, now)).toBe('2 days overdue');
    expect(relativeDay(now + DAY_MS, now)).toBe('tomorrow');
    expect(relativeDay(now, now)).toBe('today');
  });
});

describe('upcomingReviews', () => {
  it('buckets cards into the next seven calendar days and keeps every card once', () => {
    const now = new Date(2026, 0, 10, 12).getTime();
    const xs = [
      attempt(now - 2 * DAY_MS), // due 1 day ago → bucket 0
      attempt(now, { skill: 'same-day' }), // due tomorrow → bucket 1
      attempt(now + 3 * DAY_MS, { skill: 'later' }), // due in 4 days → bucket 4
      attempt(now - 30 * DAY_MS, { skill: 'far' }), // due weeks ago → bucket 0
    ];
    const days = upcomingReviews(xs, now, 7);
    expect(days).toHaveLength(7);
    expect(days[0]!.cards.map(c => c.skill).sort()).toEqual(['far', 'journal-entry']);
    expect(days[1]!.cards.map(c => c.skill)).toEqual(['same-day']);
    expect(days[4]!.cards.map(c => c.skill)).toEqual(['later']);
    expect(days.flatMap(d => d.cards)).toHaveLength(4);
  });
});

describe('reviewSummary', () => {
  it('counts due vs scheduled and offers the most overdue card first', () => {
    const now = DAY(10);
    const xs = [attempt(DAY(0)), attempt(DAY(9), { skill: 'dep-wdv' }), attempt(DAY(8), { skill: 'tb-agree', marks: 0 }), attempt(DAY(10), { skill: 'brand-new' })];
    const s = reviewSummary(xs, now);
    expect(s.due).toBe(3); // journal-entry (due day 1), tb-agree (re-queued day 9), dep-wdv (due exactly now)
    expect(s.scheduled).toBe(1); // brand-new comes back tomorrow
    expect(s.first?.skill).toBe('journal-entry'); // the most overdue card comes first
    expect(s.shaky).toBe(1); // only tb-agree has lapsed
  });

  it('is empty for a student who has not practised yet', () => {
    expect(reviewSummary([], Date.now())).toEqual({ due: 0, scheduled: 0, first: null, shaky: 0 });
  });
});

describe('skillTitle', () => {
  it('uses the syllabus title when known and the raw id otherwise', () => {
    const known = SKILLS[0]!;
    expect(skillTitle(known.skill)).toBe(known.title);
    expect(skillTitle('rules-trainer')).toBe('rules-trainer'); // hand-made practice rows have no generator entry
    expect(skillTitle('nope')).toBe('nope');
  });
});
