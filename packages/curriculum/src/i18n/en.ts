/** English UI strings for the V1 slice (handoff T0.4). `hi.ts` must have exactly the same keys. */
export const EN = {
  'lang.toggle': 'हिन्दी (मसौदा)',
  // the visible text must be part of the accessible name (WCAG 2.5.3 Label in Name)
  'lang.toggle.aria': 'हिन्दी (मसौदा) — switch to Hindi (draft, not yet reviewed)',
  'draft.title': 'Hindi draft — not yet reviewed.',
  'draft.body': 'Hindi draft — not yet reviewed by a teacher. If a term looks wrong, use the English version.',
  'practice.noHindi': 'This question is not yet available in Hindi; it is shown in English.',
  'practice.choose': '— choose —',
  'practice.amount': 'amount in ₹',
  'practice.youWrote': ': you wrote “',
  'practice.blank': '(blank)',
  'practice.answerIs': '”; the answer is ',
  'practice.end': '.',
  'practice.correct': '✓ Correct.',
  'practice.notThisTime': 'Not this time.',
  'practice.scored': 'You scored {marks} / {outOf}.',
  'typology.RU': 'Remembering & understanding',
  'typology.AP': 'Applying',
  'typology.AEC': 'Analysing & evaluating',
  'learn.outcomes': 'Official learning outcomes',
  'learn.outcomesNote': 'The outcomes are quoted in the official English wording of the CBSE curriculum.',
} as const;
export type Key = keyof typeof EN;
