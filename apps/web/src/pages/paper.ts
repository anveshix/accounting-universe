import { buildPaper, markingScheme, type Paper, type PaperClass, type PaperItem, type PaperRoute, type PaperQuestion } from '../../../../packages/curriculum/src';
import { h } from '../dom';
import { en, tr } from '../i18n';
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
      tr('paper.classN', { cls: c }),
    ),
  );
  routeBox.append(
    h('legend', {}, tr('paper.partB')),
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
        tr(r === 'OPTION_I_ANALYSIS' ? 'paper.opt1' : 'paper.opt2'),
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
    h('header', { class: 'labhead' }, h('p', { class: 'eyebrow' }, tr('paper.eyebrow')), h('h2', {}, tr('paper.setup.h2')), h('p', { class: 'lead' }, tr('paper.setup.lead'))),
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
        h('fieldset', {}, h('legend', {}, tr('paper.class')), ...clsRadios),
        routeBox,
        h('label', { for: 'paper-seed' }, tr('paper.number')),
        seed,
        h('p', { id: 'paper-seed-help', class: 'muted-line' }, tr('paper.numberHelp')),
        h('button', { class: 'primary', type: 'submit' }, tr('paper.make')),
      ),
    ),
    h(
      'section',
      { class: 'panel' },
      h('h3', {}, tr('paper.honest.h')),
      h(
        'ul',
        {},
        h('li', {}, tr('paper.honest.1')),
        h('li', {}, tr('paper.honest.2')),
        h('li', {}, tr('paper.honest.3')),
        h('li', {}, tr('paper.honest.4')),
        h('li', {}, tr('paper.honest.5'), h('a', { href: '#/about' }, tr('paper.about')), '.'),
      ),
    ),
  );
}

