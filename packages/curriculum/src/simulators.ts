/**
 * Chapter-wise visual simulators — the "show me" half of visual accounting.
 *
 * Each simulator is data plus one pure `compute()`: no DOM, no storage. The page in `apps/web/src/pages/simulators.ts`
 * knows only how to draw a `SimVisual`, so a new chapter costs one entry here and one test — not a new bespoke page.
 *
 * Design, per chapter: **need → picture → challenge → reward**
 *   need      `need` says why a student who can do the sum still gets this wrong
 *   picture   `compute()` returns bars, stats, notes and a table that change as the controls move
 *   challenge one question whose answer is visible in the picture (never a second, unrelated quiz)
 *   reward    the app awards first-seen XP, +10 XP per solved challenge and the "Visual Thinker" badge after five
 *
 * Money is exact: every rupee figure goes through `Money`/`mulRatio` with an explicit rounding mode. Bar `value`s are
 * geometry only (the same convention as `Block` in spec.ts); the exact figure is always a formatted string.
 */
import { Ledger, Money, starterChartClassXI, type RoundingMode, type Side } from '../../engine/src';
import { CLAUSES, UNITS } from './syllabus';

const HALF_UP: RoundingMode = 'HALF_UP';
const rupees = (n: number) => Money.rupees(n);
const pctOf = (base: Money, pct: number) => base.mulRatio(BigInt(pct), 100n, HALF_UP);

export type SimTone = 'base' | 'pos' | 'alt' | 'neg';
export interface SimBar {
  readonly label: string;
  /** Geometry only — the exact figure is `text`. May be negative (drawn below the baseline). */
  readonly value: number;
  readonly text: string;
  readonly tone?: SimTone;
}
export interface SimStat {
  readonly label: string;
  readonly value: string;
}
/** An extra working table under the picture (the picture stays the headline). */
export interface SimTable {
  readonly title: string;
  readonly head: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly foot?: readonly string[];
}
export interface SimVisual {
  readonly headline: string;
  readonly headlineNote: string;
  readonly bars: readonly SimBar[];
  readonly barUnit: string;
  readonly stats: readonly SimStat[];
  /** "What to notice" — two or three sentences, always about the picture above. */
  readonly notes: readonly string[];
  readonly table?: { readonly head: readonly string[]; readonly rows: readonly (readonly string[])[] };
  /** Additional tables, each in its own collapsible block (journal, ledger, trial balance…). */
  readonly tables?: readonly SimTable[];
  readonly caption: string;
}

export interface SimControl {
  readonly id: string;
  readonly label: string;
  readonly kind: 'range' | 'select';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly unit?: string;
  readonly options?: readonly { readonly value: string; readonly label: string }[];
  readonly help?: string;
}
export interface SimChallenge {
  readonly prompt: string;
  readonly options: readonly string[];
  readonly correct: number;
  readonly why: string;
}

export interface Simulator {
  readonly id: string;
  readonly cls: 'XI' | 'XII';
  /** Syllabus clause this belongs to; the gallery groups by its chapter (unit). */
  readonly clause: string;
  readonly title: string;
  /** Why this chapter needs a picture, in one sentence a student would recognise. */
  readonly need: string;
  readonly intro: string;
  readonly controls: readonly SimControl[];
  readonly defaults: Readonly<Record<string, number | string>>;
  readonly compute: (input: Readonly<Record<string, number | string>>) => SimVisual;
  readonly challenge: SimChallenge;
  /** A control this page can animate: the page shows ▶ Play and steps the control by its own `step`. */
  readonly play?: { readonly control: string; readonly everyMs?: number };
  /** Option name for Class XII analysis-only simulators. */
  readonly route?: 'OPTION_I_ANALYSIS' | 'OPTION_II_COMPUTERISED';
}

const n = (i: Readonly<Record<string, number | string>>, k: string, d: number) => {
  const v = i[k];
  return typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : d;
};
const inr = (m: Money) => m.format();

/* ───────────────────────── 1. Depreciation: SLM vs WDV (Class XI · Accounting Process) ───────────────────────── */

interface DepYear {
  readonly year: number;
  readonly slmOpen: Money;
  readonly slmDep: Money;
  readonly slmClose: Money;
  readonly wdvOpen: Money;
  readonly wdvDep: Money;
  readonly wdvClose: Money;
}

export function depreciationSchedule(cost: Money, ratePct: number, years: number): DepYear[] {
  const rows: DepYear[] = [];
  let slmOpen = cost,
    wdvOpen = cost;
  const slmDep = pctOf(cost, ratePct);
  for (let y = 1; y <= years; y++) {
    const wdvDep = pctOf(wdvOpen, ratePct);
    const slmClose = slmOpen.sub(slmDep).paise < 0n ? Money.ZERO : slmOpen.sub(slmDep);
    const wdvClose = wdvOpen.sub(wdvDep);
    rows.push({ year: y, slmOpen, slmDep, slmClose, wdvOpen, wdvDep, wdvClose });
    slmOpen = slmClose;
    wdvOpen = wdvClose;
  }
  return rows;
}

