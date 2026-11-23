/**
 * Rewards: XP, levels, streaks, daily goal, badges. Pure and DERIVED from the stored attempts + seen events (nothing extra
 * is stored, so it can never drift from real work). XP is earned for effort and correctness, never for time spent or clicks.
 */
import type { Attempt, Seen } from './progress';

export const DAILY_GOAL_XP = 30;
const MODE_HALVES = { BEGINNER: 2, PRACTICE: 3, BOARD: 4 } as const;   // x1, x1.5, x2 in halves: integer maths only
export const XP_FIRST_SEEN = 5, XP_PERFECT = 5, XP_COMEBACK = 10, HINT_COST = 2;
/** Each visual-simulator challenge solved (a `sim:<id>` seen event with tab 'example') earns this once. */
export const XP_SIM_SOLVED = 10;
/** How many simulator challenges unlock the Visual Thinker badge. */
export const SIM_BADGE_AT = 5;

/** XP for one attempt, given the attempts before it. */
export function attemptXp(a: Attempt, before: readonly Attempt[]): { xp: number; comeback: boolean } {
  const frac = a.outOf === 0 ? 0 : Math.floor((20 * a.marks) / a.outOf);
  const mult = Math.floor((frac * MODE_HALVES[a.mode]) / 2);
  const hintCost = Math.min(mult, a.hintsUsed * HINT_COST);
  const full = a.marks === a.outOf && a.outOf > 0;
  const prev = [...before].reverse().find(b => b.skill === a.skill);
  const comeback = full && !!prev && prev.mistakes.length > 0;
  return { xp: mult - hintCost + (full && a.hintsUsed === 0 ? XP_PERFECT : 0) + (comeback ? XP_COMEBACK : 0), comeback };
}

export interface DayXp { readonly day: string; readonly xp: number }
/** Local calendar day key YYYY-MM-DD for a timestamp; `tzOffsetMin` is minutes EAST of UTC (IST = 330). */
export function dayKey(t: number, tzOffsetMin: number): string { return new Date(t + tzOffsetMin * 60000).toISOString().slice(0, 10); }
const dayNum = (k: string) => Math.floor(Date.parse(k + 'T00:00:00Z') / 86400000);

export interface LevelInfo { readonly level: number; readonly into: number; readonly span: number; readonly title: string }
export const xpForLevel = (l: number) => 25 * l * (l - 1);            // L1 0, L2 50, L3 150, L4 300 ...
const TITLES = ['Apprentice', 'Bookkeeper', 'Ledger Keeper', 'Accountant', 'Auditor', 'Chartered Mind'];
export function levelOf(xp: number): LevelInfo {
  let l = 1; while (xpForLevel(l + 1) <= xp) l++;
  return { level: l, into: xp - xpForLevel(l), span: xpForLevel(l + 1) - xpForLevel(l), title: TITLES[Math.min(TITLES.length - 1, Math.floor((l - 1) / 3))]! };
}

export interface BadgeDef { readonly id: string; readonly title: string; readonly how: string; readonly icon: string }
export const BADGES: readonly BadgeDef[] = [
  { id: 'first-entry', title: 'First Entry', how: 'Complete your first practice question', icon: '✍️' },
  { id: 'perfect-5', title: 'Perfect Five', how: 'Score full marks, no hints, 5 times', icon: '🎯' },
  { id: 'comeback', title: 'Comeback', how: 'Get a skill right after getting it wrong', icon: '🔁' },
  { id: 'streak-3', title: 'On a Roll', how: 'Learn 3 days in a row', icon: '🔥' },
  { id: 'streak-7', title: 'Week Warrior', how: 'Learn 7 days in a row', icon: '🏆' },
  { id: 'explorer', title: 'Explorer', how: 'Open 10 different labs or cards', icon: '🧭' },
  { id: 'hint-free-10', title: 'Own Brain', how: '10 hint-free attempts', icon: '🧠' },
  { id: 'master', title: 'Board Ready', how: 'Reach level 5 on any topic', icon: '🎓' },
  { id: 'visual-thinker', title: 'Visual Thinker', how: `Solve ${SIM_BADGE_AT} visual-simulator challenges (chapter-wise “show me” pages)`, icon: '🔭' },
];

export interface Rewards {
  readonly xp: number; readonly level: LevelInfo; readonly streak: number; readonly bestStreak: number;
  readonly today: number; readonly goalMet: boolean; readonly days: readonly DayXp[]; readonly badges: readonly string[];
  /** Distinct visual-simulator challenges solved (drives the gallery and the Visual Thinker badge). */
  readonly simsSolved: number;
}
export interface RewardInput { readonly attempts: readonly Attempt[]; readonly seen: readonly Seen[]; readonly now: number; readonly tzOffsetMin: number; readonly masteredClauses?: number }

