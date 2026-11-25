/**
 * Accounting Error Detective (Class XI, clause XI.2.errors): a transaction was recorded WRONG. The student works out
 * (1) the class of error, (2) whether the trial balance still agrees, (3) the rectifying entry.
 * Class and trial-balance effect come from the engine tables (`AFFECTS_TRIAL_BALANCE`); the rectifying entry is computed by the
 * engine's `rectify(wrong, right)`, never typed in by hand. Scope is the syllabus list: omission, commission, principle,
 * compensating, and one-sided amount errors that land in a Suspense A/c.
 */
import { AFFECTS_TRIAL_BALANCE, Money, rectify, starterChartClassXI, type ErrorClass, type RectLine } from '../../engine/src';
import { Rng } from './rng';

export const DETECTIVE_CLASSES: readonly { id: ErrorClass; label: string; clue: string }[] = [
  { id: 'OMISSION_COMPLETE', label: 'Error of complete omission', clue: 'The whole transaction was never recorded.' },
  { id: 'OMISSION_PARTIAL', label: 'Error of partial omission', clue: 'One side of the entry was recorded and the other side left out.' },
  { id: 'COMMISSION', label: 'Error of commission', clue: 'Right idea, wrong account of the same kind (or wrong amount/side in the posting).' },
  { id: 'PRINCIPLE', label: 'Error of principle', clue: 'An expense, drawing or capital item was put in the wrong class of account.' },
  { id: 'COMPENSATING', label: 'Compensating error', clue: 'Two or more mistakes that cancel each other out.' },
  { id: 'WRONG_AMOUNT_ONE_SIDE', label: 'Wrong amount on one side only', clue: 'Debit and credit were posted with different amounts.' },
];
export const SUSPENSE_NAME = 'Suspense A/c';
export interface DetectiveCase {
  readonly id: string;
  readonly seed: number;
  readonly story: string;
  readonly wrongNote: string;
  readonly cls: ErrorClass;
  readonly affectsTb: boolean;
  /** null for compensating errors: they need several corrections, so only steps 1 and 2 are asked. */
  readonly rectification: { readonly dr: string; readonly cr: string; readonly amount: Money; readonly usesSuspense: boolean } | null;
  readonly explain: string;
}
interface Tpl {
  readonly id: string;
  readonly cls: ErrorClass;
  readonly lo: number;
  readonly hi: number;
  readonly make: (a: number, d: number) => { story: string; wrongNote: string; wrong?: RectLine[]; right?: RectLine[]; explain: string };
}
const R = (account: string, side: 'DR' | 'CR', n: number): RectLine => ({ account, side, amount: Money.rupees(n) });
const inr = (n: number) => '₹' + n.toLocaleString('en-IN');
const TPLS: readonly Tpl[] = [
  {
    id: 'rent-as-salary',
    cls: 'COMMISSION',
    lo: 2000,
    hi: 12000,
    make: a => ({
      story: `Rent of ${inr(a)} was paid in cash.`,
      wrongNote: 'The book-keeper debited Salary A/c.',
      wrong: [R('Salary', 'DR', a), R('Cash', 'CR', a)],
      right: [R('Rent', 'DR', a), R('Cash', 'CR', a)],
      explain: 'Both Salary and Rent are expense accounts: the wrong account of the same kind was debited. Two-sided, so the trial balance still agrees.',
    }),
  },
  {
    id: 'electricity-as-insurance',
    cls: 'COMMISSION',
    lo: 800,
    hi: 6000,
    make: a => ({
      story: `Electricity bill of ${inr(a)} was paid by cheque.`,
      wrongNote: 'The amount was debited to Insurance A/c.',
      wrong: [R('Insurance', 'DR', a), R('Bank', 'CR', a)],
      right: [R('Electricity', 'DR', a), R('Bank', 'CR', a)],
      explain: 'Insurance and Electricity are both expenses; the wrong account was debited. Debit and credit are equal, so the trial balance agrees.',
    }),
  },
  {
    id: 'machinery-as-purchases',
    cls: 'PRINCIPLE',
    lo: 20000,
    hi: 90000,
    make: a => ({
      story: `Machinery costing ${inr(a)} was bought for cash for use in the business.`,
      wrongNote: 'It was debited to Purchases A/c.',
      wrong: [R('Purchases', 'DR', a), R('Cash', 'CR', a)],
      right: [R('Machinery', 'DR', a), R('Cash', 'CR', a)],
      explain: 'Machinery is a fixed asset (capital expenditure); Purchases is for goods bought for resale. Treating a capital item as revenue is an error of principle. The trial balance agrees.',
    }),
  },
  {
    id: 'furniture-as-purchases',
    cls: 'PRINCIPLE',
    lo: 10000,
    hi: 50000,
    make: a => ({
      story: `Furniture worth ${inr(a)} was bought and paid for by cheque.`,
      wrongNote: 'It was debited to Purchases A/c.',
      wrong: [R('Purchases', 'DR', a), R('Bank', 'CR', a)],
      right: [R('Furniture', 'DR', a), R('Bank', 'CR', a)],
      explain: 'Furniture is an asset. Debiting it to Purchases is an error of principle; the trial balance still agrees.',
    }),
  },
  {
    id: 'drawings-as-wages',
    cls: 'PRINCIPLE',
    lo: 1000,
    hi: 8000,
    make: a => ({
      story: `The owner withdrew ${inr(a)} cash for personal use.`,
      wrongNote: 'It was debited to Wages A/c.',
      wrong: [R('Wages', 'DR', a), R('Cash', 'CR', a)],
      right: [R('Drawings', 'DR', a), R('Cash', 'CR', a)],
      explain: 'Personal withdrawals are Drawings, not a business expense: an error of principle. The trial balance agrees.',
    }),
  },
  {
    id: 'sale-unrecorded',
    cls: 'OMISSION_COMPLETE',
    lo: 5000,
    hi: 60000,
    make: a => ({
      story: `Goods were sold for cash ${inr(a)}.`,
      wrongNote: 'The sale was not recorded in any book.',
      wrong: [],
      right: [R('Cash', 'DR', a), R('Sales', 'CR', a)],
      explain: 'Nothing was recorded on either side, so debits still equal credits: an error of complete omission. The trial balance agrees (but profit and cash are understated).',
    }),
  },
  {
    id: 'cash-side-missed',
    cls: 'OMISSION_PARTIAL',
    lo: 5000,
    hi: 60000,
    make: a => ({
      story: `Goods were sold for cash ${inr(a)}.`,
      wrongNote: 'Sales A/c was credited, but the cash debit was never posted.',
      wrong: [R('Sales', 'CR', a)],
      right: [R('Cash', 'DR', a), R('Sales', 'CR', a)],
      explain:
        'Only one side was recorded: an error of partial omission. Credits now exceed debits, so the trial balance does NOT agree and the difference goes to a Suspense A/c on the debit side until found.',
    }),
  },
  {
    id: 'rent-short-credit',
    cls: 'WRONG_AMOUNT_ONE_SIDE',
    lo: 3000,
    hi: 12000,
    make: (a, d) => ({
      story: `Rent of ${inr(a)} was paid in cash.`,
      wrongNote: `Rent A/c was debited with ${inr(a)} but Cash A/c was credited with only ${inr(a - d)}.`,
      wrong: [R('Rent', 'DR', a), R('Cash', 'CR', a - d)],
      right: [R('Rent', 'DR', a), R('Cash', 'CR', a)],
      explain: `The two sides were posted with different amounts, so the trial balance has debits ahead of credits by ${inr(d)}, so the credit side is short; the difference is held in a Suspense A/c on the credit side. Cash A/c must be credited with the remaining ${inr(d)}.`,
    }),
  },
  {
    id: 'overcast',
    cls: 'COMPENSATING',
    lo: 1000,
    hi: 5000,
    make: a => ({
      story: `The Sales Book was over-added by ${inr(a)} and, in the same month, the Purchases Book was also over-added by ${inr(a)}.`,
      wrongNote: 'Nobody noticed because the trial balance agreed.',
      explain: 'Two errors of equal amount on opposite sides cancel out: a compensating error. The trial balance agrees even though both accounts are wrong.',
    }),
  },
];
export const DETECTIVE_TEMPLATE_COUNT = TPLS.length;