const depreciation: Simulator = {
  id: 'sim-depreciation',
  cls: 'XI',
  clause: 'XI.2.depreciation',
  title: 'Depreciation: two methods, one asset',
  need: 'Students can apply both formulas and still not see why a business chooses one — the shape of the fall is the lesson.',
  intro: 'A machine bought for the cost below, depreciated at the same rate by both methods. Move the years slider: SLM falls in a straight line, WDV falls fast and then flattens.',
  controls: [
    { id: 'cost', label: 'Cost of the asset', kind: 'range', min: 50000, max: 500000, step: 10000, unit: '₹' },
    {
      id: 'rate',
      label: 'Rate per year',
      kind: 'select',
      options: [
        { value: '5', label: '5%' },
        { value: '10', label: '10%' },
        { value: '15', label: '15%' },
        { value: '20', label: '20%' },
      ],
    },
    { id: 'years', label: 'Years completed', kind: 'range', min: 1, max: 8, step: 1, unit: 'yr' },
  ],
  defaults: { cost: 100000, rate: '10', years: 3 },
  compute: input => {
    const cost = rupees(n(input, 'cost', 100000));
    const rate = n(input, 'rate', 10);
    const years = Math.max(1, Math.min(8, n(input, 'years', 3)));
    const rows = depreciationSchedule(cost, rate, years);
    const last = rows[rows.length - 1]!;
    const totalSlm = last.slmOpen.sub(last.slmClose).add(rows.slice(0, -1).reduce((a, r) => a.add(r.slmDep), Money.ZERO));
    const totalWdv = cost.sub(last.wdvClose);
    return {
      headline: inr(last.slmClose),
      headlineNote: `book value after ${years} year${years === 1 ? '' : 's'} on the straight-line method`,
      barUnit: 'book value',
      bars: [
        { label: 'Cost', value: Number(cost.paise / 100n), text: inr(cost), tone: 'base' },
        ...rows.map(r => ({ label: `SLM ${r.year}`, value: Number(r.slmClose.paise / 100n), text: inr(r.slmClose), tone: 'pos' as const })),
        ...rows.map(r => ({ label: `WDV ${r.year}`, value: Number(r.wdvClose.paise / 100n), text: inr(r.wdvClose), tone: 'alt' as const })),
      ],
      stats: [
        { label: 'SLM charge this year', value: inr(last.slmDep) },
        { label: 'WDV charge this year', value: inr(last.wdvDep) },
        { label: 'WDV book value', value: inr(last.wdvClose) },
        { label: 'Total WDV charged', value: inr(totalWdv) },
        { label: 'Total SLM charged', value: inr(totalSlm) },
      ],
      notes: [
        'Straight line charges the same rupee amount each year, so book value is a straight staircase down.',
        'Written down value charges a percentage of what is left, so the first years carry the heaviest charge — that is why WDV suits assets that lose value quickly.',
        'The two methods disagree in any given year — and at a 10% rate the WDV balance is still ABOVE the SLM balance after three years. Read which year the question asks about before you answer.',
      ],
      table: {
        head: ['Year', 'SLM opening', 'SLM charge', 'SLM closing', 'WDV opening', 'WDV charge', 'WDV closing'],
        rows: rows.map(r => [String(r.year), inr(r.slmOpen), inr(r.slmDep), inr(r.slmClose), inr(r.wdvOpen), inr(r.wdvDep), inr(r.wdvClose)]),
      },
      caption: `₹${rate}% per year · ${years} year${years === 1 ? '' : 's'} · rounded to the rupee (HALF_UP)`,
    };
  },
  challenge: {
    prompt: 'At 10% a year on ₹1,00,000, which method shows the HIGHER book value after 3 years?',
    options: ['Straight line (SLM)', 'Written down value (WDV)', 'They are always equal'],
    correct: 1,
    why: 'SLM charges ₹10,000 every year — ₹30,000 in all — leaving ₹70,000. WDV charges 10% of a shrinking balance (₹10,000, then ₹9,000, then ₹8,100), only ₹27,100 in all, so ₹72,900 remains. WDV keeps a HIGHER book value early on precisely because each year’s charge falls; later the two curves cross.',
  },
};

/* ───────────────────────── 2. Bank reconciliation: why two balances disagree (XI · Accounting Process) ───────────────────────── */

export interface BrsStep {
  readonly label: string;
  readonly effect: Money;
  readonly why: string;
}
export const BRS_STEPS: readonly BrsStep[] = [
  { label: 'Cheque issued but not yet presented', effect: rupees(5000), why: 'You have already reduced the cash book; the bank has not paid it yet, so the pass book is higher.' },
  { label: 'Cheque deposited but not yet cleared', effect: rupees(-7000), why: 'You have added it to the cash book; the bank has not credited it yet, so the pass book is lower.' },
  { label: 'Bank charges not entered in the cash book', effect: rupees(-300), why: 'The bank has taken the money but your cash book does not know yet.' },
  { label: 'Interest credited by the bank, not in your books', effect: rupees(1200), why: 'The bank added money you have not recorded.' },
];

export function brsBalance(start: Money, steps: number): Money {
  return BRS_STEPS.slice(0, Math.max(0, Math.min(BRS_STEPS.length, steps))).reduce((b, x) => b.add(x.effect), start);
}

