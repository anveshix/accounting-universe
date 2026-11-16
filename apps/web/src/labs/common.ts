import { Fraction, Money } from '../../../../packages/engine/src';
import type { Block } from '../spec';
import { num } from '../inputs';

export const fmt = (m: Money) => m.format();
export const R = (m: Money) => m.format();
export const sh = (f: Fraction) => f.toString();
/** "1/3 (33.3%)" — the percentage is computed in exact integers (half-up to 1 decimal), never through floating point. */
export const pctText = (f: Fraction): string => {
  const neg = f.num < 0n, n = neg ? -f.num : f.num, tenths = (n * 2000n + f.den) / (2n * f.den);      // round(n/den × 1000) half-up
  return `${f.toString()} (${neg ? '-' : ''}${tenths / 10n}.${tenths % 10n}%)`;
};
export const moneyRow = (label: string, m: Money): string[] => [label, m.format()];
export const note = (text: string, tone: 'info' | 'good' | 'warn' | 'bad' = 'info'): Block => ({ kind: 'note', text, tone });
export const bar = (label: string, m: Money, tone?: 'a' | 'b' | 'c' | 'neg') => ({ label, value: num(m), text: m.format(), ...(tone ? { tone } : {}) });
export const PARTNER_IDS = ['A', 'B', 'C'] as const;
export const names = (n: number) => PARTNER_IDS.slice(0, n);
