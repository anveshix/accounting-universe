import { describe, expect, it } from 'vitest';
import { makeQuestion } from '../src';

const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1);
const money = (q: ReturnType<typeof makeQuestion>) => q.parts.map(p => Number(p.answer));
const figs = (stem: string) => [...stem.matchAll(/₹([\d,]+)/g)].map(m => Number(m[1]!.replace(/,/g, '')));
/** Half-up to two decimals using integers only (the way a teacher rounds): value = n / d. */
const twoDp = (n: number, d: number) => (Math.floor((n * 200 + d) / (2 * d)) / 100).toFixed(2);

describe('V5 step-wise problems re-worked by hand from the figures in each stem', () => {
  it('cash flow statement: six steps, and the pieces add up', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-cfs-full', s);
      const [npbt, dep, int, loss, inv, rec, pay, tax, pm, sp, sh, rl, dv] = figs(q.stem) as number[];
      const s1 = npbt! + dep! + int! + loss!,
        s2 = s1 - inv! - rec! + pay!,
        s3 = s2 - tax!,
        s4 = sp! - pm!,
        s5 = sh! - rl! - int! - dv!;
      expect(money(q)).toEqual([s1, s2, s3, s4, s5, s3 + s4 + s5]);
      expect(q.marks).toBe(6);
      expect(s3).toBeGreaterThan(0);
      // independent route to the same total: cash in − cash out, item by item
      expect(npbt! + dep! + int! + loss! - inv! - rec! + pay! - tax! + sp! - pm! + sh! - rl! - int! - dv!).toBe(s3 + s4 + s5);
    }
  });
  it('death of a partner: time-basis profit, three shares, total and amount due', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-death', s);
      const [lp, gw, res, cap, dr] = figs(q.stem) as number[],
        [a, b, c] = [...q.stem.matchAll(/(\d) : (\d) : (\d)/g)][0]!.slice(1).map(Number) as [number, number, number],
        months = Number(/dies (\d+) months/.exec(q.stem)![1]),
        t = a + b + c;
      const p1 = (lp! * months) / 12,
        p2 = (p1 * c) / t,
        p3 = (gw! * c) / t,
        p4 = (res! * c) / t,
        p5 = cap! + p2 + p3 + p4;
      expect(money(q)).toEqual([p1, p2, p3, p4, p5, p5 - dr!]);
      expect(a + b + c).toBe(t);
    }
  });
  it('past adjustment: what each should have had, what each got, and the amount B pays A (the firm’s total is unchanged)', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-past-adjust', s);
      const [p] = figs(q.stem) as number[],
        [a, b] = [...q.stem.matchAll(/(\d) : (\d)/g)][0]!.slice(1).map(Number) as [number, number];
      const dueA = (p! * a) / (a + b),
        dueB = (p! * b) / (a + b),
        got = p! / 2;
      expect(money(q)).toEqual([dueA, dueB, got, dueA - got]);
      expect(dueA + dueB).toBe(p); // the profit is shared out in full
      expect(dueA - got).toBe(got - dueB); // A’s gain is exactly B’s loss
    }
  });
  it('fixed and fluctuating capital: interest, credit, current account and capital', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-capital-fixed', s);
      const [cap, prof, dr] = figs(q.stem) as number[],
        rate = Number(/at (\d+)% a year/.exec(q.stem)![1]);
      const int = (cap! * rate) / 100;
      expect(money(q)).toEqual([int, int + prof!, int + prof! - dr!, cap! + int + prof! - dr!]);
      expect(money(q)[3]! - money(q)[2]!).toBe(cap); // fluctuating capital = fixed capital + current account
    }
  });
  it('debentures at a discount or a premium: face value, difference, cash, interest on face value', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-debenture-issue', s);
      const n = Number(/issues (\d+) /.exec(q.stem)![1]),
        rate = Number(/(\d+)% debentures/.exec(q.stem)![1]),
        pct = Number(/of (\d+)%\. Work/.exec(q.stem)![1]),
        disc = /at a discount/.test(q.stem);
      const face = n * 100,
        diff = (face * pct) / 100;
      expect(money(q)).toEqual([face, diff, disc ? face - diff : face + diff, (face * rate) / 100]);
    }
  });
  it('solvency ratios: each ratio from its formula, rounded half-up to 2 decimals with integers, and capital employed', () => {
    for (const s of SEEDS) {
      const q = makeQuestion('step-solvency-set', s);
      const [d, e, ta, ebit, intr] = figs(q.stem) as number[],
        ce = e! + d!;
      const want = [twoDp(d!, e!), twoDp(ta!, d!), twoDp(e!, ta!), String(ce) + '.00', twoDp(d!, ce), twoDp(ebit!, intr!)];
      expect(q.parts.map(p => (p.kind === 'MONEY' ? Number(p.answer).toFixed(2) : p.answer))).toEqual(want);
    }
  });
  it('cash flows from balance-sheet changes: rebuilt machinery account, then investing and financing', () => {
    for (const sd of SEEDS) {
      const q = makeQuestion('step-cfs-balance', sd);
      const [om, cm, dep, proceeds, loss, intRec, osc, csc, ol, cl, intPaid, dv] = figs(q.stem) as number[];
      const bv = proceeds! + loss!,
        purchase = cm! - om! + dep! + bv;
      expect(money(q)).toEqual([bv, purchase, proceeds! - purchase + intRec!, csc! - osc!, cl! - ol!, csc! - osc! + (cl! - ol!) - intPaid! - dv!]);
      expect(om! + purchase - dep! - bv).toBe(cm); // the machinery account balances: opening + purchases − depreciation − sold = closing
      expect(purchase).toBeGreaterThan(0);
    }
  });
  it('share issue with over-subscription: money received, kept, excess, due on allotment, cash still to come, premium', () => {
    for (const sd of SEEDS) {
      const q = makeQuestion('step-share-issue', sd);
      const n = Number(/offers (\d+) equity/.exec(q.stem)![1]),
        prem = Number(/premium of ₹(\d+) per share/.exec(q.stem)![1]),
        ap = Number(/₹(\d+) per share is payable on application/.exec(q.stem)![1]),
        al = Number(/and ₹(\d+) per share \(including/.exec(q.stem)![1]),
        applied = Number(/for (\d+) shares\. The directors/.exec(q.stem)![1]);
      expect(money(q)).toEqual([applied * ap, n * ap, (applied - n) * ap, n * al, n * al - (applied - n) * ap, n * prem]);
      expect(applied).toBeGreaterThan(n); // over-subscribed
      expect(money(q)[0]).toBe(money(q)[1]! + money(q)[2]!); // what came in = what is kept + the excess
    }
  });
  it('every one has the right number of single-mark steps', () => {
    const expected: Record<string, number> = {
      'step-cfs-full': 6,
      'step-death': 6,
      'step-past-adjust': 4,
      'step-capital-fixed': 4,
      'step-debenture-issue': 4,
      'step-solvency-set': 6,
      'step-cfs-balance': 6,
      'step-share-issue': 6,
    };
    for (const [k, marks] of Object.entries(expected))
      for (const s of SEEDS) {
        const q = makeQuestion(k, s);
        expect(q.marks, k).toBe(marks);
        expect(
          q.parts.every(p => p.marks === 1),
          k,
        ).toBe(true);
      }
  });
});
