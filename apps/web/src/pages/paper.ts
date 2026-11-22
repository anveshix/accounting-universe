import { buildPaper, markingScheme, type Paper, type PaperClass, type PaperItem, type PaperRoute, type PaperQuestion } from '../../../../packages/curriculum/src';
import { h } from '../dom';
import { state } from '../state';

const ROUTE_CODE: Record<string, PaperRoute> = { I: 'OPTION_I_ANALYSIS', II: 'OPTION_II_COMPUTERISED' };
const codeOf = (r: PaperRoute) => (r === 'OPTION_I_ANALYSIS' ? 'I' : 'II');
/** Hash of a paper: the seed (and the class / option) is the whole paper, so a link shares it exactly. */
export const paperHref = (cls: PaperClass, route: PaperRoute, seed: number) => (cls === 'XI' ? `#/paper/XI/${seed}` : `#/paper/XII/${codeOf(route)}/${seed}`);

export function paperPage(rest: string[]): HTMLElement {
  if (rest.length === 0) return setupPage();
  const cls = rest[0] as PaperClass;
  const route = cls === 'XII' ? ROUTE_CODE[rest[1]!]! : 'OPTION_I_ANALYSIS';
  const seed = Number(rest[cls === 'XII' ? 2 : 1]);
  return sheetPage(buildPaper({ cls, route, seed }));
}

// ───────────────────────── set-up ─────────────────────────
function setupPage(): HTMLElement {
  let cls: PaperClass = state.profile.cls,
    route: PaperRoute = state.profile.route === 'OPTION_II_COMPUTERISED' ? 'OPTION_II_COMPUTERISED' : 'OPTION_I_ANALYSIS';
  const seed = h('input', { type: 'number', id: 'paper-seed', min: '1', max: '999999999', value: String(Math.floor(Math.random() * 900000) + 100000), 'aria-describedby': 'paper-seed-help' });
  const routeBox = h('fieldset', { class: 'paper-opt' });
  const draw = () => {
    routeBox.hidden = cls !== 'XII';
  };
  const clsRadios = (['XII', 'XI'] as const).map(c =>
    h(
      'label',
      { class: 'choice' },
      h('input', {
        type: 'radio',
        name: 'paper-cls',
        value: c,
        checked: c === cls,
        onchange: () => {
          cls = c;
          draw();
        },
      }),
      ` Class ${c}`,
    ),
  );
  routeBox.append(
    h('legend', {}, 'Part B option'),
    ...(['OPTION_I_ANALYSIS', 'OPTION_II_COMPUTERISED'] as const).map(r =>
      h(
        'label',
        { class: 'choice' },
        h('input', {
          type: 'radio',
          name: 'paper-route',
          value: r,
          checked: r === route,
          onchange: () => {
            route = r;
          },
        }),
        r === 'OPTION_I_ANALYSIS' ? ' Option I: Analysis of Financial Statements' : ' Option II: Computerised Accounting',
      ),
    ),
  );
  draw();
  const go = () => {
    const n = Math.max(1, Math.min(999999999, Math.floor(Number(seed.value)) || 1));
    location.hash = paperHref(cls, route, n);
  };
  return h(
    'div',
    { class: 'paperpage' },
    h(
      'header',
      { class: 'labhead' },
      h('p', { class: 'eyebrow' }, 'Practice paper'),
      h('h2', {}, 'A full paper, in the board pattern'),
      h('p', { class: 'lead' }, '34 questions, 80 marks, 3 hours, with a marking scheme and a print view. Every answer is computed by the accounting engine.'),
    ),
    h(
      'section',
      { class: 'panel' },
      h(
        'form',
        {
          class: 'paper-form',
          onsubmit: (e: Event) => {
            e.preventDefault();
            go();
          },
        },
        h('fieldset', {}, h('legend', {}, 'Class'), ...clsRadios),
        routeBox,
        h('label', { for: 'paper-seed' }, 'Paper number'),
        seed,
        h('p', { id: 'paper-seed-help', class: 'muted-line' }, 'The number decides the paper. The same number always gives the same paper, so you can share the link with a friend or a teacher.'),
        h('button', { class: 'primary', type: 'submit' }, 'Make the paper'),
      ),
    ),
    h(
      'section',
      { class: 'panel' },
      h('h3', {}, 'How honest is this paper?'),
      h(
        'ul',
        {},
        h(
          'li',
          {},
          'Class XII follows the pattern of the official CBSE Sample Question Paper 2026-27: 20 questions of 1 mark, 6 of 3, 3 of 4 and 5 of 6, with the unit marks of the blueprint and internal choice in six questions.',
        ),
        h(
          'li',
          {},
          'Class XI: CBSE has not published a Class XI sample paper, so this paper uses the official unit marks (12 / 44 / 24) with the Class XII pattern. It is a practice paper, not an official blueprint.',
        ),
        h(
          'li',
          {},
          'The questions are generated here (original wording). Each 6-mark question is one multi-step problem, marked step by step. Some 3- and 4-mark questions are sets of linked smaller questions on one topic, and the paper says so. Real board questions are longer, so use past papers and your textbook too.',
        ),
        h('li', {}, 'No subject teacher has reviewed these papers or the marking scheme yet.'),
        h('li', {}, 'More on what is official and what is not: ', h('a', { href: '#/about' }, 'About and trust'), '.'),
      ),
    ),
  );
}

