import { describe, expect, it } from 'vitest';
import { EquationError, Money, runEquationSteps, verifyEquationAnalysis, verifyTrialBalancePlacement } from '../src';

describe('Accounting Equation Lab engine (runEquationSteps & verifyEquationAnalysis)', () => {
  it('maintains Assets = Liabilities + Capital across opening, asset swap, credit purchase, profit sale, expense, and drawings', () => {
    const steps = runEquationSteps({
      openingAssets: { Cash: Money.rupees(100000), Stock: Money.rupees(40000) },
      openingLiabilities: { Creditors: Money.rupees(20000) },
      disallowNegativeHeads: true,
      transactions: [
        {
          id: 't1',
          narration: 'Bought Furniture for cash ₹25,000',
          changes: [
            { bucket: 'ASSETS', head: 'Furniture', delta: Money.rupees(25000) },
            { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-25000) },
          ],
        },
        {
          id: 't2',
          narration: 'Purchased goods on credit ₹15,000',
          changes: [
            { bucket: 'ASSETS', head: 'Stock', delta: Money.rupees(15000) },
            { bucket: 'LIABILITIES', head: 'Creditors', delta: Money.rupees(15000) },
          ],
        },
        {
          id: 't3',
          narration: 'Sold goods costing ₹20,000 for ₹28,000 cash',
          changes: [
            { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(28000) },
            { bucket: 'ASSETS', head: 'Stock', delta: Money.rupees(-20000) },
            { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(8000) },
          ],
        },
        {
          id: 't4',
          narration: 'Paid rent ₹5,000 and owner drew ₹3,000',
          changes: [
            { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-8000) },
            { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(-8000) },
          ],
        },
      ],
    });

    // Independent oracle in integer paise:
    // Step 0: Cash 100k, Stock 40k => Assets 140k; Creditors 20k => Capital 120k
    expect(steps[0]!.totalAssets.paise).toBe(140000_00n);
    expect(steps[0]!.totalLiabilities.paise).toBe(20000_00n);
    expect(steps[0]!.totalCapital.paise).toBe(120000_00n);
    expect(steps[0]!.balanced).toBe(true);

    // Step 4 final: Cash = 100k - 25k + 28k - 8k = 95k; Stock = 40k + 15k - 20k = 35k; Furniture = 25k => Assets = 155k
    // Liabilities = 20k + 15k = 35k; Capital = 120k + 8k - 8k = 120k => L + C = 155k
    const last = steps[steps.length - 1]!;
    expect(last.assetHeads.Cash?.paise).toBe(95000_00n);
    expect(last.assetHeads.Stock?.paise).toBe(35000_00n);
    expect(last.assetHeads.Furniture?.paise).toBe(25000_00n);
    expect(last.totalAssets.paise).toBe(155000_00n);
    expect(last.totalLiabilities.paise).toBe(35000_00n);
    expect(last.totalCapital.paise).toBe(120000_00n);
    expect(last.balanced).toBe(true);
    for (const s of steps) expect(s.balanced).toBe(true);
  });

  it('refuses impossible negative asset heads when disallowNegativeHeads is true', () => {
    expect(() =>
      runEquationSteps({
        openingAssets: { Cash: Money.rupees(5000) },
        disallowNegativeHeads: true,
        transactions: [
          {
            id: 'bad',
            narration: 'Paid ₹9,000 cash',
            changes: [
              { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-9000) },
              { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(-9000) },
            ],
          },
        ],
      }),
    ).toThrow(EquationError);
  });

  it('detects unbalanced analysis and wrong head selection even when balanced', () => {
    // Unbalanced: student adds entire sale price ₹40,000 to Capital while deducting ₹30,000 Stock
    const wrongProfit = verifyEquationAnalysis(
      [
        { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(40000) },
        { bucket: 'ASSETS', head: 'Stock', delta: Money.rupees(-30000) },
        { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(40000) },
      ],
      [
        { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(40000) },
        { bucket: 'ASSETS', head: 'Stock', delta: Money.rupees(-30000) },
        { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(10000) },
      ],
    );
    expect(wrongProfit.balanced).toBe(false);
    expect(wrongProfit.matchesExpected).toBe(false);
    expect(wrongProfit.gap.paise).toBe(-30000_00n);
    expect(wrongProfit.issues.some(i => i.includes('out of balance'))).toBe(true);

    // Balanced mathematically (+20k Assets, +20k Capital), but transaction was a bank loan (+20k Liabilities)
    const wrongBucket = verifyEquationAnalysis(
      [
        { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(20000) },
        { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(20000) },
      ],
      [
        { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(20000) },
        { bucket: 'LIABILITIES', head: 'Bank Loan', delta: Money.rupees(20000) },
      ],
    );
    expect(wrongBucket.balanced).toBe(true);
    expect(wrongBucket.matchesExpected).toBe(false);
    expect(wrongBucket.issues.length).toBeGreaterThanOrEqual(2);

    // Exact match
    const exact = verifyEquationAnalysis(
      [
        { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(20000) },
        { bucket: 'LIABILITIES', head: 'Bank Loan', delta: Money.rupees(20000) },
      ],
      [
        { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(20000) },
        { bucket: 'LIABILITIES', head: 'Bank Loan', delta: Money.rupees(20000) },
      ],
    );
    expect(exact.balanced).toBe(true);
    expect(exact.matchesExpected).toBe(true);
    expect(exact.issues).toEqual([]);
  });
});

