import { SOURCE, UNITS, CLAUSES, type ClassLevel } from '../../../../packages/curriculum/src';
import { h } from '../dom';
import { icon, iconForLab } from '../icons';
import { ALL_LABS, PAGES, coverage } from '../labs';
import { state } from '../state';
import { storageMode, setProfile } from '../store';
import { navigate } from '../router';

export function homePage(rerender: () => void): HTMLElement {
  const cls = state.profile.cls;
  const choose = (c: ClassLevel) => {
    state.profile = { ...state.profile, cls: c };
    void setProfile(state.profile);
    rerender();
  };
  const cov = coverage(cls);
  const route = state.profile.route;
  const pct = Math.round((cov.interactive / cov.total) * 100);

  // The one thing a new visitor should do first, per class (and per Class XII option).
  const first =
    cls === 'XI'
      ? PAGES.find(p => p.id === 'xi-ledger')
      : route === 'OPTION_II_COMPUTERISED'
        ? PAGES.find(p => p.id === 'xii-cas')
        : ALL_LABS.find(l => l.cls === 'XII' && !l.route);
  const firstHref = first ? ('href' in first ? first.href : `#/lab/${first.id}`) : `#/class/${cls}`;
  const firstTitle = first ? first.title : `Class ${cls} syllabus`;

  return h(
    'div',
    { class: 'home' },
    // HERO: what this is, who it is for, one obvious first step. No decoration behind the text.
    h(
      'section',
      { class: 'hero' },
      h('p', { class: 'eyebrow' }, 'CBSE Accountancy (055) · 2026-27'),
      h('h2', {}, 'Learn Accounting ', h('span', { class: 'hero-accent' }, 'by Doing'), ' Accounting.'),
      h(
        'p',
        { class: 'lead' },
        'Post real entries and watch the ledger, trial balance and balance sheet change as you type. Every answer is checked, and a wrong answer is explained, not just crossed out. Works without internet; your progress stays on this device.',
      ),
      h(
        'div',
        { class: 'classpick', role: 'radiogroup', 'aria-label': 'Choose your class' },
        ...(['XI', 'XII'] as ClassLevel[]).map(c =>
          h(
            'button',
            {
              type: 'button',
              role: 'radio',
              'aria-checked': String(c === cls),
              class: 'bigchoice' + (c === cls ? ' on' : ''),
              onclick: () => choose(c),
            },
            h('b', {}, `Class ${c}`),
            h('span', {}, c === 'XI' ? 'The accounting process & final accounts.' : 'Partnerships, companies & analysis.'),
          ),
        ),
      ),
      cls === 'XII'
        ? h(
            'fieldset',
            { class: 'routebox' },
            h('legend', {}, 'Your Class XII option (as per CBSE)'),
            ...(
              [
                ['OPTION_I_ANALYSIS', 'Option I — Analysis + Cash Flow'],
                ['OPTION_II_COMPUTERISED', 'Option II — Computerised Accounting'],
              ] as const
            ).map(([v, label]) =>
              h(
                'label',
                { class: 'radio' },
                h('input', {
                  type: 'radio',
                  name: 'route',
                  value: v,
                  ...(route === v ? { checked: true } : {}),
                  onchange: () => {
                    state.profile = { ...state.profile, route: v };
                    void setProfile(state.profile);
                    rerender();
                  },
                }),
                ' ',
                label,
              ),
            ),
            route === 'OPTION_II_COMPUTERISED'
              ? h(
                  'p',
                  { class: 'note info route-note' },
                  'Option II replaces the Analysis and Cash Flow units. Use the Computerised Accounting Simulator and the Spreadsheet Lab; Partnership and Company labs are shared by both options.',
                )
              : null,
          )
        : null,
      h(
        'div',
        { class: 'actions hero-actions' },
        h('button', { type: 'button', class: 'primary', 'data-start': '', onclick: () => navigate(firstHref) }, 'Start here: ', firstTitle),
        h('button', { type: 'button', onclick: () => navigate('#/practice') }, 'Practise questions'),
        h('button', { type: 'button', class: 'ghost', onclick: () => navigate(`#/class/${cls}`) }, `Class ${cls} syllabus map`),
      ),
    ),

    // HOW IT WORKS: what a session looks like, in the learner's words.
    h(
      'section',
      { class: 'steps3', 'aria-label': 'How a study session works' },
      ...(
        [
          ['book', '1 · Learn it', 'A short explanation in plain words, with an example from a real business.'],
          ['flask', '2 · Try it', 'Change the numbers yourself. The books recompute instantly and show every step.'],
          ['check-circle', '3 · Check yourself', 'Exam-style questions, marked at once, with the reason for every mistake.'],
        ] as const
      ).map(([ic, title, text]) => h('div', { class: 'step3' }, h('div', { class: 'step3-icon' }, icon(ic, 22)), h('div', {}, h('b', {}, title), h('span', {}, text)))),
    ),

    // START HERE: a handful of good first labs for the chosen class.
    h(
      'div',
      { class: 'section-head' },
      h('h3', {}, `Popular for Class ${cls}`),
      h('a', { class: 'button small', href: '#/labs' }, 'All labs →'),
    ),
    h(
      'section',
      { class: 'cards' },
      ...PAGES.filter(p => p.cls === cls && (!p.route || route === p.route))
        .slice(0, 2)
        .map(p =>
          h('a', { class: 'card', href: p.href }, h('div', { class: 'card-icon' }, icon(iconForLab(p.id, p.title), 22)), h('h3', {}, p.title), h('p', {}, p.summary), h('span', { class: 'chip' }, `Class ${p.cls}`)),
        ),
      ...ALL_LABS.filter(l => l.cls === cls && (!l.route || route === l.route))
        .slice(0, 4)
        .map(l =>
          h('a', { class: 'card', href: `#/lab/${l.id}` }, h('div', { class: 'card-icon' }, icon(iconForLab(l.id, l.title), 22)), h('h3', {}, l.title), h('p', {}, l.summary), h('span', { class: 'chip' }, `Class ${l.cls}`)),
        ),
    ),

    // FOR TEACHERS: a clear door for the other main audience.
    h(
      'section',
      { class: 'panel teacher-band', 'aria-labelledby': 'teacher-band-title' },
      h('div', { class: 'teacher-band-icon' }, icon('chalkboard', 26)),
      h(
        'div',
        { class: 'teacher-band-text' },
        h('h3', { id: 'teacher-band-title' }, 'Teaching a class?'),
        h('p', {}, 'Create an assignment or a chapter test, collect your students’ progress files, and see which official learning outcomes the class finds hard. No accounts; nothing is uploaded.'),
      ),
      h('a', { class: 'button primary', href: '#/teacher' }, 'Open the teacher dashboard'),
    ),

    // WHAT IS COVERED: one honest line and a meter.
    h(
      'section',
      { class: 'panel' },
      h('h3', { class: 'flush-top' }, `What Class ${cls} covers`),
      h('p', { class: 'muted-line' }, `${cov.interactive} of ${cov.total} topics have a hands-on lab, ${cov.cardsOnly} have a short theory card, and ${cov.none} are not built yet.`),
      h('div', { class: 'meter', role: 'img', 'aria-label': `${cov.interactive} of ${cov.total} topics have an interactive lab (${pct}%)` }, h('div', { class: 'meterfill', style: `width:${pct}%` })),
      h('div', { class: 'actions' }, h('a', { class: 'button', href: '#/cards' }, 'Concept cards'), h('a', { class: 'button', href: '#/rescue' }, 'Stuck on a topic? Rescue plan')),
    ),

    h(
      'footer',
      { class: 'app-footer' },
      h('p', {}, 'Syllabus: ', h('a', { href: SOURCE.url, rel: 'noopener', target: '_blank' }, SOURCE.document), ` · ${UNITS.length} units · ${CLAUSES.length} topics. Nothing outside CBSE is taught.`),
      h('p', {}, storageMode === 'indexeddb' ? 'Progress stays on this device.' : 'Storage is limited here — export from My Progress to keep your work.'),
    ),
  );
}
