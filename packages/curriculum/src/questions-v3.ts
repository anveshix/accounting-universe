/**
 * V3: higher-order question formats, chapter by chapter.
 *  - STEP-WISE: one worked problem split into labelled steps, each step its own part (scaffolded, then the final figure).
 *  - CASE-BASED: a short scenario with several linked multiple-choice sub-questions whose options are computed (competency style).
 *  - ASSERTION-REASON: the standard four-option CBSE format; the correct option is DERIVED from the truth flags, never typed.
 * Every figure is integer arithmetic on the generated rupees. Oracles are in test/questions-v3.test.ts.
 */
import { Money } from '../../engine/src';
import type { Distractor, Gen, Part } from './questions';
import type { Rng } from './rng';

const M = (n: number) => Money.rupees(n), R = (n: number) => M(n).format().replace(/\.00$/, ''), A = (n: number) => M(n).toString();
const step = (label: string, n: number): Part => ({ label, kind: 'MONEY', answer: A(n), marks: 1 });
const dist = (part: number, n: number, mistake: string, fix: string): Distractor => ({ part, value: A(n), mistake, fix });
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
function shuffle<T>(r: Rng, xs: readonly T[]): T[] { const o = [...xs]; for (let i = o.length - 1; i > 0; i--) { const j = r.int(0, i), t = o[i]!; o[i] = o[j]!; o[j] = t; } return o; }
/** A multiple-choice part with a computed answer and up to three computed wrong values (padded so there are always four distinct options). */
function numChoice(r: Rng, label: string, correct: number, wrongs: readonly number[]): Part {
  const set = [correct]; for (const w of wrongs) if (w > 0 && !set.includes(w)) set.push(w);
  for (let k = 1; set.length < 4; k++) { const c = correct + k * 1000; if (!set.includes(c)) set.push(c); }
  return { label, kind: 'CHOICE', options: shuffle(r, set.slice(0, 4).map(R)), answer: R(correct), marks: 1 };
}
function textChoice(r: Rng, label: string, correct: string, wrongs: readonly [string, string, string]): Part {
  return { label, kind: 'CHOICE', options: shuffle(r, [correct, ...wrongs]), answer: correct, marks: 1 };
}
const HINTS_STEP = ['Do the steps in order: each step uses the result of the one before it.', 'Write the formula for each step first, then put the figures in.'];
const HINTS_CASE = ['Read the whole case once, then answer the sub-questions one at a time.', 'For each option ask which accounting rule or formula produces it, and which common mistake produces the others.'];

