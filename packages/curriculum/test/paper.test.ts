import { describe, expect, it } from 'vitest';
import { blueprint, buildPaper, markingScheme, type PaperClass, type PaperRoute } from '../src/paper';

const CASES: [PaperClass, PaperRoute][] = [
  ['XII', 'OPTION_I_ANALYSIS'],
  ['XII', 'OPTION_II_COMPUTERISED'],
  ['XI', 'OPTION_I_ANALYSIS'],
];
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('paper blueprint (hand-counted from the Class XII Sample Question Paper 2026-27 and the unit marks table)', () => {
  it.each(CASES)('%s %s: 34 questions, 80 marks, 20×1 + 6×3 + 3×4 + 5×6', (c, r) => {
    const b = blueprint(c, r);
    expect(b).toHaveLength(34);
    expect(sum(b.map(s => s.marks))).toBe(80);
    const n = (m: number) => b.filter(s => s.marks === m).length;
    expect([n(1), n(3), n(4), n(6)]).toEqual([20, 6, 3, 5]);
    expect(b.map(s => s.no)).toEqual(Array.from({ length: 34 }, (_, i) => i + 1));
  });
  it('Class XII: Part A = Q1-26 = 60 marks, Part B = Q27-34 = 20 marks', () => {
    for (const r of ['OPTION_I_ANALYSIS', 'OPTION_II_COMPUTERISED'] as const) {
      const b = blueprint('XII', r);
      expect(sum(b.filter(s => s.part === 'A').map(s => s.marks))).toBe(60);
      expect(b.filter(s => s.part === 'A')).toHaveLength(26);
      expect(sum(b.filter(s => s.part === 'B').map(s => s.marks))).toBe(20);
    }
  });
  it('unit marks: XII 36 / 24 / 12 / 8 (Option I) or 36 / 24 / 20 (Option II); XI 12 / 44 / 24', () => {
    const by = (c: PaperClass, r: PaperRoute) => {
      const m: Record<string, number> = {};
      for (const s of blueprint(c, r)) m[s.unit] = (m[s.unit] ?? 0) + s.marks;
      return m;
    };
    expect(by('XII', 'OPTION_I_ANALYSIS')).toEqual({ 'XII.1': 36, 'XII.2': 24, 'XII.3': 12, 'XII.4': 8 });
    expect(by('XII', 'OPTION_II_COMPUTERISED')).toEqual({ 'XII.1': 36, 'XII.2': 24, 'XII.C': 20 });
    expect(by('XI', 'OPTION_I_ANALYSIS')).toEqual({ 'XI.1': 12, 'XI.2': 44, 'XI.3': 24 });
  });
  it.each(CASES)('%s %s: typology 32 / 24 / 24 marks (40 / 30 / 30 %)', (c, r) => {
    const t = { RU: 0, AP: 0, AEC: 0 };
    for (const s of blueprint(c, r)) t[s.typology] += s.marks;
    expect(t).toEqual({ RU: 32, AP: 24, AEC: 24 });
  });
  it.each(CASES)('%s %s: internal choice in two 3-mark, two 4-mark and two 6-mark questions', (c, r) => {
    const ch = blueprint(c, r).filter(s => s.choice);
    expect([3, 4, 6].map(m => ch.filter(s => s.marks === m).length)).toEqual([2, 2, 2]);
    expect(ch.filter(s => s.marks === 1)).toHaveLength(0);
  });
});

describe('built paper', () => {
  it.each(CASES)('%s %s: every slot is filled with questions that add up to the slot marks', (c, r) => {
    const p = buildPaper({ cls: c, route: r, seed: 11 });
    expect(p.questions).toHaveLength(34);
    expect(p.maxMarks).toBe(80);
    for (const q of p.questions) {
      expect(sum(q.items.map(i => i.question.marks)), `Q${q.no}`).toBe(q.marks);
      for (const i of q.items) expect(i.question.clause.startsWith(q.unit + '.'), `Q${q.no} unit`).toBe(true);
      if (q.alt) {
        expect(sum(q.alt.map(i => i.question.marks)), `Q${q.no} alt`).toBe(q.marks);
        expect(q.alt.map(i => i.question.skill).join()).not.toBe(q.items.map(i => i.question.skill).join());
      }
      expect(q.composite).toBe(q.items.length > 1);
    }
  });
  it('the same seed gives the same paper; another seed gives another', () => {
    const a = buildPaper({ cls: 'XII', seed: 5 }),
      b = buildPaper({ cls: 'XII', seed: 5 }),
      c = buildPaper({ cls: 'XII', seed: 6 });
    const sig = (p: typeof a) => JSON.stringify(p.questions.map(q => q.items.map(i => [i.question.skill, i.question.seed])));
    expect(sig(a)).toBe(sig(b));
    expect(sig(a)).not.toBe(sig(c));
  });
  it('the report is honest: official only for Class XII, composites counted, typology reported', () => {
    const x = buildPaper({ cls: 'XII', seed: 3 }),
      y = buildPaper({ cls: 'XI', seed: 3 });
    expect(x.report.official).toBe(true);
    expect(y.report.official).toBe(false);
    expect(y.title).toMatch(/not an official/i);
    expect(x.report.composite + x.report.singles).toBe(34);
    expect(x.report.byMarks).toEqual({ '1': 20, '3': 6, '4': 3, '6': 5 });
    expect(x.minutes).toBe(180);
  });
  it('works for many seeds without running out of questions', () => {
    for (const [c, r] of CASES) for (let s = 1; s <= 25; s++) expect(() => buildPaper({ cls: c, route: r, seed: s }), `${c} ${r} ${s}`).not.toThrow();
  });
});

