import { describe, expect, it } from 'vitest';
import { starterChartClassXI } from '../../engine/src';
import { TRAINER_TEMPLATES, generateTrainerItems } from '../src/trainer';

describe('generated trainer questions', () => {
  const chart = starterChartClassXI();
  it('every template uses accounts that exist, on opposite sides', () => {
    for (const t of TRAINER_TEMPLATES) { expect(chart.has(t.dr), t.dr).toBe(true); expect(chart.has(t.cr), t.cr).toBe(true); expect(t.dr).not.toBe(t.cr); }
  });
  it('produces 1500 distinct questions, reproducible from the seed', () => {
    const a = generateTrainerItems(1500, 7); expect(a).toHaveLength(1500); expect(new Set(a.map(x => x.text)).size).toBe(1500);
    expect(generateTrainerItems(1500, 7)).toEqual(a); expect(generateTrainerItems(50, 8)).not.toEqual(generateTrainerItems(50, 7));
  });
  it('hand-checked wording: debtor receipt names the person and the Indian-format amount', () => {
    const q = generateTrainerItems(1500, 3).find(x => x.dr === 'cash' && x.cr === 'debtors')!;
    expect(q.text).toMatch(/^Received ₹[\d,]+ in cash from [A-Z][a-z]+, a debtor\.$/);
  });
});