// ───────────────────────── the paper ─────────────────────────
function itemView(it: PaperItem): HTMLElement {
  const q = it.question;
  return h(
    'div',
    { class: 'pitem' },
    h('p', { class: 'pstem' }, it.label ? h('b', {}, it.label + ' ') : null, q.stem),
    h(
      'ol',
      { class: 'pparts' },
      ...q.parts.map(p =>
        h(
          'li',
          {},
          p.label,
          p.marks > 1 || q.parts.length > 1 ? h('span', { class: 'pmarks' }, ` [${p.marks}]`) : null,
          p.kind === 'CHOICE' && p.options ? h('ul', { class: 'popts' }, ...p.options.map((o, i) => h('li', {}, `(${String.fromCharCode(97 + i)}) ${o}`))) : null,
        ),
      ),
    ),
  );
}
function questionView(q: PaperQuestion): HTMLElement {
  return h(
    'section',
    { class: 'pq', 'data-q': String(q.no), 'data-marks': String(q.marks) },
    h(
      'div',
      { class: 'pq-head' },
      h('b', { class: 'pq-no' }, `Q${q.no}`),
      h('span', { class: 'pq-marks' }, `[${q.marks} mark${q.marks > 1 ? 's' : ''}]`),
      q.composite ? h('span', { class: 'chip' }, 'linked parts') : null,
    ),
    ...q.items.map(itemView),
    q.alt ? h('p', { class: 'por' }, h('b', {}, 'OR')) : null,
    ...(q.alt ?? []).map(itemView),
  );
}

