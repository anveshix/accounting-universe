/**
 * Chapter-wise, topic-wise STUDY GUIDE for every syllabus topic (CBSE Accountancy 055, 2026-27).
 *
 * What this is: concise, exam-oriented revision notes written for this app. All wording is original; no textbook (D K Goyal, Grewal, Sandeep Garg,
 * NCERT or a coaching book) is copied, and no question from any book or sample paper is reproduced.
 * What it is not: a replacement for the prescribed textbook, and not yet reviewed by a subject teacher (decision D11): each page says so.
 * Scope rule (AGENTS.md rule 3): it explains only topics that are in the official syllabus and respects every official limit
 * (for example: no change of depreciation method, only three goodwill methods, indirect cash flow only, no piecemeal distribution).
 *
 * Worked examples carry hand-checked figures; `test/study.test.ts` recomputes each of them independently and through the engine.
 */
import { MORE_EXAMPLES } from './study-examples';
import { MORE } from './study-more';

export interface StudyExample {
  readonly q: string;
  readonly a: string;
}
export interface StudyGuide {
  readonly clause: string;
  /** one or two sentences: what the topic is about and why it matters */
  readonly summary: string;
  /** the ideas to know cold: definitions, rules, classifications */
  readonly mustKnow: readonly string[];
  /** formats, formulae and entry patterns, as plain text lines */
  readonly formats?: readonly string[];
  /** how to attack the typical question, step by step */
  readonly steps?: readonly string[];
  /** frequent errors that lose marks */
  readonly mistakes: readonly string[];
  /** the forms in which the topic is usually asked (no marks or frequency claims: those come from the official sample paper only) */
  readonly asked: string;
  readonly example?: StudyExample;
  /** points the official syllabus lists for this topic that the notes above do not cover (see study-more.ts) */
  readonly extra?: readonly string[];
}

export const STUDY_STATUS = 'Original revision notes, not yet reviewed by a subject teacher (D11). Check against your prescribed textbook.';

const G = (clause: string, g: Omit<StudyGuide, 'clause'>): [string, StudyGuide] => [clause, { clause, ...g }];

