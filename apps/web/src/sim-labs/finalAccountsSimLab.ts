/**
 * Experience F — Final Accounts & Adjustments Builder (`XI.3.trading-pl`, `XI.3.balance-sheet`, `XI.3.adjustments`, `XI.3.incomplete`)
 * Powered by `finalAccounts`, `statementOfAffairs`, and `profitByStatementOfAffairs` in `packages/engine`.
 */
import { Money, finalAccounts, profitByStatementOfAffairs, statementOfAffairs, type Adjustment, type TbLine } from '../../../../packages/engine/src';
import { h, mount } from '../dom';
import { renderBalanceBeamSvg, type SimShellContext } from './shell';

const R = (m: Money) => m.format();

type StatementBucket = 'TRADING' | 'PL' | 'BS';

interface SortItem {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly expected: StatementBucket;
}

const SORT_ITEMS: readonly SortItem[] = [
  { id: 'open-stock', name: 'Opening Stock', amount: 20000, expected: 'TRADING' },
  { id: 'wages', name: 'Wages', amount: 10000, expected: 'TRADING' },
  { id: 'sales', name: 'Sales', amount: 190000, expected: 'TRADING' },
  { id: 'salaries', name: 'Salaries', amount: 18000, expected: 'PL' },
  { id: 'rent', name: 'Rent', amount: 12000, expected: 'PL' },
  { id: 'debtors', name: 'Debtors', amount: 40000, expected: 'BS' },
  { id: 'creditors', name: 'Creditors', amount: 30000, expected: 'BS' },
  { id: 'capital', name: 'Capital', amount: 49000, expected: 'BS' },
];

const BASE_TB: readonly TbLine[] = [
  { name: 'Opening Stock', kind: 'OPENING_STOCK', debit: Money.rupees(20000) },
  { name: 'Purchases', kind: 'PURCHASES', debit: Money.rupees(100000) },
  { name: 'Wages', kind: 'DIRECT_EXPENSE', debit: Money.rupees(10000) },
  { name: 'Salaries', kind: 'INDIRECT_EXPENSE', debit: Money.rupees(18000) },
  { name: 'Rent', kind: 'INDIRECT_EXPENSE', debit: Money.rupees(12000) },
  { name: 'Bad debts', kind: 'BAD_DEBTS', debit: Money.rupees(1000) },
  { name: 'Debtors', kind: 'DEBTORS', debit: Money.rupees(40000) },
  { name: 'Furniture', kind: 'FIXED_ASSET', debit: Money.rupees(30000) },
  { name: 'Cash', kind: 'CURRENT_ASSET', debit: Money.rupees(5000) },
  { name: 'Bank', kind: 'CURRENT_ASSET', debit: Money.rupees(25000) },
  { name: 'Drawings', kind: 'DRAWINGS', debit: Money.rupees(8000) },
  { name: 'Sales Returns', kind: 'SALES_RETURNS', debit: Money.rupees(2000) },
  { name: 'Sales', kind: 'SALES', credit: Money.rupees(190000) },
  { name: 'Creditors', kind: 'CURRENT_LIABILITY', credit: Money.rupees(30000) },
  { name: 'Provision for doubtful debts', kind: 'PROVISION_DOUBTFUL', credit: Money.rupees(2000) },
  { name: 'Capital', kind: 'CAPITAL', credit: Money.rupees(49000) },
];

