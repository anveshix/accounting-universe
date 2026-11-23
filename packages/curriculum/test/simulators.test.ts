import { describe, expect, it } from 'vitest';
import { Money } from '../../engine/src';
import {
  BRS_STEPS,
  CYCLE_STEPS,
  SIMULATORS,
  admissionSplit,
  cycleBooks,
  brsBalance,
  computeRewards,
  depreciationSchedule,
  simChapter,
  simLabId,
  simulatorById,
  simulatorsByChapter,
  XP_SIM_SOLVED,
  SIM_BADGE_AT,
} from '../src';

describe('simulator catalogue', () => {
  it('every simulator is well formed and answerable', () => {
    for (const s of SIMULATORS) {
      expect(s.id).toMatch(/^sim-[a-z-]+$/);
      expect(s.clause).toMatch(/^(XI|XII)\./);
      expect(s.need.length).toBeGreaterThan(20);
      expect(s.controls.length).toBeGreaterThan(0);
      expect(s.challenge.options.length).toBe(3);
      expect(s.challenge.correct).toBeGreaterThanOrEqual(0);
      expect(s.challenge.correct).toBeLessThan(s.challenge.options.length);
      expect(simChapter(s).unit.startsWith(s.cls)).toBe(true);
    }
  });

  it('every simulator draws a full picture at its most informative setting', () => {
    for (const s of SIMULATORS) {
      // A playable simulator starts empty on purpose (the student presses Play); it must be whole at the end of the sequence.
      const ctl = s.play ? s.controls.find(c => c.id === s.play!.control) : undefined;
      const v = s.compute(ctl?.max === undefined ? s.defaults : { ...s.defaults, [ctl.id]: ctl.max });
      expect(v.bars.length).toBeGreaterThan(1);
      expect(v.stats.length).toBeGreaterThan(0);
      expect(v.notes.length).toBeGreaterThan(0);
      expect(v.headline.length).toBeGreaterThan(0);
      expect(v.barUnit.length).toBeGreaterThan(0);
      expect(v.bars.every(b => Number.isFinite(b.value) && b.text.length > 0)).toBe(true);
    }
  });

  it('moves with its controls (a slider that changes nothing is a lie)', () => {
    const dep = simulatorById('sim-depreciation')!;
    const three = dep.compute({ ...dep.defaults, years: 3 });
    const six = dep.compute({ ...dep.defaults, years: 6 });
    expect(six.headline).not.toBe(three.headline);
    const brs = simulatorById('sim-brs')!;
    expect(brs.compute({ ...brs.defaults, steps: 0 }).headline).not.toBe(brs.compute({ ...brs.defaults, steps: 4 }).headline);
  });

  it('groups by chapter in syllabus order, and Class XII hides the other option', () => {
    const xi = simulatorsByChapter('XI');
    expect(xi.map(g => g.unit)).toEqual(['XI.2', 'XI.3']);
    expect(xi.flatMap(g => g.sims.map(s => s.id))).toEqual(['sim-depreciation', 'sim-brs', 'sim-cycle', 'sim-trading-pl']);
    const xii = simulatorsByChapter('XII', 'OPTION_I_ANALYSIS').flatMap(g => g.sims.map(s => s.clause));
    expect(xii).toEqual(['XII.1.admission', 'XII.2.issue', 'XII.3.liquidity', 'XII.4.preparation']);
    // cash flow and ratio analysis are Option I chapters: on Option II the gallery must not pretend they are examinable
    expect(simulatorsByChapter('XII', 'OPTION_II_COMPUTERISED').flatMap(g => g.sims.map(s => s.id))).toEqual(['sim-admission', 'sim-shares']);
  });

  it('the accounting cycle is a sequence a page can play, not a slider that jumps about', () => {
    const cycle = simulatorById('sim-cycle')!;
    expect(cycle.clause).toBe('XI.2.journal');
    expect(cycle.play).toEqual({ control: 'steps', everyMs: 1500 });
    const steps = cycle.controls.find(c => c.id === cycle.play!.control)!;
    expect(steps.kind).toBe('range');
    expect(steps.min).toBe(0);
    expect(steps.max).toBe(CYCLE_STEPS.length);
    expect(steps.step).toBe(1);
  });

  it('a solved challenge has one stable lab id', () => {
    expect(simLabId('sim-brs')).toBe('sim:sim-brs');
    expect(simulatorById('nope')).toBeUndefined();
  });
});

describe('the arithmetic behind the pictures', () => {
  it('SLM charges a flat amount; WDV charges a percentage of the balance', () => {
    const rows = depreciationSchedule(Money.rupees(100000), 10, 3);
    expect(rows.map(r => r.slmDep.format())).toEqual(['₹10,000.00', '₹10,000.00', '₹10,000.00']);
    expect(rows.map(r => r.wdvDep.format())).toEqual(['₹10,000.00', '₹9,000.00', '₹8,100.00']);
    expect(rows.at(-1)!.slmClose.format()).toBe('₹70,000.00');
    expect(rows.at(-1)!.wdvClose.format()).toBe('₹72,900.00');
  });

  it('BRS: the four items walk the cash book to the pass book, in the right direction', () => {
    const start = Money.rupees(50000);
    expect(brsBalance(start, 0).format()).toBe('₹50,000.00');
    expect(brsBalance(start, BRS_STEPS.length).format()).toBe('₹48,900.00');
    expect(brsBalance(start, 2).format()).toBe('₹48,000.00');
    expect(brsBalance(start, 99).format()).toBe(brsBalance(start, BRS_STEPS.length).format());
  });

  it('the depreciation challenge agrees with the picture it sits under', () => {
    const dep = simulatorById('sim-depreciation')!;
    const v = dep.compute(dep.defaults);
    const slm = v.stats.find(s => s.label === 'SLM charge this year')!;
    expect(slm.value).toBe('₹10,000.00');
    expect(dep.challenge.options[dep.challenge.correct]).toBe('Written down value (WDV)');
    expect(v.stats.find(s => s.label === 'WDV book value')!.value).toBe('₹72,900.00');
  });

  it('admission: the new partner’s share is carved out of the old 3:2 ratio', () => {
    const r = admissionSplit(60000, 40000, 25, 40000);
    expect(r).toEqual({ a: 60000, b: 40000, c: 40000, total: 140000, sacrificeA: 15, sacrificeB: 10 });
    // A held 60% and gives up 15 points, B held 40% and gives up 10: 60 + 40 + 25 = 125 points of an unchanged firm,
    // which is exactly why the capital accounts must be re-scaled after admission.
    expect(r.a + r.b + r.c).toBe(r.total);
  });
});

