/**
 * "Trial Balance Crisis" — a what-if challenge for Class XI (clauses XI.2.tb and XI.2.errors).
 * A month of transactions is posted correctly by the engine; ONE posting to ONE ledger account is then spoiled
 * (left out, put on the wrong side, or posted with a wrong amount). The trial balance no longer agrees and the student must:
 * find the difference → find the account → name the error → pass the rectifying entry through Suspense → answer a what-if.
 * Every figure is engine arithmetic: balances by Money, the suspense by suspenseFromTrialBalance, the entry by rectify().
 * Hindi text is a DRAFT (see i18n/glossary-hi.ts).
 */
import { Money, rectify, suspenseFromTrialBalance, type Side } from '../../engine/src';
import { Rng } from './rng';
import { month } from './questions-v1';
import { TERM_HI, accountHi } from './i18n/glossary-hi';

export type CrisisKind = 'OMITTED' | 'WRONG_SIDE' | 'WRONG_AMOUNT';
export const CRISIS_KINDS: readonly CrisisKind[] = ['OMITTED', 'WRONG_SIDE', 'WRONG_AMOUNT'];
export const SUSPENSE = 'Suspense';
export interface Posting {
  readonly day: number;
  readonly en: string;
  readonly hi: string;
  readonly side: Side;
  readonly amount: string;
}
export interface CrisisAccount {
  readonly id: string;
  readonly name: string;
  readonly nameHi: string;
  readonly posted: readonly Posting[];
  readonly shown: { readonly side: Side; readonly amount: string } | null;
}
export interface JournalLine {
  readonly day: number;
  readonly en: string;
  readonly hi: string;
  readonly amount: string;
  readonly dr: string;
  readonly cr: string;
}
export interface Bilingual {
  readonly en: string;
  readonly hi: string;
}
export interface Crisis {
  readonly seed: number;
  readonly journal: readonly JournalLine[];
  readonly accounts: readonly CrisisAccount[];
  readonly totals: { readonly dr: string; readonly cr: string };
  readonly answer: {
    readonly difference: string;
    readonly shortSide: Side;
    readonly account: string;
    readonly kind: CrisisKind;
    readonly entry: { readonly dr: string; readonly cr: string; readonly amount: string };
  };
  /** what really happened, shown after the account is found and in the solution */
  readonly cause: Bilingual;
  readonly whatIf: { readonly question: Bilingual; readonly options: readonly Bilingual[]; readonly answer: number; readonly why: Bilingual };
}

const M = (n: number) => Money.rupees(n);
const sum = (rows: readonly Posting[], side: Side) => Money.sum(rows.filter(r => r.side === side).map(r => Money.parse(r.amount)));
const net = (rows: readonly Posting[]) => sum(rows, 'DR').sub(sum(rows, 'CR')); // > 0 debit balance, < 0 credit balance
const shownOf = (rows: readonly Posting[]) => {
  const n = net(rows);
  return n.isZero() ? null : { side: (n.isNegative() ? 'CR' : 'DR') as Side, amount: n.abs().toString() };
};

