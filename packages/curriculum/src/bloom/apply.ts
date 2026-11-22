/** Extra Apply-level items (scenario and small-number questions) so that every topic has at least four. See bloom.ts for the item format. */
import type { BloomItem } from '../bloom';

export const APPLY_MORE: Readonly<Record<string, readonly BloomItem[]>> = {
  'XI.1.intro': [
    [
      'A',
      'A bank manager reads a trader’s statements before sanctioning a loan. Which type of user is the bank?',
      'An external user',
      ['An internal user', 'The owner', 'An employee'],
      'The bank is outside the business.',
    ],
    [
      'A',
      'A business owner uses monthly records to decide whether to stock more goods. Which objective of accounting is served?',
      'Providing information for decision making',
      ['Avoiding tax', 'Reducing sales', 'Hiding profit'],
      'Information supports decisions.',
    ],
  ],
  'XI.1.terms': [
    ['A', 'A firm owes ₹20,000 to a supplier for goods bought on credit. The supplier is a …', 'creditor', ['debtor', 'owner', 'customer'], 'The firm owes money to the supplier.'],
    ['A', 'A shopkeeper takes ₹3,000 cash from the till for a family function. This is …', 'drawings', ['an expense', 'a sale', 'capital'], 'Personal withdrawal by the owner.'],
  ],
  'XI.1.concepts': [
    [
      'A',
      'A trader buys a van for ₹4,00,000; its market value rises to ₹5,00,000. It is still shown at ₹4,00,000 because of the …',
      'cost concept',
      ['going concern concept', 'matching concept', 'entity concept'],
      'Assets are recorded at cost.',
    ],
    [
      'A',
      'The owner pays his house rent from business cash. The business does not treat it as its expense because of the …',
      'business entity concept',
      ['cost concept', 'prudence', 'materiality'],
      'Owner and business are separate.',
    ],
  ],
  'XI.1.basis': [
    [
      'A',
      'Interest of ₹6,000 for the year is received in cash only in the next year. Under the accrual basis it is income of …',
      'the current year',
      ['the next year', 'neither year', 'both years'],
      'It is earned this year.',
    ],
    ['A', 'Under the cash basis, a sale made on credit in March and collected in May is recorded in …', 'May', ['March', 'April', 'February'], 'Cash basis records on receipt.'],
  ],
  'XI.1.standards': [
    [
      'A',
      'A listed company wants to know which standards it must follow. It should first check …',
      'whether it falls under the Ind AS applicability criteria',
      ['the colour of its logo', 'how many shops it has', 'who the auditor’s friends are'],
      'Applicability decides AS or Ind AS.',
    ],
    [
      'A',
      'Two companies value stock on different bases without any disclosure. Which problem arises?',
      'Their statements cannot be compared reliably',
      ['Their profit is equal', 'Their tax is nil', 'Their capital is equal'],
      'Standards give uniformity.',
    ],
  ],
  'XI.1.gst': [
    ['A', 'A dealer sells goods worth ₹50,000 with GST at 12%. The GST charged is …', '₹6,000', ['₹600', '₹5,000', '₹56,000'], '12% of 50,000.'],
    ['A', 'GST on sales ₹9,000; GST on purchases ₹6,500. The net GST to pay is …', '₹2,500', ['₹15,500', '₹6,500', '₹9,000'], '9,000 − 6,500.'],
  ],
  'XI.2.vouchers': [
    [
      'A',
      'A customer returns defective goods and the seller agrees to reduce the amount due. The seller issues a …',
      'credit note',
      ['debit note', 'cash memo', 'pay-in slip'],
      'The customer’s account is credited.',
    ],
    ['A', 'Money is deposited into the bank. The proof the depositor keeps is the …', 'pay-in slip', ['invoice', 'debit note', 'trial balance'], 'It acknowledges the deposit.'],
  ],
  'XI.2.equation': [
    [
      'A',
      'A trader starts with cash ₹1,00,000 and buys goods for ₹40,000 on credit. Total assets become …',
      '₹1,40,000',
      ['₹1,00,000', '₹60,000', '₹40,000'],
      'Stock ₹40,000 is added; creditors ₹40,000.',
    ],
    ['A', 'A creditor of ₹10,000 is paid in cash. Assets and liabilities each …', 'fall by ₹10,000', ['rise by ₹10,000', 'stay the same', 'fall by ₹20,000'], 'Cash and creditors both go down.'],
  ],
  'XI.2.rules': [
    [
      'A',
      'Rent paid ₹4,000 by cheque. The entry is …',
      'Rent A/c Dr; Bank A/c Cr',
      ['Bank A/c Dr; Rent A/c Cr', 'Rent A/c Cr; Bank A/c Cr', 'Capital A/c Dr; Rent A/c Cr'],
      'Expense debited; bank goes out.',
    ],
    [
      'A',
      'Goods purchased on credit from Mohan. The entry is …',
      'Purchases A/c Dr; Mohan A/c Cr',
      ['Mohan A/c Dr; Purchases A/c Cr', 'Cash A/c Dr; Purchases A/c Cr', 'Purchases A/c Dr; Cash A/c Cr'],
      'Goods come in; Mohan is the giver.',
    ],
  ],
  'XI.2.journal': [
    [
      'A',
      'Cash received from a debtor, Seema, ₹7,000. The entry is …',
      'Cash A/c Dr ₹7,000 to Seema A/c ₹7,000',
      ['Seema A/c Dr to Cash A/c', 'Cash A/c Dr to Sales A/c', 'Seema A/c Dr to Sales A/c'],
      'Cash in; the debtor is the giver.',
    ],
    [
      'A',
      'Furniture bought for ₹15,000 cash. The entry is …',
      'Furniture A/c Dr ₹15,000 to Cash A/c ₹15,000',
      ['Purchases A/c Dr to Cash A/c', 'Cash A/c Dr to Furniture A/c', 'Furniture A/c Dr to Capital A/c'],
      'An asset comes in; cash goes out.',
    ],
  ],
  'XI.2.cashbook': [
    [
      'A',
      'Cash paid into the bank ₹10,000. In the cash book it appears …',
      'on both sides as a contra entry',
      ['only on the cash payments side', 'only on the receipts side', 'it is not recorded'],
      'Cash is credited, bank debited.',
    ],
    ['A', 'A petty cashier is given an imprest of ₹2,000 and spends ₹1,450. The reimbursement needed is …', '₹1,450', ['₹2,000', '₹550', '₹3,450'], 'The imprest is restored to ₹2,000.'],
  ],
  'XI.2.subsidiary': [
    ['A', 'Goods worth ₹8,000 purchased on credit are entered in the …', 'purchases book', ['sales book', 'cash book', 'sales return book'], 'Credit purchase of goods.'],
    ['A', 'A credit sale is made for ₹12,000 at a trade discount of 10%. The amount posted to the customer’s account is …', '₹10,800', ['₹12,000', '₹1,200', '₹13,200'], '12,000 − 1,200.'],
  ],
  'XI.2.ledger': [
    ['A', 'A ledger account has debits ₹30,000 and credits ₹22,000. The balance is …', '₹8,000 debit', ['₹8,000 credit', '₹52,000 debit', '₹22,000 debit'], 'Difference, on the larger side.'],
    [
      'A',
      'A debit entry for rent paid is posted on the …',
      'debit side of the Rent A/c',
      ['credit side of the Rent A/c', 'debit side of the Cash A/c', 'debit side of the Capital A/c'],
      'Expense is debited.',
    ],
  ],
  'XI.2.brs': [
    [
      'A',
      'Cash-book bank balance ₹12,000 (Dr). A cheque of ₹2,500 deposited has not yet been credited by the bank. Passbook balance is …',
      '₹9,500',
      ['₹14,500', '₹12,000', '₹2,500'],
      '12,000 − 2,500.',
    ],
    [
      'A',
      'The passbook shows bank charges ₹150 not yet in the cash book. The cash book is corrected by …',
      'crediting the bank column ₹150',
      ['debiting the bank column ₹150', 'ignoring it', 'debiting the cash column ₹150'],
      'The bank balance is reduced.',
    ],
  ],
  'XI.2.depreciation': [
    ['A', 'A machine costing ₹60,000 is depreciated by SLM at ₹6,000 a year. After 3 years the book value is …', '₹42,000', ['₹18,000', '₹54,000', '₹60,000'], '60,000 − 18,000.'],
    ['A', 'A machine of book value ₹40,000 is sold for ₹46,000. The result is a …', 'profit of ₹6,000', ['loss of ₹6,000', 'profit of ₹46,000', 'loss of ₹40,000'], 'Sale price − book value.'],
  ],
  'XI.2.provisions': [
    ['A', 'Debtors ₹80,000; provision for doubtful debts at 5%. The provision to be created is …', '₹4,000', ['₹400', '₹8,000', '₹76,000'], '5% of 80,000.'],
    ['A', 'Opening provision ₹2,000; the new provision needed is ₹3,500. The charge to profit and loss is …', '₹1,500', ['₹3,500', '₹2,000', '₹5,500'], 'Only the increase is charged.'],
  ],
  'XI.2.tb': [
    [
      'A',
      'The debit total of a trial balance is ₹2,50,000 and the credit total is ₹2,45,000. The difference is shown …',
      'on the credit side as suspense ₹5,000',
      ['on the debit side as suspense', 'as capital', 'as sales'],
      'Credits are short.',
    ],
    ['A', 'Which of these is placed on the debit side of a trial balance?', 'Drawings', ['Capital', 'Sales', 'Creditors'], 'Drawings have a debit balance.'],
  ],
  'XI.2.errors': [
    [
      'A',
      'A purchase of ₹2,500 from Raj was not recorded at all. Will the trial balance still agree?',
      'Yes: it is an error of omission and affects both sides',
      ['No: debits will be larger', 'No: credits will be larger', 'No: capital will change'],
      'Both sides are missing.',
    ],
    [
      'A',
      'Wages paid for installing a machine were debited to Wages A/c. The rectification is …',
      'Machinery A/c Dr to Wages A/c',
      ['Wages A/c Dr to Machinery A/c', 'Cash A/c Dr to Wages A/c', 'No entry'],
      'It is capital expenditure.',
    ],
  ],
  'XI.3.concepts': [
    ['A', 'Purchase of a delivery van is …', 'a capital expenditure', ['a revenue expenditure', 'a loss', 'drawings'], 'It gives long-term benefit.'],
    ['A', 'Electricity bill paid for the shop is …', 'a revenue expenditure', ['a capital expenditure', 'a gain', 'drawings'], 'It supports day-to-day running.'],
  ],
  'XI.3.trading-pl': [
    [
      'A',
      'Opening stock ₹20,000; purchases ₹1,00,000; closing stock ₹30,000; direct expenses ₹10,000. Cost of goods sold is …',
      '₹1,00,000',
      ['₹1,60,000', '₹90,000', '₹1,20,000'],
      '20,000 + 1,00,000 + 10,000 − 30,000.',
    ],
    ['A', 'Net sales ₹2,00,000; cost of goods sold ₹1,40,000; indirect expenses ₹40,000. Net profit is …', '₹20,000', ['₹60,000', '₹1,00,000', '₹40,000'], '60,000 − 40,000.'],
  ],
  'XI.3.balance-sheet': [
    ['A', 'Assets total ₹5,00,000 and outside liabilities ₹2,00,000. The capital shown is …', '₹3,00,000', ['₹7,00,000', '₹2,00,000', '₹5,00,000'], 'Assets − liabilities.'],
    ['A', 'A loan repayable after five years is shown under …', 'non-current liabilities', ['current liabilities', 'current assets', 'capital'], 'It is not due within a year.'],
  ],
  'XI.3.incomplete': [
    ['A', 'Opening capital ₹1,00,000; closing capital ₹1,40,000; drawings ₹10,000; no fresh capital. Profit is …', '₹50,000', ['₹40,000', '₹30,000', '₹1,50,000'], '40,000 + 10,000.'],
    ['A', 'Assets ₹3,00,000; liabilities ₹80,000. Capital by the statement of affairs is …', '₹2,20,000', ['₹3,80,000', '₹80,000', '₹3,00,000'], '3,00,000 − 80,000.'],
  ],
  'XI.P.project': [
    [
      'A',
      'A student prepares a BRS project. The two records compared are …',
      'the cash book (bank column) and the passbook',
      ['the sales book and the purchases book', 'the journal and the trial balance', 'the balance sheet and the profit and loss account'],
      'That is what reconciliation means.',
    ],
    [
      'A',
      'A student wants to show the share of rent, salary and electricity in total expenses. The best chart is …',
      'a pie chart',
      ['a map', 'a photograph', 'a list of names'],
      'Pie charts show parts of a whole.',
    ],
  ],
  'XII.1.fundamentals': [
    ['A', 'A, B and C start a partnership with no written deed. Profit of ₹90,000 is shared …', '₹30,000 each', ['₹45,000, ₹30,000, ₹15,000', 'by capital only', 'by age'], 'Equal by default.'],
    ['A', 'Partner A lends ₹50,000 to the firm without any deed. Interest allowed on the loan is …', '₹3,000 a year (6%)', ['₹6,000', '₹5,000', 'nil'], '6% of 50,000.'],
  ],
  'XII.1.capital': [
    [
      'A',
      'Fixed capital ₹3,00,000; interest on capital credited ₹18,000; drawings ₹20,000. The current account balance is …',
      '₹2,000 debit',
      ['₹2,000 credit', '₹38,000 credit', '₹18,000 credit'],
      '18,000 − 20,000.',
    ],
    [
      'A',
      'Under fluctuating capital, a partner’s interest on drawings is …',
      'debited to his capital account',
      ['credited to his capital account', 'ignored', 'debited to cash'],
      'It is a charge to him.',
    ],
  ],
  'XII.1.appropriation': [
    ['A', 'Net profit ₹80,000; salary to A ₹20,000; remaining profit shared equally between A and B. A’s total is …', '₹50,000', ['₹40,000', '₹60,000', '₹30,000'], '20,000 + 30,000.'],
    ['A', 'Capital ₹2,00,000 at 6% interest. The interest on capital is …', '₹12,000', ['₹1,20,000', '₹6,000', '₹2,000'], '6% of 2,00,000.'],
  ],
  'XII.1.guarantee': [
    ['A', 'C is guaranteed ₹25,000 by the firm and his share is ₹18,000. The deficiency borne by the partners is …', '₹7,000', ['₹25,000', '₹18,000', '₹43,000'], '25,000 − 18,000.'],
    ['A', 'A deficiency of ₹6,000 is borne by A and B in 2 : 1. A bears …', '₹4,000', ['₹2,000', '₹6,000', '₹3,000'], '2/3 of 6,000.'],
  ],
  'XII.1.past-adjustments': [
    ['A', 'Interest on capital of ₹6,000 to A and ₹4,000 to B was omitted last year. Total omitted is …', '₹10,000', ['₹6,000', '₹4,000', '₹2,000'], '6,000 + 4,000.'],
    ['A', 'A and B share equally. B’s salary of ₹8,000 was omitted. The net effect on B is …', 'a gain of ₹4,000', ['a loss of ₹4,000', 'a gain of ₹8,000', 'no effect'], '8,000 − 4,000.'],
  ],
  'XII.1.ratio-change': [
    ['A', 'A and B share 3 : 2 and decide to share equally. A’s sacrifice is …', '1/10', ['1/5', '1/2', '3/5'], '3/5 − 1/2.'],
    ['A', 'Reserve of ₹30,000 is distributed on a change of ratio from 3 : 2 to equal. A’s share is …', '₹18,000', ['₹15,000', '₹12,000', '₹30,000'], 'Old ratio 3/5 of 30,000.'],
  ],
  'XII.1.admission': [
    ['A', 'C is admitted for 1/4 share; the firm’s goodwill is ₹1,20,000. C’s share of goodwill is …', '₹30,000', ['₹1,20,000', '₹40,000', '₹24,000'], '1,20,000 × 1/4.'],
    ['A', 'Revaluation of assets gives a profit of ₹10,000; A and B share 3 : 2. A’s share is …', '₹6,000', ['₹4,000', '₹5,000', '₹10,000'], '3/5 of 10,000.'],
  ],
  'XII.1.retirement': [
    ['A', 'Goodwill of the firm is ₹90,000; a partner with 1/3 share retires. His goodwill share is …', '₹30,000', ['₹90,000', '₹60,000', '₹45,000'], '90,000 × 1/3.'],
    [
      'A',
      'A retiring partner is due ₹80,000; ₹30,000 is paid in cash and the balance is left as a loan. The loan account is credited with …',
      '₹50,000',
      ['₹80,000', '₹30,000', '₹110,000'],
      '80,000 − 30,000.',
    ],
  ],
  'XII.1.death': [
    ['A', 'Profit of the year is ₹60,000; a partner with 1/4 share dies after 6 months. Profit to date of death is …', '₹7,500', ['₹15,000', '₹30,000', '₹3,750'], '60,000 × 1/2 × 1/4.'],
    ['A', 'The deceased partner’s capital is ₹90,000, his profit share ₹6,000 and goodwill ₹14,000. The amount due is …', '₹1,10,000', ['₹90,000', '₹96,000', '₹1,04,000'], '90,000 + 6,000 + 14,000.'],
  ],
  'XII.1.dissolution': [
    [
      'A',
      'Creditors ₹40,000 are paid ₹38,000 in full settlement. The Realisation Account shows …',
      'a gain of ₹2,000 on the credit side',
      ['a loss of ₹2,000', 'a gain of ₹38,000', 'no effect'],
      'Settled for less.',
    ],
    ['A', 'Realisation loss ₹12,000 shared by A and B in 3 : 1. A’s share is …', '₹9,000', ['₹3,000', '₹6,000', '₹12,000'], '3/4 of 12,000.'],
  ],
  'XII.2.fundamentals': [
    ['A', 'Shares of ₹10 each: ₹8 called and ₹7 paid. The calls in arrears per share are …', '₹1', ['₹3', '₹7', '₹8'], '8 − 7.'],
    ['A', 'A company issued 50,000 shares of ₹10 each. Its issued capital is …', '₹5,00,000', ['₹50,000', '₹10,000', '₹5,000'], '50,000 × 10.'],
  ],
  'XII.2.forfeiture': [
    ['A', '200 shares of ₹10 with ₹7 paid are forfeited. The amount credited to Share Forfeiture A/c is …', '₹1,400', ['₹2,000', '₹600', '₹700'], '200 × 7.'],
    ['A', 'The 200 shares are re-issued as fully paid at ₹9 each. The discount on re-issue is …', '₹200', ['₹1,800', '₹400', '₹100'], '(10 − 9) × 200.'],
  ],
  'XII.2.concepts': [
    ['A', 'A company issues shares of ₹10 at par to a vendor for goods worth ₹3,00,000. Shares issued are …', '30,000', ['3,000', '3,00,000', '300'], '3,00,000 ÷ 10.'],
    ['A', 'Employees are offered the right to buy shares at ₹40 when the market price is ₹55. This is …', 'an ESOP', ['a forfeiture', 'a dividend', 'a debenture'], 'An employee stock option.'],
  ],
  'XII.2.disclosure': [
    [
      'A',
      'Subscribed and fully paid shares ₹8,00,000; subscribed but not fully paid ₹2,00,000 (calls in arrears ₹10,000). Paid-up capital is …',
      '₹9,90,000',
      ['₹10,00,000', '₹10,10,000', '₹9,80,000'],
      '10,00,000 − 10,000.',
    ],
    ['A', 'Securities premium of ₹50,000 is shown under …', 'Reserves and Surplus', ['Share Capital', 'Current Liabilities', 'Non-current Assets'], 'It is not share capital.'],
  ],
  'XII.2.debentures': [
    ['A', '500 debentures of ₹100 each are issued at 8% premium. The cash received is …', '₹54,000', ['₹50,000', '₹46,000', '₹58,000'], '50,000 × 108%.'],
    ['A', 'Debentures of ₹2,00,000 at 9% interest. Annual interest is …', '₹18,000', ['₹9,000', '₹1,80,000', '₹2,18,000'], '9% of 2,00,000.'],
  ],
  'XII.3.statements': [
    [
      'A',
      'Where is “inventories” shown in a company’s balance sheet?',
      'Under current assets',
      ['Under non-current assets', 'Under shareholders’ funds', 'Under current liabilities'],
      'It is converted within a year.',
    ],
    ['A', 'Where is “reserves and surplus” shown?', 'Under shareholders’ funds', ['Under current assets', 'Under non-current liabilities', 'Under current liabilities'], 'Equity.'],
  ],
  'XII.3.comparative': [
    ['A', 'Profit was ₹40,000 last year and ₹50,000 this year. The percentage change is …', '25%', ['20%', '10%', '125%'], '10,000 ÷ 40,000.'],
    ['A', 'Sales fell from ₹5,00,000 to ₹4,00,000. The percentage change is …', '−20%', ['+20%', '−25%', '−10%'], '−1,00,000 ÷ 5,00,000.'],
  ],
  'XII.3.common-size': [
    ['A', 'Revenue ₹8,00,000; employee cost ₹2,00,000. Employee cost as % of revenue is …', '25%', ['20%', '4%', '75%'], '2,00,000 ÷ 8,00,000.'],
    ['A', 'Total of balance sheet ₹10,00,000; share capital ₹4,00,000. Share capital as % of total is …', '40%', ['25%', '60%', '4%'], '4,00,000 ÷ 10,00,000.'],
  ],
  'XII.3.activity': [
    ['A', 'Cost of revenue ₹9,00,000; average inventory ₹1,50,000. Inventory turnover is …', '6 times', ['0.17 times', '7.5 times', '9 times'], '9,00,000 ÷ 1,50,000.'],
    ['A', 'Revenue from operations ₹12,00,000; working capital ₹3,00,000. Working-capital turnover is …', '4 times', ['0.25 times', '9 times', '15 times'], '12,00,000 ÷ 3,00,000.'],
  ],
  'XII.4.classification': [
    [
      'A',
      'Cash paid to buy machinery is a …',
      'cash outflow from investing activities',
      ['cash outflow from operating activities', 'cash outflow from financing activities', 'non-cash item'],
      'Purchase of a fixed asset.',
    ],
    ['A', 'Proceeds from issue of debentures are …', 'a financing inflow', ['an operating inflow', 'an investing inflow', 'a non-cash item'], 'Borrowing.'],
  ],
  'XII.4.preparation': [
    ['A', 'Opening cash ₹20,000; net cash from operating +₹50,000, investing −₹30,000, financing +₹10,000. Closing cash is …', '₹50,000', ['₹30,000', '₹80,000', '₹70,000'], '20,000 + 30,000.'],
    [
      'A',
      'Net profit before tax ₹60,000; depreciation ₹10,000; profit on sale of machinery ₹5,000. Operating profit before working-capital changes is …',
      '₹65,000',
      ['₹75,000', '₹55,000', '₹60,000'],
      '60,000 + 10,000 − 5,000.',
    ],
  ],
  'XII.C.cas': [
    ['A', 'A user posts a voucher in a CAS and the ledger updates by itself. This shows …', 'automatic posting', ['manual posting', 'a backup', 'a virus'], 'The software posts.'],
    ['A', 'A firm stores yesterday’s data on a second drive. This is …', 'a backup', ['a voucher', 'a ledger', 'a report'], 'Protection against loss.'],
  ],
  'XII.C.spreadsheet': [
    ['A', 'Cells C2 to C6 hold amounts. The formula for the average is …', '=AVERAGE(C2:C6)', ['=AVG C2 TO C6', '=C2/C6', '=MEAN(C2,C6) only'], 'AVERAGE over the range.'],
    ['A', 'To keep a cell reference fixed when copying a formula, you write it as …', '$A$1', ['A1', '#A#1', '@A@1'], 'The dollar signs fix it.'],
  ],
  'XII.C.using': [
    [
      'A',
      'A new company is set up in a CAS. The first accounting step after creating it is …',
      'to create the groups and ledgers (chart of accounts)',
      ['to print the balance sheet', 'to close the year', 'to delete the company'],
      'Set-up before entries.',
    ],
    ['A', 'A CAS stops a clerk from editing a closed month. This is a …', 'security control', ['formatting option', 'printing option', 'backup'], 'It protects integrity.'],
  ],
  'XII.P.project': [
    ['A', 'A project shows net profit ratio 8% in year 1 and 5% in year 2. The comment is …', 'profitability fell', ['profitability rose', 'no change', 'solvency rose'], 'The ratio fell.'],
    [
      'A',
      'To compare two companies of different sizes, a project would use …',
      'common-size statements or ratios',
      ['rupee totals only', 'voucher numbers', 'cash memos'],
      'Percentages remove the size effect.',
    ],
  ],
};
