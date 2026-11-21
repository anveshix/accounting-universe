import type { ChartOfAccounts, Side } from '../../engine/src';

/** A trainer question has exactly one debit and one credit account. */
export interface TrainerItem {
  readonly text: string;
  readonly dr: string;
  readonly cr: string;
  readonly why: string;
}

/** Fisher–Yates sample without replacement; the optional RNG makes the selection testable. */
export function trainerSample<T>(items: readonly T[], count: number, random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out.slice(0, count);
}

/** Feedback refers to what the learner selected, without assuming the wrong account never changes. */
export function trainerFeedback(chart: ChartOfAccounts, q: TrainerItem, selected: string, side: Side): string {
  const right = side === 'DR' ? q.dr : q.cr;
  const other = side === 'DR' ? q.cr : q.dr;
  const chosen = chart.get(selected),
    expected = chart.get(right);
  const word = side === 'DR' ? 'debit' : 'credit';
  if (selected === right) return `${expected.name} is the correct ${word} account.`;
  if (selected === other) return `${chosen.name} belongs on the other side of this entry. ${word === 'debit' ? 'Debit' : 'Credit'} ${expected.name} here.`;
  if (right === 'machinery' && selected === 'purchases') return 'Purchases is for goods bought for resale. Machinery bought for use is an asset; debit Machinery.';
  if (right === 'drawings' && chosen.type === 'EXPENSE') return 'The owner’s personal withdrawal is Drawings, not a business expense; debit Drawings.';
  return `${chosen.name} is not the expected ${word} account here. Identify what changed in the transaction: ${expected.name} is the expected ${word}.`;
}

