/**
 * Experience G — Partnership Lifecycle Simulator (`XII.1.*`)
 * Powered by `appropriate`, `averageProfit`, `goodwillAverageProfit`, `goodwillSuperProfit`,
 * `goodwillCapitalisation`, `admission`, `exitSettlement`, `gainingRatioOnExit`, and `dissolve` in `packages/engine`.
 */
import {
  Fraction,
  Money,
  admission,
  appropriate,
  averageProfit,
  dissolve,
  exitSettlement,
  gainingRatioOnExit,
  goodwillAverageProfit,
  goodwillCapitalisation,
  goodwillSuperProfit,
} from '../../../../packages/engine/src';
import { h, mount } from '../dom';
import type { SimShellContext } from './shell';

const R = (m: Money) => m.format();

const PARTNERS_3 = [
  { id: 'A', name: 'A' },
  { id: 'B', name: 'B' },
  { id: 'C', name: 'C' },
] as const;

export function renderPartnershipLab(stage: HTMLElement, ctx: SimShellContext): void {
  let tab: 'APPROPRIATION' | 'ADMISSION_GW' | 'RETIREMENT' | 'DISSOLUTION' = 'APPROPRIATION';

  // Appropriation state
  let netProfit = 120000;
  let iocRate = 10;
  let salB = 18000;
  let guaranteeC = 25000;

  // Goodwill + Admission state
  let avgProfRupees = 135000;
  let ceRupees = 800000;
  const nrrPct = 10;
  const ypYears = 3;
  let newShareDen = 4; // 1/4, 1/5, 1/3
  let sacrificeMode: 'PROPORTIONAL' | 'ALL_BY_A' = 'PROPORTIONAL';

  // Retirement state
  let firmGwRet = 90000;
  let revalRet = 18000;
  const resRet = 24000;

  // Dissolution state
  let assetRealised = 175000;
  let liabPaid = 38000;
  let dissExpense = 4000;

  const syncTier = () => {
    const t = ctx.getDifficulty();
    if (t === 'BEGINNER') tab = 'APPROPRIATION';
    else if (t === 'PRACTICE') tab = 'ADMISSION_GW';
    else if (t === 'CHALLENGE') tab = 'RETIREMENT';
    else tab = 'DISSOLUTION';
  };
  syncTier();
  ctx.onChange(() => {
    syncTier();
    draw();
  });

  function renderRatioStrip(label: string, shares: Record<string, Fraction>): HTMLElement {
    const colors: Record<string, string> = { A: 'var(--brand)', B: 'var(--accent)', C: 'var(--ok)' };
    return h(
      'div',
      { class: 'simlab-ratio-strip' },
      h('small', {}, label),
      h(
        'div',
        { class: 'ratio-bar-track' },
        ...Object.entries(shares)
          .filter(([, f]) => f.isPositive())
          .map(([id, f]) => {
            const pctVal = Number((f.num * 10000n) / f.den) / 100;
            return h(
              'span',
              {
                class: 'ratio-seg',
                style: `width:${pctVal.toFixed(1)}%;background:${colors[id] ?? 'var(--brand)'}`,
              },
              `${id}: ${f.toString()}`,
            );
          }),
      ),
    );
  }

  function renderAppropriation(): HTMLElement {
    const [sA, sB, sC] = Fraction.fromRatio([3, 2, 1]);
    const shares = { A: sA!, B: sB!, C: sC! };
    const app = appropriate({
      partners: PARTNERS_3,
      netProfit: Money.rupees(netProfit),
      shares,
      interestOnCapital: {
        ratePercent: BigInt(iocRate),
        capital: { A: Money.rupees(300000), B: Money.rupees(200000), C: Money.rupees(100000) },
      },
      salary: { A: Money.ZERO, B: Money.rupees(salB), C: Money.ZERO },
      guarantee: guaranteeC > 0 ? { partner: 'C', minimum: Money.rupees(guaranteeC) } : undefined,
    });

    return h(
      'div',
      { class: 'simlab-grid-2' },
      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'P&L Appropriation & Minimum Profit Guarantee (`XII.1.appropriation`)'),
        h('h3', {}, 'Adjust Net Profit, IoC, Salary & Guarantee'),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Net Profit before Appropriations: ${R(Money.rupees(netProfit))}`),
          h('input', {
            type: 'range',
            min: '15000',
            max: '200000',
            step: '5000',
            value: String(netProfit),
            oninput: (e: Event) => {
              netProfit = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Interest on Capital Rate: ${iocRate}% p.a. (Caps ₹3L / ₹2L / ₹1L)`),
          h('input', {
            type: 'range',
            min: '0',
            max: '15',
            step: '1',
            value: String(iocRate),
            oninput: (e: Event) => {
              iocRate = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Salary to Partner B: ${R(Money.rupees(salB))}`),
          h('input', {
            type: 'range',
            min: '0',
            max: '36000',
            step: '3000',
            value: String(salB),
            oninput: (e: Event) => {
              salB = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Minimum Profit Guaranteed to C: ${R(Money.rupees(guaranteeC))}`),
          h('input', {
            type: 'range',
            min: '0',
            max: '45000',
            step: '5000',
            value: String(guaranteeC),
            oninput: (e: Event) => {
              guaranteeC = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        app.scaledDown &&
          h('div', { class: 'note warn' }, 'Insufficient Profit Rule Active: Available profit is smaller than IoC + Salary, so appropriations are scaled in the ratio of entitlements due!'),
        h(
          'button',
          {
            type: 'button',
            'data-part-verify': '',
            onclick: () => {
              void ctx.completeMission(`P&L Appropriation verified: A ${R(app.totalPerPartner.A!)}, B ${R(app.totalPerPartner.B!)}, C ${R(app.totalPerPartner.C!)}.`);
            },
          },
          'Verify Appropriation & Guarantee',
        ),
      ),

      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Partners’ Entitlement Breakdown'),
        renderRatioStrip('Agreed PSR (3 : 2 : 1)', shares),
        h(
          'div',
          { class: 'simtable-wrap' },
          h(
            'table',
            { class: 'simtable' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Appropriation Head'), h('th', { class: 'num' }, 'A'), h('th', { class: 'num' }, 'B'), h('th', { class: 'num' }, 'C'))),
            h(
              'tbody',
              {},
              h(
                'tr',
                {},
                h('td', {}, 'Interest on Capital'),
                h('td', { class: 'num' }, R(app.interestOnCapital.A!)),
                h('td', { class: 'num' }, R(app.interestOnCapital.B!)),
                h('td', { class: 'num' }, R(app.interestOnCapital.C!)),
              ),
              h('tr', {}, h('td', {}, 'Salary'), h('td', { class: 'num' }, R(app.salary.A!)), h('td', { class: 'num' }, R(app.salary.B!)), h('td', { class: 'num' }, R(app.salary.C!))),
              h(
                'tr',
                {},
                h('td', {}, 'Residual Profit Share'),
                h('td', { class: 'num' }, R(app.shareOfResidual.A!)),
                h('td', { class: 'num' }, R(app.shareOfResidual.B!)),
                h('td', { class: 'num' }, R(app.shareOfResidual.C!)),
              ),
              h(
                'tr',
                {},
                h('td', {}, 'Guarantee Adjustment'),
                h('td', { class: 'num' }, R(app.guaranteeBorne.A!.neg())),
                h('td', { class: 'num' }, R(app.guaranteeBorne.B!.neg())),
                h('td', { class: 'num' }, R(app.guaranteeBorne.C!.neg())),
              ),
            ),
            h(
              'tfoot',
              {},
              h(
                'tr',
                {},
                h('th', {}, 'Total Credited'),
                h('th', { class: 'num' }, R(app.totalPerPartner.A!)),
                h('th', { class: 'num' }, R(app.totalPerPartner.B!)),
                h('th', { class: 'num' }, R(app.totalPerPartner.C!)),
              ),
            ),
          ),
        ),
      ),
    );
  }

  function renderAdmissionGw(): HTMLElement {
    const avg = averageProfit([Money.rupees(avgProfRupees)]);
    const gwAvg = goodwillAverageProfit(avg, BigInt(ypYears));
    const gwSuper = goodwillSuperProfit(avg, Money.rupees(ceRupees), BigInt(nrrPct), BigInt(ypYears));
    const gwCap = goodwillCapitalisation(avg, BigInt(nrrPct), Money.rupees(ceRupees));

    const [oA, oB] = Fraction.fromRatio([3, 2]);
    const oldShares = { A: oA!, B: oB! };
    const newShare = Fraction.of(1, newShareDen);
    const adm = admission({
      partners: [
        { id: 'A', name: 'A' },
        { id: 'B', name: 'B' },
      ],
      oldShares,
      capitals: { A: Money.rupees(300000), B: Money.rupees(200000) },
      newPartner: { id: 'C', name: 'C', share: newShare },
      ...(sacrificeMode === 'ALL_BY_A' ? { sacrifice: { A: newShare, B: Fraction.ZERO } } : {}),
      goodwillOfFirm: gwSuper.goodwill.isPositive() ? gwSuper.goodwill : gwAvg,
      revaluation: Money.rupees(20000),
      reserves: Money.rupees(30000),
      newPartnerCapitalFractionOfOld: Fraction.of(1, 4),
    });

    return h(
      'div',
      { class: 'simlab-grid-2' },
      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Goodwill (3 Prescribed Methods) & Admission (`XII.1.goodwill`, `XII.1.admission`)'),
        h('h3', {}, 'Value Goodwill & Admit Partner C (per AS 26)'),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Adjusted Average Profit: ${R(avg)}`),
          h('input', {
            type: 'range',
            min: '90000',
            max: '220000',
            step: '5000',
            value: String(avgProfRupees),
            oninput: (e: Event) => {
              avgProfRupees = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Capital Employed: ${R(Money.rupees(ceRupees))} · NRR ${nrrPct}% · ${ypYears} yrs purchase`),
          h('input', {
            type: 'range',
            min: '500000',
            max: '1200000',
            step: '50000',
            value: String(ceRupees),
            oninput: (e: Event) => {
              ceRupees = Number((e.target as HTMLInputElement).value);
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
            'New Partner C Share ',
            h(
              'select',
              {
                onchange: (e: Event) => {
                  newShareDen = Number((e.target as HTMLSelectElement).value);
                  draw();
                },
              },
              h('option', { value: '4', selected: newShareDen === 4 }, '1/4 share'),
              h('option', { value: '5', selected: newShareDen === 5 }, '1/5 share'),
              h('option', { value: '3', selected: newShareDen === 3 }, '1/3 share'),
            ),
          ),
          h(
            'label',
            {},
            'Sacrifice Pattern ',
            h(
              'select',
              {
                onchange: (e: Event) => {
                  sacrificeMode = (e.target as HTMLSelectElement).value as 'PROPORTIONAL' | 'ALL_BY_A';
                  draw();
                },
              },
              h('option', { value: 'PROPORTIONAL', selected: sacrificeMode === 'PROPORTIONAL' }, 'In Old Ratio (3:2)'),
              h('option', { value: 'ALL_BY_A', selected: sacrificeMode === 'ALL_BY_A' }, 'Wholly Sacrificed by A'),
            ),
          ),
        ),
        h(
          'div',
          { class: 'simlab-kpi-row' },
          h('div', { class: 'kpi-tile' }, h('small', {}, 'Average Profit GW'), h('strong', {}, R(gwAvg))),
          h('div', { class: 'kpi-tile' }, h('small', {}, 'Super Profit GW'), h('strong', {}, R(gwSuper.goodwill))),
          h('div', { class: 'kpi-tile' }, h('small', {}, 'Capitalisation GW'), h('strong', {}, R(gwCap.goodwill))),
        ),
        h(
          'button',
          {
            type: 'button',
            onclick: () => {
              void ctx.completeMission(`Admission & Goodwill verified: C brings Premium ${R(adm.premium)} and Capital ${R(adm.adjustedCapital.C!)}.`);
            },
          },
          'Verify Goodwill & Admission',
        ),
      ),

      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Sacrificing Ratio & Reconstituted Capital Accounts'),
        renderRatioStrip('Old PSR (A : B = 3 : 2)', oldShares),
        renderRatioStrip('New PSR after C’s Admission', adm.newShares),
        h(
          'div',
          { class: 'simtable-wrap' },
          h(
            'table',
            { class: 'simtable' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Partner'), h('th', {}, 'Sacrifice Share'), h('th', { class: 'num' }, 'Premium Credited'), h('th', { class: 'num' }, 'Closing Capital'))),
            h(
              'tbody',
              {},
              h(
                'tr',
                {},
                h('td', {}, 'Partner A'),
                h('td', {}, adm.sacrificeRatio.A!.toString()),
                h('td', { class: 'num' }, R(adm.premiumShare.A!)),
                h('td', { class: 'num' }, R(adm.adjustedCapital.A!)),
              ),
              h(
                'tr',
                {},
                h('td', {}, 'Partner B'),
                h('td', {}, adm.sacrificeRatio.B!.toString()),
                h('td', { class: 'num' }, R(adm.premiumShare.B!)),
                h('td', { class: 'num' }, R(adm.adjustedCapital.B!)),
              ),
              h(
                'tr',
                {},
                h('td', {}, 'Partner C (New)'),
                h('td', {}, 'Gains ' + newShare.toString()),
                h('td', { class: 'num' }, 'Brings ' + R(adm.premium)),
                h('td', { class: 'num' }, R(adm.newPartnerCapital)),
              ),
            ),
          ),
        ),
      ),
    );
  }

  function renderRetirement(): HTMLElement {
    const [oA, oB, oC] = Fraction.fromRatio([3, 2, 1]);
    const oldShares = { A: oA!, B: oB!, C: oC! };
    const [nA, nC] = Fraction.fromRatio([3, 2]);
    const newShares = { A: nA!, C: nC! };
    const gain = gainingRatioOnExit(oldShares, newShares, 'B');
    const ex = exitSettlement({
      oldShares,
      newShares,
      exiting: 'B',
      capitals: { A: Money.rupees(250000), B: Money.rupees(180000), C: Money.rupees(120000) },
      goodwillOfFirm: Money.rupees(firmGwRet),
      revaluation: Money.rupees(revalRet),
      reserves: Money.rupees(resRet),
    });

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Retirement / Death Settlement (`XII.1.retirement`, `XII.1.death`)'),
      h('h3', {}, `Partner B Retires · Amount Transferred to B’s Loan A/c: ${R(ex.amountDue)}`),
      renderRatioStrip('Gaining Shares of Continuing Partners (New − Old)', gain),
      h(
        'div',
        { class: 'simlab-form-row' },
        h(
          'label',
          {},
          `Firm Goodwill: ${R(Money.rupees(firmGwRet))} `,
          h('input', {
            type: 'range',
            min: '30000',
            max: '180000',
            step: '15000',
            value: String(firmGwRet),
            oninput: (e: Event) => {
              firmGwRet = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Revaluation Profit: ${R(Money.rupees(revalRet))} `,
          h('input', {
            type: 'range',
            min: '0',
            max: '60000',
            step: '6000',
            value: String(revalRet),
            oninput: (e: Event) => {
              revalRet = Number((e.target as HTMLInputElement).value);
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
          h('thead', {}, h('tr', {}, h('th', {}, 'Partner'), h('th', { class: 'num' }, 'Goodwill Adjustment'), h('th', { class: 'num' }, 'Adjusted Closing Capital / Loan'))),
          h(
            'tbody',
            {},
            ...(['A', 'B', 'C'] as const).map(p =>
              h(
                'tr',
                {},
                h('td', {}, `Partner ${p}${p === 'B' ? ' (Retiring → Loan A/c)' : ''}`),
                h('td', { class: 'num' }, R(ex.goodwillCompensation[p]!)),
                h('td', { class: 'num' }, R(ex.closingCapital[p]!)),
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
            void ctx.completeMission(`Retirement settlement verified: B’s Loan A/c credited with ${R(ex.amountDue)} via Gaining Ratio.`);
          },
        },
        'Verify Retirement Settlement',
      ),
    );
  }

  function renderDissolution(): HTMLElement {
    const [sA, sB] = Fraction.fromRatio([3, 2]);
    const d = dissolve({
      partners: [
        { id: 'A', name: 'A' },
        { id: 'B', name: 'B' },
      ],
      shares: { A: sA!, B: sB! },
      capitals: { A: Money.rupees(120000), B: Money.rupees(80000) },
      reserves: Money.rupees(10000),
      cashAtStart: Money.rupees(30000),
      assets: [{ name: 'Sundry Assets', book: Money.rupees(220000), realised: Money.rupees(assetRealised), tangible: true }],
      liabilities: [{ name: 'Sundry Creditors', book: Money.rupees(40000), paid: Money.rupees(liabPaid) }],
      expenses: [{ amount: Money.rupees(dissExpense), paidBy: 'FIRM', borneBy: 'FIRM' }],
    });

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Dissolution of Partnership Firm · Realisation A/c (`XII.1.dissolution`)'),
      h('h3', {}, `Realisation ${d.profitOnRealisation.isNegative() ? 'Loss' : 'Profit'}: ${R(d.profitOnRealisation.abs())} · Final Cash Residual: ${R(d.cashEnd)}`),
      h(
        'div',
        { class: 'simlab-form-row' },
        h(
          'label',
          {},
          `Assets Realised (Book ₹2,20,000): ${R(Money.rupees(assetRealised))} `,
          h('input', {
            type: 'range',
            min: '120000',
            max: '260000',
            step: '5000',
            value: String(assetRealised),
            oninput: (e: Event) => {
              assetRealised = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Creditors Paid (Book ₹40,000): ${R(Money.rupees(liabPaid))} `,
          h('input', {
            type: 'range',
            min: '30000',
            max: '45000',
            step: '1000',
            value: String(liabPaid),
            oninput: (e: Event) => {
              liabPaid = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Realisation Expenses: ${R(Money.rupees(dissExpense))} `,
          h('input', {
            type: 'range',
            min: '0',
            max: '15000',
            step: '1000',
            value: String(dissExpense),
            oninput: (e: Event) => {
              dissExpense = Number((e.target as HTMLInputElement).value);
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
          h('thead', {}, h('tr', {}, h('th', {}, 'Settlement Summary'), h('th', { class: 'num' }, 'Partner A'), h('th', { class: 'num' }, 'Partner B'))),
          h(
            'tbody',
            {},
            h('tr', {}, h('td', {}, 'Opening Capital'), h('td', { class: 'num' }, R(d.capitalBefore.A!)), h('td', { class: 'num' }, R(d.capitalBefore.B!))),
            h('tr', {}, h('td', {}, 'Share of Realisation Gain / (Loss)'), h('td', { class: 'num' }, R(d.profitShare.A!)), h('td', { class: 'num' }, R(d.profitShare.B!))),
            h('tr', {}, h('td', {}, 'Final Cash Paid to Partner'), h('td', { class: 'num' }, R(d.finalCapital.A!)), h('td', { class: 'num' }, R(d.finalCapital.B!))),
          ),
        ),
      ),
      h('div', { class: 'note good' }, `Self-Balancing Proof: Closing Cash after paying partners = ${R(d.cashEnd)} (Bank A/c closes to exact zero!).`),
      h(
        'button',
        {
          type: 'button',
          onclick: () => {
            void ctx.completeMission(`Dissolution Realisation settled cleanly: Cash End = ${R(d.cashEnd)}, A ${R(d.finalCapital.A!)}, B ${R(d.finalCapital.B!)}.`);
          },
        },
        'Verify Dissolution Settlement',
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
              class: tab === 'APPROPRIATION' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'APPROPRIATION';
                draw();
              },
            },
            '1. P&L Appropriation & Guarantee',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'ADMISSION_GW' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'ADMISSION_GW';
                draw();
              },
            },
            '2. Goodwill & Admission',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'RETIREMENT' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'RETIREMENT';
                draw();
              },
            },
            '3. Retirement & Gaining Ratio',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'DISSOLUTION' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'DISSOLUTION';
                draw();
              },
            },
            '4. Dissolution Realisation',
          ),
        ),
        tab === 'APPROPRIATION' ? renderAppropriation() : tab === 'ADMISSION_GW' ? renderAdmissionGw() : tab === 'RETIREMENT' ? renderRetirement() : renderDissolution(),
      ),
    );
  }

  draw();
}
