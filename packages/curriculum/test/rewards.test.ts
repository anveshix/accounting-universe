import { describe, expect, it } from 'vitest';
import { attemptXp, computeRewards, dayKey, levelOf, rewardDelta, xpForLevel, type Attempt } from '../src';

const DAY = 86400000, T0 = Date.UTC(2026, 0, 10, 12);   // noon UTC
const at = (o: Partial<Attempt> = {}): Attempt => ({ t: T0, skill: 's', clause: 'XI.2.a', seed: 1, mode: 'BEGINNER', marks: 5, outOf: 5, hintsUsed: 0, mistakes: [], correctParts: 1, parts: 1, ...o });

describe('XP', () => {
  it('hand-worked: full marks Beginner no hints = 20 + 5 bonus = 25', () => expect(attemptXp(at(), []).xp).toBe(25));
  it('Board doubles base: 40 + 5 = 45; Practice 1.5x: 30 + 5 = 35', () => { expect(attemptXp(at({ mode: 'BOARD' }), []).xp).toBe(45); expect(attemptXp(at({ mode: 'PRACTICE' }), []).xp).toBe(35); });
  it('half marks, 2 hints, Beginner: 10 - 4 = 6, no perfect bonus', () => expect(attemptXp(at({ marks: 5, outOf: 10, hintsUsed: 2 }), []).xp).toBe(6));
  it('zero marks earns 0 (never negative)', () => expect(attemptXp(at({ marks: 0, hintsUsed: 3 }), []).xp).toBe(0));
  it('comeback: full marks after a mistake on the same skill adds 10', () => {
    const r = attemptXp(at({ t: T0 + 1 }), [at({ marks: 0, mistakes: ['x'] })]); expect(r).toEqual({ xp: 35, comeback: true });
  });
});
describe('levels', () => {
  it('thresholds 0, 50, 150, 300', () => { expect([1, 2, 3, 4].map(xpForLevel)).toEqual([0, 50, 150, 300]); });
  it('xp 149 is level 2 with 99 of 100 done; 150 is level 3', () => { expect(levelOf(149)).toMatchObject({ level: 2, into: 99, span: 100 }); expect(levelOf(150).level).toBe(3); expect(levelOf(0).title).toBe('Apprentice'); expect(levelOf(300).title).toBe('Bookkeeper'); });
});
describe('streaks and daily goal', () => {
  const tz = 330;
  it('IST day boundary: 19:00 UTC is already the next day in India', () => expect(dayKey(Date.UTC(2026, 0, 10, 19), tz)).toBe('2026-01-11'));
  it('3 consecutive days = streak 3; gap resets; yesterday still counts today', () => {
    const a = [0, 1, 2].map(d => at({ t: T0 + d * DAY }));
    expect(computeRewards({ attempts: a, seen: [], now: T0 + 2 * DAY, tzOffsetMin: 0 }).streak).toBe(3);
    expect(computeRewards({ attempts: a, seen: [], now: T0 + 3 * DAY, tzOffsetMin: 0 }).streak).toBe(3);
    expect(computeRewards({ attempts: a, seen: [], now: T0 + 4 * DAY, tzOffsetMin: 0 }).streak).toBe(0);
    expect(computeRewards({ attempts: [a[0]!, a[2]!], seen: [], now: T0 + 2 * DAY, tzOffsetMin: 0 })).toMatchObject({ streak: 1, bestStreak: 1 });
  });
  it('daily goal met at 30 XP; merely opening pages earns nothing and never extends a streak', () => {
    const r = computeRewards({ attempts: [at()], seen: [{ lab: 'l', tab: 'learn', t: T0 }, { lab: 'l', tab: 'learn', t: T0 + 5 }], now: T0, tzOffsetMin: 0 });
    expect(r.xp).toBe(25); expect(r.goalMet).toBe(false); expect(r.days).toHaveLength(14); expect(r.days[13]!.xp).toBe(25);
    const visitsOnly = computeRewards({ attempts: [], seen: [{ lab: 'l', tab: 'learn', t: T0 }, { lab: 'm', tab: 'example', t: T0 }], now: T0, tzOffsetMin: 0 });
    expect(visitsOnly).toMatchObject({ xp: 0, streak: 0, bestStreak: 0, goalMet: false });
    const wrong = Array.from({ length: 10 }, (_, k) => at({ t: T0 + k, marks: 0, hintsUsed: 0 }));
    expect(computeRewards({ attempts: wrong, seen: [], now: T0 + 20, tzOffsetMin: 0 }).badges).not.toContain('hint-free-10');   // ten wrong guesses are not "Own Brain"
  });
});
describe('badges and delta', () => {
  it('first entry badge and Week Warrior need real days', () => {
    const a = Array.from({ length: 7 }, (_, d) => at({ t: T0 + d * DAY }));
    const r = computeRewards({ attempts: a, seen: [], now: T0 + 6 * DAY, tzOffsetMin: 0 });
    expect(r.badges).toEqual(expect.arrayContaining(['first-entry', 'streak-3', 'streak-7'])); expect(r.badges).toContain('perfect-5'); expect(r.badges).not.toContain('explorer');
  });
  it('rewardDelta reports xp, level-up and new badge on the attempt that crosses the line', () => {
    const base = { attempts: [at({ t: T0 - 1, mode: 'BOARD' })], seen: [], now: T0, tzOffsetMin: 0 };   // 45 xp, level 1
    const d = rewardDelta(base, at({ mode: 'PRACTICE', t: T0 }));                                          // +35 -> 80 -> level 2
    expect(d.xp).toBe(35); expect(d.levelUp?.level).toBe(2); expect(d.newBadges).toEqual([]); expect(d.goalJustMet).toBe(false);
    expect(rewardDelta({ ...base, attempts: [] }, at()).newBadges.map(b => b.id)).toEqual(['first-entry']);
  });
});
