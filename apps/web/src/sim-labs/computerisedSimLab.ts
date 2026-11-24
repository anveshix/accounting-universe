/**
 * Experience J — Computerised Accounting & Spreadsheet Lab (`XII.C.cas`, `XII.C.spreadsheet`, `XII.C.using` + Class XI CAS)
 * Powered by `ChartOfAccounts`, `Ledger`, `validateEntry`, `Machine` (`CAS_VOUCHER`, `CAS_YEAR`),
 * `loanSchedule`, `depreciationSchedule`, `currentRatio`, `reconcile`, and `Fraction` in `packages/engine`.
 */
import {
  ChartOfAccounts,
  Fraction,
  Ledger,
  Machine,
  Money,
  currentRatio,
  depreciationSchedule,
  loanSchedule,
  reconcile,
  validateEntry,
  type AccountType,
  type Side,
} from '../../../../packages/engine/src';
import { CAS_VOUCHER, CAS_YEAR } from '../../../../packages/curriculum/src';
import { h, mount } from '../dom';
import type { SimShellContext } from './shell';

const R = (m: Money) => m.format();

interface CodifiedAccount {
  readonly code: string;
  readonly id: string;
  readonly name: string;
  readonly majorGroup: string;
  readonly subGroup: string;
  readonly type: AccountType;
}

const STARTER_CODES: readonly CodifiedAccount[] = [
  { code: '1101', id: 'machinery', name: 'Machinery', majorGroup: '1 · Assets', subGroup: '11 · Non-Current Assets', type: 'ASSET' },
  { code: '1201', id: 'cash', name: 'Cash in Hand', majorGroup: '1 · Assets', subGroup: '12 · Current Assets', type: 'ASSET' },
  { code: '1202', id: 'bank', name: 'Cash at Bank', majorGroup: '1 · Assets', subGroup: '12 · Current Assets', type: 'ASSET' },
  { code: '2201', id: 'creditors', name: 'Sundry Creditors', majorGroup: '2 · Liabilities', subGroup: '22 · Current Liabilities', type: 'LIABILITY' },
  { code: '3101', id: 'capital', name: 'Owner Capital', majorGroup: '3 · Equity', subGroup: '31 · Capital', type: 'CAPITAL' },
  { code: '4101', id: 'sales', name: 'Sales Revenue', majorGroup: '4 · Revenue', subGroup: '41 · Operating Revenue', type: 'REVENUE' },
  { code: '5101', id: 'purchases', name: 'Purchases', majorGroup: '5 · Expenses', subGroup: '51 · Direct Expenses', type: 'EXPENSE' },
  { code: '5201', id: 'salary', name: 'Salaries', majorGroup: '5 · Expenses', subGroup: '52 · Indirect Expenses', type: 'EXPENSE' },
  { code: '5202', id: 'depreciation', name: 'Depreciation', majorGroup: '5 · Expenses', subGroup: '52 · Indirect Expenses', type: 'EXPENSE' },
];

