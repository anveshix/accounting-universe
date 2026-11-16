import { describe, expect, it } from 'vitest';
import { Fraction } from '../../engine/src';
import { moneyList, percentExact, splitAmounts } from '../../../apps/web/src/inputs';
import { pctText } from '../../../apps/web/src/labs/common';

describe('amount list parsing', () => {
  it('keeps Indian grouping inside one amount and splits real separators', () => {
    expect(splitAmounts('1,25,000, 50,000')).toEqual(['1,25,000', '50,000']);
    expect(splitAmounts('120000,150000,135000')).toEqual(['120000', '150000', '135000']);
    expect(splitAmounts('1,25,000\n50,000; 7,500')).toEqual(['1,25,000', '50,000', '7,500']);
    expect(splitAmounts('300000, 50000')).toEqual(['300000', '50000']);
  });
  it('parses to exact money', () => {
    expect(moneyList({ x: '1,25,000, 50,000.50' }, 'x', 'X').map(m => m.format())).toEqual(['₹1,25,000.00', '₹50,000.50']);
  });
});
describe('exact percentages', () => {
  it('percentExact reads decimals as exact fractions', () => {
    const r = percentExact({ r: '12.5' }, 'r', 'Rate');
    expect(r.f.equals(Fraction.of(1, 8))).toBe(true);
    expect(r.text).toBe('12.5');
    expect(percentExact({ r: '7.25' }, 'r', 'Rate').f.equals(Fraction.of(29, 400))).toBe(true);
  });
  it('pctText rounds half-up in integers: 1/3 → 33.3%, 2/3 → 66.7%, 1/8 → 12.5%, 1/16 → 6.3%', () => {
    expect(pctText(Fraction.of(1, 3))).toBe('1/3 (33.3%)');
    expect(pctText(Fraction.of(2, 3))).toBe('2/3 (66.7%)');
    expect(pctText(Fraction.of(1, 8))).toBe('1/8 (12.5%)');
    expect(pctText(Fraction.of(1, 16))).toBe('1/16 (6.3%)');
  });
});
