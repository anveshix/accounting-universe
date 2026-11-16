import { describe, expect, it } from 'vitest';
import { depreciation } from '../../../apps/web/src/labs/xi';
import type { Block } from '../../../apps/web/src/spec';

const steps = (blocks: Block[]) => blocks.find((b): b is Extract<Block, { kind: 'steps' }> => b.kind === 'steps')!.steps;
const tables = (blocks: Block[]) => blocks.filter((b): b is Extract<Block, { kind: 'table' }> => b.kind === 'table');

describe('depreciation lab: independent classroom examples', () => {
  it('explains a capped SLM charge rather than presenting a false equation', () => {
    const result = depreciation.compute({ ...depreciation.example, cost: '100', method: 'SLM', rate: '60', years: '3', months: '12', sale: '' });
    expect(tables(result)[0]!.rows.map(r => r.slice(1))).toEqual([
      ['₹100.00', '₹60.00', '₹40.00'],
      ['₹40.00', '₹40.00', '₹0.00'],
      ['₹0.00', '₹0.00', '₹0.00'],
    ]);
    expect(steps(result)[1]).toContain('limited to opening book value ₹40.00');
    expect(steps(result)[2]).toContain('limited to opening book value ₹0.00');
  });
  it('shows the first-year time fraction and suppresses zero-value journals', () => {
    const result = depreciation.compute({ ...depreciation.example, cost: '0.01', method: 'WDV', rate: '50', years: '1', months: '6', sale: '' });
    expect(steps(result)[0]).toContain('× 6/12');
    expect(tables(result)[0]!.rows[0]).toEqual(['1', '₹0.01', '₹0.00', '₹0.01']);
    expect(result.some(b => b.kind === 'journal')).toBe(false);
    expect(result.some(b => b.kind === 'note' && b.text.includes('No depreciation entry'))).toBe(true);
  });
  it('explains its assumptions and provides the hand-worked disposal loss', () => {
    const result = depreciation.compute({ ...depreciation.example });
    expect(result.some(b => b.kind === 'note' && b.text.includes('no residual value'))).toBe(true);
    expect(tables(result)[1]!.rows).toContainEqual(['Loss on sale', '₹2,900.00']);
  });
  it('accepts decimal rates: 12.5% WDV on 80,000 → 10,000 then 8,750, closing 61,250', () => {
    const t = tables(depreciation.compute({ ...depreciation.example, cost: '80000', method: 'WDV', rate: '12.5', years: '2', months: '12', sale: '' }))[0]!;
    expect(t.rows.map(r => r.slice(1))).toEqual([
      ['₹80,000.00', '₹10,000.00', '₹70,000.00'],
      ['₹70,000.00', '₹8,750.00', '₹61,250.00'],
    ]);
  });
  it('never depreciates below scrap: SLM 50% on 80,000 with scrap 20,000 → 40,000 then 20,000', () => {
    const r = depreciation.compute({ ...depreciation.example, cost: '80000', method: 'SLM', rate: '50', scrap: '20000', years: '2', months: '12', sale: '' });
    expect(tables(r)[0]!.rows.map(x => x[2])).toEqual(['₹40,000.00', '₹20,000.00']);
    expect(tables(r)[0]!.rows[1]![3]).toBe('₹20,000.00');
  });
  it('uses the student’s asset name in the journal and refuses scrap above cost', () => {
    const r = depreciation.compute({ ...depreciation.example, asset: 'Computer', sale: '' });
    const j = r.find(b => b.kind === 'journal') as Extract<Block, { kind: 'journal' }>;
    expect(j.entries[0]!.lines.map(l => l.account)).toContain('Computer A/c');
    expect(() => depreciation.compute({ ...depreciation.example, scrap: '200000' })).toThrow(/Scrap/);
  });
  it('rejects a rate over 100% or with 3 decimals', () => {
    expect(() => depreciation.compute({ ...depreciation.example, rate: '101' })).toThrow(/100%/);
    expect(() => depreciation.compute({ ...depreciation.example, rate: '1.005' })).toThrow(/percentage/);
  });
});
