import { CLAUSES, SKILLS, STUDY_STATUS, UNITS, outcomesOf, OUTCOME_MAPPING_STATUS, studyOf, studyHiOf, titleHiOf, type ClassLevel } from '../../../../packages/curriculum/src';
import type { Key } from '../../../../packages/curriculum/src/i18n';
import { h, mount } from '../dom';
import { en, tr } from '../i18n';
import { icon } from '../icons';
import { hrefOf, isCard, labsOfClause, titleOf } from '../labs';
import { state } from '../state';
import { attempts, recordSeen } from '../store';
import { itemsForTopic, materialCard } from './materials';

/** Hash of the study page for a topic or a class. */
export const studyHref = (id: string) => `#/study/${id}`;

const hi = () => state.lang === 'hi';
/** Topic and unit titles: Hindi when the app is in Hindi (all 54 titles exist), the original English otherwise. */
const topicTitle = (id: string, title: string) => (hi() ? (titleHiOf(id) ?? title) : title);
const unitTitle = (u: { id: string; title: string }) => (hi() ? tr(`unit.${u.id}` as Key) : u.title);
const isClass = (x: string | undefined): x is ClassLevel => x === 'XI' || x === 'XII';
/** A list whose lines are Hindi (`inHindi`) or English text that has no Hindi version yet (marked lang="en" inside a Hindi page). */
const list = (cls: string, items: readonly string[], ordered = false, inHindi = true) => h(ordered ? 'ol' : 'ul', { class: cls }, ...items.map(t => h('li', {}, inHindi ? t : en(t))));

/** How much the learner has practised a topic: from the attempts saved on this device (never uploaded). */
async function progressFor(clause: string): Promise<{ n: number; pct: number } | null> {
  const mine = (await attempts()).filter(a => a.clause === clause);
  if (!mine.length) return null;
  const marks = mine.reduce((s, a) => s + a.marks, 0),
    out = mine.reduce((s, a) => s + a.outOf, 0);
  return { n: mine.length, pct: out ? Math.round((marks / out) * 100) : 0 };
}

export function studyPage(arg?: string): HTMLElement {
  if (arg && !isClass(arg)) return topicPage(arg);
  return indexPage(isClass(arg) ? arg : state.profile.cls);
}

/** The study status note: English wording is the constant the tests know; Hindi has its own sentence. */
const statusNote = () => h('p', { class: 'note info study-status' }, hi() ? tr('study.status') : STUDY_STATUS);

// ───────────────────────── chapter index ─────────────────────────
function indexPage(cls: ClassLevel): HTMLElement {
  const route = state.profile.route;
  const units = UNITS.filter(u => u.cls === cls);
  const sections = units.map(u => {
    const inRoute = u.route === 'COMMON' || u.route === route;
    const clauses = CLAUSES.filter(c => c.unit === u.id);
    return h(
      'section',
      { class: 'panel unit' + (inRoute ? '' : ' dim'), 'data-unit': u.id },
      h(
        'div',
        { class: 'unit-head' },
        h('h3', {}, unitTitle(u)),
        h('span', { class: 'chip' }, tr('study.marks', { n: u.marks })),
        u.route !== 'COMMON' ? h('span', { class: 'chip alt' }, tr(u.route === 'OPTION_I_ANALYSIS' ? 'study.optI' : 'study.optII')) : null,
      ),
      h(
        'ol',
        { class: 'topic-list' },
        ...clauses.map((c, i) => {
          const skills = SKILLS.filter(s => s.clause === c.id).length,
            labs = labsOfClause(c.id).filter(x => !isCard(x)).length;
          const prog = h('span', { class: 'chip topic-progress', 'data-progress': c.id, hidden: true });
          void progressFor(c.id).then(p => {
            if (p) {
              prog.textContent = tr('study.tried', { pct: p.pct, n: p.n });
              prog.removeAttribute('hidden');
            }
          });
          return h(
            'li',
            {},
            h('a', { class: 'topic-link', href: studyHref(c.id), 'data-topic': c.id }, h('span', { class: 'topic-no' }, String(i + 1)), h('span', { class: 'topic-title' }, topicTitle(c.id, c.title))),
            h(
              'span',
              { class: 'topic-meta' },
              labs ? h('span', { class: 'chip' }, tr(labs > 1 ? 'study.lab.many' : 'study.lab.one', { n: labs })) : null,
              skills ? h('span', { class: 'chip' }, tr(skills > 1 ? 'study.skill.many' : 'study.skill.one', { n: skills })) : null,
              prog,
            ),
          );
        }),
      ),
    );
  });
  return h(
    'div',
    { class: 'studyindex' },
    h(
      'header',
      { class: 'labhead' },
      h(
        'nav',
        { class: 'breadcrumb', 'aria-label': 'Breadcrumb' },
        h('a', { href: '#/' }, tr('study.home')),
        h('span', { 'aria-hidden': 'true' }, ' › '),
        h('a', { href: `#/class/${cls}` }, tr('study.classCrumb', { cls })),
        h('span', { 'aria-hidden': 'true' }, ' › '),
        h('span', { 'aria-current': 'page' }, tr('study.crumb')),
      ),
      h('p', { class: 'eyebrow' }, tr('study.eyebrow')),
      h('h2', {}, tr('study.h2', { cls })),
      h('p', { class: 'lead' }, tr('study.lead')),
      statusNote(),
    ),
    h(
      'div',
      { class: 'actions' },
      ...(['XI', 'XII'] as const).map(c =>
        h('a', { class: 'button' + (c === cls ? ' primary' : ''), href: `#/study/${c}`, 'aria-current': c === cls ? 'page' : undefined }, tr('study.classCrumb', { cls: c })),
      ),
    ),
    ...sections,
  );
}