// ───────────────────────────── step-wise numerical problems ─────────────────────────────
const STEPWISE: Gen[] = [
  {
    skill: 'step-dep-sale', clause: 'XI.2.depreciation', title: 'Step-wise: depreciation and sale of an asset', typology: 'AP',
    make: r => {
      const c = r.multiple(100000, 500000, 50000), rate = r.pick([10, 20]), y = r.pick([2, 3, 4]), annual = (c * rate) / 100, acc = annual * y, bv = c - acc;
      const delta = bv > 30000 ? r.pick([-20000, -10000, 10000, 20000]) : r.pick([10000, 20000]), sp = bv + delta;
      return {
        stem: `A machine bought for ${R(c)} is depreciated by the Straight Line method at ${rate}% of cost per year (no scrap value). It is sold for ${R(sp)} at the end of year ${y}. Work out the profit or loss on sale step by step.`,
        parts: [step('Step 1: depreciation for one year', annual), step(`Step 2: accumulated depreciation after ${y} years`, acc), step('Step 3: book value on the date of sale', bv), step('Step 4: profit (+) or loss (−) on sale', delta)],
        hints: HINTS_STEP, working: [`Step 1: ${R(c)} × ${rate}% = ${R(annual)}`, `Step 2: ${R(annual)} × ${y} = ${R(acc)}`, `Step 3: ${R(c)} − ${R(acc)} = ${R(bv)}`, `Step 4: sale price ${R(sp)} − book value ${R(bv)} = ${R(delta)} (${delta > 0 ? 'profit' : 'loss'})`],
        distractors: [dist(3, -delta, 'You subtracted the other way round, so profit and loss are swapped.', 'Profit or loss on sale = sale price − book value.')],
      };
    },
  },
  {
    skill: 'step-admission-goodwill', clause: 'XII.1.admission', title: 'Step-wise: goodwill credited to old partners', typology: 'AP',
    make: r => {
      const [a, b] = r.pick([[3, 2], [2, 1], [3, 1], [4, 1]] as const), n = r.pick([4, 5]), g = r.multiple(60000, 300000, 60000), share = g / n;
      return {
        stem: `A and B share profits ${a} : ${b}. C is admitted for a 1/${n} share, which he takes from A and B in their old ratio. The goodwill of the firm is valued at ${R(g)}, and C brings his share of goodwill in cash. Work out the goodwill credited to each old partner.`,
        parts: [step('Step 1: C’s share of goodwill (premium brought in)', share), step('Step 2: credited to A’s capital account', (share * a) / (a + b)), step('Step 3: credited to B’s capital account', (share * b) / (a + b))],
        hints: HINTS_STEP, working: [`Step 1: ${R(g)} × 1/${n} = ${R(share)}`, `Step 2: sacrificing ratio = old ratio ${a} : ${b}; A gets ${a}/${a + b} × ${R(share)} = ${R((share * a) / (a + b))}`, `Step 3: B gets ${b}/${a + b} × ${R(share)} = ${R((share * b) / (a + b))}`],
        distractors: [dist(0, g, 'You took the whole goodwill instead of C’s share.', 'The new partner pays only for his own share of goodwill.')],
      };
    },
  },
  {
    skill: 'step-retirement', clause: 'XII.1.retirement', title: 'Step-wise: amount due to a retiring partner', typology: 'AP',
    make: r => {
      const [a, b, c] = r.pick([[3, 2, 1], [2, 2, 1], [1, 1, 1], [2, 1, 1]] as const), t = a + b + c, cap = r.multiple(150000, 400000, 50000), res = r.multiple(60000, 240000, 60000), g = r.multiple(60000, 240000, 60000), dr = r.multiple(10000, 40000, 10000);
      const sr = (res * a) / t, sg = (g * a) / t, due = cap + sr + sg - dr;
      return {
        stem: `A, B and C share profits ${a} : ${b} : ${c}. A retires. On that date A’s capital is ${R(cap)}, the general reserve is ${R(res)}, the goodwill of the firm is valued at ${R(g)} and A has drawn ${R(dr)} from his capital during the year. Find what the firm owes A step by step.`,
        parts: [step('Step 1: A’s share of general reserve', sr), step('Step 2: A’s share of goodwill', sg), step('Step 3: total amount due to A', due)],
        hints: HINTS_STEP, working: [`Step 1: ${R(res)} × ${a}/${t} = ${R(sr)}`, `Step 2: ${R(g)} × ${a}/${t} = ${R(sg)}`, `Step 3: ${R(cap)} + ${R(sr)} + ${R(sg)} − ${R(dr)} = ${R(due)}`],
        distractors: [dist(2, cap + sr + sg + dr, 'You added the drawings instead of deducting them.', 'Drawings already taken reduce what is still due to the partner.')],
      };
    },
  },
  {
    skill: 'step-cfo', clause: 'XII.4.preparation', title: 'Step-wise: cash flow from operating activities', typology: 'AEC',
    make: r => {
      const pbt = r.multiple(200000, 500000, 50000), dep = r.multiple(20000, 60000, 10000), ie = r.multiple(10000, 40000, 10000), dv = r.multiple(5000, 20000, 5000), dd = r.multiple(10000, 50000, 10000), di = r.multiple(10000, 40000, 10000), ic = r.multiple(10000, 50000, 10000), tax = r.multiple(20000, 80000, 10000);
      const s1 = pbt + dep + ie - dv, s2 = -dd + di + ic, s3 = s1 + s2, s4 = s3 - tax;
      return {
        stem: `Net profit before tax ${R(pbt)} after charging depreciation ${R(dep)} and interest on loan ${R(ie)}, and after crediting dividend received ${R(dv)}. During the year trade receivables increased by ${R(dd)}, inventory decreased by ${R(di)} and trade payables increased by ${R(ic)}. Income tax paid ${R(tax)}. Work out the cash flow from operating activities (indirect method) step by step.`,
        parts: [step('Step 1: operating profit before working-capital changes', s1), step('Step 2: net effect of working-capital changes (− for a use of cash)', s2), step('Step 3: cash generated from operations', s3), step('Step 4: net cash from operating activities', s4)],
        hints: ['Start from profit before tax: add back non-cash and non-operating charges, and remove non-operating income.', 'More receivables is a use of cash; less inventory and more payables are sources of cash. Deduct tax paid last.'],
        working: [`Step 1: ${R(pbt)} + ${R(dep)} + ${R(ie)} − ${R(dv)} = ${R(s1)}`, `Step 2: −${R(dd)} + ${R(di)} + ${R(ic)} = ${R(s2)}`, `Step 3: ${R(s1)} + (${R(s2)}) = ${R(s3)}`, `Step 4: ${R(s3)} − ${R(tax)} = ${R(s4)}`],
        distractors: [dist(0, pbt + dep + ie + dv, 'You added the dividend received.', 'Dividend received is an investing inflow, so it is deducted from operating profit.')],
      };
    },
  },
  {
    skill: 'step-forfeit-reissue', clause: 'XII.2.forfeiture', title: 'Step-wise: forfeiture and re-issue of shares', typology: 'AP',
    make: r => {
      const n = r.multiple(100, 500, 100), paid = r.pick([6, 7, 8]), p = r.pick([8, 9]), sfa = n * paid, disc = n * (10 - p), cr = sfa - disc;
      return {
        stem: `${n} shares of ₹10 each (fully called up) are forfeited for non-payment of the final call; ₹${paid} per share had been received. All ${n} shares are re-issued as fully paid at ₹${p} per share. Work out the accounting step by step.`,
        parts: [step('Step 1: credited to Share Forfeiture Account on forfeiture', sfa), step('Step 2: discount allowed on re-issue (debited to Share Forfeiture)', disc), step('Step 3: transferred to Capital Reserve', cr)],
        hints: HINTS_STEP, working: [`Step 1: ${n} × ₹${paid} = ${R(sfa)}`, `Step 2: ${n} × (₹10 − ₹${p}) = ${R(disc)}`, `Step 3: ${R(sfa)} − ${R(disc)} = ${R(cr)}`],
        distractors: [dist(2, sfa, 'You transferred the whole forfeited amount, forgetting the discount allowed on re-issue.', 'Only the balance left in Share Forfeiture after the discount goes to Capital Reserve.')],
      };
    },
  },
  {
    skill: 'step-adjusted-profit', clause: 'XI.3.adjustments', title: 'Step-wise: net profit after adjustments', typology: 'AP',
    make: r => {
      const np = r.multiple(100000, 300000, 10000), mach = r.multiple(100000, 400000, 50000), rate = r.pick([10, 15, 20]), deb = r.multiple(100000, 300000, 50000), bad = r.multiple(2000, 8000, 1000), os = r.multiple(5000, 20000, 5000), pp = r.multiple(2000, 10000, 2000);
      const dep = (mach * rate) / 100, prov = ((deb - bad) * 5) / 100, ddc = bad + prov, adj = np - dep - ddc - os + pp;
      return {
        stem: `Net profit before adjustments is ${R(np)}. Adjustments: depreciation on machinery of ${R(mach)} at ${rate}%; bad debts ${R(bad)} not yet written off and a provision of 5% on the remaining debtors of ${R(deb)}; salary outstanding ${R(os)}; insurance prepaid ${R(pp)}. Find the adjusted net profit step by step (there is no old provision).`,
        parts: [step('Step 1: depreciation', dep), step('Step 2: total charge for doubtful debts (bad debts + provision)', ddc), step('Step 3: adjusted net profit', adj)],
        hints: HINTS_STEP, working: [`Step 1: ${R(mach)} × ${rate}% = ${R(dep)}`, `Step 2: provision = 5% × (${R(deb)} − ${R(bad)}) = ${R(prov)}; total = ${R(bad)} + ${R(prov)} = ${R(ddc)}`, `Step 3: ${R(np)} − ${R(dep)} − ${R(ddc)} − ${R(os)} + ${R(pp)} = ${R(adj)}`],
        distractors: [dist(2, np - dep - ddc - os - pp, 'You deducted the prepaid insurance.', 'Prepaid insurance relates to next year, so it is added back (it reduces the expense).')],
      };
    },
  },
];

