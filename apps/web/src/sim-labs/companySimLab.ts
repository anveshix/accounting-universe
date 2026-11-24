/**
 * Experience H — Company Accounts Simulator: Shares & Debentures (`XII.2.*`)
 * Powered by `issueShares`, `forfeit`, `reissue`, `callsInAdvance`, `shareCapitalNote`,
 * `issueDebentures`, `debentureInterest`, and `writeOffIssueLosses` in `packages/engine`.
 */
import { Money, callsInAdvance, debentureInterest, forfeit, issueDebentures, issueShares, reissue, shareCapitalNote, writeOffIssueLosses, type Instalment } from '../../../../packages/engine/src';
import { shareStages } from '../../../../packages/curriculum/src';
import { h, mount } from '../dom';
import type { SimShellContext } from './shell';

const R = (m: Money) => m.format();

export function renderCompanyLab(stage: HTMLElement, ctx: SimShellContext): void {
  let tab: 'SHARES' | 'DEBENTURES' = 'SHARES';

  // Shares state (₹10 face, Application ₹4+1, Allotment ₹4+1, Final Call ₹2+1 => Face 4+4+2=10, Premium 3)
  const offered = 100000;
  let rejected = 10000;
  let proRataApplied = 150000;
  let forfeitShares = 1500;
  let reissueShares = 1000;
  let reissuePrice = 9;
  const advanceShares = 2000;

  // Debentures state
  let debCount = 5000;
  let debIssuePrice = 95; // ₹100 face: 95 = 5% discount, 100 = par, 105 = 5% premium
  let debRedeemPrice = 110; // 100 = par, 110 = 10% premium on redemption
  let spAvailable = 40000;

  const syncTier = () => {
    const t = ctx.getDifficulty();
    if (t === 'BEGINNER') {
      tab = 'SHARES';
      forfeitShares = 0;
      reissueShares = 0;
    } else if (t === 'PRACTICE') {
      tab = 'SHARES';
      forfeitShares = 1500;
      reissueShares = 0;
    } else if (t === 'CHALLENGE') {
      tab = 'SHARES';
      forfeitShares = 1500;
      reissueShares = 1000;
      reissuePrice = 9;
    } else {
      tab = 'DEBENTURES';
      debCount = 5000;
      debIssuePrice = 95;
      debRedeemPrice = 110;
      spAvailable = 40000;
    }
  };
  syncTier();
  ctx.onChange(() => {
    syncTier();
    draw();
  });

  function renderSharesView(): HTMLElement {
    const face = Money.rupees(10);
    const instalments: readonly Instalment[] = [
      { name: 'Application', face: Money.rupees(4), premium: Money.rupees(1) },
      { name: 'Allotment', face: Money.rupees(4), premium: Money.rupees(1) },
      { name: 'First & Final Call', face: Money.rupees(2), premium: Money.rupees(1) },
    ];
    const callPerShare = Money.rupees(3); // ₹2 face + ₹1 premium
    const arrearsOnCall = callPerShare.mulRatio(BigInt(forfeitShares), 1n, 'HALF_UP');

    const issue = issueShares({
      company: 'Bharat Tech Ltd.',
      faceValue: face,
      instalments,
      offered: BigInt(offered),
      categories: [
        ...(rejected > 0 ? [{ label: 'Rejected', applied: BigInt(rejected), treatment: 'REJECT' as const }] : []),
        { label: 'Pro-rata', applied: BigInt(Math.max(offered, proRataApplied)), treatment: 'PRORATA' as const },
      ],
      arrearsAmount: forfeitShares > 0 ? { 2: arrearsOnCall } : {},
    });

    const fRes =
      forfeitShares > 0
        ? forfeit({
            shares: BigInt(forfeitShares),
            called: instalments,
            receivedByInstalment: [Money.rupees(5 * forfeitShares), Money.rupees(5 * forfeitShares), Money.ZERO],
          })
        : null;

    const validReissue = fRes && reissueShares > 0 ? Math.min(reissueShares, forfeitShares) : 0;
    const reRes =
      fRes && validReissue > 0
        ? reissue({
            reissued: BigInt(validReissue),
            price: Money.rupees(reissuePrice),
            faceValue: face,
            forfeitedPerShare: Money.rupees(8), // ₹4 App face + ₹4 Allot face received
          })
        : null;

    const unReissuedForfeited = forfeitShares - validReissue;
    const scNote = shareCapitalNote({
      authorisedShares: BigInt(offered + 50000),
      face,
      issuedShares: BigInt(offered),
      fullyPaidShares: BigInt(offered - forfeitShares + validReissue),
      forfeitedReceived: Money.rupees(8 * unReissuedForfeited),
    });

    const stages = shareStages({
      arrears: forfeitShares > 0,
      forfeited: forfeitShares > 0,
      reissued: validReissue > 0,
    });

    const cia = callsInAdvance({
      shares: BigInt(Math.max(100, advanceShares)),
      advancePerShare: Money.rupees(3),
      callName: 'First & Final Call',
    });

    return h(
      'div',
      { class: 'simlab-grid-2' },
      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Share Issue Lifecycle · Pro-Rata, Forfeiture & Re-Issue (`XII.2.issue`, `XII.2.forfeiture`)'),
        h('div', { class: 'simlab-stage-pills' }, ...stages.map(s => h('span', { class: 'stage-chip ' + s.state }, `${s.name}: ${s.state.toUpperCase()}`))),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Pro-rata Applications (for ${offered.toLocaleString('en-IN')} offered): ${proRataApplied.toLocaleString('en-IN')}`),
          h('input', {
            type: 'range',
            min: String(offered),
            max: '200000',
            step: '10000',
            value: String(proRataApplied),
            oninput: (e: Event) => {
              proRataApplied = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Rejected Outright Applications: ${rejected.toLocaleString('en-IN')} shares`),
          h('input', {
            type: 'range',
            min: '0',
            max: '50000',
            step: '5000',
            value: String(rejected),
            oninput: (e: Event) => {
              rejected = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          { class: 'simlab-slider-row' },
          h('span', {}, `Shares Forfeited (unpaid ₹3 call incl. ₹1 premium): ${forfeitShares}`),
          h('input', {
            type: 'range',
            min: '0',
            max: '5000',
            step: '500',
            value: String(forfeitShares),
            oninput: (e: Event) => {
              forfeitShares = Number((e.target as HTMLInputElement).value);
              if (reissueShares > forfeitShares) reissueShares = forfeitShares;
              draw();
            },
          }),
        ),
        forfeitShares > 0 &&
          h(
            'div',
            { class: 'simlab-form-row' },
            h(
              'label',
              {},
              `Re-issued Shares: ${validReissue} `,
              h('input', {
                type: 'range',
                min: '0',
                max: String(forfeitShares),
                step: '250',
                value: String(validReissue),
                oninput: (e: Event) => {
                  reissueShares = Number((e.target as HTMLInputElement).value);
                  draw();
                },
              }),
            ),
            h(
              'label',
              {},
              `Re-issue Price (₹/share, min ₹2): ₹${reissuePrice} `,
              h('input', {
                type: 'range',
                min: '2',
                max: '14',
                step: '1',
                value: String(reissuePrice),
                oninput: (e: Event) => {
                  reissuePrice = Number((e.target as HTMLInputElement).value);
                  draw();
                },
              }),
            ),
          ),
        h(
          'div',
          { class: 'note info' },
          `Calls in Advance Preview (${advanceShares} shares @ ₹3, no interest per CBSE limit): ${R(cia.received)} credited to Calls in Advance A/c and adjusted when call falls due.`,
        ),
        h(
          'button',
          {
            type: 'button',
            'data-comp-verify': '',
            onclick: () => {
              void ctx.completeMission(`Share Capital verified: Subscribed total ${R(scNote.total)}${reRes ? `, Capital Reserve ${R(reRes.capitalReserve)}` : ''}.`);
            },
          },
          'Verify Share Capital & Schedule III Note',
        ),
      ),

      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Pro-Rata Summary, Forfeiture/Reissue & Schedule III Disclosure'),
        h(
          'div',
          { class: 'simlab-kpi-row' },
          h('div', { class: 'kpi-tile' }, h('small', {}, 'Pro-Rata Ratio'), h('strong', {}, issue.plan.proRataRatio.toString())),
          h('div', { class: 'kpi-tile' }, h('small', {}, 'Bank Refund'), h('strong', {}, R(issue.refund))),
          h('div', { class: 'kpi-tile' }, h('small', {}, ctx.term('Capital Reserve')), h('strong', {}, reRes ? R(reRes.capitalReserve) : '₹0.00')),
        ),
        fRes &&
          h(
            'div',
            { class: 'simlab-posted-entry' },
            h('div', { class: 'je-meta' }, h('b', {}, 'Forfeiture Entry'), ` — ${fRes.entry.narration}`),
            ...fRes.entry.lines.map(l =>
              h('div', { class: 'je-line ' + l.side.toLowerCase() }, h('span', {}, l.side === 'DR' ? `${l.account} ... Dr.` : `To ${l.account}`), h('strong', {}, R(l.amount))),
            ),
          ),
        h(
          'div',
          { class: 'simtable-wrap' },
          h(
            'table',
            { class: 'simtable' },
            h('caption', {}, 'Schedule III — Note to Accounts: Share Capital'),
            h(
              'tbody',
              {},
              h('tr', {}, h('td', {}, 'Authorised Share Capital'), h('td', { class: 'num' }, R(scNote.authorised))),
              h('tr', {}, h('td', {}, 'Issued Share Capital'), h('td', { class: 'num' }, R(scNote.issued))),
              h('tr', {}, h('td', {}, 'Subscribed & Fully Paid-up'), h('td', { class: 'num' }, R(scNote.subscribedAndPaid))),
              h('tr', {}, h('td', {}, 'Add: Share Forfeited A/c (un-reissued balance)'), h('td', { class: 'num' }, R(scNote.forfeitedAdded))),
            ),
            h('tfoot', {}, h('tr', {}, h('th', {}, 'Share Capital shown on Face of Balance Sheet'), h('th', { class: 'num' }, R(scNote.total)))),
          ),
        ),
      ),
    );
  }

  function renderDebenturesView(): HTMLElement {
    const face = Money.rupees(100);
    const deb = issueDebentures({
      rate: '9%',
      count: BigInt(debCount),
      face,
      issuePrice: Money.rupees(debIssuePrice),
      redemptionPrice: Money.rupees(debRedeemPrice),
    });
    const annualInt = debentureInterest(face.mulRatio(BigInt(debCount), 1n, 'HALF_UP'), 9n, 12n);
    const writeOff = writeOffIssueLosses(deb.discountOnIssue, deb.lossOnIssue, Money.rupees(spAvailable));

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Debenture Issue with Terms of Redemption & Loss Write-Off (`XII.2.debentures` — No TDS, No Redemption Entries)'),
      h('h3', {}, `${debCount.toLocaleString('en-IN')} 9% Debentures of ₹100 · Issue @ ₹${debIssuePrice} · Redeemable @ ₹${debRedeemPrice}`),
      h(
        'div',
        { class: 'simlab-form-row' },
        h(
          'label',
          {},
          `Issue Price (₹90–₹110): ₹${debIssuePrice} `,
          h('input', {
            type: 'range',
            min: '90',
            max: '110',
            step: '5',
            value: String(debIssuePrice),
            oninput: (e: Event) => {
              debIssuePrice = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Redemption Price (₹100 Par or ₹105/₹110 Premium): ₹${debRedeemPrice} `,
          h('input', {
            type: 'range',
            min: '100',
            max: '115',
            step: '5',
            value: String(debRedeemPrice),
            oninput: (e: Event) => {
              debRedeemPrice = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Securities Premium Available for Write-Off: ₹${spAvailable.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '0',
            max: '100000',
            step: '10000',
            value: String(spAvailable),
            oninput: (e: Event) => {
              spAvailable = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
      ),
      h(
        'div',
        { class: 'simlab-kpi-row' },
        h('div', { class: 'kpi-tile' }, h('small', {}, 'Bank Proceeds'), h('strong', {}, R(deb.received))),
        h('div', { class: 'kpi-tile' }, h('small', {}, 'Total Issue Discount + Loss'), h('strong', {}, R(deb.discountOnIssue.add(deb.lossOnIssue)))),
        h('div', { class: 'kpi-tile' }, h('small', {}, 'Annual Debenture Interest'), h('strong', {}, R(annualInt))),
      ),
      ...deb.entries.map(en =>
        h(
          'div',
          { class: 'simlab-posted-entry' },
          h('div', { class: 'je-meta' }, h('b', {}, en.narration)),
          ...en.lines.map(l => h('div', { class: 'je-line ' + l.side.toLowerCase() }, h('span', {}, l.side === 'DR' ? `${l.account} ... Dr.` : `To ${l.account}`), h('strong', {}, R(l.amount)))),
        ),
      ),
      writeOff.lines.length > 0 &&
        h(
          'div',
          { class: 'simlab-posted-entry' },
          h('div', { class: 'je-meta' }, h('b', {}, 'Year-1 Write-Off (AS 16): '), writeOff.narration),
          ...writeOff.lines.map(l => h('div', { class: 'je-line ' + l.side.toLowerCase() }, h('span', {}, l.side === 'DR' ? `${l.account} ... Dr.` : `To ${l.account}`), h('strong', {}, R(l.amount)))),
        ),
      h(
        'button',
        {
          type: 'button',
          onclick: () => {
            void ctx.completeMission(`Debenture issue & write-off verified: Proceeds ${R(deb.received)}, Interest ${R(annualInt)}.`);
          },
        },
        'Verify Debenture Issue & Write-Off',
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
              class: tab === 'SHARES' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'SHARES';
                draw();
              },
            },
            '1. Share Capital, Pro-Rata, Forfeiture & Re-issue',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'DEBENTURES' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'DEBENTURES';
                draw();
              },
            },
            '2. Debentures Issue, Interest & Loss Write-Off',
          ),
        ),
        tab === 'SHARES' ? renderSharesView() : renderDebenturesView(),
      ),
    );
  }

  draw();
}
