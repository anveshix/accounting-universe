/**
 * Deterministic accounting equation & trial-balance builder calculations for the Class XI & XII
 * Simulator and Visualiser. Pure Money (`bigint` paise) — zero floating-point arithmetic.
 */
import { type AccountType, type Side, normalSide } from './accounts';
import { Money } from './money';

export class EquationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EquationError';
  }
}

export type EquationBucket = 'ASSETS' | 'LIABILITIES' | 'CAPITAL';

export interface EquationLineChange {
  readonly bucket: EquationBucket;
  /** Account head within the bucket, e.g. 'Cash', 'Stock', 'Creditors', 'Capital'. */
  readonly head: string;
  /** Signed change in paise (`Money`): positive = increase, negative = decrease. */
  readonly delta: Money;
}

export interface EquationTransaction {
  readonly id: string;
  readonly narration: string;
  readonly changes: readonly EquationLineChange[];
}

export interface EquationStepState {
  readonly stepIndex: number;
  readonly narration: string;
  readonly assetHeads: Readonly<Record<string, Money>>;
  readonly liabilityHeads: Readonly<Record<string, Money>>;
  readonly capitalHeads: Readonly<Record<string, Money>>;
  readonly totalAssets: Money;
  readonly totalLiabilities: Money;
  readonly totalCapital: Money;
  readonly rhsTotal: Money;
  readonly balanced: boolean;
  readonly imbalance: Money;
  readonly deltas: readonly EquationLineChange[];
}

function sumRecord(rec: Readonly<Record<string, Money>>): Money {
  return Money.sum(Object.values(rec));
}

function snapshotState(
  stepIndex: number,
  narration: string,
  assets: Record<string, Money>,
  liabilities: Record<string, Money>,
  capital: Record<string, Money>,
  deltas: readonly EquationLineChange[],
): EquationStepState {
  const totalAssets = sumRecord(assets);
  const totalLiabilities = sumRecord(liabilities);
  const totalCapital = sumRecord(capital);
  const rhsTotal = totalLiabilities.add(totalCapital);
  const imbalance = totalAssets.sub(rhsTotal);
  return {
    stepIndex,
    narration,
    assetHeads: { ...assets },
    liabilityHeads: { ...liabilities },
    capitalHeads: { ...capital },
    totalAssets,
    totalLiabilities,
    totalCapital,
    rhsTotal,
    balanced: imbalance.isZero(),
    imbalance,
    deltas,
  };
}

/**
 * Steps through an opening position and a sequence of transactions, verifying Assets = Liabilities + Capital
 * at every step and refusing impossible negative asset/liability heads when `disallowNegativeHeads` is true.
 */
export function runEquationSteps(opts: {
  readonly openingAssets?: Readonly<Record<string, Money>>;
  readonly openingLiabilities?: Readonly<Record<string, Money>>;
  readonly transactions: readonly EquationTransaction[];
  readonly disallowNegativeHeads?: boolean;
}): readonly EquationStepState[] {
  const assets: Record<string, Money> = {};
  const liabilities: Record<string, Money> = {};
  const capital: Record<string, Money> = {};

  for (const [k, v] of Object.entries(opts.openingAssets ?? {})) {
    if (v.isNegative() && opts.disallowNegativeHeads) {
      throw new EquationError(`Opening asset "${k}" cannot be negative (${v.format()})`);
    }
    if (!v.isZero()) assets[k] = v;
  }
  for (const [k, v] of Object.entries(opts.openingLiabilities ?? {})) {
    if (v.isNegative() && opts.disallowNegativeHeads) {
      throw new EquationError(`Opening liability "${k}" cannot be negative (${v.format()})`);
    }
    if (!v.isZero()) liabilities[k] = v;
  }

  const openingCap = sumRecord(assets).sub(sumRecord(liabilities));
  if (!openingCap.isZero() || Object.keys(assets).length > 0 || Object.keys(liabilities).length > 0) {
    capital['Capital'] = openingCap;
  }

  const steps: EquationStepState[] = [];
  if (Object.keys(assets).length > 0 || Object.keys(liabilities).length > 0) {
    steps.push(snapshotState(0, 'Opening position', assets, liabilities, capital, []));
  }

  for (const [idx, txn] of opts.transactions.entries()) {
    if (txn.changes.length === 0) {
      throw new EquationError(`Transaction "${txn.narration}" has no changes`);
    }
    for (const ch of txn.changes) {
      const target = ch.bucket === 'ASSETS' ? assets : ch.bucket === 'LIABILITIES' ? liabilities : capital;
      const prev = target[ch.head] ?? Money.ZERO;
      const next = prev.add(ch.delta);
      if (opts.disallowNegativeHeads && (ch.bucket === 'ASSETS' || ch.bucket === 'LIABILITIES') && next.isNegative()) {
        throw new EquationError(`Step ${idx + 1} ("${txn.narration}"): ${ch.head} would fall below zero (${next.format()})`);
      }
      target[ch.head] = next;
    }
    steps.push(snapshotState(idx + 1, txn.narration, assets, liabilities, capital, txn.changes));
  }

  return steps;
}

