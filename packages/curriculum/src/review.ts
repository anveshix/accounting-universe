/**
 * Spaced review — WHEN to practise a skill again, derived from the attempt history.
 *
 * The app already stores every attempt; nothing extra is written. This module replays that history through a
 * SuperMemo-2 (SM-2) scheduler and answers three questions the UI asks:
 *   • which skills are due for revision now?          `dueReviews`
 *   • when will the rest come back?                   `upcomingReviews`
 *   • how much is scheduled / how many are overdue?   `reviewSummary`
 *
 * Why SM-2 and not FSRS? SM-2 is small enough to audit line by line (this repo's rule: pure logic with tests and an
 * independent oracle) and needs no model weights. The open-source `open-spaced-repetition/ts-fsrs` (MIT) is the
 * reference for the richer DSR model; adopting it is a later, deliberate upgrade — see docs/ENHANCEMENT_RESEARCH.md.
 *
 * No floats touch money: this file only counts days and scores, never rupees.
 */
import type { Attempt } from './progress';
import { SKILLS } from './questions';

export const DAY_MS = 86_400_000;
/** SM-2 ease factor bounds. 2.5 is the classic starting ease; below 1.3 a card is "hard" forever. */
export const MIN_EASE = 1.3,
  MAX_EASE = 3.0,
  START_EASE = 2.5;

export interface ReviewCard {
  readonly skill: string;
  readonly clause: string;
  /** When this skill should next be practised (epoch ms). */
  readonly dueAt: number;
  /** Gap in whole days between the last attempt and `dueAt`. */
  readonly intervalDays: number;
  readonly ease: number;
  /** Consecutive successful reviews; a lapse resets it to 0. */
  readonly reps: number;
  readonly lapses: number;
  readonly lastAt: number;
  /** Marks / outOf on the last attempt, 0..1. */
  readonly lastScore: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * SM-2 quality 0..5 from one attempt. Full marks is 5; a hint costs one grade (so hint-assisted perfection schedules
 * like a 4, which is "correct after a hesitation"); a completely blank answer is 0. Partial marks scale linearly.
 */
export function gradeOf(a: Attempt): number {
  const score = a.outOf > 0 ? a.marks / a.outOf : 0;
  const base = Math.round(score * 5);
  return clamp(base - (a.hintsUsed > 0 ? 1 : 0), 0, 5);
}

/** Interval (days) SM-2 assigns for a successful review. */
function intervalFor(reps: number, previousDays: number, ease: number): number {
  if (reps <= 1) return 1;
  if (reps === 2) return 6;
  return Math.max(1, Math.round(previousDays * ease));
}

/**
 * Replay every attempt (oldest first) into one card per skill. Deterministic: the same attempts in any order give the
 * same cards, because the replay sorts by time (ties keep their input order via a stable sort on the index).
 */
export function reviewCards(attempts: readonly Attempt[]): ReviewCard[] {
  const ordered = attempts.map((a, i) => ({ a, i })).sort((x, y) => x.a.t - y.a.t || x.i - y.i);
  const bySkill = new Map<string, ReviewCard>();
  for (const { a } of ordered) {
    const prev = bySkill.get(a.skill);
    const q = gradeOf(a);
    // Classic SM-2: the ease factor drifts down on misses and slowly up on clean answers.
    const ease = clamp((prev?.ease ?? START_EASE) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), MIN_EASE, MAX_EASE);
    const success = q >= 3;
    const reps = success ? (prev?.reps ?? 0) + 1 : 0;
    const intervalDays = success ? intervalFor(reps, prev?.intervalDays ?? 1, ease) : 1;
    bySkill.set(a.skill, {
      skill: a.skill,
      clause: a.clause,
      dueAt: a.t + intervalDays * DAY_MS,
      intervalDays,
      ease,
      reps,
      lapses: (prev?.lapses ?? 0) + (success ? 0 : 1),
      lastAt: a.t,
      lastScore: a.outOf > 0 ? a.marks / a.outOf : 0,
    });
  }
  return [...bySkill.values()];
}

/** Cards whose due time has passed, most overdue first, then by skill id so the order is stable. */
export function dueReviews(attempts: readonly Attempt[], now: number): ReviewCard[] {
  return reviewCards(attempts)
    .filter(c => c.dueAt <= now)
    .sort((x, y) => x.dueAt - y.dueAt || x.skill.localeCompare(y.skill));
}

export interface ReviewDay {
  readonly at: number;
  readonly cards: ReviewCard[];
}
/** Reviews due on each of the next `days` calendar days (day 0 = everything already due). For a "coming up" strip. */
export function upcomingReviews(attempts: readonly Attempt[], now: number, days = 7): ReviewDay[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const midnight = start.getTime();
  const out: ReviewDay[] = [];
  for (let d = 0; d < days; d++) out.push({ at: midnight + d * DAY_MS, cards: [] });
  for (const c of reviewCards(attempts)) {
    const d = Math.floor((c.dueAt - midnight) / DAY_MS);
    if (d < 0)
      out[0]!.cards.push(c); // already overdue: start the strip at "today"
    else if (d < days) out[d]!.cards.push(c);
  }
  return out.map(day => ({ at: day.at, cards: day.cards.sort((x, y) => x.dueAt - y.dueAt || x.skill.localeCompare(y.skill)) }));
}

export interface ReviewSummary {
  /** Practised at least once, and due now. */
  readonly due: number;
  /** Practised at least once, not yet due. */
  readonly scheduled: number;
  /** The single skill to start with, if anything is due. */
  readonly first: ReviewCard | null;
  /** Earned revision "lapses" — skills answered badly and re-queued. */
  readonly shaky: number;
}
export function reviewSummary(attempts: readonly Attempt[], now: number): ReviewSummary {
  const cards = reviewCards(attempts);
  const due = cards.filter(c => c.dueAt <= now).sort((x, y) => x.dueAt - y.dueAt || x.skill.localeCompare(y.skill));
  return { due: due.length, scheduled: cards.length - due.length, first: due[0] ?? null, shaky: cards.filter(c => c.lapses > 0).length };
}

/** Human title for a skill id, falling back to the id itself for hand-made practice rows such as the rules trainer. */
export function skillTitle(skill: string): string {
  return SKILLS.find(s => s.skill === skill)?.title ?? skill;
}

/** "3 days" / "today" / "tomorrow" — the short label the review list shows instead of a timestamp. */
export function relativeDay(dueAt: number, now: number): string {
  const midnight = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const whole = Math.round((midnight(dueAt) - midnight(now)) / DAY_MS);
  if (whole <= 0) return whole === 0 ? 'today' : `${-whole} day${whole === -1 ? '' : 's'} overdue`;
  if (whole === 1) return 'tomorrow';
  return `in ${whole} days`;
}
