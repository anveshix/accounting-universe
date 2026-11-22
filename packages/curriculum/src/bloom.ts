/**
 * Bloom's-taxonomy practice. Every one of the 54 syllabus topics has authored questions tagged with a Bloom level
 * (Remember, Understand, Apply, Analyse, Evaluate, Create). The CBSE typology bands are built from them:
 * RU = Remember + Understand, AP = Apply, AEC = Analyse + Evaluate + Create.
 *
 * Honest limit: these are auto-marked choice questions. "Create" is therefore tested as choosing the best design/plan/entry,
 * not as free construction; the free-construction work stays in the numerical generators and the paper builder.
 * Original wording; nothing outside the official 2026-27 syllabus. Not yet reviewed by a subject teacher (D11).
 */
import type { Gen, Typology } from './questions';
import type { Rng } from './rng';
import { XI1 } from './bloom/xi1';
import { XI2 } from './bloom/xi2';
import { XI3 } from './bloom/xi3';
import { XII1 } from './bloom/xii1';
import { XII2 } from './bloom/xii2';
import { XII3 } from './bloom/xii3';
import { XII4 } from './bloom/xii4';
import { APPLY_MORE } from './bloom/apply';

export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYSE' | 'EVALUATE' | 'CREATE';
type Code = 'R' | 'U' | 'A' | 'N' | 'E' | 'C';
/** [level, question, correct option, three wrong options, one-line reason]. */
export type BloomItem = readonly [level: Code, question: string, correct: string, wrong: readonly [string, string, string], why: string];

export const BLOOM_LEVELS: readonly BloomLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYSE', 'EVALUATE', 'CREATE'];
const LEVEL: Record<Code, BloomLevel> = { R: 'REMEMBER', U: 'UNDERSTAND', A: 'APPLY', N: 'ANALYSE', E: 'EVALUATE', C: 'CREATE' };
/** The CBSE typology band each Bloom level belongs to. */
export const BAND_OF: Record<BloomLevel, Typology> = { REMEMBER: 'RU', UNDERSTAND: 'RU', APPLY: 'AP', ANALYSE: 'AEC', EVALUATE: 'AEC', CREATE: 'AEC' };
export const BLOOM_LABEL: Record<BloomLevel, string> = { REMEMBER: 'Remember', UNDERSTAND: 'Understand', APPLY: 'Apply', ANALYSE: 'Analyse', EVALUATE: 'Evaluate', CREATE: 'Create' };
const BAND_TITLE: Record<Typology, string> = { RU: 'Remember & Understand', AP: 'Apply', AEC: 'Analyse, Evaluate & Create' };

/** Every authored item, by topic. */
const BASE: Readonly<Record<string, readonly BloomItem[]>> = { ...XI1, ...XI2, ...XI3, ...XII1, ...XII2, ...XII3, ...XII4 };
export const BLOOM_BANK: Readonly<Record<string, readonly BloomItem[]>> = Object.fromEntries(Object.keys(BASE).map(k => [k, [...BASE[k]!, ...(APPLY_MORE[k] ?? [])]]));

export const bloomLevelOf = (code: Code): BloomLevel => LEVEL[code];
/** The items of one topic at one Bloom level. */
export const bloomItems = (clause: string, level: BloomLevel): readonly BloomItem[] => (BLOOM_BANK[clause] ?? []).filter(i => LEVEL[i[0]] === level);

function shuffle<T>(r: Rng, xs: readonly T[]): T[] {
  const o = [...xs];
  for (let i = o.length - 1; i > 0; i--) {
    const j = r.int(0, i),
      t = o[i]!;
    o[i] = o[j]!;
    o[j] = t;
  }
  return o;
}
const slug = (clause: string) => clause.toLowerCase().replace(/\./g, '-');

/** One generator per (topic, band) that has items. Seeds walk the authored items so a learner meets each before any repeats. */
function makeGens(): Gen[] {
  const out: Gen[] = [];
  for (const [clause, all] of Object.entries(BLOOM_BANK)) {
    for (const band of ['RU', 'AP', 'AEC'] as const) {
      const bank = all.filter(i => BAND_OF[LEVEL[i[0]]] === band);
      if (!bank.length) continue;
      out.push({
        skill: `bl-${slug(clause)}-${band.toLowerCase()}`,
        clause,
        title: `Bloom · ${BAND_TITLE[band]}`,
        typology: band,
        make: (r, seed) => {
          const [code, q, correct, wrong, why0] = bank[(seed + r.int(0, 1_000_003)) % bank.length]!;
          // very short reasons (“Old ratio.”) read better with the answer they justify
          const why = why0.length > 24 ? why0 : `The answer is “${correct}”: ${why0.charAt(0).toLowerCase()}${why0.slice(1)}`;
          return {
            stem: q.length > 30 ? q : `Complete the statement: ${q}`,
            parts: [{ label: 'Choose the correct option', kind: 'CHOICE', options: shuffle(r, [correct, ...wrong]), answer: correct, marks: 1 }],
            hints: ['Recall the study notes for this topic before looking at the options.', 'Check each option against the exact wording of the question; usually two can be dropped at once.'],
            working: [`${correct}. ${why}`],
            distractors: wrong.map(w => ({ part: 0, value: w, mistake: `“${w}” does not fit what the question asks.`, fix: why })),
            bloom: LEVEL[code],
          };
        },
      });
    }
  }
  return out;
}
export const BLOOM_GENERATORS: readonly Gen[] = makeGens();
