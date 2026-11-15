/**
 * CBSE 2026-27 Accountancy (055) LEARNING OUTCOMES — transcribed VERBATIM from the "Learning Outcomes" column of the official PDF
 * (SHA-256 in syllabus.ts SOURCE). The PDF states outcomes per UNIT; the outcome → topic (clause) mapping below is a judgement made
 * for traceability and is PENDING academic review (handoff D11). Text was cleaned only of characters that bled in from the PDF's
 * left column; every such fix was checked against the PDF's non-layout text. PDF typos are kept and noted.
 * Not in the PDF: no outcome block for Computerised Accounting (Option II) or for the projects, and none naming Incomplete Records.
 */
import { SOURCE } from './syllabus';
export interface Outcome { readonly id: string; readonly unit: string; readonly pdfHeading: string; readonly text: string; readonly clauses: readonly string[]; readonly note?: string; readonly source: string }
const o = (id: string, unit: string, pdfHeading: string, text: string, clauses: string[], note?: string): Outcome => ({ id, unit, pdfHeading, text, clauses, ...(note ? { note } : {}), source: SOURCE.sha256 });
export const OUTCOME_MAPPING_STATUS = 'pending academic review (D11)' as const;
/** Topics the PDF lists but for which it states no learning outcome. */
export const CLAUSES_WITHOUT_OFFICIAL_OUTCOME = ['XI.3.incomplete'] as const;
/** Outcomes per unit as printed in the PDF (fixture for the transcription test). */
export const OUTCOMES_PER_UNIT: Readonly<Record<string, number>> = { 'XI.1': 13, 'XI.2': 18, 'XI.3': 7, 'XII.1': 18, 'XII.2': 10, 'XII.3': 9, 'XII.4': 2 };
export const OUTCOMES: readonly Outcome[] = [
  o('LO-XI.1-01', 'XI.1', "Unit-1: Theoretical Frame Work", "describe the meaning, significance, objectives, advantages and limitations of accounting in the modem economic environment with varied types of business and non-business economic entities.", ["XI.1.intro"], "\u201cmodem\u201d is printed in the PDF (read: modern)."),
  o('LO-XI.1-02', 'XI.1', "Unit-1: Theoretical Frame Work", "identify / recognise the individual(s) and entities that use accounting information for serving their needs of decision making.", ["XI.1.intro"]),
  o('LO-XI.1-03', 'XI.1', "Unit-1: Theoretical Frame Work", "explain the various terms used in accounting and differentiate between different related terms like current and non-current, capital and revenue.", ["XI.1.terms"]),
  o('LO-XI.1-04', 'XI.1', "Unit-1: Theoretical Frame Work", "give examples of terms like business transaction, liabilities, assets, expenditure and purchases.", ["XI.1.terms"]),
  o('LO-XI.1-05', 'XI.1', "Unit-1: Theoretical Frame Work", "explain that sales/purchases include both cash and credit sales/purchases relating to the accounting year.", ["XI.1.terms"]),
  o('LO-XI.1-06', 'XI.1', "Unit-1: Theoretical Frame Work", "differentiate among income, profits and gains.", ["XI.1.terms"]),
  o('LO-XI.1-07', 'XI.1', "Unit-1: Theoretical Frame Work", "state the meaning of fundamental accounting assumptions and their relevance in accounting.", ["XI.1.concepts"]),
  o('LO-XI.1-08', 'XI.1', "Unit-1: Theoretical Frame Work", "describe the meaning of accounting assumptions and the situation in which an assumption is applied during the accounting process.", ["XI.1.concepts"]),
  o('LO-XI.1-09', 'XI.1', "Unit-1: Theoretical Frame Work", "explain the meaning, applicability, objectives, advantages and limitations of accounting standards.", ["XI.1.standards"]),
  o('LO-XI.1-10', 'XI.1', "Unit-1: Theoretical Frame Work", "appreciate that various accounting standards developed nationally and globally are in practice for bringing parity in the accounting treatment of different items.", ["XI.1.standards"]),
  o('LO-XI.1-11', 'XI.1', "Unit-1: Theoretical Frame Work", "acknowledge the fact that recording of accounting transactions follows double entry system.", ["XI.1.concepts"]),
  o('LO-XI.1-12', 'XI.1', "Unit-1: Theoretical Frame Work", "explain the bases of recording accounting transaction and to appreciate that accrual basis is a better basis for depicting the correct financial position of an enterprise.", ["XI.1.basis"]),
  o('LO-XI.1-13', 'XI.1', "Unit-1: Theoretical Frame Work", "Explain the meaning, advantages and characteristic of GST.", ["XI.1.gst"]),
  o('LO-XI.2-01', 'XI.2', "Unit-2: Accounting Process", "explain the concept of accounting equation and appreciate that every transaction affects either both the sides of the equation or a positive effect on one item and a negative effect on another item on the same side of accounting equation.", ["XI.2.equation"]),
  o('LO-XI.2-02', 'XI.2', "Unit-2: Accounting Process", "explain the effect of a transaction (increase or decrease) on the assets, liabilities, capital, revenue and expenses.", ["XI.2.equation", "XI.2.rules"]),
  o('LO-XI.2-03', 'XI.2', "Unit-2: Accounting Process", "appreciate that on the basis of source documents, accounting vouchers are prepared for recording transaction in the books of accounts.", ["XI.2.vouchers"]),
  o('LO-XI.2-04', 'XI.2', "Unit-2: Accounting Process", "develop the understanding of recording of transactions in journal and the skill of calculating GST.", ["XI.2.journal", "XI.2.subsidiary"]),
  o('LO-XI.2-05', 'XI.2', "Unit-2: Accounting Process", "explain the purpose of maintaining a Cash Book and develop the skill of preparing the format of different types of cash books and the method of recording cash transactions in Cash book.", ["XI.2.cashbook"]),
  o('LO-XI.2-06', 'XI.2', "Unit-2: Accounting Process", "describe the method of recording transactions other than cash transactions as per their nature in different subsidiary books .", ["XI.2.subsidiary"]),
  o('LO-XI.2-07', 'XI.2', "Unit-2: Accounting Process", "appreciate that at times bank balance as indicated by cash book is different from the bank balance as shown by the pass book / bank statement and to reconcile both the balances, bank reconciliation statement is prepared.", ["XI.2.brs"]),
  o('LO-XI.2-08', 'XI.2', "Unit-2: Accounting Process", "develop understanding of preparing bank reconciliation statement.", ["XI.2.brs"]),
  o('LO-XI.2-09', 'XI.2', "Unit-2: Accounting Process", "appreciate that for ascertaining the position of individual accounts, transactions are posted from subsidiary books and journal proper into the concerned accounts in the ledger and develop the skill of ledger posting.", ["XI.2.ledger"]),
  o('LO-XI.2-10', 'XI.2', "Unit-2: Accounting Process", "explain the necessity of providing depreciation and develop the skill of using different methods for computing depreciation.", ["XI.2.depreciation"]),
  o('LO-XI.2-11', 'XI.2', "Unit-2: Accounting Process", "understand the accounting treatment of providing depreciation directly to the concerned asset account or by creating provision for depreciation account.", ["XI.2.depreciation"]),
  o('LO-XI.2-12', 'XI.2', "Unit-2: Accounting Process", "appreciate the method of asset disposal through the concerned asset account or by preparing asset disposal account.", ["XI.2.depreciation"]),
  o('LO-XI.2-13', 'XI.2', "Unit-2: Accounting Process", "appreciate the need for creating reserves and also making provisions for events which may belong to the current year but may happen in next year.", ["XI.2.provisions"]),
  o('LO-XI.2-14', 'XI.2', "Unit-2: Accounting Process", "appreciate the difference between reserve and reserve fund.", ["XI.2.provisions"]),
  o('LO-XI.2-15', 'XI.2', "Unit-2: Accounting Process", "state the need and objectives of preparing trial balance and develop the skill of preparing trial balance.", ["XI.2.tb"]),
  o('LO-XI.2-16', 'XI.2', "Unit-2: Accounting Process", "appreciate that errors may be committed during the process of accounting.", ["XI.2.errors"]),
  o('LO-XI.2-17', 'XI.2', "Unit-2: Accounting Process", "understand the meaning of different types of errors and their effect on trial balance.", ["XI.2.errors"]),
  o('LO-XI.2-18', 'XI.2', "Unit-2: Accounting Process", "develop the skill of identification and location of errors and their rectification and preparation of suspense account.", ["XI.2.errors"]),
  o('LO-XI.3-01', 'XI.3', "Unit 3: Financial Statements of Sole Proprietorship", "state the meaning of financial statements the purpose of preparing financial statements.", ["XI.3.concepts"], "Printed as one sentence (no \u201cand\u201d) in the PDF."),
  o('LO-XI.3-02', 'XI.3', "Unit 3: Financial Statements of Sole Proprietorship", "state the meaning of gross profit, operating profit and net profit and develop the skill of preparing trading and profit and loss account.", ["XI.3.trading-pl"]),
  o('LO-XI.3-03', 'XI.3', "Unit 3: Financial Statements of Sole Proprietorship", "explain the need for preparing balance sheet.", ["XI.3.balance-sheet"]),
  o('LO-XI.3-04', 'XI.3', "Unit 3: Financial Statements of Sole Proprietorship", "understand the technique of grouping and marshalling of assets and liabilities.", ["XI.3.balance-sheet"]),
  o('LO-XI.3-05', 'XI.3', "Unit 3: Financial Statements of Sole Proprietorship", "appreciate that there may be certain items other than those shown in trial balance which may need adjustments while preparing financial statements.", ["XI.3.adjustments"]),
  o('LO-XI.3-06', 'XI.3', "Unit 3: Financial Statements of Sole Proprietorship", "develop the understanding and skill to do adjustments for items and their presentation in financial statements like depreciation, closing stock, provisions, abnormal loss etc.", ["XI.3.adjustments"]),
  o('LO-XI.3-07', 'XI.3', "Unit 3: Financial Statements of Sole Proprietorship", "develop the skill of preparation of trading and profit and loss account and balance sheet.", ["XI.3.trading-pl", "XI.3.balance-sheet"]),
  o('LO-XII.1-01', 'XII.1', "Unit 1: Accounting for Partnership Firms", "state the meaning of partnership, partnership firm and partnership deed.", ["XII.1.fundamentals"]),
  o('LO-XII.1-02', 'XII.1', "Unit 1: Accounting for Partnership Firms", "describe the characteristic features of partnership and the contents of partnership deed.", ["XII.1.fundamentals"]),
  o('LO-XII.1-03', 'XII.1', "Unit 1: Accounting for Partnership Firms", "discuss the significance of provision of Partnership Act in the absence of partnership deed.", ["XII.1.fundamentals"]),
  o('LO-XII.1-04', 'XII.1', "Unit 1: Accounting for Partnership Firms", "differentiate between fixed and fluctuating capital, outline the process and develop the understanding and skill of preparation of Profit and Loss Appropriation Account.", ["XII.1.capital", "XII.1.appropriation"]),
  o('LO-XII.1-05', 'XII.1', "Unit 1: Accounting for Partnership Firms", "develop the understanding and skill of preparation profit and loss appropriation account involving guarantee of profits.", ["XII.1.guarantee"]),
  o('LO-XII.1-06', 'XII.1', "Unit 1: Accounting for Partnership Firms", "develop the understanding and skill of making past adjustments.", ["XII.1.past-adjustments"]),
  o('LO-XII.1-07', 'XII.1', "Unit 1: Accounting for Partnership Firms", "state the meaning, nature and factors affecting goodwill", ["XII.1.goodwill"]),
  o('LO-XII.1-08', 'XII.1', "Unit 1: Accounting for Partnership Firms", "develop the understanding and skill of valuation of goodwill using different methods.", ["XII.1.goodwill"]),
  o('LO-XII.1-09', 'XII.1', "Unit 1: Accounting for Partnership Firms", "state the meaning of sacrificing ratio, gaining ratio and the change in profit sharing ratio among existing partners.", ["XII.1.ratio-change"]),
  o('LO-XII.1-10', 'XII.1', "Unit 1: Accounting for Partnership Firms", "develop the understanding of accounting treatment of revaluation assets and reassessment of liabilities and treatment of reserves and accumulated profits by preparing revaluation account and balance sheet.", ["XII.1.ratio-change"]),
  o('LO-XII.1-11', 'XII.1', "Unit 1: Accounting for Partnership Firms", "explain the effect of change in profit sharing ratio on admission of a new partner.", ["XII.1.admission"]),
  o('LO-XII.1-12', 'XII.1', "Unit 1: Accounting for Partnership Firms", "develop the understanding and skill of treatment of goodwill as per AS-26, treatment of revaluation of assets and re-assessment of liabilities, treatment of reserves and accumulated profits, adjustment of capital accounts and preparation of capital, current account and balance sheet of the new firm.", ["XII.1.admission"]),
  o('LO-XII.1-13', 'XII.1', "Unit 1: Accounting for Partnership Firms", "explain the effect of retirement / death of a partner on change in profit sharing ratio.", ["XII.1.retirement", "XII.1.death"]),
  o('LO-XII.1-14', 'XII.1', "Unit 1: Accounting for Partnership Firms", "develop the understanding of accounting treatment of goodwill, revaluation of assets and re-assessment of liabilities and adjustment of accumulated profits, losses and reserves on retirement / death of a partner and capital adjustment.", ["XII.1.retirement", "XII.1.death"]),
  o('LO-XII.1-15', 'XII.1', "Unit 1: Accounting for Partnership Firms", "develop the skill of calculation of deceased partner's share till the time of his death and prepare deceased partner's and executor's account.", ["XII.1.death"]),
  o('LO-XII.1-16', 'XII.1', "Unit 1: Accounting for Partnership Firms", "discuss the preparation of the capital accounts of the remaining partners and the balance sheet of the firm after retirement / death of a partner.", ["XII.1.retirement", "XII.1.death"]),
  o('LO-XII.1-17', 'XII.1', "Unit 1: Accounting for Partnership Firms", "understand the situations under which a partnership firm can be dissolved.", ["XII.1.dissolution"]),
  o('LO-XII.1-18', 'XII.1', "Unit 1: Accounting for Partnership Firms", "develop the understanding of preparation of realisation account and other related accounts.", ["XII.1.dissolution"]),
  o('LO-XII.2-01', 'XII.2', "Unit-3 Accounting for Companies", "state the meaning of share and share capital and differentiate between equity shares and preference shares and different types of share capital.", ["XII.2.fundamentals"]),
  o('LO-XII.2-02', 'XII.2', "Unit-3 Accounting for Companies", "understand the meaning of private placement of shares and Employee Stock Option Plan.", ["XII.2.concepts"]),
  o('LO-XII.2-03', 'XII.2', "Unit-3 Accounting for Companies", "explain the accounting treatment of share capital transactions regarding issue of shares.", ["XII.2.issue"]),
  o('LO-XII.2-04', 'XII.2', "Unit-3 Accounting for Companies", "develop the understanding of accounting treatment of forfeiture and re-issue of forfeited shares.", ["XII.2.forfeiture"]),
  o('LO-XII.2-05', 'XII.2', "Unit-3 Accounting for Companies", "describe the presentation of share capital in the balance sheet of the company as per schedule III part I of the Companies Act 2013.", ["XII.2.disclosure"]),
  o('LO-XII.2-06', 'XII.2', "Unit-3 Accounting for Companies", "explain the accounting treatment of different categories of transactions related to issue of debentures.", ["XII.2.debentures"]),
  o('LO-XII.2-07', 'XII.2', "Unit-3 Accounting for Companies", "develop the understanding and skill of writing of discount / loss on issue of debentures.", ["XII.2.debentures"]),
  o('LO-XII.2-08', 'XII.2', "Unit-3 Accounting for Companies", "understand the concept of collateral security and its presentation in balance sheet.", ["XII.2.debentures"]),
  o('LO-XII.2-09', 'XII.2', "Unit-3 Accounting for Companies", "develop the skill of calculating interest on debentures and its accounting treatment.", ["XII.2.debentures"]),
  o('LO-XII.2-10', 'XII.2', "Unit-3 Accounting for Companies", "state the meaning of redemption of debentures.", ["XII.2.debentures"], "Meaning only: the syllabus prescribes no redemption entries."),
  o('LO-XII.3-01', 'XII.3', "Unit 4: Analysis of Financial Statements", "develop the understanding of major headings and sub-headings (as per Schedule III to the Companies Act, 2013) of balance sheet as per the prescribed norms / formats.", ["XII.3.statements"]),
  o('LO-XII.3-02', 'XII.3', "Unit 4: Analysis of Financial Statements", "state the meaning, objectives and limitations of financial statement analysis.", ["XII.3.statements"]),
  o('LO-XII.3-03', 'XII.3', "Unit 4: Analysis of Financial Statements", "discuss the meaning of different tools of 'financial statements analysis'.", ["XII.3.comparative", "XII.3.common-size"]),
  o('LO-XII.3-04', 'XII.3', "Unit 4: Analysis of Financial Statements", "develop the skill of preparation of preparation of comparative and common size statement, understand their uses and difference between the two.", ["XII.3.comparative", "XII.3.common-size"], "\u201cpreparation of preparation\u201d is printed in the PDF."),
  o('LO-XII.3-05', 'XII.3', "Unit 4: Analysis of Financial Statements", "state the meaning, objectives and significance of different types of ratios.", ["XII.3.liquidity", "XII.3.solvency", "XII.3.activity", "XII.3.profitability"]),
  o('LO-XII.3-06', 'XII.3', "Unit 4: Analysis of Financial Statements", "develop the understanding of computation of current ratio and quick ratio.", ["XII.3.liquidity"]),
  o('LO-XII.3-07', 'XII.3', "Unit 4: Analysis of Financial Statements", "develop the skill of computation of debt equity ratio, total asset to debt ratio, proprietary ratio and interest coverage ratio.", ["XII.3.solvency"]),
  o('LO-XII.3-08', 'XII.3', "Unit 4: Analysis of Financial Statements", "develop the skill of computation of inventory turnover ratio, trade receivables and trade payables ratio and working capital turnover ratio and others.", ["XII.3.activity"]),
  o('LO-XII.3-09', 'XII.3', "Unit 4: Analysis of Financial Statements", "develop the skill of computation of gross profit ratio, operating ratio, operating profit ratio, net profit ratio and return on investment.", ["XII.3.profitability"]),
  o('LO-XII.4-01', 'XII.4', "Unit 5: Cash Flow Statement", "state the meaning and objectives of cash flow statement.", ["XII.4.classification"]),
  o('LO-XII.4-02', 'XII.4', "Unit 5: Cash Flow Statement", "develop the understanding of preparation of Cash Flow Statement using indirect method as per AS 3 with given adjustments.", ["XII.4.preparation"]),
];
export const outcomesOf = (clause: string) => OUTCOMES.filter(x => x.clauses.includes(clause));
export const outcomeById = (id: string) => OUTCOMES.find(x => x.id === id);
