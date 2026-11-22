/**
 * Practice PAPER builder: a full-length paper in the CBSE board pattern, with a marking scheme.
 *
 * What is official (docs/CBSE_2026_27_SYLLABUS_MATRIX.md §4, from the Class XII Sample Question Paper 2026-27):
 *   34 questions, 80 marks, 3 hours: twenty 1-mark, six 3-mark, three 4-mark and five 6-mark questions;
 *   Part A = Q1-26 = 60 marks (16×1 + 4×3 + 2×4 + 4×6), Part B = Q27-34 = 20 marks (4×1 + 2×3 + 1×4 + 1×6);
 *   internal choice in two 3-mark, two 4-mark and two 6-mark questions; typology weighting 40/30/30 (32/24/24 marks).
 * What is this app's own choice (and the paper says so): how the official unit marks are split across the slots, and, because the
 *   generators make small questions, a 3/4/6-mark slot is often filled by a COMPOSITE of two or three linked smaller questions from the same unit.
 *   The report counts them honestly.
 * Class XI: the official marks table (12 / 44 / 24) is used, but no Class XI sample paper has been published, so the question pattern is borrowed
 *   from Class XII and the paper is labelled "practice pattern, not official" (decision D7).
 * Every answer comes from the question generators (which use the engine); the paper never invents a figure.
 */
import { Rng } from './rng';
import { ALL_GENERATORS, makeQuestion, type Question, type Typology } from './questions';
import { UNITS } from './syllabus';

export type PaperClass = 'XI' | 'XII';
export type PaperRoute = 'OPTION_I_ANALYSIS' | 'OPTION_II_COMPUTERISED';
export type SlotMarks = 1 | 3 | 4 | 6;
export interface Slot {
  readonly no: number;
  readonly part: 'A' | 'B';
  readonly unit: string;
  readonly marks: SlotMarks;
  readonly typology: Typology;
  readonly choice: boolean;
}

// ───────────────────────── blueprints ─────────────────────────
type Row = readonly [unit: string, marks: SlotMarks, typology: Typology, choice?: boolean];
const toSlots = (part: 'A' | 'B', rows: readonly Row[], from: number): Slot[] => rows.map((r, i) => ({ no: from + i, part, unit: r[0], marks: r[1], typology: r[2], choice: r[3] === true }));

/** Class XII Part A (Q1-26): XII.1 = 36 marks, XII.2 = 24 marks. */
const XII_A: readonly Row[] = [
  // 1-mark ×16 (8 + 8)
  ['XII.1', 1, 'RU'],
  ['XII.1', 1, 'RU'],
  ['XII.1', 1, 'RU'],
  ['XII.1', 1, 'RU'],
  ['XII.1', 1, 'RU'],
  ['XII.1', 1, 'AP'],
  ['XII.1', 1, 'RU'],
  ['XII.1', 1, 'AEC'],
  ['XII.2', 1, 'RU'],
  ['XII.2', 1, 'RU'],
  ['XII.2', 1, 'RU'],
  ['XII.2', 1, 'RU'],
  ['XII.2', 1, 'RU'],
  ['XII.2', 1, 'AP'],
  ['XII.2', 1, 'RU'],
  ['XII.2', 1, 'AEC'],
  // 3-mark ×4 (two with internal choice)
  ['XII.1', 3, 'RU', true],
  ['XII.1', 3, 'AP'],
  ['XII.2', 3, 'AEC', true],
  ['XII.2', 3, 'AP'],
  // 4-mark ×2 (one with internal choice)
  ['XII.1', 4, 'AP', true],
  ['XII.2', 4, 'AEC'],
  // 6-mark ×4 (one with internal choice in Part A; the other choice is in Part B)
  ['XII.1', 6, 'AP', true],
  ['XII.1', 6, 'AEC'],
  ['XII.1', 6, 'AP'],
  ['XII.2', 6, 'AEC'],
];
/** Class XII Part B, Option I (Q27-34): XII.3 = 12 marks, XII.4 = 8 marks. */
const XII_B1: readonly Row[] = [
  ['XII.3', 1, 'RU'],
  ['XII.3', 1, 'AP'],
  ['XII.4', 1, 'RU'],
  ['XII.4', 1, 'RU'],
  ['XII.4', 3, 'AP'],
  ['XII.4', 3, 'RU'],
  ['XII.3', 4, 'RU', true],
  ['XII.3', 6, 'AP', true],
];
/** Class XII Part B, Option II (Q27-34): XII.C = 20 marks. */
const XII_B2: readonly Row[] = [
  ['XII.C', 1, 'RU'],
  ['XII.C', 1, 'AP'],
  ['XII.C', 1, 'RU'],
  ['XII.C', 1, 'RU'],
  ['XII.C', 3, 'AP'],
  ['XII.C', 3, 'RU'],
  ['XII.C', 4, 'RU', true],
  ['XII.C', 6, 'AP', true],
];
/** Class XI practice pattern: the official unit marks (XI.1 = 12, XI.2 = 44, XI.3 = 24) with the Class XII question pattern. */
const XI_ROWS: readonly Row[] = [
  // 1-mark ×20: XI.1 ×6, XI.3 ×2, XI.2 ×12
  ['XI.1', 1, 'RU'],
  ['XI.1', 1, 'RU'],
  ['XI.1', 1, 'RU'],
  ['XI.1', 1, 'RU'],
  ['XI.1', 1, 'RU'],
  ['XI.1', 1, 'AP'],
  ['XI.2', 1, 'RU'],
  ['XI.2', 1, 'RU'],
  ['XI.2', 1, 'RU'],
  ['XI.2', 1, 'RU'],
  ['XI.2', 1, 'RU'],
  ['XI.2', 1, 'RU'],
  ['XI.2', 1, 'AP'],
  ['XI.2', 1, 'AP'],
  ['XI.2', 1, 'AEC'],
  ['XI.2', 1, 'AEC'],
  ['XI.2', 1, 'RU'],
  ['XI.2', 1, 'RU'],
  ['XI.3', 1, 'RU'],
  ['XI.3', 1, 'AP'],
  // 3-mark ×6: XI.1 ×2, XI.3 ×2, XI.2 ×2
  ['XI.1', 3, 'RU', true],
  ['XI.1', 3, 'RU'],
  ['XI.2', 3, 'AP', true],
  ['XI.2', 3, 'AEC'],
  ['XI.3', 3, 'AP'],
  ['XI.3', 3, 'AEC'],
  // 4-mark ×3: XI.2 ×2, XI.3 ×1
  ['XI.2', 4, 'AP', true],
  ['XI.2', 4, 'AEC'],
  ['XI.3', 4, 'AP', true],
  // 6-mark ×5: XI.2 ×3, XI.3 ×2
  ['XI.2', 6, 'AP'],
  ['XI.2', 6, 'AP', true],
  ['XI.2', 6, 'AEC'],
  ['XI.3', 6, 'AP', true],
  ['XI.3', 6, 'AEC'],
];