const brs: Simulator = {
  id: 'sim-brs',
  cls: 'XI',
  clause: 'XI.2.brs',
  title: 'Bank reconciliation: walk the balance across',
  need: 'The direction of each adjustment is the whole question, and a list of items teaches direction badly.',
  intro: 'Start from the cash book balance and apply the four reconciling items one at a time. Watch the balance step toward the pass book.',
  controls: [{ id: 'steps', label: 'Items applied', kind: 'range', min: 0, max: BRS_STEPS.length, step: 1 }],
  defaults: { steps: 4 },
  compute: input => {
    const steps = Math.max(0, Math.min(BRS_STEPS.length, n(input, 'steps', 4)));
    const start = rupees(40000);
    const running: { label: string; balance: Money }[] = [{ label: 'Cash book', balance: start }];
    for (const x of BRS_STEPS.slice(0, steps)) running.push({ label: x.label, balance: running[running.length - 1]!.balance.add(x.effect) });
    const end = running[running.length - 1]!.balance;
    return {
      headline: inr(end),
      headlineNote: steps === BRS_STEPS.length ? 'balance as per the pass book — every item applied' : `running balance after ${steps} of ${BRS_STEPS.length} items`,
      barUnit: 'balance',
      bars: running.map((r, i) => ({
        label: i === 0 ? 'Cash book' : `+ item ${i}`,
        value: Number(r.balance.paise / 100n),
        text: inr(r.balance),
        tone: (i === 0 ? 'base' : i === running.length - 1 && steps === BRS_STEPS.length ? 'alt' : 'pos') as SimTone,
      })),
      stats: [
        { label: 'Cash book balance', value: inr(start) },
        { label: 'Pass book balance', value: inr(end) },
        { label: 'Difference', value: inr(end.sub(start)) },
        ...BRS_STEPS.map((x, i) => ({ label: `${i + 1}. ${x.label}`, value: inr(x.effect) })),
      ],
      notes: [
        'Work from ONE balance to the other, and never change direction halfway: every item is described from the point of view of the cash book you started with.',
        'A cheque you issued but nobody has presented means the bank still shows the money — add it back to your cash book to reach the pass book.',
        'A cheque you deposited that has not cleared is the mirror image: subtract it.',
      ],
      table: {
        head: ['Step', 'Item', 'Effect', 'Running balance'],
        rows: running.map((r, i) => [String(i), r.label, i === 0 ? '—' : inr(BRS_STEPS[i - 1]!.effect), inr(r.balance)]),
      },
      caption: 'Starting point: cash book ₹40,000 (Dr) · items applied in the order shown',
    };
  },
  challenge: {
    prompt: 'You issued a cheque that the bank has not yet paid. To go from YOUR cash book to the PASS BOOK you should:',
    options: ['Add it to the cash book balance', 'Subtract it from the cash book balance', 'Ignore it — it is already recorded'],
    correct: 0,
    why: 'Your cash book already reduced by the cheque, but the bank has not paid it, so the bank still holds more. Add it back to reach the pass book — the same item is subtracted when you start from the pass book.',
  },
};

/* ───────────────────────── 3. Trading → P&L ladder (XI · Financial Statements) ───────────────────────── */

const trading: Simulator = {
  id: 'sim-trading-pl',
  cls: 'XI',
  clause: 'XI.3.trading-pl',
  title: 'Trading to P&L: the profit ladder',
  need: 'Gross profit, operating profit and net profit are three different numbers, and students quote the wrong one in the wrong sentence.',
  intro: 'Move sales, the gross margin and operating expenses. The ladder shows exactly where each profit is created and what is subtracted between the rungs.',
  controls: [
    { id: 'sales', label: 'Net sales', kind: 'range', min: 200000, max: 2000000, step: 50000, unit: '₹' },
    {
      id: 'margin',
      label: 'Gross margin',
      kind: 'select',
      options: [
        { value: '20', label: '20%' },
        { value: '25', label: '25%' },
        { value: '30', label: '30%' },
        { value: '40', label: '40%' },
      ],
    },
    { id: 'opex', label: 'Operating expenses', kind: 'range', min: 0, max: 600000, step: 10000, unit: '₹' },
  ],
  defaults: { sales: 800000, margin: '25', opex: 120000 },
  compute: input => {
    const sales = rupees(n(input, 'sales', 800000));
    const margin = n(input, 'margin', 25);
    const opex = rupees(n(input, 'opex', 120000));
    const gp = pctOf(sales, margin);
    const cogs = sales.sub(gp);
    const net = gp.sub(opex);
    const gpPct = Math.round((100 * Number(gp.paise)) / Number(sales.paise));
    const npPct = Math.round((100 * Number(net.paise)) / Number(sales.paise));
    const tax = net.paise > 0n ? pctOf(net, 25) : Money.ZERO;
    return {
      headline: inr(net),
      headlineNote: `net profit on sales of ${inr(sales)} — ${npPct}% of sales`,
      barUnit: 'amount',
      bars: [
        { label: 'Sales', value: Number(sales.paise / 100n), text: inr(sales), tone: 'base' },
        { label: 'Cost of goods sold', value: Number(cogs.paise / 100n), text: inr(cogs), tone: 'neg' },
        { label: 'Gross profit', value: Number(gp.paise / 100n), text: inr(gp), tone: 'pos' },
        { label: 'Operating expenses', value: Number(opex.paise / 100n), text: inr(opex), tone: 'neg' },
        { label: 'Net profit (before tax)', value: Number(net.paise / 100n), text: inr(net), tone: 'alt' },
        { label: 'Tax at 25% (illustrative)', value: Number(tax.paise / 100n), text: inr(tax), tone: 'neg' },
      ],
      stats: [
        { label: 'Gross profit ratio', value: `${gpPct}%` },
        { label: 'Net profit ratio', value: `${npPct}%` },
        { label: 'Cost of goods sold', value: inr(cogs) },
        { label: 'Profit after illustrative tax', value: inr(net.sub(tax)) },
      ],
      notes: [
        'Gross profit is a trading number: sales minus the cost of the goods sold. No rent, no salary, no interest in it.',
        'Operating profit subtracts the running expenses of the business; net profit is after everything the question asks for.',
        'The ratios are the same ladder expressed as percentages, which is why a bigger shop can have a smaller ratio and still earn more rupees.',
      ],
      caption: 'Illustrative tax at 25% is shown only to make the last rung concrete; the syllabus question decides the rate.',
    };
  },
  challenge: {
    prompt: 'Gross margin is 25% and net sales are ₹8,00,000. Gross profit is:',
    options: ['₹2,00,000', '₹6,00,000', '₹1,20,000'],
    correct: 0,
    why: '25% of ₹8,00,000 is ₹2,00,000. ₹6,00,000 is the COST of goods sold, and ₹1,20,000 is the operating expenses in the default picture — the two numbers students most often swap for gross profit.',
  },
};

