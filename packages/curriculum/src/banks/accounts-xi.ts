/**
 * Independent classification of every account name used by the legacy Class XI banks.
 * Written from the standard CBSE Class XI treatment WITHOUT consulting the legacy classifier, so it can serve as a second opinion.
 * Status: pending confirmation by the academic reviewer (handoff D11).
 *
 *  eq     — which side of A = L + C the account belongs to
 *  sign   — effect on that side when the account's BALANCE increases (+1 adds, −1 subtracts: expenses, drawings, contra-accounts)
 *  normal — the side on which the account normally has its balance (and on which it increases)
 */
import type { AccountType } from '../../../engine/src';
export interface AccountClass { readonly type: AccountType; readonly eq: 'A' | 'L' | 'C'; readonly sign: 1 | -1; readonly normal: 'DR' | 'CR'; readonly note?: string }
const A: AccountClass = { type: 'ASSET', eq: 'A', sign: 1, normal: 'DR' };
const CONTRA_A: AccountClass = { type: 'LIABILITY', eq: 'A', sign: -1, normal: 'CR', note: 'contra-asset: shown as a deduction from the asset' };
const L: AccountClass = { type: 'LIABILITY', eq: 'L', sign: 1, normal: 'CR' };
const CAP: AccountClass = { type: 'CAPITAL', eq: 'C', sign: 1, normal: 'CR' };
const REV: AccountClass = { type: 'REVENUE', eq: 'C', sign: 1, normal: 'CR' };
const EXP: AccountClass = { type: 'EXPENSE', eq: 'C', sign: -1, normal: 'DR' };
const DRAW: AccountClass = { type: 'DRAWINGS', eq: 'C', sign: -1, normal: 'DR' };

const T: Record<string, AccountClass> = {
  // assets
  'Accrued Commission': A, 'Accrued Income': A, 'Accrued Interest': A, Bank: A, 'Bills Receivable': A, Building: A, Buildings: A, Cash: A, 'Cash at Bank': A, 'Cash in Hand': A,
  Computer: A, Debtors: A, 'Mohan (Debtor)': A, Furniture: A, Goodwill: A, 'Input CGST': A, 'Input IGST': A, 'Input SGST': A, Investments: A, Machinery: A,
  'Opening Stock': { ...A, note: 'appears in the trial balance as a debit; transferred to the Trading Account' }, Patents: A, 'Prepaid Expenses': A, 'Prepaid Rent': A, 'Prepaid Salary': A, Stock: A, Vehicle: A,
  'Provision for Bad Debts': CONTRA_A, 'Provision for Dep': CONTRA_A,
  // liabilities
  'Advance from Customer': L, 'Advance Income': L, 'Bank Loan': L, 'Bank Overdraft': L, 'Bills Payable': L, Creditors: L, 'Output CGST': L, 'Output IGST': L, 'Output SGST': L,
  'Outstanding Salaries': L, 'Outstanding Salary': L, 'Unearned Commission': L, 'Unearned Income': L, 'Unearned Rent': L,
  // capital
  Capital: CAP, 'P&L Profit': { ...CAP, note: 'profit carried to capital (legacy m1 balance model)' },
  // revenue (incl. contra-expense)
  'Bad Debts Recovered': REV, 'Commission Rec.': REV, 'Commission Recd': REV, 'Commission Received': REV, 'Discount Received': REV, 'Dividend Received': REV, 'Interest Received': REV,
  'Interest on Drawings': { ...REV, note: 'income of the business, charged to the proprietor' }, 'Miscellaneous Income': REV, 'Rent Received': REV, Sales: REV,
  'Purchase Return': { ...REV, note: 'reduces purchases' }, 'Purchase Returns': { ...REV, note: 'reduces purchases' },
  // expenses (incl. contra-revenue)
  Advertisement: EXP, 'Advertisement Exp.': EXP, 'Bad Debts': EXP, 'Bank Charges': EXP, 'Carriage Inwards': EXP, 'Carriage Outwards': EXP, Charity: EXP, Depreciation: EXP, 'Discount Allowed': EXP,
  Electricity: EXP, Insurance: EXP, 'Insurance Premium': EXP, 'Interest on Capital': { ...EXP, note: 'expense of the business, credited to capital' }, 'Loss by Fire': EXP, 'Loss by Theft': EXP,
  Purchases: EXP, Rent: EXP, 'Rent Paid': EXP, Repairs: EXP, Salaries: EXP, Salary: EXP, 'Staff Welfare Exp': EXP, Stationery: EXP, Wages: EXP,
  'Sales Return': { ...EXP, note: 'reduces sales' }, 'Sales Returns': { ...EXP, note: 'reduces sales' },
  Drawings: DRAW,
};
/** Names whose meaning depends on context (e.g. "Commission" paid or received). They appear only as distractors and are not compared. */
export const AMBIGUOUS = new Set(['Commission', 'Interest', 'Tax Expense']);
export const canonical = (name: string) => name.replace(/\s+A\/c$/i, '').trim();
export function classify(name: string): AccountClass | undefined { return T[canonical(name)]; }
/** Effect of a DEBIT of 1 on the account's side of the equation. */
export const debitEffect = (c: AccountClass) => (c.normal === 'DR' ? c.sign : -c.sign) as 1 | -1;
export const LEGACY_LETTER: Record<string, AccountType> = { A: 'ASSET', L: 'LIABILITY', Q: 'CAPITAL', R: 'REVENUE', E: 'EXPENSE', X: 'DRAWINGS' };
export const allClassified = () => Object.keys(T);
