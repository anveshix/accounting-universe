/**
 * Engine re-verification of the legacy Class XI banks (handoff T0.5). Every check is independent of the legacy code:
 * account types come from accounts-xi.ts, arithmetic and double entry from the engine. Results are ISSUES for the reviewer —
 * nothing is auto-corrected. Items with an error-level issue are excluded from the verified banks the app uses.
 */
import { ChartOfAccounts, EntryValidationError, Ledger, Money, type DraftLine, type Side } from '../../../engine/src';
import { LEGACY_V1 } from './legacy-v1';
import { AMBIGUOUS, LEGACY_LETTER, allClassified, canonical, classify, debitEffect, type AccountClass } from './accounts-xi';

export interface Issue { readonly bank: 'm1' | 'm2' | 'm4' | 'm5' | 'tb'; readonly index: number; readonly level: 'error' | 'review'; readonly message: string }
type Eq = { A: number; L: number; C: number };
const zero = (): Eq => ({ A: 0, L: 0, C: 0 });

function chart(): ChartOfAccounts {
  const c = new ChartOfAccounts();
  for (const name of allClassified()) c.add({ id: name, name, type: classify(name)!.type });
  return c;
}
/** Post a journal entry through the engine; returns null when valid, otherwise the engine's reason. */
function engineRejects(lines: { account: string; side: Side; amount: number }[]): string | null {
  try { new Ledger(chart()).post({ date: '2026-04-01', narration: 'verification', lines: lines.map((l): DraftLine => ({ accountId: canonical(l.account), side: l.side, amount: Money.rupees(l.amount) })) }); return null; }
  catch (e) { return e instanceof EntryValidationError ? e.issues.map(i => i.message).join('; ') : String(e); }
}
/** Movement of A, L and C caused by a debit/credit of `amount` on an account. */
function move(eq: Eq, c: AccountClass, side: Side, amount: number) { eq[c.eq] += (side === 'DR' ? 1 : -1) * debitEffect(c) * amount; }

/** Sentences such as "Cash (Asset) ↑ → Debit": one answer account, one arrow, one side word. Returns the statements it could check and the wrong ones. */
function checkWhy(why: string, answer: { account: string; side: Side }[]): { checked: number; wrong: string[] } {
  let checked = 0; const wrong: string[] = [];
  for (const sentence of why.split(/(?<=[.])\s+/)) {
    const names = answer.filter(a => sentence.includes(canonical(a.account)));
    const arrows = sentence.match(/↑|↓|increases|decreases/g) ?? [], sides = sentence.match(/\b(Debit|Dr|Credit|Cr)\b/g) ?? [];
    if (names.length !== 1 || arrows.length !== 1 || sides.length !== 1) continue;
    const a = names[0]!, c = classify(a.account); if (!c) continue;
    checked++;
    const up = arrows[0] === '↑' || arrows[0] === 'increases', said: Side = /^D/.test(sides[0]!) ? 'DR' : 'CR';
    const rule: Side = up ? c.normal : c.normal === 'DR' ? 'CR' : 'DR';
    if (said !== a.side) wrong.push(`“${sentence.trim()}” says ${said} but the answer ${a.side === 'DR' ? 'debits' : 'credits'} ${a.account}`);
    else if (rule !== said) wrong.push(`“${sentence.trim()}”: ${a.account} ${up ? 'increasing' : 'decreasing'} is a ${rule === 'DR' ? 'debit' : 'credit'} (${c.type.toLowerCase()} account)`);
  }
  return { checked, wrong };
}