/* ───────────────────────── 4. Admission of a partner: who owns what after (XII · Partnership) ───────────────────────── */

export function admissionSplit(oldA: number, oldB: number, newSharePct: number, newCapital: number): { a: number; b: number; c: number; total: number; sacrificeA: number; sacrificeB: number } {
  // Old ratio A:B = 3:2; the new partner's share is carved out of it in that ratio.
  const totalOld = oldA + oldB;
  const sacrifice = newSharePct / 100;
  return {
    a: oldA,
    b: oldB,
    c: newCapital,
    total: totalOld + newCapital,
    sacrificeA: Math.round(sacrifice * (3 / 5) * 100),
    sacrificeB: Math.round(sacrifice * (2 / 5) * 100),
  };
}

const admission: Simulator = {
  id: 'sim-admission',
  cls: 'XII',
  clause: 'XII.1.admission',
  title: 'Admission of a partner: the capital picture',
  need: 'The journal entries can be memorised while the ownership arithmetic stays invisible — who gave up what, and how much capital the firm now has.',
  intro: 'Two partners share 3:2. Choose the new partner’s share and capital: the bars show each partner’s capital before and after, and the share the old partners gave up.',
  controls: [
    {
      id: 'share',
      label: 'New partner’s share',
      kind: 'select',
      options: [
        { value: '20', label: '1/5 (20%)' },
        { value: '25', label: '1/4 (25%)' },
        { value: '33', label: '1/3 (33⅓%)' },
      ],
    },
    { id: 'capital', label: 'Capital brought by the new partner', kind: 'range', min: 50000, max: 400000, step: 25000, unit: '₹' },
    { id: 'a', label: 'A’s capital now', kind: 'range', min: 100000, max: 400000, step: 25000, unit: '₹' },
  ],
  defaults: { share: '25', capital: 100000, a: 180000 },
  compute: input => {
    const share = n(input, 'share', 25);
    const capital = n(input, 'capital', 100000);
    const a = n(input, 'a', 180000);
    const b = Math.round((a * 2) / 3); // B keeps the same 3:2 relationship before admission
    const r = admissionSplit(a, b, share, capital);
    return {
      headline: `${share}%`,
      headlineNote: `the share the new partner takes; the old partners give it up in 3:2`,
      barUnit: 'capital',
      bars: [
        { label: 'A before', value: r.a, text: inr(rupees(r.a)), tone: 'base' },
        { label: 'B before', value: r.b, text: inr(rupees(r.b)), tone: 'base' },
        { label: 'A after', value: r.a, text: inr(rupees(r.a)), tone: 'pos' },
        { label: 'B after', value: r.b, text: inr(rupees(r.b)), tone: 'pos' },
        { label: 'C (new)', value: r.c, text: inr(rupees(r.c)), tone: 'alt' },
        { label: 'Firm total', value: r.total, text: inr(rupees(r.total)), tone: 'base' },
      ],
      stats: [
        { label: 'Old partners’ capital', value: inr(rupees(r.a + r.b)) },
        { label: 'New partner’s capital', value: inr(rupees(r.c)) },
        { label: 'Firm capital after admission', value: inr(rupees(r.total)) },
        { label: 'A gives up', value: `${r.sacrificeA}% of the firm` },
        { label: 'B gives up', value: `${r.sacrificeB}% of the firm` },
      ],
      notes: [
        'The new partner’s capital does not change the old partners’ balances by itself — it is added to the firm. Revaluation and goodwill are separate adjustments.',
        'The old partners’ sacrifice is carved out in their OLD ratio (3:2), not in the new one. That is the step most often reversed.',
        'Adding a partner who brings ₹1,00,000 for 25% implies a firm worth ₹4,00,000 on the capitalisation basis — the picture makes that implication visible.',
      ],
      caption: 'Old ratio 3:2 · capital before admission taken from the sliders, not from a balance sheet',
    };
  },
  challenge: {
    prompt: 'A and B share 3:2. C joins for a 1/4 share. What do A and B give up, and in what ratio?',
    options: ['1/4 in the ratio 3:2', '1/4 equally', '1/3 in the ratio 3:2'],
    correct: 0,
    why: 'C’s whole share (1/4) is taken from the old partners in their OLD profit-sharing ratio, 3:2 — so A gives up 3/20 and B 2/20. Using the new ratio, or splitting equally, is the classic slip.',
  },
};

/* ───────────────────────── 5. Issue of shares: where the money lands (XII · Companies) ───────────────────────── */

