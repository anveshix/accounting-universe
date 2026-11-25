/**
 * Classroom TLM Factory (#/tlm, #/tlm/<topic>, #/tlm/<topic>-s<seed>, #/tlm/<topic>-s<seed>-play).
 * One syllabus topic -> smartboard demonstration, prediction questions, printable A4 cards, worksheet and answer key, and a
 * student activity reachable from a link. All content comes from the pure kit builder in packages/curriculum/src/tlm.ts.
 */
import { Machine, starterChartClassXI } from '../../../../packages/engine/src';
import { TLM_STAGE, TLM_TOPICS, buildTlmKit, tlmTopic, type TlmKit, type TlmTopic } from '../../../../packages/curriculum/src';
import { h, mount } from '../dom';
import { onDispose, track, unregister } from '../machine-dom';
import { recordAttempt } from '../store';
import { announce } from '../ui';

const ID = /^(XI\.2\.[a-z]+)(?:-s(\d{1,9}))?(-play)?$/;
const newSeed = () => 1 + Math.floor(Math.random() * 99999);
const linkFor = (kit: TlmKit, play = false) => `${location.href.split('#')[0]}#/tlm/${kit.topic.id}-s${kit.seed}${play ? '-play' : ''}`;

export function tlmPage(arg?: string): HTMLElement {
  if (!arg) return hub();
  const m = ID.exec(arg),
    topic = m ? tlmTopic(m[1]!) : undefined;
  if (!m || !topic)
    return h(
      'div',
      { class: 'panel' },
      h('h2', {}, 'No classroom kit for that topic'),
      h('p', {}, 'Kits exist for the topics listed on the Classroom TLM page.'),
      h('a', { href: '#/tlm' }, 'See the available kits'),
    );
  const kit = buildTlmKit(topic.id as TlmTopic, m[2] ? Number(m[2]) : newSeed());
  return m[3] ? studentActivity(kit) : kitPage(kit);
}

function hub(): HTMLElement {
  return h(
    'div',
    { class: 'tlm' },
    h(
      'header',
      { class: 'labhead' },
      h('p', { class: 'eyebrow' }, 'Classroom TLM'),
      h('h2', {}, 'Teaching material in one click'),
      h(
        'p',
        { class: 'lead' },
        'Pick a topic. You get a full-screen smartboard demonstration, prediction questions, printable A4 cards, a worksheet with its answer key, and a link students can open. Every figure is computed by the accounting engine and re-checked before it is shown.',
      ),
    ),
    h(
      'div',
      { class: 'cards' },
      ...TLM_TOPICS.map(t =>
        h('a', { class: 'card', href: `#/tlm/${t.id}`, 'data-tlm-topic': t.id }, h('span', { class: 'chip' }, 'Class XI · Accounting Process'), h('h3', {}, t.title), h('p', {}, t.task)),
      ),
    ),
    h(
      'section',
      { class: 'panel' },
      h('h3', {}, 'Also for teachers'),
      h(
        'p',
        {},
        'See how a class is doing and which mistakes are common on the ',
        h('a', { href: '#/teacher' }, 'Teacher dashboard'),
        '. Chapter materials you have filed are under ',
        h('a', { href: '#/materials' }, 'Notes and materials'),
        '.',
      ),
    ),
    h('p', { class: 'hint' }, 'More topics will follow, one reviewed kit at a time. A new kit only appears here after its answers have been checked against hand-worked figures.'),
  );
}

