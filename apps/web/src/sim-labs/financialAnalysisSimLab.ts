/**
 * Experience I — Financial Statement Analysis & Cash Flow Lab (`XII.3.*`, `XII.4.*`, Option I)
 * Powered by `comparative`, `commonSize`, all 4 ratio families (`currentRatio`, `quickRatio`,
 * `debtEquityRatio`, `proprietaryRatio`, `interestCoverageRatio`, `inventoryTurnoverRatio`,
 * `receivablesTurnoverRatio`, `grossProfitRatio`, `operatingRatio`, `operatingProfitRatio`,
 * `netProfitRatio`, `returnOnInvestment`), and `cashFlowStatement` (AS 3 Indirect Method) in `packages/engine`.
 */
import {
  Money,
  cashFlowStatement,
  commonSize,
  comparative,
  currentRatio,
  debtEquityRatio,
  grossProfitRatio,
  interestCoverageRatio,
  inventoryTurnoverRatio,
  netProfitRatio,
  operatingProfitRatio,
  operatingRatio,
  proprietaryRatio,
  quickRatio,
  receivablesTurnoverRatio,
  returnOnInvestment,
} from '../../../../packages/engine/src';
import { h, mount } from '../dom';
import type { SimShellContext } from './shell';

const R = (m: Money) => m.format();