const shares: Simulator = {
  id: 'sim-shares',
  cls: 'XII',
  clause: 'XII.2.issue',
  title: 'Issue of shares: applications, allotment, calls',
  need: 'Oversubscription is a queue, not a formula; until a student sees the applications sorted into allotments and refunds, pro-rata stays abstract.',
  intro: 'Choose the shares offered and how heavily the issue is oversubscribed. The bars show applications received, money kept, shares allotted and the refund that leaves.',
  controls: [
    { id: 'offered', label: 'Shares offered', kind: 'range', min: 10000, max: 50000, step: 5000, unit: 'shares' },
    {
      id: 'apply',
      label: 'Application money per share',
      kind: 'select',
      options: [
        { value: '2', label: '₹2' },
        { value: '3', label: '₹3' },
        { value: '5', label: '₹5' },
      ],
    },
    {
      id: 'demand',
      label: 'Times oversubscribed',
      kind: 'select',
      options: [
        { value: '1', label: '1× (exactly subscribed)' },
        { value: '1.25', label: '1.25×' },
        { value: '2', label: '2×' },
        { value: '4', label: '4×' },
      ],
    },
    { id: 'allot', label: 'Allotment money per share', kind: 'range', min: 0, max: 8, step: 1, unit: '₹' },
  ],
  defaults: { offered: 20000, apply: '3', demand: '2', allot: 4 },
  compute: input => {
    const offered = n(input, 'offered', 20000);
    const applyMoney = n(input, 'apply', 3);
    const demand = n(input, 'demand', 2);
    const allotMoney = n(input, 'allot', 4);
    const applied = Math.round(offered * demand);
    const refundShares = applied - offered;
    const appReceived = rupees(applied * applyMoney);
    const appKept = rupees(offered * applyMoney);
    const refunded = rupees(refundShares * applyMoney);
    const allotDue = rupees(offered * allotMoney);
    const ratio = demand === 1 ? 'all applications accepted' : `${Math.round(applied / offered)} applied for every 1 allotted`;
    return {
      headline: inr(appKept),
      headlineNote: `application money kept from ${applied.toLocaleString('en-IN')} shares applied for`,
      barUnit: 'money',
      bars: [
        { label: 'Applications', value: Number(appReceived.paise / 100n), text: inr(appReceived), tone: 'base' },
        { label: 'Kept on application', value: Number(appKept.paise / 100n), text: inr(appKept), tone: 'pos' },
        { label: 'Refunded', value: Number(refunded.paise / 100n), text: inr(refunded), tone: 'neg' },
        { label: 'Allotment due', value: Number(allotDue.paise / 100n), text: inr(allotDue), tone: 'alt' },
        { label: 'Total called up', value: Number(appKept.add(allotDue).paise / 100n), text: inr(appKept.add(allotDue)), tone: 'base' },
      ],
      stats: [
        { label: 'Shares offered', value: offered.toLocaleString('en-IN') },
        { label: 'Shares applied for', value: applied.toLocaleString('en-IN') },
        { label: 'Oversubscription', value: `${demand}×` },
        { label: 'Allotment pattern', value: ratio },
        { label: 'Money refunded', value: inr(refunded) },
      ],
      notes: [
        'Oversubscription is dealt with by pro-rata allotment: every applicant gets the same fraction of the shares applied for, and the rest of the application money goes back.',
        'Application money is a liability until shares are allotted; only the allotment portion becomes share capital, and the refund leaves the bank.',
        'A calls-in-arrears figure is a different animal: it is money CALLED but not received, not money refunded.',
      ],
      caption: 'Par value ₹10 · shares allotted pro-rata · no premium, no calls in arrears or advance',
    };
  },
  challenge: {
    prompt: '20,000 shares are offered and 40,000 are applied for. You applied for 200 shares. Under pro-rata allotment you get:',
    options: ['100 shares', '200 shares', '50 shares'],
    correct: 0,
    why: 'The issue is 2× oversubscribed, so every applicant is allotted half of what they applied for: 200 → 100. The application money on the other 100 shares is refunded.',
  },
};

/* ───────────────────────── 6. Cash flow: from profit to cash (XII · Cash Flow, Option I) ───────────────────────── */

