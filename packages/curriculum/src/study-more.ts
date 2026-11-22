/**
 * "Also in the official syllabus": points the CBSE 2026-27 syllabus lists for a topic that the short revision notes in study.ts did not cover.
 * Found by checking every sub-topic of docs/CBSE_2026_27_SYLLABUS_MATRIX.md against the notes (test/study-coverage.test.ts keeps that check).
 * Original wording written for this app; it respects every official limit. Not yet reviewed by a subject teacher (D11).
 */
export const MORE: Readonly<Record<string, readonly string[]>> = {
  'XI.1.intro': [
    'Source of information: the accounting records of a business are the main source of its financial information.',
    'Types of information: financial information can be stated in money (profit, assets, debts); non-financial information cannot (quality of management, customer satisfaction). Accounting deals mainly with financial information.',
    'Advantages: systematic records; profit or loss and financial position can be found; decisions, tax returns and loans are supported; the records are evidence in a dispute.',
    'Limitations: only facts that can be measured in money are recorded; assets are shown at historical cost, not at today’s value; some figures depend on estimates and personal judgement (for example depreciation); statements can be window-dressed.',
    'Role in business: it tells the owner how the business is doing, helps to control waste, gives lenders and the government the information they need, and helps in planning.',
  ],
  'XI.1.terms': [
    'Business transaction: an exchange of money or money’s worth between the business and another party that can be measured in money, such as a sale, a purchase or a payment. Entity: the business treated as separate from its owner.',
    'Non-current (fixed) assets stay in the business for more than a year (machinery, building); current assets are cash and items expected to turn into cash within a year (stock, debtors). Non-current liabilities fall due after a year (a long-term loan); current liabilities within a year (creditors, outstanding expenses).',
    'Income is what the business earns (revenue and other receipts); profit is the excess of revenue over expenses; a gain is an incidental increase in value (profit on sale of an old machine); a loss is an excess of expenses over revenue or a fall in value (loss by fire).',
    'Goods are the things bought for resale (or raw materials to make them). Stock is the goods unsold on a date: opening stock at the start of the year and closing stock at the end.',
    'Voucher: the written proof of a transaction on which the entry is based, such as a receipt or a payment voucher.',
  ],
  'XI.1.basis': [
    'System of accounting: in the double-entry system both effects of every transaction are recorded, which gives a complete record. In the single-entry system only some records are kept, mostly cash and personal accounts, as small traders often do; it is incomplete.',
  ],
  'XI.2.brs': [
    'Need: the bank column of the cash book and the passbook should show the same balance. The statement finds why they differ (timing, items not yet recorded, mistakes), helps to detect errors and fraud, and shows the true bank balance.',
  ],
  'XI.2.depreciation': [
    'Features: it is a non-cash charge; it is the gradual fall in the book value of a fixed asset; it is charged every year, whether or not there is a profit; land is not depreciated.',
    'Need: to show the true profit (using the asset is a cost of earning revenue), to show the asset at a fair book value, and to hold back profit so that the asset can be replaced.',
    'Causes: wear and tear from use, passage of time and obsolescence from new inventions, expiry of the legal life of a lease or patent, accident, and exhaustion of natural resources.',
    'Factors that fix the amount: the cost of the asset, its estimated useful life, its estimated scrap (residual) value, and the method chosen.',
    'Depletion is writing off the cost of natural resources (mines, quarries, oil wells) as they are used up. Amortisation is writing off the cost of an intangible asset (patent, copyright, goodwill) over its useful life. Depreciation proper is for tangible assets.',
    'SLM and WDV compared: SLM charges the same amount every year and takes the book value down to scrap value; it is simple to work out. WDV charges a fixed percentage on a falling book value, so the charge falls every year and the book value never reaches zero. WDV’s advantage is that the charge is heavier in the early years, when repairs are light, so depreciation plus repairs stays more even over the life.',
  ],
  'XI.2.provisions': [
    'Types of reserve: a general reserve is kept for no particular purpose; a specific reserve is kept for a stated purpose (for example to equalise dividends). A secret reserve is not shown in the balance sheet (assets are undervalued or liabilities overvalued); it hides the true position and is not a good practice for most businesses.',
  ],
  'XI.2.tb': [
    'Objectives: to check the arithmetical accuracy of the ledger, to help in locating errors, and to supply the closing balances from which the final accounts are prepared. The syllabus uses the balance method only: every account is listed by its closing balance.',
  ],
  'XI.3.concepts': [
    'Meaning and objectives: financial statements are the trading and profit and loss account and the balance sheet. They show the profit or loss for the period and the financial position on its last day.',
    'Importance: owners, managers, lenders, tax authorities and others rely on them for decisions, so they must be prepared on a consistent basis from the books.',
  ],
  'XI.3.adjustments': [
    'Provision for discount on debtors: a percentage of the good debtors (after bad debts and the provision for doubtful debts have been deducted) is set aside for the cash discount likely to be allowed to them. It is a charge to the profit and loss account and a deduction from debtors.',
    'Goods given to staff as a welfare measure (or as free samples) are deducted from purchases and charged as staff welfare (or advertisement) expense. Goods taken by the owner for personal use go to drawings.',
  ],
  'XI.3.incomplete': [
    'Features: the double-entry system is not followed; mainly cash and personal accounts are kept, and some records are partial or missing; the form of records differs from one trader to another.',
    'Reasons: small size of business, the cost of a trained accountant, and lack of time or knowledge of the owner.',
    'Limitations: the true profit and financial position cannot be known with certainty; a trial balance cannot be made; errors and fraud are not easily detected; tax authorities may not accept the records; loans are harder to get.',
  ],
  'XI.P.project': [
    'The three options: (1) source documents and vouchers; (2) a bank reconciliation statement from a cash book and a passbook with 20–25 transactions; (3) a comprehensive sole-proprietorship project from journal to final accounts. Pie or bar charts may be used to show the results, and simple GST may be included.',
  ],
  'XII.1.goodwill': [
    'Need: goodwill has to be valued when the profit-sharing ratio changes, when a partner is admitted, retires or dies, and when the firm is sold as a going concern.',
    'Goodwill is adjusted through the partners’ capital (or current) accounts; it is not recorded as an asset unless it is purchased (AS 26).',
  ],
  'XII.1.ratio-change': [
    'After the change, the balance sheet carries the revalued assets and liabilities, the reserves are shown as distributed (or as they were, if all partners agree), and the partners’ capital accounts include the effect of goodwill and revaluation.',
  ],
  'XII.1.dissolution': [
    'Meaning and types: dissolution of the firm means the partnership between all the partners ends and the business closes (dissolution of the partnership alone, as on admission or retirement, only changes the partners’ relationship). A firm is dissolved by agreement, compulsorily (for example when the business becomes unlawful), on the happening of a stated event (such as expiry of its term), by notice in a partnership at will, or by the court.',
    'Unrealised assets: where a question says an asset is not realised, the official convention is to take a tangible asset at its book value, and an intangible asset (such as goodwill) at nil.',
    'If a partner bears the realisation expenses, the question states what he is paid for doing so. That payment is debited to the realisation account and credited to his capital account; the expenses themselves are not entered in the firm’s books.',
  ],
  'XII.2.issue': [
    'Equity and preference shares are issued in the same way; the entries differ only in naming Equity Share Capital or Preference Share Capital.',
    'Under-subscription: when fewer shares are applied for than offered, the company allots the shares applied for. The issue is regarded as successful only if the minimum subscription stated in the offer is received.',
    'Shares issued for a consideration other than cash (for example to a vendor for machinery): debit the asset (or the vendor), credit share capital and securities premium; no bank entry is made.',
  ],
  'XII.2.debentures': [
    'Types of debentures: secured and unsecured; redeemable and irredeemable; convertible and non-convertible; registered and bearer.',
    'Debentures issued for a consideration other than cash (for example to a vendor for an asset): debit the asset (or the vendor) and credit Debentures, with securities premium credited (or discount on issue debited) if issued at a premium (or discount).',
    'Discount or loss on issue of debentures is written off in the year of allotment: first against the securities premium reserve, if there is one, and the balance to the statement of profit and loss as a finance cost (AS 16).',
  ],
  'XII.4.classification': [
    'Objectives and benefits: the statement shows where cash came from and where it went, helps to judge the firm’s ability to generate cash, to pay its debts and to pay dividends, explains why profit and cash differ, and helps in planning future cash needs.',
  ],
  'XII.4.preparation': [
    'A bank overdraft and a cash credit are short-term borrowings (a financing item), not cash equivalents, unless the question says otherwise.',
    'Current investments are taken as marketable securities (an investing item), not as cash equivalents, unless the question says they are.',
    'A dividend proposed in the previous year and paid this year is a financing outflow of this year. The dividend proposed for this year is not accounted for until it is declared, so it is not a cash flow of this year; an interim dividend paid is.',
  ],
  'XII.C.using': [
    'Installation and set-up: the software is installed and the company is created with its details; the chart of accounts (groups and heads) is then set up before any entry is made.',
    'After the adjusting and closing entries the system prepares the profit and loss account and the balance sheet, and carries the closing balances to the next year as opening entries.',
  ],
  'XII.P.project': ['Aspects to choose from: comparative and common-size statements, ratio analysis, segment reports and cash flow analysis; the file needs any two of them.'],
};
