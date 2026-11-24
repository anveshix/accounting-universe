/**
 * Flagship CBSE Class XI & XII Accountancy Simulator & Visualiser catalogue (Experiences A–J).
 *
 * Pure metadata + deterministic mission definitions:
 * - Strictly mapped to CBSE Subject Code 055 (2026–27) syllabus clauses and official limits.
 * - Four progressive difficulty tiers (`Beginner → Practice → Challenge → Master`) per experience.
 * - Syllabus missions, achievement badges, contextual hints, What-if explorations, and bilingual EN/HI glossary tags.
 */
import type { Seen } from './progress';
import { type ClassLevel, type Route, clauseById, unitById } from './syllabus';

export type SimDifficulty = 'BEGINNER' | 'PRACTICE' | 'CHALLENGE' | 'MASTER';

export const SIM_DIFFICULTIES: readonly {
  readonly id: SimDifficulty;
  readonly label: string;
  readonly labelHi: string;
  readonly xp: number;
  readonly hintBudget: number;
  readonly description: string;
}[] = [
  {
    id: 'BEGINNER',
    label: 'Beginner',
    labelHi: 'प्रारंभिक (Beginner)',
    xp: 12,
    hintBudget: 3,
    description: 'Guided walkthrough with highlighted rules, full hints, and step-by-step scaffolding.',
  },
  {
    id: 'PRACTICE',
    label: 'Practice',
    labelHi: 'अभ्यास (Practice)',
    xp: 18,
    hintBudget: 2,
    description: 'Interactive mission where you classify, place, or adjust items with instant rule-based feedback.',
  },
  {
    id: 'CHALLENGE',
    label: 'Challenge',
    labelHi: 'चुनौती (Challenge)',
    xp: 25,
    hintBudget: 1,
    description: 'Multi-step CBSE scenario with subtle distractors (for example profit on credit sale or pro-rata arrears).',
  },
  {
    id: 'MASTER',
    label: 'Master',
    labelHi: 'निपुण (Master)',
    xp: 35,
    hintBudget: 0,
    description: 'Exam-grade synthesis with zero hints — verify every rupee and double-entry invariant yourself.',
  },
];

export type CoreSimId =
  | 'equation-lab'
  | 'journal-ledger-lab'
  | 'cashbook-brs-lab'
  | 'depreciation-lab'
  | 'tb-error-lab'
  | 'final-accounts-lab'
  | 'partnership-lab'
  | 'company-lab'
  | 'financial-analysis-lab'
  | 'computerised-accounting-lab';

export interface SimMission {
  readonly tier: SimDifficulty;
  readonly title: string;
  readonly titleHi: string;
  readonly objective: string;
  readonly hints: readonly string[];
  readonly whatIfPrompt: string;
}

export interface SimAchievementBadge {
  readonly id: string;
  readonly title: string;
  readonly titleHi: string;
  readonly cls: ClassLevel | 'ALL';
  readonly description: string;
  /** Earned when all listed missions (`simId:TIER` or `simId:*` for any tier) are recorded in `seen`. */
  readonly requiredSimIds: readonly CoreSimId[];
  readonly minDifficulty?: SimDifficulty;
}

export interface CoreSimulatorSpec {
  readonly id: CoreSimId;
  readonly code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';
  readonly cls: ClassLevel;
  readonly unit: string;
  readonly clauses: readonly string[];
  /** Optional Class XII route restriction (`COMMON` = shown on all routes). */
  readonly route: Route;
  readonly title: string;
  readonly titleHi: string;
  readonly subtitle: string;
  readonly summary: string;
  readonly syllabusBoundaryNote?: string;
  readonly badgeTitle: string;
  readonly keyTerms: readonly { readonly en: string; readonly hi: string }[];
  readonly missions: readonly [SimMission, SimMission, SimMission, SimMission];
}

