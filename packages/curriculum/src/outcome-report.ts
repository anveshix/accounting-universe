/** Teacher view by LEARNING OUTCOME (handoff T0.7): which official outcomes the class has practised and where it struggles. */
import { OUTCOMES } from './outcomes';
import { parseExport, type Attempt } from './progress';

export interface OutcomeRow { readonly outcome: string; readonly unit: string; readonly text: string; readonly clauses: readonly string[]; readonly students: number; readonly attempts: number; readonly accuracy: number | null; readonly struggling: number }
const pct = (a: readonly Attempt[]) => { const out = a.reduce((s, x) => s + x.outOf, 0); return out === 0 ? 0 : a.reduce((s, x) => s + x.marks, 0) / out; };

/** One row per outcome that at least one student has practised (through any topic mapped to it). Invalid files are ignored here (classReport lists them). */
export function outcomeReport(files: readonly { file: string; data: unknown }[]): OutcomeRow[] {
  const students = files.map(f => parseExport(f.data)).filter((p): p is Extract<typeof p, { ok: true }> => p.ok).map(p => p.value.attempts);
  return OUTCOMES.map(o => {
    const per = students.map(a => a.filter(x => o.clauses.includes(x.clause))).filter(a => a.length > 0), flat = per.flat();
    return { outcome: o.id, unit: o.unit, text: o.text, clauses: o.clauses, students: per.length, attempts: flat.length, accuracy: flat.length ? pct(flat) : null, struggling: per.filter(a => a.length >= 2 && pct(a.slice(-10)) < 0.6).length };
  }).filter(r => r.students > 0);
}
export function outcomeCsv(rows: readonly OutcomeRow[]): string {
  const esc = (v: string | number | null) => { const t = v === null ? '' : String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  return [['outcome', 'unit', 'topics', 'students_practised', 'attempts', 'accuracy_percent', 'students_struggling', 'outcome_text'],
    ...rows.map(r => [r.outcome, r.unit, r.clauses.join(' '), r.students, r.attempts, r.accuracy === null ? null : Math.round(r.accuracy * 100), r.struggling, r.text])].map(x => x.map(esc).join(',')).join('\n');
}