export const KIND_LABEL: Record<CrisisKind, Bilingual> = {
  OMITTED: { en: 'A posting was left out of this account', hi: 'इस खाते में एक खतौनी छूट गई' },
  WRONG_SIDE: { en: 'A posting was made on the wrong side of this account', hi: 'इस खाते में एक खतौनी गलत पक्ष में हो गई' },
  WRONG_AMOUNT: { en: 'A posting was made with a wrong amount in this account', hi: 'इस खाते में एक खतौनी गलत राशि से हुई' },
};
const WHAT_IF: Record<CrisisKind, Crisis['whatIf']> = {
  OMITTED: {
    question: {
      en: 'What if the transaction had not been recorded at all — neither in the journal nor in any account?',
      hi: 'यदि यह लेन-देन बिल्कुल लिखा ही न गया होता — न रोज़नामचे में, न किसी खाते में — तो क्या होता?',
    },
    options: [
      { en: 'The trial balance would still agree, so it could not reveal the error', hi: 'तलपट फिर भी मिल जाता, इसलिए वह इस गलती को नहीं दिखा पाता' },
      { en: 'The debit total would be short', hi: 'नाम पक्ष का योग कम रहता' },
      { en: 'The credit total would be short', hi: 'जमा पक्ष का योग कम रहता' },
    ],
    answer: 0,
    why: {
      en: 'A complete omission leaves out equal debit and credit, so both totals fall by the same amount. Agreement of a trial balance is not proof of accuracy.',
      hi: 'पूर्ण लोप में नाम और जमा दोनों बराबर राशि से छूटते हैं, इसलिए दोनों योग समान रूप से घटते हैं। तलपट का मिल जाना शुद्धता का पक्का प्रमाण नहीं है।',
    },
  },
  WRONG_SIDE: {
    question: {
      en: 'What if the amount had gone to the correct side, but of a WRONG account (for example another account of the same kind)?',
      hi: 'यदि राशि सही पक्ष में, पर किसी गलत खाते में (जैसे उसी प्रकार के दूसरे खाते में) लिखी गई होती तो क्या होता?',
    },
    options: [
      { en: 'The trial balance would not agree', hi: 'तलपट नहीं मिलता' },
      { en: 'The trial balance would still agree, so it could not reveal the error', hi: 'तलपट फिर भी मिल जाता, इसलिए वह इस गलती को नहीं दिखा पाता' },
      { en: 'The difference would be twice the amount', hi: 'अंतर राशि का दुगुना होता' },
    ],
    answer: 1,
    why: {
      en: 'The debit and credit totals stay equal when only the account is wrong. Such an error does not affect the trial balance and is corrected without a Suspense Account.',
      hi: 'केवल खाता गलत होने पर नाम और जमा के योग बराबर रहते हैं। ऐसी अशुद्धि तलपट को प्रभावित नहीं करती और बिना उचंत खाते के सुधारी जाती है।',
    },
  },
  WRONG_AMOUNT: {
    question: {
      en: 'What if the wrong amount had been written in the journal itself and then posted to BOTH accounts?',
      hi: 'यदि गलत राशि रोज़नामचे में ही लिखी गई होती और फिर दोनों खातों में वही खतौनी होती तो क्या होता?',
    },
    options: [
      { en: 'The debit total would be bigger', hi: 'नाम पक्ष का योग बड़ा होता' },
      { en: 'The credit total would be bigger', hi: 'जमा पक्ष का योग बड़ा होता' },
      { en: 'The trial balance would still agree, so it could not reveal the error', hi: 'तलपट फिर भी मिल जाता, इसलिए वह इस गलती को नहीं दिखा पाता' },
    ],
    answer: 2,
    why: {
      en: 'The same wrong amount on both sides keeps the totals equal. Only one-sided errors disturb the trial balance and need a Suspense Account.',
      hi: 'दोनों पक्षों में समान गलत राशि होने पर योग बराबर रहते हैं। केवल एकपक्षीय अशुद्धियाँ तलपट को बिगाड़ती हैं और उचंत खाते की आवश्यकता होती है।',
    },
  },
};

