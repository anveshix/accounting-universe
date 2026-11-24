/**
 * Experience C — Cash Book, Petty Cash (Imprest) & Bank Reconciliation Simulator
 * (`XI.2.cashbook`, `XI.2.subsidiary`, `XI.2.brs`)
 * Powered by `cashBook`, `pettyCash`, and `reconcile` in `packages/engine`.
 */
import { BRS_ITEMS, Money, cashBook, pettyCash, reconcile, type BrsKind, type CashBookKind, type CashBookTxn } from '../../../../packages/engine/src';
import { h, mount } from '../dom';
import type { SimShellContext } from './shell';

const R = (m: Money) => m.format();

const BRS_LIST: readonly { kind: BrsKind; short: string; defaultAmt: number; whoKnowsFirst: 'CASH_BOOK' | 'PASS_BOOK' }[] = [
  { kind: 'CHEQUE_ISSUED_NOT_PRESENTED', short: 'Cheques issued, not yet presented', defaultAmt: 10000, whoKnowsFirst: 'CASH_BOOK' },
  { kind: 'CHEQUE_DEPOSITED_NOT_COLLECTED', short: 'Cheques deposited, not yet collected', defaultAmt: 3000, whoKnowsFirst: 'CASH_BOOK' },
  { kind: 'BANK_CHARGES_NOT_IN_CASH_BOOK', short: 'Bank charges debited in Pass Book only', defaultAmt: 500, whoKnowsFirst: 'PASS_BOOK' },
  { kind: 'DIRECT_DEPOSIT_BY_CUSTOMER', short: 'Customer direct deposit into bank', defaultAmt: 0, whoKnowsFirst: 'PASS_BOOK' },
  { kind: 'INTEREST_ON_OVERDRAFT_NOT_IN_CASH_BOOK', short: 'Interest on overdraft debited by bank', defaultAmt: 0, whoKnowsFirst: 'PASS_BOOK' },
];