// ───────────────────────────── case-based, linked sub-questions ─────────────────────────────
const CASES: Gen[] = [
  {
    skill: 'case-equation', clause: 'XI.1.terms', title: 'Case: a trader’s first month (accounting equation)', typology: 'AEC',
    make: r => {
      const cash0 = r.multiple(200000, 500000, 50000), f = r.multiple(20000, 60000, 10000), g = r.multiple(30000, 80000, 10000), p = r.multiple(10000, 25000, 5000), e = r.multiple(2000, 6000, 1000), d = r.multiple(5000, 15000, 5000);
      const capital = cash0 + p - e - d, assets = capital + f;
      return {
        stem: `Meena starts a business with ${R(cash0)} cash. She buys furniture on credit for ${R(f)}, buys goods for ${R(g)} cash, sells all of those goods for ${R(g + p)} cash, pays rent ${R(e)} and withdraws ${R(d)} for personal use.`,
        parts: [numChoice(r, 'Q1. Total assets at the end', assets, [assets - f, assets + d, cash0 + f]), numChoice(r, 'Q2. Total outside liabilities', f, [f + e, g, 0 + g + f]), numChoice(r, 'Q3. Closing capital', capital, [cash0 + p, cash0 + p - e, cash0 - e - d]), numChoice(r, 'Q4. Net profit of the month', p - e, [p, p - e - d, g + p - e])],
        hints: HINTS_CASE, working: [`Capital = ${R(cash0)} + profit ${R(p)} − rent ${R(e)} − drawings ${R(d)} = ${R(capital)}`, `Liabilities = creditors for furniture ${R(f)}`, `Assets = ${R(capital)} + ${R(f)} = ${R(assets)}`, `Net profit = ${R(p)} − ${R(e)} = ${R(p - e)} (drawings are not an expense)`],
        distractors: [],
      };
    },
  },
  {
    skill: 'case-dep', clause: 'XI.2.depreciation', title: 'Case: a new machine and its depreciation', typology: 'AEC',
    make: r => {
      const c = r.multiple(200000, 600000, 50000), i = r.multiple(10000, 40000, 10000), rate = r.pick([10, 15, 20]), base = c + i, y1 = (base * rate) / 100, y2 = ((base - y1) * rate) / 100, bv = base - y1 - y2;
      return {
        stem: `A firm buys a machine for ${R(c)} and pays ${R(i)} as wages for installing it. It charges depreciation at ${rate}% per year on the Written Down Value method.`,
        parts: [numChoice(r, 'Q1. Cost on which depreciation is charged', base, [c, c - i, base + i]), numChoice(r, 'Q2. Depreciation for year 1', y1, [(c * rate) / 100, y1 * 2, base - y1]), numChoice(r, 'Q3. Book value at the end of year 2', bv, [base - 2 * y1, base - y2, base - y1]), textChoice(r, 'Q4. Treatment of the installation wages', 'Added to the cost of the machine', ['Charged to the Profit and Loss Account as wages', 'Shown as drawings', 'Added to purchases'])],
        hints: HINTS_CASE, working: [`Cost for depreciation = ${R(c)} + ${R(i)} = ${R(base)}`, `Year 1 = ${rate}% of ${R(base)} = ${R(y1)}`, `Year 2 = ${rate}% of (${R(base)} − ${R(y1)}) = ${R(y2)}; book value = ${R(bv)}`, 'Expenditure needed to bring an asset into use is capitalised.'],
        distractors: [],
      };
    },
  },
  {
    skill: 'case-brs', clause: 'XI.2.brs', title: 'Case: why the cash book and pass book differ', typology: 'AEC',
    make: r => {
      const cb = r.multiple(80000, 200000, 10000), ci = r.multiple(5000, 20000, 5000), cd = r.multiple(5000, 15000, 5000), bc = r.multiple(200, 1000, 100), ic = r.multiple(500, 2000, 500), upd = cb - bc + ic, pb = upd + ci - cd;
      return {
        stem: `On 31 March the bank column of the cash book shows a debit balance of ${R(cb)}. Cheques issued for ${R(ci)} have not yet been presented; cheques deposited for ${R(cd)} have not yet been collected; the bank has charged ${R(bc)} and credited interest ${R(ic)}, which the firm has not recorded.`,
        parts: [numChoice(r, 'Q1. Cash book balance after correcting the unrecorded items', upd, [cb + bc + ic, cb - bc - ic, cb]), numChoice(r, 'Q2. Balance as per the pass book', pb, [upd - ci + cd, cb + ci - cd, upd + ci + cd]), textChoice(r, 'Q3. Items that need an entry in the cash book', 'Bank charges and interest credited by the bank', ['Cheques issued but not presented', 'Cheques deposited but not collected', 'Cheques issued and cheques deposited']), textChoice(r, 'Q4. Cheques issued but not yet presented make the pass book balance', 'higher than the cash book balance', ['lower than the cash book balance', 'equal to the cash book balance', 'negative in every case'])],
        hints: HINTS_CASE, working: [`Updated cash book = ${R(cb)} − ${R(bc)} + ${R(ic)} = ${R(upd)}`, `Pass book = ${R(upd)} + ${R(ci)} − ${R(cd)} = ${R(pb)}`, 'Only items the firm has not yet recorded need a cash-book entry; timing differences do not.', 'The bank has not yet deducted the cheques issued, so its balance is higher.'],
        distractors: [],
      };
    },
  },
  {
    skill: 'case-admission', clause: 'XII.1.admission', title: 'Case: a new partner joins the firm', typology: 'AEC',
    make: r => {
      const [a, b] = r.pick([[3, 2], [2, 1], [3, 1], [4, 1]] as const), n = r.pick([4, 5]), g = r.multiple(60000, 300000, 60000);
      const x = a * (n - 1), y = b * (n - 1), z = a + b, k = gcd(gcd(x, y), z), nr = `${x / k} : ${y / k} : ${z / k}`, old = `${a} : ${b}`;
      return {
        stem: `A and B share profits ${a} : ${b}. C is admitted for a 1/${n} share, taken from A and B in their old ratio. The goodwill of the firm is ${R(g)}; C brings his share of it in cash.`,
        parts: [textChoice(r, 'Q1. New profit-sharing ratio of A, B and C', nr, [`${a} : ${b} : ${a + b}`, `${a + 1} : ${b + 1} : 1`, `1 : 1 : 1`]), textChoice(r, 'Q2. Sacrificing ratio of A and B', old, [`${b} : ${a}`, '1 : 1', `${a} : ${b + 1}`]), numChoice(r, 'Q3. Goodwill brought in by C', g / n, [g, (g * (n - 1)) / n, g / (n - 1)]), textChoice(r, 'Q4. The goodwill brought in by C is credited to', 'the old partners’ capital accounts in the sacrificing ratio', ['C’s capital account', 'the Profit and Loss Account', 'the old partners in the new ratio'])],
        hints: HINTS_CASE, working: [`Old shares: A ${a}/${a + b}, B ${b}/${a + b}. After C takes 1/${n}, the other ${n - 1}/${n} is shared in ${old}, so A : B : C = ${nr}.`, `Sacrificing ratio = old ratio ${old} (C takes from each in the old ratio).`, `Goodwill brought in = ${R(g)} × 1/${n} = ${R(g / n)}`, 'The old partners gave up the share, so they are compensated.'],
        distractors: [],
      };
    },
  },
  {
    skill: 'case-forfeiture', clause: 'XII.2.forfeiture', title: 'Case: shares forfeited and re-issued', typology: 'AEC',
    make: r => {
      const n = r.multiple(100, 500, 100), paid = r.pick([6, 7, 8]), p = r.pick([8, 9]), sfa = n * paid, cr = n * (paid - (10 - p));
      return {
        stem: `${n} shares of ₹10 each, fully called up, are forfeited because the final call was not paid; ₹${paid} per share had been received. The company re-issues all of them as fully paid at ₹${p} per share.`,
        parts: [numChoice(r, 'Q1. Amount credited to Share Forfeiture Account', sfa, [n * 10, n * (10 - paid), (n * paid) / 2]), numChoice(r, 'Q2. Share Capital debited on forfeiture', n * 10, [sfa, n * (10 - paid), n * p]), numChoice(r, 'Q3. Capital Reserve after the re-issue', cr, [sfa, n * (10 - p), sfa + n * (10 - p)]), textChoice(r, 'Q4. The discount allowed on re-issue is debited to', 'Share Forfeiture Account', ['Profit and Loss Account', 'Securities Premium Account', 'Bank Account'])],
        hints: HINTS_CASE, working: [`Forfeited amount = ${n} × ₹${paid} = ${R(sfa)}`, `Share capital debited at the called-up value = ${n} × ₹10 = ${R(n * 10)}`, `Discount on re-issue = ${n} × ₹${10 - p} = ${R(n * (10 - p))}; capital reserve = ${R(sfa)} − ${R(n * (10 - p))} = ${R(cr)}`, 'The discount is a loss met out of the forfeited amount.'],
        distractors: [],
      };
    },
  },
];
const CFS_POOL: readonly (readonly [text: string, kind: string])[] = [
  ['Cash received from customers', 'Operating activity'], ['Payment to suppliers of goods', 'Operating activity'], ['Income tax paid', 'Operating activity'], ['Purchase of machinery for cash', 'Investing activity'],
  ['Sale of old machinery for cash', 'Investing activity'], ['Interest received on investments', 'Investing activity'], ['Issue of equity shares for cash', 'Financing activity'], ['Repayment of a long-term loan', 'Financing activity'],
  ['Dividend paid to shareholders', 'Financing activity'], ['Interest paid on a loan', 'Financing activity'], ['Purchase of long-term investments', 'Investing activity'], ['Proceeds from issue of debentures', 'Financing activity'],
];
CASES.push({
  skill: 'case-cfs', clause: 'XII.4.classification', title: 'Case: classify the cash flows', typology: 'AEC',
  make: r => {
    const items = shuffle(r, CFS_POOL).slice(0, 4), amts = items.map(() => R(r.multiple(10000, 90000, 5000))), opts = ['Operating activity', 'Investing activity', 'Financing activity'];
    return {
      stem: `A non-financial company reports these cash flows for the year: ${items.map(([t], i) => `(${i + 1}) ${t} ${amts[i]}`).join('; ')}. Classify each as it will appear in the cash flow statement under AS 3 (Revised).`,
      parts: items.map(([t, k], i) => textChoice(r, `Q${i + 1}. Classify: ${t}`, k, opts.filter(o => o !== k).concat('Not a cash flow').slice(0, 3) as [string, string, string])),
      hints: HINTS_CASE, working: items.map(([t, k]) => `${t}: ${k}`),
      distractors: [],
    };
  },
});