/** Typology for XI is assigned by the rows above; the totals are checked in the tests (32 / 24 / 24). */
export function blueprint(cls: PaperClass, route: PaperRoute = 'OPTION_I_ANALYSIS'): Slot[] {
  if (cls === 'XI') {
    // order for printing: by mark size within the unit order, numbered 1..34
    const order = (r: Row) => [UNITS.findIndex(u => u.id === r[0]), r[1]] as const;
    const rows = [...XI_ROWS].sort((a, b) => order(a)[0] - order(b)[0] || order(a)[1] - order(b)[1]);
    const part = (i: number) => (i < 26 ? 'A' : 'B') as 'A' | 'B';
    return withTypology(rows.map((r, i) => ({ no: i + 1, part: part(i), unit: r[0], marks: r[1], typology: r[2], choice: r[3] === true })));
  }
  return withTypology([...toSlots('A', XII_A, 1), ...toSlots('B', route === 'OPTION_I_ANALYSIS' ? XII_B1 : XII_B2, 27)]);
}

/** Typology target of the paper design: 40 % Remembering and Understanding, 30 % Applying, 30 % Analysing / Evaluating / Creating. */
const TARGET: Record<Typology, number> = { RU: 32, AP: 24, AEC: 24 };
/** Re-assign each slot's typology (keeping 1-mark slots mostly recall) so the marks come as close as possible to 32 / 24 / 24. Exact search, deterministic. */
function withTypology(slots: Slot[]): Slot[] {
  type St = { cost: number; pick: Typology[] };
  const kinds: Typology[] = ['RU', 'AP', 'AEC'];
  let best = new Map<string, St>([['0,0,0', { cost: 0, pick: [] }]]);
  for (const sl of slots) {
    const next = new Map<string, St>();
    for (const [key, st] of best) {
      const [a, b, c] = key.split(',').map(Number) as [number, number, number];
      for (const k of kinds) {
        const n = [a + (k === 'RU' ? sl.marks : 0), b + (k === 'AP' ? sl.marks : 0), c + (k === 'AEC' ? sl.marks : 0)];
        if (n[0]! > TARGET.RU + 2 || n[1]! > TARGET.AP + 2 || n[2]! > TARGET.AEC + 2) continue;
        // small recall bias: 1-mark slots prefer RU, 6-mark slots prefer higher order
        const bias = (sl.marks === 1 && k !== 'RU' ? 0.1 : 0) + (sl.marks === 6 && k === 'RU' ? 0.3 : 0);
        const kk = n.join(','),
          cost = st.cost + bias;
        const cur = next.get(kk);
        if (!cur || cost < cur.cost) next.set(kk, { cost, pick: [...st.pick, k] });
      }
    }
    best = next;
  }
  let win: St | undefined,
    dev = Infinity;
  for (const [key, st] of best) {
    const [a, b, c] = key.split(',').map(Number) as [number, number, number];
    const d = Math.abs(a - TARGET.RU) + Math.abs(b - TARGET.AP) + Math.abs(c - TARGET.AEC) + st.cost / 100;
    if (d < dev) {
      dev = d;
      win = st;
    }
  }
  return slots.map((sl, i) => ({ ...sl, typology: win!.pick[i]! }));
}

