/**
 * Classroom TLM Factory: one syllabus topic + a seed -> a complete, engine-checked teaching kit (smartboard frames,
 * prediction questions, printable cards, matching sets, worksheet data and answer key). Pure and deterministic: the same
 * (topic, seed) always yields the same kit, so a teacher can reprint the key or a student can open the same set from a link.
 *
 * Accounting content comes from the reviewed Debit & Credit trainer templates; every amount is exact (`Money`), every entry is
 * posted through the engine's `Ledger`, and every kit is validated before it is returned (balances never negative on
 * cash/bank, trial balance agrees, the ledger sees exactly the transactions printed on the cards).
 */
import { Ledger, Money, starterChartClassXI, type Side } from '../../engine/src';
import { Rng } from './rng';

export type TlmTopic = 'XI.2.rules' | 'XI.2.journal' | 'XI.2.ledger' | 'XI.2.tb';
export interface TlmTopicInfo {
  readonly id: TlmTopic;
  readonly title: string;
  readonly task: string;
  readonly mode: 'rules' | 'journal' | 'ledger' | 'tb';
}
/** Topics a kit exists for. Every id is a Class XI clause of the official syllabus (a test checks this). */
export const TLM_TOPICS: readonly TlmTopicInfo[] = [
  { id: 'XI.2.rules', title: 'Rules of debit and credit', task: 'Name the account debited and the account credited.', mode: 'rules' },
  { id: 'XI.2.journal', title: 'Journal (book of original entry)', task: 'Write each transaction as a journal entry.', mode: 'journal' },
  { id: 'XI.2.ledger', title: 'Ledger: format, posting, balancing', task: 'Post the journal to ledger accounts and balance them.', mode: 'ledger' },
  { id: 'XI.2.tb', title: 'Trial balance', task: 'Prepare the trial balance (balance method) from the closing balances.', mode: 'tb' },
];
export const tlmTopic = (id: string): TlmTopicInfo | undefined => TLM_TOPICS.find(t => t.id === id);

export interface TlmAccount {
  readonly id: string;
  readonly name: string;
  readonly nature: string;
  readonly normal: Side;
}
export interface TlmTxn {
  readonly no: number;
  readonly date: string;
  readonly text: string;
  readonly amount: Money;
  readonly dr: TlmAccount;
  readonly cr: TlmAccount;
  readonly why: string;
}
export interface TlmLedgerRow {
  readonly no: number;
  readonly date: string;
  readonly side: Side;
  readonly particulars: string;
  readonly amount: Money;
}
export interface TlmLedgerAccount {
  readonly account: TlmAccount;
  readonly rows: readonly TlmLedgerRow[];
  readonly totalDr: Money;
  readonly totalCr: Money;
  /** Closing balance (absolute) and the side it is carried on. */
  readonly balance: Money;
  readonly balanceSide: Side;
}
export interface TlmTbRow {
  readonly account: TlmAccount;
  readonly debit: Money;
  readonly credit: Money;
}
export interface TlmPrediction {
  readonly q: string;
  readonly a: string;
  readonly why: string;
}
export interface TlmKit {
  readonly topic: TlmTopicInfo;
  readonly seed: number;
  readonly txns: readonly TlmTxn[];
  readonly accounts: readonly TlmAccount[]; // every account used, in order of first use
  readonly ledger: readonly TlmLedgerAccount[];
  readonly trialBalance: { readonly rows: readonly TlmTbRow[]; readonly totalDr: Money; readonly totalCr: Money };
  readonly predictions: readonly TlmPrediction[];
}

const NATURE: Record<string, string> = { ASSET: 'Asset', LIABILITY: 'Liability', CAPITAL: 'Capital', REVENUE: 'Income', EXPENSE: 'Expense', DRAWINGS: 'Drawings' };
const PEOPLE = ['Ramesh', 'Sunita', 'Imran', 'Kavita', 'Arjun', 'Meena', 'Vikram', 'Pooja', 'Dinesh', 'Neha', 'Harish', 'Asha'];
const inr = (n: number) => n.toLocaleString('en-IN');