// ───────────────────────────── assertion-reason banks (standard four options) ─────────────────────────────
const AR_OPTIONS = ['Both A and R are true, and R is the correct explanation of A.', 'Both A and R are true, but R is not the correct explanation of A.', 'A is true, but R is false.', 'A is false, but R is true.'] as const;
/** [Assertion, Reason, A true?, R true?, R explains A?, why] — the answer option is derived from the three flags. */
type AR = readonly [a: string, r: string, aTrue: boolean, rTrue: boolean, explains: boolean, why: string];
const arAnswer = (aT: boolean, rT: boolean, ex: boolean) => (aT && rT ? (ex ? AR_OPTIONS[0] : AR_OPTIONS[1]) : aT ? AR_OPTIONS[2] : AR_OPTIONS[3]);
function ar(skill: string, clause: string, title: string, bank: readonly AR[]): Gen {
  return {
    skill, clause, title, typology: 'AEC',
    make: r => {
      const [a, rs, aT, rT, ex, why] = bank[r.int(0, bank.length - 1)]!, answer = arAnswer(aT, rT, ex);
      return {
        stem: `Assertion (A): ${a}  Reason (R): ${rs}  Choose the correct option.`,
        parts: [{ label: 'Choose the correct option', kind: 'CHOICE', options: AR_OPTIONS, answer, marks: 1 }],
        hints: ['First decide separately whether A is true and whether R is true.', 'If both are true, ask whether R explains WHY A is true. If it is only a separate true fact, the answer is the “not the correct explanation” option.'],
        working: [`${answer} ${why}`],
        distractors: AR_OPTIONS.filter(o => o !== answer).map(o => ({ part: 0, value: o, mistake: 'This option misjudges the truth of A or R, or how they are related.', fix: why })),
      };
    },
  };
}
const T = true, F = false;
const AR_BANKS: Gen[] = [
  ar('ar-concepts', 'XI.1.concepts', 'Assertion–reason: accounting concepts', [
    ['Land bought for ₹5,00,000 continues to be shown at ₹5,00,000 even when its market value is ₹8,00,000.', 'Assets are recorded at cost under the historical cost concept.', T, T, T, 'Historical cost is exactly why the higher market value is ignored.'],
    ['Under the business entity concept, the capital brought in by the owner is a claim of the owner against the business.', 'The business is treated as a separate person from its owner.', T, T, T, 'Because the business is a separate person, it owes the capital to its owner.'],
    ['A firm provides for expected bad debts but does not record expected profits.', 'Conservatism requires providing for all possible losses but not anticipating profits.', T, T, T, 'This is the conservatism (prudence) concept in action.'],
    ['Machinery is shown at cost less depreciation, not at what it would fetch if the firm closed down.', 'The going concern concept assumes the business will continue for the foreseeable future.', T, T, T, 'Because the firm is expected to continue, the machine is valued as a working asset.'],
    ['Salary for March paid in April is an expense of the year ending 31 March.', 'Under the cash basis of accounting an expense is recorded when it is incurred.', T, F, F, 'A is right because of the accrual basis; R describes the accrual basis, not the cash basis.'],
    ['Goods sold in March and paid for in April are recorded as sales of the year ending 31 March.', 'Revenue is recognised when cash is received.', T, F, F, 'Revenue is recognised when it is earned (the sale is made), not when cash arrives.'],
    ['Accounting concepts are laws made by Parliament.', 'Accounting concepts are ideas that guide the recording of transactions.', F, T, F, 'Concepts are accepted conventions, not statutes.'],
    ['Interest on a bank loan is an expense of the business.', 'Rent is an expense of the business.', T, T, F, 'Both are true, but one expense does not explain the other.'],
  ]),
  ar('ar-errors', 'XI.2.errors', 'Assertion–reason: errors and rectification', [
    ['A trial balance that agrees proves that the books are free from all errors.', 'Errors of principle and compensating errors do not affect the agreement of the trial balance.', F, T, F, 'Because some errors do not disturb the agreement, an agreeing trial balance is not proof of accuracy.'],
    ['Debiting the purchase of furniture to the Purchases account is an error of principle.', 'It treats a capital item as a revenue item.', T, T, T, 'A fixed asset has been recorded as if it were goods for resale.'],
    ['Posting only the debit of a ₹5,000 purchase and omitting the credit to the creditor makes the trial balance disagree.', 'The credit side then falls short of the debit side by ₹5,000.', T, T, T, 'A one-sided posting leaves the totals unequal by exactly that amount.'],
    ['Compensating errors do not affect the trial balance.', 'A compensating error is offset by another error of equal amount on the opposite side.', T, T, T, 'The offsetting error keeps the totals equal.'],
    ['All errors of omission leave the trial balance unaffected.', 'A transaction omitted completely from the books does not affect the agreement of the trial balance.', F, T, F, 'Only COMPLETE omission is unaffected; a partial omission (one side) disturbs the agreement.'],
    ['Rectification of an error of principle may need a journal entry.', 'Journal entries are made only for transactions involving cash.', T, F, F, 'Journal entries record many non-cash items, including rectifications.'],
    ['Wrong totalling of the purchases book is an error of commission.', 'An error of commission arises from carelessness in recording, posting, totalling or balancing.', T, T, T, 'Wrong totalling is a clerical slip of that kind.'],
  ]),
  ar('ar-depreciation', 'XI.2.depreciation', 'Assertion–reason: depreciation', [
    ['Under the Straight Line method the amount of depreciation is the same every year.', 'It is calculated on the original cost of the asset.', T, T, T, 'A fixed base gives a fixed charge.'],
    ['Under the Written Down Value method the depreciation charge falls every year.', 'It is calculated on the book value at the start of the year, which falls each year.', T, T, T, 'A shrinking base gives a falling charge.'],
    ['Depreciation is a source of cash for the business.', 'Depreciation is a non-cash expense that reduces profit.', F, T, F, 'Depreciation does not bring cash in; it is only added back in the cash flow statement.'],
    ['Depreciation is charged on land.', 'Land has an unlimited life.', F, T, F, 'Because land does not wear out, no depreciation is charged.'],
    ['A profit arises when an asset is sold above its book value.', 'Profit on sale of an asset is credited to the Profit and Loss Account.', T, T, F, 'Both are true, but crediting the P&L is a consequence of the profit, not the reason it arises.'],
    ['A longer estimated useful life lowers the annual Straight Line depreciation.', 'Annual SLM depreciation = (cost − scrap value) ÷ useful life.', T, T, T, 'A larger divisor gives a smaller result.'],
  ]),
  ar('ar-brs', 'XI.2.brs', 'Assertion–reason: bank reconciliation', [
    ['A credit balance in the bank column of the cash book shows a bank overdraft.', 'An overdraft is an amount owed to the bank.', T, T, T, 'A credit balance in the firm’s own book means the firm owes the bank.'],
    ['Cheques deposited but not yet collected make the cash book balance higher than the pass book balance.', 'The cash book debits a cheque on deposit, but the bank credits it only on collection.', T, T, T, 'This timing gap is the whole reason for the difference.'],
    ['A Bank Reconciliation Statement is prepared to find the reasons for the difference between the cash book and the pass book.', 'A Bank Reconciliation Statement is a part of the ledger.', T, F, F, 'It is a statement prepared for reconciliation, not a ledger account.'],
    ['The firm prepares the Bank Reconciliation Statement from the bank’s own records only.', 'The bank sends a statement of the account to the customer.', F, T, F, 'The firm compares its own cash book with the pass book; the bank does not prepare the BRS.'],
    ['Bank charges are entered in the cash book only after the firm sees the pass book.', 'The firm learns of such charges only from the bank statement.', T, T, T, 'Until then the firm has no record of the charge.'],
    ['Cheques issued but not yet presented are deducted from the cash book balance when the pass book is prepared.', 'The bank deducts the amount only when the cheque is presented.', F, T, F, 'Presented later, they reduce the pass book balance; they do not change the cash book.'],
  ]),
  ar('ar-adjustments', 'XI.3.adjustments', 'Assertion–reason: adjustments', [
    ['Outstanding rent is added to the rent paid when finding the rent charge for the year.', 'Rent due but unpaid at the year end is an expense of that year.', T, T, T, 'Accrual accounting charges the year with what it has used.'],
    ['Prepaid insurance is shown as an asset in the balance sheet.', 'It represents a benefit the firm will receive in the next period.', T, T, T, 'The firm has paid for something it has not yet used.'],
    ['Closing stock appears on the credit side of the Trading Account.', 'It is deducted from the goods available for sale to find the cost of goods sold.', T, T, T, 'Unsold goods are not a cost of this year.'],
    ['Outstanding expenses appear on the assets side of the balance sheet.', 'Outstanding expenses are amounts payable by the firm.', F, T, F, 'Amounts payable are liabilities, not assets.'],
    ['A bad debt recovered after it was written off is credited to the Profit and Loss Account.', 'A bad debt is a loss in the year in which it is written off.', T, T, F, 'Both are true, but the second fact does not by itself explain why the recovery is income.'],
    ['The provision for doubtful debts is calculated after deducting further bad debts from debtors.', 'Debts that are certain to be lost are written off before estimating the doubtful ones.', T, T, T, 'Bad debts are certain; the provision is only for the remaining doubtful ones.'],
  ]),
  ar('ar-final-accounts', 'XI.3.concepts', 'Assertion–reason: final accounts', [
    ['Carriage inwards is debited to the Trading Account.', 'It is a direct expense incurred to bring the goods to the business.', T, T, T, 'Direct expenses go to the Trading Account.'],
    ['Wages paid for installing a machine are added to the cost of the machine.', 'Expenditure needed to bring an asset into working condition is capital expenditure.', T, T, T, 'It is part of the cost of acquiring a usable asset.'],
    ['Salaries are debited to the Profit and Loss Account.', 'Salaries are an indirect expense.', T, T, T, 'Indirect expenses are charged to the P&L account.'],
    ['Net profit is transferred to the capital account of the proprietor.', 'The profit of a sole proprietorship belongs to the proprietor.', T, T, T, 'There is no one else to share it.'],
    ['Discount allowed to a customer is debited to the Profit and Loss Account.', 'Discount allowed is a loss to the business.', T, T, F, 'Both are true, but they describe the same fact rather than one explaining the other.'],
    ['Drawings are shown as an expense in the Profit and Loss Account.', 'Drawings reduce the capital of the proprietor.', F, T, F, 'Drawings reduce capital directly; they are not an expense of the business.'],
  ]),
  ar('ar-admission', 'XII.1.admission', 'Assertion–reason: admission of a partner', [
    ['Goodwill brought in by a new partner is credited to the old partners in the sacrificing ratio.', 'The old partners give up part of their profit share in favour of the new partner.', T, T, T, 'The sacrifice is what they are compensated for.'],
    ['Sacrificing ratio = old ratio − new ratio.', 'It shows the share each old partner gives up.', T, T, T, 'The subtraction measures exactly the share given up.'],
    ['Revaluation profit on admission is credited to the old partners in the old ratio.', 'The gain arose before the new partner joined, so it belongs to the old partners.', T, T, T, 'Past gains stay with those who earned them.'],
    ['Goodwill brought in by the new partner is credited to the new partner’s capital account.', 'Premium for goodwill is the price paid for a share in the firm’s goodwill.', F, T, F, 'It is credited to the old partners; the new partner pays it for his share.'],
    ['The general reserve at the time of admission is distributed among the old partners in the old ratio.', 'Reserves are accumulated profits that belong to the old partners.', T, T, T, 'The new partner has no claim on profits earned before he joined.'],
    ['Assets and liabilities are revalued on the admission of a new partner.', 'The new partner should neither gain nor lose from the past change in values.', T, T, T, 'Revaluation puts the books at current values before the new ratio applies.'],
  ]),
  ar('ar-retirement', 'XII.1.retirement', 'Assertion–reason: retirement of a partner', [
    ['Gaining ratio = new ratio − old ratio.', 'The continuing partners gain the retiring partner’s share.', T, T, T, 'The gain is what is measured.'],
    ['The retiring partner’s share of goodwill is borne by the continuing partners in the gaining ratio.', 'The continuing partners gain the retiring partner’s share.', T, T, T, 'They pay for what they gain.'],
    ['The unpaid amount due to a retiring partner is transferred to his loan account.', 'A loan account is a liability of the firm.', T, T, T, 'The amount is a debt of the firm to the retired partner.'],
    ['Reserves and accumulated profits are distributed among all partners, including the retiring partner, at the time of retirement.', 'They belong to all partners in the old ratio.', T, T, T, 'The retiring partner shared in earning them.'],
    ['The gaining partners’ capital accounts are debited for the goodwill paid to the retiring partner.', 'The gaining partners compensate the retiring partner for the goodwill he gives up.', T, T, T, 'They are the ones who gain.'],
    ['The retiring partner’s share of goodwill is credited to the continuing partners.', 'The continuing partners gain from the retirement.', F, T, F, 'It is credited to the RETIRING partner and debited to the gaining partners.'],
  ]),
  ar('ar-forfeiture', 'XII.2.forfeiture', 'Assertion–reason: forfeiture of shares', [
    ['The amount received on forfeited shares is credited to the Share Forfeiture Account.', 'The company keeps what the defaulting shareholder had already paid.', T, T, T, 'Money already received is retained as the forfeited amount.'],
    ['Forfeited shares may be re-issued at a discount.', 'The discount cannot exceed the amount forfeited on those shares.', T, T, T, 'The limit exists so that the new holder still pays the full face value.'],
    ['The balance of the Share Forfeiture Account after re-issue is transferred to Capital Reserve.', 'It is a capital profit.', T, T, T, 'Profits of a capital nature go to capital reserve.'],
    ['On forfeiture, Calls in Arrears Account is credited for the unpaid calls.', 'Unpaid calls are written off against the forfeited shares.', T, T, T, 'The arrears are cleared by the forfeiture entry.'],
    ['On forfeiture, Share Capital is debited with the amount called up on the forfeited shares.', 'Shares are cancelled to the extent of the amount called up on them.', T, T, T, 'The capital that had been called is removed from the books.'],
    ['A shareholder whose shares are forfeited gets back the money he had already paid.', 'Forfeiture is a penalty for non-payment of calls.', F, T, F, 'The amount received is retained by the company; that is the penalty.'],
    ['The balance in the Share Forfeiture Account is a revenue profit of the year.', 'Forfeited money is received from the defaulting shareholder.', F, T, F, 'It is a capital profit, to be transferred to Capital Reserve, not a revenue profit.'],
  ]),
  ar('ar-debentures', 'XII.2.debentures', 'Assertion–reason: debentures', [
    ['Debentures are a liability of the company.', 'Debenture holders are creditors of the company.', T, T, T, 'The company owes them the amount.'],
    ['Interest on debentures is payable whether or not the company earns a profit.', 'Debenture interest is a charge against profit, not an appropriation of it.', T, T, T, 'It is an expense owed regardless of profit.'],
    ['Debenture holders are the owners of the company.', 'Debenture holders are lenders to the company.', F, T, F, 'Owners are the shareholders; debenture holders are lenders.'],
    ['Premium received on the issue of debentures is credited to the Securities Premium Account.', 'The premium is a capital receipt.', T, T, T, 'Receipts of a capital nature are not revenue.'],
    ['When debentures are issued at a discount, the discount is debited to the Discount on Issue of Debentures Account.', 'Debentures are credited at their nominal value.', T, T, T, 'The company has to repay the full nominal value, so the shortfall is a debit.'],
    ['A loss on issue of debentures redeemable at a premium is recorded at the time of issue.', 'The premium on redemption is a liability that arises when the debentures are issued.', T, T, T, 'The obligation to pay the premium exists from the date of issue.'],
  ]),
  ar('ar-ratios', 'XII.3.liquidity', 'Assertion–reason: ratio analysis', [
    ['A current ratio of 2 : 1 means current assets are twice current liabilities.', 'Current ratio = current assets ÷ current liabilities.', T, T, T, 'The definition gives the meaning.'],
    ['The quick ratio is a stricter test of liquidity than the current ratio.', 'Quick assets exclude inventory and prepaid expenses.', T, T, T, 'Removing the less liquid items makes the test stricter.'],
    ['A higher debt-equity ratio indicates a higher financial risk.', 'More debt means a larger fixed obligation to pay interest.', T, T, T, 'Fixed interest must be met even in a poor year.'],
    ['Inventory turnover ratio is a profitability ratio.', 'It is calculated as cost of revenue from operations ÷ average inventory.', F, T, F, 'It is an activity (turnover) ratio.'],
    ['The interest coverage ratio shows the ability of the firm to pay interest on its debt.', 'It is calculated as profit before interest and tax ÷ interest expense.', T, T, T, 'The more times profit covers interest, the safer the payment.'],
    ['The gross profit ratio increases if the cost of revenue falls, other things being equal.', 'Gross profit = revenue − cost of revenue from operations.', T, T, T, 'A lower cost leaves a larger gross profit.'],
  ]),
  ar('ar-cashflow', 'XII.4.preparation', 'Assertion–reason: cash flow statement', [
    ['Depreciation is added back to net profit when finding cash from operations by the indirect method.', 'Depreciation is a non-cash expense.', T, T, T, 'No cash left the business when it was charged.'],
    ['Interest paid on a loan by a non-financial company is a financing activity.', 'It is a payment to a provider of finance.', T, T, T, 'It is the cost of borrowed capital.'],
    ['Purchase of fixed assets is an investing activity.', 'It involves acquiring long-term assets.', T, T, T, 'Investing activities are about long-term assets and investments.'],
    ['Depositing cash into the bank changes the cash flow from investing activities.', 'Cash and cash equivalents include bank balances.', F, T, F, 'Cash and bank are both cash and cash equivalents, so the movement is not a cash flow.'],
    ['A decrease in inventory is added to operating profit when finding cash from operations.', 'A decrease in inventory releases cash.', T, T, T, 'Stock turned into cash is a source.'],
    ['An increase in trade receivables is deducted from operating profit.', 'An increase in receivables means that less cash has been collected from customers.', T, T, T, 'The profit has not yet become cash.'],
    ['Dividend received by a non-financial company is shown under investing activities.', 'It is a return on an investment.', T, T, T, 'Returns on investments are investing cash flows.'],
  ]),
];

export const V3_GENERATORS: readonly Gen[] = [...STEPWISE, ...CASES, ...AR_BANKS];
