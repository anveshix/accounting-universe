import { describe, expect, it } from 'vitest';
import { checkAnswer, type Part } from '../src/questions';

const text = (answer: string): Part => ({ label: 'Ratio', kind: 'TEXT', answer, marks: 1 });

describe('typed text answers that are plain numbers', () => {
  it('accept the same number written with fewer or more zeros', () => {
    for (const typed of ['2', '2.0', '2.00', '2.000', ' 2.00 ']) expect(checkAnswer(text('2.00'), typed), typed).toBe(true);
    for (const typed of ['3.06', '3.060', '03.06']) expect(checkAnswer(text('3.06'), typed), typed).toBe(true);
    expect(checkAnswer(text('0.50'), '.5')).toBe(false); // ".5" is not a form the app teaches; stay strict on shape, lenient on zeros
    expect(checkAnswer(text('0.50'), '0.5')).toBe(true);
    expect(checkAnswer(text('10.00'), '10')).toBe(true);
  });
  it('still reject a different number, however it is written', () => {
    expect(checkAnswer(text('2.00'), '2.01')).toBe(false);
    expect(checkAnswer(text('2.00'), '20')).toBe(false);
    expect(checkAnswer(text('2.00'), '2.5')).toBe(false);
    expect(checkAnswer(text('10.00'), '1')).toBe(false);
    expect(checkAnswer(text('3.06'), '3.6')).toBe(false);
    expect(checkAnswer(text('2.00'), '')).toBe(false);
    expect(checkAnswer(text('2.00'), 'two')).toBe(false);
  });
  it('words and codes still need an exact (case-blind) match', () => {
    expect(checkAnswer(text('Current assets'), 'current assets')).toBe(true);
    expect(checkAnswer(text('Current assets'), 'current liabilities')).toBe(false);
  });
});
