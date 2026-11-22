import { CLAUSES, SKILLS, STUDY_STATUS, UNITS, outcomesOf, OUTCOME_MAPPING_STATUS, studyOf, type ClassLevel } from '../../../../packages/curriculum/src';
import { h } from '../dom';
import { icon } from '../icons';
import { hrefOf, isCard, labsOfClause, titleOf } from '../labs';
import { state } from '../state';
import { attempts, recordSeen } from '../store';

/** Hash of the study page for a topic or a class. */
export const studyHref = (id: string) => `#/study/${id}`;

const isClass = (x: string | undefined): x is ClassLevel => x === 'XI' || x === 'XII';
const list = (cls: string, items: readonly string[], ordered = false) => h(ordered ? 'ol' : 'ul', { class: cls }, ...items.map(t => h('li', {}, t)));

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
        h('h3', {}, u.title),
        h('span', { class: 'chip' }, `${u.marks} marks`),
        u.route !== 'COMMON' ? h('span', { class: 'chip alt' }, u.route === 'OPTION_I_ANALYSIS' ? 'Option I' : 'Option II') : null,
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
              prog.textContent = `${p.pct}% · ${p.n} tried`;
              prog.removeAttribute('hidden');
            }
          });
          return h(
            'li',
            {},
            h('a', { class: 'topic-link', href: studyHref(c.id), 'data-topic': c.id }, h('span', { class: 'topic-no' }, String(i + 1)), h('span', { class: 'topic-title' }, c.title)),
            h(
              'span',
              { class: 'topic-meta' },
              labs ? h('span', { class: 'chip' }, `${labs} lab${labs > 1 ? 's' : ''}`) : null,
              skills ? h('span', { class: 'chip' }, `${skills} practice skill${skills > 1 ? 's' : ''}`) : null,
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
        h('a', { href: '#/' }, 'Home'),
        h('span', { 'aria-hidden': 'true' }, ' › '),
        h('a', { href: `#/class/${cls}` }, `Class ${cls}`),
        h('span', { 'aria-hidden': 'true' }, ' › '),
        h('span', { 'aria-current': 'page' }, 'Study guide'),
      ),
      h('p', { class: 'eyebrow' }, 'Chapter-wise study guide'),
      h('h2', {}, `Class ${cls}: every topic, in syllabus order`),
      h(
        'p',
        { class: 'lead' },
        'Short revision notes for each topic: what to know, formats and formulae, how to solve, the mistakes that lose marks, and how it is asked. Then try it in a lab and practise.',
      ),
      h('p', { class: 'note info study-status' }, STUDY_STATUS),
    ),
    h(
      'div',
      { class: 'actions' },
      ...(['XI', 'XII'] as const).map(c => h('a', { class: 'button' + (c === cls ? ' primary' : ''), href: `#/study/${c}`, 'aria-current': c === cls ? 'page' : undefined }, `Class ${c}`)),
    ),
    ...sections,
  );
}

// ───────────────────────── one topic ─────────────────────────
function topicPage(id: string): HTMLElement {
  const clause = CLAUSES.find(c => c.id === id),
    guide = clause ? studyOf(clause.id) : undefined;
  if (!clause || !guide)
    return h('div', { class: 'panel' }, h('h2', {}, 'Topic not found'), h('p', {}, 'There is no study guide at this address.'), h('a', { class: 'button', href: '#/study' }, 'Open the study guide'));
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

  const progress = h('p', { class: 'note study-progress', 'data-study-progress': '', hidden: true });
  void progressFor(clause.id).then(p => {
    if (p) {
      progress.textContent = `Your practice on this topic: ${p.n} question${p.n > 1 ? 's' : ''}, ${p.pct}% of the marks so far. Saved on this device only.`;
      progress.removeAttribute('hidden');
    }
  });

  const section = (title: string, body: Node | null, cls = '') => (body ? h('section', { class: `panel study-sec ${cls}` }, h('h3', {}, title), body) : null);

  return h(
    'article',
    { class: 'study', 'data-clause': clause.id },
    h(
      'header',
      { class: 'labhead' },
      h(
        'nav',
        { class: 'breadcrumb no-print', 'aria-label': 'Breadcrumb' },
        h('a', { href: '#/' }, 'Home'),
        h('span', { 'aria-hidden': 'true' }, ' › '),
        h('a', { href: `#/study/${cls}` }, `Class ${cls} study guide`),
        h('span', { 'aria-hidden': 'true' }, ' › '),
        h('span', { 'aria-current': 'page' }, `Topic ${at + 1}`),
      ),
      h('p', { class: 'eyebrow' }, `${unit.title} · ${unit.marks} marks`),
      h('h2', {}, clause.title),
      clause.limit ? h('p', { class: 'note warn study-limit' }, h('b', {}, 'Official syllabus limit: '), clause.limit) : null,
      h('p', { class: 'lead' }, guide.summary),
      h(
        'div',
        { class: 'actions no-print' },
        skills[0] ? h('a', { class: 'button primary', href: `#/practice/${skills[0].skill}` }, icon('target', 16), ' Practise this topic') : null,
        h('button', { type: 'button', 'data-print': '', onclick: () => window.print() }, 'Print or save as PDF'),
      ),
      progress,
    ),
    section('What to know', list('study-list', guide.mustKnow)),
    section('Formats and formulae', guide.formats ? list('study-formats', guide.formats) : null),
    section('How to solve it', guide.steps ? list('study-steps', guide.steps, true) : null),
    section('Mistakes that lose marks', list('study-mistakes', guide.mistakes), 'mistakes'),
    section('How it is asked', h('p', {}, guide.asked)),
    guide.example
      ? h(
          'section',
          { class: 'panel study-sec example' },
          h('h3', {}, 'Worked example'),
          h('p', { class: 'ex-q' }, h('b', {}, 'Question. '), guide.example.q),
          h('details', { class: 'ex-a', open: true }, h('summary', {}, 'Answer'), h('p', {}, guide.example.a)),
        )
      : null,
    los.length
      ? h(
          'section',
          { class: 'panel study-sec outcomes' },
          h('h3', {}, 'Official learning outcomes'),
          h('p', { class: 'muted-line' }, `Wording from the CBSE 2026-27 curriculum. Which outcomes this topic serves is ${OUTCOME_MAPPING_STATUS}.`),
          h('ul', { class: 'lo-list' }, ...los.map(o => h('li', { 'data-outcome': o.id }, h('code', {}, o.id), ' ', o.text))),
        )
      : null,
    h(
      'section',
      { class: 'panel study-sec tools no-print' },
      h('h3', {}, 'Learn, try, practise'),
      h(
        'ul',
        { class: 'tool-links' },
        ...labs.map(l => h('li', {}, h('a', { href: hrefOf(l) }, isCard(l) ? 'Read: ' : 'Try it: ', titleOf(l).replace(/^Card: /, '')))),
        ...skills.map(s => h('li', {}, h('a', { href: `#/practice/${s.skill}` }, 'Practise: ', s.title))),
        labs.length + skills.length === 0 ? h('li', {}, 'No lab or practice skill for this topic yet.') : null,
      ),
    ),
    h(
      'nav',
      { class: 'study-pager no-print', 'aria-label': 'Previous and next topic' },
      prev ? h('a', { class: 'button', rel: 'prev', href: studyHref(prev.id) }, '← ', prev.title) : h('span', {}),
      next ? h('a', { class: 'button primary', rel: 'next', href: studyHref(next.id) }, next.title, ' →') : h('span', {}),
    ),
    h('p', { class: 'note info study-status' }, STUDY_STATUS),
  );
}