export function renderComputerisedAccountingLab(stage: HTMLElement, ctx: SimShellContext): void {
  let tab: 'CODIFICATION' | 'VOUCHERS' | 'SPREADSHEET' = 'CODIFICATION';

  const accounts: CodifiedAccount[] = [...STARTER_CODES];
  type Role = 'ACCOUNTANT' | 'CHECKER' | 'VIEWER';
  let role: Role = 'ACCOUNTANT';
  const yearMachine = new Machine(CAS_YEAR, { role: 'ACCOUNTANT' as Role, pending: 0 });
  const pendingQueue: {
    id: string;
    date: string;
    narration: string;
    drId: string;
    crId: string;
    amount: Money;
  }[] = [];

  let chart = new ChartOfAccounts();
  let ledger = new Ledger(chart);

  const rebuildChartAndSeed = () => {
    chart = new ChartOfAccounts();
    for (const a of accounts) {
      if (!chart.has(a.id)) chart.add({ id: a.id, name: `${a.code} · ${a.name}`, type: a.type });
    }
    ledger = new Ledger(chart);
    ledger.post({
      date: '2026-04-01',
      narration: 'Opening capital brought into bank',
      lines: [
        { accountId: 'bank', side: 'DR', amount: Money.rupees(150000) },
        { accountId: 'capital', side: 'CR', amount: Money.rupees(150000) },
      ],
    });
    ledger.post({
      date: '2026-04-10',
      narration: 'Machinery purchased by cheque',
      lines: [
        { accountId: 'machinery', side: 'DR', amount: Money.rupees(60000) },
        { accountId: 'bank', side: 'CR', amount: Money.rupees(60000) },
      ],
    });
    ledger.post({
      date: '2026-04-18',
      narration: 'Sales banked',
      lines: [
        { accountId: 'bank', side: 'DR', amount: Money.rupees(85000) },
        { accountId: 'sales', side: 'CR', amount: Money.rupees(85000) },
      ],
    });
  };
  rebuildChartAndSeed();

  let vDr = 'salary';
  let vCr = 'bank';
  let vAmt = 18000;
  const vNarr = 'Monthly salary paid by bank transfer';
  let statusText = '';

  // Spreadsheet state
  let sheetMode: 'EMI' | 'SLN' | 'RATIO_BRS' = 'EMI';
  let loanPrincipal = 120000;
  let loanRate = 12;
  const loanMonths = 6;
  const assetCost = 100000;
  const assetScrap = 10000;
  const assetLife = 5;

  const syncTier = () => {
    const t = ctx.getDifficulty();
    statusText = '';
    if (t === 'BEGINNER') tab = 'CODIFICATION';
    else if (t === 'PRACTICE' || t === 'CHALLENGE') tab = 'VOUCHERS';
    else tab = 'SPREADSHEET';
  };
  syncTier();
  ctx.onChange(() => {
    syncTier();
    draw();
  });

  function renderCodification(): HTMLElement {
    const codeInp = h('input', { type: 'text', value: '1203', 'aria-label': 'Hierarchical code' }) as HTMLInputElement;
    const nameInp = h('input', { type: 'text', value: 'Sundry Debtors', 'aria-label': 'Account name' }) as HTMLInputElement;
    const typeSel = h(
      'select',
      { 'aria-label': 'Major account group' },
      h('option', { value: 'ASSET' }, '1 · Assets (12 · Current Assets)'),
      h('option', { value: 'LIABILITY' }, '2 · Liabilities (22 · Current Liabilities)'),
      h('option', { value: 'REVENUE' }, '4 · Revenue (41 · Operating)'),
      h('option', { value: 'EXPENSE' }, '5 · Expenses (52 · Indirect)'),
    ) as HTMLSelectElement;

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Hierarchical Account-Head Codification (`XII.C.cas`, `XII.C.using`)'),
      h('h3', {}, 'Group → Sub-Group → Ledger Code Tree'),
      h(
        'div',
        { class: 'simlab-form-row' },
        h('label', {}, 'Code ', codeInp),
        h('label', {}, 'Account Name ', nameInp),
        typeSel,
        h(
          'button',
          {
            type: 'button',
            'data-cas-add-code': '',
            onclick: () => {
              const code = codeInp.value.trim();
              const nm = nameInp.value.trim();
              if (!/^\d{4}$/.test(code) || !nm) {
                statusText = 'Enter a 4-digit hierarchical code (e.g. 1203) and account name.';
                draw();
                return;
              }
              const slug = nm.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              if (accounts.some(a => a.code === code || a.id === slug)) {
                statusText = 'Code or account id already exists — codification requires unique primary keys!';
                draw();
                return;
              }
              const tp = typeSel.value as AccountType;
              const mg = tp === 'ASSET' ? '1 · Assets' : tp === 'LIABILITY' ? '2 · Liabilities' : tp === 'REVENUE' ? '4 · Revenue' : '5 · Expenses';
              const sg = tp === 'ASSET' ? '12 · Current Assets' : tp === 'LIABILITY' ? '22 · Current Liabilities' : tp === 'REVENUE' ? '41 · Operating Revenue' : '52 · Indirect Expenses';
              accounts.push({ code, id: slug, name: nm, majorGroup: mg, subGroup: sg, type: tp });
              chart.add({ id: slug, name: `${code} · ${nm}`, type: tp });
              statusText = `Added codified account ${code} · ${nm} under ${mg} → ${sg}.`;
              void ctx.completeMission(`Created codified ledger head ${code} · ${nm} in the CAS hierarchy.`);
              draw();
            },
          },
          '+ Register Codified Account',
        ),
      ),
      statusText && h('div', { class: 'note info' }, statusText),
      h(
        'div',
        { class: 'simtable-wrap' },
        h(
          'table',
          { class: 'simtable' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Code'), h('th', {}, 'Major Group'), h('th', {}, 'Sub-Group'), h('th', {}, 'Account Title'), h('th', {}, 'Normal Side'))),
          h(
            'tbody',
            {},
            ...accounts.map(a =>
              h(
                'tr',
                {},
                h('td', {}, h('code', {}, a.code)),
                h('td', {}, a.majorGroup),
                h('td', {}, a.subGroup),
                h('td', {}, ctx.term(a.name)),
                h('td', {}, a.type === 'ASSET' || a.type === 'EXPENSE' ? 'Debit (Dr.)' : 'Credit (Cr.)'),
              ),
            ),
          ),
        ),
      ),
    );
  }

  function renderVouchersAndClosing(): HTMLElement {
    const tb = ledger.trialBalance();
    const eq = ledger.equation();
    yearMachine.ctx = { role, pending: pendingQueue.length };

    // Calculate net profit from Revenue - Expense balances
    let totalRev = Money.ZERO;
    let totalExp = Money.ZERO;
    for (const a of chart.list()) {
      const bal = ledger.balance(a.id);
      if (a.type === 'REVENUE') totalRev = totalRev.add(bal);
      if (a.type === 'EXPENSE') totalExp = totalExp.add(bal);
    }
    const netProfit = totalRev.sub(totalExp);

    return h(
      'div',
      { class: 'simlab-grid-2' },
      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Maker–Checker Security · Voucher Entry, Adjusting & Year-End Closing'),
        h(
          'div',
          { class: 'modes' },
          h(
            'button',
            {
              type: 'button',
              class: role === 'ACCOUNTANT' ? 'on' : 'secondary',
              'data-cas-role': 'ACCOUNTANT',
              onclick: () => {
                role = 'ACCOUNTANT';
                draw();
              },
            },
            'Role: Accountant (Maker)',
          ),
          h(
            'button',
            {
              type: 'button',
              class: role === 'CHECKER' ? 'on' : 'secondary',
              'data-cas-role': 'CHECKER',
              onclick: () => {
                role = 'CHECKER';
                draw();
              },
            },
            'Role: Checker (Auditor)',
          ),
        ),
        h('p', { class: 'badge-pill' }, `Financial Year State: ${yearMachine.state} · Pending Queue: ${pendingQueue.length}`),
        h(
          'div',
          { class: 'simlab-form-row' },
          h(
            'label',
            {},
            'Debit A/c ',
            h(
              'select',
              {
                onchange: (e: Event) => {
                  vDr = (e.target as HTMLSelectElement).value;
                },
              },
              ...accounts.map(a => h('option', { value: a.id, selected: a.id === vDr }, `${a.code} · ${a.name}`)),
            ),
          ),
          h(
            'label',
            {},
            'Credit A/c ',
            h(
              'select',
              {
                onchange: (e: Event) => {
                  vCr = (e.target as HTMLSelectElement).value;
                },
              },
              ...accounts.map(a => h('option', { value: a.id, selected: a.id === vCr }, `${a.code} · ${a.name}`)),
            ),
          ),
          h(
            'label',
            {},
            'Amount (₹) ',
            h('input', {
              type: 'number',
              min: '500',
              step: '500',
              value: String(vAmt),
              onchange: (e: Event) => {
                vAmt = Math.max(0, Math.round(Number((e.target as HTMLInputElement).value) || 0));
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
              'data-cas-queue': '',
              onclick: () => {
                const vm = new Machine(CAS_VOUCHER, { role, yearClosed: yearMachine.is('CLOSED') });
                const checkRes = vm.send('SAVE');
                if (!checkRes.ok) {
                  statusText = checkRes.reason ?? 'Cannot enter voucher.';
                  draw();
                  return;
                }
                const draft = {
                  date: '2026-04-25',
                  narration: vNarr,
                  lines: [
                    { accountId: vDr, side: 'DR' as Side, amount: Money.rupees(vAmt) },
                    { accountId: vCr, side: 'CR' as Side, amount: Money.rupees(vAmt) },
                  ],
                };
                const issues = validateEntry(draft, chart);
                if (issues.length > 0) {
                  statusText = `Validation Rejected: ${issues[0]!.message}`;
                  draw();
                  return;
                }
                pendingQueue.push({
                  id: `VCH-${pendingQueue.length + 101}`,
                  date: draft.date,
                  narration: draft.narration,
                  drId: vDr,
                  crId: vCr,
                  amount: Money.rupees(vAmt),
                });
                statusText = 'Voucher validated & queued as PENDING. Switch to Checker to verify & post!';
                draw();
              },
            },
            '1. Validate & Save Voucher (Accountant)',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'secondary',
              'data-cas-close-year': '',
              onclick: () => {
                yearMachine.ctx = { role, pending: pendingQueue.length };
                const res = yearMachine.send('CLOSE');
                if (!res.ok) {
                  statusText = res.reason ?? 'Cannot close year.';
                  draw();
                  return;
                }
                // Post closing entry transferring Revenue & Expense into Capital
                const closeLines: { accountId: string; side: Side; amount: Money }[] = [];
                for (const a of chart.list()) {
                  const bal = ledger.balance(a.id);
                  if (bal.isZero()) continue;
                  if (a.type === 'REVENUE') closeLines.push({ accountId: a.id, side: 'DR', amount: bal });
                  if (a.type === 'EXPENSE') closeLines.push({ accountId: a.id, side: 'CR', amount: bal });
                }
                const diff = totalRev.sub(totalExp);
                if (!diff.isZero()) {
                  closeLines.push({
                    accountId: 'capital',
                    side: diff.isPositive() ? 'CR' : 'DR',
                    amount: diff.abs(),
                  });
                }
                if (closeLines.length >= 2) {
                  ledger.post({
                    date: '2027-03-31',
                    narration: 'Year-end closing entry: nominal accounts transferred to Capital',
                    lines: closeLines,
                  });
                }
                statusText = 'Financial year CLOSED! Nominal accounts zeroed into Capital.';
                void ctx.completeMission(`CAS Year-end closing executed: Trial Balance ${R(ledger.trialBalance().totalDebit)} balanced.`);
                draw();
              },
            },
            '3. Run Closing Entry & Close Year (Checker)',
          ),
        ),
        statusText && h('div', { class: 'note info' }, statusText),
        pendingQueue.length > 0 &&
          h(
            'div',
            { class: 'simlab-whatif-box' },
            h('h4', {}, 'Pending Verification Queue'),
            ...pendingQueue.map((pv, i) =>
              h(
                'div',
                { class: 'simlab-draft-row' },
                h('strong', {}, `${pv.id}: Dr ${pv.drId} / Cr ${pv.crId} — ${R(pv.amount)}`),
                h(
                  'button',
                  {
                    type: 'button',
                    'data-cas-verify-vch': '',
                    onclick: () => {
                      const vm = new Machine(CAS_VOUCHER, { role, yearClosed: yearMachine.is('CLOSED') });
                      vm.ctx = { role: 'ACCOUNTANT', yearClosed: false };
                      vm.send('SAVE');
                      vm.ctx = { role, yearClosed: yearMachine.is('CLOSED') };
                      const vr = vm.send('VERIFY');
                      if (!vr.ok) {
                        statusText = vr.reason ?? 'Switch to Checker role first.';
                        draw();
                        return;
                      }
                      ledger.post({
                        date: pv.date,
                        narration: pv.narration,
                        lines: [
                          { accountId: pv.drId, side: 'DR', amount: pv.amount },
                          { accountId: pv.crId, side: 'CR', amount: pv.amount },
                        ],
                      });
                      pendingQueue.splice(i, 1);
                      statusText = `Checker verified & posted ${pv.id} into the immutable ledger!`;
                      void ctx.completeMission(`Maker–Checker voucher ${pv.id} (${R(pv.amount)}) validated, verified, and posted.`);
                      draw();
                    },
                  },
                  '2. Verify & Post',
                ),
              ),
            ),
          ),
      ),

      h(
        'section',
        { class: 'panel simlab-card' },
        h('p', { class: 'eyebrow' }, 'Auto-Generated CAS Statements (Back-End Database Query)'),
        h(
          'div',
          { class: 'simlab-kpi-row' },
          h('div', { class: 'kpi-tile' }, h('small', {}, 'Total Assets'), h('strong', {}, R(eq.assets))),
          h('div', { class: 'kpi-tile' }, h('small', {}, 'Equity + Liabilities'), h('strong', {}, R(eq.liabilities.add(eq.capital)))),
          h('div', { class: 'kpi-tile' }, h('small', {}, 'Current Period P&L'), h('strong', {}, R(netProfit))),
        ),
        h(
          'div',
          { class: 'simtable-wrap' },
          h(
            'table',
            { class: 'simtable' },
            h('caption', {}, 'System-Generated Trial Balance'),
            h('thead', {}, h('tr', {}, h('th', {}, 'Codified Account'), h('th', { class: 'num' }, 'Debit (₹)'), h('th', { class: 'num' }, 'Credit (₹)'))),
            h(
              'tbody',
              {},
              ...tb.rows.map(r =>
                h('tr', {}, h('td', {}, r.account.name), h('td', { class: 'num' }, r.debit.isZero() ? '—' : R(r.debit)), h('td', { class: 'num' }, r.credit.isZero() ? '—' : R(r.credit))),
              ),
            ),
            h('tfoot', {}, h('tr', {}, h('th', {}, 'Total'), h('th', { class: 'num' }, R(tb.totalDebit)), h('th', { class: 'num' }, R(tb.totalCredit)))),
          ),
        ),
      ),
    );
  }

  function renderSpreadsheetGrid(): HTMLElement {
    const ls = loanSchedule({
      principal: Money.rupees(loanPrincipal),
      ratePercent: Fraction.of(loanRate),
      months: loanMonths,
    });
    const depRows = depreciationSchedule({
      cost: Money.rupees(assetCost),
      scrap: Money.rupees(assetScrap),
      method: 'SLM',
      lifeYears: assetLife,
      years: assetLife,
    });
    const cr = currentRatio(Money.rupees(400000), Money.rupees(200000));
    const brs = reconcile(Money.rupees(50000), 'CASH_BOOK', [
      { kind: 'CHEQUE_ISSUED_NOT_PRESENTED', amount: Money.rupees(10000) },
      { kind: 'BANK_CHARGES_NOT_IN_CASH_BOOK', amount: Money.rupees(500) },
    ]);

    return h(
      'section',
      { class: 'panel simlab-card' },
      h('p', { class: 'eyebrow' }, 'Electronic Spreadsheet Visualiser (`XII.C.spreadsheet`)'),
      h(
        'div',
        { class: 'modes' },
        h(
          'button',
          {
            type: 'button',
            class: sheetMode === 'EMI' ? 'on' : 'secondary',
            onclick: () => {
              sheetMode = 'EMI';
              draw();
            },
          },
          'Loan EMI (`=PMT`)',
        ),
        h(
          'button',
          {
            type: 'button',
            class: sheetMode === 'SLN' ? 'on' : 'secondary',
            onclick: () => {
              sheetMode = 'SLN';
              draw();
            },
          },
          'Asset Depreciation (`=SLN`)',
        ),
        h(
          'button',
          {
            type: 'button',
            class: sheetMode === 'RATIO_BRS' ? 'on' : 'secondary',
            onclick: () => {
              sheetMode = 'RATIO_BRS';
              draw();
            },
          },
          'Ratios & BRS Cells',
        ),
      ),
      sheetMode === 'EMI' &&
        h(
          'div',
          {},
          h(
            'div',
            { class: 'simlab-form-row' },
            h(
              'label',
              {},
              `Cell B1 Loan Principal: ${R(Money.rupees(loanPrincipal))} `,
              h('input', {
                type: 'range',
                min: '60000',
                max: '300000',
                step: '30000',
                value: String(loanPrincipal),
                oninput: (e: Event) => {
                  loanPrincipal = Number((e.target as HTMLInputElement).value);
                  draw();
                },
              }),
            ),
            h(
              'label',
              {},
              `Cell B2 Annual Rate: ${loanRate}% `,
              h('input', {
                type: 'range',
                min: '6',
                max: '18',
                step: '2',
                value: String(loanRate),
                oninput: (e: Event) => {
                  loanRate = Number((e.target as HTMLInputElement).value);
                  draw();
                },
              }),
            ),
          ),
          h('p', { class: 'note info' }, `Formula Bar: B5 = ROUND(PMT(B2/12, ${loanMonths}, -B1), 2) → ${R(ls.emi)}/month · Total Interest = ${R(ls.totalInterest)}`),
          h(
            'div',
            { class: 'simtable-wrap' },
            h(
              'table',
              { class: 'simtable spreadsheet-grid' },
              h(
                'thead',
                {},
                h(
                  'tr',
                  {},
                  h('th', {}, 'Row'),
                  h('th', { class: 'num' }, 'A: Opening'),
                  h('th', { class: 'num' }, 'B: =A*Rate/12'),
                  h('th', { class: 'num' }, 'C: =$B$5-B'),
                  h('th', { class: 'num' }, 'D: Closing'),
                ),
              ),
              h(
                'tbody',
                {},
                ...ls.rows.map(r =>
                  h(
                    'tr',
                    {},
                    h('td', {}, `Month ${r.month}`),
                    h('td', { class: 'num' }, R(r.opening)),
                    h('td', { class: 'num' }, R(r.interest)),
                    h('td', { class: 'num' }, R(r.principal)),
                    h('td', { class: 'num' }, R(r.closing)),
                  ),
                ),
              ),
            ),
          ),
        ),
      sheetMode === 'SLN' &&
        h(
          'div',
          {},
          h('p', { class: 'note info' }, `Formula Bar: B4 = SLN(${assetCost}, ${assetScrap}, ${assetLife}) → ${R(depRows[0]!.depreciation)} per year`),
          h(
            'div',
            { class: 'simtable-wrap' },
            h(
              'table',
              { class: 'simtable spreadsheet-grid' },
              h('thead', {}, h('tr', {}, h('th', {}, 'Year'), h('th', { class: 'num' }, 'Opening'), h('th', { class: 'num' }, 'Formula `=$B$4`'), h('th', { class: 'num' }, 'Closing'))),
              h(
                'tbody',
                {},
                ...depRows.map(r =>
                  h('tr', {}, h('td', {}, `Year ${r.year}`), h('td', { class: 'num' }, R(r.opening)), h('td', { class: 'num' }, R(r.depreciation)), h('td', { class: 'num' }, R(r.closing))),
                ),
              ),
            ),
          ),
        ),
      sheetMode === 'RATIO_BRS' &&
        h(
          'div',
          { class: 'simtable-wrap' },
          h(
            'table',
            { class: 'simtable spreadsheet-grid' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Cell'), h('th', {}, 'Metric'), h('th', {}, 'Spreadsheet Formula'), h('th', { class: 'num' }, 'Evaluated Value'))),
            h(
              'tbody',
              {},
              h('tr', {}, h('td', {}, 'C4'), h('td', {}, 'Current Ratio'), h('td', {}, h('code', {}, '=B1/B2')), h('td', { class: 'num' }, cr.display)),
              h('tr', {}, h('td', {}, 'C8'), h('td', {}, 'Pass Book Balance (BRS)'), h('td', {}, h('code', {}, '=D1+D2-D3')), h('td', { class: 'num' }, R(brs.end))),
            ),
          ),
        ),
      h(
        'button',
        {
          type: 'button',
          onclick: () => {
            void ctx.completeMission(`Spreadsheet formulas verified: Loan EMI ${R(ls.emi)}, SLN ${R(depRows[0]!.depreciation)}.`);
          },
        },
        'Verify Spreadsheet Formulas',
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
              class: tab === 'CODIFICATION' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'CODIFICATION';
                draw();
              },
            },
            '1. Account Hierarchy & Codification',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'VOUCHERS' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'VOUCHERS';
                draw();
              },
            },
            '2. Voucher Validation & Closing Entries',
          ),
          h(
            'button',
            {
              type: 'button',
              class: tab === 'SPREADSHEET' ? 'on' : 'secondary',
              onclick: () => {
                tab = 'SPREADSHEET';
                draw();
              },
            },
            '3. Spreadsheet Visualiser (`=PMT`, `=SLN`)',
          ),
        ),
        tab === 'CODIFICATION' ? renderCodification() : tab === 'VOUCHERS' ? renderVouchersAndClosing() : renderSpreadsheetGrid(),
      ),
    );
  }

  draw();
}
