/**
 * V4: board-style 4- and 6-mark problems for the heavy Class XII units, each split into labelled steps (one mark per step) so a student is marked
 * the way an examiner marks: for working, not only for the last figure.
 * Every figure is whole-rupee integer arithmetic; the generators retry until every division is exact, so no rounding is ever needed.
 * Oracles: test/questions-v4.test.ts re-works each generator by hand. Not reviewed by a subject teacher (D11).
 */
import { Money } from '../../engine/src';
import type { Distractor, Gen, Part } from './questions';
import type { Rng } from './rng';

const M = (n: number) => Money.rupees(n),
  R = (n: number) => M(n).format().replace(/\.00$/, ''),
  A = (n: number) => M(n).toString();
const step = (label: string, n: number): Part => ({ label, kind: 'MONEY', answer: A(n), marks: 1 });
const pctPart = (label: string, n: number): Part => ({ label, kind: 'TEXT', answer: String(n), marks: 1 });
const dist = (part: number, n: number, mistake: string, fix: string): Distractor => ({ part, value: A(n), mistake, fix });
const HINTS_STEP = ['Do the steps in order: each step uses the result of the one before it.', 'Write the formula for each step first, then put the figures in.'];
const whole = (...xs: number[]) => xs.every(x => Number.isInteger(x));

/** Run `build` until every figure it returns is a whole number (so the generated problem needs no rounding). */
function exact<T>(r: Rng, build: () => T | null): T {
  for (let i = 0; i < 400; i++) {
    const v = build();
    if (v) return v;
  }
  void r;
  throw new Error('v4: could not build an exact problem');
}