export const CORE_SIMULATORS: readonly CoreSimulatorSpec[] = [
  {
    id: 'equation-lab',
    code: 'A',
    cls: 'XI',
    unit: 'XI.2',
    clauses: ['XI.2.equation', 'XI.2.rules'],
    route: 'COMMON',
    title: 'Accounting Equation & Rules Lab',
    titleHi: 'लेखांकन समीकरण एवं नियम प्रयोगशाला',
    subtitle: 'Assets = Liabilities + Capital · Dual-aspect visual scale & error detector',
    summary: 'Play transaction cards step by step, move values across Assets, Liabilities, and Capital, test What-if scenarios, and catch unbalanced or misclassified analyses.',
    badgeTitle: 'Dual-Aspect Architect',
    keyTerms: [
      { en: 'Assets', hi: 'परिसंपत्तियाँ' },
      { en: 'Liabilities', hi: 'देयताएँ' },
      { en: 'Capital', hi: 'पूँजी' },
      { en: 'Drawings', hi: 'आहरण' },
    ],
    missions: [
      {
        tier: 'BEGINNER',
        title: 'Capital & Asset Swap',
        titleHi: 'पूँजी निवेश एवं परिसंपत्ति विनिमय',
        objective: 'Analyse owner cash investment (₹1,00,000) and cash purchase of furniture (₹25,000) while keeping A = L + C balanced.',
        hints: [
          'When the owner brings cash into the business, Cash (Asset) increases and Capital increases by the same ₹1,00,000.',
          'Buying furniture for cash swaps one Asset (+₹25,000 Furniture) for another (−₹25,000 Cash); total Assets stay ₹1,00,000.',
          'Liabilities are untouched in both transactions.',
        ],
        whatIfPrompt: 'What happens to total Assets if furniture is bought on credit from WoodCraft instead of cash?',
      },
      {
        tier: 'PRACTICE',
        title: 'Credit Purchase & Expense',
        titleHi: 'उधार क्रय एवं व्यय भुगतान',
        objective: 'Record credit purchase of goods (₹40,000) and rent paid in cash (₹6,000) on the equation board.',
        hints: ['Goods bought on credit raise Stock (Asset) and Creditors (Liability) equally by ₹40,000.', 'Paying rent reduces Cash (Asset) and reduces Capital (via expense) by ₹6,000.'],
        whatIfPrompt: 'Toggle Outstanding Rent in What-if mode: why does total Assets stay unchanged when rent is accrued but unpaid?',
      },
      {
        tier: 'CHALLENGE',
        title: 'Goods Sold at a Profit',
        titleHi: 'लाभ पर माल का विक्रय',
        objective: 'Analyse goods costing ₹30,000 sold for ₹42,000 cash without overstating Capital.',
        hints: ['Stock leaves at COST (−₹30,000), Cash enters at SELLING PRICE (+₹42,000), and only the profit (+₹12,000) increases Capital.'],
        whatIfPrompt: 'Slide the selling price below ₹30,000 to see how a loss immediately shrinks Capital while keeping A = L + C exact.',
      },
      {
        tier: 'MASTER',
        title: 'Audit the Broken Equation',
        titleHi: 'त्रुटिपूर्ण समीकरण की जाँच',
        objective: 'Spot and fix a clerk’s faulty 3-part analysis involving bank loan, drawings, and prepaid insurance with zero hints.',
        hints: [],
        whatIfPrompt: 'Test how repaying ₹15,000 loan principal plus ₹1,500 interest splits between Liabilities and Capital.',
      },
    ],
  },
  {
    id: 'journal-ledger-lab',
    code: 'B',
    cls: 'XI',
    unit: 'XI.2',
    clauses: ['XI.2.journal', 'XI.2.ledger', 'XI.2.vouchers'],
    route: 'COMMON',
    title: 'Journal & Ledger Posting Lab',
    titleHi: 'रोज़नामचा एवं खाता-बही खतौनी प्रयोगशाला',
    subtitle: 'Interactive journal builder · Animated posting · Dynamic T-accounts & c/d balancing',
    summary: 'Build compound and simple journal entries with live Debit = Credit checks, animate every line into its T-account, and inspect 3-step c/d & b/d ledger balancing.',
    badgeTitle: 'Double-Entry Postmaster',
    keyTerms: [
      { en: 'Journal', hi: 'रोज़नामचा' },
      { en: 'Ledger Posting', hi: 'खतौनी' },
      { en: 'Debit (Dr.)', hi: 'नाम (Dr.)' },
      { en: 'Balance c/d', hi: 'शेष आगे ले गए (c/d)' },
    ],
    missions: [
      {
        tier: 'BEGINNER',
        title: 'Start Business & Bank Deposit',
        titleHi: 'व्यापार प्रारंभ एवं बैंक जमा',
        objective: 'Journalise capital introduced in cash (₹80,000) and cash deposited into bank (₹30,000), then watch T-accounts balance.',
        hints: [
          'Cash increases (Asset ↑ → Dr Cash A/c ₹80,000) and Capital increases (Capital ↑ → Cr Capital A/c ₹80,000).',
          'Depositing cash into bank increases Bank (Dr ₹30,000) and decreases Cash (Cr ₹30,000).',
          'Look at Cash T-account: Dr ₹80,000 vs Cr ₹30,000 leaves By Balance c/d ₹50,000.',
        ],
        whatIfPrompt: 'Step through the animated posting to trace which side Balance c/d sits on vs Balance b/d.',
      },
      {
        tier: 'PRACTICE',
        title: 'Credit Sale & Settlement',
        titleHi: 'उधार विक्रय एवं निपटान',
        objective: 'Post a credit sale to Aarav (₹25,000) followed by cheque receipt of ₹24,500 and discount allowed ₹500.',
        hints: ['First entry: Dr Debtors / Aarav ₹25,000, Cr Sales ₹25,000.', 'Compound settlement: Dr Bank ₹24,500 + Dr Discount Allowed ₹500 = Cr Debtors ₹25,000.'],
        whatIfPrompt: 'Inspect Aarav’s T-account after settlement — why does it have zero closing balance?',
      },
      {
        tier: 'CHALLENGE',
        title: 'Compound Opening Entry',
        titleHi: 'मिश्रित प्रारंभिक प्रविष्टि',
        objective: 'Build a balanced compound journal entry with Cash ₹20,000, Machinery ₹60,000, Creditors ₹15,000, and Capital ₹65,000.',
        hints: ['Debit every asset (Cash ₹20,000, Machinery ₹60,000) and credit Creditors (₹15,000) plus Capital (₹65,000).'],
        whatIfPrompt: 'Add a salary payment and replay the ledger timeline from Entry 1 to Closing Trial Balance.',
      },
      {
        tier: 'MASTER',
        title: 'Full Cycle Ledger Balancing',
        titleHi: 'पूर्ण चक्र खाता-बही संतुलन',
        objective: 'Post purchases, wages, sales, and drawings without hints and verify that the extracted Trial Balance agrees to the paisa.',
        hints: [],
        whatIfPrompt: 'Reverse a posted entry in the ledger to see how immutable audit reversals keep Dr = Cr intact.',
      },
    ],
  },
  {
    id: 'cashbook-brs-lab',
    code: 'C',
    cls: 'XI',
    unit: 'XI.2',
    clauses: ['XI.2.cashbook', 'XI.2.subsidiary', 'XI.2.brs'],
    route: 'COMMON',
    title: 'Cash Book, Petty Cash & BRS Simulator',
    titleHi: 'रोकड़ बही, खुदरा रोकड़ एवं बैंक समाधान प्रयोगशाला',
    subtitle: 'Two-column contra entries · Imprest petty cash · Side-by-side Cash Book vs Pass Book BRS',
    summary: 'Record Cash + Bank contra entries, run an imprest petty cash float, and visually spot timing/omission differences between Cash Book and Bank Statement to build a BRS.',
    badgeTitle: 'Reconciliation Navigator',
    keyTerms: [
      { en: 'Contra Entry (C)', hi: 'प्रति प्रविष्टि (C)' },
      { en: 'Bank Overdraft', hi: 'बैंक अधिविकर्ष' },
      { en: 'Imprest System', hi: 'अग्रदाय प्रणाली' },
      { en: 'Pass Book', hi: 'पास बुक' },
    ],
    missions: [
      {
        tier: 'BEGINNER',
        title: 'Contra Entry & Bank Balance',
        titleHi: 'प्रति प्रविष्टि एवं बैंक शेष',
        objective: 'Record cash deposited into bank (₹8,000) in the two-column Cash Book and verify both columns foot.',
        hints: [
          'Depositing cash into bank is a Contra (C) entry: Bank Dr ₹8,000 and Cash Cr ₹8,000.',
          'Cash can never go negative, whereas Bank can go into overdraft.',
          'Check the BRS tab to see why an unpresented cheque makes Pass Book higher than Cash Book.',
        ],
        whatIfPrompt: 'Flip BRS starting point between Cash Book and Pass Book — watch every Add/Less sign invert!',
      },
      {
        tier: 'PRACTICE',
        title: 'Favourable BRS Detective',
        titleHi: 'अनुकूल शेष बैंक समाधान',
        objective: 'Start with ₹50,000 Cash Book balance and reconcile ₹10,000 unpresented cheques, ₹3,000 uncollected cheques, and ₹500 bank charges.',
        hints: ['Unpresented cheques (₹10,000) were deducted by you, not yet by the bank → ADD.', 'Uncollected cheques (₹3,000) and bank charges (₹500) make the bank lower → LESS.'],
        whatIfPrompt: 'Check the Imprest Petty Cash tab: spend ₹2,450 out of ₹5,000 imprest and verify the exact reimbursement.',
      },
      {
        tier: 'CHALLENGE',
        title: 'Bank Overdraft Reconciliation',
        titleHi: 'बैंक अधिविकर्ष समाधान',
        objective: 'Reconcile an overdraft Cash Book balance of −₹20,000 with direct customer deposit ₹6,000 and interest on overdraft ₹1,200.',
        hints: ['Keep overdraft signed (−₹20,000): direct deposit (+₹6,000) reduces overdraft, overdraft interest (−₹1,200) increases overdraft to −₹15,200.'],
        whatIfPrompt: 'Slide uncollected cheques higher to watch a favourable bank balance tip into overdraft.',
      },
      {
        tier: 'MASTER',
        title: 'Pass Book to Cash Book Mastery',
        titleHi: 'पास बुक से रोकड़ बही समाधान',
        objective: 'Start from Pass Book balance ₹56,500 and derive the exact Cash Book balance ₹50,000 across 4 reconciling items with zero hints.',
        hints: [],
        whatIfPrompt: 'Compare Cash Book closing bank column directly against the reconciled Pass Book figure.',
      },
    ],
  },
  {
    id: 'depreciation-lab',
    code: 'D',
    cls: 'XI',
    unit: 'XI.2',
    clauses: ['XI.2.depreciation'],
    route: 'COMMON',
    title: 'Depreciation & Asset Disposal Lab',
    titleHi: 'मूल्यह्रास एवं परिसंपत्ति निस्तारण प्रयोगशाला',
    subtitle: 'SLM vs WDV dual curve · Mid-year purchase · Provision for Depreciation & Disposal',
    syllabusBoundaryNote: 'CBSE 2026–27 limit: Change of depreciation method is excluded.',
    summary:
      'Compare Straight Line (SLM) and Written Down Value (WDV) side by side with animated book-value curves, partial first-year months, Provision for Depreciation A/c, and profit/loss on sale.',
    badgeTitle: 'Asset Lifecycle Specialist',
    keyTerms: [
      { en: 'Straight Line (SLM)', hi: 'सीधी रेखा पद्धति' },
      { en: 'Written Down Value (WDV)', hi: 'क्रमागत ह्रास पद्धति' },
      { en: 'Residual / Scrap Value', hi: 'अवशिष्ट मूल्य' },
      { en: 'Provision for Depreciation', hi: 'मूल्यह्रास के लिए प्रावधान' },
    ],
    missions: [
      {
        tier: 'BEGINNER',
        title: 'SLM vs WDV Curve Comparison',
        titleHi: 'SLM बनाम WDV तुलना',
        objective: 'Simulate a ₹1,00,000 machine at 10% p.a. for 4 years and compare Year-4 closing value under SLM vs WDV.',
        hints: [
          'SLM deducts 10% of original cost (₹10,000) every year → Year 4 closing ₹60,000.',
          'WDV deducts 10% of opening book value each year (₹10,000, ₹9,000, ₹8,100, ₹7,290) → Year 4 closing ₹65,610.',
          'Notice how the two SVG curves diverge after Year 1.',
        ],
        whatIfPrompt: 'Increase rate to 25% and observe how WDV never touches zero while SLM hits the scrap floor.',
      },
      {
        tier: 'PRACTICE',
        title: 'Mid-Year Acquisition (6 Months)',
        titleHi: 'वर्ष के मध्य क्रय (6 माह)',
        objective: 'Set first-year months to 6 on a ₹1,20,000 asset at 10% WDV for 3 years and inspect Year 1 vs Year 2 depreciation.',
        hints: ['Year 1 charges 10% × ₹1,20,000 × 6/12 = ₹6,000, leaving ₹1,14,000.', 'Year 2 charges full 12 months on ₹1,14,000 = ₹11,400.'],
        whatIfPrompt: 'Switch recording mode from Asset Account to Provision for Depreciation A/c and inspect the journal entries.',
      },
      {
        tier: 'CHALLENGE',
        title: 'Sale & Disposal Gain / Loss',
        titleHi: 'परिसंपत्ति विक्रय पर लाभ/हानि',
        objective: 'Run ₹1,00,000 WDV @ 10% for 3 years (book value ₹72,900) and simulate sale at ₹70,000 to verify ₹2,900 loss.',
        hints: ['Accumulated depreciation after 3 years is ₹27,100; book value ₹72,900 vs sale ₹70,000 gives ₹2,900 Loss on Sale.'],
        whatIfPrompt: 'Raise sale proceeds to ₹78,000 and see how Provision for Depreciation transfers into Asset Disposal.',
      },
      {
        tier: 'MASTER',
        title: 'Scrap Floor & Provision Disposal',
        titleHi: 'अवशिष्ट मूल्य एवं प्रावधान निस्तारण',
        objective: 'Configure cost ₹2,00,000, scrap ₹20,000, SLM 20%, 6 years, Provision method, and sale at ₹25,000 — verify depreciation caps at ₹1,80,000.',
        hints: [],
        whatIfPrompt: 'Test why Year 6 depreciation automatically stops at ₹0 once book value reaches residual value ₹20,000.',
      },
    ],
  },
  {
    id: 'tb-error-lab',
    code: 'E',
    cls: 'XI',
    unit: 'XI.2',
    clauses: ['XI.2.tb', 'XI.2.errors', 'XI.2.provisions'],
    route: 'COMMON',
    title: 'Trial Balance & Error Detective Lab',
    titleHi: 'तलपट एवं अशुद्धि शोधन जासूस प्रयोगशाला',
    subtitle: 'Balance-method TB card sorter · Visual clue audit · Rectification & Suspense A/c',
    syllabusBoundaryNote: 'CBSE 2026–27 limit: Trial Balance is prepared by the Balance Method only.',
    summary: 'Place account cards onto Debit or Credit columns, uncover hidden errors of principle/omission/commission, pass rectifying entries, and watch the Suspense Account clear to zero.',
    badgeTitle: 'Suspense Detective',
    keyTerms: [
      { en: 'Trial Balance', hi: 'तलपट' },
      { en: 'Suspense Account', hi: 'उचंत खाता' },
      { en: 'Error of Principle', hi: 'सिद्धांत की अशुद्धि' },
      { en: 'One-sided Error', hi: 'एकपक्षीय अशुद्धि' },
    ],
    missions: [
      {
        tier: 'BEGINNER',
        title: 'Build a Clean Trial Balance',
        titleHi: 'संतुलित तलपट निर्माण',
        objective: 'Place all 8 ledger balance cards (including Drawings, Return Inwards, and Provision for Doubtful Debts) onto their right Debit/Credit columns.',
        hints: [
          'Assets, Expenses, Drawings, and Sales Returns (Return Inwards) belong on the DEBIT column.',
          'Liabilities, Capital, Revenues, Purchases Returns, and Provisions belong on the CREDIT column.',
          'Watch out: placing an item on the wrong column creates DOUBLE its amount as a difference!',
        ],
        whatIfPrompt: 'Deliberately flip Drawings to Credit — why does the Trial Balance gap jump by 2× Drawings?',
      },
      {
        tier: 'PRACTICE',
        title: 'Error of Principle (Two-Sided)',
        titleHi: 'सिद्धांत की अशुद्धि का सुधार',
        objective: 'Rectify ₹5,000 paid for machinery installation wrongly debited to Wages A/c, and verify why no Suspense A/c is used.',
        hints: [
          'Wages (Expense) was debited instead of Machinery (Asset), while Cash was rightly credited.',
          'Rectifying entry: Dr Machinery A/c ₹5,000, Cr Wages A/c ₹5,000 — Trial Balance already agreed!',
        ],
        whatIfPrompt: 'Compare how this error changes Gross Profit even though the Trial Balance tallied.',
      },
      {
        tier: 'CHALLENGE',
        title: 'One-Sided Posting & Suspense Clearance',
        titleHi: 'एकपक्षीय खतौनी एवं उचंत खाता समाशोधन',
        objective: 'Solve a case where credit purchase ₹8,000 from Mohan was posted to Mohan’s debit as ₹800, creating an ₹8,800 Suspense balance.',
        hints: ['Purchases Dr ₹8,000 was right, but Mohan got Dr ₹800 instead of Cr ₹8,000 → Credit Mohan ₹8,800 and Debit Suspense A/c ₹8,800.'],
        whatIfPrompt: 'Toggle between Complete Omission, Partial Omission, and Wrong Side Posting to compare Trial Balance impact.',
      },
      {
        tier: 'MASTER',
        title: 'Multi-Error Suspense Audit',
        titleHi: 'बहु-अशुद्धि उचंत लेखापरीक्षा',
        objective: 'Clear a Suspense Account and check Provision for Doubtful Debts + Discount on Debtors order of working without hints.',
        hints: [],
        whatIfPrompt: 'Verify why Provision for Discount on Debtors is computed AFTER deducting both further bad debts and PDD.',
      },
    ],
  },
  {
    id: 'final-accounts-lab',
    code: 'F',
    cls: 'XI',
    unit: 'XI.3',
    clauses: ['XI.3.trading-pl', 'XI.3.balance-sheet', 'XI.3.adjustments', 'XI.3.incomplete'],
    route: 'COMMON',
    title: 'Final Accounts & Adjustments Builder',
    titleHi: 'अंतिम खाते एवं समायोजन निर्माता',
    subtitle: 'Drag/click items into Trading, P&L & Balance Sheet · Dual-effect adjustments · GP/OP/NP waterfall',
    syllabusBoundaryNote: 'CBSE 2026–27 limit: Incomplete records use the Statement of Affairs method only (conversion method excluded).',
    summary:
      'Sort Trial Balance heads into Trading A/c, P&L A/c, and Balance Sheet (drag-and-drop or click-to-place), toggle CBSE adjustments with live dual-impact highlights, and visualise Gross → Operating → Net Profit.',
    badgeTitle: 'Sole-Proprietor Statement Master',
    keyTerms: [
      { en: 'Gross Profit', hi: 'सकल लाभ' },
      { en: 'Net Profit', hi: 'शुद्ध लाभ' },
      { en: 'Outstanding Expense', hi: 'अदत्त व्यय' },
      { en: 'Closing Stock', hi: 'अंतिम स्टॉक' },
    ],
    missions: [
      {
        tier: 'BEGINNER',
        title: 'Sort Trading, P&L & Balance Sheet',
        titleHi: 'व्यापार, लाभ-हानि एवं चिट्ठा वर्गीकरण',
        objective: 'Place Opening Stock, Wages, Salaries, Sales, Debtors, Creditors, and Capital into their exact statement buckets.',
        hints: [
          'Direct items (Opening Stock, Purchases, Wages, Sales) belong in Trading A/c.',
          'Indirect office/selling expenses (Salaries, Rent) belong in Profit & Loss A/c.',
          'Assets, Liabilities, and Capital belong in the Balance Sheet.',
        ],
        whatIfPrompt: 'Move Wages vs Salaries to see how Gross Profit changes while Net Profit stays identical!',
      },
      {
        tier: 'PRACTICE',
        title: 'Dual-Effect Year-End Adjustments',
        titleHi: 'द्विपक्षीय वर्षांत समायोजन',
        objective: 'Activate Closing Stock (₹30,000), Outstanding Salaries (₹2,000), Prepaid Rent (₹1,000), and 10% Furniture Depreciation.',
        hints: ['Every outside-TB adjustment hits TWO places: once in Trading/P&L and once in Balance Sheet.', 'Closing Stock credits Trading A/c AND sits under Current Assets in the Balance Sheet.'],
        whatIfPrompt: 'Switch on Goods Taken for Personal Use (₹1,500) — watch Purchases fall and Drawings rise.',
      },
      {
        tier: 'CHALLENGE',
        title: 'Debtors Chain & Manager Commission',
        titleHi: 'देनदार श्रृंखला एवं प्रबंधक कमीशन',
        objective: 'Apply Further Bad Debts ₹2,000, 5% PDD, 2% Discount on Debtors, and 10% Manager’s Commission (after charging such commission).',
        hints: ['Aftercharging commission = 10/110 of profit before commission; Debtors chain deducts bad debts first, then 5% PDD, then 2% discount.'],
        whatIfPrompt: 'Compare Manager’s Commission BEFORE (10/100) vs AFTER (10/110) charging commission.',
      },
      {
        tier: 'MASTER',
        title: 'Statement of Affairs Profit Estimator',
        titleHi: 'अवस्था विवरण से लाभ निर्धारण',
        objective: 'Complete the full adjusted Balance Sheet AND verify profit from Incomplete Records (Statement of Affairs) with zero hints.',
        hints: [],
        whatIfPrompt: 'Test why drawings are ADDED back and fresh capital is DEDUCTED in the Statement of Affairs profit formula.',
      },
    ],
  },
  {
    id: 'partnership-lab',
    code: 'G',
    cls: 'XII',
    unit: 'XII.1',
    clauses: [
      'XII.1.fundamentals',
      'XII.1.capital',
      'XII.1.appropriation',
      'XII.1.guarantee',
      'XII.1.goodwill',
      'XII.1.ratio-change',
      'XII.1.admission',
      'XII.1.retirement',
      'XII.1.death',
      'XII.1.dissolution',
    ],
    route: 'COMMON',
    title: 'Partnership Lifecycle Simulator',
    titleHi: 'साझेदारी जीवनचक्र सिम्युलेटर',
    subtitle: 'Appropriation & Guarantee · 3 Goodwill methods · PSR / Admission / Retirement / Dissolution',
    syllabusBoundaryNote: 'CBSE 2026–27 limits: Goodwill by Average, Super Profit & Capitalisation only; Dissolution excludes piecemeal distribution, sale to company & insolvency.',
    summary: 'Simulate P&L Appropriation, Goodwill valuation, sacrificing vs gaining ratio bars, Revaluation A/c, Admission (AS 26), Retirement/Death settlement, and Dissolution Realisation A/c.',
    badgeTitle: 'Partnership Equity Strategist',
    keyTerms: [
      { en: 'Sacrificing Ratio', hi: 'त्याग अनुपात' },
      { en: 'Gaining Ratio', hi: 'लाभ प्राप्ति अनुपात' },
      { en: 'Goodwill', hi: 'ख्याति' },
      { en: 'Revaluation A/c', hi: 'पुनर्मूल्यांकन खाता' },
    ],
    missions: [
      {
        tier: 'BEGINNER',
        title: 'P&L Appropriation & Guarantee',
        titleHi: 'लाभ-हानि विनियोजन एवं गारंटी',
        objective: 'Distribute ₹1,20,000 net profit among A, B, C (3:2:1) with IoC 10%, salary, and a ₹25,000 minimum guarantee to C.',
        hints: [
          'Credit Net Profit + Interest on Drawings first, deduct IoC and Salary, then split residual profit in 3:2:1.',
          'If C’s share is below ₹25,000, A and B bear the deficiency in 3:2.',
          'Slide Net Profit below fixed entitlements to watch the engine switch to the ratio of appropriations due!',
        ],
        whatIfPrompt: 'Drop Net Profit to ₹20,000 (insufficient profit) and observe how IoC + Salary scale proportionally.',
      },
      {
        tier: 'PRACTICE',
        title: 'Goodwill & Sacrificing Ratio on Admission',
        titleHi: 'ख्याति मूल्यांकन एवं नए साझेदार का प्रवेश',
        objective: 'Compare Average, Super Profit, and Capitalisation goodwill, then admit Partner C for 1/4 share with premium for goodwill.',
        hints: [
          'Super Profit = Average Profit − (Capital Employed × NRR%).',
          'Per AS 26, self-generated goodwill is never raised in books; newcomer’s premium is credited to sacrificing partners in sacrificing ratio.',
        ],
        whatIfPrompt: 'Change C’s share acquisition from equal sacrifice (1:1) to whole sacrifice by A — watch the ratio bar shift.',
      },
      {
        tier: 'CHALLENGE',
        title: 'Retirement Gaining Ratio & Loan A/c',
        titleHi: 'साझेदार की सेवानिवृत्ति एवं ऋण खाता',
        objective: 'Settle retiring Partner B’s capital after revaluation, reserves, and goodwill adjustment (gaining ratio), transferring balance to B’s Loan A/c.',
        hints: ['Continuing partners compensate retiring partner’s share of goodwill in their Gaining Ratio (New Share − Old Share).'],
        whatIfPrompt: 'Inspect the 6% p.a. annual instalment schedule when the retiring/deceased partner’s dues are settled over 3 years.',
      },
      {
        tier: 'MASTER',
        title: 'Dissolution Realisation Settlement',
        titleHi: 'फर्म का विघटन एवं वसूली खाता',
        objective: 'Close sundry assets and external liabilities through Realisation A/c and verify final Cash/Bank settlement equals partners’ closing capitals.',
        hints: [],
        whatIfPrompt: 'Check why Cash/Bank self-balances on dissolution: bank inflow/outflow exactly matches partners’ final settlement.',
      },
    ],
  },
  {
    id: 'company-lab',
    code: 'H',
    cls: 'XII',
    unit: 'XII.2',
    clauses: ['XII.2.fundamentals', 'XII.2.issue', 'XII.2.forfeiture', 'XII.2.concepts', 'XII.2.disclosure', 'XII.2.debentures'],
    route: 'COMMON',
    title: 'Company Accounts Simulator (Shares & Debentures)',
    titleHi: 'कंपनी लेखे सिम्युलेटर (अंश एवं ऋणपत्र)',
    subtitle: 'Oversubscription & Pro-rata · Calls in Arrears/Advance · Forfeiture & Reissue · Debentures & Schedule III',
    syllabusBoundaryNote: 'CBSE 2026–27 limits: Interest on calls in arrears/advance is excluded; Debenture TDS and redemption journal entries are excluded.',
    summary:
      'Step through share issue at par/premium, pro-rata allotment table, calls in arrears/advance, forfeiture & reissue Capital Reserve math, debenture issue/loss write-off, and Schedule III Note to Accounts.',
    badgeTitle: 'Corporate Capital Controller',
    keyTerms: [
      { en: 'Pro-rata Allotment', hi: 'आनुपातिक आवंटन' },
      { en: 'Securities Premium', hi: 'प्रतिभूति प्रीमियम' },
      { en: 'Share Forfeiture', hi: 'अंश हरण' },
      { en: 'Capital Reserve', hi: 'पूँजीगत संचय' },
    ],
    missions: [
      {
        tier: 'BEGINNER',
        title: 'Oversubscription & Pro-rata Allotment',
        titleHi: 'अति-अभिदान एवं आनुपातिक आवंटन',
        objective: 'Offer 1,00,000 ₹10 shares with 1,60,000 applications (10,000 rejected, 1,50,000 pro-rata) and trace excess application money.',
        hints: [
          '10,000 rejected shares are refunded immediately; 1,50,000 applicants get 1,00,000 shares (ratio 3:2).',
          'Excess application money on pro-rata shares is adjusted first toward Allotment due.',
          'Securities Premium is credited separately and never merged into Share Capital.',
        ],
        whatIfPrompt: 'Increase rejected applications to 40,000 and watch Bank Refund vs Allotment Adjustment rebalance live.',
      },
      {
        tier: 'PRACTICE',
        title: 'Calls in Arrears & Share Forfeiture',
        titleHi: 'बकाया याचना एवं अंश हरण',
        objective: 'Forfeit 1,500 shares for non-payment of ₹3 call (including ₹1 unpaid premium) and verify Share Forfeited A/c vs Securities Premium A/c.',
        hints: [
          'Paid premium stays untouched in Securities Premium A/c; UNPAID premium on call IS debited on forfeiture.',
          'Only capital money actually received (₹8 × 1,500 = ₹12,000) goes to Share Forfeited A/c.',
        ],
        whatIfPrompt: 'Test Calls in Advance on the adjacent toggle (without interest, per CBSE limit) to see its Schedule III treatment.',
      },
      {
        tier: 'CHALLENGE',
        title: 'Partial Reissue & Capital Reserve',
        titleHi: 'आंशिक पुनर्निर्गमन एवं पूँजीगत संचय',
        objective: 'Reissue 1,000 of the 1,500 forfeited shares at ₹9 as fully paid and calculate exact Capital Reserve transferred.',
        hints: [
          'Proportionate forfeited credit on 1,000 shares = ₹8,000; less ₹1/share reissue discount (₹1,000) = ₹7,000 Capital Reserve!',
          'The remaining ₹4,000 stays in Share Forfeited A/c and is added under Subscribed Share Capital in Schedule III.',
        ],
        whatIfPrompt: 'Lower reissue price toward the minimum permissible price (₹2) to see Capital Reserve shrink to ₹0.',
      },
      {
        tier: 'MASTER',
        title: 'Debentures with Redemption Terms & Write-Off',
        titleHi: 'शोधन शर्तों सहित ऋणपत्र निर्गमन एवं अपलेखन',
        objective: 'Issue 5,000 9% Debentures of ₹100 at 5% discount redeemable at 10% premium, and write off total loss first against Securities Premium.',
        hints: [],
        whatIfPrompt: 'Switch between all 6 CBSE debenture issue-vs-redemption combinations to compare Loss on Issue of Debentures.',
      },
    ],
  },
  {
    id: 'financial-analysis-lab',
    code: 'I',
    cls: 'XII',
    unit: 'XII.3',
    clauses: ['XII.3.statements', 'XII.3.comparative', 'XII.3.common-size', 'XII.3.liquidity', 'XII.3.solvency', 'XII.3.activity', 'XII.3.profitability', 'XII.4.classification', 'XII.4.preparation'],
    route: 'OPTION_I_ANALYSIS',
    title: 'Financial Statement Analysis & Cash Flow Lab',
    titleHi: 'वित्तीय विवरण विश्लेषण एवं रोकड़ प्रवाह प्रयोगशाला',
    subtitle: 'Comparative & Common-size · All 4 Ratio families · AS 3 (Revised) Indirect Cash Flow',
    syllabusBoundaryNote: 'CBSE 2026–27 Option I: Cash Flow Statement is prepared by the Indirect Method only (AS 3 Revised).',
    summary: 'Compare multi-year statements, adjust balance-sheet sliders to watch Liquidity, Solvency, Activity & Profitability ratios respond live, and build an Indirect Cash Flow Statement.',
    badgeTitle: 'Financial Analyst & Cash-Flow Navigator',
    keyTerms: [
      { en: 'Current Ratio', hi: 'चालू अनुपात' },
      { en: 'Debt-Equity Ratio', hi: 'ऋण-समता अनुपात' },
      { en: 'Return on Investment (ROI)', hi: 'निवेश पर प्रत्यय' },
      { en: 'Operating Activities', hi: 'परिचालन गतिविधियाँ' },
    ],
    missions: [
      {
        tier: 'BEGINNER',
        title: 'Liquidity & Solvency Gauge Check',
        titleHi: 'तरलता एवं शोधन क्षमता अनुपात',
        objective: 'Achieve the 2:1 ideal Current Ratio and ≥ 1:1 Quick Ratio while inspecting Debt-Equity and Proprietary Ratios.',
        hints: [
          'Current Ratio = Current Assets ÷ Current Liabilities; Quick Assets exclude Inventories and Prepaid Expenses.',
          'Debt-Equity Ratio = Long-term Debt ÷ Shareholders’ Funds.',
          'Move the Inventory slider: Current Ratio rises, while Quick Ratio stays flat!',
        ],
        whatIfPrompt: 'Pay off ₹50,000 Trade Payables using Cash when Current Ratio > 1 — does Current Ratio rise or fall?',
      },
      {
        tier: 'PRACTICE',
        title: 'Comparative & Common-Size Insights',
        titleHi: 'तुलनात्मक एवं समान-आकार विवरण',
        objective: 'Switch to Comparative & Common-Size view and verify absolute change, % change, and % of Revenue / Balance Sheet total.',
        hints: [
          'Comparative % change uses Previous Year as base; Common-size P&L uses Revenue from Operations as 100%.',
          'Check Operating Ratio + Operating Profit Ratio — they always add up to 100%!',
        ],
        whatIfPrompt: 'Raise Finance Costs and notice how Operating Profit Ratio is unaffected while Net Profit Ratio drops.',
      },
      {
        tier: 'CHALLENGE',
        title: 'Activity Turnovers & ROI',
        titleHi: 'क्रियाशीलता आवर्त एवं ROI',
        objective: 'Compute Inventory Turnover, Trade Receivables Turnover, Working Capital Turnover, and ROI (EBIT ÷ Capital Employed).',
        hints: ['Inventory Turnover uses Cost of Revenue from Operations ÷ Average Inventory; ROI uses Profit before Interest & Tax ÷ Capital Employed.'],
        whatIfPrompt: 'Compare how issuing long-term debt vs equity changes Debt-Equity Ratio and Interest Coverage Ratio.',
      },
      {
        tier: 'MASTER',
        title: 'AS 3 (Revised) Indirect Cash Flow Reconciliation',
        titleHi: 'अप्रत्यक्ष विधि रोकड़ प्रवाह विवरण (AS 3)',
        objective: 'Build Operating, Investing, and Financing cash flows (Indirect Method) so Opening Cash + Net Cash Flow = Closing Cash & Equivalents.',
        hints: [],
        whatIfPrompt: 'Verify why Interest & Dividend Paid are Financing outflows while Interest & Dividend Received are Investing inflows for a non-financial company.',
      },
    ],
  },
  {
    id: 'computerised-accounting-lab',
    code: 'J',
    cls: 'XII',
    unit: 'XII.C',
    clauses: ['XII.C.cas', 'XII.C.spreadsheet', 'XII.C.using'],
    route: 'OPTION_II_COMPUTERISED',
    title: 'Computerised Accounting & Spreadsheet Lab',
    titleHi: 'कम्प्यूटरीकृत लेखांकन एवं स्प्रेडशीट प्रयोगशाला',
    subtitle: 'Account-head hierarchy & codification · Maker-Checker voucher validation · Closing entries & Live spreadsheet grid',
    syllabusBoundaryNote: 'CBSE Class XII Option II (20 marks) + Class XI compulsory Computerised Accounting exposure.',
    summary:
      'Design hierarchical account codes, enter & validate vouchers through Maker-Checker security controls, run adjusting & closing entries to auto-generate statements, and inspect live spreadsheet formulas.',
    badgeTitle: 'CAS Systems Controller',
    keyTerms: [
      { en: 'Codification', hi: 'कूटबद्धता (Codification)' },
      { en: 'Account Hierarchy', hi: 'खाता पदानुक्रम' },
      { en: 'Voucher Verification', hi: 'वाउचर सत्यापन' },
      { en: 'Spreadsheet Formula', hi: 'स्प्रेडशीट सूत्र' },
    ],
    missions: [
      {
        tier: 'BEGINNER',
        title: 'Hierarchical Codification Explorer',
        titleHi: 'पदानुक्रमित खाता कूट निर्माण',
        objective: 'Create a codified ledger account under Assets → Current Assets (1xx series) and trace its group → sub-group → account code.',
        hints: [
          'Hierarchical codes assign leading digits to Major Head (1 = Assets, 2 = Liabilities, 3 = Capital, 4 = Revenue, 5 = Expenses).',
          'Sub-groups (e.g. 11 = Non-Current Assets, 12 = Current Assets) let the CAS roll up totals automatically.',
          'Mnemonic codes (likeSLR for Salary) are readable, while sequential/block codes scale cleanly in databases.',
        ],
        whatIfPrompt: 'Add a new codified account head and see it immediately appear in the Voucher Entry dropdown and Chart tree.',
      },
      {
        tier: 'PRACTICE',
        title: 'Data Entry Validation & Maker-Checker',
        titleHi: 'डेटा प्रविष्टि सत्यापन एवं मेकर-चेकर',
        objective: 'Enter a balanced voucher as Accountant, test why an unbalanced voucher is rejected by front-end validation, then switch to Checker to post it.',
        hints: [
          'CAS enforces Dr = Cr, valid ISO date, positive amounts, and registered account codes BEFORE saving to the queue.',
          'Segregation of duties: the Accountant prepares (DRAFT → PENDING), and the Checker verifies (PENDING → POSTED).',
        ],
        whatIfPrompt: 'Try editing a posted voucher — see why CAS preserves an immutable audit trail and requires a reversal voucher instead.',
      },
      {
        tier: 'CHALLENGE',
        title: 'Adjusting & Year-End Closing Pipeline',
        titleHi: 'समायोजन एवं वर्षांत समापन प्रविष्टियाँ',
        objective: 'Post a depreciation adjusting voucher, close the financial year as Checker, and inspect the auto-generated Trial Balance & P&L.',
        hints: ['All pending vouchers must be verified or sent back before year-end closing transfers Revenue and Expense heads into Capital.'],
        whatIfPrompt: 'Inspect the Closing Entry generated by the engine to see every nominal account zeroed out for the new year.',
      },
      {
        tier: 'MASTER',
        title: 'Electronic Spreadsheet Formula Grid',
        titleHi: 'इलेक्ट्रॉनिक स्प्रेडशीट सूत्र तालिका',
        objective: 'Switch to the Spreadsheet Visualiser and verify live `=PMT`, `=SLN`, ratio, and BRS cell formulas against exact engine values.',
        hints: [],
        whatIfPrompt: 'Change loan interest rate or asset useful life in cell B2/B3 and watch every dependent row recalculate.',
      },
    ],
  },
];

