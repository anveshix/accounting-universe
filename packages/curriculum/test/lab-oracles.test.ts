import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { ALL_LABS } from '../../../apps/web/src/labs';
import { blocksToFacts } from '../../../apps/web/src/facts';
import { InputError } from '../../../apps/web/src/spec';

/** Oracles are worked by hand from textbook / marking-scheme method — never copied from the engine's output. */
const run = (id: string, over: Record<string, string> = {}) => {
  const l = ALL_LABS.find(x => x.id === id)!;
  return blocksToFacts(l.compute({ ...l.example, ...over })).join('\n');
};
const has = (id: string, over: Record<string, string>, ...frags: string[]) => {
  const t = run(id, over);
  for (const f of frags) expect(t, `${id}: ${f}`).toContain(f);
};

describe('lab oracles (hand-worked)', () => {
  it('xi-gst: 10,000 − 10% + 500 freight = 9,500; GST 18% intra → CGST/SGST 855 each; total 11,210', () => {
    has('xi-gst', {}, '₹9,500.00', '₹855.00', '₹11,210.00');
  });
  it('xi-gst: inter-state → one IGST of 18% × 9,500 = 1,710', () => {
    has('xi-gst', { inter: 'Y' }, '₹1,710.00', '₹11,210.00');
  });
  it('xi-incomplete: closing capital 3,50,000 − 1,40,000 = 2,10,000; profit = 60,000 + 30,000 − 20,000 = 70,000', () => {
    has('xi-incomplete', {}, '₹2,10,000.00', '₹70,000.00');
  });
  it('xi-incomplete: no drawings or fresh capital → profit equals increase in capital (60,000)', () => {
    has('xi-incomplete', { draw: '0', fresh: '0' }, '₹60,000.00');
  });
  it('xi-petty: postage 1,200 + 450 = 1,650; conveyance 800; spent 2,450; cash left 2,550', () => {
    has('xi-petty', {}, '₹1,650.00', '₹2,450.00', '₹2,550.00');
  });
  it('xi-errors: wages debited instead of machinery → rectify Dr Machinery, Cr Wages 5,000; trial balance unaffected', () => {
    has('xi-errors', {}, 'Dr Machinery A/c ₹5,000.00; Cr Wages A/c ₹5,000.00', 'does NOT affect the trial balance');
  });
  it('xii-appropriation: C guaranteed 50,000 but gets 12,000 of 40,000 → shortfall 38,000 borne by A:B = 4:3', () => {
    has('xii-appropriation', {}, '₹38,000.00', '₹21,714.29', '₹16,285.71', '₹50,000.00');
  });
  it('xii-appropriation: no guarantee → 40,000 shared 4:3:3 = 16,000 / 12,000 / 12,000', () => {
    const t = run('xii-appropriation', { gPartner: '', gMin: '' });
    expect(t).toContain('₹16,000.00');
    expect(t).toContain('₹12,000.00');
    expect(t).not.toContain('Guarantee adjustment | Partner A: -');
  });
  it('xii-ratio-change: 4:3:3 → 3:2:5; C gains 1/5 and pays 30,000; reserves+reval 1,75,000 shared 4:3:3', () => {
    has('xii-ratio-change', {}, 'sacrifices 1/10', 'gains 1/5', '₹3,85,000.00', '₹3,17,500.00', '₹2,22,500.00');
  });
  it('xii-admission: Z gets 1/4, premium 15,000 split 1:2, old partners take 1/3 and 2/3 of −33,000', () => {
    has('xii-admission', {}, 'Sacrifices: 1/12', 'Sacrifices: 1/6', '₹1,44,000.00', '₹2,88,000.00', '₹1,08,000.00');
  });
  it('xii-exit: C (1/5) gets 9,000 goodwill + 2,000 reserve − 400 reval loss on 40,000 = 50,600', () => {
    has('xii-exit', {}, '₹50,600.00', '₹90,700.00', '₹58,700.00');
  });
  it('xii-dissolution: loss on realisation 28,000 shared 3:2; A paid 75,200, B 56,800; cash is exactly used up', () => {
    has('xii-dissolution', {}, '₹28,000.00', '₹75,200.00', '₹56,800.00', 'exactly used up');
  });
  it('xii-debentures: 750 × 100 at 90 → discount 7,500; redeemable at 105 → 3,750 premium; interest 6m @12% = 4,500', () => {
    has('xii-debentures', {}, '₹7,500.00', '₹3,750.00', '₹4,500.00', '₹11,250.00');
  });
  it('xii-goodwill: average 1,35,000; normal profit 80,000 → super 55,000 × 3 = 1,65,000; capitalisation 13,50,000 − 8,00,000 = 5,50,000', () => {
    has('xii-goodwill', {}, '₹4,05,000.00', '₹1,65,000.00', '₹5,50,000.00');
  });
  it('xii-statements: revenue 20L → 40L is +100%; PBT 13L → 29L is +123.08%; interest is 2.5% of revenue', () => {
    has('xii-statements', {}, '100.00%', '123.08%', '2.50%', '36.25%');
  });
});