const cashflow: Simulator = {
  id: 'sim-cashflow',
  cls: 'XII',
  clause: 'XII.4.preparation',
  route: 'OPTION_I_ANALYSIS',
  title: 'Cash flow: profit is not cash',
  need: 'Students add back depreciation by rote and then subtract it again elsewhere; the bridge from profit to cash has to be seen once.',
  intro: 'Start from net profit and add back the non-cash and working-capital movements. The bars build the operating, investing and financing streams into the year’s net change in cash.',
  controls: [
    { id: 'profit', label: 'Net profit before tax', kind: 'range', min: 100000, max: 1000000, step: 50000, unit: '₹' },
    { id: 'dep', label: 'Depreciation charged', kind: 'range', min: 0, max: 200000, step: 10000, unit: '₹' },
    { id: 'debtors', label: 'Increase in debtors', kind: 'range', min: 0, max: 200000, step: 10000, unit: '₹' },
    { id: 'machinery', label: 'Machinery purchased', kind: 'range', min: 0, max: 500000, step: 25000, unit: '₹' },
    { id: 'loan', label: 'Loan raised', kind: 'range', min: 0, max: 300000, step: 25000, unit: '₹' },
  ],
  defaults: { profit: 500000, dep: 50000, debtors: 30000, machinery: 200000, loan: 100000 },
  compute: input => {
    const profit = rupees(n(input, 'profit', 500000));
    const dep = rupees(n(input, 'dep', 50000));
    const debtors = rupees(n(input, 'debtors', 30000));
    const machinery = rupees(n(input, 'machinery', 200000));
    const loan = rupees(n(input, 'loan', 100000));
    const operating = profit.add(dep).sub(debtors);
    const investing = machinery.neg();
    const financing = loan;
    const net = operating.add(investing).add(financing);
    const arrow = (m: Money) => (m.paise < 0n ? 'outflow' : 'inflow');
    return {
      headline: inr(net),
      headlineNote: 'net increase in cash and cash equivalents for the year',
      barUnit: 'cash',
      bars: [
        { label: 'Net profit', value: Number(profit.paise / 100n), text: inr(profit), tone: 'base' },
        { label: '+ Depreciation', value: Number(dep.paise / 100n), text: inr(dep), tone: 'pos' },
        { label: '− Debtors up', value: -Number(debtors.paise / 100n), text: inr(debtors), tone: 'neg' },
        { label: '= Operating', value: Number(operating.paise / 100n), text: inr(operating), tone: 'alt' },
        { label: 'Investing', value: Number(investing.paise / 100n), text: inr(investing), tone: 'neg' },
        { label: 'Financing', value: Number(financing.paise / 100n), text: inr(financing), tone: 'pos' },
        { label: 'Net change', value: Number(net.paise / 100n), text: inr(net), tone: 'alt' },
      ],
      stats: [
        { label: 'Operating activities', value: `${inr(operating)} (${arrow(operating)})` },
        { label: 'Investing activities', value: `${inr(investing)} (${arrow(investing)})` },
        { label: 'Financing activities', value: `${inr(financing)} (${arrow(financing)})` },
        { label: 'Net change in cash', value: inr(net) },
      ],
      notes: [
        'Depreciation is added back because it reduced profit without using any cash in the year.',
        'An increase in debtors is subtracted: sales were made, but the cash has not arrived.',
        'Buying machinery is cash used in investing — it never appears in the operating stream, however necessary it is for trading.',
      ],
      caption: 'Indirect method, AS 3 (Revised) · tax ignored · one movement per stream, to keep the bridge readable',
    };
  },
  challenge: {
    prompt: 'Why is depreciation ADDED back when calculating cash from operations?',
    options: ['It reduced profit but did not use cash in the year', 'It is a cash payment made to the bank', 'Because it is an investing activity'],
    correct: 0,
    why: 'Depreciation is a book charge: profit was reduced, but no cash left the business for it. Adding it back cancels that non-cash deduction. Buying the asset was the cash outflow — and that belongs to investing, when it happened.',
  },
};

/* ───────────────────────── 7. Liquidity ratios: the same numbers, two verdicts (XII · Analysis) ───────────────────────── */

const ratios: Simulator = {
  id: 'sim-ratios',
  cls: 'XII',
  clause: 'XII.3.liquidity',
  route: 'OPTION_I_ANALYSIS',
  title: 'Current and quick ratio: is 2:1 really good?',
  need: 'Students memorise “2:1 is ideal” and then panic at a 1.5 that is perfectly healthy for a shop with little stock.',
  intro: 'Change current assets, current liabilities and stock. The gauges show the two ratios and whether the business can pay the next year’s bills without selling stock.',
  controls: [
    { id: 'assets', label: 'Current assets', kind: 'range', min: 100000, max: 2000000, step: 50000, unit: '₹' },
    { id: 'liabilities', label: 'Current liabilities', kind: 'range', min: 50000, max: 1200000, step: 25000, unit: '₹' },
    { id: 'stock', label: 'Stock inside current assets', kind: 'range', min: 0, max: 900000, step: 25000, unit: '₹' },
  ],
  defaults: { assets: 600000, liabilities: 300000, stock: 150000 },
  compute: input => {
    const assets = n(input, 'assets', 600000);
    const liabilities = n(input, 'liabilities', 300000);
    const stock = Math.min(n(input, 'stock', 150000), assets);
    const current = liabilities === 0 ? 0 : assets / liabilities;
    const quick = liabilities === 0 ? 0 : (assets - stock) / liabilities;
    const verdict = (r: number) => (r >= 2 ? 'comfortable' : r >= 1 ? 'workable' : 'thin');
    return {
      headline: `${current.toFixed(2)} : 1`,
      headlineNote: `current ratio — ${verdict(current)} · quick ratio ${quick.toFixed(2)} : 1 (${verdict(quick)})`,
      barUnit: 'rupees',
      bars: [
        { label: 'Current assets', value: assets, text: inr(rupees(assets)), tone: 'base' },
        { label: 'Stock', value: stock, text: inr(rupees(stock)), tone: 'neg' },
        { label: 'Quick assets', value: assets - stock, text: inr(rupees(assets - stock)), tone: 'pos' },
        { label: 'Current liabilities', value: liabilities, text: inr(rupees(liabilities)), tone: 'alt' },
      ],
      stats: [
        { label: 'Current ratio', value: `${current.toFixed(2)} : 1` },
        { label: 'Quick ratio', value: `${quick.toFixed(2)} : 1` },
        { label: 'Working capital', value: inr(rupees(assets - liabilities)) },
        { label: 'Stock as % of current assets', value: `${assets === 0 ? 0 : Math.round((100 * stock) / assets)}%` },
      ],
      notes: [
        'Both ratios use the same liabilities. The quick ratio simply removes stock, the one current asset you cannot rely on turning into cash quickly.',
        'A high current ratio built out of unsold stock is a warning, not a comfort — watch the gap between the two ratios.',
        '“Ideal 2:1” is a textbook benchmark for a trading business; a service business with no stock can be healthy far below it.',
      ],
      caption: 'Ratios are pure numbers; rupee figures are shown through the exact money type',
    };
  },
  challenge: {
    prompt: 'Current assets ₹6,00,000, stock ₹1,50,000, current liabilities ₹3,00,000. The quick ratio is:',
    options: ['1.5 : 1', '2 : 1', '0.5 : 1'],
    correct: 0,
    why: 'Quick assets are ₹6,00,000 − ₹1,50,000 = ₹4,50,000, so ₹4,50,000 ÷ ₹3,00,000 = 1.5 : 1. The 2 : 1 figure is the current ratio, before stock is removed.',
  },
};

