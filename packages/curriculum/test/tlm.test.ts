import { describe, expect, it } from 'vitest';
import { CLAUSES } from '../src/syllabus';
import { TLM_TOPICS, buildTlmKit, tlmTopic } from '../src/tlm';

describe('Classroom TLM kit', () => {
  it('every topic is a real Class XI clause of the official syllabus', () => {
    for (const t of TLM_TOPICS) {
      const c = CLAUSES.find(x => x.id === t.id);
      expect(c, t.id).toBeDefined();
      expect(c!.title).toBe(t.title);
    }
  });
  it('hand-worked kit for seed 7 (marking-scheme style, worked on paper)', () => {
    const k = buildTlmKit('XI.2.tb', 7),
      p = (n: number) => BigInt(n) * 100n;
    expect(k.txns.map(t => t.amount.paise)).toEqual([400000, 85000, 20000, 50000, 40000, 3500, 35000, 30000, 20000, 1500].map(p));
    const tb = new Map(k.trialBalance.rows.map(r => [r.account.id, [r.debit.paise, r.credit.paise]]));
    // cash 4,00,000 - 85,000 + 40,000 - 3,500 - 1,500 = 3,50,000 ; bank 85,000 - 20,000 + 30,000 - 20,000 = 75,000
    expect(tb.get('cash')).toEqual([p(350000), 0n]);
    expect(tb.get('bank')).toEqual([p(75000), 0n]);
    expect(tb.get('debtors')).toEqual([p(5000), 0n]);
    expect(tb.get('creditors')).toEqual([0n, p(30000)]);
    expect(tb.get('sales')).toEqual([0n, p(75000)]);
    expect(k.trialBalance.totalDr.paise).toBe(p(505000));
    expect(k.trialBalance.totalCr.paise).toBe(p(505000));
  });
  it('is deterministic, and different seeds give different sets', () => {
    const a = buildTlmKit('XI.2.journal', 3),
      b = buildTlmKit('XI.2.journal', 3),
      c = buildTlmKit('XI.2.journal', 4);
    expect(a.txns.map(t => t.text)).toEqual(b.txns.map(t => t.text));
    expect(a.txns.map(t => t.text)).not.toEqual(c.txns.map(t => t.text));
  });
  it('1,000 seeds: independent re-aggregation agrees with the engine on every ledger balance and the trial balance', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const k = buildTlmKit('XI.2.ledger', seed);
      const net = new Map<string, bigint>();
      for (const t of k.txns) {
        net.set(t.dr.id, (net.get(t.dr.id) ?? 0n) + t.amount.paise);
        net.set(t.cr.id, (net.get(t.cr.id) ?? 0n) - t.amount.paise);
      }
      for (const l of k.ledger) {
        const n = net.get(l.account.id)!;
        expect(l.balance.paise, `${seed} ${l.account.id}`).toBe(n < 0n ? -n : n);
        expect(l.balanceSide).toBe(n < 0n ? 'CR' : 'DR');
        expect(l.totalDr.paise - l.totalCr.paise).toBe(n);
      }
      expect(k.trialBalance.totalDr.equals(k.trialBalance.totalCr)).toBe(true);
      expect(k.trialBalance.totalDr.paise).toBe([...net.values()].filter(v => v > 0n).reduce((s, v) => s + v, 0n));
      expect(net.get('cash')! >= 0n && net.get('bank')! >= 0n).toBe(true);
      expect(k.predictions).toHaveLength(k.txns.length + 1);
      expect(new Set(k.txns.map(t => t.text)).size).toBe(k.txns.length);
    }
  });
  it('unknown topics are refused with a sentence', () => {
    expect(tlmTopic('XII.1.goodwill')).toBeUndefined();
    expect(() => buildTlmKit('XII.1.goodwill' as never, 1)).toThrow(/No classroom kit/);
  });
});