describe('lab oracles — second batch (hand-worked)', () => {
  it('xi-final-accounts: GP 89,500; NP 49,428; Balance Sheet 1,23,378', () => {
    has('xi-final-accounts', {}, '₹89,500.00', '₹49,428.00', '₹91,378.00', '₹1,23,378.00', '₹722.00');
  });
  it('xi-equation: every step stays balanced; sale of 30,000 stock for 40,000 adds profit 10,000', () => {
    const t = run('xi-equation');
    expect(t).not.toMatch(/Not balanced|Unbalanced/i);
    expect(t).toContain('₹10,000.00');
    expect(t).toContain('Capital ₹1,35,000.00');
    expect(t).toContain('Bank loan ₹25,000.00');
  });
  it('xi-cashbook: closing cash 8,000; bank 30,000; columns foot at 16,000 and 43,000', () => {
    has('xi-cashbook', {}, '₹8,000.00', '₹30,000.00', '₹16,000.00', '₹43,000.00');
  });
  it('xi-subsidiary: purchases 18,000−1,800; sales 41,000−5,000; input GST 2,916; output 4,320; payable 1,404', () => {
    has('xi-subsidiary', {}, '₹16,200.00', '₹36,000.00', '₹2,916.00', '₹4,320.00', '₹1,404.00', '₹21,240.00');
  });
  it('xi-provisions: PDD 5% of 95,000 = 4,750 (+1,750); PDD-discount 2% of 90,250 = 1,805; net debtors 88,445', () => {
    has('xi-provisions', {}, '₹4,750.00', '₹1,805.00', '₹7,000.00', '₹9,555.00', '₹88,445.00');
  });
  it('xi-opening: capital is the balancing figure 3,60,000 − 1,80,000 = 1,80,000', () => {
    has('xi-opening', {}, 'Capital (balancing figure) ₹1,80,000.00');
  });
  it('xii-fundamentals: loan interest 6% × 50,000 × 12/12 = 3,000; 87,000 ÷ 3 = 29,000; deed 3:2:1 gives A 43,500', () => {
    has('xii-fundamentals', {}, '₹3,000.00', '₹29,000.00', '₹32,000.00', '₹43,500.00', '₹14,500.00');
  });
  it('xii-capital: fluctuating = fixed + current; A 3,44,740, B 2,25,260 (IoD at 6 months average)', () => {
    has('xii-capital', {}, '₹3,44,740.00', '₹2,25,260.00', '₹23,340.00', '₹15,560.00', '₹44,740.00', '₹25,260.00');
  });
  it('xii-revaluation: stock −6,000, debtors −2,000, building +30,000, creditor +4,000 → net gain 18,000 shared 3:2:1', () => {
    has('xii-revaluation', {}, '₹18,000.00', '₹9,000.00', '₹6,000.00', '₹3,000.00');
  });
  it('xii-noncash: net assets 6,00,000 vs price 6,20,000 → goodwill 20,000; 50,000 shares at 12 → capital 5,00,000, premium 1,00,000', () => {
    has('xii-noncash', {}, '₹20,000.00', 'Shares issued = ₹6,00,000.00 ÷ ₹12.00 = 50000', '₹5,00,000.00', '₹1,00,000.00');
  });
  it('xii-advance: 10,000 × 4 = 40,000 due; 500 × 2 = 1,000 in advance; 39,000 to collect', () => {
    has('xii-advance', {}, '₹40,000.00', '₹1,000.00', '₹39,000.00');
  });
  it('xii-schedule3: shareholders 6,00,000; BS totals 9,00,000 both sides; PBT 3,30,000; tax 30% = 99,000; PAT 2,31,000', () => {
    has('xii-schedule3', {}, '₹9,00,000.00', '₹3,30,000.00', '₹99,000.00', '₹2,31,000.00', '₹2,00,000.00');
  });
  it('xii-spreadsheet: PMT(1%,12,1,00,000) = 8,884.88; month-1 interest 1,000; principal repaid 1,00,000 in total; closing 0', () => {
    has('xii-spreadsheet', {}, '₹8,884.88', '₹1,000.00', '₹92,115.12', '₹0.00');
  });
  it('xii-cashflow: operating 2,00,000; investing −80,000; financing −12,000; net +1,08,000; closing 2,08,000', () => {
    has('xii-cashflow', {}, '₹2,00,000.00', '-₹80,000.00', '-₹12,000.00', '₹1,08,000.00', '₹2,08,000.00');
  });
  it('xii-ratios: current 2:1; quick 1.55; inventory turnover 9.71; GP 32%; PAT ratio 9.8%', () => {
    has('xii-ratios', {}, '2.00 : 1', '1.55 : 1', '9.71 times', '32.00%', '9.80%', '83.00%');
  });
  it('xii-ratios: warns when assets (fixed + current) do not equal funds + current liabilities', () => {
    has('xii-ratios', { nfa: '600000' }, 'do not agree');
    expect(run('xii-ratios')).not.toContain('do not agree');
  });
  it('xii-shares: 1,60,000 applied for, 1,00,000 allotted (2/3), refund 50,000, 1,500 forfeited → forfeited credit 12,000; reissue 1,000 → capital reserve 8,000', () => {
    has('xii-shares', {}, '₹8,00,000.00', '₹50,000.00', '₹12,000.00', '₹8,000.00', '₹9,95,000.00');
  });
});