function sheetPage(p: Paper): HTMLElement {
  const scheme = markingScheme(p);
  const r = p.report;
  const parts = (['A', 'B'] as const).map(part => {
    const qs = p.questions.filter(q => q.part === part);
    return h(
      'section',
      { class: 'ppart', 'data-part': part },
      h('h3', {}, `Part ${part}`, ' ', h('span', { class: 'muted-line' }, `Questions ${qs[0]!.no}-${qs[qs.length - 1]!.no}, ${qs.reduce((s, q) => s + q.marks, 0)} marks`)),
      ...(part === 'B' && p.cls === 'XII'
        ? [h('p', { class: 'muted-line' }, p.route === 'OPTION_I_ANALYSIS' ? 'Option I: Analysis of Financial Statements' : 'Option II: Computerised Accounting')]
        : []),
      ...qs.map(questionView),
    );
  });
  const sheet = h(
    'article',
    { class: 'paper-sheet', 'data-paper': `${p.cls}-${codeOf(p.route)}-${p.seed}` },
    h(
      'header',
      { class: 'paper-title' },
      h('p', { class: 'eyebrow' }, 'Practice paper ' + p.seed),
      h('h2', {}, p.title),
      h('p', { class: 'muted-line' }, `Time: ${p.minutes / 60} hours · Maximum marks: ${p.maxMarks}`),
      r.official ? null : h('p', { class: 'note warn' }, 'Not an official blueprint: the Class XI question pattern here is borrowed from Class XII.'),
    ),
    h(
      'ol',
      { class: 'pinstr' },
      h('li', {}, `This paper has ${r.questions} questions. All are compulsory; where an OR is shown, answer one of the two.`),
      h('li', {}, 'The marks of each question are shown in brackets. Show your working: marks are given for the steps.'),
      h('li', {}, 'Give amounts in rupees. Use the formats you learnt for journals, ledgers and statements.'),
    ),
    ...parts,
  );
  const schemeEl = h(
    'section',
    { class: 'panel pscheme', 'data-scheme': '' },
    h('h3', {}, 'Marking scheme and answers'),
    h('p', { class: 'muted-line' }, 'The answers come from the accounting engine. Give marks for correct steps even when the final figure is wrong (follow-through).'),
    ...scheme.map(e =>
      h(
        'div',
        { class: 'ps-q', 'data-q': String(e.no) },
        h('h4', {}, `Q${e.no} `, h('span', { class: 'muted-line' }, `[${e.marks}]`)),
        h('table', { class: 'ps-table' }, h('tbody', {}, ...e.lines.map(l => h('tr', {}, h('td', {}, l.label), h('td', {}, l.answer), h('td', {}, `${l.marks}`))))),
        h('details', {}, h('summary', {}, 'Working'), h('ol', {}, ...e.working.map(w => h('li', {}, w)))),
        e.alt
          ? h(
              'div',
              {},
              h('p', {}, h('b', {}, 'OR')),
              h('table', { class: 'ps-table' }, h('tbody', {}, ...e.alt.lines.map(l => h('tr', {}, h('td', {}, l.label), h('td', {}, l.answer), h('td', {}, `${l.marks}`))))),
              h('details', {}, h('summary', {}, 'Working (OR)'), h('ol', {}, ...e.alt.working.map(w => h('li', {}, w)))),
            )
          : null,
      ),
    ),
  );
  const make = (d: number) => {
    location.hash = paperHref(p.cls, p.route, Math.max(1, p.seed + d));
  };
  return h(
    'div',
    { class: 'paperpage' },
    h(
      'nav',
      { class: 'breadcrumb no-print', 'aria-label': 'Breadcrumb' },
      h('a', { href: '#/' }, 'Home'),
      h('span', { 'aria-hidden': 'true' }, ' › '),
      h('a', { href: '#/paper' }, 'Practice paper'),
      h('span', { 'aria-hidden': 'true' }, ' › '),
      h('span', { 'aria-current': 'page' }, `No. ${p.seed}`),
    ),
    h(
      'div',
      { class: 'actions no-print' },
      h('button', { type: 'button', class: 'primary', 'data-print': '', onclick: () => window.print() }, 'Print or save as PDF'),
      h('button', { type: 'button', onclick: () => make(1) }, 'Another paper'),
      h('a', { class: 'button', href: '#/paper' }, 'Change class'),
    ),
    h(
      'p',
      { class: 'note info paper-status no-print' },
      `${r.pattern} ${r.composite} of the ${r.questions} questions are sets of linked smaller questions; ${r.singles} are single generated questions. Not reviewed by a subject teacher.`,
    ),
    sheet,
    h('details', { class: 'no-print pscheme-wrap', 'data-scheme-toggle': '' }, h('summary', {}, 'Show the marking scheme and answers'), schemeEl),
    h(
      'section',
      { class: 'panel prep no-print' },
      h('h3', {}, 'Paper report'),
      h(
        'table',
        { class: 'ps-table' },
        h(
          'tbody',
          {},
          h(
            'tr',
            {},
            h('th', {}, 'Questions by marks'),
            h(
              'td',
              {},
              Object.entries(r.byMarks)
                .map(([m, n]) => `${n}×${m}`)
                .join(', '),
            ),
          ),
          h(
            'tr',
            {},
            h('th', {}, 'Marks by unit'),
            h(
              'td',
              {},
              Object.entries(r.unitMarks)
                .map(([u, m]) => `${u}: ${m}`)
                .join(', '),
            ),
          ),
          h(
            'tr',
            {},
            h('th', {}, 'Typology marks (what is in this paper)'),
            h(
              'td',
              {},
              `Recall/understand ${r.typologyMarks.RU}, apply ${r.typologyMarks.AP}, analyse/evaluate ${r.typologyMarks.AEC}. The board asks for about ${r.typologyTarget.RU} / ${r.typologyTarget.AP} / ${r.typologyTarget.AEC}; this app has few higher-order questions, so the mix differs.`,
            ),
          ),
          h(
            'tr',
            {},
            h('th', {}, 'Repeated question types'),
            h('td', {}, r.repeatedTypes === 0 ? 'None' : `${r.repeatedTypes} questions are the same type as an earlier one, with different numbers.`),
          ),
          h('tr', {}, h('th', {}, 'Internal choice'), h('td', {}, `${r.choices} questions`)),
        ),
      ),
    ),
  );
}