interface Spec {
  readonly text: string;
  readonly dr: string;
  readonly cr: string;
  readonly why: string;
  readonly amount: number;
}
/** A fixed, sensible first month of a small trader. Only the amounts and the two names vary with the seed. */
function script(seed: number): Spec[] {
  const r = new Rng(seed);
  const supplier = r.pick(PEOPLE);
  const customer = r.pick(PEOPLE.filter(p => p !== supplier));
  const A = r.multiple(200000, 400000, 10000),
    B = r.multiple(50000, 100000, 5000),
    C = r.multiple(10000, 30000, 5000);
  const D = r.multiple(30000, 80000, 5000),
    E = r.multiple(20000, 60000, 5000),
    F = r.multiple(2000, 8000, 500);
  const G = r.multiple(20000, 50000, 5000),
    H = r.multiple(10000, G, 5000);
  const I = r.multiple(10000, Math.min(D, B - C + H), 5000),
    J = r.multiple(1000, 5000, 500);
  return [
    { amount: A, text: `The owner started the business with ₹${inr(A)} in cash.`, dr: 'cash', cr: 'capital', why: 'Cash (asset) comes in; the owner’s claim (capital) rises.' },
    { amount: B, text: `Deposited ₹${inr(B)} cash into the bank.`, dr: 'bank', cr: 'cash', why: 'One asset rises (bank) while another falls (cash).' },
    { amount: C, text: `Bought furniture for ₹${inr(C)} and paid by cheque.`, dr: 'furniture', cr: 'bank', why: 'Furniture is a fixed asset; the cheque reduces the bank balance.' },
    { amount: D, text: `Purchased goods on credit from ${supplier} for ₹${inr(D)}.`, dr: 'purchases', cr: 'creditors', why: 'Goods for resale go to Purchases; the supplier is a creditor.' },
    { amount: E, text: `Sold goods for cash ₹${inr(E)}.`, dr: 'cash', cr: 'sales', why: 'Cash rises; sales (income) is credited.' },
    { amount: F, text: `Paid rent ₹${inr(F)} in cash.`, dr: 'rent', cr: 'cash', why: 'Rent is an expense (debit); cash falls (credit).' },
    { amount: G, text: `Sold goods on credit to ${customer} for ₹${inr(G)}.`, dr: 'debtors', cr: 'sales', why: 'The customer owes us (an asset); sales is income.' },
    { amount: H, text: `Received a cheque of ₹${inr(H)} from ${customer}, a debtor, and deposited it in the bank.`, dr: 'bank', cr: 'debtors', why: 'Bank rises; the debtor’s balance falls.' },
    { amount: I, text: `Paid ₹${inr(I)} to ${supplier}, a creditor, by cheque.`, dr: 'creditors', cr: 'bank', why: 'The liability falls (debit); bank falls (credit).' },
    { amount: J, text: `The owner withdrew ₹${inr(J)} cash for personal use.`, dr: 'drawings', cr: 'cash', why: 'Personal withdrawals are Drawings, not a business expense.' },
  ];
}

export function buildTlmKit(topicId: TlmTopic, seed: number): TlmKit {
  const topic = tlmTopic(topicId);
  if (!topic) throw new Error(`No classroom kit for topic "${topicId}".`);
  const chart = starterChartClassXI(),
    ledger = new Ledger(chart);
  const acct = (id: string): TlmAccount => {
    const a = chart.get(id);
    return { id, name: a.name, nature: NATURE[a.type]!, normal: a.type === 'ASSET' || a.type === 'EXPENSE' || a.type === 'DRAWINGS' ? 'DR' : 'CR' };
  };
  const txns: TlmTxn[] = script(seed).map((s, k) => {
    const amount = Money.rupees(s.amount),
      date = `2026-04-${String(k + 1).padStart(2, '0')}`;
    ledger.post({
      date,
      narration: s.text,
      lines: [
        { accountId: s.dr, side: 'DR', amount },
        { accountId: s.cr, side: 'CR', amount },
      ],
    });
    return { no: k + 1, date, text: s.text, amount, dr: acct(s.dr), cr: acct(s.cr), why: s.why };
  });
  // validation: a kit that fails any of these is never shown
  for (const id of ['cash', 'bank']) if (ledger.balance(id).isNegative()) throw new Error(`Kit invalid: ${id} would go negative (seed ${seed}).`);
  const tb = ledger.trialBalance();
  if (!tb.balanced) throw new Error(`Kit invalid: trial balance does not agree (seed ${seed}).`);

  const order: string[] = [];
  for (const t of txns) for (const a of [t.dr, t.cr]) if (!order.includes(a.id)) order.push(a.id);
  const accounts = order.map(acct);
  const led: TlmLedgerAccount[] = accounts.map(account => {
    const rows: TlmLedgerRow[] = txns.flatMap(t =>
      t.dr.id === account.id
        ? [{ no: t.no, date: t.date, side: 'DR' as Side, particulars: t.cr.name, amount: t.amount }]
        : t.cr.id === account.id
          ? [{ no: t.no, date: t.date, side: 'CR' as Side, particulars: t.dr.name, amount: t.amount }]
          : [],
    );
    const totalDr = Money.sum(rows.filter(x => x.side === 'DR').map(x => x.amount)),
      totalCr = Money.sum(rows.filter(x => x.side === 'CR').map(x => x.amount));
    const net = totalDr.sub(totalCr);
    return { account, rows, totalDr, totalCr, balance: net.abs(), balanceSide: net.isNegative() ? 'CR' : 'DR' };
  });
  const rows: TlmTbRow[] = tb.rows.map(r => ({ account: acct(r.account.id), debit: r.debit, credit: r.credit }));
  const predictions: TlmPrediction[] = txns.map(t => ({
    q: `Transaction ${t.no}: ${t.text} Which account is debited and which is credited?`,
    a: `Debit ${t.dr.name} (${t.dr.nature}); credit ${t.cr.name} (${t.cr.nature}) — ${t.amount.format()}.`,
    why: t.why,
  }));
  predictions.push({
    q: 'After all ten entries, will the debit total of the trial balance equal the credit total? Why?',
    a: `Yes — both are ${tb.totalDebit.format()}.`,
    why: 'Every entry has an equal debit and credit, so the two sides of the ledger must agree. (Agreement does not prove there are no errors of principle, omission or compensating errors.)',
  });
  return { topic, seed, txns, accounts, ledger: led, trialBalance: { rows, totalDr: tb.totalDebit, totalCr: tb.totalCredit }, predictions };
}
