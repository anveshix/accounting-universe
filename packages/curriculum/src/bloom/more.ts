/** Extra Analyse and Evaluate items for the topics that had the fewest, so that every topic has at least two of each and twelve in all. See bloom.ts for the item format. */
import type { BloomItem } from '../bloom';

export const EXTRA_ITEMS: Readonly<Record<string, readonly BloomItem[]>> = {
  'XII.1.past-adjustments': [
    [
      'E',
      'A partner’s salary was omitted last year and that year’s books are closed. The best treatment is …',
      'to rectify it now through the partners’ capital accounts by an adjustment entry',
      ['to leave it, because the year is closed', 'to reopen last year’s sales account and change it', 'to ask the bank to adjust the balances'],
      'Past adjustments are settled between the partners’ accounts.',
    ],
  ],
  'XII.2.concepts': [['N', 'Employees exercise an option to buy ₹10 shares at ₹40 each. The securities premium per share is …', '₹30', ['₹10', '₹40', '₹50'], 'Issue price 40 − face value 10 = 30.']],
  'XII.2.disclosure': [
    ['N', 'Subscribed capital ₹2,00,000 with calls in arrears of ₹5,000. The paid-up capital shown is …', '₹1,95,000', ['₹2,05,000', '₹5,000', '₹2,00,000'], '2,00,000 − 5,000.'],
    [
      'E',
      'A company shows calls in arrears as a current asset. Evaluate.',
      'Incorrect: they are deducted from the called-up capital',
      ['Correct: shareholders owe the money, so it is a current asset', 'Correct: it is a fixed asset', 'Correct: it is income of the year'],
      'Schedule III deducts calls in arrears.',
    ],
  ],
  'XII.3.liquidity': [
    [
      'N',
      'Current assets ₹3,00,000 and current liabilities ₹2,00,000. A debtor pays ₹50,000 in cash. The current ratio …',
      'stays at 1.5 : 1',
      ['rises to 2 : 1', 'falls to 1 : 1', 'becomes 2.5 : 1'],
      'One current asset replaces another, so the total is unchanged.',
    ],
  ],
  'XII.3.solvency': [
    [
      'N',
      'Debt ₹3,00,000 and shareholders’ funds ₹1,00,000. The firm issues ₹1,00,000 of shares and repays ₹1,00,000 of debt. The debt-equity ratio becomes …',
      '1 : 1',
      ['3 : 1', '2 : 1', '0.5 : 1'],
      'Debt 2,00,000 ÷ funds 2,00,000.',
    ],
  ],
  'XII.3.activity': [
    [
      'N',
      'Receivables turnover rises from 4 times to 6 times. The collection period (365 days) changes from about …',
      '91 days to 61 days',
      ['61 days to 91 days', '91 days to 122 days', '73 days to 61 days'],
      '365 ÷ 4 = 91; 365 ÷ 6 = 61.',
    ],
  ],
  'XII.3.profitability': [
    ['N', 'Gross profit ratio is 25% and net profit ratio is 10%. Indirect expenses less other incomes are what percentage of revenue?', '15%', ['35%', '10%', '25%'], '25% − 10%.'],
  ],
  'XII.C.spreadsheet': [
    [
      'E',
      'A depreciation schedule uses typed numbers instead of cell references. The cost of the asset is then changed. Evaluate.',
      'The schedule will not update; formulas that refer to the cost cell are needed',
      ['The schedule updates by itself', 'There is no effect, because depreciation is fixed', 'Typed numbers are always faster and safer'],
      'Cell references keep results in step with the data.',
    ],
    [
      'N',
      'The rate is in cell B1. Which formula copies correctly down column C when the amount is in column A?',
      '=A2*$B$1',
      ['=A2*B1', '=$A$2*$B$1', '=A2+$B$1'],
      'The rate cell must stay fixed while the amount reference moves down.',
    ],
  ],
  'XII.C.using': [
    [
      'N',
      'Which of these is an adjusting entry made in a computerised system at year-end?',
      'Outstanding salary of ₹5,000 recorded as an expense and a liability',
      ['Purchase of goods on credit', 'Cash received from a debtor', 'Opening of a new bank account'],
      'Adjusting entries bring the accounts to the accrual position.',
    ],
  ],
  'XII.P.project': [
    [
      'N',
      'In a company analysis the current ratio is 2 : 1 in both years but the quick ratio falls from 1.5 to 0.8. This suggests …',
      'inventories have grown compared with cash and debtors',
      ['debtors are being collected faster', 'the cash balance has risen', 'current liabilities have fallen sharply'],
      'Quick ratio leaves out inventories.',
    ],
  ],
};
