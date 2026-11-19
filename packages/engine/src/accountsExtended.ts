/**
 * Bigger charts of accounts for practice. Pure data; nothing here is a syllabus topic, only account NAMES
 * a Class XI/XII student meets in journal, ledger and trial-balance questions.
 */
import { ChartOfAccounts, starterChartClassXI, type AccountType } from './accounts';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const EXTRA: Record<Exclude<AccountType, 'CAPITAL' | 'DRAWINGS'>, string[]> = {
  ASSET: ['Petty Cash', 'Cash at Bank', 'Opening Stock', 'Closing Stock', 'Land', 'Plant', 'Vehicles', 'Computers', 'Office Equipment', 'Tools', 'Investments', 'Loan to Employee', 'Advance to Suppliers', 'Prepaid Rent', 'Prepaid Salary', 'Accrued Income', 'Accrued Commission', 'Goodwill', 'Patents', 'Trade Marks', 'Copyright', 'Livestock', 'Loose Tools', 'Fixed Deposit', 'Postage Stamps in Hand', 'Goods Lent on Approval', 'Furniture and Fixtures', 'Delivery Van', 'Scooter', 'Typewriter', 'Air Conditioner', 'Generator', 'Cooler', 'Mobile Phone', 'Software', 'Electric Fittings', 'Show Cases', 'Weighing Machine', 'Cycles', 'Security Deposit', 'Advance Tax Paid', 'Employee Advance'],
  LIABILITY: ['Outstanding Rent', 'Outstanding Wages', 'Outstanding Interest', 'Outstanding Electricity', 'Outstanding Expenses', 'Unearned Commission', 'Advance from Customers', 'Rent Received in Advance', 'Interest Received in Advance', 'Provision for Doubtful Debts', 'Provision for Discount on Debtors', 'Bank Overdraft', 'Loan from Friend', 'Mortgage Loan', 'Salary Payable', 'Tax Payable', 'Sundry Creditors', 'Capital Reserve', 'General Reserve', 'Provision for Depreciation'],
  REVENUE: ['Rent Received', 'Discount Received', 'Dividend Received', 'Commission Earned', 'Profit on Sale of Asset', 'Bad Debts Recovered', 'Income from Investments', 'Sale of Scrap', 'Other Income', 'Sales Returns Recovered', 'Interest on Drawings', 'Miscellaneous Income'],
  EXPENSE: ['Carriage Inwards', 'Carriage Outwards', 'Freight', 'Octroi', 'Customs Duty', 'Import Duty', 'Postage', 'Telephone', 'Stationery', 'Printing', 'Advertisement', 'Travelling', 'Repairs', 'Legal Charges', 'Audit Fees', 'Bank Charges', 'Interest Paid', 'Discount Allowed', 'Commission Paid', 'Carriage', 'Insurance Premium', 'Water Charges', 'Office Expenses', 'Postage and Telegram', 'Trade Expenses', 'Packing Expenses', 'Loss on Sale of Asset', 'Fire Loss', 'Loss by Theft', 'General Expenses', 'Conveyance', 'Staff Welfare', 'Bonus', 'Petrol', 'Cartage', 'Donation', 'Entertainment', 'Rates and Taxes', 'Sales Returns', 'Purchases Returns', 'Provision for Doubtful Debts Expense', 'Wages and Salaries', 'Director Fees', 'Discount on Cash Sales', 'Cleaning', 'Subscription', 'Training'],
};
// Purchases/Sales returns are shown as contra items in the books; as ledger accounts they behave as expense/revenue here.
EXTRA.EXPENSE = EXTRA.EXPENSE.filter(n => n !== 'Sales Returns' && n !== 'Purchases Returns');
EXTRA.EXPENSE.push('Sales Returns (Returns Inwards)');
EXTRA.REVENUE.push('Purchases Returns (Returns Outwards)');

/** Starter chart plus ~130 more everyday accounts. Ids of the starter accounts are unchanged. */
export function extendedChartClassXI(): ChartOfAccounts {
  const c = starterChartClassXI();
  for (const [type, names] of Object.entries(EXTRA) as [AccountType, string[]][])
    for (const name of names) { const id = slug(name); if (!c.has(id)) c.add({ id, name, type }); }
  return c;
}

const FIRST = ['Aarav', 'Aditya', 'Akash', 'Amit', 'Anil', 'Arjun', 'Ashok', 'Deepak', 'Dinesh', 'Gaurav', 'Girish', 'Harish', 'Imran', 'Jatin', 'Kabir', 'Karan', 'Kunal', 'Lalit', 'Manish', 'Mohan', 'Naveen', 'Nitin', 'Omkar', 'Pankaj', 'Prakash', 'Rahul', 'Rajesh', 'Ramesh', 'Rohit', 'Sachin', 'Sanjay', 'Suresh', 'Tarun', 'Umesh', 'Vijay', 'Vikram', 'Vinod', 'Yash', 'Anita', 'Asha', 'Bhavna', 'Deepa', 'Divya', 'Geeta', 'Kavita', 'Lata', 'Meena', 'Neha', 'Pooja', 'Priya', 'Rekha', 'Ritu', 'Seema', 'Sunita', 'Usha'];
const LAST = ['Agarwal', 'Bansal', 'Chopra', 'Desai', 'Gupta', 'Iyer', 'Jain', 'Joshi', 'Kapoor', 'Khan', 'Malhotra', 'Mehta', 'Nair', 'Patel', 'Rao', 'Reddy', 'Saxena', 'Shah', 'Sharma', 'Singh', 'Sinha', 'Trivedi', 'Verma', 'Yadav'];
/** `n` distinct person names, deterministic (same list every time). Up to 55 x 24 = 1320 are possible. */
export function personNames(n: number): string[] {
  const out: string[] = [];
  for (let l = 0; l < LAST.length && out.length < n; l++) for (let f = 0; f < FIRST.length && out.length < n; f++) out.push(`${FIRST[(f + l * 7) % FIRST.length]} ${LAST[l]}`);
  return [...new Set(out)].slice(0, n);
}
/** The extended chart plus `n` named debtors (assets) and `n` named creditors (liabilities): 2n personal accounts. */
export function chartWithParties(n: number): ChartOfAccounts {
  const c = extendedChartClassXI();
  personNames(n).forEach((name, i) => {
    c.add({ id: `debtor-${slug(name)}`, name: `${name} (Debtor)`, type: 'ASSET' });
    c.add({ id: `creditor-${slug(personNames(n)[(i + 11) % n]!)}`, name: `${personNames(n)[(i + 11) % n]!} (Creditor)`, type: 'LIABILITY' });
  });
  return c;
}