export function renderCashbookBrsLab(stage: HTMLElement, ctx: SimShellContext): void {
  let subTab: 'BRS' | 'CASHBOOK' | 'PETTY' = 'BRS';
  let startFrom: 'CASH_BOOK' | 'PASS_BOOK' = 'CASH_BOOK';
  let startRupees = 50000;
  let brsAmounts: Record<BrsKind, number> = {
    CHEQUE_ISSUED_NOT_PRESENTED: 10000,
    CHEQUE_DEPOSITED_NOT_COLLECTED: 3000,
    BANK_CHARGES_NOT_IN_CASH_BOOK: 500,
    INTEREST_CREDITED_NOT_IN_CASH_BOOK: 0,
    DIRECT_DEPOSIT_BY_CUSTOMER: 0,
    DIRECT_PAYMENT_BY_BANK: 0,
    CHEQUE_DISHONOURED: 0,
    INTEREST_ON_OVERDRAFT_NOT_IN_CASH_BOOK: 0,
  };

  let openCash = 15000;
  let openBank = 20000;
  const cbTxns: CashBookTxn[] = [
    { particulars: 'Cash sales', kind: 'RECEIPT_CASH', amount: Money.rupees(9000) },
    { particulars: 'Cash deposited into bank', kind: 'DEPOSIT', amount: Money.rupees(8000) },
    { particulars: 'Rent paid by cheque', kind: 'PAYMENT_BANK', amount: Money.rupees(12000) },
    { particulars: 'Cash drawn from bank for office use', kind: 'WITHDRAWAL', amount: Money.rupees(2000) },
  ];

  let imprestFloat = 5000;
  const pettyRows: { head: string; amount: number }[] = [
    { head: 'Postage', amount: 850 },
    { head: 'Conveyance', amount: 900 },
    { head: 'Stationery', amount: 700 },
  ];

  const syncWithDifficulty = () => {
    const tier = ctx.getDifficulty();
    if (tier === 'BEGINNER') {
      subTab = 'CASHBOOK';
      openCash = 15000;
      openBank = 20000;
    } else if (tier === 'PRACTICE') {
      subTab = 'BRS';
      startFrom = 'CASH_BOOK';
      startRupees = 50000;
      brsAmounts = {
        ...brsAmounts,
        CHEQUE_ISSUED_NOT_PRESENTED: 10000,
        CHEQUE_DEPOSITED_NOT_COLLECTED: 3000,
        BANK_CHARGES_NOT_IN_CASH_BOOK: 500,
        DIRECT_DEPOSIT_BY_CUSTOMER: 0,
        INTEREST_ON_OVERDRAFT_NOT_IN_CASH_BOOK: 0,
      };
    } else if (tier === 'CHALLENGE') {
      subTab = 'BRS';
      startFrom = 'CASH_BOOK';
      startRupees = -20000;
      brsAmounts = {
        ...brsAmounts,
        CHEQUE_ISSUED_NOT_PRESENTED: 0,
        CHEQUE_DEPOSITED_NOT_COLLECTED: 0,
        BANK_CHARGES_NOT_IN_CASH_BOOK: 0,
        DIRECT_DEPOSIT_BY_CUSTOMER: 6000,
        INTEREST_ON_OVERDRAFT_NOT_IN_CASH_BOOK: 1200,
      };
    } else {
      subTab = 'BRS';
      startFrom = 'PASS_BOOK';
      startRupees = 56500;
      brsAmounts = {
        ...brsAmounts,
        CHEQUE_ISSUED_NOT_PRESENTED: 10000,
        CHEQUE_DEPOSITED_NOT_COLLECTED: 3000,
        BANK_CHARGES_NOT_IN_CASH_BOOK: 500,
        DIRECT_DEPOSIT_BY_CUSTOMER: 0,
        INTEREST_ON_OVERDRAFT_NOT_IN_CASH_BOOK: 0,
      };
    }
  };
  syncWithDifficulty();
  ctx.onChange(() => {
    syncWithDifficulty();
    draw();
  });

  function renderBrsView(): HTMLElement {
    const activeItems = (Object.keys(brsAmounts) as BrsKind[]).filter(k => brsAmounts[k] > 0).map(k => ({ kind: k, amount: Money.rupees(brsAmounts[k]) }));

    const startMoney = Money.rupees(startRupees);
    const res = activeItems.length ? reconcile(startMoney, startFrom, activeItems) : { start: startMoney, end: startMoney, rows: [], startFrom };

    const startName = startFrom === 'CASH_BOOK' ? 'Cash Book (Bank Column)' : 'Pass Book (Bank Statement)';
    const endName = startFrom === 'CASH_BOOK' ? 'Pass Book (Bank Statement)' : 'Cash Book (Bank Column)';

    return h(
      'div',
      { class: 'simlab-grid-2' },
      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Cash Book vs Bank Statement · Difference Detector'),
        h('h3', {}, 'Configure Balances & Timing/Omission Items'),
        h(
          'div',
          { class: 'simlab-form-row' },
          h(
            'label',
            {},
            'Start From ',
            h(
              'select',
              {
                'data-brs-startfrom': '',
                onchange: (e: Event) => {
                  startFrom = (e.target as HTMLSelectElement).value as 'CASH_BOOK' | 'PASS_BOOK';
                  draw();
                },
              },
              h('option', { value: 'CASH_BOOK', selected: startFrom === 'CASH_BOOK' }, 'Balance as per Cash Book'),
              h('option', { value: 'PASS_BOOK', selected: startFrom === 'PASS_BOOK' }, 'Balance as per Pass Book'),
            ),
          ),
          h(
            'label',
            {},
            'Starting Balance (₹, minus = Overdraft) ',
            h('input', {
              type: 'number',
              step: '500',
              value: String(startRupees),
              'data-brs-start': '',
              onchange: (e: Event) => {
                startRupees = Math.round(Number((e.target as HTMLInputElement).value) || 0);
                draw();
              },
            }),
          ),
        ),
        h(
          'div',
          { class: 'simlab-brs-sliders' },
          ...BRS_LIST.map(item =>
            h(
              'div',
              { class: 'simlab-brs-item' },
              h(
                'div',
                { class: 'brs-item-top' },
                h('strong', {}, item.short),
                h('span', { class: 'badge-pill' }, item.whoKnowsFirst === 'CASH_BOOK' ? 'Recorded in Cash Book first' : 'Recorded by Bank first'),
              ),
              h(
                'div',
                { class: 'simlab-slider-inline' },
                h('input', {
                  type: 'range',
                  min: '0',
                  max: '25000',
                  step: '500',
                  value: String(brsAmounts[item.kind]),
                  'aria-label': item.short,
                  oninput: (e: Event) => {
                    brsAmounts[item.kind] = Number((e.target as HTMLInputElement).value);
                    draw();
                  },
                }),
                h('b', {}, R(Money.rupees(brsAmounts[item.kind]))),
              ),
            ),
          ),
        ),
        h(
          'div',
          { class: 'simlab-action-row' },
          h(
            'button',
            {
              type: 'button',
              'data-brs-verify': '',
              onclick: () => {
                void ctx.completeMission(`Reconciled ${startName} (${R(res.start)}) to ${endName} (${R(res.end)}) across ${res.rows.length} items.`);
              },
            },
            'Verify Reconciliation Mission',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'secondary',
              onclick: () => {
                startFrom = startFrom === 'CASH_BOOK' ? 'PASS_BOOK' : 'CASH_BOOK';
                startRupees = Number(res.end.paise) / 100;
                draw();
              },
            },
            'What-if: Flip Starting Book ⇄',
          ),
        ),
      ),

      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Live Bank Reconciliation Statement'),
        h('h3', {}, `${startName} → ${endName}`),
        h(
          'div',
          { class: 'simlab-compare-cards' },
          h(
            'div',
            { class: 'compare-box ' + (res.start.isNegative() ? 'od' : '') },
            h('small', {}, startName),
            h('strong', {}, R(res.start)),
            res.start.isNegative() && h('span', { class: 'od-tag' }, ctx.term('Bank Overdraft')),
          ),
          h('div', { class: 'compare-arrow' }, '⇒'),
          h(
            'div',
            { class: 'compare-box ' + (res.end.isNegative() ? 'od' : '') },
            h('small', {}, endName),
            h('strong', {}, R(res.end)),
            res.end.isNegative() && h('span', { class: 'od-tag' }, ctx.term('Bank Overdraft')),
          ),
        ),
        h(
          'div',
          { class: 'simtable-wrap' },
          h(
            'table',
            { class: 'simtable' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Particulars'), h('th', {}, 'Effect'), h('th', { class: 'num' }, 'Amount (₹)'))),
            h(
              'tbody',
              {},
              h('tr', {}, h('td', {}, `Balance as per ${startName}${res.start.isNegative() ? ' (Overdraft)' : ''}`), h('td', {}, ''), h('td', { class: 'num' }, R(res.start))),
              ...res.rows.map(r =>
                h('tr', {}, h('td', {}, BRS_ITEMS[r.kind].label), h('td', {}, h('span', { class: r.effect === 'ADD' ? 'delta-up' : 'delta-down' }, r.effect)), h('td', { class: 'num' }, R(r.amount))),
              ),
            ),
            h('tfoot', {}, h('tr', {}, h('th', {}, `Balance as per ${endName}${res.end.isNegative() ? ' (Overdraft)' : ''}`), h('th', {}, ''), h('th', { class: 'num' }, R(res.end)))),
          ),
        ),
      ),
    );
  }

  function renderCashBookView(): HTMLElement {
    let cbResult;
    let errText = '';
    try {
      cbResult = cashBook({ cash: Money.rupees(openCash), bank: Money.rupees(openBank) }, cbTxns);
    } catch (e) {
      errText = (e as Error).message;
    }

    const kindSel = h(
      'select',
      { 'aria-label': 'Cash book transaction type' },
      h('option', { value: 'RECEIPT_CASH' }, 'Cash Receipt (Cash Dr)'),
      h('option', { value: 'RECEIPT_BANK' }, 'Cheque Receipt (Bank Dr)'),
      h('option', { value: 'PAYMENT_CASH' }, 'Cash Payment (Cash Cr)'),
      h('option', { value: 'PAYMENT_BANK' }, 'Cheque Payment (Bank Cr)'),
      h('option', { value: 'DEPOSIT' }, 'Deposit Cash into Bank — Contra (C)'),
      h('option', { value: 'WITHDRAWAL' }, 'Withdraw Cash for Office — Contra (C)'),
    ) as HTMLSelectElement;
    const partInput = h('input', { type: 'text', value: 'Commission received', 'aria-label': 'Particulars' }) as HTMLInputElement;
    const amtInput = h('input', { type: 'number', min: '100', step: '500', value: '4000', 'aria-label': 'Amount' }) as HTMLInputElement;

    return h(
      'div',
      { class: 'simlab-stack' },
      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Two-Column Cash Book (Cash + Bank) · Contra (C) Visualiser'),
        h(
          'div',
          { class: 'simlab-form-row' },
          h(
            'label',
            {},
            'Opening Cash (₹) ',
            h('input', {
              type: 'number',
              min: '0',
              step: '1000',
              value: String(openCash),
              onchange: (e: Event) => {
                openCash = Math.max(0, Math.round(Number((e.target as HTMLInputElement).value) || 0));
                draw();
              },
            }),
          ),
          h(
            'label',
            {},
            'Opening Bank (₹, minus = OD) ',
            h('input', {
              type: 'number',
              step: '1000',
              value: String(openBank),
              onchange: (e: Event) => {
                openBank = Math.round(Number((e.target as HTMLInputElement).value) || 0);
                draw();
              },
            }),
          ),
          kindSel,
          partInput,
          amtInput,
          h(
            'button',
            {
              type: 'button',
              class: 'secondary',
              onclick: () => {
                const v = Math.round(Number(amtInput.value) || 0);
                if (v <= 0) return;
                cbTxns.push({
                  particulars: partInput.value.trim() || 'Transaction',
                  kind: kindSel.value as CashBookKind,
                  amount: Money.rupees(v),
                });
                draw();
              },
            },
            '+ Record Line',
          ),
        ),
        errText && h('div', { class: 'note bad' }, errText),
        cbResult &&
          h(
            'div',
            { class: 'simtable-wrap' },
            h(
              'table',
              { class: 'simtable' },
              h('caption', {}, 'Two-Column Cash Book (Dr. Receipts | Cr. Payments)'),
              h(
                'thead',
                {},
                h(
                  'tr',
                  {},
                  h('th', {}, 'Particulars'),
                  h('th', {}, 'L.F.'),
                  h('th', { class: 'num' }, 'Cash Dr'),
                  h('th', { class: 'num' }, 'Bank Dr'),
                  h('th', { class: 'num' }, 'Cash Cr'),
                  h('th', { class: 'num' }, 'Bank Cr'),
                  h('th', { class: 'num' }, 'Cash Bal'),
                  h('th', { class: 'num' }, 'Bank Bal'),
                ),
              ),
              h(
                'tbody',
                {},
                ...cbResult.rows.map(r =>
                  h(
                    'tr',
                    { class: r.contra ? 'contra-row' : '' },
                    h('td', {}, r.txn.particulars),
                    h('td', {}, r.contra ? h('span', { class: 'badge-pill' }, 'C') : ''),
                    h('td', { class: 'num' }, r.cashDr.isZero() ? '—' : R(r.cashDr)),
                    h('td', { class: 'num' }, r.bankDr.isZero() ? '—' : R(r.bankDr)),
                    h('td', { class: 'num' }, r.cashCr.isZero() ? '—' : R(r.cashCr)),
                    h('td', { class: 'num' }, r.bankCr.isZero() ? '—' : R(r.bankCr)),
                    h('td', { class: 'num' }, R(r.cashBalance)),
                    h('td', { class: 'num' }, R(r.bankBalance)),
                  ),
                ),
              ),
              h(
                'tfoot',
                {},
                h(
                  'tr',
                  {},
                  h('th', {}, 'Column Totals / Closing Balances'),
                  h('th', {}, ''),
                  h('th', { class: 'num' }, R(cbResult.totalCashDr)),
                  h('th', { class: 'num' }, R(cbResult.totalBankDr)),
                  h('th', { class: 'num' }, R(cbResult.totalCashCr)),
                  h('th', { class: 'num' }, R(cbResult.totalBankCr)),
                  h('th', { class: 'num' }, R(cbResult.closingCash)),
                  h('th', { class: 'num' }, R(cbResult.closingBank)),
                ),
              ),
            ),
          ),
        cbResult &&
          h(
            'div',
            { class: 'simlab-action-row' },
            h(
              'button',
              {
                type: 'button',
                onclick: () => {
                  void ctx.completeMission(`Cash Book balanced: Closing Cash ${R(cbResult.closingCash)}, Closing Bank ${R(cbResult.closingBank)}.`);
                },
              },
              'Verify Cash Book & Contra Entries',
            ),
          ),
      ),
    );
  }

  function renderPettyView(): HTMLElement {
    const pc = pettyCash({
      imprest: Money.rupees(imprestFloat),
      payments: pettyRows.map(p => ({ head: p.head, amount: Money.rupees(p.amount) })),
    });
    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Analytical Petty Cash Book · Imprest Float Restoration'),
      h('h3', {}, `Imprest Float: ${R(Money.rupees(imprestFloat))} · Reimbursement Needed: ${R(pc.reimbursement)}`),
      h(
        'label',
        { class: 'simlab-slider-row' },
        h('span', {}, `Imprest System Float: ₹${imprestFloat.toLocaleString('en-IN')}`),
        h('input', {
          type: 'range',
          min: '3000',
          max: '10000',
          step: '500',
          value: String(imprestFloat),
          oninput: (e: Event) => {
            imprestFloat = Number((e.target as HTMLInputElement).value);
            draw();
          },
        }),
      ),
      h(
        'div',
        { class: 'simtable-wrap' },
        h(
          'table',
          { class: 'simtable' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Expense Head'), h('th', { class: 'num' }, 'Amount Spent (₹)'))),
          h('tbody', {}, ...Object.entries(pc.byHead).map(([hd, amt]) => h('tr', {}, h('td', {}, ctx.term(hd)), h('td', { class: 'num' }, R(amt))))),
          h(
            'tfoot',
            {},
            h('tr', {}, h('th', {}, 'Total Petty Expenditure (= Reimbursement)'), h('th', { class: 'num' }, R(pc.totalSpent))),
            h('tr', {}, h('th', {}, 'Closing Petty Cash on Hand'), h('th', { class: 'num' }, R(pc.closingBalance))),
          ),
        ),
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
          { class: 'modes simlab-subtabs', role: 'tablist', 'aria-label': 'Cash Book and BRS modes' },
          h(
            'button',
            {
              type: 'button',
              role: 'tab',
              'aria-selected': String(subTab === 'BRS'),
              class: subTab === 'BRS' ? 'on' : 'secondary',
              onclick: () => {
                subTab = 'BRS';
                draw();
              },
            },
            '1. Bank Reconciliation (BRS)',
          ),
          h(
            'button',
            {
              type: 'button',
              role: 'tab',
              'aria-selected': String(subTab === 'CASHBOOK'),
              class: subTab === 'CASHBOOK' ? 'on' : 'secondary',
              onclick: () => {
                subTab = 'CASHBOOK';
                draw();
              },
            },
            '2. Two-Column Cash Book (Contra)',
          ),
          h(
            'button',
            {
              type: 'button',
              role: 'tab',
              'aria-selected': String(subTab === 'PETTY'),
              class: subTab === 'PETTY' ? 'on' : 'secondary',
              onclick: () => {
                subTab = 'PETTY';
                draw();
              },
            },
            '3. Petty Cash (Imprest)',
          ),
        ),
        subTab === 'BRS' ? renderBrsView() : subTab === 'CASHBOOK' ? renderCashBookView() : renderPettyView(),
      ),
    );
  }

  draw();
}