// ───────────────────────── building ─────────────────────────
export interface PaperItem {
  readonly question: Question;
  readonly label: string;
}
export interface PaperQuestion {
  readonly no: number;
  readonly part: 'A' | 'B';
  readonly unit: string;
  readonly marks: SlotMarks;
  readonly typology: Typology;
  /** the question: one generated question, or a composite of linked smaller ones from the same unit */
  readonly items: readonly PaperItem[];
  readonly composite: boolean;
  /** internal choice: the alternative ("OR"), same marks */
  readonly alt?: readonly PaperItem[];
}
export interface PaperReport {
  readonly official: boolean;
  readonly pattern: string;
  readonly questions: number;
  readonly marks: number;
  readonly byMarks: Readonly<Record<string, number>>;
  readonly unitMarks: Readonly<Record<string, number>>;
  readonly typologyMarks: Readonly<Record<Typology, number>>;
  readonly composite: number;
  readonly singles: number;
  readonly choices: number;
  /** slots where the first item's typology differs from the slot's (the pool for that unit had none of the wanted kind) */
  readonly typologyMismatch: number;
}
export interface Paper {
  readonly cls: PaperClass;
  readonly route: PaperRoute;
  readonly seed: number;
  readonly title: string;
  readonly minutes: number;
  readonly maxMarks: number;
  readonly questions: readonly PaperQuestion[];
  readonly report: PaperReport;
}

const marksCache = new Map<string, Set<number>>();
/** Which question sizes a generator can produce (sampled over the first 40 seeds). */
function sizesOf(skill: string): Set<number> {
  let s = marksCache.get(skill);
  if (!s) {
    s = new Set();
    for (let i = 1; i <= 40; i++) s.add(makeQuestion(skill, i).marks);
    marksCache.set(skill, s);
  }
  return s;
}
const inUnit = (g: { clause: string }, unit: string) => g.clause.startsWith(unit + '.');
const PARTITIONS: Record<SlotMarks, readonly (readonly number[])[]> = {
  1: [[1]],
  3: [[3], [2, 1], [1, 1, 1]],
  4: [[4], [2, 2], [3, 1], [2, 1, 1], [1, 1, 1, 1]],
  6: [
    [4, 2],
    [3, 3],
    [2, 2, 2],
    [4, 1, 1],
    [3, 2, 1],
    [2, 2, 1, 1],
    [1, 1, 1, 1, 1, 1],
  ],
};

function shuffled<T>(xs: readonly T[], rng: Rng): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i),
      t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

/** Find a question of exactly `size` marks from one generator (the seed is searched, so it is reproducible from the paper seed). */
function questionOfSize(skill: string, size: number, rng: Rng): Question | null {
  for (let t = 0; t < 80; t++) {
    const q = makeQuestion(skill, rng.int(1, 999_999));
    if (q.marks === size) return q;
  }
  return null;
}

function fill(slot: Slot, rng: Rng, used: Set<string>, avoid: Set<string>): { items: PaperItem[]; composite: boolean } {
  const pool = ALL_GENERATORS.filter(g => inUnit(g, slot.unit));
  const choose = (size: number, wantTy: Typology | null, preferClause: string | null): { skill: string; q: Question } | null => {
    const can = pool.filter(g => sizesOf(g.skill).has(size) && !avoid.has(g.skill));
    const tiers = [
      can.filter(g => !used.has(g.skill) && (wantTy === null || g.typology === wantTy) && (preferClause === null || g.clause === preferClause)),
      can.filter(g => !used.has(g.skill) && (wantTy === null || g.typology === wantTy)),
      can.filter(g => !used.has(g.skill) && (preferClause === null || g.clause === preferClause)),
      can.filter(g => !used.has(g.skill)),
      can.filter(g => wantTy === null || g.typology === wantTy),
      can,
    ];
    for (const t of tiers) {
      const order = shuffled(t, rng);
      for (const g of order) {
        const q = questionOfSize(g.skill, size, rng);
        if (q) return { skill: g.skill, q };
      }
    }
    return null;
  };
  for (const parts of PARTITIONS[slot.marks]) {
    const picked: { skill: string; q: Question }[] = [],
      tmpUsed = new Set<string>();
    let ok = true,
      clause: string | null = null;
    for (let i = 0; i < parts.length && ok; i++) {
      const pick = choose(parts[i]!, i === 0 ? slot.typology : null, clause);
      if (!pick) {
        ok = false;
        break;
      }
      picked.push(pick);
      tmpUsed.add(pick.skill);
      used.add(pick.skill);
      clause = pick.q.clause;
    }
    if (ok) return { items: picked.map((p, i) => ({ question: p.q, label: parts.length > 1 ? `(${String.fromCharCode(97 + i)})` : '' })), composite: parts.length > 1 };
    for (const s of tmpUsed) used.delete(s);
  }
  throw new Error(`paper: no way to fill a ${slot.marks}-mark slot in unit ${slot.unit}`);
}