const BASE_STUDY: Readonly<Record<string, StudyGuide>> = Object.fromEntries([
  // ───────────────────────── Class XI · Unit 1 — Theoretical Framework ─────────────────────────
  G('XI.1.intro', {
    summary:
      'Accounting records, classifies and summarises money-measurable transactions so that people can take decisions. This topic is vocabulary and purpose: who uses accounts and what makes information useful.',
    mustKnow: [
      'Accounting = identifying, measuring, recording, classifying, summarising, analysing and communicating financial information.',
      'Objectives: systematic records, ascertaining profit or loss, showing financial position, providing information to users.',
      'Internal users: owners, managers, employees. External users: investors, lenders, suppliers, customers, government, researchers.',
      'Qualitative characteristics: reliability, relevance, understandability, comparability.',
      'Book-keeping is the recording part; accounting also analyses, interprets and communicates.',
    ],
    mistakes: ['Writing book-keeping and accounting as if they were the same thing.', 'Naming users without saying what each one needs from the accounts.'],
    asked: 'Mostly one-mark multiple-choice items and short definitions; sometimes a statement to be matched with the right characteristic or user.',
  }),
  G('XI.1.terms', {
    summary: 'The everyday terms of accounting. Every later chapter uses them, so mixing them up costs marks everywhere.',
    mustKnow: [
      'Asset: a resource owned that will bring future benefit. Liability: an amount owed to outsiders. Capital: the owner’s investment, i.e. assets minus liabilities.',
      'Drawings: cash or goods taken by the owner for personal use. They reduce capital and are not an expense of the business.',
      'Expenditure is the spending; expense is the part used up in earning this year’s revenue. Revenue is income from the main activity; a gain is an incidental increase.',
      'Debtors owe the business money; creditors are owed money by the business. Bad debts are debts that cannot be recovered.',
      'Trade discount is a reduction in the list price and is never recorded; cash discount is allowed for prompt payment and is recorded.',
      'Purchases means goods bought for resale; a machine bought for use is an asset, never purchases.',
    ],
    mistakes: ['Treating drawings as an expense.', 'Recording trade discount in the books.', 'Putting a fixed asset into purchases.'],
    asked: 'One-mark items that give a description and ask for the term, and short classification items (asset, liability, expense, income).',
  }),
  G('XI.1.concepts', {
    summary: 'GAAP are the rules and conventions that make accounts comparable. Each concept is a rule about what to record and how.',
    mustKnow: [
      'Business entity: the business is separate from its owner. Money measurement: only items that can be expressed in money are recorded.',
      'Going concern: the business will continue, so assets are not valued at break-up prices. Accounting period: profit is measured for a fixed period.',
      'Cost concept: assets are recorded at cost. Dual aspect: every transaction has two equal effects (the basis of A = L + C).',
      'Revenue recognition (realisation): revenue is recorded when the right to receive it arises, not when cash comes. Matching: expenses are set against the revenue they helped to earn.',
      'Accrual: record income and expenses when they are earned or incurred. Full disclosure, consistency, conservatism, materiality and objectivity complete the list.',
    ],
    mistakes: ['Giving a concept name without the matching business example.', 'Confusing conservatism (provide for losses, do not anticipate gains) with materiality (ignore trivial items).'],
    asked: 'One-mark or case-based items that describe a situation (for example, “stock valued at cost even though market price is higher”) and ask which concept it follows.',
  }),
  G('XI.1.basis', {
    summary: 'Two ways of deciding which year a transaction belongs to: when cash moves, or when the right or obligation arises.',
    mustKnow: [
      'Cash basis: income and expense are recorded only when cash is received or paid.',
      'Accrual basis: income and expense are recorded when earned or incurred, whether or not cash has moved. It follows the matching concept.',
      'Under the accrual basis you need outstanding and prepaid expenses and accrued and advance income at the year end.',
      'Accrual gives a truer profit; cash basis is simple but can mislead (rent paid for two years shows up in one).',
    ],
    mistakes: ['Saying accrual basis ignores cash; it records cash too, just not only cash.', 'Forgetting that adjustments exist because of the accrual basis.'],
    asked: 'One-mark items and small tables that ask for profit on the two bases from the same data.',
  }),
  G('XI.1.standards', {
    summary: 'Accounting standards are the written rules that bring uniformity. You need to know what they are, who issues them and which framework applies to whom.',
    mustKnow: [
      'Accounting Standards (AS) are issued in India to standardise treatment and disclosure; Ind AS are the standards converged with international standards.',
      'Ind AS applies to the companies the rules specify (by listing and size); other companies follow AS.',
      'Standards improve comparability and reduce the choices an accountant can make.',
      'Know the idea of applicability, not a list of numbered standards beyond the ones named in your syllabus (for example AS 3 for cash flow and AS 26 for intangible assets).',
    ],
    mistakes: ['Writing that every business must follow Ind AS.', 'Quoting figures for the applicability thresholds from memory.'],
    asked: 'One-mark multiple-choice items on the purpose and applicability of AS and Ind AS.',
  }),
  G('XI.1.gst', {
    summary: 'GST is a single indirect tax on supply of goods and services. At this level you need its features and benefits, and the simple calculation used with trade discount and freight.',
    mustKnow: [
      'GST is a destination-based, multi-stage tax levied on the value added at each stage.',
      'Within a state: CGST (centre) plus SGST/UTGST (state or union territory). Between states: IGST.',
      'Input tax credit lets a business set the tax paid on purchases against the tax collected on sales, so tax does not pile up on tax.',
      'Advantages: removes cascading of taxes, one tax for the whole country, more transparency, easier compliance.',
    ],
    steps: [
      'Take the list price, deduct trade discount.',
      'Add freight or cartage charged on the invoice.',
      'Apply the GST rate to this taxable value (half CGST and half SGST within the state, or IGST).',
    ],
    mistakes: ['Charging GST on the list price before trade discount.', 'Using both CGST/SGST and IGST on the same supply.'],
    asked: 'Features and advantages as short answers; a small invoice calculation under the “simple GST calculation” limit.',
  }),

  // ───────────────────────── Class XI · Unit 2 — Accounting Process ─────────────────────────
  G('XI.2.vouchers', {
    summary: 'Every entry starts from a document. Source documents prove that a transaction happened; vouchers are the internal papers made from them.',
    mustKnow: [
      'Source documents: cash memo, invoice, bill, receipt, pay-in-slip, cheque, debit note, credit note, salary sheet.',
      'Vouchers are prepared from source documents and authorise the entry: receipt voucher, payment voucher and transfer (non-cash) voucher.',
      'A debit note is sent to the supplier when goods are returned; a credit note is sent to the customer when goods are returned to us.',
      'Documents give evidence, help in audit and prevent fraud.',
    ],
    mistakes: ['Mixing up debit note and credit note.', 'Treating a voucher and a source document as identical.'],
    asked: 'One-mark items matching a document with its use; a transaction described and the voucher type asked.',
  }),
  G('XI.2.equation', {
    summary: 'A = L + C is the foundation of double entry. Every transaction changes the equation but never breaks it.',
    mustKnow: [
      'Assets = Liabilities + Capital (owner’s equity). Capital = Assets − Liabilities.',
      'Profit increases capital, loss and drawings decrease it; additional capital increases it.',
      'A transaction can: raise assets and liabilities together, raise assets and capital together, move value between two assets, and so on, but both sides always stay equal.',
      'Goods sold at a profit reduce stock at cost and increase cash or debtors at the sale price; only the margin raises capital.',
    ],
    formats: ['A = L + C', 'Closing capital = opening capital + additional capital + profit − drawings'],
    steps: [
      'Write each item as asset, liability or capital.',
      'For each transaction decide which two items change and in which direction.',
      'Check that the equation still balances after every line.',
    ],
    mistakes: ['Adding the whole sale price to capital instead of only the profit.', 'Forgetting that drawings reduce capital.'],
    asked: 'Tables of transactions with the effect on assets, liabilities and capital; finding the missing figure.',
  }),
  G('XI.2.rules', {
    summary: 'The rules of debit and credit decide which account is debited and which credited. Learn them by type of account, not by transaction.',
    mustKnow: [
      'Assets and expenses (and drawings) increase on the debit side. Liabilities, capital and income increase on the credit side. A decrease goes on the opposite side.',
      'Traditional form: personal accounts (debit the receiver, credit the giver); real accounts (debit what comes in, credit what goes out); nominal accounts (debit expenses and losses, credit incomes and gains).',
      'Every transaction debits one or more accounts and credits one or more accounts for the same total.',
      'Sales and purchases of goods are recorded in the sales and purchases accounts under the periodic method used in the syllabus.',
    ],
    steps: [
      'Name the two accounts affected.',
      'Decide what each one is: asset, liability, capital, income or expense.',
      'Decide whether each increases or decreases.',
      'Apply the rule to get debit or credit.',
    ],
    mistakes: [
      'Debiting the giver and crediting the receiver for a personal account.',
      'Writing purchases instead of the asset when machinery or furniture is bought.',
      'Treating drawings as an expense.',
    ],
    asked: 'Identify the debit and credit accounts for a transaction; classify accounts as personal, real or nominal.',
  }),
  G('XI.2.journal', {
    summary: 'The journal is the book of original entry: every transaction is first written here in date order, with a narration.',
    mustKnow: [
      'Columns: date, particulars (the debit account first, the credit account with “To”), ledger folio, debit amount, credit amount.',
      'A compound entry has more than one debit or credit but total debits always equal total credits.',
      'Narration is a short explanation under the entry. The opening entry records the assets, liabilities and capital at the start.',
      'Journal proper is used for entries that do not belong to any special book: opening entry, closing entries, adjustments, rectification, credit purchase or sale of assets.',
    ],
    formats: ['Date | Particulars | L.F. | Dr. (₹) | Cr. (₹)', 'Machinery A/c ... Dr. ₹50,000      To Bank A/c ₹50,000      (Machinery purchased by cheque)'],
    mistakes: ['Not indenting the credit account with “To”.', 'Forgetting the narration.', 'Unequal debit and credit totals in a compound entry.'],
    asked: 'Pass journal entries for a list of transactions, including compound entries; short items on the purpose of the journal.',
  }),
  G('XI.2.cashbook', {
    summary: 'The cash book is both a journal and a ledger for cash. It has three forms: simple, with a bank column, and the petty cash book.',
    mustKnow: [
      'Debit side: receipts. Credit side: payments. The cash balance is always a debit balance.',
      'Two-column cash book (cash and bank) and three-column cash book (cash, bank, discount).',
      'Discount allowed (to customers) is on the debit side; discount received (from suppliers) is on the credit side.',
      'A contra entry records a transaction affecting only cash and bank (depositing cash in the bank, withdrawing cash). It is entered on both sides and needs no ledger posting.',
      'Petty cash book: the imprest system gives the petty cashier a fixed amount; at the end of the period the cashier is reimbursed exactly what was spent.',
    ],
    steps: [
      'Enter every receipt and payment on the correct side and column.',
      'Mark contra entries with “C”.',
      'Total the discount columns and post them to the discount accounts.',
      'Balance cash and bank columns separately.',
    ],
    mistakes: ['Putting discount allowed on the credit side.', 'Posting a contra entry to the ledger.', 'Calling an overdraft a debit balance.'],
    asked: 'Prepare a three-column cash book from transactions; prepare an analytical petty cash book; find the imprest reimbursement.',
  }),
  G('XI.2.subsidiary', {
    summary: 'Special journals keep the journal short: one book for each repeated kind of transaction.',
    mustKnow: [
      'Purchases book: credit purchases of goods only. Sales book: credit sales of goods only. Cash purchases and purchase of assets do not go here.',
      'Purchases return book and sales return book record goods sent back. The journal proper takes all other non-cash entries.',
      'Trade discount is deducted on the invoice and never recorded. Freight and cartage on the invoice are added to the cost.',
      'GST (simple calculation): CGST and SGST within the state, IGST between states, charged on the amount after trade discount.',
    ],
    steps: [
      'Take the list price, deduct trade discount.',
      'Add freight or cartage on the invoice.',
      'Add GST on the net taxable amount.',
      'Post the totals of the book to the ledger (purchases or sales, and the party accounts).',
    ],
    mistakes: ['Recording cash purchases in the purchases book.', 'Including trade discount in the entry.', 'Charging GST before deducting trade discount.'],
    asked: 'Prepare a purchases or sales book with GST from invoices; journal proper entries; identify the book for a transaction.',
  }),
  G('XI.2.ledger', {
    summary: 'The ledger groups every account in one place. Posting moves the journal into accounts, and balancing finds the closing position of each.',
    mustKnow: [
      'Each account is a T-shape: debit on the left (prefix “To”), credit on the right (prefix “By”).',
      'Posting: write the account that is the other side of the entry in particulars.',
      'Balancing: total both sides, put the difference on the smaller side as “Balance c/d”, show the same amount as “Balance b/d” on the opposite side at the start of the next period.',
      'Real and personal accounts are balanced and carried forward. Nominal accounts are closed to the trading and profit and loss account.',
    ],
    formats: ['Dr. Cash A/c Cr.', 'Date | Particulars | J.F. | Amount     |     Date | Particulars | J.F. | Amount'],
    steps: ['Post every journal entry to both accounts.', 'Total each side.', 'Write the difference on the smaller side as Balance c/d.', 'Bring it down as Balance b/d on the other side.'],
    mistakes: ['Putting Balance c/d on the bigger side.', 'Naming the balance after the wrong side.', 'Posting an entry to only one account.'],
    asked: 'Post a set of journal entries and balance the accounts; find a missing figure in a ledger account.',
  }),
  G('XI.2.brs', {
    summary: 'The bank column of your cash book and the bank’s passbook rarely agree on a given date. The reconciliation statement explains the difference.',
    mustKnow: [
      'Causes: cheques issued but not yet presented, cheques deposited but not yet collected, direct deposits and payments by the bank, bank charges, interest and errors.',
      'Starting from the cash book balance (a favourable balance): ADD cheques issued but not presented, interest or direct deposits credited by the bank; LESS cheques deposited but not collected, bank charges and direct payments.',
      'The rules reverse if you start from an overdraft or from the passbook balance.',
      'The statement does not change the books; entries are passed only for items that are missing from the cash book.',
    ],
    steps: [
      'Decide the starting balance and whether it is favourable or an overdraft.',
      'Put each item on the add or less side using the rule.',
      'Total to the other book’s balance.',
      'Check the answer against the figure that the question gives.',
    ],
    mistakes: ['Adding cheques deposited but not cleared.', 'Not reversing the signs for an overdraft.', 'Passing an entry for a timing difference.'],
    asked: 'Prepare a bank reconciliation statement from the cash book and passbook; find the passbook or cash book balance.',
    example: {
      q: 'Cash book shows a favourable balance of ₹20,000. Cheques issued ₹3,000 not yet presented; cheques deposited ₹5,000 not yet collected; bank charges ₹200 not yet entered; interest ₹400 credited by the bank not yet entered. Find the passbook balance.',
      a: '20,000 + 3,000 (issued, not presented) + 400 (interest) − 5,000 (deposited, not collected) − 200 (bank charges) = ₹18,200.',
    },
  }),
  G('XI.2.depreciation', {
    summary:
      'Depreciation spreads the cost of a fixed asset over its useful life. You need the two methods, the two ways of recording it and the profit or loss on disposal. Change of method is outside the syllabus.',
    mustKnow: [
      'Straight line method (SLM): the same amount every year = (cost − scrap value) ÷ useful life.',
      'Written down value method (WDV): a fixed percentage on the opening book value each year, so the charge falls every year.',
      'Recording: either credit the asset account directly, or credit a provision for depreciation account and keep the asset at cost.',
      'Disposal: compare the sale price with the book value on the date of sale. Sale price below book value gives a loss; above gives a profit.',
      'For a part of a year, charge depreciation for the months the asset was used.',
    ],
    formats: ['SLM: (Cost − Scrap value) ÷ Life', 'WDV: Opening book value × Rate %', 'Book value = Cost − accumulated depreciation', 'Profit or loss on sale = Sale price − Book value'],
    steps: [
      'Find depreciation for each year to the date of sale.',
      'Find the book value on the date of sale.',
      'Pass the entries: depreciation, then the asset disposal (asset account closed, sale proceeds, profit or loss).',
    ],
    mistakes: ['Applying the WDV rate on cost every year.', 'Forgetting scrap value in SLM.', 'Not charging part-year depreciation.', 'Mixing up the two recording methods.'],
    asked: 'Calculate depreciation under both methods; prepare the asset account and the provision for depreciation account; compute profit or loss on sale and pass the entries.',
    example: {
      q: 'A machine costs ₹1,00,000, scrap value ₹10,000, life 5 years. Find the yearly SLM depreciation. Then find the WDV depreciation for the first two years at 20%.',
      a: 'SLM = (1,00,000 − 10,000) ÷ 5 = ₹18,000 a year. WDV: year 1 = 20% of 1,00,000 = ₹20,000; year 2 = 20% of 80,000 = ₹16,000.',
    },
  }),
  G('XI.2.provisions', {
    summary: 'A provision is money set aside for a known liability or probable loss; a reserve is a part of profit kept back. They are treated very differently.',
    mustKnow: [
      'Provision for bad debts: charged to the profit and loss account and shown as a deduction from debtors. It is for expected, not actual, bad debts.',
      'Bad debts are written off first; the provision is then calculated on the remaining good debtors.',
      'A reserve is created out of profit. Revenue reserves (general and specific) can be distributed; a capital reserve comes from capital profits and is not.',
      'Creating a provision reduces profit; creating a reserve is an appropriation of profit.',
    ],
    formats: ['Bad Debts A/c Dr.     To Debtors A/c', 'Profit and Loss A/c Dr.     To Provision for Bad Debts A/c'],
    steps: [
      'Write off actual bad debts from debtors.',
      'Compute provision as a percentage of the remaining debtors.',
      'Adjust for the old provision already in the books (charge only the increase, credit any decrease).',
    ],
    mistakes: ['Calculating the provision on debtors before deducting bad debts.', 'Charging the whole new provision instead of only the increase.', 'Treating a reserve like an expense.'],
    asked: 'Compute and record the provision for bad debts and discount; short questions on the difference between provision and reserve.',
    example: { q: 'Debtors are ₹50,000 before writing off bad debts of ₹2,000. Provision for bad debts is 5%. Find the provision.', a: '(50,000 − 2,000) × 5% = 48,000 × 5% = ₹2,400.' },
  }),
  G('XI.2.tb', {
    summary: 'The trial balance lists every ledger balance on its debit or credit side. If the books are arithmetically right the totals agree. The syllabus uses the balance method only.',
    mustKnow: [
      'Assets, expenses and drawings have debit balances; liabilities, capital and income have credit balances.',
      'Agreement of the totals shows the arithmetic is consistent but not that the books are correct: some errors do not disturb it.',
      'If the totals differ, the difference is put in a suspense account until the errors are found.',
      'Opening stock appears in the trial balance as a debit; closing stock appears only in the adjustments.',
    ],
    steps: ['List each balance on its own side.', 'Total both sides.', 'If they differ, enter the difference in a suspense account on the smaller side.'],
    mistakes: ['Putting a balance on the wrong side (this moves both totals).', 'Including closing stock in the trial balance.', 'Saying agreement proves the books are free of errors.'],
    asked: 'Prepare a trial balance from ledger balances; find the missing figure; say what the suspense difference shows.',
  }),
  G('XI.2.errors', {
    summary: 'Errors can be hidden or visible. You must classify each, say whether it affects the trial balance, and pass the rectifying entry.',
    mustKnow: [
      'Error of omission: complete (never recorded, trial balance unaffected) or partial (one side only, trial balance disturbed).',
      'Error of commission: wrong amount or wrong account within the same class; compensating errors cancel each other out.',
      'Error of principle: treating a capital item as revenue or the reverse (for example an asset debited to expenses).',
      'Errors that do not affect the trial balance: complete omission, errors of principle, errors of commission in the wrong account, compensating errors.',
      'One-sided errors are rectified through the suspense account; two-sided errors are rectified with a direct entry.',
    ],
    formats: ['Rectifying entry = correct entry − wrong entry, account by account.', 'Suspense account is closed by the rectification of one-sided errors.'],
    steps: [
      'Write the entry that should have been passed.',
      'Write the entry that was passed.',
      'Cancel the common part and pass the difference.',
      'If only one side was posted, use the suspense account for the other side.',
    ],
    mistakes: ['Passing the rectifying entry in the wrong direction.', 'Using the suspense account for an error that was two-sided.', 'Calling a compensating error a one-sided error.'],
    asked: 'Name the type of error and its effect on the trial balance; pass rectifying entries; prepare a suspense account.',
  }),

  // ───────────────────────── Class XI · Unit 3 — Financial Statements of a Sole Proprietorship ─────────────────────────
  G('XI.3.concepts', {
    summary: 'Before preparing financial statements you need the idea of capital and revenue items and how an opening entry brings last year’s balances in.',
    mustKnow: [
      'Capital expenditure gives a benefit for more than one year (an asset); revenue expenditure is used up in the year (an expense).',
      'Capital receipts increase capital or liabilities; revenue receipts are income from the normal activity.',
      'Deferred revenue expenditure is a revenue expense whose benefit lasts several years, so it is written off over those years (for example a very heavy advertising campaign).',
      'The opening entry records all assets (debit), liabilities (credit) and the capital as the balancing credit.',
    ],
    mistakes: ['Treating repairs as capital expenditure when they only maintain the asset.', 'Treating the cost of improving an asset as revenue.'],
    asked: 'Classify an item as capital or revenue; pass the opening entry; define deferred revenue expenditure.',
  }),
  G('XI.3.trading-pl', {
    summary: 'The trading account finds gross profit; the profit and loss account finds net profit. Learn what goes in each.',
    mustKnow: [
      'Trading account: opening stock, purchases (less returns), direct expenses on the debit side; sales (less returns) and closing stock on the credit side.',
      'Gross profit = net sales − cost of goods sold. Cost of goods sold = opening stock + net purchases + direct expenses − closing stock.',
      'Operating profit = gross profit − operating (indirect) expenses. Net profit = operating profit + non-operating income − non-operating expenses.',
      'Direct expenses (carriage inwards, wages, factory expenses) go to the trading account; indirect expenses (salaries, rent, advertising) go to the profit and loss account.',
    ],
    formats: ['Cost of goods sold = Opening stock + Net purchases + Direct expenses − Closing stock', 'Gross profit = Net sales − Cost of goods sold'],
    steps: [
      'Transfer opening stock, purchases and direct expenses to the trading account.',
      'Show closing stock on the credit side.',
      'Find gross profit and carry it to the profit and loss account.',
      'Debit indirect expenses, credit other income, and find net profit.',
    ],
    mistakes: [
      'Showing closing stock in the trial balance and again as an adjustment.',
      'Charging carriage outwards to the trading account.',
      'Forgetting to deduct returns from purchases and sales.',
    ],
    asked: 'Prepare the trading and profit and loss account from a trial balance, with adjustments; find gross and net profit.',
    example: {
      q: 'Opening stock ₹20,000; purchases ₹1,00,000; direct expenses ₹5,000; closing stock ₹25,000; net sales ₹1,50,000. Find the cost of goods sold and the gross profit.',
      a: 'Cost of goods sold = 20,000 + 1,00,000 + 5,000 − 25,000 = ₹1,00,000. Gross profit = 1,50,000 − 1,00,000 = ₹50,000.',
    },
  }),
  G('XI.3.balance-sheet', {
    summary: 'The balance sheet shows assets and liabilities on a date. Grouping and marshalling decide the order in which they are shown.',
    mustKnow: [
      'Grouping puts like items together under a heading (current assets, fixed assets, and so on). Marshalling arranges them in a fixed order.',
      'Two orders: liquidity order (most liquid first) and permanence order (most permanent first).',
      'Capital in the balance sheet = opening capital + net profit − drawings (+ additional capital).',
      'Assets must equal capital plus liabilities.',
    ],
    steps: ['Take closing balances from the trial balance (after adjustments).', 'Group the items.', 'Add net profit and deduct drawings in the capital.', 'Check that both sides agree.'],
    mistakes: ['Showing drawings as an asset.', 'Not adjusting capital for profit and drawings.', 'Mixing the two orders on the same sheet.'],
    asked: 'Prepare the balance sheet; state the difference between grouping and marshalling.',
  }),
  G('XI.3.adjustments', {
    summary: 'Adjustments bring the accounts to the accrual basis. Each one has a double effect: on the profit and loss account (or trading account) and on the balance sheet.',
    mustKnow: [
      'Closing stock: credit side of the trading account and an asset in the balance sheet.',
      'Outstanding expense: added to the expense and shown as a liability. Prepaid expense: deducted from the expense and shown as an asset.',
      'Accrued income: added to the income and shown as an asset. Income received in advance: deducted from the income and shown as a liability.',
      'Depreciation: an expense in the profit and loss account and a deduction from the asset. Bad debts and provision for bad debts: expense, with a deduction from debtors.',
      'Abnormal loss (for example fire): taken out of the trading account and shown in the profit and loss account. Goods taken for personal use: deducted from purchases and added to drawings.',
      'Interest on capital is an expense and is added to capital; interest on drawings is income and is deducted from capital. Manager’s commission is an expense.',
    ],
    formats: ['Commission on profit after charging it: Net profit before commission × Rate ÷ (100 + Rate)', 'Commission on profit before charging it: Net profit before commission × Rate ÷ 100'],
    steps: [
      'Take each adjustment and write its two effects.',
      'Apply the first to the trading or profit and loss account.',
      'Apply the second to the balance sheet.',
      'Do not adjust the same item twice if it is already in the trial balance.',
    ],
    mistakes: ['Adjusting only one side of the effect.', 'Deducting an adjustment that is already inside the figure given.', 'Using the wrong commission formula.'],
    asked: 'Prepare final accounts with several adjustments; compute manager’s commission; short entries for the adjustments.',
    example: {
      q: 'Net profit before manager’s commission is ₹1,10,000. The manager gets 10% of the net profit after charging the commission. Find the commission. What would it be if it were 10% of profit before commission?',
      a: 'After charging: 1,10,000 × 10 ÷ 110 = ₹10,000. Before charging: 1,10,000 × 10% = ₹11,000.',
    },
  }),
  G('XI.3.incomplete', {
    summary:
      'When a trader keeps no proper books, profit is found by comparing capital at the start and the end of the year (statement of affairs method). The conversion method is outside the syllabus.',
    mustKnow: [
      'Statement of affairs lists assets and liabilities on a date; capital = assets − liabilities.',
      'Profit = closing capital − opening capital + drawings − additional capital introduced during the year.',
      'Prepare one statement for the start and one for the end of the year.',
      'Profit found this way is only as accurate as the lists of assets and liabilities.',
    ],
    formats: ['Capital = Assets − Liabilities', 'Profit = Closing capital − Opening capital + Drawings − Additional capital'],
    mistakes: ['Not adding back drawings.', 'Adding additional capital to profit instead of deducting it.', 'Omitting an asset or liability from the statement.'],
    asked: 'Prepare statements of affairs and find the profit or loss for the year.',
    example: { q: 'Opening capital ₹1,00,000; closing capital ₹1,40,000; drawings ₹20,000; additional capital ₹10,000. Find the profit.', a: '1,40,000 − 1,00,000 + 20,000 − 10,000 = ₹50,000.' },
  }),
  G('XI.P.project', {
    summary: 'Project work carries marks of its own and is done on one of the options: vouchers, bank reconciliation, or a comprehensive sole-proprietorship project.',
    mustKnow: [
      'Choose any one option and follow the school’s instructions; the official syllabus lists the permitted options.',
      'Keep every voucher, working and statement neat and dated; marks follow neatness, accuracy and understanding as well as the final answer.',
      'Be ready to explain each step in the viva.',
    ],
    steps: [
      'Pick the option with your teacher.',
      'Collect or prepare the source documents.',
      'Do the entries or statements in order.',
      'Check totals and balances.',
      'Prepare for the viva questions.',
    ],
    mistakes: ['Copying a project without understanding it.', 'Leaving figures unchecked.'],
    asked: 'Assessed by your school (file and viva); this app’s Project Assistant helps you plan and tick off the stages.',
  }),

  // ───────────────────────── Class XII · Unit 1 — Accounting for Partnership Firms ─────────────────────────
  G('XII.1.fundamentals', {
    summary: 'A partnership is an agreement to share the profits of a business. If the partnership deed is silent on a point, the Indian Partnership Act 1932 provisions apply.',
    mustKnow: [
      'Features: agreement between persons, a business, sharing of profit, mutual agency and unlimited liability.',
      'The partnership deed covers capital, profit-sharing ratio, interest, salary, drawings and so on.',
      'If the deed is silent: profits are shared equally; no interest on capital; no interest on drawings; no salary or commission to a partner.',
      'Interest on a partner’s loan to the firm: 6% a year (a charge against profit).',
      'Capital accounts and current accounts are kept; a partner’s loan is a liability, not capital.',
    ],
    mistakes: ['Giving interest on capital when the deed is silent.', 'Treating a partner’s loan as capital.', 'Sharing profit in capital ratio when the deed is silent.'],
    asked: 'One-mark and short answers on the features and default provisions; “in the absence of an agreement” questions.',
  }),
  G('XII.1.capital', {
    summary: 'Capital accounts of partners are kept in one of two ways: fixed or fluctuating. The choice decides where interest, salary, drawings and profit go.',
    mustKnow: [
      'Fixed capital: the capital account balance does not change except for additional capital or withdrawal of capital. Everything else is recorded in a current account.',
      'Fluctuating capital: the same account carries capital, interest, salary, drawings and profit, so the balance changes every year.',
      'Under fixed capital the current account may show a debit or a credit balance. Under fluctuating capital only the capital account is kept.',
      'Closing capital (fluctuating) = opening capital + interest on capital + salary + share of profit − drawings − interest on drawings.',
    ],
    mistakes: ['Posting profit to the capital account when the capital is fixed.', 'Not keeping a current account under fixed capital.'],
    asked: 'Prepare partners’ capital and current accounts under both methods; one-mark items on the difference.',
  }),
  G('XII.1.appropriation', {
    summary: 'The profit and loss appropriation account shows how the firm’s profit is divided among partners after interest, salary, commission and reserves.',
    mustKnow: [
      'Appropriation account is a continuation of the profit and loss account. Net profit comes in on the credit side.',
      'Debit side: interest on capital, partner’s salary or commission, transfer to reserve; credit side: interest on drawings.',
      'Interest on capital, salary and commission are charged to profit only if the deed allows them, and they are appropriations when profit is enough.',
      'What remains is divided in the profit-sharing ratio.',
    ],
    steps: ['Start with net profit.', 'Add interest on drawings.', 'Deduct interest on capital, salary, commission and transfers to reserve.', 'Divide the balance in the profit-sharing ratio.'],
    mistakes: [
      'Charging interest on capital when profit is insufficient and the deed does not say otherwise.',
      'Showing interest on drawings on the debit side.',
      'Dividing before deducting salary and interest.',
    ],
    asked: 'Prepare the appropriation account and the partners’ capital or current accounts.',
  }),
  G('XII.1.guarantee', {
    summary: 'A guarantee of profits promises a partner a minimum profit. If the real share is lower, someone must make up the deficiency.',
    mustKnow: [
      'The guarantee may be given by the firm (deficiency borne by all partners in their ratio) or by one or more partners (deficiency borne by them).',
      'When the guarantee is given to a new partner, the question tells you in which ratio the old partners bear it; if it is silent, follow the convention of your prescribed textbook.',
      'Compare the guaranteed amount with the share of profit and find the deficiency.',
      'The deficiency is shown in the appropriation account and then charged to the guarantors.',
    ],
    mistakes: ['Applying the deficiency to the wrong partners.', 'Forgetting that the guaranteed partner also keeps his own other entitlements.'],
    asked: 'Compute the deficiency and prepare the appropriation account after a guarantee.',
  }),
  G('XII.1.past-adjustments', {
    summary: 'Sometimes an error or an omission found after the accounts are closed has to be put right. You pass one adjustment entry for the difference, not for each item.',
    mustKnow: [
      'Past adjustments arise from interest on capital or drawings, salary or commission not given, or a wrong profit-sharing ratio in earlier years.',
      'Work out what each partner should have received and what each actually received. The difference is the adjustment.',
      'Pass the adjustment entry through the partners’ capital accounts; the firm’s total profit does not change.',
      'A short table of the effect per partner makes the entry safe.',
    ],
    steps: [
      'Prepare a table: what each partner got, what each should have got, difference.',
      'Partners with a net gain are debited, with a net loss credited.',
      'The totals of the differences must be equal.',
    ],
    mistakes: ['Passing separate entries without a net effect table.', 'Crediting a partner who has gained.'],
    asked: 'Pass the adjustment entry for past errors; prepare the table of net effects.',
  }),
  G('XII.1.goodwill', {
    summary: 'Goodwill is the extra value of a firm’s reputation and connection. Only three methods of valuation are in the syllabus: average profit, super profit and capitalisation.',
    mustKnow: [
      'Nature: an intangible, non-physical asset that is not saleable on its own. Factors include location, quality, management and competition.',
      'Average profit method: goodwill = average profit × number of years’ purchase.',
      'Super profit method: super profit = average profit − normal profit; goodwill = super profit × years’ purchase.',
      'Capitalisation method: capitalised value of average profit = average profit ÷ normal rate × 100; goodwill = capitalised value − capital employed (net assets).',
      'Normal profit = capital employed × normal rate of return.',
    ],
    formats: [
      'Goodwill (average profit) = Average profit × Years’ purchase',
      'Super profit = Average profit − Normal profit',
      'Goodwill (capitalisation) = Average profit ÷ Normal rate × 100 − Capital employed',
    ],
    steps: ['Adjust past profits for abnormal items before averaging.', 'Find the average profit.', 'Pick the method named in the question and apply it.'],
    mistakes: ['Not adjusting profits for abnormal losses and gains.', 'Using capital instead of capital employed.', 'Using a method that the question did not ask for.'],
    asked: 'Value goodwill by each of the three methods; entries are asked in the admission, retirement and death topics.',
    example: {
      q: 'Average profit is ₹60,000. Capital employed is ₹4,00,000 and the normal rate of return is 10%. Goodwill is valued at 3 years’ purchase of super profit. Find the goodwill by the super profit method, and by capitalisation of average profit.',
      a: 'Normal profit = 4,00,000 × 10% = ₹40,000. Super profit = 60,000 − 40,000 = ₹20,000. Goodwill = 20,000 × 3 = ₹60,000. Capitalisation: 60,000 ÷ 10% = 6,00,000; less capital employed 4,00,000 = ₹2,00,000.',
    },
  }),
  G('XII.1.ratio-change', {
    summary: 'When partners change their profit-sharing ratio, some gain and some sacrifice. Goodwill, reserves and revaluation must be settled between them.',
    mustKnow: [
      'Sacrificing ratio = old share − new share (for partners who give up). Gaining ratio = new share − old share (for partners who gain).',
      'The gaining partners compensate the sacrificing partners for goodwill, in the gaining ratio.',
      'Reserves and accumulated profits belong to all partners in the old ratio. They are shared out, or shown as they are if all partners agree.',
      'Revaluation of assets and liabilities: the profit or loss goes to all partners in the old ratio.',
      'Goodwill is not carried as an asset (AS 26 allows only purchased goodwill); it is adjusted through the partners’ capital accounts.',
    ],
    formats: ['Sacrificing ratio = Old ratio − New ratio', 'Gaining ratio = New ratio − Old ratio'],
    steps: [
      'Write old and new shares as fractions with the same denominator.',
      'Subtract to find who sacrifices and who gains.',
      'Value goodwill and credit the sacrificing partners, debit the gaining partners.',
      'Distribute reserves and revaluation in the old ratio.',
    ],
    mistakes: ['Using the new ratio for reserves.', 'Mixing up sacrifice and gain.', 'Forgetting that the sacrificing ratio can be different from the old ratio.'],
    asked: 'Find sacrificing and gaining ratios; pass the goodwill, reserve and revaluation entries on a change of ratio.',
    example: {
      q: 'A and B share profits 3:2. They change to 2:3. Who sacrifices and who gains, and by how much?',
      a: 'Old: A 3/5, B 2/5. New: A 2/5, B 3/5. A sacrifices 3/5 − 2/5 = 1/5; B gains 3/5 − 2/5 = 1/5.',
    },
  }),
  G('XII.1.admission', {
    summary: 'A new partner joins the firm. The old partners give up part of their share, and the firm has to deal with goodwill, revaluation, reserves and the new partner’s capital.',
    mustKnow: [
      'Admission needs a new profit-sharing ratio. The old partners’ sacrifice = old share − new share; the sacrificing ratio decides who is compensated for goodwill.',
      'The new partner pays a premium (goodwill) in cash; it is credited to the sacrificing partners’ capital accounts in the sacrificing ratio (AS 26: goodwill is not recorded as an asset unless purchased).',
      'Revaluation account: profit or loss is shared by the old partners in the old ratio. Reserves and accumulated profits are shared by the old partners in the old ratio.',
      'Capital of the new partner is given, or worked out from the firm’s total capital and his share; the old partners’ capitals can be adjusted to the new ratio with cash.',
      'If the new partner cannot bring his share of goodwill in cash, his current account is debited.',
    ],
    steps: [
      'Find the new ratio and the sacrificing ratio.',
      'Pass entries for goodwill, revaluation and reserves.',
      'Prepare the revaluation account and the partners’ capital accounts.',
      'Prepare the opening balance sheet of the new firm.',
    ],
    mistakes: [
      'Crediting goodwill to all old partners in the old ratio instead of the sacrificing ratio.',
      'Sharing revaluation in the new ratio.',
      'Forgetting to credit reserves to the old partners.',
    ],
    asked: 'Find the new and sacrificing ratio; pass the entries; prepare revaluation account, capital accounts and the balance sheet.',
    example: {
      q: 'A and B share profits 3:2. C is admitted for a 1/5 share. The rest is shared by A and B in the old ratio. Find the new ratio and the sacrificing ratio.',
      a: 'C gets 1/5; A and B share the remaining 4/5 in 3:2: A = 12/25, B = 8/25, C = 5/25. New ratio = 12 : 8 : 5. Sacrifice: A = 3/5 − 12/25 = 3/25; B = 2/5 − 8/25 = 2/25. Sacrificing ratio = 3 : 2.',
    },
  }),
  G('XII.1.retirement', {
    summary: 'A partner leaves and the remaining partners take over his share. The firm must settle what is due to him.',
    mustKnow: [
      'Gaining ratio = new share − old share of the continuing partners; they compensate the retiring partner for goodwill in this ratio.',
      'Revaluation profit or loss and reserves are shared by all partners (including the retiring one) in the old ratio.',
      'Amount due to the retiring partner = his capital + his share of reserves and profit + goodwill share ± revaluation − drawings − interest on drawings.',
      'It is paid in cash, in instalments with interest, or transferred to his loan account.',
      'The continuing partners’ capitals can be adjusted to the new ratio.',
    ],
    steps: [
      'Find the new ratio and the gaining ratio.',
      'Settle goodwill, reserves and revaluation.',
      'Find the total due to the retiring partner.',
      'Show the payment or the transfer to his loan account.',
    ],
    mistakes: ['Using the sacrificing ratio instead of the gaining ratio.', 'Forgetting the retiring partner’s share of reserves.', 'Not taking the retiring partner’s drawings into account.'],
    asked: 'Find the gaining ratio; pass the entries; prepare the retiring partner’s capital account and the balance sheet.',
    example: {
      q: 'A, B and C share profits 5:3:2. C retires and A and B continue in the ratio 3:2. Find the gaining ratio.',
      a: 'Old: A 5/10, B 3/10. New: A 3/5 = 6/10, B 2/5 = 4/10. A gains 6/10 − 5/10 = 1/10; B gains 4/10 − 3/10 = 1/10. Gaining ratio = 1 : 1.',
    },
  }),
  G('XII.1.death', {
    summary: 'On the death of a partner the firm settles with his legal representative. The share of profit up to the date of death has to be worked out.',
    mustKnow: [
      'The deceased partner’s share of profit up to the date of death is calculated on a time basis from the last accounts, or on a sales basis, as the question says.',
      'Goodwill, revaluation and reserves are settled as in retirement, with the deceased partner’s share going to his executor.',
      'The total due is shown in the executor’s account (or paid, or kept as a loan).',
      'Interest on the unpaid amount may be added as the question states.',
    ],
    steps: [
      'Find the share of profit or loss to the date of death.',
      'Settle goodwill, reserves and revaluation.',
      'Prepare the deceased partner’s capital account and transfer the balance to the executor’s account.',
    ],
    mistakes: ['Using the whole year’s profit for a part of a year.', 'Forgetting the interest on drawings up to the date of death.'],
    asked: 'Prepare the deceased partner’s capital account and executor’s account; find his share of profit to the date of death.',
  }),
  G('XII.1.dissolution', {
    summary:
      'When a firm is dissolved, its assets are sold and liabilities paid. The realisation account finds the profit or loss on doing so. Piecemeal distribution, sale to a company and insolvency of partners are outside the syllabus.',
    mustKnow: [
      'Realisation account: debit assets taken over (at book value) and expenses of realisation; credit the amounts realised from them.',
      'Liabilities are shown on the credit side at book value and debited with the amounts paid.',
      'Settlement order: outside liabilities, then partners’ loans, then partners’ capital.',
      'Profit or loss on realisation is shared by the partners in the profit-sharing ratio.',
      'Accumulated profits and reserves are transferred to the partners’ capital accounts.',
    ],
    steps: [
      'Transfer assets and liabilities (other than cash and capital) to the realisation account.',
      'Record the realisation and payments.',
      'Record the profit or loss on realisation.',
      'Close the partners’ capital accounts and the cash account.',
    ],
    mistakes: ['Transferring cash or capital to the realisation account.', 'Sharing realisation profit in the capital ratio.', 'Paying partners before outside liabilities.'],
    asked: 'Prepare the realisation account, partners’ capital accounts and the cash or bank account.',
  }),

  // ───────────────────────── Class XII · Unit 2 — Accounting for Companies ─────────────────────────
  G('XII.2.fundamentals', {
    summary: 'A company is a separate legal person whose capital is divided into shares. This topic gives the features, the kinds of company and the kinds of share capital.',
    mustKnow: [
      'Features: separate legal entity, perpetual succession, limited liability, transferability of shares, and the capacity to own property and to sue and be sued in its own name.',
      'Private company (restricted transfer, up to a limited number of members) and public company (shares can be freely transferred).',
      'Share capital: authorised, issued, subscribed and called-up and paid-up capital.',
      'Equity shares carry voting rights and a variable dividend; preference shares have a fixed dividend and a priority in repayment.',
    ],
    mistakes: ['Confusing authorised capital with issued capital.', 'Saying members of a company have unlimited liability.'],
    asked: 'One-mark and short questions on features, types of company and kinds of share capital.',
  }),
  G('XII.2.issue', {
    summary:
      'Shares are issued at par or at a premium and the money is collected in instalments. You must record each stage and deal with over-subscription. Interest on calls in arrears and in advance is outside the syllabus.',
    mustKnow: [
      'Stages: application, allotment, calls. Share capital is credited with the nominal value and securities premium with any premium, in the calls in which it is collected.',
      'Over-subscription: either reject some applications or allot pro rata. Excess application money is refunded or adjusted against allotment.',
      'Calls in arrears: money due but not received; shown as a deduction from called-up capital. Calls in advance are shown as a liability.',
      'Securities premium is a reserve that can be used only for the purposes the Companies Act allows.',
    ],
    steps: ['Find the money received on application and the money due on allotment.', 'Find any excess received and adjust it against allotment.', 'Pass entries for each call and any arrears.'],
    mistakes: [
      'Crediting the premium to the share capital account.',
      'Forgetting to adjust the excess application money against allotment.',
      'Calculating interest on calls in arrears (not required).',
    ],
    asked: 'Pass the journal entries and show the balance sheet extract for an issue of shares with over-subscription and calls in arrears.',
    example: {
      q: '15,000 shares are applied for and 10,000 are issued, allotting pro rata. How many shares are allotted for every 3 applied for, and how many applicants’ shares are rejected?',
      a: '10,000 ÷ 15,000 = 2/3, so 2 shares are allotted for every 3 applied for; the excess application money on the other 5,000 shares is adjusted or refunded.',
    },
  }),
  G('XII.2.forfeiture', {
    summary: 'When a shareholder fails to pay a call, the company can forfeit the shares. The forfeited shares may be issued again, and any gain is a capital reserve.',
    mustKnow: [
      'On forfeiture: debit share capital with the amount called up; credit share forfeiture account with the amount received; credit calls in arrears with the unpaid amount; and securities premium is debited if the premium was not received.',
      'Re-issue: debit bank with the money received, debit share forfeiture with the discount allowed, credit share capital with the paid-up value.',
      'The discount on re-issue cannot be more than the amount forfeited on those shares.',
      'The balance left in the share forfeiture account after re-issue is a capital profit and goes to the capital reserve.',
    ],
    steps: ['Pass the forfeiture entry for the number of shares forfeited.', 'Pass the re-issue entry.', 'Transfer the balance in the forfeiture account on those shares to capital reserve.'],
    mistakes: [
      'Debiting share capital with the nominal value instead of the called-up value.',
      'Transferring the whole forfeiture balance to capital reserve when some shares are still not re-issued.',
    ],
    asked: 'Pass entries for forfeiture and re-issue, and find the capital reserve.',
    example: {
      q: '100 shares of ₹10 each, ₹8 called, issued at par, are forfeited; the holder had paid ₹5 a share. They are re-issued at ₹9 each as fully paid. Find the amount in the share forfeiture account, the discount on re-issue, and the capital reserve.',
      a: 'Forfeiture: share capital Dr 800 (100 × 8); share forfeiture Cr 500 (100 × 5); calls in arrears Cr 300. Re-issue: bank Dr 900; share forfeiture Dr 100 (discount ₹1 × 100); share capital Cr 1,000. Capital reserve = 500 − 100 = ₹400.',
    },
  }),
  G('XII.2.concepts', {
    summary: 'Some ways of issuing or rewarding with shares go beyond the usual public issue. Know what each is and how it is recorded.',
    mustKnow: [
      'Private placement: the company offers shares to a selected group, not to the public.',
      'ESOP: employees get the right to buy shares at a fixed price. Sweat equity: shares issued to directors or employees at a discount or for know-how or value addition.',
      'Shares issued for consideration other than cash: debit the asset or the vendor, credit share capital (and securities premium if issued at a premium).',
      'Purchase consideration is paid in shares only where the question states so.',
    ],
    mistakes: ['Recording a non-cash issue in cash.', 'Forgetting securities premium when the shares are issued above par.'],
    asked: 'One-mark and short items defining the terms; entries for shares issued to a vendor.',
  }),
  G('XII.2.disclosure', {
    summary: 'The share capital note in the company’s balance sheet follows a fixed format (Schedule III). You must show authorised, issued, subscribed and paid-up capital correctly.',
    mustKnow: [
      'Show authorised capital, issued capital, subscribed capital (fully paid and not fully paid), and the amounts of calls in arrears.',
      'Subscribed but not fully paid capital: show called-up amount, deduct calls in arrears, add the forfeited shares amount.',
      'Securities premium and capital reserve appear under reserves and surplus, not in share capital.',
      'The notes give the number and value of the shares of each class.',
    ],
    mistakes: ['Putting securities premium in the share capital note.', 'Forgetting to deduct calls in arrears.'],
    asked: 'Prepare the note on share capital and show the share capital in the balance sheet for given data.',
  }),
  G('XII.2.debentures', {
    summary:
      'A debenture is a loan to the company. The syllabus covers issue at par, premium and discount, with terms of redemption, collateral security and interest. Redemption accounting is not prescribed and tax deducted at source is excluded.',
    mustKnow: [
      'A debenture is an acknowledgement of a debt; the holder is a creditor, and interest is a charge against profit.',
      'Issue at par, at a premium (securities premium) or at a discount (discount on issue of debentures, a loss written off).',
      'Issue with terms of redemption: the issue may be at par and redeemable at a premium; the premium on redemption is a loss to be provided for.',
      'Collateral security: debentures given as additional security to a lender. If the loan is repaid, the debentures are returned; no entry is needed unless the question says so.',
      'Interest on debentures is paid at a fixed rate on the face value.',
    ],
    mistakes: ['Treating a debenture issue like a share issue (there is no capital).', 'Recording an entry for collateral debentures that the question does not ask for.'],
    asked: 'Pass the entries on issue at par, premium and discount, with terms of redemption; collateral security entries; interest on debentures.',
  }),

  // ───────────────────────── Class XII · Unit 3 — Analysis of Financial Statements (Option I) ─────────────────────────
  G('XII.3.statements', {
    summary: 'Company financial statements are prepared in the format of Schedule III of the Companies Act. Exceptional and extraordinary items and discontinued operations are outside the syllabus.',
    mustKnow: [
      'The balance sheet shows equity and liabilities (shareholders’ funds, non-current and current liabilities) and assets (non-current and current).',
      'The statement of profit and loss shows revenue from operations, other income, expenses and tax.',
      'Know each major head and what goes under it. Current items are those due or realisable within twelve months.',
      'Financial statements are analysed by comparative and common-size statements and by ratios.',
    ],
    mistakes: ['Classifying a current item as non-current.', 'Mixing up the main heads and the sub-heads.'],
    asked: 'Show where an item appears in the Schedule III balance sheet or statement of profit and loss; short items on the purpose of analysis.',
  }),
  G('XII.3.comparative', {
    summary: 'A comparative statement puts two or more years side by side to show the change in each item in amount and percentage.',
    mustKnow: [
      'Absolute change = current year − previous year. Percentage change = absolute change ÷ previous year × 100.',
      'When the previous year’s figure is zero or negative, the percentage is not meaningful.',
      'The same format is used for the statement of profit and loss and for the balance sheet.',
      'It shows trends and the direction of growth.',
    ],
    formats: ['% change = (Current − Previous) ÷ Previous × 100'],
    mistakes: ['Dividing by the current year’s figure.', 'Reporting a percentage when the base is zero.'],
    asked: 'Prepare a comparative statement from two years’ figures and comment on the changes.',
  }),
  G('XII.3.common-size', {
    summary: 'In a common-size statement every item is shown as a percentage of one base, so that years and firms of different sizes can be compared.',
    mustKnow: [
      'In the statement of profit and loss the base is revenue from operations (taken as 100).',
      'In the balance sheet the base is the total of assets (or of equity and liabilities).',
      'Every item = item ÷ base × 100.',
      'It helps in comparing the firm with other firms and with its own earlier years.',
    ],
    formats: ['Common-size % = Item ÷ Base × 100'],
    mistakes: ['Using the wrong base.', 'Taking the percentage of a sub-total instead of the base.'],
    asked: 'Prepare a common-size statement and comment on the structure.',
  }),
  G('XII.3.liquidity', {
    summary: 'Liquidity ratios show the ability to pay short-term debts. The syllabus asks for the current ratio and the quick ratio.',
    mustKnow: [
      'Current ratio = current assets ÷ current liabilities. A ratio of about 2 : 1 is usually regarded as comfortable.',
      'Quick ratio = quick assets ÷ current liabilities, where quick assets = current assets − inventory − prepaid expenses.',
      'A high current ratio is not always good: it may mean idle stock or cash.',
      'Say what a change in the ratio shows, not only the number.',
    ],
    formats: ['Current ratio = Current assets ÷ Current liabilities', 'Quick ratio = (Current assets − Inventory − Prepaid expenses) ÷ Current liabilities'],
    steps: ['Pick current assets and current liabilities from the balance sheet.', 'Deduct inventory and prepaid expenses for the quick ratio.', 'Divide and state the answer as a ratio.'],
    mistakes: ['Not deducting prepaid expenses for quick assets.', 'Including non-current items.'],
    asked: 'Calculate both ratios and say what they show; find the effect of a transaction on a ratio.',
    example: {
      q: 'Current assets are ₹3,00,000, of which inventory is ₹60,000 and prepaid expenses ₹10,000. Current liabilities are ₹1,50,000. Find the current ratio and the quick ratio.',
      a: 'Current ratio = 3,00,000 ÷ 1,50,000 = 2 : 1. Quick assets = 3,00,000 − 60,000 − 10,000 = 2,30,000; quick ratio = 2,30,000 ÷ 1,50,000 = 1.53 : 1.',
    },
  }),
  G('XII.3.solvency', {
    summary: 'Solvency ratios show the ability to meet long-term obligations: how much of the business is financed by debt and whether interest can be paid.',
    mustKnow: [
      'Debt-equity ratio = long-term debt ÷ shareholders’ funds. Total assets to debt ratio = total assets ÷ long-term debt.',
      'Proprietary ratio = shareholders’ funds ÷ total assets. Debt to capital employed ratio = long-term debt ÷ capital employed.',
      'Interest coverage ratio = profit before interest and tax ÷ interest on long-term borrowings; it shows how many times interest is covered.',
      'Capital employed = shareholders’ funds + non-current liabilities (equivalently, total assets − current liabilities).',
    ],
    formats: ['Debt-equity = Long-term debt ÷ Shareholders’ funds', 'Interest coverage = Profit before interest and tax ÷ Interest on long-term borrowings'],
    mistakes: ['Using total liabilities as debt.', 'Using profit after interest in the interest coverage ratio.'],
    asked: 'Calculate the ratios from the balance sheet and statement of profit and loss; comment on solvency.',
  }),
  G('XII.3.activity', {
    summary: 'Activity (turnover) ratios show how well the firm uses its assets: how many times they are turned into sales in a year.',
    mustKnow: [
      'Inventory turnover = cost of revenue from operations ÷ average inventory; average inventory = (opening + closing) ÷ 2.',
      'Trade receivables turnover = net credit revenue from operations ÷ average trade receivables. Trade payables turnover = net credit purchases ÷ average trade payables.',
      'Net fixed assets turnover = revenue from operations ÷ net fixed assets. Net assets (capital employed) turnover = revenue from operations ÷ net assets. Working capital turnover = revenue from operations ÷ working capital.',
      'Cost of revenue from operations = opening inventory + purchases + direct expenses − closing inventory.',
    ],
    formats: ['Inventory turnover = Cost of revenue from operations ÷ Average inventory', 'Receivables turnover = Net credit revenue from operations ÷ Average trade receivables'],
    mistakes: ['Using sales instead of cost of revenue for inventory turnover.', 'Using closing balances when averages are needed.'],
    asked: 'Calculate turnover ratios, including the cost of revenue from operations as a first step; comment on efficiency.',
    example: {
      q: 'Cost of revenue from operations is ₹6,00,000; opening inventory ₹90,000; closing inventory ₹1,10,000. Find the inventory turnover.',
      a: 'Average inventory = (90,000 + 1,10,000) ÷ 2 = ₹1,00,000. Inventory turnover = 6,00,000 ÷ 1,00,000 = 6 times.',
    },
  }),
  G('XII.3.profitability', {
    summary: 'Profitability ratios show how much profit the firm earns in relation to sales and to the capital employed.',
    mustKnow: [
      'Gross profit ratio = gross profit ÷ revenue from operations × 100. Operating ratio = (cost of revenue from operations + operating expenses) ÷ revenue × 100.',
      'Operating profit ratio = operating profit ÷ revenue from operations × 100.',
      'Net profit ratio = net profit ÷ revenue from operations × 100, on the profit before tax or after tax as the question asks.',
      'Return on investment = profit before interest, tax and preference dividend ÷ capital employed × 100.',
    ],
    formats: ['Gross profit ratio = Gross profit ÷ Revenue from operations × 100', 'ROI = Profit before interest, tax and preference dividend ÷ Capital employed × 100'],
    mistakes: ['Using net sales instead of revenue from operations when the question says revenue.', 'Using the wrong profit for the net profit ratio (before or after tax).'],
    asked: 'Calculate the ratios from the statement of profit and loss; compare two years.',
  }),

  // ───────────────────────── Class XII · Unit 4 — Cash Flow Statement (Option I) ─────────────────────────
  G('XII.4.classification', {
    summary: 'The cash flow statement shows the inflows and outflows of cash and cash equivalents in a year, classified by activity.',
    mustKnow: [
      'Cash equivalents: short-term, highly liquid investments easily converted into cash (for example, treasury bills, commercial paper, money market funds).',
      'Operating activities: the main revenue-producing activities. Investing activities: buying and selling of non-current assets and investments. Financing activities: raising and repaying capital and borrowings.',
      'Interest and dividends paid are financing items; interest and dividend received are investing items (as the syllabus prescribes for non-financial companies).',
      'Transactions between cash and cash equivalents are not cash flows.',
    ],
    mistakes: ['Putting purchase of a machine under operating activities.', 'Treating a movement from cash to a bank deposit as a cash flow.'],
    asked: 'Classify an item as operating, investing or financing, or as not a cash flow; define cash equivalents.',
  }),
  G('XII.4.preparation', {
    summary: 'The statement is prepared by the indirect method only: start from the net profit and adjust for non-cash and non-operating items and for changes in working capital.',
    mustKnow: [
      'Start from net profit before tax and extraordinary items. Add back non-cash expenses (depreciation) and non-operating expenses (interest, loss on sale); deduct non-operating incomes.',
      'The result is operating profit before working capital changes. Then adjust for changes in current assets and current liabilities.',
      'Cash generated from operations less income tax paid is the net cash from operating activities.',
      'Investing: purchase and sale of fixed assets and investments, interest and dividend received. Financing: share capital, borrowings, interest and dividend paid.',
      'Finally: net increase or decrease in cash and cash equivalents + opening balance = closing balance; the closing balance must agree with the balance sheet.',
    ],
    steps: [
      'Find the net profit before tax and add back depreciation, interest paid and loss on sale.',
      'Adjust for the changes in current assets and current liabilities.',
      'Deduct tax paid.',
      'Prepare the investing and financing sections.',
      'Check the closing cash against the balance sheet.',
    ],
    mistakes: ['Adding an increase in a current asset instead of deducting it.', 'Forgetting to add back depreciation.', 'Not checking the closing balance.'],
    asked: 'Prepare a cash flow statement from two balance sheets and additional information, in the indirect method.',
  }),

  // ───────────────────────── Class XII · Part B Option II — Computerised Accounting ─────────────────────────
  G('XII.C.cas', {
    summary: 'A computerised accounting system (CAS) does the recording, classifying and reporting in software. This topic gives its features and structure.',
    mustKnow: [
      'Features: speed and accuracy, up-to-date information, automatic posting, security and audit trails.',
      'Structure: the modules (accounting, inventory, payroll and so on) share one database; accounts are organised into groups and ledgers.',
      'Types of accounting software: readymade, customised and tailored.',
      'Advantages: reduced errors and effort; limitations: cost, security risks and the need for training.',
    ],
    mistakes: ['Listing advantages without saying what the software does for each.', 'Forgetting the limitations.'],
    asked: 'One-mark and short answers on features, structure, advantages and limitations.',
  }),
  G('XII.C.spreadsheet', {
    summary: 'The electronic spreadsheet is used to set up accounting statements with formulas. The syllabus lists bank reconciliation, asset accounting, loan schedule and ratio analysis.',
    mustKnow: [
      'A worksheet is a grid of rows and columns; a cell holds a value or a formula. Formulas begin with an equals sign and refer to other cells.',
      'Use relative and absolute references correctly (the dollar sign locks a reference).',
      'The same layout can be reused for bank reconciliation, depreciation of assets, a loan repayment schedule and ratio analysis.',
      'Charts and data validation help to present and check results.',
    ],
    mistakes: ['Typing values instead of formulas.', 'Copying a formula without locking the cell that must not move.'],
    asked: 'Write the formula for a figure; describe how a sheet would be set up for a given task.',
  }),
  G('XII.C.using', {
    summary: 'Using a CAS means setting it up, entering data and keeping it secure. This topic covers codification, data entry, adjusting and closing entries and security.',
    mustKnow: [
      'Codification: each account gets a unique code, grouped by head, so entries are fast and consistent.',
      'Data entry in the form of vouchers; the system posts to the ledger automatically. A checker verifies vouchers before they are posted.',
      'Adjusting and closing entries are made at the end of the year; the system then opens the next year with the closing balances.',
      'Security: user roles and passwords, access rights, backups.',
    ],
    mistakes: ['Skipping verification before posting.', 'Not taking backups.'],
    asked: 'Short answers on codification, data entry and security; entries for adjustments in a CAS.',
  }),
  G('XII.P.project', {
    summary: 'Project work carries marks of its own. Option I students do a project on the analysis of a company (any two aspects); Option II students prepare a practical file and face a viva.',
    mustKnow: [
      'Follow the choice of aspects in the official syllabus and your school’s instructions.',
      'Use real, public financial statements where permitted, and show your calculations and your reading of them.',
      'Be ready to explain every figure and conclusion in the viva.',
    ],
    steps: [
      'Choose the company or the practical tasks with your teacher.',
      'Collect the statements.',
      'Do the analysis or the practical work.',
      'Write your conclusions in your own words.',
      'Prepare for the viva questions.',
    ],
    mistakes: ['Copying a published analysis.', 'Giving figures without a conclusion.'],
    asked: 'Assessed by your school (file and viva); this app’s Project Assistant helps you plan and tick off the stages.',
  }),
]);

/** The guides, with the worked examples from study-examples.ts added to the topics that have none inline (an inline example always wins). */
export const STUDY: Readonly<Record<string, StudyGuide>> = Object.fromEntries(
  Object.entries(BASE_STUDY).map(([id, g]) => [id, { ...g, ...(g.example || !MORE_EXAMPLES[id] ? {} : { example: MORE_EXAMPLES[id] }), ...(MORE[id] ? { extra: MORE[id] } : {}) }]),
);

export const studyOf = (clause: string): StudyGuide | undefined => STUDY[clause];