export const SIM_ACHIEVEMENT_BADGES: readonly SimAchievementBadge[] = [
  {
    id: 'sim-xi-process',
    title: 'Class XI Accounting Process Explorer',
    titleHi: 'कक्षा 11 लेखांकन प्रक्रिया अन्वेषक',
    cls: 'XI',
    description: 'Complete at least one mission in Equation, Journal & Ledger, and Cash Book / BRS labs.',
    requiredSimIds: ['equation-lab', 'journal-ledger-lab', 'cashbook-brs-lab'],
  },
  {
    id: 'sim-xi-auditor',
    title: 'Class XI Sole-Proprietor Auditor',
    titleHi: 'कक्षा 11 एकल स्वामित्व लेखापरीक्षक',
    cls: 'XI',
    description: 'Complete at least one mission in Depreciation, Trial Balance & Error Detective, and Final Accounts Builder.',
    requiredSimIds: ['depreciation-lab', 'tb-error-lab', 'final-accounts-lab'],
  },
  {
    id: 'sim-xii-corporate',
    title: 'Class XII Partnership & Corporate Strategist',
    titleHi: 'कक्षा 12 साझेदारी एवं कंपनी रणनीतिकार',
    cls: 'XII',
    description: 'Complete at least one mission in both Partnership Simulator and Company Accounts Simulator.',
    requiredSimIds: ['partnership-lab', 'company-lab'],
  },
  {
    id: 'sim-xii-specialist',
    title: 'Class XII Route Specialist',
    titleHi: 'कक्षा 12 विकल्प विशेषज्ञ',
    cls: 'XII',
    description: 'Complete a mission in Financial Analysis Lab (Option I) or Computerised Accounting Lab (Option II).',
    requiredSimIds: ['financial-analysis-lab'],
  },
  {
    id: 'sim-challenge-ace',
    title: 'CBSE Simulator Challenge Ace',
    titleHi: 'सिम्युलेटर चुनौती विजेता',
    cls: 'ALL',
    description: 'Clear Challenge or Master tier in any 3 flagship simulators.',
    requiredSimIds: [],
    minDifficulty: 'CHALLENGE',
  },
];