// ─────────────────────────── teacher page: controls + print sheets + smartboard ───────────────────────────
function kitPage(kit: TlmKit): HTMLElement {
  const root = h('div', { class: 'tlm', 'data-tlm-kit': kit.topic.id, 'data-seed': String(kit.seed) });
  const mode = kit.topic.mode;
  const printBtn = (what: string, label: string) => h('button', { type: 'button', class: 'secondary', 'data-print-btn': what, onclick: () => printSheet(what) }, label);
  const link = linkFor(kit, true);
  const copied = h('span', { class: 'hint', role: 'status' });
  const stage = h('div', { class: 'tlm-stage', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Smartboard demonstration' });
  const open = () => openStage(kit, stage);
  root.append(
    h(
      'header',
      { class: 'labhead tlm-head' },
      h('p', { class: 'eyebrow' }, `Class XI · ${kit.topic.id}`),
      h('h2', {}, kit.topic.title),
      h('p', { class: 'lead' }, kit.topic.task),
      h('p', { class: 'hint' }, `Set number ${kit.seed}. The same number always gives the same transactions, so you can reprint the answer key later.`),
    ),
    h(
      'section',
      { class: 'panel tlm-controls' },
      h(
        'div',
        { class: 'actions' },
        h('button', { type: 'button', class: 'primary', 'data-tlm-present': '', onclick: open }, 'Start smartboard demonstration'),
        h(
          'button',
          {
            type: 'button',
            class: 'secondary',
            onclick: () => {
              location.hash = `#/tlm/${kit.topic.id}-s${newSeed()}`;
            },
          },
          'New set of transactions',
        ),
      ),
      h('h3', {}, 'Print (A4)'),
      h(
        'div',
        { class: 'actions' },
        printBtn('worksheet', 'Worksheet'),
        printBtn('key', 'Answer key'),
        printBtn('match', 'Matching cards'),
        printBtn('txncards', 'Transaction cards only'),
        printBtn('acctcards', 'Account cards only'),
      ),
      h('h3', {}, 'Student activity'),
      h('p', {}, 'Students open this link on any phone or laptop and classify the same ten transactions. Share it on the board, a class group or a printed slip.'),
      h(
        'div',
        { class: 'actions' },
        h('input', { class: 'tlm-link', type: 'text', readonly: true, value: link, 'aria-label': 'Student activity link', onfocus: (e: Event) => (e.target as HTMLInputElement).select() }),
        h(
          'button',
          {
            type: 'button',
            class: 'secondary',
            onclick: () => {
              void navigator.clipboard?.writeText(link).then(
                () => {
                  copied.textContent = 'Link copied.';
                },
                () => {
                  copied.textContent = 'Select the link and copy it.';
                },
              );
            },
          },
          'Copy link',
        ),
        h('a', { class: 'button secondary', href: `#/tlm/${kit.topic.id}-s${kit.seed}-play`, target: '_blank', rel: 'noopener' }, 'Preview as a student'),
        copied,
      ),
    ),
    h(
      'section',
      { class: 'panel' },
      h('h3', {}, 'Teacher prediction questions'),
      h('p', { class: 'hint' }, 'Ask first, let the class commit to an answer, then reveal.'),
      h(
        'ol',
        { class: 'tlm-preds' },
        ...kit.predictions.map(p => h('li', {}, h('p', {}, p.q), h('details', {}, h('summary', {}, 'Answer'), h('p', {}, h('b', {}, p.a)), h('p', { class: 'hint' }, p.why)))),
      ),
    ),
    h('div', { class: 'tlm-sheets', 'aria-label': 'Print preview' }, worksheetSheet(kit, mode, false), worksheetSheet(kit, mode, true), txnCardsSheet(kit), acctCardsSheet(kit)),
    stage,
  );
  return root;
}

function printSheet(what: string) {
  document.body.setAttribute('data-print', what);
  const done = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
}

const sheetHead = (kit: TlmKit, what: string) => h('div', { class: 'sheet-head' }, h('b', {}, `Accounting Universe · Class XI · ${kit.topic.title}`), h('span', {}, `${what} · Set ${kit.seed}`));
const nameLine = () => h('p', { class: 'sheet-name' }, 'Name: ______________________  Class/Section: __________  Date: ____________');
const blank = (cls = '') => h('td', { class: 'blank ' + cls }, ' ');

function worksheetSheet(kit: TlmKit, mode: TlmKit['topic']['mode'], key: boolean): HTMLElement {
  const sheet = h(
    'section',
    { class: 'sheet', 'data-sheet': key ? 'key' : 'worksheet' },
    sheetHead(kit, key ? 'Answer key' : 'Worksheet'),
    key ? null : nameLine(),
    h('p', { class: 'sheet-task' }, h('b', {}, key ? 'Answers. ' : 'Task. '), kit.topic.task),
  );
  const T = kit.txns;
  if (mode === 'rules') {
    sheet.append(
      h(
        'table',
        { class: 'sheet-table' },
        h('thead', {}, h('tr', {}, h('th', {}, 'No.'), h('th', {}, 'Transaction'), h('th', {}, 'Debit'), h('th', {}, 'Credit'))),
        h(
          'tbody',
          {},
          ...T.map(t =>
            h('tr', {}, h('td', {}, String(t.no)), h('td', {}, t.text), key ? h('td', {}, `${t.dr.name} (${t.dr.nature})`) : blank(), key ? h('td', {}, `${t.cr.name} (${t.cr.nature})`) : blank()),
          ),
        ),
      ),
    );
    if (key) sheet.append(h('ol', { class: 'sheet-why' }, ...T.map(t => h('li', {}, t.why))));
  } else if (mode === 'journal') {
    for (const t of T)
      sheet.append(
        h(
          'div',
          { class: 'jentry' },
          h('p', {}, h('b', {}, `${t.no}. `), t.text),
          h(
            'table',
            { class: 'sheet-table' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Particulars'), h('th', {}, 'L.F.'), h('th', {}, 'Dr. (₹)'), h('th', {}, 'Cr. (₹)'))),
            h(
              'tbody',
              {},
              ...(key
                ? [
                    h('tr', {}, h('td', {}, t.date), h('td', {}, `${t.dr.name} A/c ........ Dr.`), h('td', {}), h('td', { class: 'num' }, t.amount.format()), h('td', {})),
                    h('tr', {}, h('td', {}), h('td', { class: 'indent' }, `To ${t.cr.name} A/c`), h('td', {}), h('td', {}), h('td', { class: 'num' }, t.amount.format())),
                    h('tr', {}, h('td', {}), h('td', { class: 'narr' }, `(Being ${narration(t.text)})`), h('td', {}), h('td', {}), h('td', {})),
                  ]
                : [h('tr', {}, blank(), blank(), blank(), blank(), blank()), h('tr', {}, blank(), blank(), blank(), blank(), blank()), h('tr', {}, blank(), blank(), blank(), blank(), blank())]),
            ),
          ),
        ),
      );
  } else if (mode === 'ledger') {
    if (!key) {
      sheet.append(
        h('h4', {}, 'Journal (given)'),
        journalGiven(kit),
        h('h4', {}, 'Post to these ledger accounts and balance them'),
        h('div', { class: 'tgrid' }, ...kit.ledger.map(l => h('div', { class: 'tacct' }, h('p', { class: 'tacct-name' }, `${l.account.name} A/c`), tAcctBlank(Math.max(2, l.rows.length))))),
      );
    } else sheet.append(h('div', { class: 'tgrid' }, ...kit.ledger.map(l => tAcctFilled(l))));
  } else {
    const rows = [...kit.trialBalance.rows];
    if (!key) {
      const shuffled = rows
        .map(r => ({ r, k: ((r.account.id.length * 7 + kit.seed) * 2654435761) % 1000 }))
        .sort((a, b) => a.k - b.k)
        .map(x => x.r);
      sheet.append(
        h('h4', {}, 'Closing balances in the ledger'),
        h(
          'table',
          { class: 'sheet-table' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Account'), h('th', {}, 'Balance (₹)'))),
          h('tbody', {}, ...shuffled.map(r => h('tr', {}, h('td', {}, `${r.account.name} (${r.account.nature})`), h('td', { class: 'num' }, r.debit.isZero() ? r.credit.format() : r.debit.format())))),
        ),
        h('h4', {}, 'Trial balance as at 30 April 2026'),
        tbTable(rows, false, kit),
      );
    } else
      sheet.append(
        tbTable(rows, true, kit),
        h(
          'p',
          { class: 'hint' },
          'Assets, expenses and drawings carry debit balances; capital, liabilities and income carry credit balances. Equal totals mean the books agree arithmetically; they do not prove every error is absent.',
        ),
      );
  }
  return sheet;
}
const narration = (text: string) => text.charAt(0).toLowerCase() + text.slice(1).replace(/\.$/, '');
function journalGiven(kit: TlmKit): HTMLElement {
  return h(
    'table',
    { class: 'sheet-table' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Particulars'), h('th', {}, 'Dr. (₹)'), h('th', {}, 'Cr. (₹)'))),
    h(
      'tbody',
      {},
      ...kit.txns.flatMap(t => [
        h('tr', {}, h('td', {}, t.date), h('td', {}, `${t.dr.name} A/c ........ Dr.`), h('td', { class: 'num' }, t.amount.format()), h('td', {})),
        h('tr', {}, h('td', {}), h('td', { class: 'indent' }, `To ${t.cr.name} A/c`), h('td', {}), h('td', { class: 'num' }, t.amount.format())),
      ]),
    ),
  );
}
function tAcctBlank(n: number): HTMLElement {
  const row = () => h('tr', {}, blank(), blank(), blank(), blank(), blank(), blank());
  return h(
    'table',
    { class: 'sheet-table t' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Particulars'), h('th', {}, '₹'), h('th', {}, 'Date'), h('th', {}, 'Particulars'), h('th', {}, '₹'))),
    h('tbody', {}, ...Array.from({ length: n + 1 }, row)),
  );
}
function tAcctFilled(l: TlmKit['ledger'][number]): HTMLElement {
  const dr = l.rows.filter(r => r.side === 'DR'),
    cr = l.rows.filter(r => r.side === 'CR'),
    n = Math.max(dr.length, cr.length) + 1;
  const cell = (r?: { date: string; particulars: string; amount: { format(): string } }) =>
    r ? [h('td', {}, r.date.slice(8) + ' Apr'), h('td', {}, 'To/By ' + r.particulars), h('td', { class: 'num' }, r.amount.format())] : [h('td', {}), h('td', {}), h('td', {})];
  const total = l.totalDr.paise > l.totalCr.paise ? l.totalDr : l.totalCr;
  const side = l.balanceSide,
    closing = l.balance.isZero() ? [] : [side === 'DR' ? 'cr' : 'dr'];
  const body: HTMLElement[] = [];
  for (let i = 0; i < n - 1; i++) {
    const d = dr[i],
      c = cr[i];
    body.push(h('tr', {}, ...cell(d ? { ...d, particulars: d.particulars } : undefined), ...cell(c ? { ...c, particulars: c.particulars } : undefined)));
  }
  if (closing.length)
    body.push(
      side === 'DR'
        ? h('tr', {}, ...cell(), h('td', {}, '30 Apr'), h('td', {}, 'By Balance c/d'), h('td', { class: 'num' }, l.balance.format()))
        : h('tr', {}, h('td', {}, '30 Apr'), h('td', {}, 'To Balance c/d'), h('td', { class: 'num' }, l.balance.format()), ...cell()),
    );
  body.push(h('tr', { class: 'total' }, h('td', {}), h('td', {}, 'Total'), h('td', { class: 'num' }, total.format()), h('td', {}), h('td', {}, 'Total'), h('td', { class: 'num' }, total.format())));
  return h(
    'div',
    { class: 'tacct' },
    h('p', { class: 'tacct-name' }, `${l.account.name} A/c`),
    h(
      'table',
      { class: 'sheet-table t' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Particulars'), h('th', {}, 'Dr. ₹'), h('th', {}, 'Date'), h('th', {}, 'Particulars'), h('th', {}, 'Cr. ₹'))),
      h('tbody', {}, ...body),
    ),
  );
}
function tbTable(rows: TlmKit['trialBalance']['rows'], key: boolean, kit: TlmKit): HTMLElement {
  return h(
    'table',
    { class: 'sheet-table' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Account'), h('th', {}, 'Debit (₹)'), h('th', {}, 'Credit (₹)'))),
    h(
      'tbody',
      {},
      ...(key
        ? rows.map(r =>
            h('tr', {}, h('td', {}, r.account.name), h('td', { class: 'num' }, r.debit.isZero() ? '' : r.debit.format()), h('td', { class: 'num' }, r.credit.isZero() ? '' : r.credit.format())),
          )
        : rows.map(() => h('tr', {}, blank(), blank(), blank()))),
      h(
        'tr',
        { class: 'total' },
        h('td', {}, 'Total'),
        key ? h('td', { class: 'num' }, kit.trialBalance.totalDr.format()) : blank(),
        key ? h('td', { class: 'num' }, kit.trialBalance.totalCr.format()) : blank(),
      ),
    ),
  );
}

function txnCardsSheet(kit: TlmKit): HTMLElement {
  return h(
    'section',
    { class: 'sheet', 'data-sheet': 'txncards' },
    sheetHead(kit, 'Transaction cards (cut along the lines)'),
    h(
      'div',
      { class: 'cardgrid' },
      ...kit.txns.map(t => h('div', { class: 'pcard' }, h('p', { class: 'pcard-no' }, `Transaction ${t.no} · ${t.date.slice(8)} Apr 2026`), h('p', { class: 'pcard-text' }, t.text))),
    ),
  );
}
function acctCardsSheet(kit: TlmKit): HTMLElement {
  const copies = kit.accounts.flatMap(a => [a, a]);
  return h(
    'section',
    { class: 'sheet', 'data-sheet': 'acctcards' },
    sheetHead(kit, 'Account cards (two of each; cut along the lines)'),
    h(
      'div',
      { class: 'cardgrid cols4' },
      ...copies.map(a =>
        h(
          'div',
          { class: 'pcard acct' },
          h('p', { class: 'pcard-text' }, `${a.name} A/c`),
          h('p', { class: 'pcard-no' }, `${a.nature} · increases on the ${a.normal === 'DR' ? 'debit' : 'credit'} side`),
        ),
      ),
    ),
    h(
      'p',
      { class: 'hint' },
      'Matching activity: lay out a transaction card, then place the account card for the debit on the left and the one for the credit on the right. Use the answer key to check.',
    ),
  );
}

// ─────────────────────────── smartboard: predict -> reveal -> next, driven by the TLM_STAGE machine ───────────────────────────
function openStage(kit: TlmKit, stage: HTMLElement) {
  const tm = new Machine(TLM_STAGE);
  const unsub = track(stage, tm);
  let i = 0;
  const returnTo = document.activeElement as HTMLElement | null;
  const last = kit.txns.length - 1;
  const body = h('div', { class: 'stage-body' }),
    bar = h('div', { class: 'stage-bar' }),
    msg = h('p', { class: 'stage-msg', role: 'status' });
  const close = () => {
    document.removeEventListener('keydown', onKey, true);
    unsub();
    unregister(tm);
    stage.hidden = true;
    mount(stage);
    if (document.fullscreenElement) void document.exitFullscreen();
    returnTo?.focus();
  };
  const act = (e: Parameters<typeof tm.send>[0]) => {
    const r = tm.send(e);
    msg.textContent = r.ok ? '' : (r.reason ?? '');
    if (r.ok) draw();
    return r.ok;
  };
  const primary = () => {
    if (tm.is('PREDICT')) return act('REVEAL');
    if (tm.is('REVEALED')) {
      if (i < last) {
        i++;
        return act('NEXT');
      }
      return act('FINISH');
    }
    return act('NEXT'); // SUMMARY: refused with a reason
  };
  const back = () => {
    if (tm.is('SUMMARY')) return act('BACK');
    if (tm.is('REVEALED')) return act('HIDE');
    if (i > 0) {
      i--;
      tm.send('BACK');
      const r = tm.send('REVEAL');
      if (r.ok) draw();
      return true;
    }
    msg.textContent = 'This is the first transaction.';
    return false;
  };
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
      if ((e.target as HTMLElement).tagName === 'BUTTON' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      primary();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      back();
    }
  }
  function draw() {
    const t = kit.txns[i]!;
    if (tm.is('SUMMARY')) {
      mount(
        body,
        h('p', { class: 'stage-count' }, 'All transactions done'),
        h('h2', {}, 'Ledger balances and trial balance'),
        h(
          'table',
          { class: 'stage-table' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Account'), h('th', {}, 'Debit (₹)'), h('th', {}, 'Credit (₹)'))),
          h(
            'tbody',
            {},
            ...kit.trialBalance.rows.map(r =>
              h('tr', {}, h('td', {}, r.account.name), h('td', { class: 'num' }, r.debit.isZero() ? '' : r.debit.format()), h('td', { class: 'num' }, r.credit.isZero() ? '' : r.credit.format())),
            ),
            h('tr', { class: 'total' }, h('td', {}, 'Total'), h('td', { class: 'num' }, kit.trialBalance.totalDr.format()), h('td', { class: 'num' }, kit.trialBalance.totalCr.format())),
          ),
        ),
        h('p', { class: 'stage-why' }, kit.predictions[kit.predictions.length - 1]!.q),
        h('p', { class: 'stage-ans' }, kit.predictions[kit.predictions.length - 1]!.a, ' ', kit.predictions[kit.predictions.length - 1]!.why),
      );
    } else {
      const shown = tm.is('REVEALED');
      mount(
        body,
        h('p', { class: 'stage-count' }, `Transaction ${t.no} of ${kit.txns.length} · ${t.date.slice(8)} April 2026`),
        h('h2', { class: 'stage-text' }, t.text),
        h('p', { class: 'stage-ask' }, 'Predict: which account is debited and which is credited?'),
        shown
          ? h(
              'div',
              { class: 'stage-answer', 'data-answer': '' },
              h('div', { class: 'stage-side dr' }, h('small', {}, 'DEBIT'), h('b', {}, t.dr.name), h('span', {}, `${t.dr.nature} · ${t.amount.format()}`)),
              h('div', { class: 'stage-side cr' }, h('small', {}, 'CREDIT'), h('b', {}, t.cr.name), h('span', {}, `${t.cr.nature} · ${t.amount.format()}`)),
              h('p', { class: 'stage-why' }, t.why),
            )
          : h('p', { class: 'stage-wait' }, 'Think first. Press Reveal when the class has an answer.'),
      );
    }
    const label = tm.is('PREDICT') ? 'Reveal answer' : tm.is('REVEALED') ? (i < last ? 'Next transaction' : 'Show trial balance') : 'Restart';
    mount(
      bar,
      h('button', { type: 'button', class: 'secondary', onclick: close }, 'Exit (Esc)'),
      h(
        'button',
        {
          type: 'button',
          class: 'secondary',
          onclick: () => {
            back();
          },
        },
        '← Back',
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'secondary',
          onclick: () => {
            void (document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen?.());
          },
        },
        'Full screen',
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'primary',
          'data-stage-next': '',
          onclick: () => {
            if (tm.is('SUMMARY')) {
              i = 0;
              act('RESTART');
            } else primary();
          },
        },
        label + ' →',
      ),
    );
    announce(tm.is('REVEALED') ? `Answer: debit ${t.dr.name}, credit ${t.cr.name}` : tm.is('SUMMARY') ? 'Trial balance' : `Transaction ${t.no}`);
  }
  mount(stage, body, msg, bar);
  stage.hidden = false;
  document.addEventListener('keydown', onKey, true);
  onDispose(close);
  draw();
  (bar.querySelector('[data-stage-next]') as HTMLElement | null)?.focus();
  void stage.requestFullscreen?.().catch(() => {
    /* fullscreen is optional; the overlay already fills the window */
  });
}

// ─────────────────────────── student activity (opened from the shared link) ───────────────────────────
function studentActivity(kit: TlmKit): HTMLElement {
  const chart = starterChartClassXI(),
    list = chart.list();
  const root = h('div', { class: 'tlm tlm-student', 'data-tlm-play': kit.topic.id });
  let i = 0,
    score = 0;
  const opts = (sel: HTMLSelectElement) => {
    sel.append(h('option', { value: '' }, '— choose —'), ...list.map(a => h('option', { value: a.id }, a.name)));
    return sel;
  };
  function draw() {
    if (i >= kit.txns.length) {
      mount(
        root,
        h('header', { class: 'labhead' }, h('p', { class: 'eyebrow' }, 'Class XI'), h('h2', {}, kit.topic.title)),
        h(
          'section',
          { class: 'panel' },
          h('h3', {}, 'Set complete'),
          h('p', { class: 'lead' }, `You got ${score} of ${kit.txns.length} fully right.`),
          h('div', { class: 'actions' }, h('a', { class: 'primary button', href: '#/trainer' }, 'Practise more in the Trainer'), h('a', { class: 'button secondary', href: '#/' }, 'Home')),
        ),
      );
      return;
    }
    const t = kit.txns[i]!,
      dr = opts(h('select', { id: 'tdr' })),
      cr = opts(h('select', { id: 'tcr' })),
      out = h('div', { 'aria-live': 'polite' });
    const next = h(
      'button',
      {
        type: 'button',
        class: 'primary',
        hidden: true,
        onclick: () => {
          i++;
          draw();
        },
      },
      i + 1 === kit.txns.length ? 'Finish' : 'Next',
    );
    const submit = h('button', { type: 'submit', class: 'primary' }, 'Check');
    const check = () => {
      if (!dr.value || !cr.value) {
        mount(out, h('p', { class: 'note warn', role: 'alert' }, 'Choose an account for both the debit and the credit side.'));
        return;
      }
      const ok = dr.value === t.dr.id && cr.value === t.cr.id;
      if (ok) score++;
      const msgs = [dr.value !== t.dr.id ? `Debit ${t.dr.name}, not ${chart.get(dr.value).name}.` : '', cr.value !== t.cr.id ? `Credit ${t.cr.name}, not ${chart.get(cr.value).name}.` : ''].filter(
        Boolean,
      );
      void recordAttempt({
        t: Date.now(),
        skill: 'rules-trainer',
        clause: 'XI.2.rules',
        seed: kit.seed * 100 + t.no,
        mode: 'BEGINNER',
        marks: ok ? 1 : 0,
        outOf: 1,
        hintsUsed: 0,
        mistakes: ok ? [] : [msgs.join(' ')],
        correctParts: ok ? 1 : 0,
        parts: 1,
      });
      dr.disabled = cr.disabled = submit.disabled = true;
      next.hidden = false;
      mount(out, h('p', { class: 'note ' + (ok ? 'good' : 'bad'), role: 'status' }, ok ? '✓ Correct.' : `Not quite. ${msgs.join(' ')}`), h('p', {}, t.why));
      announce(ok ? 'Correct' : 'Not quite');
    };
    mount(
      root,
      h('header', { class: 'labhead' }, h('p', { class: 'eyebrow' }, 'Class XI · from your teacher'), h('h2', {}, kit.topic.title)),
      h(
        'section',
        { class: 'panel' },
        h('p', { class: 'eyebrow' }, `Transaction ${i + 1} of ${kit.txns.length} · score ${score}`),
        h('p', { class: 'stem' }, t.text),
        h(
          'form',
          {
            onsubmit: (e: Event) => {
              e.preventDefault();
              check();
            },
          },
          h('div', { class: 'field' }, h('label', { for: 'tdr' }, 'Debit (Dr.)'), dr),
          h('div', { class: 'field' }, h('label', { for: 'tcr' }, 'Credit (Cr.)'), cr),
          h('div', { class: 'actions' }, submit, next),
        ),
        out,
      ),
    );
  }
  draw();
  return root;
}
