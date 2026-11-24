/**
 * Experience B — Journal & Ledger Posting Lab (`XI.2.journal`, `XI.2.ledger`, `XI.2.vouchers`)
 * Powered by `Ledger`, `ChartOfAccounts`, `starterChartClassXI`, and `validateEntry` in `packages/engine`.
 */
import { Ledger, Money, starterChartClassXI, validateEntry, type DraftEntry, type DraftLine, type Side } from '../../../../packages/engine/src';
import type { SimDifficulty } from '../../../../packages/curriculum/src';
import { h, mount } from '../dom';
import { createPlaybackBar, type SimShellContext } from './shell';

const R = (m: Money) => m.format();

interface JournalPreset {
  readonly tier: SimDifficulty;
  readonly prompt: string;
  readonly seedEntries: readonly DraftEntry[];
  readonly draftToBuild: DraftEntry;
  readonly expectedLines: readonly { readonly accountId: string; readonly side: Side; readonly amount: Money }[];
}

const PRESETS: readonly JournalPreset[] = [
  {
    tier: 'BEGINNER',
    prompt: 'Post Cash deposited into Bank (₹30,000) after Capital ₹80,000 is introduced.',
    seedEntries: [
      {
        date: '2026-04-01',
        narration: 'Started business with cash ₹80,000',
        lines: [
          { accountId: 'cash', side: 'DR', amount: Money.rupees(80000) },
          { accountId: 'capital', side: 'CR', amount: Money.rupees(80000) },
        ],
      },
    ],
    draftToBuild: {
      date: '2026-04-03',
      narration: 'Deposited cash into bank',
      lines: [
        { accountId: 'bank', side: 'DR', amount: Money.rupees(30000) },
        { accountId: 'cash', side: 'CR', amount: Money.rupees(30000) },
      ],
    },
    expectedLines: [
      { accountId: 'bank', side: 'DR', amount: Money.rupees(30000) },
      { accountId: 'cash', side: 'CR', amount: Money.rupees(30000) },
    ],
  },
  {
    tier: 'PRACTICE',
    prompt: 'Record settlement from Debtors: Cheque ₹24,500 received and Discount Allowed ₹500 (on ₹25,000 credit sale).',
    seedEntries: [
      {
        date: '2026-04-01',
        narration: 'Started business with cash ₹50,000',
        lines: [
          { accountId: 'cash', side: 'DR', amount: Money.rupees(50000) },
          { accountId: 'capital', side: 'CR', amount: Money.rupees(50000) },
        ],
      },
      {
        date: '2026-04-05',
        narration: 'Sold goods on credit to Debtors',
        lines: [
          { accountId: 'debtors', side: 'DR', amount: Money.rupees(25000) },
          { accountId: 'sales', side: 'CR', amount: Money.rupees(25000) },
        ],
      },
    ],
    draftToBuild: {
      date: '2026-04-10',
      narration: 'Cheque received from Debtors in full settlement',
      lines: [
        { accountId: 'bank', side: 'DR', amount: Money.rupees(24500) },
        { accountId: 'debtors', side: 'CR', amount: Money.rupees(25000) },
      ],
    },
    expectedLines: [
      { accountId: 'bank', side: 'DR', amount: Money.rupees(24500) },
      { accountId: 'discount-allowed', side: 'DR', amount: Money.rupees(500) },
      { accountId: 'debtors', side: 'CR', amount: Money.rupees(25000) },
    ],
  },
  {
    tier: 'CHALLENGE',
    prompt: 'Build the compound Opening Entry: Cash ₹20,000, Machinery ₹60,000, Creditors ₹15,000, and Capital ₹65,000.',
    seedEntries: [],
    draftToBuild: {
      date: '2026-04-01',
      narration: 'Assets and liabilities brought forward (Opening Entry)',
      lines: [
        { accountId: 'cash', side: 'DR', amount: Money.rupees(20000) },
        { accountId: 'machinery', side: 'DR', amount: Money.rupees(60000) },
        { accountId: 'creditors', side: 'CR', amount: Money.rupees(15000) },
      ],
    },
    expectedLines: [
      { accountId: 'cash', side: 'DR', amount: Money.rupees(20000) },
      { accountId: 'machinery', side: 'DR', amount: Money.rupees(60000) },
      { accountId: 'creditors', side: 'CR', amount: Money.rupees(15000) },
      { accountId: 'capital', side: 'CR', amount: Money.rupees(65000) },
    ],
  },
  {
    tier: 'MASTER',
    prompt: 'Post Wages ₹8,000 and Drawings ₹4,000 paid in cash (compound payment) and verify the Trial Balance.',
    seedEntries: [
      {
        date: '2026-04-01',
        narration: 'Capital introduced in cash ₹1,00,000',
        lines: [
          { accountId: 'cash', side: 'DR', amount: Money.rupees(100000) },
          { accountId: 'capital', side: 'CR', amount: Money.rupees(100000) },
        ],
      },
      {
        date: '2026-04-04',
        narration: 'Purchased goods on credit ₹35,000',
        lines: [
          { accountId: 'purchases', side: 'DR', amount: Money.rupees(35000) },
          { accountId: 'creditors', side: 'CR', amount: Money.rupees(35000) },
        ],
      },
      {
        date: '2026-04-08',
        narration: 'Cash sales ₹52,000',
        lines: [
          { accountId: 'cash', side: 'DR', amount: Money.rupees(52000) },
          { accountId: 'sales', side: 'CR', amount: Money.rupees(52000) },
        ],
      },
    ],
    draftToBuild: {
      date: '2026-04-12',
      narration: 'Paid wages and personal drawings in cash',
      lines: [
        { accountId: 'wages', side: 'DR', amount: Money.rupees(8000) },
        { accountId: 'cash', side: 'CR', amount: Money.rupees(12000) },
      ],
    },
    expectedLines: [
      { accountId: 'wages', side: 'DR', amount: Money.rupees(8000) },
      { accountId: 'drawings', side: 'DR', amount: Money.rupees(4000) },
      { accountId: 'cash', side: 'CR', amount: Money.rupees(12000) },
    ],
  },
];

