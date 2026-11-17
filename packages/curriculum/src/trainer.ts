import type { ChartOfAccounts, Side } from '../../engine/src';

/** A trainer question has exactly one debit and one credit account. */
export interface TrainerItem { readonly text: string; readonly dr: string; readonly cr: string; readonly why: string }

/** Fisher–Yates sample without replacement; the optional RNG makes the selection testable. */
export function trainerSample<T>(items: readonly T[], count: number, random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out.slice(0, count);
}

/** Feedback refers to what the learner selected, without assuming the wrong account never changes. */
export function trainerFeedback(chart: ChartOfAccounts, q: TrainerItem, selected: string, side: Side): string {
  const right = side === 'DR' ? q.dr : q.cr;
  const other = side === 'DR' ? q.cr : q.dr;
  const chosen = chart.get(selected), expected = chart.get(right);
  const word = side === 'DR' ? 'debit' : 'credit';
  if (selected === right) return `${expected.name} is the correct ${word} account.`;
  if (selected === other) return `${chosen.name} belongs on the other side of this entry. ${word === 'debit' ? 'Debit' : 'Credit'} ${expected.name} here.`;
  if (right === 'machinery' && selected === 'purchases') return 'Purchases is for goods bought for resale. Machinery bought for use is an asset; debit Machinery.';
  if (right === 'drawings' && chosen.type === 'EXPENSE') return 'The owner’s personal withdrawal is Drawings, not a business expense; debit Drawings.';
  return `${chosen.name} is not the expected ${word} account here. Identify what changed in the transaction: ${expected.name} is the expected ${word}.`;
}