/** Build the crisis for a seed (the same seed always gives the same crisis). */
export function makeCrisis(seed: number): Crisis {
  const r = new Rng(seed * 7919 + 13);
  for (let attempt = 0; attempt < 400; attempt++) {
    const { l, lines } = month(r);
    const name = (id: string) => l.chart.get(id).name;
    const journal: JournalLine[] = lines.map(x => ({
      day: x.day,
      en: x.tx ? x.tx.en : 'Started business with cash (capital)',
      hi: x.tx ? x.tx.hi : 'रोकड़ से व्यापार आरंभ किया (पूँजी)',
      amount: M(x.amount).toString(),
      dr: x.tx ? x.tx.dr : 'cash',
      cr: x.tx ? x.tx.cr : 'capital',
    }));
    const ids = [...new Set(journal.flatMap(j => [j.dr, j.cr]))];
    const correct = new Map<string, Posting[]>(
      ids.map(id => [id, journal.filter(j => j.dr === id || j.cr === id).map(j => ({ day: j.day, en: j.en, hi: j.hi, side: (j.dr === id ? 'DR' : 'CR') as Side, amount: j.amount }))]),
    );

    const k = r.int(0, journal.length - 1),
      side: Side = r.int(0, 1) === 0 ? 'DR' : 'CR',
      kind = r.pick(CRISIS_KINDS);
    const line = journal[k]!,
      account = side === 'DR' ? line.dr : line.cr,
      m = Money.parse(line.amount);
    const rows = correct.get(account)!,
      at = rows.findIndex(p => p.day === line.day && p.side === side && p.amount === line.amount);
    const opposite: Side = side === 'DR' ? 'CR' : 'DR';
    let wrongAmount = m;
    if (kind === 'WRONG_AMOUNT') {
      const d = M(r.pick([1000, 2000, 900, 9000]));
      wrongAmount = r.int(0, 1) === 0 || m.cmp(d) <= 0 ? m.add(d) : m.sub(d);
    }
    const spoiled =
      kind === 'OMITTED' ? rows.filter((_, i) => i !== at) : rows.map((p, i) => (i !== at ? p : kind === 'WRONG_SIDE' ? { ...p, side: opposite } : { ...p, amount: wrongAmount.toString() }));
    // keep the picture readable: the spoiled account still has a balance, on the side it really belongs to
    const before = net(rows),
      after = net(spoiled);
    if (after.isZero() || before.isZero() || after.isNegative() !== before.isNegative()) continue;

    const accounts: CrisisAccount[] = ids.map(id => {
      const posted = id === account ? spoiled : correct.get(id)!;
      return { id, name: name(id), nameHi: accountHi(name(id)), posted, shown: shownOf(posted) };
    });
    const dr = Money.sum(accounts.filter(a => a.shown?.side === 'DR').map(a => Money.parse(a.shown!.amount))),
      cr = Money.sum(accounts.filter(a => a.shown?.side === 'CR').map(a => Money.parse(a.shown!.amount)));
    const s = suspenseFromTrialBalance(dr, cr);
    if (!s) continue;

    // the engine's rectification: (what should have been posted) − (what was posted); the gap goes through Suspense
    const fix = rectify(kind === 'OMITTED' ? [] : [{ account, side: kind === 'WRONG_SIDE' ? opposite : side, amount: wrongAmount }], [{ account, side, amount: m }]);
    // Suspense sits on the short side of the trial balance, so the rectifying entry must touch it on the OTHER side to close it
    const own = fix.lines.find(x => x.account === account)!,
      sus = fix.lines.find(x => x.account !== account)!;
    if (!fix.usesSuspense || fix.lines.length !== 2 || !sus.amount.equals(s.amount) || sus.side === s.side) throw new Error(`crisis ${seed}: rectification does not clear the suspense`);
    const entry = { dr: own.side === 'DR' ? account : SUSPENSE, cr: own.side === 'CR' ? account : SUSPENSE, amount: own.amount.toString() };

    const acc = name(account),
      accHi = accountHi(acc),
      sideEn = side === 'DR' ? 'debit' : 'credit',
      sideHi = side === 'DR' ? TERM_HI.debitWord : TERM_HI.creditWord,
      f = (x: Money) => x.format();
    const cause: Bilingual =
      kind === 'OMITTED'
        ? {
            en: `${line.day} April — “${line.en}”: the ${sideEn} of ${f(m)} was never posted to ${acc} Account.`,
            hi: `${line.day} अप्रैल — “${line.hi}”: ${f(m)} की ${sideHi} खतौनी ${accHi} खाते में हुई ही नहीं।`,
          }
        : kind === 'WRONG_SIDE'
          ? {
              en: `${line.day} April — “${line.en}”: ${f(m)} was posted to the ${opposite === 'DR' ? 'debit' : 'credit'} of ${acc} Account instead of the ${sideEn}. The difference is twice the amount.`,
              hi: `${line.day} अप्रैल — “${line.hi}”: ${f(m)} की खतौनी ${accHi} खाते के ${sideHi} पक्ष की जगह ${opposite === 'DR' ? TERM_HI.debitWord : TERM_HI.creditWord} पक्ष में हो गई। अंतर राशि का दुगुना है।`,
            }
          : {
              en: `${line.day} April — “${line.en}”: ${acc} Account was ${sideEn}ed with ${f(wrongAmount)} instead of ${f(m)}.`,
              hi: `${line.day} अप्रैल — “${line.hi}”: ${accHi} खाते में ${f(m)} की जगह ${f(wrongAmount)} की ${sideHi} खतौनी हुई।`,
            };
    return {
      seed,
      journal,
      accounts,
      totals: { dr: dr.toString(), cr: cr.toString() },
      answer: { difference: s.amount.toString(), shortSide: s.side, account, kind, entry },
      cause,
      whatIf: WHAT_IF[kind],
    };
  }
  throw new Error(`crisis ${seed}: could not build a scenario`);
}