function makeChart() {
  const c = starterChartClassXI();
  if (!c.has('discount-allowed')) {
    c.add({ id: 'discount-allowed', name: 'Discount Allowed', type: 'EXPENSE' });
  }
  return c;
}

export function renderJournalLedgerLab(stage: HTMLElement, ctx: SimShellContext): void {
  const chart = makeChart();
  let ledger = new Ledger(chart);
  let draftDate = '2026-04-03';
  let draftNarration = '';
  let draftLines: DraftLine[] = [];
  let visibleEntries = 1;
  let playing = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let selectedAccount = 'cash';
  let feedbackMsg: HTMLElement | null = null;

  const stopTimer = () => {
    playing = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
  ctx.addCleanup(stopTimer);

  const loadPreset = () => {
    stopTimer();
    const p = PRESETS.find(x => x.tier === ctx.getDifficulty()) ?? PRESETS[0]!;
    ledger = new Ledger(chart);
    for (const e of p.seedEntries) ledger.post(e);
    draftDate = p.draftToBuild.date;
    draftNarration = p.draftToBuild.narration;
    draftLines = p.draftToBuild.lines.map(l => ({ ...l }));
    visibleEntries = ledger.entries().length;
    selectedAccount = 'cash';
    feedbackMsg = null;
  };
  loadPreset();
  ctx.onChange(() => {
    loadPreset();
    draw();
  });

  function buildScopedLedger(): Ledger {
    const scoped = new Ledger(chart);
    for (const e of ledger.entries().slice(0, visibleEntries)) {
      scoped.post({ date: e.date, narration: e.narration, lines: e.lines });
    }
    return scoped;
  }

  function draw() {
    const preset = PRESETS.find(x => x.tier === ctx.getDifficulty()) ?? PRESETS[0]!;
    const currentDraft: DraftEntry = {
      date: draftDate,
      narration: draftNarration,
      lines: draftLines,
    };
    const issues = validateEntry(currentDraft, chart);
    const totalDr = Money.sum(draftLines.filter(l => l.side === 'DR').map(l => l.amount));
    const totalCr = Money.sum(draftLines.filter(l => l.side === 'CR').map(l => l.amount));

    const scoped = buildScopedLedger();
    const tb = scoped.trialBalance();
    const allEntries = ledger.entries();

    const activeAccounts = chart.list().filter(a => scoped.tAccount(a.id).length > 0);
    if (activeAccounts.length > 0 && !activeAccounts.some(a => a.id === selectedAccount)) {
      selectedAccount = activeAccounts[0]!.id;
    }

    const renderTAccount = (accountId: string) => {
      const acct = chart.get(accountId);
      const rows = scoped.tAccount(accountId);
      const drRows = rows.filter(r => r.side === 'DR');
      const crRows = rows.filter(r => r.side === 'CR');
      const drSum = Money.sum(drRows.map(r => r.amount));
      const crSum = Money.sum(crRows.map(r => r.amount));
      const diff = drSum.sub(crSum);
      const foot = drSum.cmp(crSum) >= 0 ? drSum : crSum;

      return h(
        'div',
        { class: 'simlab-taccount' + (accountId === selectedAccount ? ' focus' : ''), 'data-taccount': accountId },
        h('div', { class: 'simlab-taccount-head' }, h('span', {}, 'Dr.'), h('strong', {}, `${ctx.term(acct.name)} A/c (${acct.type})`), h('span', {}, 'Cr.')),
        h(
          'div',
          { class: 'simlab-taccount-grid' },
          h(
            'div',
            { class: 't-side dr' },
            ...drRows.map(r => h('div', { class: 't-row' }, h('span', {}, `To ${r.narration.slice(0, 22)} (${r.entryId})`), h('b', {}, R(r.amount)))),
            diff.isNegative() && h('div', { class: 't-row bal-cd' }, h('span', {}, `To ${ctx.term('Balance c/d', 'शेष c/d')}`), h('b', {}, R(diff.abs()))),
            h('div', { class: 't-foot' }, h('span', {}, 'Total'), h('b', {}, R(foot))),
            diff.isPositive() && h('div', { class: 't-row bal-bd' }, h('span', {}, 'To Balance b/d'), h('b', {}, R(diff))),
          ),
          h(
            'div',
            { class: 't-side cr' },
            ...crRows.map(r => h('div', { class: 't-row' }, h('span', {}, `By ${r.narration.slice(0, 22)} (${r.entryId})`), h('b', {}, R(r.amount)))),
            diff.isPositive() && h('div', { class: 't-row bal-cd' }, h('span', {}, `By ${ctx.term('Balance c/d', 'शेष c/d')}`), h('b', {}, R(diff))),
            h('div', { class: 't-foot' }, h('span', {}, 'Total'), h('b', {}, R(foot))),
            diff.isNegative() && h('div', { class: 't-row bal-bd' }, h('span', {}, 'By Balance b/d'), h('b', {}, R(diff.abs()))),
          ),
        ),
      );
    };

    mount(
      stage,
      h(
        'div',
        { class: 'simlab-grid-2' },
        // Left: Interactive Journal Builder
        h(
          'section',
          { class: 'panel simlab-card' },
          h('p', { class: 'eyebrow' }, 'Book of Original Entry · Live Dr = Cr Validation'),
          h('h3', {}, preset.prompt),
          h(
            'div',
            { class: 'simlab-form-row' },
            h(
              'label',
              {},
              'Voucher Date ',
              h('input', {
                type: 'date',
                value: draftDate,
                onchange: (e: Event) => {
                  draftDate = (e.target as HTMLInputElement).value;
                  draw();
                },
              }),
            ),
            h(
              'label',
              { class: 'grow' },
              'Narration (Being…) ',
              h('input', {
                type: 'text',
                value: draftNarration,
                onchange: (e: Event) => {
                  draftNarration = (e.target as HTMLInputElement).value;
                  draw();
                },
              }),
            ),
          ),
          h(
            'div',
            { class: 'simlab-journal-lines', 'data-journal-builder': '' },
            ...draftLines.map((ln, idx) =>
              h(
                'div',
                { class: 'simlab-jline ' + ln.side.toLowerCase() },
                h(
                  'select',
                  {
                    'aria-label': `Line ${idx + 1} side`,
                    onchange: (e: Event) => {
                      draftLines[idx] = { ...ln, side: (e.target as HTMLSelectElement).value as Side };
                      draw();
                    },
                  },
                  h('option', { value: 'DR', selected: ln.side === 'DR' }, 'Dr.'),
                  h('option', { value: 'CR', selected: ln.side === 'CR' }, 'Cr.'),
                ),
                h(
                  'select',
                  {
                    'aria-label': `Line ${idx + 1} account`,
                    onchange: (e: Event) => {
                      draftLines[idx] = { ...ln, accountId: (e.target as HTMLSelectElement).value };
                      draw();
                    },
                  },
                  ...chart.list().map(a => h('option', { value: a.id, selected: a.id === ln.accountId }, `${ctx.term(a.name)} (${a.type})`)),
                ),
                h('input', {
                  type: 'number',
                  min: '0',
                  step: '100',
                  value: String(Number(ln.amount.paise) / 100),
                  'aria-label': `Line ${idx + 1} amount`,
                  onchange: (e: Event) => {
                    const v = Math.max(0, Math.round(Number((e.target as HTMLInputElement).value) || 0));
                    draftLines[idx] = { ...ln, amount: Money.rupees(v) };
                    draw();
                  },
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'secondary simlab-mini-btn',
                    disabled: draftLines.length <= 2,
                    onclick: () => {
                      draftLines.splice(idx, 1);
                      draw();
                    },
                  },
                  '×',
                ),
              ),
            ),
          ),
          h(
            'div',
            { class: 'simlab-totals-strip ' + (issues.length === 0 ? 'ok' : 'warn') },
            h('span', {}, `Total Dr: ${R(totalDr)}`),
            h('span', {}, `Total Cr: ${R(totalCr)}`),
            h('strong', {}, issues.length === 0 ? '✓ Ready to post into Ledger' : `⚠ ${issues[0]!.message}`),
          ),
          h(
            'div',
            { class: 'simlab-action-row' },
            h(
              'button',
              {
                type: 'button',
                class: 'secondary',
                onclick: () => {
                  draftLines.push({ accountId: 'capital', side: 'CR', amount: Money.rupees(5000) });
                  draw();
                },
              },
              '+ Add Journal Line',
            ),
            h(
              'button',
              {
                type: 'button',
                'data-post-entry': '',
                disabled: issues.length > 0,
                onclick: () => {
                  const posted = ledger.post(currentDraft);
                  visibleEntries = ledger.entries().length;
                  selectedAccount = posted.lines[0]?.accountId ?? 'cash';
                  const matchesMission =
                    preset.expectedLines.length === posted.lines.length &&
                    preset.expectedLines.every(exp => posted.lines.some(pl => pl.accountId === exp.accountId && pl.side === exp.side && pl.amount.equals(exp.amount)));
                  if (matchesMission) {
                    feedbackMsg = h('div', { class: 'note good' }, `✓ Posted ${posted.id} into ${posted.lines.length} T-accounts! Trial Balance agrees at ${R(ledger.trialBalance().totalDebit)}.`);
                    void ctx.completeMission(`Journal entry ${posted.id} posted and balanced across T-accounts (${R(totalDr)}).`);
                  } else {
                    feedbackMsg = h('div', { class: 'note info' }, `Posted ${posted.id} (${R(totalDr)}). Compare with the mission target lines to earn the mission badge.`);
                  }
                  draw();
                },
              },
              'Post to Ledger →',
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'secondary',
                onclick: () => {
                  draftLines = preset.expectedLines.map(l => ({ ...l }));
                  draw();
                },
              },
              'Fill Mission Entry',
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'secondary',
                onclick: () => {
                  loadPreset();
                  draw();
                },
              },
              'Reset Books',
            ),
          ),
          feedbackMsg,

          // Journal Book History
          h('h4', {}, `Posted Journal (${visibleEntries} of ${allEntries.length} visible)`),
          createPlaybackBar({
            totalSteps: allEntries.length,
            currentStep: visibleEntries,
            playing,
            label: 'Animated journal-to-ledger posting playback',
            onReset: () => {
              stopTimer();
              visibleEntries = 0;
              draw();
            },
            onStepChange: step => {
              stopTimer();
              visibleEntries = step;
              draw();
            },
            onTogglePlay: () => {
              if (playing) {
                stopTimer();
                draw();
                return;
              }
              if (visibleEntries >= allEntries.length) visibleEntries = 0;
              playing = true;
              draw();
              timer = setInterval(() => {
                if (visibleEntries < allEntries.length) {
                  visibleEntries++;
                  draw();
                } else {
                  stopTimer();
                  draw();
                }
              }, 950);
            },
          }),
          h(
            'div',
            { class: 'simlab-journal-book' },
            ...allEntries
              .slice(0, visibleEntries)
              .map(e =>
                h(
                  'div',
                  { class: 'simlab-posted-entry' },
                  h('div', { class: 'je-meta' }, h('b', {}, e.id), ` · ${e.date} — ${e.narration}`),
                  ...e.lines.map(l =>
                    h(
                      'div',
                      { class: 'je-line ' + l.side.toLowerCase() },
                      h('span', {}, l.side === 'DR' ? `${ctx.term(chart.get(l.accountId).name)} A/c ... Dr.` : `To ${ctx.term(chart.get(l.accountId).name)} A/c`),
                      h('strong', {}, R(l.amount)),
                    ),
                  ),
                ),
              ),
          ),
        ),

        // Right: Dynamic T-Accounts + 1-2-3 Balancing + Live Trial Balance
        h(
          'section',
          { class: 'panel simlab-card' },
          h('p', { class: 'eyebrow' }, 'Dynamic Ledger Posting · Auto c/d & b/d Balancing'),
          h('h3', {}, 'T-Accounts & Extracted Trial Balance'),
          h(
            'div',
            { class: 'simlab-chip-bar', role: 'group', 'aria-label': 'Filter ledger account' },
            ...activeAccounts.map(a =>
              h(
                'button',
                {
                  type: 'button',
                  class: a.id === selectedAccount ? 'on' : 'secondary',
                  onclick: () => {
                    selectedAccount = a.id;
                    draw();
                  },
                },
                ctx.term(a.name),
              ),
            ),
          ),
          activeAccounts.length > 0
            ? h('div', { class: 'simlab-taccounts-stack' }, ...activeAccounts.map(a => renderTAccount(a.id)))
            : h('p', { class: 'hint' }, 'Step forward or post a journal entry to watch ledger T-accounts populate.'),
          h(
            'div',
            { class: 'simlab-steps-note note info' },
            h('b', {}, '3-Step Ledger Balancing Rule: '),
            '1. Total both Dr & Cr sides · 2. Put the larger total in both foot boxes · 3. Write Balance c/d on the lighter side, then bring it down as Balance b/d on the heavier side!',
          ),
          h(
            'div',
            { class: 'simtable-wrap' },
            h(
              'table',
              { class: 'simtable' },
              h('caption', {}, 'Trial Balance (Balance Method)'),
              h('thead', {}, h('tr', {}, h('th', {}, 'Ledger Account'), h('th', { class: 'num' }, 'Debit (₹)'), h('th', { class: 'num' }, 'Credit (₹)'))),
              h(
                'tbody',
                {},
                ...tb.rows.map(r =>
                  h('tr', {}, h('td', {}, ctx.term(r.account.name)), h('td', { class: 'num' }, r.debit.isZero() ? '—' : R(r.debit)), h('td', { class: 'num' }, r.credit.isZero() ? '—' : R(r.credit))),
                ),
              ),
              h('tfoot', {}, h('tr', {}, h('th', {}, tb.balanced ? 'Total (Agrees ✓)' : 'Total'), h('th', { class: 'num' }, R(tb.totalDebit)), h('th', { class: 'num' }, R(tb.totalCredit)))),
            ),
          ),
        ),
      ),
    );
  }

  draw();
}
