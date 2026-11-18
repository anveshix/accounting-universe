/** Note bodies (paragraphs), loaded lazily so locked content is not rendered until unlocked. Add yours keyed by NoteItem.id. */
export const BODIES: Readonly<Record<string, readonly string[]>> = {
  'act-xi-equation': ['The accounting equation: Assets = Liabilities + Capital (Owner’s Equity).', 'Every transaction changes at least two items and keeps both sides equal. Example: starting business with ₹1,00,000 cash gives Assets (Cash) ₹1,00,000 = Capital ₹1,00,000.', 'Buying goods on credit for ₹20,000 raises Assets (Stock) and Liabilities (Creditors) by ₹20,000: the equation still balances.'],
  'act-xi-rules': ['Personal account: debit the receiver, credit the giver.', 'Real account: debit what comes in, credit what goes out.', 'Nominal account: debit expenses and losses, credit incomes and gains.'],
  'act-xii-admission': ['On admission the new partner brings capital and usually goodwill. Old partners share the sacrifice in the sacrificing ratio = old ratio − new ratio.', 'Assets and liabilities are revalued, and any gain or loss goes to the old partners in the old ratio.'],
  'bst-xi-business': ['Business is an economic activity carried on regularly to earn profit by producing or distributing goods and services.', 'Sample notes: replace this text with your own.'],
  'bst-xii-mgmt': ['Management is a continuous process of getting things done with and through people to achieve organisational goals effectively and efficiently.', 'Sample notes: replace this text with your own.'],
  'etp-xi-perspective': ['An entrepreneur identifies an opportunity and organises resources to turn it into a venture, bearing the risk.', 'Sample notes: replace this text with your own.'],
  'act-xi-equation-ppt': ['Slide 1: Define assets, liabilities, capital.', 'Slide 2–6: Six worked transactions, each showing the equation staying balanced.', 'Slide 7–12: Board-style practice questions.'],
  'act-xi-equation-lp': ['Objectives: students state the equation and analyse five transactions.', 'Period 1: concept + three worked transactions. Period 2: pair practice + exit ticket (two transactions).'],
};
export const PRO_PLACEHOLDER = ['Sample content: add this item’s full text in apps/web/src/notes-bodies.ts or attach a file in apps/web/public/notes/.'];