describe('marking scheme', () => {
  it.each(CASES)('%s %s: the marks of the answer lines add up to each question and to 80', (c, r) => {
    const p = buildPaper({ cls: c, route: r, seed: 9 }),
      ms = markingScheme(p);
    expect(ms).toHaveLength(34);
    for (const e of ms) {
      expect(sum(e.lines.map(l => l.marks)), `Q${e.no}`).toBe(e.marks);
      expect(e.lines.every(l => l.answer.length > 0)).toBe(true);
      if (e.alt) expect(sum(e.alt.lines.map(l => l.marks))).toBe(e.marks);
    }
    expect(sum(ms.map(e => e.marks))).toBe(80);
  });
});

describe('the report states what the paper really contains', () => {
  it('actual typology marks add up to 80 and come from the questions themselves; the target stays 32 / 24 / 24', () => {
    for (const [c, r] of CASES) {
      const p = buildPaper({ cls: c, route: r, seed: 21 });
      expect(p.report.typologyMarks.RU + p.report.typologyMarks.AP + p.report.typologyMarks.AEC).toBe(80);
      expect(p.report.typologyTarget).toEqual({ RU: 32, AP: 24, AEC: 24 });
      const own = { RU: 0, AP: 0, AEC: 0 };
      for (const q of p.questions) for (const it of q.items) for (const part of it.question.parts) own[it.question.typology] += part.marks;
      expect(p.report.typologyMarks).toEqual(own);
    }
  });
  it('counts repeated question types', () => {
    const p = buildPaper({ cls: 'XII', seed: 4 });
    const skills = p.questions.flatMap(q => q.items.map(i => i.question.skill));
    expect(p.report.repeatedTypes).toBe(skills.length - new Set(skills).size);
  });
});

describe('no question appears twice, and linked parts belong together', () => {
  const norm = (s: string) => s.trim();
  it('no paper of any type holds two questions with the same text (60 papers each)', () => {
    for (const [c, r] of CASES) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = buildPaper({ cls: c, route: r, seed });
        const texts = p.questions.flatMap(q => [...q.items, ...(q.alt ?? [])].map(i => norm(i.question.stem)));
        expect(new Set(texts).size, `${c} ${r} seed ${seed}`).toBe(texts.length);
        expect(p.report.repeatedQuestions, `${c} ${r} seed ${seed}`).toBe(0);
      }
    }
  });
  it('the two sides of an internal choice are different questions', () => {
    for (const [c, r] of CASES)
      for (let seed = 1; seed <= 30; seed++)
        for (const q of buildPaper({ cls: c, route: r, seed }).questions) if (q.alt) expect(q.alt.map(i => norm(i.question.stem))).not.toEqual(q.items.map(i => norm(i.question.stem)));
  });
  it('Class XII linked questions always combine parts of ONE topic', () => {
    for (const r of ['OPTION_I_ANALYSIS', 'OPTION_II_COMPUTERISED'] as const) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = buildPaper({ cls: 'XII', route: r, seed });
        for (const q of p.questions) if (q.composite) expect(new Set(q.items.map(i => i.question.clause)).size, `${r} ${seed} Q${q.no}`).toBe(1);
        expect(p.report.compositeMixedTopic).toBe(0);
      }
    }
  });
  it('the report counts one-topic and mixed-topic linked questions exactly, for Class XI too', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const p = buildPaper({ cls: 'XI', seed });
      const mixed = p.questions.filter(q => q.composite && new Set(q.items.map(i => i.question.clause)).size > 1).length;
      expect(p.report.compositeMixedTopic).toBe(mixed);
      expect(p.report.compositeOneTopic + p.report.compositeMixedTopic).toBe(p.report.composite);
    }
  });
  it('papers are still reproducible from the seed', () => {
    const sig = (p: ReturnType<typeof buildPaper>) => JSON.stringify(p.questions.map(q => [...q.items, ...(q.alt ?? [])].map(i => i.question.id)));
    expect(sig(buildPaper({ cls: 'XII', seed: 31 }))).toBe(sig(buildPaper({ cls: 'XII', seed: 31 })));
  });
});