export function renderFinalAccountsLab(stage: HTMLElement, ctx: SimShellContext): void {
  let tab: 'BUILDER' | 'ADJUSTMENTS' | 'SOA' = 'BUILDER';
  const placed: Record<string, StatementBucket> = {
    'open-stock': 'TRADING',
    wages: 'PL', // deliberate starter error (Wages in PL instead of Trading)
    sales: 'TRADING',
    salaries: 'PL',
    rent: 'PL',
    debtors: 'BS',
    creditors: 'BS',
    capital: 'PL', // deliberate starter error
  };
  let dragId: string | null = null;

  let closingStock = 30000;
  let osSalary = 2000;
  let prepRent = 1000;
  let depPct = 10;
  let extraBad = 0;
  let pddPct = 0;
  let discPct = 0;
  let personalGoods = 0;
  let commPct = 0;
  let commBasis: 'BEFORE' | 'AFTER' = 'AFTER';

  let soaOpenCap = 150000;
  let soaAssets = 350000;
  let soaLiabs = 140000;
  let soaDrawings = 30000;
  let soaFresh = 20000;

  const syncTier = () => {
    const t = ctx.getDifficulty();
    if (t === 'BEGINNER') {
      tab = 'BUILDER';
    } else if (t === 'PRACTICE') {
      tab = 'ADJUSTMENTS';
      closingStock = 30000;
      osSalary = 2000;
      prepRent = 1000;
      depPct = 10;
      extraBad = 0;
      pddPct = 0;
      discPct = 0;
      commPct = 0;
    } else if (t === 'CHALLENGE') {
      tab = 'ADJUSTMENTS';
      closingStock = 30000;
      osSalary = 2000;
      prepRent = 1000;
      depPct = 10;
      extraBad = 2000;
      pddPct = 5;
      discPct = 2;
      commPct = 10;
      commBasis = 'AFTER';
    } else {
      tab = 'SOA';
    }
  };
  syncTier();
  ctx.onChange(() => {
    syncTier();
    draw();
  });

  function renderBuilderSorter(): HTMLElement {
    const wrong = SORT_ITEMS.filter(it => placed[it.id] !== it.expected);

    const bucketZone = (b: StatementBucket, title: string, sub: string) =>
      h(
        'div',
        {
          class: 'simlab-dropzone',
          'data-fa-zone': b,
          ondragover: (e: Event) => e.preventDefault(),
          ondrop: (e: Event) => {
            e.preventDefault();
            if (dragId) {
              placed[dragId] = b;
              dragId = null;
              draw();
            }
          },
        },
        h('h4', {}, title),
        h('p', { class: 'hint' }, sub),
        ...SORT_ITEMS.filter(it => placed[it.id] === b).map(it => {
          const isBad = placed[it.id] !== it.expected;
          return h(
            'div',
            {
              class: 'simlab-draggable-card' + (isBad ? ' wrong-clue' : ''),
              draggable: 'true',
              ondragstart: () => {
                dragId = it.id;
              },
            },
            h('strong', {}, `${ctx.term(it.name)} (₹${it.amount.toLocaleString('en-IN')})`),
            h(
              'select',
              {
                'aria-label': `Move ${it.name} to statement`,
                'data-fa-select': it.id,
                onchange: (e: Event) => {
                  placed[it.id] = (e.target as HTMLSelectElement).value as StatementBucket;
                  draw();
                },
              },
              h('option', { value: 'TRADING', selected: b === 'TRADING' }, 'Trading A/c'),
              h('option', { value: 'PL', selected: b === 'PL' }, 'Profit & Loss A/c'),
              h('option', { value: 'BS', selected: b === 'BS' }, 'Balance Sheet'),
            ),
          );
        }),
      );

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Drag-and-Drop or Click-to-Place · Statement Classification'),
      h('h3', {}, wrong.length === 0 ? '✓ Every Trial Balance head is in its exact Financial Statement!' : `${wrong.length} item(s) misplaced — fix highlighted cards`),
      h(
        'div',
        { class: 'simlab-eq-columns' },
        bucketZone('TRADING', 'Trading Account', 'Direct goods, direct expenses & sales → Gross Profit'),
        bucketZone('PL', 'Profit & Loss Account', 'Indirect operating & non-operating items → Net Profit'),
        bucketZone('BS', 'Balance Sheet', 'Assets, Liabilities & Capital → Financial Position'),
      ),
      h(
        'div',
        { class: 'simlab-action-row' },
        h(
          'button',
          {
            type: 'button',
            'data-fa-verify': '',
            onclick: () => {
              if (wrong.length === 0) {
                void ctx.completeMission('Sorted all Trial Balance items cleanly into Trading A/c, P&L A/c, and Balance Sheet.');
              }
              draw();
            },
          },
          'Verify Statement Placement',
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'secondary',
            onclick: () => {
              for (const it of SORT_ITEMS) placed[it.id] = it.expected;
              draw();
            },
          },
          'Auto-Place All',
        ),
      ),
    );
  }

  function renderAdjustmentsView(): HTMLElement {
    const adjs: Adjustment[] = [];
    if (closingStock > 0) adjs.push({ type: 'CLOSING_STOCK', amount: Money.rupees(closingStock) });
    if (osSalary > 0) adjs.push({ type: 'OUTSTANDING', account: 'Salaries', amount: Money.rupees(osSalary) });
    if (prepRent > 0) adjs.push({ type: 'PREPAID', account: 'Rent', amount: Money.rupees(prepRent) });
    if (depPct > 0) {
      adjs.push({
        type: 'DEPRECIATION',
        asset: 'Furniture',
        amount: Money.rupees(30000).mulRatio(BigInt(depPct), 100n, 'HALF_UP'),
      });
    }
    if (extraBad > 0) adjs.push({ type: 'BAD_DEBTS', amount: Money.rupees(extraBad) });
    if (pddPct > 0) adjs.push({ type: 'PROVISION_DOUBTFUL', ratePercent: BigInt(pddPct) });
    if (discPct > 0) adjs.push({ type: 'PROVISION_DISCOUNT', ratePercent: BigInt(discPct) });
    if (personalGoods > 0) adjs.push({ type: 'GOODS_PERSONAL_USE', amount: Money.rupees(personalGoods) });
    if (commPct > 0) adjs.push({ type: 'MANAGER_COMMISSION', ratePercent: BigInt(commPct), basis: commBasis });

    const out = finalAccounts(BASE_TB, adjs);
    const gp = out.trading.grossProfit;
    const np = out.profitLoss.netProfit;
    // Operating profit = Gross Profit - Operating expenses (all indirect expenses here are operating except manager commission if viewed separately; show exact GP -> NP waterfall)
    const totalIndirectExp = Money.sum(out.profitLoss.debit.map(d => d.amount));
    const bs = out.balanceSheet;

    return h(
      'div',
      { class: 'simlab-grid-2' },
      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Dual-Effect Year-End Adjustments · Instant Recalculation'),
        h('h3', {}, 'Toggle & Slide CBSE Adjustments'),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Closing Stock: ${R(Money.rupees(closingStock))} (Trading Cr + Current Asset)`),
          h('input', {
            type: 'range',
            min: '10000',
            max: '50000',
            step: '5000',
            value: String(closingStock),
            oninput: (e: Event) => {
              closingStock = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Outstanding Salaries: ${R(Money.rupees(osSalary))} (+P&L Dr + Liability)`),
          h('input', {
            type: 'range',
            min: '0',
            max: '8000',
            step: '500',
            value: String(osSalary),
            oninput: (e: Event) => {
              osSalary = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Prepaid Rent: ${R(Money.rupees(prepRent))} (−P&L Dr + Asset)`),
          h('input', {
            type: 'range',
            min: '0',
            max: '6000',
            step: '500',
            value: String(prepRent),
            oninput: (e: Event) => {
              prepRent = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Depreciation on Furniture: ${depPct}% (+P&L Dr − Furniture)`),
          h('input', {
            type: 'range',
            min: '0',
            max: '25',
            step: '5',
            value: String(depPct),
            oninput: (e: Event) => {
              depPct = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'div',
          { class: 'simlab-form-row' },
          h(
            'label',
            {},
            `Further Bad Debts (₹): ${extraBad} `,
            h('input', {
              type: 'range',
              min: '0',
              max: '5000',
              step: '1000',
              value: String(extraBad),
              oninput: (e: Event) => {
                extraBad = Number((e.target as HTMLInputElement).value);
                draw();
              },
            }),
          ),
          h(
            'label',
            {},
            `New PDD %: ${pddPct}% `,
            h('input', {
              type: 'range',
              min: '0',
              max: '10',
              step: '1',
              value: String(pddPct),
              oninput: (e: Event) => {
                pddPct = Number((e.target as HTMLInputElement).value);
                draw();
              },
            }),
          ),
          h(
            'label',
            {},
            `Discount on Debtors %: ${discPct}% `,
            h('input', {
              type: 'range',
              min: '0',
              max: '5',
              step: '1',
              value: String(discPct),
              oninput: (e: Event) => {
                discPct = Number((e.target as HTMLInputElement).value);
                draw();
              },
            }),
          ),
        ),
        h(
          'div',
          { class: 'simlab-form-row' },
          h(
            'label',
            {},
            `Goods for Personal Use (₹): ${personalGoods} `,
            h('input', {
              type: 'range',
              min: '0',
              max: '5000',
              step: '500',
              value: String(personalGoods),
              oninput: (e: Event) => {
                personalGoods = Number((e.target as HTMLInputElement).value);
                draw();
              },
            }),
          ),
          h(
            'label',
            {},
            `Manager Commission %: ${commPct}% `,
            h('input', {
              type: 'range',
              min: '0',
              max: '15',
              step: '5',
              value: String(commPct),
              oninput: (e: Event) => {
                commPct = Number((e.target as HTMLInputElement).value);
                draw();
              },
            }),
          ),
          h(
            'select',
            {
              'aria-label': 'Commission basis',
              onchange: (e: Event) => {
                commBasis = (e.target as HTMLSelectElement).value as 'BEFORE' | 'AFTER';
                draw();
              },
            },
            h('option', { value: 'BEFORE', selected: commBasis === 'BEFORE' }, 'Before charging'),
            h('option', { value: 'AFTER', selected: commBasis === 'AFTER' }, 'After charging'),
          ),
        ),
        h(
          'button',
          {
            type: 'button',
            'data-fa-adj-verify': '',
            onclick: () => {
              void ctx.completeMission(`Adjusted Final Accounts verified: GP ${R(gp)}, NP ${R(np)}, Balance Sheet balanced at ${R(bs.totalAssets)}.`);
            },
          },
          'Verify Adjusted Statements',
        ),
      ),

      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'GP → Net Profit Waterfall & Live Balance Sheet'),
        h(
          'div',
          { class: 'simlab-kpi-row' },
          h('div', { class: 'kpi-tile' }, h('small', {}, ctx.term('Gross Profit')), h('strong', {}, R(gp))),
          h('div', { class: 'kpi-tile' }, h('small', {}, 'Indirect Charges'), h('strong', {}, R(totalIndirectExp))),
          h('div', { class: 'kpi-tile' }, h('small', {}, ctx.term('Net Profit')), h('strong', {}, R(np))),
        ),
        renderBalanceBeamSvg({
          leftLabel: 'Balance Sheet Liabilities',
          leftAmount: R(bs.totalLiabilities),
          leftValue: Number(bs.totalLiabilities.paise),
          rightLabel: 'Balance Sheet Assets',
          rightAmount: R(bs.totalAssets),
          rightValue: Number(bs.totalAssets.paise),
          balanced: bs.balanced,
        }),
        h(
          'div',
          { class: 'simtable-wrap' },
          h(
            'table',
            { class: 'simtable' },
            h('caption', {}, `Balance Sheet (Balanced: ${bs.balanced ? 'YES ✓' : 'NO'})`),
            h('thead', {}, h('tr', {}, h('th', {}, 'Liabilities'), h('th', { class: 'num' }, '₹'), h('th', {}, 'Assets'), h('th', { class: 'num' }, '₹'))),
            h(
              'tbody',
              {},
              ...Array.from({ length: Math.max(bs.liabilities.length, bs.assets.length) }, (_, i) =>
                h(
                  'tr',
                  {},
                  h('td', {}, bs.liabilities[i]?.label ?? ''),
                  h('td', { class: 'num' }, bs.liabilities[i] ? R(bs.liabilities[i]!.amount) : ''),
                  h('td', {}, bs.assets[i]?.label ?? ''),
                  h('td', { class: 'num' }, bs.assets[i] ? R(bs.assets[i]!.amount) : ''),
                ),
              ),
            ),
            h('tfoot', {}, h('tr', {}, h('th', {}, 'Total Liabilities'), h('th', { class: 'num' }, R(bs.totalLiabilities)), h('th', {}, 'Total Assets'), h('th', { class: 'num' }, R(bs.totalAssets)))),
          ),
        ),
      ),
    );
  }

  function renderSoaView(): HTMLElement {
    const closeCap = statementOfAffairs({
      assets: [Money.rupees(soaAssets)],
      liabilities: [Money.rupees(soaLiabs)],
    });
    const profit = profitByStatementOfAffairs({
      openingCapital: Money.rupees(soaOpenCap),
      closingCapital: closeCap,
      drawings: Money.rupees(soaDrawings),
      additionalCapital: Money.rupees(soaFresh),
    });

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Incomplete Records · Statement of Affairs Method Only (`XI.3.incomplete`)'),
      h('h3', {}, `Closing Capital: ${R(closeCap)} · ${profit.isNegative() ? 'Loss' : 'Profit'} for Year: ${R(profit.abs())}`),
      h(
        'div',
        { class: 'simlab-form-row' },
        h(
          'label',
          {},
          `Opening Capital: ₹${soaOpenCap.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '50000',
            max: '300000',
            step: '10000',
            value: String(soaOpenCap),
            oninput: (e: Event) => {
              soaOpenCap = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Closing Assets: ₹${soaAssets.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '150000',
            max: '500000',
            step: '10000',
            value: String(soaAssets),
            oninput: (e: Event) => {
              soaAssets = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Closing Liabilities: ₹${soaLiabs.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '20000',
            max: '250000',
            step: '10000',
            value: String(soaLiabs),
            oninput: (e: Event) => {
              soaLiabs = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Drawings (+): ₹${soaDrawings.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '0',
            max: '80000',
            step: '5000',
            value: String(soaDrawings),
            oninput: (e: Event) => {
              soaDrawings = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Fresh Capital (−): ₹${soaFresh.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '0',
            max: '80000',
            step: '5000',
            value: String(soaFresh),
            oninput: (e: Event) => {
              soaFresh = Number((e.target as HTMLInputElement).value);
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
          h('caption', {}, 'Statement of Profit or Loss (Statement of Affairs Method)'),
          h(
            'tbody',
            {},
            h('tr', {}, h('td', {}, 'Closing Capital (Closing Assets − Closing Liabilities)'), h('td', { class: 'num' }, R(closeCap))),
            h('tr', {}, h('td', {}, 'Add: Drawings made during the year'), h('td', { class: 'num' }, R(Money.rupees(soaDrawings)))),
            h('tr', {}, h('td', {}, 'Less: Additional Capital introduced'), h('td', { class: 'num' }, R(Money.rupees(soaFresh)))),
            h('tr', {}, h('td', {}, 'Less: Opening Capital'), h('td', { class: 'num' }, R(Money.rupees(soaOpenCap)))),
          ),
          h('tfoot', {}, h('tr', {}, h('th', {}, profit.isNegative() ? 'Net Loss for the year' : 'Net Profit for the year'), h('th', { class: 'num' }, R(profit.abs())))),
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          onclick: () => {
            void ctx.completeMission(`Statement of Affairs verified: Closing Capital ${R(closeCap)}, Profit ${R(profit)}.`);
          },
        },
        'Verify Statement of Affairs Mission',
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
              class: tab === 'BUILDER' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'BUILDER';
                draw();
              },
            },
            '1. Statement Sorter (Trading / P&L / BS)',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'ADJUSTMENTS' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'ADJUSTMENTS';
                draw();
              },
            },
            '2. Live Adjustments & Waterfall',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'SOA' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'SOA';
                draw();
              },
            },
            '3. Incomplete Records (Statement of Affairs)',
          ),
        ),
        tab === 'BUILDER' ? renderBuilderSorter() : tab === 'ADJUSTMENTS' ? renderAdjustmentsView() : renderSoaView(),
      ),
    );
  }

  draw();
}
