import { describe, expect, it } from 'vitest';
import { Ledger, Machine, Money, starterChartClassXI } from '../../engine/src';
import { CRISIS_KINDS, CRISIS_LIVES, CRISIS_XP, SUSPENSE, TB_CRISIS, crisisBadges, makeCrisis, stepXp, totalsAfter, type Crisis } from '../src';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);
const ALL: Crisis[] = SEEDS.map(makeCrisis);
const rs = (s: string) => Number(s);
/** Balance of an account straight from its posted rows, in plain numbers (independent of the generator's Money code). */
const netOf = (rows: readonly { side: string; amount: string }[]) => rows.reduce((t, p) => t + (p.side === 'DR' ? rs(p.amount) : -rs(p.amount)), 0);

describe('crisis scenarios — independent oracles', () => {
  it('is reproducible from the seed', () => {
    expect(makeCrisis(42)).toEqual(makeCrisis(42));
  });
  it('the journal itself is sound: the engine posts it and its trial balance agrees', () => {
    for (const c of ALL.slice(0, 60)) {
      const l = new Ledger(starterChartClassXI());
      for (const j of c.journal)
        l.post({
          date: `2026-04-${String(j.day).padStart(2, '0')}`,
          narration: j.en,
          lines: [
            { accountId: j.dr, side: 'DR', amount: Money.parse(j.amount) },
            { accountId: j.cr, side: 'CR', amount: Money.parse(j.amount) },
          ],
        });
      expect(l.trialBalance().balanced, String(c.seed)).toBe(true);
    }
  });
  it('exactly one account differs from the journal, by exactly one posting, in the way the answer says', () => {
    for (const c of ALL) {
      const bad = c.accounts.filter(a => {
        const want = c.journal
          .filter(j => j.dr === a.id || j.cr === a.id)
          .map(j => `${j.day}|${j.dr === a.id ? 'DR' : 'CR'}|${j.amount}`)
          .sort();
        return JSON.stringify(want) !== JSON.stringify(a.posted.map(p => `${p.day}|${p.side}|${p.amount}`).sort());
      });
      expect(
        bad.map(a => a.id),
        String(c.seed),
      ).toEqual([c.answer.account]);
      const a = bad[0]!,
        want = c.journal.filter(j => j.dr === a.id || j.cr === a.id);
      if (c.answer.kind === 'OMITTED') expect(a.posted.length).toBe(want.length - 1);
      else {
        expect(a.posted.length).toBe(want.length);
        const odd = a.posted.filter(p => !want.some(j => j.day === p.day && (j.dr === a.id ? 'DR' : 'CR') === p.side && j.amount === p.amount));
        expect(odd.length, String(c.seed)).toBe(1);
        const j = want.find(x => x.day === odd[0]!.day)!;
        if (c.answer.kind === 'WRONG_SIDE') {
          expect(odd[0]!.amount).toBe(j.amount);
          expect(odd[0]!.side).not.toBe(j.dr === a.id ? 'DR' : 'CR');
        } else {
          expect(odd[0]!.amount).not.toBe(j.amount);
          expect(odd[0]!.side).toBe(j.dr === a.id ? 'DR' : 'CR');
        }
      }
    }
  });
  it('shown balances, totals, difference and short side recomputed with plain arithmetic', () => {
    for (const c of ALL) {
      let dr = 0,
        cr = 0;
      for (const a of c.accounts) {
        const n = netOf(a.posted);
        if (n === 0) expect(a.shown).toBeNull();
        else {
          expect(a.shown!.side, `${c.seed} ${a.id}`).toBe(n > 0 ? 'DR' : 'CR');
          expect(rs(a.shown!.amount)).toBeCloseTo(Math.abs(n), 2);
        }
        if (n > 0) dr += n;
        else cr -= n;
      }
      expect(rs(c.totals.dr)).toBeCloseTo(dr, 2);
      expect(rs(c.totals.cr)).toBeCloseTo(cr, 2);
      expect(dr).not.toBe(cr);
      expect(rs(c.answer.difference), String(c.seed)).toBeCloseTo(Math.abs(dr - cr), 2);
      expect(c.answer.shortSide, String(c.seed)).toBe(dr < cr ? 'DR' : 'CR');
    }
  });
  it('the difference follows the textbook rule for each kind of error (amount, twice the amount, or the gap between the two amounts)', () => {
    for (const c of ALL) {
      const a = c.accounts.find(x => x.id === c.answer.account)!,
        want = c.journal.filter(j => j.dr === a.id || j.cr === a.id);
      const trueNet = want.reduce((t, j) => t + (j.dr === a.id ? rs(j.amount) : -rs(j.amount)), 0),
        gap = Math.abs(trueNet - netOf(a.posted));
      expect(rs(c.answer.difference), String(c.seed)).toBeCloseTo(gap, 2);
      const missing = want.filter(j => !a.posted.some(p => p.day === j.day && p.amount === j.amount && p.side === (j.dr === a.id ? 'DR' : 'CR')));
      expect(missing.length).toBe(1);
      const m = rs(missing[0]!.amount);
      if (c.answer.kind === 'OMITTED') expect(gap).toBeCloseTo(m, 2);
      if (c.answer.kind === 'WRONG_SIDE') expect(gap).toBeCloseTo(2 * m, 2);
      if (c.answer.kind === 'WRONG_AMOUNT') {
        // gap = |amount actually posted − amount that should have been posted|
        const odd = a.posted.find(p => p.day === missing[0]!.day && p.amount !== missing[0]!.amount)!;
        expect(gap).toBeCloseTo(Math.abs(rs(odd.amount) - m), 2);
        expect(gap).toBeGreaterThan(0);
      }
    }
  });
  it('the rectifying entry has the spoiled account on one side and Suspense on the other, for the difference, and makes the books agree with Suspense closed', () => {
    for (const c of ALL) {
      const e = c.answer.entry;
      expect([e.dr, e.cr].sort(), String(c.seed)).toEqual([SUSPENSE, c.answer.account].sort());
      expect(e.amount).toBe(c.answer.difference);
      // Suspense was opened on the short side, so the entry must put Suspense on the OTHER side to close it
      expect(c.answer.shortSide === 'DR' ? e.cr : e.dr, String(c.seed)).toBe(SUSPENSE);
      const t = totalsAfter(c, e);
      expect(t.dr.equals(t.cr), String(c.seed)).toBe(true);
      expect(t.suspense.isZero()).toBe(true);
      // and the corrected totals equal the totals of the sound journal
      const good = c.journal.reduce((s, j) => s + rs(j.amount), 0),
        nets = new Map<string, number>();
      for (const j of c.journal) {
        nets.set(j.dr, (nets.get(j.dr) ?? 0) + rs(j.amount));
        nets.set(j.cr, (nets.get(j.cr) ?? 0) - rs(j.amount));
      }
      expect(good).toBeGreaterThan(0);
      expect(rs(t.dr.toString())).toBeCloseTo(
        [...nets.values()].filter(v => v > 0).reduce((s, v) => s + v, 0),
        2,
      );
    }
  });
  it('a swapped or wrong-amount entry does NOT fix the books (the check can fail)', () => {
    for (const c of ALL.slice(0, 80)) {
      const e = c.answer.entry;
      const swapped = totalsAfter(c, { dr: e.cr, cr: e.dr, amount: e.amount });
      expect(swapped.dr.equals(swapped.cr) && swapped.suspense.isZero()).toBe(false);
      const half = totalsAfter(c, { ...e, amount: Money.parse(e.amount).add(Money.rupees(1)).toString() });
      expect(half.suspense.isZero()).toBe(false);
    }
  });
  it('a hand-worked case: salary ₹7,000 debit left out ⇒ debit short by 7,000 ⇒ Salary Dr, To Suspense', () => {
    const c = ALL.find(x => x.answer.kind === 'OMITTED' && x.answer.entry.cr === SUSPENSE)!;
    expect(c).toBeDefined();
    expect(c.answer.shortSide).toBe('DR');
    expect(c.answer.entry.dr).toBe(c.answer.account);
    const w = ALL.find(x => x.answer.kind === 'WRONG_SIDE')!,
      a = w.accounts.find(x => x.id === w.answer.account)!;
    expect(a.posted.some(p => rs(p.amount) * 2 === rs(w.answer.difference))).toBe(true);
  });
  it('all three kinds and both short sides occur; text is bilingual; the what-if answer is a real option', () => {
    expect(new Set(ALL.map(c => c.answer.kind))).toEqual(new Set(CRISIS_KINDS));
    expect(new Set(ALL.map(c => c.answer.shortSide))).toEqual(new Set(['DR', 'CR']));
    for (const c of ALL) {
      expect(c.cause.hi).toMatch(/[ऀ-ॿ]/);
      expect(c.whatIf.question.hi).toMatch(/[ऀ-ॿ]/);
      expect(c.whatIf.options.length).toBe(3);
      expect(c.whatIf.options[c.whatIf.answer]!.en).toMatch(/still agree/);
      for (const o of c.whatIf.options) expect(o.hi).toMatch(/[ऀ-ॿ]/);
      for (const a of c.accounts) expect(a.nameHi, a.name).toMatch(/[ऀ-ॿ]/);
    }
  });
});