/* ───────────────────────── 8. The accounting cycle: entry → journal → ledger → trial balance (XI · Accounting Process) ───────────────────────── */

export interface CycleEntry {
  readonly narration: string;
  /** Why THIS account is debited and THAT one credited — the rule, in the words a student can reuse. */
  readonly rule: string;
  readonly lines: readonly { readonly accountId: string; readonly side: Side; readonly rupees: number }[];
}

/** Ravi's first week: seven ordinary entries, the same ones the guided ledger tour posts. */
export const CYCLE_STEPS: readonly CycleEntry[] = [
  {
    narration: 'Ravi starts the business with ₹1,00,000 cash',
    rule: 'Cash — an asset — comes IN, so it is debited; the owner’s claim (capital) goes UP, so it is credited.',
    lines: [
      { accountId: 'cash', side: 'DR', rupees: 100000 },
      { accountId: 'capital', side: 'CR', rupees: 100000 },
    ],
  },
  {
    narration: 'Bought machinery for cash ₹30,000',
    rule: 'One asset goes up (machinery → debit) and another goes down (cash → credit).',
    lines: [
      { accountId: 'machinery', side: 'DR', rupees: 30000 },
      { accountId: 'cash', side: 'CR', rupees: 30000 },
    ],
  },
  {
    narration: 'Bought goods on credit ₹20,000',
    rule: 'Purchases is an expense → debit; the obligation to pay (creditors, a liability) → credit.',
    lines: [
      { accountId: 'purchases', side: 'DR', rupees: 20000 },
      { accountId: 'creditors', side: 'CR', rupees: 20000 },
    ],
  },
  {
    narration: 'Sold goods for cash ₹35,000',
    rule: 'Cash comes in → debit; sales (revenue) goes up → credit.',
    lines: [
      { accountId: 'cash', side: 'DR', rupees: 35000 },
      { accountId: 'sales', side: 'CR', rupees: 35000 },
    ],
  },
  {
    narration: 'Paid rent ₹5,000',
    rule: 'Rent is an expense → debit; cash leaves → credit.',
    lines: [
      { accountId: 'rent', side: 'DR', rupees: 5000 },
      { accountId: 'cash', side: 'CR', rupees: 5000 },
    ],
  },
  {
    narration: 'Ravi withdrew ₹3,000 for personal use',
    rule: 'Drawings reduce the owner’s capital → debit; cash paid out → credit.',
    lines: [
      { accountId: 'drawings', side: 'DR', rupees: 3000 },
      { accountId: 'cash', side: 'CR', rupees: 3000 },
    ],
  },
  {
    narration: 'Paid creditors ₹10,000',
    rule: 'A liability is reduced → debit; cash is reduced → credit.',
    lines: [
      { accountId: 'creditors', side: 'DR', rupees: 10000 },
      { accountId: 'cash', side: 'CR', rupees: 10000 },
    ],
  },
];

/**
 * Post the first `steps` entries of the cycle into the real ledger engine.
 * Pure: the same number always gives the same books, so the page, the tests and the exam answer agree.
 */
export function cycleBooks(steps: number) {
  const chart = starterChartClassXI();
  const ledger = new Ledger(chart);
  const posted = Math.max(0, Math.min(CYCLE_STEPS.length, Math.floor(steps) || 0));
  for (let i = 0; i < posted; i++) {
    const s = CYCLE_STEPS[i]!;
    ledger.post({
      date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      narration: s.narration,
      lines: s.lines.map(l => ({ accountId: l.accountId, side: l.side, amount: rupees(l.rupees) })),
    });
  }
  return { chart, ledger, posted };
}

