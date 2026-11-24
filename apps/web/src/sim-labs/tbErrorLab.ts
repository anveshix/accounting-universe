/**
 * Experience E — Trial Balance & Error Detective Lab (`XI.2.tb`, `XI.2.errors`, `XI.2.provisions`)
 * Powered by `verifyTrialBalancePlacement`, `rectify`, `provisionDoubtful`, and `AFFECTS_TRIAL_BALANCE` in `packages/engine`.
 * Strict CBSE 2026–27 limit: Trial Balance by Balance Method only.
 */
import { Money, provisionDoubtful, rectify, verifyTrialBalancePlacement, type AccountType, type RectLine, type Side } from '../../../../packages/engine/src';
import { h, mount } from '../dom';
import { renderBalanceBeamSvg, type SimShellContext } from './shell';

const R = (m: Money) => m.format();

interface TbCardSpec {
  readonly id: string;
  readonly name: string;
  readonly accountType: AccountType;
  readonly rupees: number;
}

const TB_CARDS: readonly TbCardSpec[] = [
  { id: 'cash', name: 'Cash in Hand', accountType: 'ASSET', rupees: 24000 },
  { id: 'debtors', name: 'Sundry Debtors', accountType: 'ASSET', rupees: 46000 },
  { id: 'purch', name: 'Purchases', accountType: 'EXPENSE', rupees: 90000 },
  { id: 'draw', name: 'Drawings', accountType: 'DRAWINGS', rupees: 12000 },
  { id: 'ret-in', name: 'Sales Returns (Return Inwards)', accountType: 'EXPENSE', rupees: 3000 },
  { id: 'capital', name: 'Capital', accountType: 'CAPITAL', rupees: 70000 },
  { id: 'sales', name: 'Sales', accountType: 'REVENUE', rupees: 76000 },
  { id: 'cred', name: 'Sundry Creditors', accountType: 'LIABILITY', rupees: 25000 },
  { id: 'pdd', name: 'Provision for Doubtful Debts', accountType: 'LIABILITY', rupees: 4000 },
];

interface ErrorCase {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly clue: string;
  readonly affectsTb: boolean;
  readonly wrong: readonly RectLine[];
  readonly right: readonly RectLine[];
  readonly whyExplanation: string;
}

const ERROR_CASES: readonly ErrorCase[] = [
  {
    id: 'principle',
    title: 'Case 1: ₹5,000 paid for Machinery installation debited to Wages A/c',
    kind: 'Error of Principle (Two-sided)',
    clue: 'Visual Clue: Factory inspector sees a brand-new machine running, yet Machinery A/c shows zero installation cost while Wages jumped ₹5,000.',
    affectsTb: false,
    wrong: [
      { account: 'Wages A/c', side: 'DR', amount: Money.rupees(5000) },
      { account: 'Cash A/c', side: 'CR', amount: Money.rupees(5000) },
    ],
    right: [
      { account: 'Machinery A/c', side: 'DR', amount: Money.rupees(5000) },
      { account: 'Cash A/c', side: 'CR', amount: Money.rupees(5000) },
    ],
    whyExplanation: 'Does NOT affect Trial Balance: ₹5,000 was debited (though to Revenue Expense instead of Asset) and ₹5,000 was credited, so Total Dr still equalled Total Cr.',
  },
  {
    id: 'onesided',
    title: 'Case 2: Credit purchase ₹8,000 from Mohan posted to Mohan’s DEBIT as ₹800',
    kind: 'Error of Commission — Wrong Side & Wrong Amount (One-sided)',
    clue: 'Visual Clue: Purchases Book total ₹8,000 is properly on Dr, but Mohan’s personal ledger shows To Purchases ₹800 instead of By Purchases ₹8,000!',
    affectsTb: true,
    wrong: [
      { account: 'Purchases A/c', side: 'DR', amount: Money.rupees(8000) },
      { account: 'Mohan A/c', side: 'DR', amount: Money.rupees(800) },
    ],
    right: [
      { account: 'Purchases A/c', side: 'DR', amount: Money.rupees(8000) },
      { account: 'Mohan A/c', side: 'CR', amount: Money.rupees(8000) },
    ],
    whyExplanation: 'DOES affect Trial Balance: Debits received ₹8,800 while Credits received ₹0, creating an ₹8,800 Credit Suspense balance that clears when rectified.',
  },
  {
    id: 'omission',
    title: 'Case 3: Credit sale of ₹14,000 to Priya completely omitted from Sales Book',
    kind: 'Error of Complete Omission (Two-sided)',
    clue: 'Visual Clue: Invoice #108 sits unentered in the dispatch tray — neither Priya A/c nor Sales A/c has any trace of ₹14,000.',
    affectsTb: false,
    wrong: [],
    right: [
      { account: 'Priya A/c', side: 'DR', amount: Money.rupees(14000) },
      { account: 'Sales A/c', side: 'CR', amount: Money.rupees(14000) },
    ],
    whyExplanation: 'Does NOT affect Trial Balance: Both debit and credit aspects are missing equally, so Trial Balance totals still match.',
  },
];