export const coreSimById = (id: string): CoreSimulatorSpec | undefined => CORE_SIMULATORS.find(s => s.id === id);

/**Seen lab id used in IndexedDB `seen` store for a flagship simulator mission (`sim-core:<id>:<tier>`). */
export const coreSimMissionLabId = (id: CoreSimId, tier: SimDifficulty): string => `sim-core:${id}:${tier}`;

/**
 * Filter flagship simulators by Class XI / XII and Class XII syllabus route.
 * Note: Computerised Accounting Lab (J) is shown on Class XII Option II, and is ALSO surfaced
 * as an optional exposure card when `includeCasExposure` is true (since Class XI introduces CAS).
 */
export function coreSimulatorsFor(cls: ClassLevel, route: Exclude<Route, 'COMMON'> = 'OPTION_I_ANALYSIS', opts?: { readonly showAllRoutes?: boolean }): readonly CoreSimulatorSpec[] {
  return CORE_SIMULATORS.filter(s => {
    if (s.cls !== cls) return false;
    if (cls === 'XII' && !opts?.showAllRoutes && s.route !== 'COMMON' && s.route !== route) {
      return false;
    }
    return true;
  });
}

export interface CoreSimProgressSummary {
  readonly completedMissions: ReadonlySet<string>;
  readonly completedSims: ReadonlySet<CoreSimId>;
  readonly earnedBadges: readonly SimAchievementBadge[];
  readonly totalMissionsCompleted: number;
  readonly totalMissionsAvailable: number;
}

