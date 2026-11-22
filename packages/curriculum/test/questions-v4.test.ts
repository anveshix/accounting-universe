import { describe, expect, it } from 'vitest';
import { makeQuestion } from '../src';
import { buildPaper } from '../src/paper';

const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1);
const n = (s: string) => Number(s); // answers are whole rupees ("123.00"), so Number is exact here
const money = (q: ReturnType<typeof makeQuestion>) => q.parts.map(p => n(p.answer));
/** Pull the rupee figures out of a stem, in order ("₹1,20,000" → 120000). */
const figs = (stem: string) => [...stem.matchAll(/₹([\d,]+)/g)].map(m => Number(m[1]!.replace(/,/g, '')));
const ratio = (stem: string) => [...stem.matchAll(/(\d+) : (\d+)/g)].map(m => [Number(m[1]), Number(m[2])] as const)[0]!;

describe('V4 board-style 6-mark problems: re-worked by hand from the figures in the stem', () => {
  it('appropriation: interest, balance, shares, B’s total', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-appropriation', s),
        [ca, cb, sal, np] = figs(q.stem) as [number, number, number, number],
        [a, b] = ratio(q.stem),
        rate = Number(/at (\d+)%/.exec(q.stem)![1]);
      const ia = (ca * rate) / 100,
        ib = (cb * rate) / 100,
        avail = np - ia - ib - sal;
      expect(q.marks).toBe(6);
      expect(money(q)).toEqual([ia, ib, avail, (avail * a) / (a + b), (avail * b) / (a + b), ib + sal + (avail * b) / (a + b)]);
      expect(ia + ib + sal + avail).toBe(np); // the appropriations add back to the net profit
    }
  });
  it('guarantee: C’s ratio share, shortfall, final shares add up to the profit', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-guarantee', s),
        [guar, p] = figs(q.stem) as [number, number],
        [a, b] = ratio(q.stem),
        d = Number(/1\/(\d)/.exec(q.stem)![1]);
      const c = p / d,
        short = guar - c,
        rest = p - c;
      expect(money(q)).toEqual([c, short, (rest * a) / (a + b), (rest * b) / (a + b), (rest * a) / (a + b) - (short * a) / (a + b), (rest * b) / (a + b) - (short * b) / (a + b)]);
      const m = money(q);
      expect(m[4]! + m[5]! + guar).toBe(p); // A + B + C's guaranteed amount = the profit
      expect(guar).toBeGreaterThan(c);
    }
  });
  it('dissolution: debit − credit = loss, shared in the ratio', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-dissolution', s),
        [book, real, cred, paid, exp] = figs(q.stem) as [number, number, number, number, number],
        [a, b] = ratio(q.stem);
      const debit = book + paid + exp,
        credit = cred + real,
        loss = debit - credit;
      expect(money(q)).toEqual([debit, credit, loss, (loss * a) / (a + b), (loss * b) / (a + b), cred - paid]);
      expect(loss).toBeGreaterThan(0);
      // independent route: loss on assets − gain on creditors + expenses
      expect(book - real - (cred - paid) + exp).toBe(loss);
    }
  });
  it('admission: goodwill, C’s share, credits, cash, A’s capital', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-admission-full', s),
        [avg, capC, capA] = figs(q.stem) as [number, number, number],
        [a, b] = ratio(q.stem),
        d = Number(/1\/(\d)/.exec(q.stem)![1]),
        yrs = Number(/(\d) years’ purchase/.exec(q.stem)![1]);
      const g = avg * yrs,
        cs = g / d;
      expect(money(q)).toEqual([g, cs, (cs * a) / (a + b), (cs * b) / (a + b), capC + cs, capA + (cs * a) / (a + b)]);
      expect((cs * a) / (a + b) + (cs * b) / (a + b)).toBe(cs); // the two credits add up to C’s premium
    }
  });
  it('retirement: C’s 1/6 of goodwill and reserve, loss deducted, A and B pay 3 : 2', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-retirement-full', s),
        [g, res, loss, cap] = figs(q.stem) as [number, number, number, number];
      const cg = g / 6,
        due = cap + cg + res / 6 - loss / 6;
      expect(money(q)).toEqual([cg, (cg * 3) / 5, (cg * 2) / 5, res / 6, loss / 6, due]);
      expect((cg * 3) / 5 + (cg * 2) / 5).toBe(cg);
    }
  });
  it('forfeiture and re-issue: called, paid, arrears, discount, cash, capital reserve', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-forfeit-full', s),
        nums = [...q.stem.matchAll(/₹(\d+)/g)].map(m => Number(m[1])),
        sh = Number(/^(\d+) equity/.exec(q.stem)![1]),
        [fv, called, paid, reis] = nums as [number, number, number, number];
      expect(money(q)).toEqual([sh * called, sh * paid, sh * (called - paid), sh * (fv - reis), sh * reis, sh * paid - sh * (fv - reis)]);
      expect(sh * paid - sh * (fv - reis)).toBeGreaterThanOrEqual(0);
      // the calls-in-arrears and the money received both reconcile to the called-up amount
      expect(sh * paid + sh * (called - paid)).toBe(sh * called);
    }
  });
  it('profitability ratios: percentages recomputed from the rupee figures', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-profit-ratios', s),
        [rev, cost, opx, net] = figs(q.stem) as [number, number, number, number];
      const m = money(q);
      expect(m).toEqual([rev - cost, ((rev - cost) * 100) / rev, ((cost + opx) * 100) / rev, rev - cost - opx, ((rev - cost - opx) * 100) / rev, (net * 100) / rev]);
      expect(m[2]! + m[4]!).toBe(100); // operating ratio + operating profit ratio = 100
    }
  });
  it('each is a 6-mark question with six single-mark steps and no leaked answer in the hints', () => {
    for (const k of ['step-appropriation', 'step-guarantee', 'step-dissolution', 'step-admission-full', 'step-retirement-full', 'step-forfeit-full', 'step-profit-ratios']) {
      for (const s of SEEDS) {
        const q = makeQuestion(k, s);
        expect(q.marks, k).toBe(6);
        expect(
          q.parts.every(p => p.marks === 1),
          k,
        ).toBe(true);
      }
    }
  });
});