export const PAPER_MINUTES = 180;

/** Build the paper for a seed: the same seed always gives the same paper. */
export function buildPaper(opts: { cls: PaperClass; route?: PaperRoute; seed: number }): Paper {
  const route = opts.route ?? 'OPTION_I_ANALYSIS',
    slots = blueprint(opts.cls, route),
    rng = new Rng(opts.seed * 2654435761 + 97);
  const used = new Set<string>();
  const questions: PaperQuestion[] = slots.map(slot => {
    const main = fill(slot, rng, used, new Set());
    let alt: { items: PaperItem[]; composite: boolean } | undefined;
    if (slot.choice) alt = fill(slot, rng, used, new Set(main.items.map(i => i.question.skill)));
    return { no: slot.no, part: slot.part, unit: slot.unit, marks: slot.marks, typology: slot.typology, items: main.items, composite: main.composite, ...(alt ? { alt: alt.items } : {}) };
  });
  const official = opts.cls === 'XII';
  const byMarks: Record<string, number> = {},
    unitMarks: Record<string, number> = {},
    typologyMarks: Record<Typology, number> = { RU: 0, AP: 0, AEC: 0 };
  let mismatch = 0;
  for (const q of questions) {
    byMarks[String(q.marks)] = (byMarks[String(q.marks)] ?? 0) + 1;
    unitMarks[q.unit] = (unitMarks[q.unit] ?? 0) + q.marks;
    typologyMarks[q.typology] += q.marks;
    if (q.items[0]!.question.typology !== q.typology) mismatch++;
  }
  const maxMarks = questions.reduce((s, q) => s + q.marks, 0);
  return {
    cls: opts.cls,
    route,
    seed: opts.seed,
    minutes: PAPER_MINUTES,
    maxMarks,
    title: official ? 'Accountancy (055): practice paper in the Class XII board pattern' : 'Accountancy (055): Class XI practice paper (pattern borrowed from Class XII; not an official blueprint)',
    questions,
    report: {
      official,
      pattern: official
        ? 'Official Class XII blueprint (Sample Question Paper 2026-27): 34 questions, 80 marks, 3 hours.'
        : 'Official Class XI unit marks (12 / 44 / 24) with the Class XII question pattern; no Class XI sample paper is published yet.',
      questions: questions.length,
      marks: maxMarks,
      byMarks,
      unitMarks,
      typologyMarks,
      composite: questions.filter(q => q.composite).length,
      singles: questions.filter(q => !q.composite).length,
      choices: questions.filter(q => q.alt).length,
      typologyMismatch: mismatch,
    },
  };
}

// ───────────────────────── marking scheme ─────────────────────────
export interface SchemeLine {
  readonly label: string;
  readonly answer: string;
  readonly marks: number;
}
export interface SchemeEntry {
  readonly no: number;
  readonly marks: number;
  readonly lines: readonly SchemeLine[];
  readonly working: readonly string[];
  readonly alt?: { readonly lines: readonly SchemeLine[]; readonly working: readonly string[] };
}
const schemeOf = (items: readonly PaperItem[]) => ({
  lines: items.flatMap(it => it.question.parts.map(p => ({ label: `${it.label} ${p.label}`.trim(), answer: p.kind === 'MONEY' ? `₹${p.answer}` : p.answer, marks: p.marks }))),
  working: items.flatMap(it => it.question.working.map(w => (it.label ? `${it.label} ${w}` : w))),
});
export function markingScheme(paper: Paper): SchemeEntry[] {
  return paper.questions.map(q => ({ no: q.no, marks: q.marks, ...schemeOf(q.items), ...(q.alt ? { alt: schemeOf(q.alt) } : {}) }));
}