export interface EquationAuditVerdict {
  readonly balanced: boolean;
  readonly matchesExpected: boolean;
  readonly assetDelta: Money;
  readonly liabilityDelta: Money;
  readonly capitalDelta: Money;
  readonly gap: Money;
  readonly issues: readonly string[];
}

/**
 * Evaluates a student's proposed equation analysis against both the fundamental identity
 * (ΔAssets = ΔLiabilities + ΔCapital) and an optional expected set of head movements.
 */
export function verifyEquationAnalysis(proposed: readonly EquationLineChange[], expected?: readonly EquationLineChange[]): EquationAuditVerdict {
  let a = Money.ZERO;
  let l = Money.ZERO;
  let c = Money.ZERO;

  for (const ch of proposed) {
    if (ch.bucket === 'ASSETS') a = a.add(ch.delta);
    else if (ch.bucket === 'LIABILITIES') l = l.add(ch.delta);
    else c = c.add(ch.delta);
  }

  const rhs = l.add(c);
  const gap = a.sub(rhs);
  const balanced = gap.isZero();
  const issues: string[] = [];

  if (proposed.length === 0) {
    issues.push('Add at least one movement on Assets, Liabilities, or Capital.');
  }
  if (!balanced) {
    issues.push(`Equation out of balance by ${gap.abs().format()}: change in Assets (${a.format()}) does not equal change in Liabilities + Capital (${rhs.format()}).`);
  }

  let matchesExpected = balanced && proposed.length > 0;
  if (expected) {
    const collapse = (list: readonly EquationLineChange[]) => {
      const m = new Map<string, Money>();
      for (const item of list) {
        const key = `${item.bucket}:${item.head.trim().toLowerCase()}`;
        const next = (m.get(key) ?? Money.ZERO).add(item.delta);
        if (next.isZero()) m.delete(key);
        else m.set(key, next);
      }
      return m;
    };
    const pMap = collapse(proposed);
    const eMap = collapse(expected);

    for (const [k, expVal] of eMap.entries()) {
      const gotVal = pMap.get(k) ?? Money.ZERO;
      if (!gotVal.equals(expVal)) {
        matchesExpected = false;
        const [bucket, head] = k.split(':');
        issues.push(`${head} (${bucket}): expected ${expVal.isPositive() ? '+' : ''}${expVal.format()}, got ${gotVal.isZero() ? 'no change' : (gotVal.isPositive() ? '+' : '') + gotVal.format()}.`);
      }
    }
    for (const [k, gotVal] of pMap.entries()) {
      if (!eMap.has(k)) {
        matchesExpected = false;
        const [bucket, head] = k.split(':');
        issues.push(`${head} (${bucket}) should not move (${gotVal.format()} entered).`);
      }
    }
  }

  return {
    balanced,
    matchesExpected,
    assetDelta: a,
    liabilityDelta: l,
    capitalDelta: c,
    gap,
    issues,
  };
}

// ───────────────────── Trial Balance Builder (balance method, CBSE Class XI) ─────────────────────

export interface TbCardPlacement {
  readonly id: string;
  readonly name: string;
  readonly accountType: AccountType;
  readonly amount: Money;
  /** Student's chosen side in the Trial Balance (`DR` or `CR`). */
  readonly placedSide: Side;
}

export interface TbPlacementVerdict {
  readonly totalDebit: Money;
  readonly totalCredit: Money;
  readonly tallies: boolean;
  readonly suspenseSide?: Side;
  readonly suspenseAmount: Money;
  readonly wrongSideIds: readonly string[];
  readonly allCorrectSide: boolean;
}

/**
 * Evaluates a student-built Trial Balance (balance method). Checks both whether total Debit = total Credit
 * AND whether every ledger balance was placed on its normal side (`normalSide(accountType)`).
 * Notice how two equal-and-opposite wrong placements still let the Trial Balance tally — a classic CBSE concept!
 */
export function verifyTrialBalancePlacement(cards: readonly TbCardPlacement[]): TbPlacementVerdict {
  let totalDebit = Money.ZERO;
  let totalCredit = Money.ZERO;
  const wrongSideIds: string[] = [];

  for (const c of cards) {
    if (c.amount.isNegative()) {
      throw new EquationError(`Account "${c.name}" balance must be non-negative`);
    }
    if (c.placedSide === 'DR') totalDebit = totalDebit.add(c.amount);
    else totalCredit = totalCredit.add(c.amount);

    if (c.placedSide !== normalSide(c.accountType)) {
      wrongSideIds.push(c.id);
    }
  }

  const diff = totalDebit.sub(totalCredit);
  const tallies = diff.isZero();
  const suspenseSide: Side | undefined = tallies ? undefined : diff.isPositive() ? 'CR' : 'DR';

  return {
    totalDebit,
    totalCredit,
    tallies,
    ...(suspenseSide ? { suspenseSide } : {}),
    suspenseAmount: diff.abs(),
    wrongSideIds,
    allCorrectSide: wrongSideIds.length === 0,
  };
}
