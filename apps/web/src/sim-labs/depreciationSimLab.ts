/**
 * Experience D — Depreciation & Asset Disposal Lab (`XI.2.depreciation`)
 * Powered by `depreciationSchedule`, `depreciationEntry`, `disposeAsset`, and `pct` in `packages/engine`.
 * Strict CBSE 2026–27 scope: SLM & WDV, Provision for Depreciation, Disposal (excluding change of method).
 */
import { Money, depreciationEntry, depreciationSchedule, disposeAsset, pct } from '../../../../packages/engine/src';
import { h, mount, svg } from '../dom';
import type { SimShellContext } from './shell';

const R = (m: Money) => m.format();

export function renderDepreciationLab(stage: HTMLElement, ctx: SimShellContext): void {
  let costRupees = 100000;
  let scrapRupees = 0;
  let ratePct = 10;
  let years = 4;
  let firstYearMonths = 12;
  let activeMethod: 'WDV' | 'SLM' = 'WDV';
  let recording: 'ASSET_ACCOUNT' | 'PROVISION' = 'ASSET_ACCOUNT';
  let simulateSale = false;
  let saleRupees = 70000;

  const loadTier = () => {
    const t = ctx.getDifficulty();
    if (t === 'BEGINNER') {
      costRupees = 100000;
      scrapRupees = 0;
      ratePct = 10;
      years = 4;
      firstYearMonths = 12;
      activeMethod = 'WDV';
      recording = 'ASSET_ACCOUNT';
      simulateSale = false;
    } else if (t === 'PRACTICE') {
      costRupees = 120000;
      scrapRupees = 0;
      ratePct = 10;
      years = 3;
      firstYearMonths = 6;
      activeMethod = 'WDV';
      recording = 'PROVISION';
      simulateSale = false;
    } else if (t === 'CHALLENGE') {
      costRupees = 100000;
      scrapRupees = 0;
      ratePct = 10;
      years = 3;
      firstYearMonths = 12;
      activeMethod = 'WDV';
      recording = 'ASSET_ACCOUNT';
      simulateSale = true;
      saleRupees = 70000;
    } else {
      costRupees = 200000;
      scrapRupees = 20000;
      ratePct = 20;
      years = 6;
      firstYearMonths = 12;
      activeMethod = 'SLM';
      recording = 'PROVISION';
      simulateSale = true;
      saleRupees = 25000;
    }
  };
  loadTier();
  ctx.onChange(() => {
    loadTier();
    draw();
  });

  function renderDualCurveChart(cost: Money, slmRows: readonly { year: number; closing: Money }[], wdvRows: readonly { year: number; closing: Money }[]): SVGElement {
    const W = 540;
    const H = 220;
    const padL = 62;
    const padR = 24;
    const padT = 22;
    const padB = 34;
    const maxV = Math.max(1, Number(cost.paise) / 100);
    const n = slmRows.length;
    const xOf = (yr: number) => padL + (yr / Math.max(1, n)) * (W - padL - padR);
    const yOf = (m: Money) => padT + (1 - Number(m.paise) / 100 / maxV) * (H - padT - padB);

    const pts = (rows: readonly { year: number; closing: Money }[]) =>
      [`${xOf(0).toFixed(1)},${yOf(cost).toFixed(1)}`].concat(rows.map(r => `${xOf(r.year).toFixed(1)},${yOf(r.closing).toFixed(1)}`)).join(' ');

    return svg(
      'svg',
      {
        viewBox: `0 0 ${W} ${H}`,
        class: 'simlab-chart-svg',
        role: 'img',
        'aria-label': `Book value comparison curve across ${n} years for SLM and WDV`,
      },
      svg('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line)', 'stroke-width': 1.5 }),
      svg('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line)', 'stroke-width': 1.5 }),
      svg('text', { x: padL - 6, y: padT + 4, 'text-anchor': 'end', class: 'simlab-svg-sub' }, `₹${(maxV / 1000).toFixed(0)}k`),
      svg('text', { x: padL - 6, y: H - padB, 'text-anchor': 'end', class: 'simlab-svg-sub' }, '₹0'),
      svg('polyline', {
        fill: 'none',
        stroke: 'var(--accent)',
        'stroke-width': activeMethod === 'SLM' ? 3.5 : 2,
        'stroke-dasharray': activeMethod === 'SLM' ? '' : '5 4',
        points: pts(slmRows),
      }),
      svg('polyline', {
        fill: 'none',
        stroke: 'var(--brand)',
        'stroke-width': activeMethod === 'WDV' ? 3.5 : 2,
        points: pts(wdvRows),
      }),
      ...slmRows.map(r =>
        svg(
          'g',
          {},
          svg('circle', { cx: xOf(r.year), cy: yOf(r.closing), r: 4, fill: 'var(--accent)' }),
          svg('text', { x: xOf(r.year), y: H - 12, 'text-anchor': 'middle', class: 'simlab-svg-sub' }, `Y${r.year}`),
        ),
      ),
      ...wdvRows.map(r => svg('circle', { cx: xOf(r.year), cy: yOf(r.closing), r: 4.5, fill: 'var(--brand)' })),
      // Legend
      svg('rect', { x: W - 190, y: 12, width: 12, height: 4, fill: 'var(--brand)' }),
      svg('text', { x: W - 172, y: 17, class: 'simlab-svg-sub' }, 'WDV Book Value'),
      svg('rect', { x: W - 190, y: 28, width: 12, height: 4, fill: 'var(--accent)' }),
      svg('text', { x: W - 172, y: 33, class: 'simlab-svg-sub' }, 'SLM Book Value'),
    );
  }

  function draw() {
    const cost = Money.rupees(costRupees);
    const scrap = Money.rupees(Math.min(scrapRupees, costRupees));
    const rate = pct(BigInt(ratePct));

    const slmRows = depreciationSchedule({
      cost,
      scrap,
      method: 'SLM',
      rate,
      years,
      firstYearMonths,
    });
    const wdvRows = depreciationSchedule({
      cost,
      scrap,
      method: 'WDV',
      rate,
      years,
      firstYearMonths,
    });

    const chosenRows = activeMethod === 'SLM' ? slmRows : wdvRows;
    const lastRow = chosenRows[chosenRows.length - 1]!;
    const accDep = cost.sub(lastRow.closing);
    const year1Entry = depreciationEntry('Machinery', chosenRows[0]!.depreciation, recording);
    const disposal = simulateSale
      ? disposeAsset({
          name: 'Machinery',
          cost,
          accumulated: accDep,
          saleProceeds: Money.rupees(saleRupees),
          method: recording,
        })
      : null;

    mount(
      stage,
      h(
        'div',
        { class: 'simlab-grid-2' },
        // Left: Interactive Sliders & Controls
        h(
          'section',
          { class: 'panel simlab-card' },
          h('p', { class: 'eyebrow' }, 'Asset & Method Controls · Instant Recalculation'),
          h('h3', {}, `${ctx.term(activeMethod === 'WDV' ? 'Written Down Value (WDV)' : 'Straight Line (SLM)')}`),
          h(
            'div',
            { class: 'modes', role: 'group', 'aria-label': 'Depreciation method' },
            h(
              'button',
              {
                type: 'button',
                class: activeMethod === 'WDV' ? 'on' : 'secondary',
                'data-dep-method': 'WDV',
                onclick: () => {
                  activeMethod = 'WDV';
                  draw();
                },
              },
              'WDV (Diminishing Balance)',
            ),
            h(
              'button',
              {
                type: 'button',
                class: activeMethod === 'SLM' ? 'on' : 'secondary',
                'data-dep-method': 'SLM',
                onclick: () => {
                  activeMethod = 'SLM';
                  draw();
                },
              },
              'SLM (Original Cost)',
            ),
          ),
          h(
            'label',
            { class: 'simlab-slider-row' },
            h('span', {}, `Asset Cost: ${R(cost)}`),
            h('input', {
              type: 'range',
              min: '40000',
              max: '300000',
              step: '10000',
              value: String(costRupees),
              oninput: (e: Event) => {
                costRupees = Number((e.target as HTMLInputElement).value);
                if (scrapRupees > costRupees - 10000) scrapRupees = Math.max(0, costRupees - 10000);
                draw();
              },
            }),
          ),
          h(
            'label',
            { class: 'simlab-slider-row' },
            h('span', {}, `Residual / Scrap Value: ${R(scrap)}`),
            h('input', {
              type: 'range',
              min: '0',
              max: '60000',
              step: '5000',
              value: String(scrapRupees),
              oninput: (e: Event) => {
                scrapRupees = Math.min(costRupees, Number((e.target as HTMLInputElement).value));
                draw();
              },
            }),
          ),
          h(
            'label',
            { class: 'simlab-slider-row' },
            h('span', {}, `Depreciation Rate: ${ratePct}% p.a.`),
            h('input', {
              type: 'range',
              min: '5',
              max: '40',
              step: '5',
              value: String(ratePct),
              oninput: (e: Event) => {
                ratePct = Number((e.target as HTMLInputElement).value);
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
              `Horizon: ${years} years `,
              h('input', {
                type: 'range',
                min: '1',
                max: '8',
                step: '1',
                value: String(years),
                oninput: (e: Event) => {
                  years = Number((e.target as HTMLInputElement).value);
                  draw();
                },
              }),
            ),
            h(
              'label',
              {},
              `First-Year Months: ${firstYearMonths}m `,
              h('input', {
                type: 'range',
                min: '1',
                max: '12',
                step: '1',
                value: String(firstYearMonths),
                oninput: (e: Event) => {
                  firstYearMonths = Number((e.target as HTMLInputElement).value);
                  draw();
                },
              }),
            ),
          ),
          h(
            'label',
            {},
            'Accounting Treatment ',
            h(
              'select',
              {
                onchange: (e: Event) => {
                  recording = (e.target as HTMLSelectElement).value as 'ASSET_ACCOUNT' | 'PROVISION';
                  draw();
                },
              },
              h('option', { value: 'ASSET_ACCOUNT', selected: recording === 'ASSET_ACCOUNT' }, 'Charge directly to Machinery A/c'),
              h('option', { value: 'PROVISION', selected: recording === 'PROVISION' }, 'Accumulate in Provision for Depreciation A/c'),
            ),
          ),
          h(
            'div',
            { class: 'simlab-whatif-box' },
            h(
              'label',
              { class: 'simlab-check-row' },
              h('input', {
                type: 'checkbox',
                checked: simulateSale,
                'data-dep-sale-toggle': '',
                onchange: (e: Event) => {
                  simulateSale = (e.target as HTMLInputElement).checked;
                  draw();
                },
              }),
              ` Simulate Asset Disposal at end of Year ${years}`,
            ),
            simulateSale &&
              h(
                'label',
                { class: 'simlab-slider-row' },
                h('span', {}, `Sale Proceeds: ${R(Money.rupees(saleRupees))}`),
                h('input', {
                  type: 'range',
                  min: '0',
                  max: String(costRupees),
                  step: '2500',
                  value: String(saleRupees),
                  oninput: (e: Event) => {
                    saleRupees = Number((e.target as HTMLInputElement).value);
                    draw();
                  },
                }),
              ),
          ),
          h(
            'div',
            { class: 'simlab-action-row' },
            h(
              'button',
              {
                type: 'button',
                'data-dep-verify': '',
                onclick: () => {
                  void ctx.completeMission(
                    `${activeMethod} schedule verified: Year-${years} book value ${R(lastRow.closing)}${disposal ? `, disposal ${disposal.profitOrLoss.isNegative() ? 'loss' : 'gain'} ${R(disposal.profitOrLoss.abs())}` : ''}.`,
                  );
                },
              },
              'Verify Schedule & Disposal Mission',
            ),
          ),
        ),

        // Right: Animated Dual Curve + Side-by-Side Schedule + Disposal Journal
        h(
          'section',
          { class: 'panel simlab-card' },
          h('p', { class: 'eyebrow' }, 'SLM vs WDV Visual Curve & Year-wise Schedule'),
          h('h3', {}, `Closing Book Value after Year ${years}: ${R(lastRow.closing)}`),
          renderDualCurveChart(cost, slmRows, wdvRows),
          h(
            'div',
            { class: 'simtable-wrap' },
            h(
              'table',
              { class: 'simtable' },
              h(
                'thead',
                {},
                h(
                  'tr',
                  {},
                  h('th', {}, 'Year'),
                  h('th', { class: 'num' }, `${activeMethod} Opening`),
                  h('th', { class: 'num' }, `${activeMethod} Dep.`),
                  h('th', { class: 'num' }, `${activeMethod} Closing`),
                  h('th', { class: 'num' }, `${activeMethod === 'WDV' ? 'SLM' : 'WDV'} Closing`),
                ),
              ),
              h(
                'tbody',
                {},
                ...chosenRows.map((r, i) => {
                  const other = (activeMethod === 'WDV' ? slmRows : wdvRows)[i]!;
                  return h(
                    'tr',
                    {},
                    h('td', {}, `Year ${r.year}${r.year === 1 && firstYearMonths < 12 ? ` (${firstYearMonths}m)` : ''}`),
                    h('td', { class: 'num' }, R(r.opening)),
                    h('td', { class: 'num' }, R(r.depreciation)),
                    h('td', { class: 'num' }, h('b', {}, R(r.closing))),
                    h('td', { class: 'num' }, R(other.closing)),
                  );
                }),
              ),
              h(
                'tfoot',
                {},
                h('tr', {}, h('th', {}, 'Accumulated Depreciation'), h('th', {}, ''), h('th', { class: 'num' }, R(accDep)), h('th', { class: 'num' }, R(lastRow.closing)), h('th', {}, '')),
              ),
            ),
          ),
          h(
            'div',
            { class: 'simlab-posted-entry' },
            h('div', { class: 'je-meta' }, h('b', {}, 'Year 1 Depreciation Entry'), ` — ${year1Entry.narration}`),
            ...year1Entry.lines.map(l =>
              h('div', { class: 'je-line ' + l.side.toLowerCase() }, h('span', {}, l.side === 'DR' ? `${l.account} ... Dr.` : `To ${l.account}`), h('strong', {}, R(l.amount))),
            ),
          ),
          disposal &&
            h(
              'div',
              { class: 'note ' + (disposal.profitOrLoss.isNegative() ? 'warn' : 'good') },
              h(
                'p',
                {},
                h('b', {}, 'Asset Disposal Summary: '),
                `Book Value ${R(disposal.bookValue)} vs Sale Price ${R(Money.rupees(saleRupees))} → `,
                h(
                  'strong',
                  {},
                  disposal.profitOrLoss.isZero()
                    ? 'No Profit, No Loss'
                    : disposal.profitOrLoss.isNegative()
                      ? `Loss on Sale ${R(disposal.profitOrLoss.abs())}`
                      : `Profit on Sale ${R(disposal.profitOrLoss)}`,
                ),
              ),
            ),
        ),
      ),
    );
  }

  draw();
}