export function renderFinancialAnalysisLab(stage: HTMLElement, ctx: SimShellContext): void {
  let tab: 'RATIOS' | 'COMP_COMMON' | 'CASH_FLOW' = 'RATIOS';

  // Ratios state
  let caRupees = 400000;
  let invRupees = 100000;
  const prepRupees = 20000;
  let clRupees = 200000;
  let ltDebtRupees = 300000;
  const eqRupees = 600000;
  let revRupees = 1000000;
  const cogsRupees = 600000;
  const opexRupees = 150000;
  const intExpRupees = 30000;
  const taxRupees = 66000;

  // Comparative / Common-size state
  const prevRev = 800000;
  let curRev = 1000000;
  const prevCogs = 500000;
  let curCogs = 600000;
  const prevOpex = 120000;
  const curOpex = 150000;

  // Cash flow state (AS 3 Revised Indirect)
  let cfNpbt = 220000;
  const cfDep = 45000;
  const cfIntExp = 30000;
  const cfWcDelta = -25000; // increase in working capital
  const cfTaxPaid = 50000;
  let cfMachBought = -140000;
  let cfSharesIssued = 100000;
  const cfOpenCash = 60000;

  const syncTier = () => {
    const t = ctx.getDifficulty();
    if (t === 'BEGINNER' || t === 'CHALLENGE') tab = 'RATIOS';
    else if (t === 'PRACTICE') tab = 'COMP_COMMON';
    else tab = 'CASH_FLOW';
  };
  syncTier();
  ctx.onChange(() => {
    syncTier();
    draw();
  });

  function renderRatiosView(): HTMLElement {
    const ca = Money.rupees(caRupees);
    const inv = Money.rupees(Math.min(invRupees, caRupees));
    const prep = Money.rupees(Math.min(prepRupees, Math.max(0, caRupees - invRupees)));
    const cl = Money.rupees(Math.max(10000, clRupees));
    const debt = Money.rupees(ltDebtRupees);
    const eq = Money.rupees(Math.max(50000, eqRupees));
    const capEmp = eq.add(debt);
    const totalAssets = capEmp.add(cl);

    const rev = Money.rupees(revRupees);
    const cogs = Money.rupees(cogsRupees);
    const gp = rev.sub(cogs);
    const opex = Money.rupees(opexRupees);
    const opProfit = gp.sub(opex);
    const intExp = Money.rupees(Math.max(5000, intExpRupees));
    const pbt = opProfit.sub(intExp);
    const pat = pbt.sub(Money.rupees(taxRupees));

    const rCurrent = currentRatio(ca, cl);
    const rQuick = quickRatio(ca, inv, prep, cl);
    const rDe = debtEquityRatio(debt, eq);
    const rProp = proprietaryRatio(eq, totalAssets);
    const rIcr = interestCoverageRatio(opProfit, intExp);
    const rItr = inventoryTurnoverRatio(cogs, inv, inv);
    const rRtr = receivablesTurnoverRatio(rev, Money.rupees(125000), Money.rupees(125000));
    const rGp = grossProfitRatio(gp, rev);
    const rOp = operatingRatio(cogs, opex, rev);
    const rOpProf = operatingProfitRatio(opProfit, rev);
    const rNpAfter = netProfitRatio(pat, rev, 'AFTER_TAX');
    const rRoi = returnOnInvestment(opProfit, capEmp);

    const allRatios = [rCurrent, rQuick, rDe, rProp, rIcr, rItr, rRtr, rGp, rOp, rOpProf, rNpAfter, rRoi];

    return h(
      'div',
      { class: 'simlab-grid-2' },
      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Interactive Balance Sheet & P&L Sliders · 4 Ratio Families'),
        h('h3', {}, 'Adjust Financial Drivers & Inspect Ratio Sensitivity'),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Current Assets: ${R(ca)}`),
          h('input', {
            type: 'range',
            min: '150000',
            max: '800000',
            step: '25000',
            value: String(caRupees),
            oninput: (e: Event) => {
              caRupees = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Inventory (inside Current Assets): ${R(inv)}`),
          h('input', {
            type: 'range',
            min: '20000',
            max: '300000',
            step: '20000',
            value: String(invRupees),
            oninput: (e: Event) => {
              invRupees = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Current Liabilities: ${R(cl)}`),
          h('input', {
            type: 'range',
            min: '50000',
            max: '500000',
            step: '25000',
            value: String(clRupees),
            oninput: (e: Event) => {
              clRupees = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Long-Term Debt: ${R(debt)} · Shareholders’ Funds: ${R(eq)}`),
          h('input', {
            type: 'range',
            min: '50000',
            max: '700000',
            step: '50000',
            value: String(ltDebtRupees),
            oninput: (e: Event) => {
              ltDebtRupees = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Revenue from Operations: ${R(rev)}`),
          h('input', {
            type: 'range',
            min: '500000',
            max: '1600000',
            step: '50000',
            value: String(revRupees),
            oninput: (e: Event) => {
              revRupees = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'button',
          {
            type: 'button',
            'data-ana-verify': '',
            onclick: () => {
              void ctx.completeMission(`Financial Ratios verified: Current ${rCurrent.display}, Quick ${rQuick.display}, Debt-Equity ${rDe.display}, ROI ${rRoi.display}.`);
            },
          },
          'Verify Ratio Analysis Mission',
        ),
      ),

      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Liquidity · Solvency · Activity · Profitability Dashboard'),
        h(
          'div',
          { class: 'simlab-ratio-grid' },
          ...allRatios.map(r =>
            h(
              'div',
              { class: 'ratio-card' },
              h('span', { class: 'badge-pill' }, r.category),
              h('h4', {}, r.name),
              h('strong', { class: 'ratio-big' }, r.display),
              h('small', { class: 'hint' }, r.formula),
              h('p', { class: 'ratio-read' }, r.reading),
            ),
          ),
        ),
      ),
    );
  }

  function renderCompCommon(): HTMLElement {
    const compRows = comparative([
      { label: 'Revenue from Operations', previous: Money.rupees(prevRev), current: Money.rupees(curRev) },
      { label: 'Cost of Revenue', previous: Money.rupees(prevCogs), current: Money.rupees(curCogs) },
      { label: 'Operating Expenses', previous: Money.rupees(prevOpex), current: Money.rupees(curOpex) },
      {
        label: 'Operating Profit',
        previous: Money.rupees(prevRev - prevCogs - prevOpex),
        current: Money.rupees(curRev - curCogs - curOpex),
      },
    ]);

    const csRows = commonSize(
      [
        { label: 'Revenue from Operations (Base = 100%)', amount: Money.rupees(curRev) },
        { label: 'Cost of Revenue', amount: Money.rupees(curCogs) },
        { label: 'Operating Expenses', amount: Money.rupees(curOpex) },
        { label: 'Operating Profit', amount: Money.rupees(curRev - curCogs - curOpex) },
      ],
      Money.rupees(curRev),
    );

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Comparative & Common-Size Statements (`XII.3.comparative`, `XII.3.common-size`)'),
      h(
        'div',
        { class: 'simlab-form-row' },
        h(
          'label',
          {},
          `Current Year Revenue: ₹${curRev.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '600000',
            max: '1500000',
            step: '50000',
            value: String(curRev),
            oninput: (e: Event) => {
              curRev = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Current Year Cost of Revenue: ₹${curCogs.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '300000',
            max: '900000',
            step: '25000',
            value: String(curCogs),
            oninput: (e: Event) => {
              curCogs = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
      ),
      h(
        'div',
        { class: 'simtable-wrap' },
        h(
          'table',
          { class: 'simtable' },
          h('caption', {}, 'Comparative Statement & Common-Size % of Revenue'),
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              h('th', {}, 'Particulars'),
              h('th', { class: 'num' }, 'Previous Yr'),
              h('th', { class: 'num' }, 'Current Yr'),
              h('th', { class: 'num' }, 'Abs. Change'),
              h('th', { class: 'num' }, '% Change'),
              h('th', { class: 'num' }, 'Common-Size (%)'),
            ),
          ),
          h(
            'tbody',
            {},
            ...compRows.map((r, i) =>
              h(
                'tr',
                {},
                h('td', {}, r.label),
                h('td', { class: 'num' }, R(r.previous)),
                h('td', { class: 'num' }, R(r.current)),
                h('td', { class: 'num' }, R(r.change)),
                h('td', { class: 'num' }, r.percentChange ? `${r.percentChange}%` : '—'),
                h('td', { class: 'num' }, `${csRows[i]!.percent}%`),
              ),
            ),
          ),
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          onclick: () => {
            void ctx.completeMission('Comparative & Common-Size statement percentages verified.');
          },
        },
        'Verify Comparative & Common-Size Statement',
      ),
    );
  }

  function renderCashFlow(): HTMLElement {
    const cf = cashFlowStatement({
      netProfitBeforeTaxAndExtraordinary: Money.rupees(cfNpbt),
      adjustments: [
        { label: 'Add: Depreciation (non-cash)', amount: Money.rupees(cfDep) },
        { label: 'Add: Interest on Borrowings (non-operating)', amount: Money.rupees(cfIntExp) },
      ],
      workingCapitalChanges: [{ label: 'Net Working Capital movement', amount: Money.rupees(cfWcDelta) }],
      taxPaid: Money.rupees(cfTaxPaid),
      investing: [{ label: 'Purchase of Machinery', amount: Money.rupees(cfMachBought) }],
      financing: [
        { label: 'Issue of Equity Shares', amount: Money.rupees(cfSharesIssued) },
        { label: 'Interest Paid on Borrowings', amount: Money.rupees(-cfIntExp) },
      ],
      openingCashEquivalents: Money.rupees(cfOpenCash),
    });

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Cash Flow Statement — AS 3 (Revised) Indirect Method Only (`XII.4.preparation`)'),
      h('h3', {}, `Opening Cash ${R(Money.rupees(cfOpenCash))} + Net Flow ${R(cf.netChange)} = Closing Cash ${R(cf.closing)}`),
      h(
        'div',
        { class: 'simlab-form-row' },
        h(
          'label',
          {},
          `NPBT: ₹${cfNpbt.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '80000',
            max: '400000',
            step: '20000',
            value: String(cfNpbt),
            oninput: (e: Event) => {
              cfNpbt = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Machinery Outflow: ₹${cfMachBought.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '-250000',
            max: '-20000',
            step: '20000',
            value: String(cfMachBought),
            oninput: (e: Event) => {
              cfMachBought = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Share Issue Inflow: ₹${cfSharesIssued.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '0',
            max: '250000',
            step: '25000',
            value: String(cfSharesIssued),
            oninput: (e: Event) => {
              cfSharesIssued = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
      ),
      h(
        'div',
        { class: 'simlab-kpi-row' },
        h('div', { class: 'kpi-tile' }, h('small', {}, 'A. Operating Cash Flow'), h('strong', {}, R(cf.cashFromOperating))),
        h('div', { class: 'kpi-tile' }, h('small', {}, 'B. Investing Cash Flow'), h('strong', {}, R(cf.cashFromInvesting))),
        h('div', { class: 'kpi-tile' }, h('small', {}, 'C. Financing Cash Flow'), h('strong', {}, R(cf.cashFromFinancing))),
      ),
      h(
        'div',
        { class: 'simtable-wrap' },
        h(
          'table',
          { class: 'simtable' },
          h('caption', {}, 'AS 3 (Revised) Indirect Cash Flow Reconciliation'),
          h(
            'tbody',
            {},
            h('tr', {}, h('td', {}, 'Operating Profit before Working Capital Changes'), h('td', { class: 'num' }, R(cf.operatingProfitBeforeWorkingCapital))),
            h('tr', {}, h('td', {}, 'Cash Generated from Operations'), h('td', { class: 'num' }, R(cf.cashGeneratedFromOperations))),
            h('tr', {}, h('td', {}, 'I. Net Cash from Operating Activities (after Tax Paid)'), h('td', { class: 'num' }, R(cf.cashFromOperating))),
            h('tr', {}, h('td', {}, 'II. Net Cash used in Investing Activities'), h('td', { class: 'num' }, R(cf.cashFromInvesting))),
            h('tr', {}, h('td', {}, 'III. Net Cash from Financing Activities'), h('td', { class: 'num' }, R(cf.cashFromFinancing))),
            h('tr', {}, h('td', {}, 'Net Increase / (Decrease) in Cash & Cash Equivalents (I + II + III)'), h('td', { class: 'num' }, R(cf.netChange))),
            h('tr', {}, h('td', {}, 'Add: Opening Cash & Cash Equivalents (incl. Marketable Securities)'), h('td', { class: 'num' }, R(Money.rupees(cfOpenCash)))),
          ),
          h('tfoot', {}, h('tr', {}, h('th', {}, 'Closing Cash & Cash Equivalents'), h('th', { class: 'num' }, R(cf.closing)))),
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          'data-cf-verify': '',
          onclick: () => {
            void ctx.completeMission(`Indirect Cash Flow Statement reconciled: Net flow ${R(cf.netChange)}, Closing Cash ${R(cf.closing)}.`);
          },
        },
        'Verify Cash Flow Statement',
      ),
    );
  }

  function draw() {
    mount(
      stage,
      h(
        'div',
        { class: 'simlab-stack' },
        h(
          'div',
          { class: 'modes simlab-subtabs', role: 'tablist' },
          h(
            'button',
            {
              type: 'button',
              class: tab === 'RATIOS' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'RATIOS';
                draw();
              },
            },
            '1. Interactive Ratio Calculator (All 4 Groups)',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'COMP_COMMON' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'COMP_COMMON';
                draw();
              },
            },
            '2. Comparative & Common-Size',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'CASH_FLOW' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'CASH_FLOW';
                draw();
              },
            },
            '3. Cash Flow Statement (Indirect)',
          ),
        ),
        tab === 'RATIOS' ? renderRatiosView() : tab === 'COMP_COMMON' ? renderCompCommon() : renderCashFlow(),
      ),
    );
  }

  draw();
}