const cycle: Simulator = {
  id: 'sim-cycle',
  cls: 'XI',
  clause: 'XI.2.journal',
  title: 'The accounting cycle: entry → journal → ledger → trial balance',
  need: 'The journal, the ledger and the trial balance are taught in three chapters, so students never see that they are one motion — press Play and watch the same seven entries arrive in all three books.',
  intro:
    'Ravi’s first week, one entry at a time. Each press posts a complete double entry: it appears in the journal, moves into the ledger account by account, and lands in the trial balance. The totals agree at every single step — and that is the whole point.',
  controls: [{ id: 'steps', label: 'Entries posted', kind: 'range', min: 0, max: CYCLE_STEPS.length, step: 1 }],
  defaults: { steps: 0 },
  play: { control: 'steps', everyMs: 1500 },
  compute: input => {
    const { ledger, chart, posted } = cycleBooks(n(input, 'steps', 0));
    const tb = ledger.trialBalance();
    const entries = ledger.entries();
    const last = posted > 0 ? CYCLE_STEPS[posted - 1]! : null;
    const tone = (t: string): SimTone => (t === 'ASSET' ? 'pos' : t === 'LIABILITY' || t === 'REVENUE' ? 'alt' : t === 'CAPITAL' ? 'base' : 'neg');
    const bars = tb.rows.map(r => {
      const amount = r.debit.isZero() ? r.credit : r.debit;
      return { label: r.account.name, value: Number(amount.paise / 100n), text: `${amount.format()} ${r.debit.isZero() ? 'Cr' : 'Dr'}`, tone: tone(r.account.type) };
    });
    const journalRows = entries.flatMap(e => [
      ...[...e.lines.filter(l => l.side === 'DR'), ...e.lines.filter(l => l.side === 'CR')].map((l, i) => [
        i === 0 ? e.id : '',
        i === 0 ? e.date : '',
        `${l.side === 'CR' ? 'To ' : 'Dr '}${chart.get(l.accountId).name}`,
        l.side === 'DR' ? l.amount.format() : '',
        l.side === 'CR' ? l.amount.format() : '',
      ]),
      ['', '', `(${e.narration})`, '', ''],
    ]);
    const ledgerRows = tb.rows.map(r => {
      let dr = Money.ZERO,
        cr = Money.ZERO;
      for (const row of ledger.tAccount(r.account.id)) {
        if (row.side === 'DR') dr = dr.add(row.amount);
        else cr = cr.add(row.amount);
      }
      const net = ledger.balance(r.account.id);
      return [r.account.name, dr.isZero() ? '' : dr.format(), cr.isZero() ? '' : cr.format(), `${net.format()} ${net.isZero() ? '' : r.debit.isZero() ? 'Cr' : 'Dr'}`];
    });
    return {
      headline: posted === 0 ? 'The books are empty' : `${inr(tb.totalDebit)} Dr = ${inr(tb.totalCredit)} Cr`,
      headlineNote: posted === 0 ? 'press ▶ Play to post the first entry' : `trial balance after ${posted} of ${CYCLE_STEPS.length} entries — it agrees`,
      barUnit: 'balance',
      bars,
      stats: [
        { label: 'Entries posted', value: `${posted} of ${CYCLE_STEPS.length}` },
        { label: 'Accounts touched', value: String(tb.rows.length) },
        { label: 'Total debit', value: inr(tb.totalDebit) },
        { label: 'Total credit', value: inr(tb.totalCredit) },
        { label: 'Difference', value: inr(tb.totalDebit.sub(tb.totalCredit)) },
      ],
      notes: [
        'Every entry here has two sides of the same amount, which is why the two trial balance totals can never drift apart — the trial balance is not a check you pass, it is a consequence of double entry.',
        last ? `Last posted: “${last.narration}” — ${last.rule}` : 'Nothing has reached the books yet. Each Play step posts ONE complete entry, never half of one.',
        'The ledger is not a second set of books: it is the same entries regrouped account by account. The trial balance then lists each account’s closing balance once, on its own side.',
      ],
      tables: [
        {
          title: 'Journal — the entries as they were posted',
          head: ['No.', 'Date', 'Particulars', 'Dr (₹)', 'Cr (₹)'],
          rows: journalRows,
          foot: ['', '', 'Total', tb.totalDebit.format(), tb.totalCredit.format()],
        },
        { title: 'Ledger — the same entries, account by account', head: ['Account', 'Debit side', 'Credit side', 'Closing balance'], rows: ledgerRows },
        {
          title: 'Trial balance — closing balances in two columns',
          head: ['Account', 'Debit (₹)', 'Credit (₹)'],
          rows: tb.rows.map(r => [r.account.name, r.debit.isZero() ? '' : r.debit.format(), r.credit.isZero() ? '' : r.credit.format()]),
          foot: ['Total', tb.totalDebit.format(), tb.totalCredit.format()],
        },
      ],
      caption: 'Ravi’s first week · every figure comes from the real ledger engine · posted in journal order, never edited afterwards',
    };
  },
  challenge: {
    prompt: 'After all seven entries, which account has the LARGEST debit balance?',
    options: ['Cash', 'Machinery', 'Purchases'],
    correct: 0,
    why: 'Cash takes in ₹1,00,000 and ₹35,000, and pays out ₹30,000 + ₹5,000 + ₹3,000 + ₹10,000, leaving ₹87,000 — more than machinery’s ₹30,000 and purchases’ ₹20,000. Cash moves in every other line of the week, which is exactly why it is the account students must be able to rebuild from the journal.',
  },
};

export const SIMULATORS: readonly Simulator[] = [depreciation, brs, cycle, trading, admission, shares, cashflow, ratios];

export const simulatorById = (id: string): Simulator | undefined => SIMULATORS.find(x => x.id === id);
/** Which chapter (unit) a simulator belongs to, for the gallery headings. */
export const simChapter = (sim: Simulator) => {
  const clause = CLAUSES.find(c => c.id === sim.clause);
  return clause ? { unit: clause.unit, title: UNITS.find(u => u.id === clause.unit)?.title ?? clause.unit } : { unit: '?', title: 'Uncatalogued' };
};
/** Simulators grouped chapter by chapter, in syllabus order, filtered for a class and (Class XII) route. */
export function simulatorsByChapter(cls: 'XI' | 'XII', route: 'OPTION_I_ANALYSIS' | 'OPTION_II_COMPUTERISED' = 'OPTION_I_ANALYSIS') {
  const allowed = SIMULATORS.filter(x => x.cls === cls && (!x.route || x.route === route));
  const order = UNITS.filter(u => u.cls === cls).map(u => u.id);
  return order.map(unit => ({ unit, title: UNITS.find(u => u.id === unit)?.title ?? unit, sims: allowed.filter(x => simChapter(x).unit === unit) })).filter(g => g.sims.length > 0);
}

/** Seen-event lab id for a simulator: solved challenges use tab 'example', visits use 'try'. */
export const simLabId = (id: string) => `sim:${id}`;