describe('crisis rewards', () => {
  it('XP: full on the first try, half otherwise, ×1.5 on a streak of two (hand-worked)', () => {
    expect(CRISIS_XP).toEqual({ DIAGNOSE: 10, LOCATE: 20, CLASSIFY: 15, RECTIFY: 30, WHAT_IF: 25 });
    expect(stepXp('RECTIFY', true, 0)).toBe(30);
    expect(stepXp('RECTIFY', false, 5)).toBe(15);
    expect(stepXp('RECTIFY', true, 2)).toBe(45);
    expect(stepXp('CLASSIFY', true, 2)).toBe(22);
    expect(stepXp('CLASSIFY', false, 0)).toBe(7);
    // a perfect run: 10 + 20 + (15×1.5=22) + 45 + 37 = 134
    let streak = 0,
      total = 0;
    for (const s of ['DIAGNOSE', 'LOCATE', 'CLASSIFY', 'RECTIFY', 'WHAT_IF'] as const) {
      total += stepXp(s, true, streak);
      streak++;
    }
    expect(total).toBe(134);
  });
  it('badges', () => {
    expect(crisisBadges({ cleared: true, livesLost: 0, clearedInARow: 1 }).map(b => b.id)).toEqual(['suspense-slayer']);
    expect(crisisBadges({ cleared: true, livesLost: 1, clearedInARow: 3 }).map(b => b.id)).toEqual(['auditors-eye']);
    expect(crisisBadges({ cleared: false, livesLost: 0, clearedInARow: 9 })).toEqual([]);
  });
});

