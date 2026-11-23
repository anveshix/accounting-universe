/**
 * The Journal Builder — "learn by doing", made concrete.
 *
 * The trainer asks two dropdown questions. This page is the real thing: pick the accounts, choose the side, type the
 * amount, and watch the entry balance. Compound entries (two debits or two credits) are included on purpose, because
 * that is where students actually get stuck.
 *
 * Everything numeric goes through the engine: accounts from the class XI chart, rupees through `Money`, and each
 * account's rule (why it is Dr or Cr) through `ruleText`. Nothing about money is computed here by hand.
 */
import { Money, type Side } from '../../../../packages/engine/src';
import { starterChartClassXI, type ChartOfAccounts } from '../../../../packages/engine/src';
import { JOURNAL_CASES, parseRupees, sameEntry } from '../../../../packages/curriculum/src/journal';
import { h, mount } from '../dom';
import { announce } from '../ui';
import { ruleText, TYPE_WORD } from '../rules';
import { icon } from '../icons';
import { recordSeen } from '../store';

type Line = { account: string; side: Side; amount: string };
const TYPE_ORDER = ['ASSET', 'LIABILITY', 'CAPITAL', 'DRAWINGS', 'REVENUE', 'EXPENSE'] as const;

export function buildPage(): HTMLElement {
  const chart: ChartOfAccounts = starterChartClassXI();
  const root = h('div', { class: 'builder' });
  let index = 0,
    lines: Line[] = [],
    side: Side = 'DR',
    checked = false,
    correct = false,
    tried = 0,
    solved = 0;

  void recordSeen({ lab: 'xi-journal-builder', tab: 'try', t: Date.now() });
  const current = () => JOURNAL_CASES[index]!;
  const total = (which: Side) => Money.sum(lines.filter(l => l.side === which).map(l => Money.rupees(parseRupees(l.amount) ?? 0)));
  const given = () => lines.filter(l => l.account);

  function reset(next: number) {
    index = next;
    lines = [];
    side = 'DR';
    checked = false;
    correct = false;
    draw();
  }

  function addAccount(id: string) {
    if (checked && correct) return;
    const onThisSide = lines.findIndex(l => !l.account && l.side === side);
    const empty = onThisSide >= 0 ? onThisSide : lines.findIndex(l => !l.account);
    if (empty >= 0) lines[empty] = { ...lines[empty]!, account: id, side };
    else lines.push({ account: id, side, amount: '' });
    checked = false;
    correct = false;
    draw();
  }

  function column(which: Side) {
    const rows = lines.map((l, i) => ({ l, i })).filter(x => x.l.side === which);
    return h(
      'div',
      { class: 'jside ' + (which === 'DR' ? 'jdr' : 'jcr') },
      h('div', { class: 'jside-head' }, h('b', {}, which === 'DR' ? 'Debit (Dr.)' : 'Credit (Cr.)'), h('span', { class: 'hint' }, which === 'DR' ? 'benefit received' : 'benefit given')),
      rows.length === 0
        ? h('p', { class: 'empty small' }, 'No line yet. Choose an account below.')
        : h(
            'ul',
            { class: 'jlines' },
            ...rows.map(({ l, i }) =>
              h(
                'li',
                {},
                h('span', { class: 'jacc' + (l.account ? '' : ' placeholder') }, l.account ? chart.get(l.account).name : 'Choose an account below'),
                h('label', { class: 'sr-only', for: `amt-${i}` }, `Amount in rupees for ${l.account ? chart.get(l.account).name : 'this line'}`),
                h('input', {
                  id: `amt-${i}`,
                  type: 'text',
                  inputmode: 'numeric',
                  placeholder: '₹',
                  value: l.amount,
                  autocomplete: 'off',
                  oninput: (e: Event) => {
                    l.amount = (e.target as HTMLInputElement).value;
                    checked = false;
                    drawTotals();
                  },
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'ghost small',
                    'aria-label': `Remove ${l.account ? chart.get(l.account).name : 'this empty line'}`,
                    onclick: () => {
                      lines = lines.filter((_, k) => k !== i);
                      checked = false;
                      draw();
                    },
                  },
                  '✕',
                ),
              ),
            ),
          ),
      h(
        'button',
        {
          type: 'button',
          class: 'small jadd',
          onclick: () => {
            side = which;
            lines.push({ account: '', side: which, amount: '' });
            draw();
          },
        },
        `+ Add a ${which === 'DR' ? 'debit' : 'credit'} line`,
      ),
    );
  }

  const status = h('p', { class: 'jstatus', 'aria-live': 'polite' });
  function drawTotals() {
    const dr = total('DR'),
      cr = total('CR');
    const diff = dr.sub(cr);
    mount(
      status,
      diff.isZero() && !dr.isZero()
        ? h('span', { class: 'note good' }, icon('check-circle', 15), ` Balanced: Dr ${dr.format()} = Cr ${cr.format()}`)
        : h('span', { class: 'note warn' }, `Dr ${dr.format()} · Cr ${cr.format()} · difference ${diff.abs().format()}`),
    );
  }

  function chips() {
    const box = h('div', { class: 'jchips' });
    for (const type of TYPE_ORDER) {
      const acts = chart.list().filter(a => a.type === type);
      if (!acts.length) continue;
      box.appendChild(
        h(
          'div',
          { class: 'jgroup' },
          h('span', { class: 'jgroup-t' }, TYPE_WORD[type]),
          ...acts.map(a => h('button', { type: 'button', class: 'chip jchip', 'data-account': a.id, title: `${a.name} — ${TYPE_WORD[a.type]}`, onclick: () => addAccount(a.id) }, a.name)),
        ),
      );
    }
    return box;
  }

  function message() {
    if (!checked)
      return h(
        'p',
        { class: 'hint' },
        `Use the buttons above to pick the accounts for the side you are on (${side === 'DR' ? 'Debit' : 'Credit'}), then type each amount. “Check” compares your entry with the marking scheme, not with a machine’s opinion.`,
      );
    if (correct)
      return h(
        'div',
        {},
        h('p', { class: 'note good', role: 'status' }, `✓ Correct entry. ${tried === 1 ? 'First try — well done.' : 'Fixed — that is how it sticks.'}`),
        h('p', {}, current().why),
        h('ul', { class: 'jwhy' }, ...current().lines.map(l => h('li', {}, h('b', {}, `${chart.get(l.account).name} (${l.side === 'DR' ? 'Dr' : 'Cr'})`), ' — ', ruleText(chart, l.account, l.side)))),
      );
    const dr = total('DR'),
      cr = total('CR');
    const hints = [
      current().lines.length !== given().length ? `This entry has ${current().lines.length} line${current().lines.length === 1 ? '' : 's'}; yours has ${given().length}.` : null,
      !dr.equals(cr) ? `Your debits and credits are ${dr.sub(cr).abs().format()} apart — an entry must balance before anything else can be right.` : null,
      `Check the side of each account: assets and expenses rise on the debit side; liabilities, capital and income rise on the credit side.`,
    ].filter((x): x is string => !!x);
    return h('div', {}, h('p', { class: 'note bad', role: 'status' }, 'Not quite yet.'), h('ul', { class: 'jwhy' }, ...hints.map(x => h('li', {}, x))));
  }

  function draw() {
    const c = current();
    mount(
      root,
      h(
        'header',
        { class: 'labhead' },
        h('p', { class: 'eyebrow' }, 'Class XI · Journal'),
        h('h2', {}, 'Journal Builder'),
        h('p', { class: 'lead' }, 'Post the entry yourself: pick the accounts, choose the side, type the amounts. The entry must balance before it can be right.'),
        h('p', { class: 'hint' }, 'Every amount is checked against the marking scheme. A wrong answer is useful here — the feedback tells you which part to look at again, not just “wrong”.'),
      ),
      h('p', { class: 'eyebrow' }, `Entry ${index + 1} of ${JOURNAL_CASES.length} · solved ${solved}`),
      h(
        'section',
        { class: 'panel case' },
        h('p', { class: 'stem' }, c.text),
        h('p', { class: 'hint' }, c.prompt),
        h('div', { class: 'jboard' }, column('DR'), column('CR')),
        status,
        h(
          'div',
          { class: 'actions' },
          h(
            'button',
            {
              type: 'button',
              class: 'primary',
              disabled: checked && correct,
              onclick: () => {
                tried++;
                checked = true;
                correct = sameEntry(given(), c.lines);
                if (correct) {
                  solved++;
                  announce('Correct entry');
                } else announce('Not quite yet');
                draw();
              },
            },
            'Check entry',
          ),
          checked && !correct
            ? h(
                'button',
                {
                  type: 'button',
                  onclick: () => {
                    lines = [];
                    checked = false;
                    draw();
                  },
                },
                'Clear and try again',
              )
            : null,
          correct && index + 1 < JOURNAL_CASES.length
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'primary',
                  onclick: () => {
                    tried = 0;
                    reset(index + 1);
                  },
                },
                'Next entry →',
              )
            : null,
          correct && index + 1 === JOURNAL_CASES.length ? h('a', { class: 'button primary', href: '#/practice/journal-entry' }, 'All eight done — try a practice question →') : null,
        ),
        message(),
      ),
      h(
        'section',
        { class: 'panel' },
        h(
          'div',
          { class: 'jside-switch', role: 'group', 'aria-label': 'Which side are you adding?' },
          h(
            'button',
            {
              type: 'button',
              class: 'small' + (side === 'DR' ? ' primary' : ''),
              'aria-pressed': String(side === 'DR'),
              onclick: () => {
                side = 'DR';
                draw();
              },
            },
            'Adding to Debit',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'small' + (side === 'CR' ? ' primary' : ''),
              'aria-pressed': String(side === 'CR'),
              onclick: () => {
                side = 'CR';
                draw();
              },
            },
            'Adding to Credit',
          ),
        ),
        h('h3', {}, 'Accounts'),
        h('p', { class: 'hint' }, 'Tap an account to add it to the side you are on. Tap the same account twice only if the entry really needs it twice.'),
        chips(),
      ),
    );
    drawTotals(); // the totals line must be live from the first paint, not only after typing
  }

  reset(0);
  return root;
}
