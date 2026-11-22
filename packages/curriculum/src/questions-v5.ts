/**
 * V5: more board-style, step-wise problems for the topics that had only one thin practice skill: the cash flow statement (6 marks), death of a partner (6),
 * solvency ratios (6, answers from the engine), fixed and fluctuating capitals (4), past adjustments (4) and debentures issued at a discount or premium (4).
 * Every figure is whole-rupee integer arithmetic (the generators retry until every division is exact). Oracles: test/questions-v5.test.ts.
 * Not reviewed by a subject teacher (D11).
 */
import { Money, debtEquityRatio, debtToCapitalEmployed, interestCoverageRatio, proprietaryRatio, totalAssetsToDebtRatio } from '../../engine/src';
import type { Distractor, Gen, Part } from './questions';

const M = (n: number) => Money.rupees(n),
  R = (n: number) => M(n).format().replace(/\.00$/, ''),
  A = (n: number) => M(n).toString();
const step = (label: string, n: number): Part => ({ label, kind: 'MONEY', answer: A(n), marks: 1 });
const dist = (part: number, n: number, mistake: string, fix: string): Distractor => ({ part, value: A(n), mistake, fix });
const ratioPart = (label: string, display: string): Part => ({ label, kind: 'TEXT', answer: display.replace(/ : 1$| times$/, ''), marks: 1 });
const HINTS_STEP = ['Do the steps in order: each step uses the result of the one before it.', 'Write the formula for each step first, then put the figures in.'];
const whole = (...xs: number[]) => xs.every(x => Number.isInteger(x));

function exact<T>(build: () => T | null): T {
  for (let i = 0; i < 500; i++) {
    const v = build();
    if (v) return v;
  }
  throw new Error('v5: could not build an exact problem');
}