/** Trial-balance totals after the given entry is posted on top of the shown balances (used to prove that the rectifying entry works). */
export function totalsAfter(c: Crisis, entry: { dr: string; cr: string; amount: string }): { dr: Money; cr: Money; suspense: Money } {
  const nets = new Map<string, Money>(c.accounts.map(a => [a.id, a.shown ? (a.shown.side === 'DR' ? Money.parse(a.shown.amount) : Money.parse(a.shown.amount).neg()) : Money.ZERO]));
  const diff = Money.parse(c.answer.difference);
  nets.set(SUSPENSE, c.answer.shortSide === 'DR' ? diff : diff.neg()); // the suspense account opened in step 1
  const amt = Money.parse(entry.amount);
  nets.set(entry.dr, (nets.get(entry.dr) ?? Money.ZERO).add(amt));
  nets.set(entry.cr, (nets.get(entry.cr) ?? Money.ZERO).sub(amt));
  const vals = [...nets.values()];
  return { dr: Money.sum(vals.filter(v => v.isPositive())), cr: Money.sum(vals.filter(v => v.isNegative()).map(v => v.neg())), suspense: nets.get(SUSPENSE)! };
}

// ───────────────────────── rewards (plain integers — XP is not money) ─────────────────────────
export type CrisisStep = 'DIAGNOSE' | 'LOCATE' | 'CLASSIFY' | 'RECTIFY' | 'WHAT_IF';
export const CRISIS_XP: Record<CrisisStep, number> = { DIAGNOSE: 10, LOCATE: 20, CLASSIFY: 15, RECTIFY: 30, WHAT_IF: 25 };
export const CRISIS_LIVES = 3,
  SPEED_BONUS_XP = 10,
  SPEED_BONUS_SECONDS = 180;
/** XP for a step: full on the first try, half otherwise; ×1.5 when the two steps before it were both right first time. */
export function stepXp(step: CrisisStep, firstTry: boolean, streak: number): number {
  const base = firstTry ? CRISIS_XP[step] : Math.floor(CRISIS_XP[step] / 2);
  return firstTry && streak >= 2 ? Math.floor((base * 3) / 2) : base;
}
export interface CrisisBadge {
  readonly id: 'suspense-slayer' | 'auditors-eye';
  readonly en: string;
  readonly hi: string;
}
export function crisisBadges(o: { cleared: boolean; livesLost: number; clearedInARow: number }): CrisisBadge[] {
  const out: CrisisBadge[] = [];
  if (o.cleared && o.livesLost === 0) out.push({ id: 'suspense-slayer', en: 'Suspense Slayer', hi: 'उचंत विजेता' });
  if (o.cleared && o.clearedInARow >= 3) out.push({ id: 'auditors-eye', en: "Auditor's Eye", hi: 'लेखा-परीक्षक की नज़र' });
  return out;
}