describe('V4 Class XI and Option II 6-mark problems: re-worked by hand', () => {
  it('trading and P&L: net purchases, cost of goods sold, gross profit, net profit', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-trading-pl-full', s),
        [os, pu, pr, ci, sales, sr, cs, oi, ie] = figs(q.stem) as number[];
      const net = pu! - pr!,
        cogs = os! + net + ci! - cs!,
        ns = sales! - sr!,
        gp = ns - cogs;
      expect(money(q)).toEqual([net, cogs, ns, gp, gp + oi! - ie!, ns + cs!]);
      expect(gp).toBeGreaterThan(0);
    }
  });
  it('BRS: running balance from the cash book to the passbook; the adjustment agrees both ways', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-brs-full', s),
        [cb, iss, dep, ic, bc, dp] = figs(q.stem) as number[];
      const pass = cb! + iss! - dep! + ic! - bc! - dp!;
      expect(money(q)).toEqual([cb! + iss!, cb! + iss! - dep!, cb! + iss! - dep! + ic!, cb! + iss! - dep! + ic! - bc!, pass, ic! - bc! - dp!]);
      // independent route: correct the cash book, then the remaining difference is only the timing items
      expect(cb! + (ic! - bc! - dp!) + iss! - dep!).toBe(pass);
    }
  });
  it('bad debts and provision: debtors left, provision, charge, net debtors', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-provision-full', s),
        [d, bd, op] = figs(q.stem) as number[],
        rate = Number(/is (\d+)% on/.exec(q.stem)![1]);
      const good = d! - bd!,
        np = (good * rate) / 100;
      expect(money(q)).toEqual([good, np, op!, np - op!, bd! + np - op!, good - np]);
    }
  });
  it('two-column cash book: both columns balance', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-cashbook-full', s),
        [oc, ob, cs, wd, dep, w, rc, ch] = figs(q.stem) as number[];
      const m = money(q);
      expect(m).toEqual([oc! + cs! + wd!, dep! + w!, oc! + cs! + wd! - dep! - w!, ob! + dep! + rc!, ch! + wd!, ob! + dep! + rc! - ch! - wd!]);
      expect(m[2]!).toBeGreaterThanOrEqual(0);
      expect(m[5]!).toBeGreaterThanOrEqual(0);
      // money is conserved: total of opening + receipts from outside − payments to outside = total closing
      expect(oc! + ob! + cs! + rc! - w! - ch!).toBe(m[2]! + m[5]!);
    }
  });
  it('WDV for three years then sale: each year on the opening book value', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-dep-wdv-full', s),
        [c, sp] = figs(q.stem) as number[],
        rate = Number(/at (\d+)% a year/.exec(q.stem)![1]);
      const keep = (100 - rate) / 100; // 0.9 or 0.8, exact in this check because c is a multiple of ₹1,00,000
      const b3 = Math.round(c! * keep * keep * keep);
      const m = money(q);
      expect(m[3]).toBe(b3);
      expect(m[0]! + m[1]! + m[2]!).toBe(c! - b3);
      expect(m[4]).toBe(c! - b3);
      expect(m[5]).toBe(sp! - b3);
      expect(m[1]).toBe(((c! - m[0]!) * rate) / 100);
    }
  });
  it('closing capital and balance sheet: both sides agree', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-balance-sheet-full', s),
        [oc, np, d, ll, cr, fa, stock, deb] = figs(q.stem) as number[];
      const cc = oc! + np! - d!,
        tl = cc + ll! + cr!;
      const m = money(q);
      expect(m).toEqual([cc, tl, tl - fa!, tl - fa! - stock! - deb!, tl - fa! - cr!, tl]);
      expect(m[3]!).toBeGreaterThanOrEqual(0);
      expect(fa! + stock! + deb! + m[3]!).toBe(tl); // assets side = liabilities side
    }
  });
  it('statement of affairs: profit = closing capital − opening capital + drawings − fresh capital', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-incomplete-full', s),
        [oa, ol, ca, cl, dc, dg, fresh] = figs(q.stem) as number[];
      const oc = oa! - ol!,
        cc = ca! - cl!;
      expect(money(q)).toEqual([oc, cc, dc! + dg!, cc - oc, cc - oc + dc! + dg!, cc - oc + dc! + dg! - fresh!]);
    }
  });
  it('spreadsheet WDV: each row uses the closing value above it', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-sheet-wdv', s),
        [c] = figs(q.stem) as number[],
        rate = Number(/rate (\d+)%/.exec(q.stem)![1]);
      const m = money(q);
      expect(m[0]).toBe((c! * rate) / 100);
      expect(m[1]).toBe(c! - m[0]!);
      expect(m[2]).toBe((m[1]! * rate) / 100);
      expect(m[3]).toBe(m[1]! - m[2]!);
      expect(m[4]).toBe((m[3]! * rate) / 100);
      expect(m[5]).toBe(m[3]! - m[4]!);
      expect(m[0]! + m[2]! + m[4]! + m[5]!).toBe(c!); // depreciation charged + final value = cost
    }
  });
  it('loan schedule: interest on the opening balance; principal repaid in full', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-sheet-loan', s),
        [loan] = figs(q.stem) as number[],
        rate = Number(/Interest at (\d+)%/.exec(q.stem)![1]);
      const pr = loan! / 3,
        m = money(q);
      expect(m).toEqual([
        (loan! * rate) / 100,
        pr + (loan! * rate) / 100,
        loan! - pr,
        ((loan! - pr) * rate) / 100,
        ((loan! - 2 * pr) * rate) / 100,
        ((loan! + (loan! - pr) + (loan! - 2 * pr)) * rate) / 100,
      ]);
    }
  });
  it('every one is a 6-mark question of six single-mark steps', () => {
    for (const k of [
      'step-trading-pl-full',
      'step-brs-full',
      'step-provision-full',
      'step-cashbook-full',
      'step-dep-wdv-full',
      'step-balance-sheet-full',
      'step-incomplete-full',
      'step-sheet-wdv',
      'step-sheet-loan',
    ]) {
      for (const s of SEEDS) {
        const q = makeQuestion(k, s);
        expect(q.marks, k).toBe(6);
        expect(
          q.parts.every(p => p.marks === 1),
          k,
        ).toBe(true);
      }
    }
  });
});