export function buildCase(seed: number): DetectiveCase {
  const r = new Rng(seed),
    t = TPLS[r.int(0, TPLS.length - 1)]!;
  const a = r.multiple(t.lo, t.hi, 500),
    d = r.multiple(500, 1000, 500),
    m = t.make(a, d);
  let rectification: DetectiveCase['rectification'] = null;
  if (m.right) {
    const x = rectify(m.wrong ?? [], m.right),
      dr = x.lines.filter(l => l.side === 'DR'),
      cr = x.lines.filter(l => l.side === 'CR');
    if (dr.length !== 1 || cr.length !== 1) throw new Error(`Detective template ${t.id} needs a one-line debit and one-line credit rectification.`);
    rectification = { dr: dr[0]!.account, cr: cr[0]!.account, amount: dr[0]!.amount, usesSuspense: x.usesSuspense };
  }
  return { id: t.id, seed, story: m.story, wrongNote: m.wrongNote, cls: t.cls, affectsTb: AFFECTS_TRIAL_BALANCE[t.cls], rectification, explain: m.explain };
}
/** Accounts offered in step 3 (the Class XI chart, shown as "<name> A/c" strings that match the engine's rectification lines, plus Suspense). */
export function detectiveAccountChoices(): string[] {
  const names = starterChartClassXI()
    .list()
    .map(a => a.name);
  return [...new Set(names)].concat(SUSPENSE_NAME).sort((x, y) => x.localeCompare(y));
}