describe('the accounting cycle (entry → journal → ledger → trial balance)', () => {
  it('posts nothing at step 0 and one complete entry per step', () => {
    expect(cycleBooks(0).ledger.entries()).toHaveLength(0);
    const three = cycleBooks(3);
    expect(three.ledger.entries()).toHaveLength(3);
    expect(three.posted).toBe(3);
  });

  it('every entry is balanced, so the trial balance agrees at EVERY step — not just at the end', () => {
    for (let i = 0; i <= CYCLE_STEPS.length; i++) {
      const tb = cycleBooks(i).ledger.trialBalance();
      expect(tb.balanced, `after ${i} entries`).toBe(true);
      expect(tb.totalDebit.format(), `after ${i} entries`).toBe(tb.totalCredit.format());
    }
  });

  it('after Ravi’s week: ₹1,45,000 debit = credit, cash ₹87,000, and the challenge names cash', () => {
    const { ledger } = cycleBooks(CYCLE_STEPS.length);
    const tb = ledger.trialBalance();
    expect(tb.totalDebit.format()).toBe('₹1,45,000.00');
    expect(tb.totalCredit.format()).toBe('₹1,45,000.00');
    expect(ledger.balance('cash').format()).toBe('₹87,000.00');
    expect(ledger.balance('capital').format()).toBe('₹1,00,000.00');
    expect(ledger.balance('creditors').format()).toBe('₹10,000.00');
    const cycle = simulatorById('sim-cycle')!;
    expect(cycle.challenge.options[cycle.challenge.correct]).toBe('Cash');
  });

  it('the picture shows the journal, the ledger and the trial balance together', () => {
    const cycle = simulatorById('sim-cycle')!;
    const v = cycle.compute({ steps: CYCLE_STEPS.length });
    expect(v.tables?.map(t => t.title.split(' —')[0])).toEqual(['Journal', 'Ledger', 'Trial balance']);
    const journal = v.tables![0]!;
    expect(journal.rows.filter(r => r[2]?.startsWith('Dr '))).toHaveLength(CYCLE_STEPS.length);
    expect(journal.foot?.slice(3)).toEqual(['₹1,45,000.00', '₹1,45,000.00']);
    expect(v.stats.find(s => s.label === 'Difference')!.value).toBe('₹0.00');
    expect(v.headline).toBe('₹1,45,000.00 Dr = ₹1,45,000.00 Cr');
  });

  it('an empty book says so instead of drawing a blank picture', () => {
    const v = simulatorById('sim-cycle')!.compute({ steps: 0 });
    expect(v.headline).toBe('The books are empty');
    expect(v.bars).toHaveLength(0);
    expect(v.notes[1]).toMatch(/Nothing has reached the books yet/);
  });
});

describe('the incentive', () => {
  const T = Date.UTC(2026, 0, 10, 12);
  it('a solved challenge pays 10 XP once, on top of the 5 for first seeing the page', () => {
    const one = computeRewards({ attempts: [], seen: [{ lab: 'sim:sim-brs', tab: 'example', t: T }], now: T, tzOffsetMin: 0 });
    expect(one.xp).toBe(5 + XP_SIM_SOLVED);
    expect(one.simsSolved).toBe(1);
    const twice = computeRewards({
      attempts: [],
      seen: [
        { lab: 'sim:sim-brs', tab: 'example', t: T },
        { lab: 'sim:sim-brs', tab: 'example', t: T + 1 },
      ],
      now: T,
      tzOffsetMin: 0,
    });
    expect(twice.xp).toBe(5 + XP_SIM_SOLVED);
  });
  it('only the example tab counts as solved; simply opening the page does not', () => {
    const r = computeRewards({ attempts: [], seen: [{ lab: 'sim:sim-brs', tab: 'try', t: T }], now: T, tzOffsetMin: 0 });
    expect(r.simsSolved).toBe(0);
    expect(r.badges).not.toContain('visual-thinker');
  });
  it('Visual Thinker unlocks at five solved', () => {
    const seen = Array.from({ length: SIM_BADGE_AT }, (_, i) => ({ lab: simLabId(SIMULATORS[i]!.id), tab: 'example' as const, t: T }));
    expect(computeRewards({ attempts: [], seen: seen.slice(0, 4), now: T, tzOffsetMin: 0 }).badges).not.toContain('visual-thinker');
    expect(computeRewards({ attempts: [], seen, now: T, tzOffsetMin: 0 }).badges).toContain('visual-thinker');
  });
});
