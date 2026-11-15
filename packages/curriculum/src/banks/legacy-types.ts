/** Shape of the scenario banks extracted (read-only) from the legacy single-file app. */
export interface LegacyV1 {
  source: { file: string; sha256: string; extractedBy: string; arrays: Record<string, number> };
  /** m1 Live Equation: balance change per ₹1,000 of the transaction (and, for sales, per ₹1,000 of cost of goods). */
  m1: { id: string; label: string; desc: string; effectPer1000: Record<string, number>; costEffectPer1000?: Record<string, number>; linear: boolean }[];
  /** m2 Transaction Lab: scene, account pool with the legacy type letter, the right debit/credit and the equation movement. */
  m2: { text: string; amount: number; pool: { account: string; type: string }[]; debit: string[]; credit: string[]; delta: { A: number; L: number; C: number }; why: string }[];
  /** m4 Drag-Drop Lab: journal scenes. */
  m4: { text: string; pool: string[]; debit: string[]; credit: string[]; amount: number; why: string }[];
  /** m5 Equation Game: impact MCQs. */
  m5: { question: string; options: string[]; answer: number; why: string }[];
  tbPool: { account: string; side: 'dr' | 'cr' }[];
  tbItems: { account: string; side: 'dr' | 'cr' }[];
  bal: { account: string; type: string; side: 'dr' | 'cr'; why: string }[];
}