describe('crisis state machine — the story and the exact refusals', () => {
  it('a clean run', () => {
    const m = new Machine(TB_CRISIS, { lives: CRISIS_LIVES });
    for (const [e, to] of [
      ['RIGHT', 'LOCATE'],
      ['RIGHT', 'CLASSIFY'],
      ['RIGHT', 'RECTIFY'],
      ['RIGHT', 'WHAT_IF'],
      ['ANSWER', 'CLEARED'],
    ] as const) {
      expect(m.send(e).ok).toBe(true);
      expect(m.state).toBe(to);
    }
    expect(m.why('RIGHT')).toBe('This crisis is already solved — start a new one.');
    m.send('AGAIN');
    expect(m.state).toBe('DIAGNOSE');
  });
  it('wrong answers cost nothing in DIAGNOSE/CLASSIFY, a life in LOCATE/RECTIFY, and the last life ends it', () => {
    const m = new Machine(TB_CRISIS, { lives: CRISIS_LIVES });
    m.send('WRONG');
    expect(m.state).toBe('DIAGNOSE');
    m.send('RIGHT');
    m.ctx.lives = 2;
    expect(m.send('WRONG').ok).toBe(true);
    expect(m.state).toBe('LOCATE');
    expect(m.send('OUT').ok).toBe(false);
    expect(m.why('OUT')).toBe('You still have lives left — try again.');
    m.ctx.lives = 0;
    expect(m.send('WRONG').ok).toBe(false);
    expect(m.why('WRONG')).toMatch(/^No lives left/);
    expect(m.send('OUT').ok).toBe(true);
    expect(m.state).toBe('FAILED');
    expect(m.can('RIGHT')).toBe(false);
  });
});
