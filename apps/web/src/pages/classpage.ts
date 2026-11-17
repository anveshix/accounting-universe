import { UNITS, CLAUSES, type ClassLevel } from '../../../../packages/curriculum/src';
import { h } from '../dom';
import { PAGES, ALL_LABS, labsOfClause, hrefOf, titleOf, isCard } from '../labs';
import { state } from '../state';

export function classPage(cls: ClassLevel): HTMLElement {
  const route = state.profile.route;
  const unitSections = UNITS.filter(u => u.cls === cls).map(u => {
    const inRoute = u.route === 'COMMON' || u.route === route;
    const clauses = CLAUSES.filter(c => c.unit === u.id);
    const interactiveCount = clauses.filter(c => labsOfClause(c.id).some(id => !isCard(id))).length;
    return h('section', { class: 'panel unit' + (inRoute ? '' : ' dim'), style: 'position:relative;overflow:hidden' },
      h('div', { style: `position:absolute;top:0;left:0;right:0;height:3px;background:${inRoute ? 'linear-gradient(90deg,var(--brand),var(--accent))' : 'var(--line)'};opacity:${inRoute ? 1 : .4}` }),
      h('div', { style: 'display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:.6rem;margin-bottom:.2rem' },
        h('h3', { style: 'margin:0' }, u.title),
        h('div', { style: 'display:flex;gap:.4rem;flex-wrap:wrap' },
          h('span', { class: 'chip' }, `${u.marks} marks`),
          u.route !== 'COMMON' ? h('span', { class: 'chip alt' }, u.route === 'OPTION_I_ANALYSIS' ? 'Option I' : 'Option II') : null,
          h('span', { class: 'chip', style: 'background:var(--good-bg);color:var(--good);border-color:color-mix(in srgb,var(--good) 16%, transparent)' }, `${interactiveCount}/${clauses.length} labs`))),
      !inRoute ? h('p', { class: 'hint', style: 'margin:.4rem 0 .6rem;padding:.5rem .7rem;background:var(--accent-soft);border:1px solid var(--line-2);border-radius:8px' }, 'This unit belongs to the other Class XII option. You can still open it.') : null,
      h('ul', { class: 'clauselist' }, ...clauses.map(c => {
        const labs = labsOfClause(c.id);
        const labsNode = labs.length
          ? h('div', { class: 'labs', style: 'margin-top:.35rem;display:flex;flex-wrap:wrap;gap:.3rem' }, ...labs.map(id => h('a', { class: 'pill' + (isCard(id) ? ' card-pill' : ''), href: hrefOf(id) }, titleOf(id))))
          : h('span', { class: 'pill none' }, 'Not built yet - theory card coming');
        return h('li', {},
          h('div', {}, h('span', { class: 'cid' }, c.id), ' ', h('b', { style: 'font-weight:650' }, c.title), c.limit ? h('em', { class: 'limit' }, ` - Limit: ${c.limit}`) : null),
          labsNode);
      })));
  });

  return h('div', { class: 'classpage' },
    h('header', { class: 'labhead' },
      h('nav', { class: 'breadcrumb', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/' }, 'Home'), h('span', { 'aria-hidden': 'true' }, ' \u203A '), h('span', { 'aria-current': 'page' }, `Class ${cls}`)),
      h('p', { class: 'eyebrow' }, 'CBSE 2026-27 \u00B7 Syllabus map'),
      h('h2', {}, `Class ${cls} syllabus`),
      h('p', { class: 'lead' }, 'Every topic maps to exactly what CBSE prescribes. Interactive labs are solid pills, theory cards are green - anything not built is shown plainly. Nothing is claimed unless it works.'),
      h('p', { class: 'experience-note' }, h('span', { 'aria-hidden': 'true' }, '\uD83D\uDCD6'), h('span', {}, h('b', {}, 'How to use: '), 'Start with the first unit. Open a lab, do the Worked Example, then Try it with your own numbers. Use Practice for exam-style questions.'))),
    h('div', { style: 'display:flex;gap:.6rem;flex-wrap:wrap;margin:0 0 1.2rem' },
      h('a', { class: 'button primary', href: '#/labs' }, 'Open visual labs \u2192'),
      h('a', { class: 'button', href: '#/practice' }, 'Practise questions \u2192'),
      h('a', { class: 'button', href: '#/cards' }, 'Concept cards')),
    ...unitSections);
}

export function labsIndex(): HTMLElement {
  const cls = state.profile.cls;
  const mine = ALL_LABS.filter(l => l.cls === cls);
  const others = ALL_LABS.filter(l => l.cls !== cls);
  const card = (l: { id: string; title: string; summary: string; cls: string }, href: string) => {
    const icon = l.title.includes('Ledger') ? '\uD83D\uDCD2' : l.title.includes('Depreciation') ? '\uD83D\uDCC9' : l.title.includes('Partnership') ? '\uD83E\uDD1D' : l.title.includes('Company') ? '\uD83C\uDFE2' : l.title.includes('Ratio') ? '\uD83D\uDCCA' : l.title.includes('Cash') ? '\uD83D\uDCB8' : '\uD83E\uDDEA';
    return h('a', { class: 'card', href }, h('div', { class: 'card-icon', 'aria-hidden': 'true' }, icon), h('h3', {}, l.title), h('p', {}, l.summary), h('span', { class: 'chip' }, `Class ${l.cls}`));
  };
  return h('div', { class: 'labsindex' },
    h('header', { class: 'labhead' },
      h('nav', { class: 'breadcrumb', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/' }, 'Home'), h('span', { 'aria-hidden': 'true' }, ' \u203A '), h('span', { 'aria-current': 'page' }, 'Visual Labs')),
      h('p', { class: 'eyebrow' }, 'Experiential labs'),
      h('h2', {}, 'Change the numbers, see the books respond'),
      h('p', { class: 'lead' }, `Explore accounting with worked examples and interactive labs. Check assumptions and presentation against your teacher’s instructions. Showing Class ${cls} first.`),
      h('div', { class: 'experience-note' }, h('span', { 'aria-hidden': 'true' }, '\uD83C\uDFAF'), h('span', {}, 'Tip: In the Ledger lab, try posting an unbalanced entry to see why it is refused.'))),
    h('div', { class: 'kicker' }, `Class ${cls} - featured`),
    h('div', { class: 'cards', style: 'margin-top:.6rem' }, ...PAGES.filter(p => p.cls === cls).map(p => card(p, p.href)), ...mine.map(l => card(l, `#/lab/${l.id}`))),
    h('h3', { class: 'blockhead', style: 'margin-top:1.6rem' }, `Class ${cls === 'XI' ? 'XII' : 'XI'} labs`),
    h('p', { class: 'hint', style: 'margin:.3rem 0 .7rem' }, 'Switch your class on the Home page to bring the other class first.'),
    h('div', { class: 'cards' }, ...PAGES.filter(p => p.cls !== cls).map(p => card(p, p.href)), ...others.map(l => card(l, `#/lab/${l.id}`))),
    h('section', { class: 'panel', style: 'margin-top:1.4rem' },
      h('h3', {}, 'How labs work'),
      h('ul', { style: 'margin:.4rem 0 0;padding-left:1.2rem;line-height:1.6;color:var(--muted)' },
        h('li', {}, h('b', { style: 'color:var(--ink)' }, 'Learn'), ' - the idea in plain language + where you see it in real life.'),
        h('li', {}, h('b', { style: 'color:var(--ink)' }, 'Worked example'), ' - the engine shows every step.'),
        h('li', {}, h('b', { style: 'color:var(--ink)' }, 'Try it'), ' - change any number; the books recompute instantly.'))));
}