describe('lab hardening', () => {
  it('every lab id is named in a test other than the registry test (no unverified labs)', () => {
    const dir = new URL('.', import.meta.url).pathname;
    const body = readdirSync(dir)
      .filter(f => f.endsWith('.ts') && f !== 'labs-registry.test.ts')
      .map(f => readFileSync(dir + f, 'utf8'))
      .join('\n');
    expect(ALL_LABS.map(l => l.id).filter(id => !(body.includes(`'${id}'`) || body.includes(`"${id}"`)))).toEqual([]);
  });
  it('bad inputs of any kind produce an InputError (or a result) — never a raw crash', () => {
    const bad = ['', '-5', '0', '99999999999999999999', 'abc', '1.005', '100', 'zz'];
    const raw: string[] = [];
    for (const l of ALL_LABS)
      for (const f of l.fields)
        for (const b of bad) {
          try {
            l.compute({ ...l.example, [f.id]: b });
          } catch (e) {
            if (!(e instanceof InputError)) raw.push(`${l.id}.${f.id}="${b}": ${(e as Error).message}`);
          }
        }
    expect(raw).toEqual([]);
  });
  it('an unknown select option is refused with a sentence naming the field', () => {
    const l = ALL_LABS.find(x => x.id === 'xii-exit')!;
    expect(() => l.compute({ ...l.example, exit: 'Q' })).toThrow(/Retiring|exit|option/i);
  });
});