// ───────────────────────── the paper ─────────────────────────
/** Hindi text for a question when the generator has it (draft); otherwise the English, marked lang="en" in a Hindi page. */
const mark = (n: number) => tr(n > 1 ? 'paper.marks.many' : 'paper.marks.one', { n });
function itemView(it: PaperItem): HTMLElement {
  const q = it.question,
    hiq = state.lang === 'hi' ? q.hi : undefined;
  return h(
    'div',
    { class: 'pitem' },
    h('p', { class: 'pstem' }, it.label ? h('b', {}, it.label + ' ') : null, hiq ? hiq.stem : en(q.stem)),
    h(
      'ol',
      { class: 'pparts' },
      ...q.parts.map((p, pi) =>
        h(
          'li',
          {},
          hiq?.parts[pi] ?? en(p.label),
          p.marks > 1 || q.parts.length > 1 ? h('span', { class: 'pmarks' }, ` [${p.marks}]`) : null,
          p.kind === 'CHOICE' && p.options
            ? h('ul', { class: 'popts' }, ...(hiq?.options?.[pi] ?? p.options).map((o, i) => h('li', {}, `(${String.fromCharCode(97 + i)}) `, hiq?.options?.[pi] ? o : en(o))))
            : null,
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
      h('b', { class: 'pq-no' }, tr('paper.q', { n: q.no })),
      h('span', { class: 'pq-marks' }, mark(q.marks)),
      q.composite ? h('span', { class: 'chip' }, tr('paper.linked')) : null,
    ),
    ...q.items.map(itemView),
    q.alt ? h('p', { class: 'por' }, h('b', {}, tr('paper.or'))) : null,
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
      h(
        'h3',
        {},
        tr('paper.part', { p: state.lang === 'hi' ? (part === 'A' ? 'अ' : 'ब') : part }),
        ' ',
        h('span', { class: 'muted-line' }, tr('paper.partRange', { a: qs[0]!.no, b: qs[qs.length - 1]!.no, m: qs.reduce((s, q) => s + q.marks, 0) })),
      ),
      ...(part === 'B' && p.cls === 'XII' ? [h('p', { class: 'muted-line' }, tr(p.route === 'OPTION_I_ANALYSIS' ? 'paper.opt1' : 'paper.opt2').trim())] : []),
      ...qs.map(questionView),
    );
  });
  const sheet = h(
    'article',
    { class: 'paper-sheet', 'data-paper': `${p.cls}-${codeOf(p.route)}-${p.seed}` },
    h(
      'header',
      { class: 'paper-title' },
      h('p', { class: 'eyebrow' }, tr('paper.eyebrow') + ' ' + p.seed),
      h('h2', {}, tr(r.official ? 'paper.title.xii' : 'paper.title.xi')),
      h('p', { class: 'muted-line' }, tr('paper.time', { h: p.minutes / 60, m: p.maxMarks })),
      r.official ? null : h('p', { class: 'note warn' }, tr('paper.notOfficial')),
    ),
    h('ol', { class: 'pinstr' }, h('li', {}, tr('paper.instr.1', { n: r.questions })), h('li', {}, tr('paper.instr.2')), h('li', {}, tr('paper.instr.3'))),
    ...parts,
  );
  const schemeEl = h(
    'section',
    { class: 'panel pscheme', 'data-scheme': '' },
    h('h3', {}, tr('paper.scheme.h')),
    h('p', { class: 'muted-line' }, tr('paper.scheme.note')),
    ...scheme.map(e =>
      h(
        'div',
        { class: 'ps-q', 'data-q': String(e.no) },
        h('h4', {}, tr('paper.q', { n: e.no }) + ' ', h('span', { class: 'muted-line' }, `[${e.marks}]`)),
        h('table', { class: 'ps-table' }, h('tbody', {}, ...e.lines.map(l => h('tr', {}, h('td', {}, en(l.label)), h('td', {}, l.answer), h('td', {}, `${l.marks}`))))),
        h('details', {}, h('summary', {}, tr('paper.working')), h('ol', {}, ...e.working.map(w => h('li', {}, en(w))))),
        e.alt
          ? h(
              'div',
              {},
              h('p', {}, h('b', {}, tr('paper.or'))),
              h('table', { class: 'ps-table' }, h('tbody', {}, ...e.alt.lines.map(l => h('tr', {}, h('td', {}, en(l.label)), h('td', {}, l.answer), h('td', {}, `${l.marks}`))))),
              h('details', {}, h('summary', {}, tr('paper.workingOr')), h('ol', {}, ...e.alt.working.map(w => h('li', {}, en(w))))),
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
      h('a', { href: '#/' }, tr('study.home')),
      h('span', { 'aria-hidden': 'true' }, ' › '),
      h('a', { href: '#/paper' }, tr('paper.crumb')),
      h('span', { 'aria-hidden': 'true' }, ' › '),
      h('span', { 'aria-current': 'page' }, tr('paper.no', { n: p.seed })),
    ),
    h(
      'div',
      { class: 'actions no-print' },
      h('button', { type: 'button', class: 'primary', 'data-print': '', onclick: () => window.print() }, tr('paper.printBtn')),
      h('button', { type: 'button', onclick: () => make(1) }, tr('paper.another')),
      h('a', { class: 'button', href: '#/paper' }, tr('paper.change')),
    ),
    h(
      'p',
      { class: 'note info paper-status no-print' },
      `${tr(r.official ? 'paper.pattern.official' : 'paper.pattern.xi')} ${tr('paper.status', { n: r.composite, total: r.questions, m: r.singles })}`,
    ),
    state.lang === 'hi' && p.questions.some(q => [...q.items, ...(q.alt ?? [])].some(i => !i.question.hi))
      ? h('p', { class: 'note warn no-print paper-english', lang: 'hi' }, tr('paper.questionEnglish'))
      : null,
    sheet,
    h('details', { class: 'no-print pscheme-wrap', 'data-scheme-toggle': '' }, h('summary', {}, tr('paper.scheme.show')), schemeEl),
    h(
      'section',
      { class: 'panel prep no-print' },
      h('h3', {}, tr('paper.report')),
      h(
        'table',
        { class: 'ps-table' },
        h(
          'tbody',
          {},
          h(
            'tr',
            {},
            h('th', {}, tr('paper.report.byMarks')),
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
            h('th', {}, tr('paper.report.byUnit')),
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
            h('th', {}, tr('paper.report.typ')),
            h(
              'td',
              {},
              tr('paper.report.typBody', { ru: r.typologyMarks.RU, ap: r.typologyMarks.AP, aec: r.typologyMarks.AEC, tru: r.typologyTarget.RU, tap: r.typologyTarget.AP, taec: r.typologyTarget.AEC }),
            ),
          ),
          h('tr', {}, h('th', {}, tr('paper.report.rep')), h('td', {}, r.repeatedTypes === 0 ? tr('paper.report.none') : tr('paper.report.repBody', { n: r.repeatedTypes }))),
          h('tr', {}, h('th', {}, tr('paper.report.choice')), h('td', {}, tr('paper.report.choiceBody', { n: r.choices }))),
        ),
      ),
    ),
  );
}