describe('Trial Balance Builder engine (verifyTrialBalancePlacement)', () => {
  it('tallies and flags zero wrong sides when every account is placed on its normal side', () => {
    const res = verifyTrialBalancePlacement([
      { id: 'cash', name: 'Cash', accountType: 'ASSET', amount: Money.rupees(50000), placedSide: 'DR' },
      { id: 'purch', name: 'Purchases', accountType: 'EXPENSE', amount: Money.rupees(80000), placedSide: 'DR' },
      { id: 'draw', name: 'Drawings', accountType: 'DRAWINGS', amount: Money.rupees(10000), placedSide: 'DR' },
      { id: 'cap', name: 'Capital', accountType: 'CAPITAL', amount: Money.rupees(60000), placedSide: 'CR' },
      { id: 'sales', name: 'Sales', accountType: 'REVENUE', amount: Money.rupees(55000), placedSide: 'CR' },
      { id: 'cred', name: 'Creditors', accountType: 'LIABILITY', amount: Money.rupees(25000), placedSide: 'CR' },
    ]);
    expect(res.totalDebit.paise).toBe(140000_00n);
    expect(res.totalCredit.paise).toBe(140000_00n);
    expect(res.tallies).toBe(true);
    expect(res.suspenseSide).toBeUndefined();
    expect(res.suspenseAmount.isZero()).toBe(true);
    expect(res.allCorrectSide).toBe(true);
  });

  it('computes exact Suspense side & amount when one account is placed on the wrong side (double-difference rule)', () => {
    // Drawings ₹10,000 placed on CR instead of DR => Debit is 1,30,000 and Credit is 1,50,000 (difference ₹20,000!)
    const res = verifyTrialBalancePlacement([
      { id: 'cash', name: 'Cash', accountType: 'ASSET', amount: Money.rupees(50000), placedSide: 'DR' },
      { id: 'purch', name: 'Purchases', accountType: 'EXPENSE', amount: Money.rupees(80000), placedSide: 'DR' },
      { id: 'draw', name: 'Drawings', accountType: 'DRAWINGS', amount: Money.rupees(10000), placedSide: 'CR' },
      { id: 'cap', name: 'Capital', accountType: 'CAPITAL', amount: Money.rupees(60000), placedSide: 'CR' },
      { id: 'sales', name: 'Sales', accountType: 'REVENUE', amount: Money.rupees(55000), placedSide: 'CR' },
      { id: 'cred', name: 'Creditors', accountType: 'LIABILITY', amount: Money.rupees(25000), placedSide: 'CR' },
    ]);
    expect(res.tallies).toBe(false);
    expect(res.suspenseSide).toBe('DR');
    expect(res.suspenseAmount.paise).toBe(20000_00n);
    expect(res.wrongSideIds).toEqual(['draw']);
  });

  it('catches compensating side swaps where the Trial Balance tallies despite wrong placements', () => {
    // Drawings ₹10,000 placed on CR AND Creditors ₹10,000 placed on DR => totals still equal, yet two sides are wrong!
    const res = verifyTrialBalancePlacement([
      { id: 'cash', name: 'Cash', accountType: 'ASSET', amount: Money.rupees(60000), placedSide: 'DR' },
      { id: 'draw', name: 'Drawings', accountType: 'DRAWINGS', amount: Money.rupees(10000), placedSide: 'CR' },
      { id: 'cap', name: 'Capital', accountType: 'CAPITAL', amount: Money.rupees(60000), placedSide: 'CR' },
      { id: 'cred', name: 'Creditors', accountType: 'LIABILITY', amount: Money.rupees(10000), placedSide: 'DR' },
    ]);
    expect(res.tallies).toBe(true);
    expect(res.allCorrectSide).toBe(false);
    expect(res.wrongSideIds).toEqual(['draw', 'cred']);
  });
});