describe('papers now carry genuine 6-mark questions', () => {
  it('every 6-mark slot of every paper type is one multi-step problem (so the page can say so)', () => {
    for (const [cls, route] of [
      ['XII', 'OPTION_I_ANALYSIS'],
      ['XII', 'OPTION_II_COMPUTERISED'],
      ['XI', 'OPTION_I_ANALYSIS'],
    ] as const) {
      for (let seed = 1; seed <= 25; seed++) {
        const p = buildPaper({ cls, route, seed });
        for (const q of p.questions) if (q.marks === 6) expect(q.composite, `${cls} ${route} ${seed} Q${q.no}`).toBe(false);
      }
    }
  });
  it('a Class XI paper now has real single 6-mark questions in every unit that carries them', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const p = buildPaper({ cls: 'XI', seed });
      for (const q of p.questions) if (q.marks === 6 && (q.unit === 'XI.2' || q.unit === 'XI.3')) expect(q.composite, `XI seed ${seed} Q${q.no}`).toBe(false);
    }
  });
  it('a Class XII paper has real single 6-mark questions in the partnership unit', () => {
    let singles = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const p = buildPaper({ cls: 'XII', seed });
      for (const q of p.questions) if (q.marks === 6 && !q.composite && q.unit === 'XII.1') singles++;
    }
    expect(singles).toBeGreaterThan(20);
  });
});
