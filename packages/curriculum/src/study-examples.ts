/**
 * Worked examples for the study-guide topics that did not have one. Original figures and wording written for this app (nothing copied from a textbook or a
 * past paper). Every number here is re-worked in `test/study-examples.test.ts` with an independent oracle, so a wrong figure fails the build.
 * Only syllabus topics are used: no interest on calls, no debenture-redemption entries, indirect cash flow only, three goodwill methods, and so on.
 * Not yet reviewed by a subject teacher (D11).
 */
export interface WorkedExample {
  readonly q: string;
  readonly a: string;
}

export const MORE_EXAMPLES: Readonly<Record<string, WorkedExample>> = {
  // ───────────── Class XI · Unit 1 ─────────────
  'XI.1.intro': {
    q: 'A bank, the owner and the tax department all read a trader’s accounts. Say one decision each of them takes with the accounts. Then say which qualitative characteristic is broken if two firms record the same kind of transaction in different ways without telling anyone.',
    a: 'Bank: whether to lend and whether the loan will be repaid. Owner: whether to expand, change prices or cut costs. Tax department: how much tax is payable. Different methods used without disclosure break comparability (the reader cannot compare the two firms).',
  },
  'XI.1.terms': {
    q: 'Ram starts a business with cash ₹50,000 and goods ₹30,000. Later he takes ₹5,000 from the business for his household. Find his capital at the start, and say how the ₹5,000 is treated.',
    a: 'Capital = cash 50,000 + goods 30,000 = ₹80,000. The ₹5,000 taken for personal use is drawings. It is not a business expense; it reduces the owner’s capital, so capital after drawings = 80,000 − 5,000 = ₹75,000.',
  },
  'XI.1.concepts': {
    q: 'A firm buys a machine for ₹2,00,000. Today the same machine could be sold for ₹1,60,000. At what value is it recorded, and which concept decides this? Also, the owner pays his son’s school fees ₹10,000 from the business cash: which concept is broken?',
    a: 'The machine is recorded at ₹2,00,000, its cost (cost concept; the later market value is not entered). The school fees are a personal expense of the owner, so by the business entity concept they are not a business expense; they are treated as drawings.',
  },
  'XI.1.basis': {
    q: 'The rent for the year is ₹12,000. During the year ₹9,000 was paid; ₹3,000 is still due. What is the rent expense under the cash basis and under the accrual basis, and what is the ₹3,000?',
    a: 'Cash basis: only payments count, so rent = ₹9,000. Accrual basis: the expense of the year counts whether paid or not, so rent = ₹12,000. The ₹3,000 not yet paid is outstanding rent, a liability at the end of the year.',
  },
  'XI.1.standards': {
    q: 'A company values its closing stock without checking any rule. Which accounting standard deals with the valuation of inventories, and what basis does it require?',
    a: 'AS 2 (Valuation of Inventories; Ind AS 2 for companies that follow Ind AS). Inventories are valued at the lower of cost and net realisable value.',
  },
  'XI.1.gst': {
    q: 'State two characteristics and two advantages of GST.',
    a: 'Characteristics: it is a destination-based tax on the supply of goods and services, and it is collected at every stage of the supply chain with credit for the tax already paid (input tax credit). Advantages: it removes the tax on tax (cascading) effect, and one tax replaces many indirect taxes, which makes compliance simpler and the system more transparent.',
  },
  // ───────────── Class XI · Unit 2 ─────────────
  'XI.2.vouchers': {
    q: 'Name the source document for each: (a) goods sold on credit; (b) goods returned by a customer; (c) cash paid to a supplier.',
    a: '(a) Sales invoice (a copy goes to the customer). (b) Credit note (the seller credits the customer’s account for the return). (c) Payment voucher with the supplier’s receipt.',
  },
  'XI.2.equation': {
    q: 'A trader starts with cash ₹1,00,000 as capital. He (1) buys furniture for cash ₹20,000, (2) buys goods on credit ₹30,000 and (3) pays ₹10,000 to the supplier. Show Assets = Liabilities + Capital after each step.',
    a: 'Start: assets 1,00,000 = liabilities 0 + capital 1,00,000. (1) Cash 80,000 + furniture 20,000 = 1,00,000 = 0 + 1,00,000. (2) Cash 80,000 + furniture 20,000 + stock 30,000 = 1,30,000 = creditors 30,000 + capital 1,00,000. (3) Cash 70,000 + furniture 20,000 + stock 30,000 = 1,20,000 = creditors 20,000 + capital 1,00,000. The equation holds after every step.',
  },
  'XI.2.rules': {
    q: 'Name the account to debit and the account to credit: (a) machinery bought for cash ₹40,000; (b) rent paid ₹5,000; (c) commission received ₹2,000; (d) goods sold on credit to Meena ₹15,000.',
    a: '(a) Debit Machinery A/c (asset increases); credit Cash A/c (asset decreases) ₹40,000. (b) Debit Rent A/c (expense); credit Cash A/c ₹5,000. (c) Debit Cash A/c; credit Commission Received A/c (income) ₹2,000. (d) Debit Meena’s A/c (a debtor, an asset); credit Sales A/c (income) ₹15,000.',
  },
  'XI.2.journal': {
    q: 'Journalise: (1) goods bought on credit from Rohan ₹30,000; (2) goods worth ₹2,000 returned to Rohan; (3) ₹26,000 paid to Rohan in full settlement.',
    a: '(1) Purchases A/c Dr 30,000; To Rohan 30,000. (2) Rohan Dr 2,000; To Purchases Return A/c 2,000. (3) Rohan Dr 28,000 (30,000 − 2,000); To Cash A/c 26,000; To Discount Received A/c 2,000.',
  },
  'XI.2.cashbook': {
    q: 'A two-column cash book opens with cash ₹10,000 and bank ₹40,000. Then: cash sales ₹8,000; cash deposited into the bank ₹5,000; cheque paid to a supplier ₹12,000; wages paid in cash ₹3,000. Find the closing cash and bank balances.',
    a: 'Cash: 10,000 + 8,000 − 5,000 (deposited) − 3,000 = ₹10,000. Bank: 40,000 + 5,000 (deposit) − 12,000 = ₹33,000. The deposit is a contra entry: it is on both sides of the same cash book, so it only moves money from cash to bank.',
  },
  'XI.2.subsidiary': {
    q: 'Credit purchases for the month, after trade discount, were ₹12,000, ₹18,000 and ₹10,000. Goods worth ₹3,000 were returned to a supplier. A computer was also bought on credit for ₹30,000. Find the net purchases and say where the computer is first recorded.',
    a: 'Purchases book total = 12,000 + 18,000 + 10,000 = ₹40,000. Less purchases return 3,000 = net purchases ₹37,000. The computer is not goods for resale, so it is not in the purchases book: it is entered in the journal proper (Computer A/c Dr; To the supplier ₹30,000).',
  },
  'XI.2.ledger': {
    q: 'The cash account opens with ₹20,000 on the debit side. During the month receipts are ₹50,000 and payments ₹35,000. Balance the account.',
    a: 'Debit side: 20,000 + 50,000 = ₹70,000. Credit side: payments ₹35,000. Balance c/d = 70,000 − 35,000 = ₹35,000, written on the credit side so that both sides total ₹70,000. It is brought down (b/d) on the debit side next month: a debit balance of ₹35,000.',
  },
  'XI.2.tb': {
    q: 'Debit balances: cash ₹30,000, debtors ₹40,000, purchases ₹60,000, rent ₹10,000, furniture ₹70,000, drawings ₹20,000. Credit balances: capital ₹1,50,000, creditors ₹20,000 and sales (not yet known). The trial balance agrees. Find sales.',
    a: 'Debit total = 30,000 + 40,000 + 60,000 + 10,000 + 70,000 + 20,000 = ₹2,30,000. Known credits = 1,50,000 + 20,000 = ₹1,70,000. Sales = 2,30,000 − 1,70,000 = ₹60,000. A trial balance that agrees does not prove the books are free of errors (a wrong account or a missing entry can still agree).',
  },
  'XI.2.errors': {
    q: 'A trial balance did not agree: its credit side was short by ₹1,200 and the difference was put to a suspense account. Later it was found that a credit sale of ₹1,200 had been debited to the customer but never credited to Sales. Rectify.',
    a: 'The credit side was short, so Suspense A/c was credited ₹1,200 in the trial balance. Rectification: Suspense A/c Dr 1,200; To Sales A/c 1,200. The suspense account is then closed (balance nil). This is a one-sided error, so it was the one that disturbed the trial balance.',
  },
  // ───────────── Class XI · Unit 3 ─────────────
  'XI.3.concepts': {
    q: 'Classify: (a) a delivery van bought for ₹3,00,000; (b) repairs to the van ₹4,000; (c) old furniture sold for ₹10,000; (d) an advertising campaign of ₹60,000 whose benefit will last 3 years. How much of (d) is charged to the profit and loss account in the first year?',
    a: '(a) Capital expenditure. (b) Revenue expenditure. (c) Capital receipt. (d) Deferred revenue expenditure: the benefit lasts 3 years, so 60,000 ÷ 3 = ₹20,000 is written off each year. In year 1, ₹20,000 is charged and ₹40,000 is carried forward in the balance sheet.',
  },
  'XI.3.balance-sheet': {
    q: 'Arrange a balance sheet from: capital ₹1,40,000; long-term loan ₹50,000; creditors ₹20,000; furniture ₹90,000; stock ₹60,000; debtors ₹40,000; cash ₹20,000.',
    a: 'Liabilities (in order of permanence): capital 1,40,000; long-term loan 50,000; creditors 20,000; total ₹2,10,000. Assets (fixed assets first, then current assets): furniture 90,000; stock 60,000; debtors 40,000; cash 20,000; total ₹2,10,000. Both sides agree. In order of liquidity the asset side would start with cash.',
  },
  'XI.P.project': {
    q: 'A student chooses the bank reconciliation project. List the stages of the file in order.',
    a: 'Choose the topic with the teacher; collect a cash book and a passbook (or realistic specimens); find the items that differ; prepare the reconciliation statement; check the final balance against the other book; write the conclusions in your own words; prepare for the viva questions.',
  },
  // ───────────── Class XII · Part A: partnership ─────────────
  'XII.1.fundamentals': {
    q: 'A and B are partners with no agreement on interest, salary or sharing. A’s capital is ₹4,00,000 and B’s ₹1,00,000. A has also lent the firm ₹50,000. The year’s profit is ₹90,000. How is it shared, and what does A get as interest on the loan?',
    a: 'When the deed is silent, the Indian Partnership Act 1932 gives: profits shared equally, so A and B get ₹45,000 each; no interest on capital and no salary. A’s loan earns interest at 6% a year: 50,000 × 6% = ₹3,000, a charge against profit before it is divided.',
  },
  'XII.1.capital': {
    q: 'A’s capital is ₹5,00,000. In the year A’s share of profit is ₹80,000, interest on capital ₹30,000 and drawings ₹40,000. Under fixed capitals show the capital and the current account; under fluctuating capitals show the capital at the end.',
    a: 'Fixed capitals: capital stays ₹5,00,000; the current account moves by 80,000 + 30,000 − 40,000 = ₹70,000 credit. Fluctuating capitals: closing capital = 5,00,000 + 80,000 + 30,000 − 40,000 = ₹5,70,000.',
  },
  'XII.1.appropriation': {
    q: 'Net profit ₹1,00,000. A and B share profits 3:2. Interest on capital: A ₹8,000, B ₹4,000. Salary to B ₹18,000. Prepare the appropriation and find what each partner gets in all.',
    a: 'Profit available for sharing = 1,00,000 − 8,000 − 4,000 − 18,000 = ₹70,000. A gets 3/5 × 70,000 = ₹42,000; B gets 2/5 × 70,000 = ₹28,000. In all: A = 8,000 + 42,000 = ₹50,000; B = 4,000 + 18,000 + 28,000 = ₹50,000. Total = ₹1,00,000.',
  },
  'XII.1.guarantee': {
    q: 'A and B share profits 3:2 and admit C for a 1/5 share. A and B guarantee C a minimum of ₹30,000 a year and bear any shortfall in the ratio 3:2. The year’s profit is ₹1,00,000. Find each partner’s share.',
    a: 'C’s share = 1/5 × 1,00,000 = ₹20,000, which is below ₹30,000, so the shortfall is ₹10,000. A and B first share the other 4/5 (₹80,000) in 3:2: A 48,000, B 32,000. They bear the shortfall 3:2: A 6,000, B 4,000. Final: A = 42,000; B = 28,000; C = 30,000. Total = ₹1,00,000.',
  },
  'XII.1.past-adjustments': {
    q: 'Last year’s profit of ₹1,00,000 was shared equally by A and B, but the deed says 3:2. Pass the adjustment entry.',
    a: 'Should have been: A 60,000, B 40,000. Actually shared: A 50,000, B 50,000. A is short by ₹10,000 and B has ₹10,000 too much. Entry: B’s Capital A/c Dr 10,000; To A’s Capital A/c 10,000. The firm’s total profit does not change.',
  },
  'XII.1.death': {
    q: 'A, B and C share profits 3:2:1. C dies on 30 September. The accounts are made up to 31 March each year, and the last year’s profit was ₹1,20,000. Find C’s share of profit up to the date of death, on the basis of last year’s profit.',
    a: 'Profit for 6 months (1 April to 30 September) = 1,20,000 × 6/12 = ₹60,000. C’s share is 1/6, so C’s share of profit = 60,000 × 1/6 = ₹10,000. It is credited to C’s capital account (debit Profit and Loss Suspense A/c) and goes to his executor with the rest of the amount due.',
  },
  'XII.1.dissolution': {
    q: 'On dissolution, assets (other than cash) of book value ₹2,40,000 are sold for ₹2,10,000. Creditors of ₹50,000 are paid ₹48,000. Realisation expenses of ₹4,000 are paid. A and B share equally. Find the loss on realisation and each partner’s share of it.',
    a: 'Realisation account: debit side = assets 2,40,000 + creditors paid 48,000 + expenses 4,000 = ₹2,92,000. Credit side = creditors 50,000 + cash from sale of assets 2,10,000 = ₹2,60,000. Loss = 2,92,000 − 2,60,000 = ₹32,000, shared equally: ₹16,000 each (debit each partner’s capital account).',
  },
  // ───────────── Class XII · Part A: companies ─────────────
  'XII.2.fundamentals': {
    q: 'A company’s authorised capital is 5,00,000 shares of ₹10 each. It issues 4,00,000 shares; 3,80,000 are subscribed. ₹8 a share has been called, and calls of ₹40,000 are unpaid. Find the authorised, issued, subscribed, called-up and paid-up capital.',
    a: 'Authorised = 5,00,000 × 10 = ₹50,00,000. Issued = 4,00,000 × 10 = ₹40,00,000. Subscribed = 3,80,000 × 10 = ₹38,00,000. Called-up = 3,80,000 × 8 = ₹30,40,000. Paid-up = 30,40,000 − 40,000 (calls in arrears) = ₹30,00,000.',
  },
  'XII.2.concepts': {
    q: 'A company issues 1,000 shares of ₹10 each at a premium of ₹2 to a supplier in payment for machinery agreed at ₹12,000. Pass the entry.',
    a: 'Machinery A/c Dr 12,000; To Equity Share Capital A/c 10,000 (1,000 × 10); To Securities Premium A/c 2,000 (1,000 × 2). No cash is involved, so the entry is made without Bank.',
  },
  'XII.2.disclosure': {
    q: 'A company has 1,00,000 authorised equity shares of ₹10. It has issued 60,000 shares, all called at ₹10. 58,000 shares are fully paid; on the other 2,000 shares ₹2 a share is still unpaid. How is the paid-up capital shown in the notes?',
    a: 'Subscribed and fully paid up: 58,000 shares × 10 = ₹5,80,000. Subscribed but not fully paid up: 2,000 shares × 10 = ₹20,000, less calls unpaid (2,000 × 2) ₹4,000, giving ₹16,000. Total = 5,80,000 + 16,000 = ₹5,96,000. The authorised capital (1,00,000 shares) is stated separately.',
  },
  'XII.2.debentures': {
    q: 'A company issues 1,000 12% debentures of ₹100 each at a discount of 5%. Pass the entry for the issue and find the interest for a year.',
    a: 'Cash received = 1,000 × 95 = ₹95,000. Entry: Bank A/c Dr 95,000; Discount on Issue of Debentures A/c Dr 5,000; To 12% Debentures A/c 1,00,000. Yearly interest = 12% × 1,00,000 = ₹12,000, always on the face value. (Entries for redemption are not in the syllabus.)',
  },
  // ───────────── Class XII · Part B ─────────────
  'XII.3.statements': {
    q: 'Under which Schedule III head and sub-head does each item go? (a) securities premium; (b) 10% debentures repayable after 5 years; (c) bank overdraft; (d) trade payables; (e) land and buildings; (f) trade receivables; (g) prepaid insurance.',
    a: '(a) Equity and Liabilities: shareholders’ funds, reserves and surplus. (b) Non-current liabilities: long-term borrowings. (c) Current liabilities: short-term borrowings. (d) Current liabilities: trade payables. (e) Non-current assets: property, plant and equipment. (f) Current assets: trade receivables. (g) Current assets: other current assets.',
  },
  'XII.3.comparative': {
    q: 'Revenue from operations was ₹5,00,000 in the first year and ₹6,00,000 in the next. Trade receivables fell from ₹80,000 to ₹72,000. Find the absolute change and the percentage change of each.',
    a: 'Revenue: 6,00,000 − 5,00,000 = ₹1,00,000 increase; 1,00,000 ÷ 5,00,000 × 100 = 20%. Trade receivables: 72,000 − 80,000 = ₹8,000 decrease; 8,000 ÷ 80,000 × 100 = 10% decrease. The percentage is always on the earlier (base) year.',
  },
  'XII.3.common-size': {
    q: 'Revenue from operations ₹8,00,000; cost of materials ₹4,00,000; employee benefit expense ₹1,20,000; other expenses ₹80,000. Prepare the common-size figures on revenue and find profit before tax as a percentage.',
    a: 'Each item ÷ 8,00,000 × 100: materials 50%; employee benefit expense 15%; other expenses 10%. Total expenses = 4,00,000 + 1,20,000 + 80,000 = ₹6,00,000 = 75%. Profit before tax = 8,00,000 − 6,00,000 = ₹2,00,000 = 25% of revenue.',
  },
  'XII.3.solvency': {
    q: 'Long-term borrowings ₹4,00,000; shareholders’ funds ₹8,00,000; total assets ₹16,00,000; profit before interest and tax ₹2,40,000; interest ₹40,000. Find the debt-equity ratio, total assets to debt ratio, proprietary ratio, debt to capital employed ratio and interest coverage ratio.',
    a: 'Debt-equity = 4,00,000 ÷ 8,00,000 = 0.5 : 1. Total assets to debt = 16,00,000 ÷ 4,00,000 = 4 : 1. Proprietary ratio = 8,00,000 ÷ 16,00,000 = 0.5 : 1. Capital employed = 8,00,000 + 4,00,000 = 12,00,000, so debt to capital employed = 4,00,000 ÷ 12,00,000 = 0.33 : 1. Interest coverage = 2,40,000 ÷ 40,000 = 6 times.',
  },
  'XII.3.profitability': {
    q: 'Revenue from operations ₹10,00,000; cost of revenue from operations ₹6,00,000; operating expenses ₹2,00,000; net profit after tax ₹1,00,000. Find the gross profit ratio, operating ratio, operating profit ratio and net profit ratio.',
    a: 'Gross profit = 10,00,000 − 6,00,000 = ₹4,00,000, so gross profit ratio = 40%. Operating cost = 6,00,000 + 2,00,000 = ₹8,00,000, so operating ratio = 80%. Operating profit = 10,00,000 − 8,00,000 = ₹2,00,000, so operating profit ratio = 20%. Net profit ratio = 1,00,000 ÷ 10,00,000 × 100 = 10%.',
  },
  'XII.4.classification': {
    q: 'Classify as operating, investing or financing activity: (a) cash received from customers; (b) purchase of machinery; (c) issue of equity shares; (d) interest received on investments; (e) dividend paid; (f) interest paid on debentures.',
    a: '(a) Operating. (b) Investing. (c) Financing. (d) Investing. (e) Financing. (f) Financing.',
  },
  'XII.4.preparation': {
    q: 'Net profit before tax ₹2,00,000 after charging depreciation ₹30,000, interest on debentures ₹10,000 and a loss on sale of machinery ₹5,000. Trade receivables increased by ₹20,000 and trade payables by ₹15,000. Tax paid was ₹40,000. Find the cash flow from operating activities by the indirect method.',
    a: 'Net profit before tax 2,00,000 + depreciation 30,000 + interest 10,000 + loss on sale 5,000 = operating profit before working capital changes ₹2,45,000. Less increase in receivables 20,000; add increase in payables 15,000: cash generated from operations ₹2,40,000. Less tax paid 40,000 = net cash from operating activities ₹2,00,000.',
  },
  'XII.C.cas': {
    q: 'Give two benefits and one limitation of a computerised accounting system compared with a manual one.',
    a: 'Benefits: entries are processed quickly and reports (ledger, trial balance, statements) come out automatically and consistently; errors of posting and totalling are reduced. Limitation: the system needs trained users, security (passwords and backups) and a reliable power and software set-up, and a wrong entry is still wrong.',
  },
  'XII.C.spreadsheet': {
    q: 'In a spreadsheet, B2 holds the cost ₹1,00,000 and B3 the WDV rate 10%. Write the formula in B4 for the first year’s depreciation and in B5 for the closing book value. What is the second year’s depreciation formula and value?',
    a: 'B4: =B2*B3 gives ₹10,000. B5: =B2-B4 gives ₹90,000. Second year: =B5*B3 gives ₹9,000 (10% of the opening book value of ₹90,000).',
  },
  'XII.C.using': {
    q: 'Why must every ledger account have a unique code in a computerised system, and what goes wrong if a clerk keys a wrong code? Name two security measures.',
    a: 'The code tells the software which account to post to, so it must be unique. A wrong code posts the amount to the wrong account; the trial balance still agrees, so the error is not caught by it and must be found by checking the entry. Security measures: user passwords with access rights, and regular backups.',
  },
  'XII.P.project': {
    q: 'A student does the analysis project on a listed company and chooses ratio analysis and the cash flow statement as the two aspects. What should the file show for each?',
    a: 'For each aspect: the source figures taken from the company’s published statements, the calculation set out step by step, a comparison with the previous year or with a similar company, and a conclusion in the student’s own words. The student should be ready for the viva on every figure used.',
  },
};