/** Pure derivation of simulator mission & badge progress from existing `Seen[]` records. */
export function summariseCoreSimProgress(seenList: readonly Seen[], route: Exclude<Route, 'COMMON'> = 'OPTION_I_ANALYSIS'): CoreSimProgressSummary {
  const completedMissions = new Set<string>();
  const completedSims = new Set<CoreSimId>();
  const challengeOrMasterSims = new Set<CoreSimId>();

  for (const s of seenList) {
    if (!s.lab.startsWith('sim-core:')) continue;
    const [, simId, tier] = s.lab.split(':') as [string, CoreSimId | undefined, SimDifficulty | undefined];
    if (!simId || !tier || !coreSimById(simId)) continue;
    completedMissions.add(`${simId}:${tier}`);
    completedSims.add(simId);
    if (tier === 'CHALLENGE' || tier === 'MASTER') {
      challengeOrMasterSims.add(simId);
    }
  }

  const earnedBadges = SIM_ACHIEVEMENT_BADGES.filter(b => {
    if (b.id === 'sim-xii-specialist') {
      return completedSims.has('financial-analysis-lab') || completedSims.has('computerised-accounting-lab');
    }
    if (b.id === 'sim-challenge-ace') {
      return challengeOrMasterSims.size >= 3;
    }
    return b.requiredSimIds.length > 0 && b.requiredSimIds.every(id => completedSims.has(id));
  });

  const visibleSims = [...coreSimulatorsFor('XI', route), ...coreSimulatorsFor('XII', route)];

  return {
    completedMissions,
    completedSims,
    earnedBadges,
    totalMissionsCompleted: completedMissions.size,
    totalMissionsAvailable: visibleSims.length * 4,
  };
}

/** Validates that every clause and unit on every flagship simulator belongs to the official CBSE 2026–27 matrix. */
export function validateCoreSimulatorCatalogue(): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  for (const sim of CORE_SIMULATORS) {
    if (seenIds.has(sim.id)) errors.push(`Duplicate simulator id: ${sim.id}`);
    seenIds.add(sim.id);
    const u = unitById(sim.unit);
    if (!u) errors.push(`${sim.id}: unknown unit ${sim.unit}`);
    else if (u.cls !== sim.cls) errors.push(`${sim.id}: unit ${sim.unit} is Class ${u.cls}, expected ${sim.cls}`);
    for (const c of sim.clauses) {
      const cl = clauseById(c);
      if (!cl) errors.push(`${sim.id}: unknown syllabus clause ${c}`);
    }
    if (sim.missions.length !== 4) errors.push(`${sim.id}: must declare exactly 4 progressive missions`);
  }
  return errors;
}