// ───────────────────────── one topic ─────────────────────────
function topicPage(id: string): HTMLElement {
  const clause = CLAUSES.find(c => c.id === id),
    guide = clause ? studyOf(clause.id) : undefined;
  if (!clause || !guide) return h('div', { class: 'panel' }, h('h2', {}, tr('study.notFound.h')), h('p', {}, tr('study.notFound.p')), h('a', { class: 'button', href: '#/study' }, tr('study.open')));
  void recordSeen({ lab: `study:${clause.id}`, tab: 'learn', t: Date.now() });
  const unit = UNITS.find(u => u.id === clause.unit)!,
    cls = unit.cls;
  const inUnit = CLAUSES.filter(c => c.unit === unit.id),
    at = inUnit.findIndex(c => c.id === clause.id);
  const all = CLAUSES.filter(c => c.id.startsWith(cls + '.')),
    pos = all.findIndex(c => c.id === clause.id);
  const prev = all[pos - 1],
    next = all[pos + 1];
  const labs = labsOfClause(clause.id),
    skills = SKILLS.filter(s => s.clause === clause.id),
    los = outcomesOf(clause.id);

  // Hindi notes exist for some topics only; the rest stay English (marked lang="en") with a notice, never machine-translated at run time.
  const gh = hi() ? studyHiOf(clause.id) : undefined,
    english = hi() && !gh;
  const text = (hindi: string | undefined, original: string) => (gh && hindi !== undefined ? hindi : english ? en(original) : original);
  const ex = gh ? gh.example : guide.example;

  const progress = h('p', { class: 'note study-progress', 'data-study-progress': '', hidden: true });
  void progressFor(clause.id).then(p => {
    if (p) {
      progress.textContent = tr(p.n > 1 ? 'study.progress.many' : 'study.progress.one', { n: p.n, pct: p.pct });
      progress.removeAttribute('hidden');
    }
  });

  // Notes, slides and worksheets filed under this chapter (published ones and any added on this device); hidden when there are none.
  const materialsList = h('ul', { class: 'materials' });
  const materialsSection = h(
    'section',
    { class: 'panel study-sec materials-sec no-print', 'data-study-materials': '', lang: 'en', hidden: true },
    h('h3', {}, 'Notes and slides for this chapter'),
    materialsList,
    h('p', {}, h('a', { href: `#/materials/${clause.id}` }, 'All materials for this chapter, and add your own →')),
  );
  void itemsForTopic(clause.id).then(items => {
    if (!items.length) return;
    mount(materialsList, ...items.map(m => materialCard(m)));
    materialsSection.removeAttribute('hidden');
  });

  const section = (title: string, body: Node | null, cls = '') => (body ? h('section', { class: `panel study-sec ${cls}` }, h('h3', {}, title), body) : null);
  const [outPre = '', outPost = ''] = tr('study.outcomes.note', { status: '\u0000' }).split('\u0000');

  return h(
    'article',
    { class: 'study', 'data-clause': clause.id },
    h(
      'header',
      { class: 'labhead' },
      h(
        'nav',
        { class: 'breadcrumb no-print', 'aria-label': 'Breadcrumb' },
        h('a', { href: '#/' }, tr('study.home')),
        h('span', { 'aria-hidden': 'true' }, ' › '),
        h('a', { href: `#/study/${cls}` }, tr('study.classGuide', { cls })),
        h('span', { 'aria-hidden': 'true' }, ' › '),
        h('span', { 'aria-current': 'page' }, tr('study.topicN', { n: at + 1 })),
      ),
      h('p', { class: 'eyebrow' }, `${unitTitle(unit)} · ${tr('study.marks', { n: unit.marks })}`),
      h('h2', {}, topicTitle(clause.id, clause.title)),
      english ? h('p', { class: 'note warn study-english', lang: 'hi' }, tr('study.contentEnglish')) : null,
      clause.limit ? h('p', { class: 'note warn study-limit' }, h('b', {}, tr('study.limit')), hi() ? en(clause.limit) : clause.limit) : null,
      h('p', { class: 'lead' }, text(gh?.summary, guide.summary)),
      h(
        'div',
        { class: 'actions no-print' },
        skills[0] ? h('a', { class: 'button primary', href: `#/practice/${skills[0].skill}` }, icon('target', 16), ' ', tr('study.practise')) : null,
        h('button', { type: 'button', 'data-print': '', onclick: () => window.print() }, tr('study.print')),
      ),
      progress,
    ),
    section(tr('study.sec.know'), list('study-list', gh ? gh.mustKnow : guide.mustKnow, false, !english)),
    section(tr('study.sec.extra'), guide.extra ? list('study-extra', gh?.extra ?? guide.extra, false, !english) : null),
    section(tr('study.sec.formats'), guide.formats ? list('study-formats', gh?.formats ?? guide.formats, false, !english) : null),
    section(tr('study.sec.steps'), guide.steps ? list('study-steps', gh?.steps ?? guide.steps, true, !english) : null),
    section(tr('study.sec.mistakes'), list('study-mistakes', gh ? gh.mistakes : guide.mistakes, false, !english), 'mistakes'),
    section(tr('study.sec.asked'), h('p', {}, text(gh?.asked, guide.asked))),
    ex
      ? h(
          'section',
          { class: 'panel study-sec example' },
          h('h3', {}, tr('study.sec.example')),
          h('p', { class: 'ex-q' }, h('b', {}, tr('study.ex.q')), english ? en(ex.q) : ex.q),
          h('details', { class: 'ex-a', open: true }, h('summary', {}, tr('study.ex.a')), h('p', {}, english ? en(ex.a) : ex.a)),
        )
      : null,
    los.length
      ? h(
          'section',
          { class: 'panel study-sec outcomes' },
          h('h3', {}, tr('study.sec.outcomes')),
          h('p', { class: 'muted-line' }, outPre, en(OUTCOME_MAPPING_STATUS), outPost),
          h('ul', { class: 'lo-list' }, ...los.map(o => h('li', { 'data-outcome': o.id }, h('code', {}, o.id), ' ', en(o.text)))),
        )
      : null,
    h(
      'section',
      { class: 'panel study-sec tools no-print' },
      h('h3', {}, tr('study.sec.tools')),
      h(
        'ul',
        { class: 'tool-links' },
        ...labs.map(l => h('li', {}, h('a', { href: hrefOf(l) }, isCard(l) ? tr('study.read') : tr('study.try'), en(titleOf(l).replace(/^Card: /, ''))))),
        ...skills.map(s => h('li', {}, h('a', { href: `#/practice/${s.skill}` }, tr('study.practiseLink'), en(s.title)))),
        labs.length + skills.length === 0 ? h('li', {}, tr('study.none')) : null,
      ),
    ),
    materialsSection,
    h(
      'nav',
      { class: 'study-pager no-print', 'aria-label': tr('study.pager.aria') },
      prev ? h('a', { class: 'button', rel: 'prev', href: studyHref(prev.id) }, '← ', topicTitle(prev.id, prev.title)) : h('span', {}),
      next ? h('a', { class: 'button primary', rel: 'next', href: studyHref(next.id) }, topicTitle(next.id, next.title), ' →') : h('span', {}),
    ),
    statusNote(),
  );
}
