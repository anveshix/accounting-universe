/**
 * The Journal Builder's case bank and answer checking — pure data and pure functions, so the entries can be proved
 * correct by tests (every case balances; every account exists in the Class XI chart) instead of by eye.
 */
import type { Side } from '../../engine/src';

export interface BuilderLine {
  readonly account: string;
  readonly side: Side;
  readonly rupees: number;
}
export interface BuilderCase {
  readonly text: string;
  readonly prompt: string;
  readonly lines: readonly BuilderLine[];
  readonly why: string;
}

/** Curated Class XI entries. Amounts are whole rupees; compound cases appear once the two-line habit is formed. */
export const JOURNAL_CASES: readonly BuilderCase[] = [
  {
    text: 'Ravi starts business with ₹1,00,000 cash.',
    prompt: 'One account receives the benefit, one gives it. Two lines.',
    lines: [
      { account: 'cash', side: 'DR', rupees: 100_000 },
      { account: 'capital', side: 'CR', rupees: 100_000 },
    ],
    why: 'Cash comes into the business (asset increases → debit). The owner supplies the capital (capital increases → credit).',
  },
  {
    text: 'Bought machinery ₹40,000. Paid ₹15,000 in cash and the rest on credit.',
    prompt: 'Three lines: the full cost is debited, but only part of it was paid.',
    lines: [
      { account: 'machinery', side: 'DR', rupees: 40_000 },
      { account: 'cash', side: 'CR', rupees: 15_000 },
      { account: 'creditors', side: 'CR', rupees: 25_000 },
    ],
    why: 'Machinery is recorded at its full cost (asset increases → debit). Cash goes out (asset decreases → credit) and the unpaid balance is owed (liability increases → credit).',
  },
  {
    text: 'Purchased goods ₹30,000. Paid half by cheque, the rest on credit.',
    prompt: 'Purchases is an expense for a trading business. Split the credit side.',
    lines: [
      { account: 'purchases', side: 'DR', rupees: 30_000 },
      { account: 'bank', side: 'CR', rupees: 15_000 },
      { account: 'creditors', side: 'CR', rupees: 15_000 },
    ],
    why: 'Goods bought for resale are a purchase (expense increases → debit). The cheque reduces the bank balance and the unpaid half creates creditors — both credits.',
  },
  {
    text: 'Sold goods ₹25,000. Received ₹10,000 in cash; the customer will pay the rest later.',
    prompt: 'Two debits this time: cash and the customer’s promise to pay.',
    lines: [
      { account: 'cash', side: 'DR', rupees: 10_000 },
      { account: 'debtors', side: 'DR', rupees: 15_000 },
      { account: 'sales', side: 'CR', rupees: 25_000 },
    ],
    why: 'Cash received (asset up → debit) and the balance owed by the customer (asset up → debit) together equal the sales income (revenue increases → credit).',
  },
  {
    text: 'Paid rent ₹8,000 and wages ₹12,000 by cheque.',
    prompt: 'Two expenses, one payment. Two debits, one credit.',
    lines: [
      { account: 'rent', side: 'DR', rupees: 8_000 },
      { account: 'wages', side: 'DR', rupees: 12_000 },
      { account: 'bank', side: 'CR', rupees: 20_000 },
    ],
    why: 'Rent and wages are expenses (they increase → debit). Both payments leave the bank (asset decreases → credit).',
  },
  {
    text: 'Ravi withdraws ₹5,000 cash and goods worth ₹2,000 for personal use.',
    prompt: 'Drawings is one total, but it is met by two different assets.',
    lines: [
      { account: 'drawings', side: 'DR', rupees: 7_000 },
      { account: 'cash', side: 'CR', rupees: 5_000 },
      { account: 'purchases', side: 'CR', rupees: 2_000 },
    ],
    why: 'Drawings increase (debit). Cash leaves the business, and goods taken by the owner reduce purchases — both credits.',
  },
  {
    text: 'Paid a creditor ₹10,000 by cheque.',
    prompt: 'One asset falls, one liability falls. Two lines.',
    lines: [
      { account: 'creditors', side: 'DR', rupees: 10_000 },
      { account: 'bank', side: 'CR', rupees: 10_000 },
    ],
    why: 'The liability is settled (liability decreases → debit). The bank balance falls (asset decreases → credit).',
  },
  {
    text: 'Ram, who owed us ₹4,000, became insolvent. Nothing is recoverable.',
    prompt: 'The customer disappears as an asset. Where does the loss go?',
    lines: [
      { account: 'bad-debts', side: 'DR', rupees: 4_000 },
      { account: 'debtors', side: 'CR', rupees: 4_000 },
    ],
    why: 'Bad debts are a loss (expense increases → debit). The amount is no longer receivable, so debtors fall (asset decreases → credit).',
  },
];

/** Whole rupees from what a student typed: "1,00,000" → 100000. Anything that is not a plain rupee amount is null. */
export function parseRupees(text: string): number | null {
  const t = text.replace(/[,\s₹]/g, '');
  if (!/^\d{1,9}$/.test(t)) return null;
  return Number(t);
}

/** Exact-match check of a student's entry against the marking scheme, ignoring line order but not amounts or sides. */
export function sameEntry(given: readonly { readonly account: string; readonly side: Side; readonly amount: string }[], expected: readonly BuilderLine[]): boolean {
  if (given.length !== expected.length) return false;
  const key = (account: string, side: Side, amount: number) => `${account}|${side}|${amount}`;
  const want = expected.map(l => key(l.account, l.side, l.rupees)).sort();
  const got = given
    .map(l => {
      const n = parseRupees(l.amount);
      return n === null ? 'x' : key(l.account, l.side, n);
    })
    .sort();
  return want.every((k, i) => k === got[i]);
}
