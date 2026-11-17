import { describe, expect, it } from 'vitest';
import { starterChartClassXI } from '../../engine/src';
import { migratedTrainerScenes } from '../src/questions-v1';
import { trainerFeedback, trainerSample } from '../src/trainer';
import { TRAINER_EXAMPLES } from '../../../apps/web/src/trainer-examples';

const chart = starterChartClassXI();

describe('Debit & Credit Trainer — hand-worked classroom cases', () => {
  it('has the intended debit and credit for each hand-written transaction', () => {
    // Independent expected entries: investment, asset purchase, credit purchase, cash/credit sale,
    // rent, salary, drawings, debtor, creditor, loan, bank deposit, interest, depreciation, bad debt.
    expect(TRAINER_EXAMPLES.map(q => [q.dr, q.cr])).toEqual([
      ['cash', 'capital'],
      ['machinery', 'cash'],
      ['purchases', 'creditors'],
      ['cash', 'sales'],
      ['debtors', 'sales'],
      ['rent', 'cash'],
      ['salary', 'cash'],
      ['drawings', 'cash'],
      ['cash', 'debtors'],
      ['creditors', 'cash'],
      ['bank', 'bank-loan'],
      ['bank', 'cash'],
      ['cash', 'interest-received'],
      ['depreciation', 'machinery'],
      ['bad-debts', 'debtors'],
    ]);
    for (const q of [...TRAINER_EXAMPLES, ...migratedTrainerScenes(chart.list())]) {
      expect(chart.has(q.dr)).toBe(true);
      expect(chart.has(q.cr)).toBe(true);
      expect(q.dr).not.toBe(q.cr);
    }
  });
  it('explains reversed sides, capital assets versus goods, and personal drawings', () => {
    const machinery = TRAINER_EXAMPLES[1]!,
      drawings = TRAINER_EXAMPLES[7]!;
    expect(trainerFeedback(chart, machinery, 'cash', 'DR')).toContain('other side');
    expect(trainerFeedback(chart, machinery, 'purchases', 'DR')).toContain('goods bought for resale');
    expect(trainerFeedback(chart, drawings, 'rent', 'DR')).toContain('not a business expense');
    expect(trainerFeedback(chart, drawings, 'drawings', 'DR')).toContain('correct debit');
    expect(trainerFeedback(chart, machinery, 'rent', 'CR')).toContain('not the expected credit');
  });
  it('samples without repeating or mutating the input', () => {
    const values = [1, 2, 3, 4, 5],
      result = trainerSample(values, 3, () => 0);
    expect(result).toEqual([2, 3, 4]);
    expect(values).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(result).size).toBe(3);
  });
});