// ───────── generated questions: hundreds of distinct transactions from templates x names x amounts ─────────
const PEOPLE = ['Ramesh', 'Sunita', 'Imran', 'Kavita', 'Arjun', 'Meena', 'Vikram', 'Pooja', 'Dinesh', 'Neha', 'Harish', 'Asha', 'Naveen', 'Divya', 'Sanjay', 'Rekha'];
interface Tpl { readonly t: (p: string, a: string) => string; readonly dr: string; readonly cr: string; readonly why: string; readonly lo: number; readonly hi: number }
const T = (t: Tpl['t'], dr: string, cr: string, why: string, lo = 1000, hi = 90000): Tpl => ({ t, dr, cr, why, lo, hi });
/** Every dr/cr id exists in starterChartClassXI(). Wording avoids anything outside the Class XI syllabus. */
export const TRAINER_TEMPLATES: readonly Tpl[] = [
  T((_, a) => `The owner starts the business with ₹${a} in cash.`, 'cash', 'capital', 'Cash (asset) comes in; the owner’s claim (capital) rises.'),
  T((_, a) => `The owner brings ₹${a} into the business bank account.`, 'bank', 'capital', 'Bank (asset) rises; capital rises.'),
  T((_, a) => `Bought machinery for cash ₹${a}.`, 'machinery', 'cash', 'Machinery is a fixed asset, not goods for resale.'),
  T((_, a) => `Bought furniture for ₹${a} and paid by cheque.`, 'furniture', 'bank', 'Furniture is a fixed asset; the cheque reduces the bank balance.'),
  T((_, a) => `Bought a building for ₹${a} and paid by cheque.`, 'building', 'bank', 'A building is a fixed asset; bank falls.', 100000, 900000),
  T((p, a) => `Purchased goods on credit from ${p} for ₹${a}.`, 'purchases', 'creditors', 'Goods for resale go to Purchases; the supplier is a creditor.'),
  T((_, a) => `Purchased goods for cash ₹${a}.`, 'purchases', 'cash', 'Purchases rises (debit); cash falls (credit).'),
  T((p, a) => `Sold goods on credit to ${p} for ₹${a}.`, 'debtors', 'sales', 'The customer owes us (an asset); sales is income.'),
  T((_, a) => `Sold goods for cash ₹${a}.`, 'cash', 'sales', 'Cash rises; sales (income) is credited.'),
  T((_, a) => `Paid rent ₹${a} in cash.`, 'rent', 'cash', 'Rent is an expense (debit); cash falls (credit).', 500, 20000),
  T((_, a) => `Paid salary ₹${a} by cheque.`, 'salary', 'bank', 'Salary is an expense; bank falls.', 2000, 40000),
  T((_, a) => `Paid wages ₹${a} in cash.`, 'wages', 'cash', 'Wages is an expense; cash falls.', 500, 15000),
  T((_, a) => `Paid electricity bill ₹${a} in cash.`, 'electricity', 'cash', 'Electricity is an expense; cash falls.', 300, 9000),
  T((_, a) => `Paid insurance premium ₹${a} by cheque.`, 'insurance', 'bank', 'Insurance is an expense; bank falls.', 500, 20000),
  T((p, a) => `Received ₹${a} in cash from ${p}, a debtor.`, 'cash', 'debtors', 'Cash rises; the debtor’s balance (asset) falls.'),
  T((p, a) => `Paid ₹${a} in cash to ${p}, a creditor.`, 'creditors', 'cash', 'The liability falls (debit); cash falls (credit).'),
  T((p, a) => `Received a cheque of ₹${a} from ${p}, a debtor, and deposited it in the bank.`, 'bank', 'debtors', 'Bank rises; the debtor’s balance falls.'),
  T((p, a) => `Paid ₹${a} to ${p}, a creditor, by cheque.`, 'creditors', 'bank', 'The liability falls (debit); bank falls (credit).'),
  T((_, a) => `The owner withdrew ₹${a} cash for personal use.`, 'drawings', 'cash', 'Personal withdrawals are Drawings, not a business expense.', 500, 15000),
  T((_, a) => `Deposited ₹${a} cash into the bank.`, 'bank', 'cash', 'One asset rises (bank) while another falls (cash).'),
  T((_, a) => `Withdrew ₹${a} from the bank for office use.`, 'cash', 'bank', 'Cash rises; bank falls.', 500, 30000),
  T((_, a) => `Took a bank loan of ₹${a}; the amount was credited to the bank account.`, 'bank', 'bank-loan', 'Bank (asset) rises; the loan is a liability.', 20000, 500000),
  T((_, a) => `Received interest ₹${a} in cash.`, 'cash', 'interest-received', 'Interest received is income; cash rises.', 200, 9000),
  T((_, a) => `Received commission ₹${a} in cash.`, 'cash', 'commission-received', 'Commission received is income; cash rises.', 200, 9000),
  T((_, a) => `Charged depreciation ₹${a} on machinery.`, 'depreciation', 'machinery', 'Depreciation is an expense; the asset’s value falls.', 500, 15000),
  T((p, a) => `${p}, a debtor, could not pay; ₹${a} is written off as bad debt.`, 'bad-debts', 'debtors', 'Bad debt is an expense; the debtor (asset) is reduced.', 300, 8000),
  T((_, a) => `Salary of ₹${a} for the month is still unpaid at the year end.`, 'salary', 'outstanding-salary', 'The expense belongs to this year (debit); the unpaid amount is a liability.', 2000, 30000),
  T((_, a) => `Insurance of ₹${a} was paid in advance for next year.`, 'prepaid-insurance', 'bank', 'The advance payment is an asset (prepaid), not this year’s expense.', 500, 15000),
];
/** `count` distinct questions, reproducible from `seed`. Names and amounts vary; the accounting does not. */
export function generateTrainerItems(count: number, seed = 1): TrainerItem[] {
  let s = seed >>> 0; const next = () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), s | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out: TrainerItem[] = [], seen = new Set<string>();
  for (let guard = 0; out.length < count && guard < count * 20; guard++) {
    const tp = TRAINER_TEMPLATES[Math.floor(next() * TRAINER_TEMPLATES.length)]!;
    const amount = (Math.floor(tp.lo / 500) + Math.floor(next() * (Math.floor(tp.hi / 500) - Math.floor(tp.lo / 500) + 1))) * 500;
    const text = tp.t(PEOPLE[Math.floor(next() * PEOPLE.length)]!, amount.toLocaleString('en-IN'));
    if (!seen.has(text)) { seen.add(text); out.push({ text, dr: tp.dr, cr: tp.cr, why: tp.why }); }
  }
  return out;
}