const GENS: Gen[] = [
  // ───────────── Cash flow statement, indirect method (6 marks) ─────────────
  {
    skill: 'step-cfs-full',
    clause: 'XII.4.preparation',
    title: 'Step-wise: cash flow statement (indirect method)',
    typology: 'AEC',
    make: r =>
      exact(() => {
        const npbt = r.multiple(200000, 600000, 10000),
          dep = r.multiple(20000, 80000, 10000),
          int = r.multiple(10000, 40000, 5000),
          loss = r.multiple(5000, 25000, 5000),
          inv = r.multiple(10000, 60000, 10000),
          rec = r.multiple(10000, 60000, 10000),
          pay = r.multiple(10000, 50000, 10000),
          tax = r.multiple(30000, 90000, 10000),
          pm = r.multiple(150000, 400000, 10000),
          sp = r.multiple(20000, 80000, 10000),
          sh = r.multiple(100000, 500000, 50000),
          rl = r.multiple(30000, 150000, 10000),
          dv = r.multiple(10000, 50000, 10000);
        const s1 = npbt + dep + int + loss,
          s2 = s1 - inv - rec + pay,
          s3 = s2 - tax,
          s4 = sp - pm,
          s5 = sh - rl - int - dv,
          s6 = s3 + s4 + s5;
        if (s3 <= 0 || inv + rec === pay) return null;
        return {
          stem: `A non-financial company’s net profit before tax is ${R(npbt)} after charging depreciation ${R(dep)}, interest on long-term loan ${R(int)} and a loss on sale of machinery ${R(loss)}. During the year inventories increased by ${R(inv)}, trade receivables increased by ${R(rec)} and trade payables increased by ${R(pay)}. Tax paid was ${R(tax)}. It bought machinery for ${R(pm)} and sold old machinery for ${R(sp)}. It issued equity shares for ${R(sh)} in cash, repaid a long-term loan of ${R(rl)}, paid the interest shown above and paid a dividend of ${R(dv)}. Prepare the cash flow statement by the indirect method, step by step.`,
          parts: [
            step('Step 1: operating profit before working capital changes', s1),
            step('Step 2: cash generated from operations', s2),
            step('Step 3: net cash from operating activities (after tax)', s3),
            step('Step 4: net cash from investing activities (− for an outflow)', s4),
            step('Step 5: net cash from financing activities (− for an outflow)', s5),
            step('Step 6: net increase (+) or decrease (−) in cash and cash equivalents', s6),
          ],
          hints: [
            'Start from the profit before tax and add back the non-cash and non-operating charges; then adjust for the changes in current assets and current liabilities.',
            'Interest paid and dividend paid are financing items; interest and dividend received would be investing items.',
          ],
          working: [
            `Step 1: ${R(npbt)} + depreciation ${R(dep)} + interest ${R(int)} + loss on sale ${R(loss)} = ${R(s1)}`,
            `Step 2: ${R(s1)} − increase in inventories ${R(inv)} − increase in receivables ${R(rec)} + increase in payables ${R(pay)} = ${R(s2)}`,
            `Step 3: ${R(s2)} − tax paid ${R(tax)} = ${R(s3)}`,
            `Step 4: sale of machinery ${R(sp)} − purchase of machinery ${R(pm)} = ${R(s4)}`,
            `Step 5: shares issued ${R(sh)} − loan repaid ${R(rl)} − interest paid ${R(int)} − dividend paid ${R(dv)} = ${R(s5)}`,
            `Step 6: ${R(s3)} + (${R(s4)}) + (${R(s5)}) = ${R(s6)}`,
          ],
          distractors: [
            dist(
              1,
              s1 + inv + rec - pay,
              'You added the increase in current assets and deducted the increase in current liabilities.',
              'An increase in a current asset uses cash (deduct it); an increase in a current liability saves cash (add it).',
            ),
            dist(2, s2, 'You forgot to deduct the tax paid.', 'Net cash from operating activities is after income tax paid.'),
            dist(4, sh - rl - dv, 'You left out the interest paid.', 'Interest paid is a financing outflow.'),
          ],
        };
      }),
  },
  // ───────────── Death of a partner (6 marks) ─────────────
  {
    skill: 'step-death',
    clause: 'XII.1.death',
    title: 'Step-wise: amount due to the executor of a deceased partner',
    typology: 'AP',
    make: r =>
      exact(() => {
        const [a, b, c] = r.pick([
            [3, 2, 1],
            [2, 2, 1],
            [1, 1, 1],
            [2, 1, 1],
          ] as const),
          t = a + b + c,
          months = r.pick([3, 4, 6, 8, 9]),
          lp = r.multiple(120000, 480000, 12000),
          gw = r.multiple(60000, 360000, 60000),
          res = r.multiple(60000, 240000, 60000),
          cap = r.multiple(150000, 450000, 50000),
          dr = r.multiple(5000, 30000, 5000);
        const s1 = (lp * months) / 12,
          s2 = (s1 * c) / t,
          s3 = (gw * c) / t,
          s4 = (res * c) / t,
          s5 = cap + s2 + s3 + s4,
          s6 = s5 - dr;
        if (!whole(s1, s2, s3, s4)) return null;
        return {
          stem: `A, B and C share profits ${a} : ${b} : ${c}. C dies ${months} months after the last balance sheet date. The profit of the last year was ${R(lp)} and C’s share of profit up to the date of death is to be calculated on the basis of that profit. The goodwill of the firm is valued at ${R(gw)}, the general reserve is ${R(res)} and C’s capital is ${R(cap)}. C had drawn ${R(dr)} up to the date of death. Find the amount due to C’s executor, step by step.`,
          parts: [
            step('Step 1: firm’s profit up to the date of death (time basis)', s1),
            step('Step 2: C’s share of that profit', s2),
            step('Step 3: C’s share of goodwill', s3),
            step('Step 4: C’s share of the general reserve', s4),
            step('Step 5: total credited to C (capital + profit + goodwill + reserve)', s5),
            step('Step 6: amount due to the executor (after deducting the drawings)', s6),
          ],
          hints: [
            'Time basis: the last year’s profit × months ÷ 12 gives the profit for the part of the year.',
            'Goodwill and reserves belong to all partners in the old ratio, so C gets his share of each.',
          ],
          working: [
            `Step 1: ${R(lp)} × ${months}/12 = ${R(s1)}`,
            `Step 2: ${R(s1)} × ${c}/${t} = ${R(s2)}`,
            `Step 3: ${R(gw)} × ${c}/${t} = ${R(s3)}`,
            `Step 4: ${R(res)} × ${c}/${t} = ${R(s4)}`,
            `Step 5: ${R(cap)} + ${R(s2)} + ${R(s3)} + ${R(s4)} = ${R(s5)}`,
            `Step 6: ${R(s5)} − ${R(dr)} = ${R(s6)}`,
          ],
          distractors: [
            dist(0, lp, 'You used the whole year’s profit for a part of the year.', 'Multiply by the months and divide by 12.'),
            dist(5, s5, 'You did not deduct C’s drawings.', 'Drawings already taken reduce what is due to the executor.'),
          ],
        };
      }),
  },
  // ───────────── Past adjustment: profit shared in the wrong ratio (4 marks) ─────────────
  {
    skill: 'step-past-adjust',
    clause: 'XII.1.past-adjustments',
    title: 'Step-wise: past adjustment for a wrong profit-sharing ratio',
    typology: 'AP',
    make: r =>
      exact(() => {
        const [a, b] = r.pick([
            [3, 2],
            [2, 1],
            [3, 1],
            [4, 1],
            [5, 3],
          ] as const),
          t = a + b,
          p = r.multiple(80000, 400000, 40000);
        const dueA = (p * a) / t,
          dueB = (p * b) / t,
          got = p / 2,
          diff = dueA - got;
        if (!whole(dueA, dueB, got) || diff <= 0) return null;
        return {
          stem: `Last year’s profit of ${R(p)} was shared equally by A and B, but the partnership deed says ${a} : ${b}. The error is found after the accounts are closed. Work out the adjustment step by step.`,
          parts: [
            step('Step 1: A’s share as per the deed', dueA),
            step('Step 2: B’s share as per the deed', dueB),
            step('Step 3: what each partner actually received', got),
            step('Step 4: amount B must pay A through the capital accounts', diff),
          ],
          hints: HINTS_STEP,
          working: [
            `Step 1: ${R(p)} × ${a}/${t} = ${R(dueA)}`,
            `Step 2: ${R(p)} × ${b}/${t} = ${R(dueB)}`,
            `Step 3: ${R(p)} ÷ 2 = ${R(got)}`,
            `Step 4: A should have ${R(dueA)} but got ${R(got)}: ${R(dueA)} − ${R(got)} = ${R(diff)}; entry: B’s Capital A/c Dr ${R(diff)}; To A’s Capital A/c ${R(diff)}`,
          ],
          distractors: [dist(3, dueA, 'You took A’s whole due share as the adjustment.', 'Only the difference between what A should have and what A got is adjusted.')],
        };
      }),
  },
  // ───────────── Fixed and fluctuating capitals (4 marks) ─────────────
  {
    skill: 'step-capital-fixed',
    clause: 'XII.1.capital',
    title: 'Step-wise: fixed and fluctuating capital accounts',
    typology: 'AP',
    make: r =>
      exact(() => {
        const cap = r.multiple(200000, 800000, 100000),
          rate = r.pick([6, 8, 10, 12]),
          prof = r.multiple(30000, 120000, 10000),
          dr = r.multiple(10000, 50000, 10000);
        const int = (cap * rate) / 100,
          cr = int + prof,
          cur = cr - dr,
          fl = cap + cr - dr;
        if (!whole(int) || cur <= 0) return null;
        return {
          stem: `A’s capital is ${R(cap)}. For the year, interest on capital is allowed at ${rate}% a year, A’s share of profit is ${R(prof)} and A’s drawings are ${R(dr)}. A has no other balance. Work out the accounts step by step.`,
          parts: [
            step('Step 1: interest on A’s capital', int),
            step('Step 2: total credited to A for the year (interest + share of profit)', cr),
            step('Step 3: closing balance of A’s current account if the capital is FIXED', cur),
            step('Step 4: closing balance of A’s capital account if the capital is FLUCTUATING', fl),
          ],
          hints: [
            'With fixed capital the capital account does not change; interest, profit and drawings go to the current account.',
            'With fluctuating capital they all go to the one capital account.',
          ],
          working: [
            `Step 1: ${R(cap)} × ${rate}% = ${R(int)}`,
            `Step 2: ${R(int)} + ${R(prof)} = ${R(cr)}`,
            `Step 3: ${R(cr)} − drawings ${R(dr)} = ${R(cur)} (credit); the capital account stays at ${R(cap)}`,
            `Step 4: ${R(cap)} + ${R(cr)} − ${R(dr)} = ${R(fl)}`,
          ],
          distractors: [
            dist(2, cr, 'You forgot to deduct the drawings.', 'Drawings reduce the balance of the current account.'),
            dist(3, cur, 'You gave the current account balance instead of the capital account balance.', 'With fluctuating capital the opening capital is part of the one account.'),
          ],
        };
      }),
  },
  // ───────────── Debentures issued at a discount or a premium (4 marks) ─────────────
  {
    skill: 'step-debenture-issue',
    clause: 'XII.2.debentures',
    title: 'Step-wise: issue of debentures at a discount or a premium',
    typology: 'AP',
    make: r => {
      const n = r.pick([500, 1000, 2000, 5000]),
        rate = r.pick([9, 10, 12]),
        pct = r.pick([2, 5, 10]),
        disc = r.pick([true, false]);
      const face = n * 100,
        diff = (face * pct) / 100,
        cash = disc ? face - diff : face + diff,
        interest = (face * rate) / 100;
      return {
        stem: `A company issues ${n} ${rate}% debentures of ₹100 each at a ${disc ? 'discount' : 'premium'} of ${pct}%. Work out the issue step by step.`,
        parts: [
          step('Step 1: face value of the debentures (the liability)', face),
          step(`Step 2: ${disc ? 'discount on issue of debentures (a loss)' : 'securities premium'}`, diff),
          step('Step 3: cash received from the debenture holders', cash),
          step('Step 4: interest for one year', interest),
        ],
        hints: ['The debentures are a liability at their face value, whatever price they are issued at.', 'Interest is always worked out on the face value.'],
        working: [
          `Step 1: ${n} × ₹100 = ${R(face)}`,
          `Step 2: ${R(face)} × ${pct}% = ${R(diff)}`,
          `Step 3: ${R(face)} ${disc ? '−' : '+'} ${R(diff)} = ${R(cash)}`,
          `Step 4: ${R(face)} × ${rate}% = ${R(interest)}`,
        ],
        distractors: [dist(3, (cash * rate) / 100, 'You worked the interest on the cash received.', 'Interest is on the face value of the debentures.')],
      };
    },
  },
  // ───────────── Solvency ratios (6 marks; the engine works the ratios out) ─────────────
  {
    skill: 'step-solvency-set',
    clause: 'XII.3.solvency',
    title: 'Step-wise: solvency ratios',
    typology: 'AP',
    make: r =>
      exact(() => {
        const e = r.multiple(400000, 1200000, 200000),
          d = r.multiple(100000, 600000, 100000),
          ta = e + d + r.multiple(100000, 500000, 100000),
          ebit = r.multiple(120000, 360000, 40000),
          intr = r.multiple(20000, 60000, 10000);
        if (ebit <= intr) return null;
        const ce = e + d,
          de = debtEquityRatio(M(d), M(e)),
          tad = totalAssetsToDebtRatio(M(ta), M(d)),
          pr = proprietaryRatio(M(e), M(ta)),
          dce = debtToCapitalEmployed(M(d), M(ce)),
          ic = interestCoverageRatio(M(ebit), M(intr));
        return {
          stem: `Long-term borrowings ${R(d)}; shareholders’ funds ${R(e)}; total assets ${R(ta)}; profit before interest and tax ${R(ebit)}; interest on long-term borrowings ${R(intr)}. There are no other non-current liabilities. Find the solvency ratios (to 2 decimal places) step by step.`,
          parts: [
            ratioPart('Step 1: debt-equity ratio (x : 1)', de.display),
            ratioPart('Step 2: total assets to debt ratio (x : 1)', tad.display),
            ratioPart('Step 3: proprietary ratio (x : 1)', pr.display),
            step('Step 4: capital employed', ce),
            ratioPart('Step 5: debt to capital employed ratio (x : 1)', dce.display),
            ratioPart('Step 6: interest coverage ratio (times)', ic.display),
          ],
          hints: ['Capital employed = shareholders’ funds + non-current liabilities.', 'Interest coverage uses the profit BEFORE interest and tax.'],
          working: [de.working, tad.working, pr.working, `Step 4: ${R(e)} + ${R(d)} = ${R(ce)}`, dce.working, ic.working],
          distractors: [],
        };
      }),
  },
  // ───────────── Cash flows from balance-sheet changes: investing and financing (6 marks) ─────────────
  {
    skill: 'step-cfs-balance',
    clause: 'XII.4.preparation',
    title: 'Step-wise: investing and financing cash flows from two balance sheets',
    typology: 'AEC',
    make: r =>
      exact(() => {
        const om = r.multiple(300000, 800000, 50000),
          cm = r.multiple(300000, 900000, 50000),
          dep = r.multiple(30000, 90000, 10000),
          proceeds = r.multiple(20000, 80000, 10000),
          loss = r.multiple(5000, 25000, 5000),
          intRec = r.multiple(5000, 30000, 5000),
          osc = r.multiple(500000, 1200000, 100000),
          csc = osc + r.multiple(100000, 400000, 100000),
          ol = r.multiple(200000, 600000, 100000),
          cl = r.multiple(100000, 700000, 100000),
          intPaid = r.multiple(10000, 40000, 5000),
          dv = r.multiple(10000, 50000, 10000);
        const bv = proceeds + loss,
          purchase = cm - om + dep + bv,
          inv = proceeds - purchase + intRec,
          issued = csc - osc,
          loan = cl - ol,
          fin = issued + loan - intPaid - dv;
        if (purchase <= 0 || loan === 0) return null;
        return {
          stem: `Net machinery was ${R(om)} at the start and ${R(cm)} at the end of the year. Depreciation charged was ${R(dep)}. Old machinery was sold for ${R(proceeds)} at a loss of ${R(loss)}. Interest received on investments was ${R(intRec)}. Equity share capital rose from ${R(osc)} to ${R(csc)}, all shares being issued for cash. The long-term loan was ${R(ol)} at the start and ${R(cl)} at the end. Interest paid was ${R(intPaid)} and dividend paid ${R(dv)}. Work out the investing and financing cash flows step by step.`,
          parts: [
            step('Step 1: book value of the machinery sold', bv),
            step('Step 2: machinery purchased during the year', purchase),
            step('Step 3: net cash from investing activities (− for an outflow)', inv),
            step('Step 4: shares issued for cash', issued),
            step('Step 5: loan raised (+) or repaid (−)', loan),
            step('Step 6: net cash from financing activities (− for an outflow)', fin),
          ],
          hints: [
            'Rebuild the machinery account: opening + purchases − depreciation − book value of the machinery sold = closing.',
            'Interest received is an investing inflow; interest paid and dividend paid are financing outflows.',
          ],
          working: [
            `Step 1: sale proceeds ${R(proceeds)} + loss ${R(loss)} = ${R(bv)}`,
            `Step 2: ${R(cm)} − ${R(om)} + depreciation ${R(dep)} + book value sold ${R(bv)} = ${R(purchase)}`,
            `Step 3: ${R(proceeds)} − ${R(purchase)} + interest received ${R(intRec)} = ${R(inv)}`,
            `Step 4: ${R(csc)} − ${R(osc)} = ${R(issued)}`,
            `Step 5: ${R(cl)} − ${R(ol)} = ${R(loan)}`,
            `Step 6: ${R(issued)} + (${R(loan)}) − interest paid ${R(intPaid)} − dividend paid ${R(dv)} = ${R(fin)}`,
          ],
          distractors: [
            dist(1, cm - om + dep, 'You forgot the book value of the machinery sold.', 'The old machinery that was sold also left the account, so it must be added back to find the purchases.'),
            dist(2, proceeds - purchase, 'You left out the interest received.', 'Interest received on investments is an investing inflow.'),
          ],
        };
      }),
  },
  // ───────────── Issue of shares with over-subscription (6 marks) ─────────────
  {
    skill: 'step-share-issue',
    clause: 'XII.2.issue',
    title: 'Step-wise: issue of shares with over-subscription',
    typology: 'AP',
    make: r =>
      exact(() => {
        const n = r.pick([20000, 30000, 40000, 50000]),
          [num, den] = r.pick([
            [3, 2],
            [5, 4],
            [2, 1],
          ] as const),
          applied = (n * num) / den,
          ap = r.pick([2, 3]),
          prem = r.pick([1, 2]),
          al = r.pick([4, 5]);
        const s1 = applied * ap,
          s2 = n * ap,
          s3 = (applied - n) * ap,
          s4 = n * al,
          s5 = s4 - s3,
          s6 = n * prem;
        if (!whole(applied) || s3 > s4 || prem > al) return null;
        return {
          stem: `A company offers ${n} equity shares of ₹10 each at a premium of ₹${prem} per share. ₹${ap} per share is payable on application and ₹${al} per share (including the premium) on allotment. Applications are received for ${applied} shares. The directors allot ${n} shares pro rata and adjust the excess application money against the allotment money. Work out the figures step by step.`,
          parts: [
            step('Step 1: application money received', s1),
            step('Step 2: application money on the shares allotted (transferred to share capital)', s2),
            step('Step 3: excess application money to be adjusted', s3),
            step('Step 4: allotment money due on the shares allotted', s4),
            step('Step 5: cash to be received on allotment after the adjustment', s5),
            step('Step 6: securities premium credited', s6),
          ],
          hints: [
            'Application money is received on ALL the shares applied for; only the shares allotted keep their application money.',
            'The premium is credited to securities premium on the shares allotted only.',
          ],
          working: [
            `Step 1: ${applied} × ₹${ap} = ${R(s1)}`,
            `Step 2: ${n} × ₹${ap} = ${R(s2)}`,
            `Step 3: ${R(s1)} − ${R(s2)} = ${R(s3)}`,
            `Step 4: ${n} × ₹${al} = ${R(s4)}`,
            `Step 5: ${R(s4)} − ${R(s3)} = ${R(s5)}`,
            `Step 6: ${n} × ₹${prem} = ${R(s6)}`,
          ],
          distractors: [
            dist(1, s1, 'You took the application money on all the shares applied for as share capital.', 'Only the shares allotted keep their application money; the excess is adjusted or refunded.'),
            dist(4, s4, 'You did not adjust the excess application money.', 'The excess received on application reduces what is still due on allotment.'),
          ],
        };
      }),
  },
];

export const V5_GENERATORS: readonly Gen[] = GENS;