export function computeRewards(i: RewardInput): Rewards {
  const events: { t: number; xp: number }[] = [];
  const sorted = [...i.attempts].sort((a, b) => a.t - b.t);
  let comebacks = 0, perfect = 0, hintFree = 0;
  sorted.forEach((a, k) => {
    const r = attemptXp(a, sorted.slice(0, k)); events.push({ t: a.t, xp: r.xp });
    if (r.comeback) comebacks++;
    if (a.marks === a.outOf && a.outOf > 0 && a.hintsUsed === 0) perfect++;
    if (a.hintsUsed === 0) hintFree++;
  });
  const firstSeen = new Map<string, number>();
  for (const s of [...i.seen].sort((a, b) => a.t - b.t)) { const k = s.lab + '|' + s.tab; if (!firstSeen.has(k)) firstSeen.set(k, s.t); }
  for (const t of firstSeen.values()) events.push({ t, xp: XP_FIRST_SEEN });
  // A solved simulator challenge pays once per simulator. It is a real answer to a real question, so it earns XP —
  // but it is NOT an Attempt: it has no seed or marks, and must not pollute practice accuracy or the review queue.
  const simSolved = new Map<string, number>();
  for (const ev of [...i.seen].sort((a, b) => a.t - b.t)) if (ev.tab === 'example' && ev.lab.startsWith('sim:') && !simSolved.has(ev.lab)) simSolved.set(ev.lab, ev.t);
  for (const t of simSolved.values()) events.push({ t, xp: XP_SIM_SOLVED });
  const perDay = new Map<string, number>();
  for (const e of events) { const d = dayKey(e.t, i.tzOffsetMin); perDay.set(d, (perDay.get(d) ?? 0) + e.xp); }
  const xp = events.reduce((s, e) => s + e.xp, 0);

  const active = [...new Set(events.map(e => dayKey(e.t, i.tzOffsetMin)))].map(dayNum).sort((a, b) => a - b);
  let best = 0, run = 0;
  active.forEach((d, k) => { run = k > 0 && d === active[k - 1]! + 1 ? run + 1 : 1; best = Math.max(best, run); });
  const todayN = dayNum(dayKey(i.now, i.tzOffsetMin)), last = active[active.length - 1];
  // a streak survives until the end of the day AFTER the last active day, so studying "yesterday" still counts today
  let streak = 0;
  if (last !== undefined && todayN - last <= 1) { streak = 1; for (let k = active.length - 2; k >= 0 && active[k] === active[k + 1]! - 1; k--) streak++; }

  const today = perDay.get(dayKey(i.now, i.tzOffsetMin)) ?? 0;
  const days: DayXp[] = []; for (let k = 13; k >= 0; k--) { const key = new Date((todayN - k) * 86400000).toISOString().slice(0, 10); days.push({ day: key, xp: perDay.get(key) ?? 0 }); }
  const labs = new Set(i.seen.map(s => s.lab));
  const earned = [
    sorted.length >= 1 && 'first-entry', perfect >= 5 && 'perfect-5', comebacks >= 1 && 'comeback', best >= 3 && 'streak-3', best >= 7 && 'streak-7',
    labs.size >= 10 && 'explorer', hintFree >= 10 && 'hint-free-10', (i.masteredClauses ?? 0) >= 1 && 'master',
    simSolved.size >= SIM_BADGE_AT && 'visual-thinker',
  ].filter((x): x is string => !!x);
  return { xp, level: levelOf(xp), streak, bestStreak: best, today, goalMet: today >= DAILY_GOAL_XP, days, badges: earned, simsSolved: simSolved.size };
}

export interface Delta { readonly xp: number; readonly comeback: boolean; readonly levelUp: LevelInfo | null; readonly newBadges: readonly BadgeDef[]; readonly goalJustMet: boolean }
/** What just changed when `a` was recorded. Drives the celebration; null-safe when nothing was gained. */
export function rewardDelta(before: RewardInput, a: Attempt): Delta {
  const r0 = computeRewards(before), r1 = computeRewards({ ...before, attempts: [...before.attempts, a] });
  return { xp: r1.xp - r0.xp, comeback: attemptXp(a, before.attempts).comeback, levelUp: r1.level.level > r0.level.level ? r1.level : null,
    newBadges: BADGES.filter(b => r1.badges.includes(b.id) && !r0.badges.includes(b.id)), goalJustMet: r1.goalMet && !r0.goalMet };
}
