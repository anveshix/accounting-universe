import type { TrainerItem } from '../../../packages/curriculum/src/trainer';

export const TRAINER_EXAMPLES: readonly TrainerItem[] = [
  { text: 'The owner starts the business by putting in ₹1,00,000 cash.', dr: 'cash', cr: 'capital', why: 'Cash (asset) comes in; the owner’s claim (capital) rises.' },
  { text: 'Bought machinery for ₹40,000 and paid in cash.', dr: 'machinery', cr: 'cash', why: 'Machinery is a fixed asset, not goods for resale — so it is not “Purchases”.' },
  { text: 'Bought goods on credit from a supplier for ₹20,000.', dr: 'purchases', cr: 'creditors', why: 'Goods bought for resale go to Purchases; the supplier is a creditor.' },
  { text: 'Sold goods for cash ₹15,000.', dr: 'cash', cr: 'sales', why: 'Cash (asset) rises; income (sales) is credited.' },
  { text: 'Sold goods on credit to a customer for ₹12,000.', dr: 'debtors', cr: 'sales', why: 'The customer owes us (a debtor, an asset); sales is income.' },
  { text: 'Paid rent ₹5,000 in cash.', dr: 'rent', cr: 'cash', why: 'Rent is an expense (debit); cash falls (credit).' },
  { text: 'Paid salary ₹8,000 in cash.', dr: 'salary', cr: 'cash', why: 'Salary is an expense; expenses increase on the debit side.' },
  { text: 'The owner took ₹3,000 cash for household use.', dr: 'drawings', cr: 'cash', why: 'Personal withdrawals are drawings — not an expense of the business.' },
  { text: 'Received ₹6,000 in cash from a debtor.', dr: 'cash', cr: 'debtors', why: 'Cash rises; the debtor’s balance (an asset) falls.' },
  { text: 'Paid ₹10,000 in cash to a creditor.', dr: 'creditors', cr: 'cash', why: 'The liability falls (debit) and cash falls (credit).' },
  { text: 'Took a loan of ₹50,000 from the bank; it was credited to the bank account.', dr: 'bank', cr: 'bank-loan', why: 'Bank balance (asset) rises; the loan is a liability.' },
  { text: 'Deposited ₹7,000 cash into the bank.', dr: 'bank', cr: 'cash', why: 'One asset rises (bank) while another falls (cash).' },
  { text: 'Received ₹1,200 interest in cash.', dr: 'cash', cr: 'interest-received', why: 'Interest received is income (credit); cash rises (debit).' },
  { text: 'Charged depreciation ₹4,000 on machinery (shown as an expense, machinery reduced).', dr: 'depreciation', cr: 'machinery', why: 'Depreciation is an expense; the asset’s value falls.' },
  { text: 'A debtor could not pay; ₹2,500 is written off as bad debt.', dr: 'bad-debts', cr: 'debtors', why: 'Bad debt is an expense; the debtor (asset) is reduced.' },
];