export function renderTbErrorLab(stage: HTMLElement, ctx: SimShellContext): void {
  let tab: 'TB_SORT' | 'ERROR_DETECTIVE' | 'PROVISIONS' = 'TB_SORT';
  // Start with Drawings & PDD deliberately swapped so students can spot & fix!
  let placements: Record<string, Side> = {
    cash: 'DR',
    debtors: 'DR',
    purch: 'DR',
    draw: 'CR',
    'ret-in': 'DR',
    capital: 'CR',
    sales: 'CR',
    cred: 'CR',
    pdd: 'DR',
  };
  let draggedId: string | null = null;
  let activeCaseIdx = 0;
  let userPredictedAffects: boolean | null = null;
  let feedbackEl: HTMLElement | null = null;

  let debtorsRupees = 100000;
  let furtherBad = 5000;
  let pddPct = 5;
  let discPct = 2;

  const syncTier = () => {
    const t = ctx.getDifficulty();
    feedbackEl = null;
    userPredictedAffects = null;
    if (t === 'BEGINNER') {
      tab = 'TB_SORT';
      placements = {
        cash: 'DR',
        debtors: 'DR',
        purch: 'DR',
        draw: 'CR',
        'ret-in': 'DR',
        capital: 'CR',
        sales: 'CR',
        cred: 'CR',
        pdd: 'DR',
      };
    } else if (t === 'PRACTICE') {
      tab = 'ERROR_DETECTIVE';
      activeCaseIdx = 0;
    } else if (t === 'CHALLENGE') {
      tab = 'ERROR_DETECTIVE';
      activeCaseIdx = 1;
    } else {
      tab = 'PROVISIONS';
    }
  };
  syncTier();
  ctx.onChange(() => {
    syncTier();
    draw();
  });

  function renderTbSorter(): HTMLElement {
    const cards = TB_CARDS.map(c => ({
      id: c.id,
      name: c.name,
      accountType: c.accountType,
      amount: Money.rupees(c.rupees),
      placedSide: placements[c.id] ?? 'DR',
    }));
    const v = verifyTrialBalancePlacement(cards);

    const dropCol = (side: Side, label: string) =>
      h(
        'div',
        {
          class: 'simlab-dropzone ' + side.toLowerCase(),
          'data-tb-zone': side,
          ondragover: (e: Event) => e.preventDefault(),
          ondrop: (e: Event) => {
            e.preventDefault();
            if (draggedId) {
              placements[draggedId] = side;
              draggedId = null;
              draw();
            }
          },
        },
        h('h4', {}, `${label} (${side === 'DR' ? R(v.totalDebit) : R(v.totalCredit)})`),
        ...cards
          .filter(c => c.placedSide === side)
          .map(c => {
            const isWrong = v.wrongSideIds.includes(c.id);
            return h(
              'div',
              {
                class: 'simlab-draggable-card' + (isWrong ? ' wrong-clue' : ''),
                draggable: 'true',
                'data-tb-card': c.id,
                ondragstart: () => {
                  draggedId = c.id;
                },
              },
              h('div', {}, h('strong', {}, ctx.term(c.name)), h('small', { class: 'card-meta' }, ` · ${c.accountType}`)),
              h(
                'div',
                { class: 'card-right' },
                h('b', {}, R(c.amount)),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'secondary simlab-mini-btn',
                    'data-flip-card': c.id,
                    'aria-label': `Move ${c.name} to ${side === 'DR' ? 'Credit' : 'Debit'}`,
                    onclick: () => {
                      placements[c.id] = side === 'DR' ? 'CR' : 'DR';
                      draw();
                    },
                  },
                  side === 'DR' ? '→ Cr' : '← Dr',
                ),
              ),
            );
          }),
      );

    return h(
      'div',
      { class: 'simlab-stack' },
      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Drag-and-Drop or Click-to-Flip · Trial Balance (Balance Method)'),
        h(
          'h3',
          {},
          v.tallies && v.allCorrectSide
            ? `✓ Trial Balance Agrees at ${R(v.totalDebit)} with 0 Misplaced Heads!`
            : v.tallies
              ? `⚠ Totals Match (${R(v.totalDebit)}), BUT ${v.wrongSideIds.length} Compensating Side Errors Remain!`
              : `Suspense Gap: ${R(v.suspenseAmount)} on ${v.suspenseSide === 'DR' ? 'Debit' : 'Credit'} Side`,
        ),
        renderBalanceBeamSvg({
          leftLabel: 'Trial Balance Debit',
          leftAmount: R(v.totalDebit),
          leftValue: Number(v.totalDebit.paise),
          rightLabel: 'Trial Balance Credit',
          rightAmount: R(v.totalCredit),
          rightValue: Number(v.totalCredit.paise),
          balanced: v.tallies,
        }),
        h('div', { class: 'simlab-grid-2' }, dropCol('DR', 'Debit Balances (Assets, Expenses, Drawings)'), dropCol('CR', 'Credit Balances (Liabilities, Capital, Revenue)')),
        h(
          'div',
          { class: 'simlab-action-row' },
          h(
            'button',
            {
              type: 'button',
              'data-tb-verify': '',
              onclick: () => {
                if (v.tallies && v.allCorrectSide) {
                  feedbackEl = h('div', { class: 'note good' }, `✓ Clean Trial Balance! Every account sits on its normal side and Dr = Cr = ${R(v.totalDebit)}.`);
                  void ctx.completeMission(`Trial Balance built cleanly by the Balance Method at ${R(v.totalDebit)}.`);
                } else {
                  feedbackEl = h(
                    'div',
                    { class: 'note warn' },
                    `Check highlighted cards (${v.wrongSideIds.length} on wrong side). Remember: Drawings & Return Inwards are Debit; Provision for Doubtful Debts is Credit.`,
                  );
                }
                draw();
              },
            },
            'Verify Trial Balance',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'secondary',
              onclick: () => {
                placements = {
                  cash: 'DR',
                  debtors: 'DR',
                  purch: 'DR',
                  draw: 'DR',
                  'ret-in': 'DR',
                  capital: 'CR',
                  sales: 'CR',
                  cred: 'CR',
                  pdd: 'CR',
                };
                draw();
              },
            },
            'Auto-Sort Right Sides',
          ),
        ),
        feedbackEl,
      ),
    );
  }

  function renderErrorDetective(): HTMLElement {
    const ec = ERROR_CASES[activeCaseIdx] ?? ERROR_CASES[0]!;
    const rect = rectify(ec.wrong, ec.right);

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Audit Clues · Rectification Entry & Suspense A/c Simulator'),
      h(
        'div',
        { class: 'modes' },
        ...ERROR_CASES.map((c, idx) =>
          h(
            'button',
            {
              type: 'button',
              class: idx === activeCaseIdx ? 'on' : 'secondary',
              onclick: () => {
                activeCaseIdx = idx;
                userPredictedAffects = null;
                feedbackEl = null;
                draw();
              },
            },
            `Case ${idx + 1}`,
          ),
        ),
      ),
      h('h3', {}, ec.title),
      h('p', { class: 'badge-pill' }, ec.kind),
      h('div', { class: 'note info' }, ec.clue),
      h(
        'div',
        { class: 'simlab-grid-2' },
        h(
          'div',
          { class: 'simlab-posted-entry' },
          h('div', { class: 'je-meta' }, h('b', {}, 'Entry Actually Passed (Wrong)')),
          ...(ec.wrong.length
            ? ec.wrong.map(l => h('div', { class: 'je-line ' + l.side.toLowerCase() }, h('span', {}, `${l.side}: ${l.account}`), h('strong', {}, R(l.amount))))
            : [h('p', { class: 'hint' }, 'Nothing recorded at all (Complete Omission).')]),
        ),
        h(
          'div',
          { class: 'simlab-posted-entry' },
          h('div', { class: 'je-meta' }, h('b', {}, 'Entry That Should Have Been Passed')),
          ...ec.right.map(l => h('div', { class: 'je-line ' + l.side.toLowerCase() }, h('span', {}, `${l.side}: ${l.account}`), h('strong', {}, R(l.amount)))),
        ),
      ),
      h(
        'div',
        { class: 'simlab-whatif-box' },
        h('h4', {}, 'Detective Question: Did this error cause the Trial Balance to disagree?'),
        h(
          'div',
          { class: 'simlab-action-row' },
          h(
            'button',
            {
              type: 'button',
              class: userPredictedAffects === true ? 'on' : 'secondary',
              'data-err-predict': 'yes',
              onclick: () => {
                userPredictedAffects = true;
                if (ec.affectsTb) {
                  void ctx.completeMission(`Solved ${ec.kind}: Suspense A/c cleared via rectifying entry.`);
                }
                draw();
              },
            },
            'Yes — Disagrees (Uses Suspense A/c)',
          ),
          h(
            'button',
            {
              type: 'button',
              class: userPredictedAffects === false ? 'on' : 'secondary',
              'data-err-predict': 'no',
              onclick: () => {
                userPredictedAffects = false;
                if (!ec.affectsTb) {
                  void ctx.completeMission(`Solved ${ec.kind}: Explained why Trial Balance stayed in agreement.`);
                }
                draw();
              },
            },
            'No — Trial Balance Still Agreed',
          ),
        ),
        userPredictedAffects !== null &&
          h(
            'div',
            { class: 'note ' + (userPredictedAffects === ec.affectsTb ? 'good' : 'bad') },
            h('b', {}, userPredictedAffects === ec.affectsTb ? '✓ Spot on! ' : '✗ Look closer: '),
            ec.whyExplanation,
          ),
      ),
      h(
        'div',
        { class: 'simlab-posted-entry' },
        h('div', { class: 'je-meta' }, h('b', {}, 'Engine-Derived Rectifying Entry (Correct − Passed)'), rect.usesSuspense ? ' · Clears Suspense A/c' : ' · Self-balancing (No Suspense)'),
        ...rect.entry.lines.map(l => h('div', { class: 'je-line ' + l.side.toLowerCase() }, h('span', {}, l.side === 'DR' ? `${l.account} ... Dr.` : `To ${l.account}`), h('strong', {}, R(l.amount)))),
      ),
    );
  }

  function renderProvisions(): HTMLElement {
    const res = provisionDoubtful({
      debtors: Money.rupees(debtorsRupees),
      badDebtsInBooks: Money.rupees(2000),
      additionalBadDebts: Money.rupees(Math.min(furtherBad, debtorsRupees)),
      pddPercent: BigInt(pddPct),
      discountPercent: BigInt(discPct),
      oldPdd: Money.rupees(3000),
      oldDiscount: Money.rupees(1000),
    });

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Provisions & Reserves (`XI.2.provisions`) · Strict Chain Order'),
      h('h3', {}, `Net Good Debtors in Balance Sheet: ${R(res.netDebtors)} · Total Charge to P&L: ${R(res.totalCharge)}`),
      h(
        'div',
        { class: 'simlab-form-row' },
        h(
          'label',
          {},
          `Debtors: ₹${debtorsRupees.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '40000',
            max: '200000',
            step: '10000',
            value: String(debtorsRupees),
            oninput: (e: Event) => {
              debtorsRupees = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `Further Bad Debts: ₹${furtherBad.toLocaleString('en-IN')} `,
          h('input', {
            type: 'range',
            min: '0',
            max: '15000',
            step: '1000',
            value: String(furtherBad),
            oninput: (e: Event) => {
              furtherBad = Number((e.target as HTMLInputElement).value);
              draw();
            },
          }),
        ),
        h(
          'label',
          {},
          `PDD %: ${pddPct}% `,
          h('input', {
            type: 'range',
            min: '0',
            max: '15',
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
          `Discount %: ${discPct}% `,
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
        { class: 'simtable-wrap' },
        h(
          'table',
          { class: 'simtable' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Step in Chain'), h('th', { class: 'num' }, 'Amount (₹)'))),
          h(
            'tbody',
            {},
            h('tr', {}, h('td', {}, '1. Debtors after Further Bad Debts'), h('td', { class: 'num' }, R(res.debtorsAfterBadDebts))),
            h('tr', {}, h('td', {}, `2. Less: New Provision for Doubtful Debts (${pddPct}%)`), h('td', { class: 'num' }, R(res.newPdd))),
            h('tr', {}, h('td', {}, `3. Less: New Provision for Discount (${discPct}% on remaining good debtors)`), h('td', { class: 'num' }, R(res.newDiscount))),
          ),
          h('tfoot', {}, h('tr', {}, h('th', {}, 'Net Debtors in Balance Sheet'), h('th', { class: 'num' }, R(res.netDebtors)))),
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          onclick: () => {
            void ctx.completeMission(`Verified Debtors Provision Chain: Net Debtors ${R(res.netDebtors)}, P&L Charge ${R(res.totalCharge)}.`);
          },
        },
        'Verify Provision Chain',
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
              class: tab === 'TB_SORT' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'TB_SORT';
                draw();
              },
            },
            '1. Trial Balance Card Sorter',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'ERROR_DETECTIVE' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'ERROR_DETECTIVE';
                draw();
              },
            },
            '2. Error Detective & Suspense A/c',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'PROVISIONS' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'PROVISIONS';
                draw();
              },
            },
            '3. Provisions & Reserves Chain',
          ),
        ),
        tab === 'TB_SORT' ? renderTbSorter() : tab === 'ERROR_DETECTIVE' ? renderErrorDetective() : renderProvisions(),
      ),
    );
  }

  draw();
}