const GENS: Gen[] = [
  // ───────────── P&L appropriation account (6 marks) ─────────────
  {
    skill: 'step-appropriation',
    clause: 'XII.1.appropriation',
    title: 'Step-wise: profit and loss appropriation account',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        const [a, b] = r.pick([
            [3, 2],
            [2, 1],
            [3, 1],
            [1, 1],
            [5, 3],
          ] as const),
          t = a + b,
          ca = r.multiple(200000, 600000, 100000),
          cb = r.multiple(100000, 500000, 100000),
          rate = r.pick([6, 8, 10, 12]),
          sal = r.multiple(12000, 60000, 6000),
          k = r.int(4, 14),
          avail = t * k * 1000;
        const ia = (ca * rate) / 100,
          ib = (cb * rate) / 100,
          np = avail + ia + ib + sal,
          sa = (avail * a) / t,
          sb = (avail * b) / t,
          totalB = ib + sal + sb;
        if (!whole(ia, ib, sa, sb)) return null;
        return {
          stem: `A and B are partners sharing profits ${a} : ${b}. Their capitals are ${R(ca)} (A) and ${R(cb)} (B). The deed allows interest on capital at ${rate}% a year and a salary of ${R(sal)} a year to B. The net profit for the year, before these items, is ${R(np)}. Prepare the appropriation step by step.`,
          parts: [
            step('Step 1: interest on A’s capital', ia),
            step('Step 2: interest on B’s capital', ib),
            step('Step 3: profit left to share (after interest and salary)', avail),
            step('Step 4: A’s share of that profit', sa),
            step('Step 5: B’s share of that profit', sb),
            step('Step 6: total credited to B (interest + salary + share)', totalB),
          ],
          hints: HINTS_STEP,
          working: [
            `Step 1: ${R(ca)} × ${rate}% = ${R(ia)}`,
            `Step 2: ${R(cb)} × ${rate}% = ${R(ib)}`,
            `Step 3: ${R(np)} − ${R(ia)} − ${R(ib)} − ${R(sal)} = ${R(avail)}`,
            `Step 4: ${R(avail)} × ${a}/${t} = ${R(sa)}`,
            `Step 5: ${R(avail)} × ${b}/${t} = ${R(sb)}`,
            `Step 6: ${R(ib)} + ${R(sal)} + ${R(sb)} = ${R(totalB)}`,
          ],
          distractors: [
            dist(2, np - ia - ib, 'You forgot to deduct B’s salary before sharing.', 'Interest on capital and salary are appropriations first; only the balance is shared in the ratio.'),
            dist(3, Math.floor((np * a) / t), 'You shared the whole net profit instead of the balance left after interest and salary.', 'Share only the profit that remains after the appropriations.'),
          ],
        };
      }),
  },
  // ───────────── Guarantee of profit (6 marks) ─────────────
  {
    skill: 'step-guarantee',
    clause: 'XII.1.guarantee',
    title: 'Step-wise: guarantee of a minimum profit',
    typology: 'AEC',
    make: r =>
      exact(r, () => {
        const [a, b] = r.pick([
            [3, 2],
            [2, 1],
            [3, 1],
          ] as const),
          t = a + b,
          n = r.pick([4, 5]),
          p = r.multiple(120000, 600000, 60000),
          cShare = p / n,
          extra = r.multiple(5000, 25000, 5000),
          guar = cShare + extra,
          rest = p - cShare,
          sa = (rest * a) / t,
          sb = (rest * b) / t,
          fa = sa - (extra * a) / t,
          fb = sb - (extra * b) / t;
        if (!whole(cShare, sa, sb, fa, fb)) return null;
        return {
          stem: `A and B share profits ${a} : ${b}. They admit C for a 1/${n} share of the profits, which A and B guarantee will not be less than ${R(guar)} a year. Any shortfall is borne by A and B in their old ratio ${a} : ${b}. The profit of the year is ${R(p)}. Work out each partner’s final share.`,
          parts: [
            step('Step 1: C’s share by the ratio', cShare),
            step('Step 2: shortfall to be made good', extra),
            step('Step 3: A’s share of the balance, before the guarantee', sa),
            step('Step 4: B’s share of the balance, before the guarantee', sb),
            step('Step 5: A’s final share (after bearing the shortfall)', fa),
            step('Step 6: B’s final share (after bearing the shortfall)', fb),
          ],
          hints: HINTS_STEP,
          working: [
            `Step 1: ${R(p)} × 1/${n} = ${R(cShare)}`,
            `Step 2: guaranteed ${R(guar)} − ${R(cShare)} = ${R(extra)}`,
            `Step 3: balance ${R(rest)} × ${a}/${t} = ${R(sa)}`,
            `Step 4: ${R(rest)} × ${b}/${t} = ${R(sb)}`,
            `Step 5: ${R(sa)} − ${R(extra)} × ${a}/${t} = ${R(fa)}`,
            `Step 6: ${R(sb)} − ${R(extra)} × ${b}/${t} = ${R(fb)}`,
          ],
          distractors: [
            dist(1, guar, 'You took the whole guaranteed amount as the shortfall.', 'The shortfall is the guarantee minus what C earns by the ratio.'),
            dist(4, sa, 'You did not charge A with his part of the shortfall.', 'A and B bear the shortfall, so each share falls by his part of it.'),
          ],
        };
      }),
  },
  // ───────────── Dissolution: realisation account (6 marks) ─────────────
  {
    skill: 'step-dissolution',
    clause: 'XII.1.dissolution',
    title: 'Step-wise: realisation account on dissolution',
    typology: 'AEC',
    make: r =>
      exact(r, () => {
        const [a, b] = r.pick([
            [1, 1],
            [3, 2],
            [2, 1],
            [3, 1],
          ] as const),
          t = a + b,
          book = r.multiple(200000, 600000, 50000),
          real = book - r.multiple(20000, 80000, 10000),
          cred = r.multiple(40000, 120000, 10000),
          paid = cred - r.pick([0, 2000, 4000, 5000]),
          exp = r.multiple(2000, 10000, 2000);
        const debit = book + paid + exp,
          credit = cred + real,
          loss = debit - credit;
        if (loss <= 0) return null;
        const sa = (loss * a) / t,
          sb = (loss * b) / t,
          gainCred = cred - paid;
        if (!whole(sa, sb)) return null;
        return {
          stem: `A firm is dissolved. Its assets other than cash (book value ${R(book)}) are sold for ${R(real)}. Creditors of ${R(cred)} are paid ${R(paid)} in full settlement. The realisation expenses of ${R(exp)} are paid. A and B share profits and losses ${a} : ${b}. Prepare the realisation account step by step.`,
          parts: [
            step('Step 1: debit side total (assets + creditors paid + expenses)', debit),
            step('Step 2: credit side total (creditors + cash from assets)', credit),
            step('Step 3: loss on realisation', loss),
            step('Step 4: A’s share of the loss', sa),
            step('Step 5: B’s share of the loss', sb),
            step('Step 6: gain on settling the creditors', gainCred),
          ],
          hints: [
            'The realisation account debits the assets at book value, the payments to creditors and the expenses; it credits the creditors at book value and the cash from the assets.',
            'The balancing figure is the profit or loss; share it in the profit-sharing ratio.',
          ],
          working: [
            `Step 1: ${R(book)} + ${R(paid)} + ${R(exp)} = ${R(debit)}`,
            `Step 2: ${R(cred)} + ${R(real)} = ${R(credit)}`,
            `Step 3: ${R(debit)} − ${R(credit)} = ${R(loss)} (loss, as the debit side is larger)`,
            `Step 4: ${R(loss)} × ${a}/${t} = ${R(sa)}`,
            `Step 5: ${R(loss)} × ${b}/${t} = ${R(sb)}`,
            `Step 6: ${R(cred)} − ${R(paid)} = ${R(gainCred)}`,
          ],
          distractors: [
            dist(2, credit - debit, 'You subtracted the other way round, so the loss looks like a profit.', 'If the debit side is larger the balance is a loss.'),
            ...(paid === cred
              ? []
              : [
                  dist(0, book + cred + exp, 'You debited the creditors at book value instead of the amount paid.', 'Creditors are debited with the amount actually paid, and credited at book value.'),
                ]),
          ],
        };
      }),
  },
  // ───────────── Admission: goodwill and capital (6 marks) ─────────────
  {
    skill: 'step-admission-full',
    clause: 'XII.1.admission',
    title: 'Step-wise: admission with goodwill by average profit',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        const [a, b] = r.pick([
            [3, 2],
            [2, 1],
            [3, 1],
            [4, 1],
          ] as const),
          t = a + b,
          n = r.pick([4, 5]),
          avg = r.multiple(60000, 240000, 20000),
          yrs = r.pick([2, 3]),
          g = avg * yrs,
          cShare = g / n,
          ga = (cShare * a) / t,
          gb = (cShare * b) / t,
          capC = r.multiple(100000, 400000, 50000),
          capA = r.multiple(150000, 500000, 50000),
          cash = capC + cShare,
          closeA = capA + ga;
        if (!whole(cShare, ga, gb)) return null;
        return {
          stem: `A and B share profits ${a} : ${b}. C is admitted for a 1/${n} share, which he takes from A and B in their old ratio. The average profit of the firm is ${R(avg)} and goodwill is valued at ${yrs} years’ purchase of it. C brings ${R(capC)} as capital and his share of goodwill in cash. A’s capital before admission is ${R(capA)}. Work out the entries.`,
          parts: [
            step('Step 1: goodwill of the firm', g),
            step('Step 2: C’s share of goodwill', cShare),
            step('Step 3: credited to A for goodwill', ga),
            step('Step 4: credited to B for goodwill', gb),
            step('Step 5: total cash brought in by C', cash),
            step('Step 6: A’s capital after crediting goodwill', closeA),
          ],
          hints: HINTS_STEP,
          working: [
            `Step 1: ${R(avg)} × ${yrs} = ${R(g)}`,
            `Step 2: ${R(g)} × 1/${n} = ${R(cShare)}`,
            `Step 3: sacrificing ratio = old ratio ${a} : ${b}; ${R(cShare)} × ${a}/${t} = ${R(ga)}`,
            `Step 4: ${R(cShare)} × ${b}/${t} = ${R(gb)}`,
            `Step 5: capital ${R(capC)} + goodwill ${R(cShare)} = ${R(cash)}`,
            `Step 6: ${R(capA)} + ${R(ga)} = ${R(closeA)}`,
          ],
          distractors: [
            dist(1, g, 'You took the whole goodwill as C’s share.', 'C pays only for his own share of the goodwill.'),
            dist(4, capC, 'You left out the goodwill that C brings in cash.', 'C brings capital and his share of goodwill.'),
          ],
        };
      }),
  },
  // ───────────── Retirement (6 marks) ─────────────
  {
    skill: 'step-retirement-full',
    clause: 'XII.1.retirement',
    title: 'Step-wise: settling a retiring partner',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        // A, B and C share 3 : 2 : 1; C retires; A and B continue 3 : 2, so they gain in the ratio 3 : 2
        const cap = r.multiple(150000, 400000, 50000),
          g = r.multiple(60000, 360000, 60000),
          res = r.multiple(60000, 240000, 60000),
          loss = r.multiple(6000, 36000, 6000),
          cg = g / 6,
          ga = (cg * 3) / 5,
          gb = (cg * 2) / 5,
          cres = res / 6,
          closs = loss / 6,
          due = cap + cg + cres - closs;
        if (!whole(cg, ga, gb, cres, closs)) return null;
        return {
          stem: `A, B and C share profits 3 : 2 : 1. C retires and A and B continue to share profits 3 : 2. The goodwill of the firm is ${R(g)}; the general reserve is ${R(res)}; the revaluation of assets shows a loss of ${R(loss)}. C’s capital is ${R(cap)}. A and B pay C his goodwill, and they bring it in the gaining ratio. Find what is due to C.`,
          parts: [
            step('Step 1: C’s share of goodwill', cg),
            step('Step 2: paid by A (in the gaining ratio 3 : 2)', ga),
            step('Step 3: paid by B (in the gaining ratio 3 : 2)', gb),
            step('Step 4: C’s share of the general reserve', cres),
            step('Step 5: C’s share of the revaluation loss', closs),
            step('Step 6: total due to C', due),
          ],
          hints: ['The gaining ratio is new share − old share for each continuing partner.', 'Reserves and revaluation are shared by all partners in the OLD ratio.'],
          working: [
            `Step 1: ${R(g)} × 1/6 = ${R(cg)}`,
            `Step 2: A’s gain 3/5 − 3/6 = 1/10 and B’s gain 2/5 − 2/6 = 1/15, so the gaining ratio is 3 : 2; ${R(cg)} × 3/5 = ${R(ga)}`,
            `Step 3: ${R(cg)} × 2/5 = ${R(gb)}`,
            `Step 4: ${R(res)} × 1/6 = ${R(cres)}`,
            `Step 5: ${R(loss)} × 1/6 = ${R(closs)}`,
            `Step 6: ${R(cap)} + ${R(cg)} + ${R(cres)} − ${R(closs)} = ${R(due)}`,
          ],
          distractors: [
            dist(5, cap + cg + cres + closs, 'You added the revaluation loss instead of deducting it.', 'A loss on revaluation reduces what is due to the retiring partner.'),
            dist(3, res / 5, 'You shared the reserve in the new ratio.', 'Reserves belong to all partners in the old ratio, so C gets 1/6.'),
          ],
        };
      }),
  },
  // ───────────── Forfeiture and re-issue (6 marks) ─────────────
  {
    skill: 'step-forfeit-full',
    clause: 'XII.2.forfeiture',
    title: 'Step-wise: forfeiture and re-issue of shares',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        const n = r.pick([100, 200, 300, 500]),
          fv = 10,
          called = r.pick([7, 8, 9]),
          paid = r.pick([4, 5, 6]),
          arrears = called - paid,
          reis = r.pick([7, 8, 9]),
          disc = fv - reis,
          sc = n * called,
          fa = n * paid,
          ca = n * arrears,
          dd = n * disc,
          bank = n * reis,
          cr = fa - dd;
        if (cr < 0 || paid > called) return null;
        return {
          stem: `${n} equity shares of ₹${fv} each, issued at par, on which ₹${called} per share had been called, are forfeited because the holder paid only ₹${paid} per share. The shares are re-issued at ₹${reis} per share as fully paid. Work out the entries step by step.`,
          parts: [
            step('Step 1: share capital debited on forfeiture (called-up amount)', sc),
            step('Step 2: credited to the share forfeiture account', fa),
            step('Step 3: calls in arrears credited', ca),
            step('Step 4: discount allowed on re-issue (charged to forfeiture)', dd),
            step('Step 5: cash received on re-issue', bank),
            step('Step 6: capital reserve after the re-issue', cr),
          ],
          hints: ['On forfeiture the share capital is debited with the amount CALLED, not the face value.', 'The amount in the forfeiture account after the re-issue discount is a capital profit.'],
          working: [
            `Step 1: ${n} × ₹${called} = ${R(sc)}`,
            `Step 2: ${n} × ₹${paid} = ${R(fa)}`,
            `Step 3: ${n} × (₹${called} − ₹${paid}) = ${R(ca)}`,
            `Step 4: ${n} × (₹${fv} − ₹${reis}) = ${R(dd)}`,
            `Step 5: ${n} × ₹${reis} = ${R(bank)}`,
            `Step 6: ${R(fa)} − ${R(dd)} = ${R(cr)}`,
          ],
          distractors: [
            dist(0, n * fv, 'You debited share capital with the face value.', 'Debit share capital with the amount called up.'),
            dist(5, fa, 'You forgot to deduct the discount on re-issue from the forfeiture balance.', 'Capital reserve = amount forfeited − discount allowed on re-issue.'),
          ],
        };
      }),
  },
  // ───────────── Profitability ratios (6 marks) ─────────────
  {
    skill: 'step-profit-ratios',
    clause: 'XII.3.profitability',
    title: 'Step-wise: profitability ratios',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        const rev = r.multiple(500000, 2000000, 100000),
          cp = r.pick([40, 45, 50, 55, 60]),
          op = r.pick([10, 15, 20]),
          np = r.pick([4, 5, 6, 8]),
          cost = (rev * cp) / 100,
          opx = (rev * op) / 100,
          net = (rev * np) / 100;
        const gpr = 100 - cp,
          opr = cp + op,
          opp = 100 - opr;
        if (!whole(cost, opx, net) || opp <= np || opp <= 0) return null;
        return {
          stem: `Revenue from operations is ${R(rev)}. The cost of revenue from operations is ${R(cost)}, operating expenses are ${R(opx)} and the net profit after tax is ${R(net)}. Find the profitability ratios, in percent.`,
          parts: [
            step('Step 1: gross profit', rev - cost),
            pctPart('Step 2: gross profit ratio (%)', gpr),
            pctPart('Step 3: operating ratio (%)', opr),
            step('Step 4: operating profit', rev - cost - opx),
            pctPart('Step 5: operating profit ratio (%)', opp),
            pctPart('Step 6: net profit ratio (%)', np),
          ],
          hints: ['Gross profit = revenue − cost of revenue. Operating cost = cost of revenue + operating expenses.', 'Each ratio is a profit or cost figure ÷ revenue × 100.'],
          working: [
            `Step 1: ${R(rev)} − ${R(cost)} = ${R(rev - cost)}`,
            `Step 2: ${R(rev - cost)} ÷ ${R(rev)} × 100 = ${gpr}%`,
            `Step 3: (${R(cost)} + ${R(opx)}) ÷ ${R(rev)} × 100 = ${opr}%`,
            `Step 4: ${R(rev)} − (${R(cost)} + ${R(opx)}) = ${R(rev - cost - opx)}`,
            `Step 5: ${R(rev - cost - opx)} ÷ ${R(rev)} × 100 = ${opp}% (= 100 − operating ratio)`,
            `Step 6: ${R(net)} ÷ ${R(rev)} × 100 = ${np}%`,
          ],
          distractors: [],
        };
      }),
  },

  // ═════════════ Class XI ═════════════
  // ───────────── Trading and profit and loss account (6 marks) ─────────────
  {
    skill: 'step-trading-pl-full',
    clause: 'XI.3.trading-pl',
    title: 'Step-wise: trading and profit and loss account',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        const os = r.multiple(40000, 120000, 10000),
          pu = r.multiple(200000, 500000, 10000),
          pr = r.multiple(5000, 20000, 5000),
          ci = r.multiple(2000, 10000, 2000),
          cs = r.multiple(30000, 110000, 10000),
          gp = r.multiple(60000, 200000, 20000),
          sr = r.multiple(2000, 10000, 2000),
          oi = r.multiple(2000, 10000, 2000),
          ie = r.multiple(20000, 60000, 10000);
        const net = pu - pr,
          cogs = os + net + ci - cs,
          nsales = cogs + gp,
          sales = nsales + sr,
          np = gp + oi - ie;
        if (cogs <= 0 || ie >= gp + oi) return null;
        return {
          stem: `A trader’s books show: opening stock ${R(os)}; purchases ${R(pu)}; purchases returns ${R(pr)}; carriage inwards ${R(ci)}; sales ${R(sales)}; sales returns ${R(sr)}; closing stock ${R(cs)}; commission received ${R(oi)}; indirect expenses ${R(ie)}. Prepare the trading and profit and loss account step by step.`,
          parts: [
            step('Step 1: net purchases', net),
            step('Step 2: cost of goods sold', cogs),
            step('Step 3: net sales', nsales),
            step('Step 4: gross profit', gp),
            step('Step 5: net profit', np),
            step('Step 6: total of the trading account (each side)', nsales + cs),
          ],
          hints: [
            'Cost of goods sold = opening stock + net purchases + direct expenses − closing stock.',
            'Gross profit comes from the trading account; the profit and loss account adds other income and deducts indirect expenses.',
          ],
          working: [
            `Step 1: ${R(pu)} − ${R(pr)} = ${R(net)}`,
            `Step 2: ${R(os)} + ${R(net)} + ${R(ci)} − ${R(cs)} = ${R(cogs)}`,
            `Step 3: ${R(sales)} − ${R(sr)} = ${R(nsales)}`,
            `Step 4: ${R(nsales)} − ${R(cogs)} = ${R(gp)}`,
            `Step 5: ${R(gp)} + ${R(oi)} − ${R(ie)} = ${R(np)}`,
            `Step 6: credit side = net sales ${R(nsales)} + closing stock ${R(cs)} = ${R(nsales + cs)}`,
          ],
          distractors: [
            dist(1, os + pu + ci - cs, 'You did not deduct the purchases returns.', 'Net purchases = purchases − purchases returns.'),
            dist(4, gp - ie, 'You forgot the commission received.', 'Other income is added in the profit and loss account.'),
          ],
        };
      }),
  },
  // ───────────── Bank reconciliation statement (6 marks) ─────────────
  {
    skill: 'step-brs-full',
    clause: 'XI.2.brs',
    title: 'Step-wise: bank reconciliation statement',
    typology: 'AP',
    make: r => {
      const cb = r.multiple(100000, 300000, 10000),
        iss = r.multiple(5000, 30000, 5000),
        dep = r.multiple(5000, 30000, 5000),
        ic = r.multiple(500, 3000, 500),
        bc = r.multiple(200, 1500, 100),
        dp = r.multiple(2000, 9000, 1000);
      const s1 = cb + iss,
        s2 = s1 - dep,
        s3 = s2 + ic,
        s4 = s3 - bc,
        s5 = s4 - dp;
      return {
        stem: `The cash book shows a favourable bank balance of ${R(cb)}. Cheques issued ${R(iss)} have not yet been presented; cheques deposited ${R(dep)} have not yet been collected; the bank has credited interest ${R(ic)}, charged ${R(bc)} for services and paid an insurance premium of ${R(dp)} directly, none of which is in the cash book. Starting from the cash book balance, find the passbook balance step by step.`,
        parts: [
          step('Step 1: after adding cheques issued but not presented', s1),
          step('Step 2: after deducting cheques deposited but not collected', s2),
          step('Step 3: after adding the interest credited by the bank', s3),
          step('Step 4: after deducting the bank charges', s4),
          step('Step 5: after deducting the premium paid by the bank (balance as per passbook)', s5),
          step('Step 6: net adjustment needed in the cash book (+ increase, − decrease)', ic - bc - dp),
        ],
        hints: [
          'Starting from the cash book, ADD cheques issued not presented and bank credits not yet in the cash book.',
          'DEDUCT cheques deposited not collected and bank debits not yet in the cash book.',
        ],
        working: [
          `Step 1: ${R(cb)} + ${R(iss)} = ${R(s1)}`,
          `Step 2: ${R(s1)} − ${R(dep)} = ${R(s2)}`,
          `Step 3: ${R(s2)} + ${R(ic)} = ${R(s3)}`,
          `Step 4: ${R(s3)} − ${R(bc)} = ${R(s4)}`,
          `Step 5: ${R(s4)} − ${R(dp)} = ${R(s5)}`,
          `Step 6: the cash book needs the interest (+${R(ic)}), the charges (−${R(bc)}) and the premium (−${R(dp)}): ${R(ic)} − ${R(bc)} − ${R(dp)} = ${R(ic - bc - dp)}`,
        ],
        distractors: [
          dist(1, s1 + dep, 'You added the cheques deposited but not collected.', 'Those cheques are not yet in the bank, so they are deducted when starting from the cash book.'),
          dist(0, cb - iss, 'You deducted the cheques issued but not presented.', 'The bank has not paid them yet, so the passbook is higher: add them.'),
        ],
      };
    },
  },
  // ───────────── Provision for bad debts (6 marks) ─────────────
  {
    skill: 'step-provision-full',
    clause: 'XI.2.provisions',
    title: 'Step-wise: bad debts and provision for bad debts',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        const rate = r.pick([5, 10]),
          d = r.multiple(200000, 600000, 20000),
          bd = r.multiple(4000, 16000, 2000),
          op = r.multiple(5000, 20000, 1000),
          good = d - bd,
          np = (good * rate) / 100,
          chg = np - op;
        if (!whole(np)) return null;
        return {
          stem: `Debtors at the end of the year are ${R(d)} before writing off bad debts of ${R(bd)}. The provision for bad debts at the beginning of the year was ${R(op)}, and the provision required is ${rate}% on the debtors left. Work out the effect on the accounts step by step.`,
          parts: [
            step('Step 1: debtors after writing off bad debts', good),
            step('Step 2: provision required at the end', np),
            step('Step 3: provision already in the books', op),
            step('Step 4: charge (+) or credit (−) to the profit and loss account for the provision', chg),
            step('Step 5: total charged for bad debts and provision', bd + chg),
            step('Step 6: debtors shown in the balance sheet (net of provision)', good - np),
          ],
          hints: [
            'The new provision is a percentage of the debtors LEFT after bad debts are written off.',
            'Only the difference between the new and the old provision goes to the profit and loss account.',
          ],
          working: [
            `Step 1: ${R(d)} − ${R(bd)} = ${R(good)}`,
            `Step 2: ${R(good)} × ${rate}% = ${R(np)}`,
            `Step 3: given: ${R(op)}`,
            `Step 4: ${R(np)} − ${R(op)} = ${R(chg)}`,
            `Step 5: ${R(bd)} + (${R(chg)}) = ${R(bd + chg)}`,
            `Step 6: ${R(good)} − ${R(np)} = ${R(good - np)}`,
          ],
          distractors: [
            dist(1, (d * rate) / 100, 'You took the provision on the debtors before writing off the bad debts.', 'Write off the bad debts first; the provision is on what is left.'),
            dist(3, np + op, 'You added the old provision instead of finding the difference.', 'Charge only the increase (or credit the decrease) in the provision.'),
          ],
        };
      }),
  },
  // ───────────── Two-column cash book (6 marks) ─────────────
  {
    skill: 'step-cashbook-full',
    clause: 'XI.2.cashbook',
    title: 'Step-wise: cash book with cash and bank columns',
    typology: 'AP',
    make: r => {
      const oc = r.multiple(20000, 60000, 5000),
        ob = r.multiple(60000, 150000, 10000),
        cs = r.multiple(30000, 90000, 10000),
        wd = r.multiple(5000, 20000, 5000),
        dep = r.multiple(10000, 40000, 5000),
        w = r.multiple(5000, 15000, 5000),
        rc = r.multiple(10000, 50000, 10000),
        ch = r.multiple(20000, 60000, 10000);
      const cr = oc + cs + wd,
        cp = dep + w,
        br = ob + dep + rc,
        bp = ch + wd;
      return {
        stem: `A two-column cash book (cash and bank) opens with cash ${R(oc)} and bank ${R(ob)}. During the month: cash sales ${R(cs)}; cash withdrawn from the bank for office use ${R(wd)}; cash deposited into the bank ${R(dep)}; wages paid in cash ${R(w)}; a cheque received from a customer and banked at once ${R(rc)}; a cheque paid to a supplier ${R(ch)}. Balance both columns step by step.`,
        parts: [
          step('Step 1: total of the cash column, debit side', cr),
          step('Step 2: total payments in the cash column', cp),
          step('Step 3: closing cash balance', cr - cp),
          step('Step 4: total of the bank column, debit side', br),
          step('Step 5: total payments in the bank column', bp),
          step('Step 6: closing bank balance', br - bp),
        ],
        hints: [
          'A contra entry (cash withdrawn from the bank, cash deposited into the bank) appears on both sides of the cash book: debit one column and credit the other.',
          'Add the receipts, add the payments, and the difference is the closing balance.',
        ],
        working: [
          `Step 1: cash column debit = opening ${R(oc)} + cash sales ${R(cs)} + withdrawn from bank ${R(wd)} = ${R(cr)}`,
          `Step 2: cash column credit = deposited into bank ${R(dep)} + wages ${R(w)} = ${R(cp)}`,
          `Step 3: ${R(cr)} − ${R(cp)} = ${R(cr - cp)}`,
          `Step 4: bank column debit = opening ${R(ob)} + deposit ${R(dep)} + cheque received ${R(rc)} = ${R(br)}`,
          `Step 5: bank column credit = cheque to supplier ${R(ch)} + withdrawn ${R(wd)} = ${R(bp)}`,
          `Step 6: ${R(br)} − ${R(bp)} = ${R(br - bp)}`,
        ],
        distractors: [
          dist(2, cr - w, 'You did not credit the cash deposited into the bank in the cash column.', 'A deposit is a contra entry: credit cash, debit bank.'),
          dist(5, br - ch, 'You did not credit the bank for the cash withdrawn.', 'A withdrawal is a contra entry: debit cash, credit bank.'),
        ],
      };
    },
  },
  // ───────────── Written down value over three years, then a sale (6 marks) ─────────────
  {
    skill: 'step-dep-wdv-full',
    clause: 'XI.2.depreciation',
    title: 'Step-wise: WDV depreciation for three years and sale',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        const c = r.multiple(100000, 500000, 100000),
          rate = r.pick([10, 20]),
          d1 = (c * rate) / 100,
          b1 = c - d1,
          d2 = (b1 * rate) / 100,
          b2 = b1 - d2,
          d3 = (b2 * rate) / 100,
          b3 = b2 - d3,
          sp = b3 + r.pick([-5000, -3000, 3000, 5000]);
        if (!whole(d1, d2, d3)) return null;
        return {
          stem: `A machine costing ${R(c)} is depreciated at ${rate}% a year by the Written Down Value method. At the end of the third year it is sold for ${R(sp)}. Work out the figures step by step.`,
          parts: [
            step('Step 1: depreciation for year 1', d1),
            step('Step 2: depreciation for year 2', d2),
            step('Step 3: depreciation for year 3', d3),
            step('Step 4: book value at the end of year 3', b3),
            step('Step 5: total depreciation charged in the three years', d1 + d2 + d3),
            step('Step 6: profit (+) or loss (−) on sale', sp - b3),
          ],
          hints: ['Each year the rate is applied to the opening book value, not to the cost.', 'Profit or loss on sale = sale price − book value on the date of sale.'],
          working: [
            `Step 1: ${R(c)} × ${rate}% = ${R(d1)}`,
            `Step 2: (${R(c)} − ${R(d1)}) × ${rate}% = ${R(b1)} × ${rate}% = ${R(d2)}`,
            `Step 3: (${R(b1)} − ${R(d2)}) × ${rate}% = ${R(b2)} × ${rate}% = ${R(d3)}`,
            `Step 4: ${R(b2)} − ${R(d3)} = ${R(b3)}`,
            `Step 5: ${R(d1)} + ${R(d2)} + ${R(d3)} = ${R(d1 + d2 + d3)}`,
            `Step 6: ${R(sp)} − ${R(b3)} = ${R(sp - b3)}`,
          ],
          distractors: [
            dist(1, d1, 'You applied the rate to the original cost in year 2.', 'In the WDV method the rate applies to the opening book value each year.'),
            dist(5, b3 - sp, 'You subtracted the other way round.', 'Profit or loss = sale price − book value.'),
          ],
        };
      }),
  },
  // ───────────── Balance sheet from final figures (6 marks) ─────────────
  {
    skill: 'step-balance-sheet-full',
    clause: 'XI.3.balance-sheet',
    title: 'Step-wise: closing capital and the balance sheet',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        const oc = r.multiple(200000, 500000, 50000),
          np = r.multiple(40000, 150000, 10000),
          d = r.multiple(10000, 40000, 10000),
          ll = r.multiple(50000, 150000, 50000),
          cr = r.multiple(20000, 80000, 10000),
          fa = r.multiple(250000, 600000, 50000),
          stock = r.multiple(30000, 100000, 10000),
          deb = r.multiple(20000, 80000, 10000);
        const cc = oc + np - d,
          tl = cc + ll + cr,
          ca = tl - fa,
          cash = ca - stock - deb,
          wc = ca - cr;
        if (cash < 10000 || wc <= 0) return null;
        return {
          stem: `A trader’s capital at the start was ${R(oc)}. For the year, net profit was ${R(np)} and drawings ${R(d)}. At the end he owes a long-term loan of ${R(ll)} and creditors ${R(cr)}. His fixed assets are ${R(fa)}, stock ${R(stock)} and debtors ${R(deb)}; the rest of his assets is cash. Prepare the balance sheet figures step by step.`,
          parts: [
            step('Step 1: closing capital', cc),
            step('Step 2: total liabilities side of the balance sheet', tl),
            step('Step 3: total current assets', ca),
            step('Step 4: cash balance', cash),
            step('Step 5: working capital (current assets − current liabilities)', wc),
            step('Step 6: total of the assets side', fa + ca),
          ],
          hints: ['Closing capital = opening capital + net profit − drawings.', 'Both sides of the balance sheet must be equal: use the liabilities total to find the assets that are not given.'],
          working: [
            `Step 1: ${R(oc)} + ${R(np)} − ${R(d)} = ${R(cc)}`,
            `Step 2: ${R(cc)} + ${R(ll)} + ${R(cr)} = ${R(tl)}`,
            `Step 3: ${R(tl)} − fixed assets ${R(fa)} = ${R(ca)}`,
            `Step 4: ${R(ca)} − stock ${R(stock)} − debtors ${R(deb)} = ${R(cash)}`,
            `Step 5: ${R(ca)} − creditors ${R(cr)} = ${R(wc)}`,
            `Step 6: ${R(fa)} + ${R(ca)} = ${R(fa + ca)} (equal to the liabilities side)`,
          ],
          distractors: [
            dist(0, oc + np + d, 'You added the drawings.', 'Drawings reduce the capital.'),
            dist(4, ca, 'You forgot to deduct the current liabilities.', 'Working capital = current assets − current liabilities.'),
          ],
        };
      }),
  },
  // ───────────── Incomplete records: statement of affairs (6 marks) ─────────────
  {
    skill: 'step-incomplete-full',
    clause: 'XI.3.incomplete',
    title: 'Step-wise: profit from the statement of affairs',
    typology: 'AP',
    make: r => {
      const oa = r.multiple(200000, 500000, 50000),
        ol = r.multiple(30000, 100000, 10000),
        ca = r.multiple(250000, 600000, 50000),
        cl = r.multiple(30000, 120000, 10000),
        dc = r.multiple(10000, 40000, 10000),
        dg = r.multiple(2000, 10000, 2000),
        fresh = r.multiple(10000, 50000, 10000);
      const oc = oa - ol,
        cc = ca - cl,
        d = dc + dg,
        inc = cc - oc;
      return {
        stem: `A trader keeps no proper books. At the beginning of the year his assets were ${R(oa)} and his liabilities ${R(ol)}. At the end his assets were ${R(ca)} and his liabilities ${R(cl)}. During the year he withdrew ${R(dc)} in cash and took goods costing ${R(dg)} for his home, and he brought in ${R(fresh)} of fresh capital. Find the profit or loss for the year step by step.`,
        parts: [
          step('Step 1: capital at the beginning', oc),
          step('Step 2: capital at the end', cc),
          step('Step 3: total drawings (cash and goods)', d),
          step('Step 4: increase (+) or decrease (−) in capital', inc),
          step('Step 5: after adding back the drawings', inc + d),
          step('Step 6: profit (+) or loss (−) for the year (after deducting the fresh capital)', inc + d - fresh),
        ],
        hints: ['Capital at any date = assets − liabilities.', 'Profit = closing capital − opening capital + drawings − fresh capital introduced.'],
        working: [
          `Step 1: ${R(oa)} − ${R(ol)} = ${R(oc)}`,
          `Step 2: ${R(ca)} − ${R(cl)} = ${R(cc)}`,
          `Step 3: ${R(dc)} + ${R(dg)} = ${R(d)}`,
          `Step 4: ${R(cc)} − ${R(oc)} = ${R(inc)}`,
          `Step 5: ${R(inc)} + ${R(d)} = ${R(inc + d)}`,
          `Step 6: ${R(inc + d)} − ${R(fresh)} = ${R(inc + d - fresh)}`,
        ],
        distractors: [
          dist(5, inc + d + fresh, 'You added the fresh capital instead of deducting it.', 'Fresh capital raised the closing capital but is not profit, so deduct it.'),
          dist(4, inc - d, 'You deducted the drawings instead of adding them back.', 'Drawings reduced the capital, so add them back to find the profit.'),
        ],
      };
    },
  },
  // ═════════════ Class XII · Option II (Computerised Accounting) ═════════════
  // ───────────── Spreadsheet: WDV schedule (6 marks) ─────────────
  {
    skill: 'step-sheet-wdv',
    clause: 'XII.C.spreadsheet',
    title: 'Step-wise: depreciation schedule in a spreadsheet',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        const c = r.multiple(100000, 500000, 100000),
          rate = r.pick([10, 20]),
          d1 = (c * rate) / 100,
          b1 = c - d1,
          d2 = (b1 * rate) / 100,
          b2 = b1 - d2,
          d3 = (b2 * rate) / 100,
          b3 = b2 - d3;
        if (!whole(d1, d2, d3)) return null;
        return {
          stem: `In a spreadsheet, cell B2 holds the cost ${R(c)} and B3 holds the Written Down Value rate ${rate}%. Row 6 is year 1, row 7 is year 2 and row 8 is year 3; column C is depreciation (=opening value × B3) and column D is the closing book value. Give the value each cell will show.`,
          parts: [
            step('C6: year 1 depreciation (=B2*B3)', d1),
            step('D6: year 1 closing value (=B2-C6)', b1),
            step('C7: year 2 depreciation (=D6*B3)', d2),
            step('D7: year 2 closing value (=D6-C7)', b2),
            step('C8: year 3 depreciation (=D7*B3)', d3),
            step('D8: year 3 closing value (=D7-C8)', b3),
          ],
          hints: ['Each year’s depreciation uses the previous year’s closing value, not the cost.', 'Copy the formula down: only the row it points at changes.'],
          working: [
            `C6: ${R(c)} × ${rate}% = ${R(d1)}`,
            `D6: ${R(c)} − ${R(d1)} = ${R(b1)}`,
            `C7: ${R(b1)} × ${rate}% = ${R(d2)}`,
            `D7: ${R(b1)} − ${R(d2)} = ${R(b2)}`,
            `C8: ${R(b2)} × ${rate}% = ${R(d3)}`,
            `D8: ${R(b2)} − ${R(d3)} = ${R(b3)}`,
          ],
          distractors: [dist(2, d1, 'You applied the rate to the cost again in year 2.', 'In row 7 the formula uses D6 (the closing value of year 1), not B2.')],
        };
      }),
  },
  // ───────────── Spreadsheet: loan schedule with equal principal (6 marks) ─────────────
  {
    skill: 'step-sheet-loan',
    clause: 'XII.C.spreadsheet',
    title: 'Step-wise: loan repayment schedule in a spreadsheet',
    typology: 'AP',
    make: r =>
      exact(r, () => {
        const loan = r.multiple(300000, 900000, 300000),
          rate = r.pick([10, 12]),
          pr = loan / 3,
          i1 = (loan * rate) / 100,
          o2 = loan - pr,
          i2 = (o2 * rate) / 100,
          o3 = o2 - pr,
          i3 = (o3 * rate) / 100;
        if (!whole(pr, i1, i2, i3)) return null;
        return {
          stem: `A loan of ${R(loan)} is repaid in three equal yearly instalments of principal. Interest at ${rate}% a year is charged on the balance at the start of each year and paid with the instalment. Fill in the repayment schedule that a spreadsheet would produce.`,
          parts: [
            step('Year 1: interest', i1),
            step('Year 1: total paid (principal + interest)', pr + i1),
            step('Year 2: balance at the start', o2),
            step('Year 2: interest', i2),
            step('Year 3: interest', i3),
            step('Total interest over the three years', i1 + i2 + i3),
          ],
          hints: ['Each year’s interest is on the balance at the START of that year.', 'The balance falls by one principal instalment every year.'],
          working: [
            `Year 1: ${R(loan)} × ${rate}% = ${R(i1)}`,
            `Year 1 paid: principal ${R(pr)} + interest ${R(i1)} = ${R(pr + i1)}`,
            `Year 2 opening balance: ${R(loan)} − ${R(pr)} = ${R(o2)}`,
            `Year 2 interest: ${R(o2)} × ${rate}% = ${R(i2)}`,
            `Year 3 interest: (${R(o2)} − ${R(pr)}) × ${rate}% = ${R(o3)} × ${rate}% = ${R(i3)}`,
            `Total: ${R(i1)} + ${R(i2)} + ${R(i3)} = ${R(i1 + i2 + i3)}`,
          ],
          distractors: [dist(3, i1, 'You charged year 2 interest on the original loan.', 'The balance has fallen by the first instalment, so interest is on the smaller balance.')],
        };
      }),
  },
];

export const V4_GENERATORS: readonly Gen[] = GENS;