// ───────── m1 Live Equation templates
export function verifyM1(items = LEGACY_V1.m1): Issue[] {
  const out: Issue[] = [];
  items.forEach((t, i) => {
    if (!t.linear) out.push({ bank: 'm1', index: i, level: 'error', message: `${t.id}: effect is not linear in the amount` });
    const vectors = [t.effectPer1000, ...(t.costEffectPer1000 ? [t.costEffectPer1000] : [])];
    for (const v of vectors) {
      const eq = zero(), lines: { account: string; side: Side; amount: number }[] = [];
      for (const [name, d] of Object.entries(v)) {
        if (d === 0) continue;
        const c = classify(name); if (!c) { out.push({ bank: 'm1', index: i, level: 'error', message: `${t.id}: unknown account “${name}”` }); continue; }
        eq[c.eq] += c.sign * d;
        lines.push({ account: name, side: d > 0 ? c.normal : c.normal === 'DR' ? 'CR' : 'DR', amount: Math.abs(d) });
      }
      if (eq.A !== eq.L + eq.C) out.push({ bank: 'm1', index: i, level: 'error', message: `${t.id}: A ${eq.A} ≠ L ${eq.L} + C ${eq.C}` });
      const why = engineRejects(lines); if (why) out.push({ bank: 'm1', index: i, level: 'error', message: `${t.id}: the engine rejects the entry — ${why}` });
    }
    // the description's arrows must match the effect (a sale at a profit: sale value 1,000 and cost 600)
    const combined: Record<string, number> = {};
    for (const [k, d] of Object.entries(t.effectPer1000)) combined[k] = (combined[k] ?? 0) + d;
    for (const [k, d] of Object.entries(t.costEffectPer1000 ?? {})) combined[k] = (combined[k] ?? 0) + 0.6 * d;
    for (const m of t.desc.matchAll(/([A-Za-z&' ]+?)\s*(↑|↓)/g)) {
      const name = m[1]!.trim(), d = combined[name];
      if (d === undefined || d === 0) continue;
      if ((m[2] === '↑') !== d > 0) out.push({ bank: 'm1', index: i, level: 'error', message: `${t.id}: description says ${name} ${m[2]} but the effect is ${d > 0 ? 'an increase' : 'a decrease'}` });
    }
  });
  return out;
}

// ───────── m2 Transaction Lab and m4 journal scenes
function verifyScene(bank: 'm2' | 'm4', i: number, s: { debit: string[]; credit: string[]; amount: number; why: string; delta?: Eq; pool: { account: string; type?: string }[] }): Issue[] {
  const out: Issue[] = [];
  const answer = [...s.debit.map(a => ({ account: a, side: 'DR' as Side })), ...s.credit.map(a => ({ account: a, side: 'CR' as Side }))];
  for (const p of s.pool) {
    if (AMBIGUOUS.has(canonical(p.account))) continue;
    const c = classify(p.account);
    if (!c) { out.push({ bank, index: i, level: 'error', message: `unknown account “${p.account}”` }); continue; }
    if (p.type && LEGACY_LETTER[p.type] !== c.type && !(c.sign === -1 && c.eq === 'A' && p.type === 'A') && !(c.note && /reduces/.test(c.note)))
      out.push({ bank, index: i, level: 'review', message: `“${p.account}” is labelled ${LEGACY_LETTER[p.type] ?? p.type} in the legacy pool but ${c.type} here` });
  }
  if (answer.some(a => !classify(a.account))) return out;
  if (s.debit.length === 1 && s.credit.length === 1) {
    const why = engineRejects(answer.map(a => ({ ...a, amount: s.amount }))); if (why) out.push({ bank, index: i, level: 'error', message: `engine rejects: ${why}` });
    if (s.delta) {
      const eq = zero(); for (const a of answer) move(eq, classify(a.account)!, a.side, s.amount);
      if (eq.A !== s.delta.A || eq.L !== s.delta.L || eq.C !== s.delta.C) {
        // Inventory model (legacy defect F-4): the journal may use Purchases A/c (periodic) while the equation treats goods bought as Stock (perpetual).
        const perpetual = zero(); for (const a of answer) move(perpetual, canonical(a.account) === 'Purchases' ? classify('Stock')! : classify(a.account)!, a.side, s.amount);
        const mixed = perpetual.A === s.delta.A && perpetual.L === s.delta.L && perpetual.C === s.delta.C;
        out.push(mixed
          ? { bank, index: i, level: 'review', message: 'inventory model mixed (F-4): the journal debits Purchases (periodic method) but the equation effect treats the goods as Stock (perpetual method). Both are standard; the scene should say which one it uses' }
          : { bank, index: i, level: 'error', message: `equation effect is A ${eq.A}, L ${eq.L}, C ${eq.C} but the scene says A ${s.delta.A}, L ${s.delta.L}, C ${s.delta.C}` });
      }
    }
  } else out.push({ bank, index: i, level: 'review', message: 'compound entry: the scene does not split the amounts, so only the debit/credit sides were checked' });
  for (const w of checkWhy(s.why, answer).wrong) out.push({ bank, index: i, level: 'error', message: w });
  return out;
}
export const verifyM2 = (items = LEGACY_V1.m2) => items.flatMap((s, i) => verifyScene('m2', i, s));
export const verifyM4 = (items = LEGACY_V1.m4) => items.flatMap((s, i) => verifyScene('m4', i, { ...s, pool: s.pool.map(account => ({ account })) }));
export const whyCoverage = () => [...LEGACY_V1.m2, ...LEGACY_V1.m4].reduce((n, s) => n + checkWhy(s.why, [...s.debit.map(a => ({ account: a, side: 'DR' as Side })), ...s.credit.map(a => ({ account: a, side: 'CR' as Side }))]).checked, 0);

// ───────── m5 impact MCQs: an independent annotation of each transaction's effect (written from the question alone)
type Sgn = '+' | '-' | '0' | '±';
export const M5_EXPECTED: readonly [Sgn, Sgn, Sgn][] = [
  ['+', '0', '+'], ['+', '+', '0'], ['-', '-', '0'], ['+', '0', '+'], ['-', '0', '-'], ['±', '0', '0'], ['±', '0', '0'], ['-', '0', '-'], ['+', '0', '+'], ['+', '0', '+'],
  ['-', '0', '-'], ['-', '-', '0'], ['+', '+', '0'], ['+', '+', '0'], ['-', '0', '-'], ['-', '0', '-'], ['+', '+', '0'], ['±', '0', '0'], ['-', '-', '0'], ['+', '0', '+'],
  ['0', '-', '+'], ['+', '0', '+'], ['-', '0', '-'], ['0', '0', '0'], ['-', '0', '-'],
];
/** Amounts stated in the independent annotation where options differ only by amount (A, L, C). */
export const M5_AMOUNTS: Readonly<Record<number, readonly [number, number, number]>> = { 8: [1000, 0, 1000] };   // sale 4,000 − cost 3,000 = net asset and profit 1,000
/** Amounts written in an option ("Assets ↑ by 1,000"), A, L, C; 0 where none is written. */
export function parseAmounts(option: string): [number, number, number] {
  const get = (re: RegExp) => { const m = new RegExp(`${re.source}\\s*[↑↓]\\s*by\\s*([\\d,]+)`, 'i').exec(option); return m ? Number(m[m.length - 1]!.replace(/,/g, '')) : 0; };
  return [get(/Assets?/i), get(/Liabilit(?:y|ies)/i), get(/Capital/i)];
}
/** Turn an option such as "Assets ↑, Liabilities ↑" or "Assets ↑ and ↓ (No net change)" into signs for A, L, C. */
export function parseImpact(option: string): [Sgn, Sgn, Sgn] | null {
  const t = option.replace(/by [\d,]+/g, '');
  if (/^\s*No (net )?change\s*$/i.test(t)) return ['0', '0', '0'];
  const r: [Sgn, Sgn, Sgn] = ['0', '0', '0']; let hit = false;
  const parts: [RegExp, number][] = [[/Assets?/i, 0], [/Liabilit(y|ies)/i, 1], [/Capital/i, 2]];
  for (const [re, k] of parts) {
    const m = new RegExp(`${re.source}\\s*(↑ and ↓|↑|↓)`, 'i').exec(t);
    if (m) { hit = true; r[k] = m[m.length - 1] === '↑' ? '+' : m[m.length - 1] === '↓' ? '-' : '±'; }
  }
  return hit ? r : null;
}
export function verifyM5(items = LEGACY_V1.m5): Issue[] {
  const out: Issue[] = [];
  items.forEach((g, i) => {
    const want = M5_EXPECTED[i]; if (!want) { out.push({ bank: 'm5', index: i, level: 'error', message: 'no independent annotation' }); return; }
    const amounts = M5_AMOUNTS[i];
    const matching = g.options.map((o, k) => ({ k, p: parseImpact(o) })).filter(x => x.p && x.p.join() === want.join() && (!amounts || parseAmounts(g.options[x.k]!).join() === amounts.join())).map(x => x.k);
    if (matching.length !== 1) out.push({ bank: 'm5', index: i, level: 'error', message: `${matching.length} options match the independent answer (${want.join(',')}) — “${g.question}”` });
    else if (matching[0] !== g.answer) out.push({ bank: 'm5', index: i, level: 'error', message: `legacy marks option ${g.answer + 1} but the independent answer is option ${matching[0]! + 1} — “${g.question}”` });
  });
  return out;
}

// ───────── trial-balance side of each account
export function verifyTb(all: { account: string; side: 'dr' | 'cr' }[] = [...LEGACY_V1.tbItems, ...LEGACY_V1.tbPool, ...LEGACY_V1.bal]): Issue[] {
  const out: Issue[] = [];
  all.forEach((x, i) => {
    const c = classify(x.account);
    if (!c) { out.push({ bank: 'tb', index: i, level: 'error', message: `unknown account “${x.account}”` }); return; }
    if (x.side.toUpperCase() !== c.normal) out.push({ bank: 'tb', index: i, level: 'error', message: `“${x.account}” is shown on the ${x.side.toUpperCase()} side; its normal balance is ${c.normal}` });
  });
  return out;
}
export const verifyAll = () => [...verifyM1(), ...verifyM2(), ...verifyM4(), ...verifyM5(), ...verifyTb()];

// ───────── what the app may use: only items with no error-level issue
const clean = (bank: Issue['bank'], issues: Issue[]) => (i: number) => !issues.some(x => x.bank === bank && x.index === i && x.level === 'error');
export function verifiedBanks() {
  const all = verifyAll();
  return {
    m1: LEGACY_V1.m1.filter((_, i) => clean('m1', all)(i)), m2: LEGACY_V1.m2.filter((_, i) => clean('m2', all)(i)),
    m4: LEGACY_V1.m4.filter((_, i) => clean('m4', all)(i)), m5: LEGACY_V1.m5.filter((_, i) => clean('m5', all)(i)),
  };
}
/** What ASSESSMENT may use: items with no issue at all (an item awaiting review is not used to mark students). */
export function assessableBanks() {
  const all = verifyAll(), none = (bank: Issue['bank']) => (i: number) => !all.some(x => x.bank === bank && x.index === i);
  return {
    m1: LEGACY_V1.m1.filter((_, i) => none('m1')(i)), m2: LEGACY_V1.m2.filter((_, i) => none('m2')(i)),
    m4: LEGACY_V1.m4.filter((_, i) => none('m4')(i)), m5: LEGACY_V1.m5.filter((_, i) => none('m5')(i)),
  };
}
