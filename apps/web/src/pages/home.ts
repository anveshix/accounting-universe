import { SOURCE, UNITS, CLAUSES, type ClassLevel } from '../../../../packages/curriculum/src';
import { h } from '../dom';
import { ALL_LABS, PAGES, coverage } from '../labs';
import { state } from '../state';
import { storageMode, setProfile } from '../store';
import { navigate } from '../router';
import { mountHeroScene } from '../experience/heroScene';

export function homePage(rerender: () => void): HTMLElement {
  const cls = state.profile.cls;
  const choose = (c: ClassLevel) => { state.profile = { ...state.profile, cls: c }; void setProfile(state.profile); rerender(); };
  const cov = coverage(cls);
  const route = state.profile.route;
  const pct = Math.round((cov.interactive / cov.total) * 100);

  const heroScene = h('div', { class: 'hero-scene', 'aria-hidden': 'true' });
  queueMicrotask(() => {
    const handle = mountHeroScene(heroScene);
    if (handle) {
      const obs = new MutationObserver(() => {
        if (!document.body.contains(heroScene)) { handle.dispose(); obs.disconnect(); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  });

  return h('div', { class: 'home' },
    // HERO — decluttered: one clear message, class picker, two primary actions
    h('section', { class: 'hero' }, heroScene,
      h('p', { class: 'eyebrow' }, 'CBSE Accountancy (055) · 2026-27'),
      h('h2', {}, 'Learn Accounting ', h('span', { style: 'color:#f0c75a' }, 'by Doing'), ' Accounting.'),
      h('p', { class: 'lead' }, 'Change the numbers, post the entries and watch the Trial Balance and Balance Sheet respond — instantly. Every figure is computed by one exact accounting engine. Works offline, nothing leaves your device.'),
      h('div', { class: 'classpick', role: 'radiogroup', 'aria-label': 'Choose your class' },
        ...(['XI', 'XII'] as ClassLevel[]).map(c => h('button', {
          type: 'button', role: 'radio', 'aria-checked': String(c === cls),
          class: 'bigchoice' + (c === cls ? ' on' : ''),
          onclick: () => choose(c),
        }, h('b', {}, `Class ${c}`), h('span', {}, c === 'XI' ? 'The accounting process & final accounts.' : 'Partnerships, companies & analysis.')))),
      cls === 'XII' ? h('fieldset', { class: 'routebox' }, h('legend', {}, 'Your Class XII option (as per CBSE)'),
        ...([['OPTION_I_ANALYSIS', 'Option I — Analysis + Cash Flow'], ['OPTION_II_COMPUTERISED', 'Option II — Computerised Accounting']] as const).map(([v, label]) =>
          h('label', { class: 'radio' }, h('input', { type: 'radio', name: 'route', value: v, ...(route === v ? { checked: true } : {}), onchange: () => { state.profile = { ...state.profile, route: v }; void setProfile(state.profile); rerender(); } }), ' ', label)),
        route === 'OPTION_II_COMPUTERISED'
          ? h('p', { class: 'note info', style: 'margin-top:.6rem;background:rgba(255,255,255,.92);color:var(--ink);border-radius:8px;padding:.6rem .8rem;' }, 'Option II replaces Analysis & Cash Flow. Use the Computerised Simulator; Partnership & Company labs are shared.')
          : null) : null,
      h('div', { class: 'actions', style: 'margin-top:1.2rem' },
        h('button', { type: 'button', class: 'primary', onclick: () => navigate(`#/class/${cls}`) }, `Open Class ${cls} syllabus`),
        h('button', { type: 'button', onclick: () => navigate('#/practice') }, 'Practise'),
        h('button', { type: 'button', class: 'ghost', onclick: () => navigate('#/labs') }, 'All labs'))),

    // Decluttered features — 2 key promises, not 3
    h('section', { class: 'features', 'aria-label': 'Why this works' },
      h('div', { class: 'feature' }, h('i', { 'aria-hidden': 'true' }, '📘'), h('div', {}, h('b', {}, 'Exact engine'), h('span', {}, 'Money is bigint paise. Every journal, ledger and ratio is computed — never hand-coded.'))),
      h('div', { class: 'feature' }, h('i', { 'aria-hidden': 'true' }, '🎓'), h('div', {}, h('b', {}, 'Learn by doing'), h('span', {}, 'Post entries, see the ledger, trial balance and accounting equation respond — not a video lecture.')))),

    // Stats — 2 honest numbers, decluttered (removed 2 extra cards)
    h('section', { class: 'stat-row', style: 'grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))' },
      h('div', { class: 'stat-card' }, h('b', {}, `${cov.interactive}/${cov.total}`), h('span', {}, `topics have a hands-on lab — Class ${cls}`)),
      h('div', { class: 'stat-card' }, h('b', {}, `${pct}%`), h('span', {}, 'syllabus with interactive coverage')),
      h('div', { class: 'stat-card' }, h('b', {}, 'Offline'), h('span', {}, 'works without internet; saved on this device'))),

    // Start here — well-arranged, limited to 6
    h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:1.5rem 0 .8rem;' },
      h('h3', { style: 'margin:0' }, `Start here — Class ${cls}`),
      h('a', { class: 'button small', href: '#/labs' }, 'View all →')),
    h('section', { class: 'cards' },
      ...PAGES.filter(p => p.cls === cls && (!p.route || route === p.route)).slice(0, 2).map(p =>
        h('a', { class: 'card', href: p.href },
          h('div', { class: 'card-icon', 'aria-hidden': 'true' }, p.id.includes('ledger') ? '📒' : p.id.includes('cas') ? '💻' : '📋'),
          h('h3', {}, p.title), h('p', {}, p.summary), h('span', { class: 'chip' }, `Class ${p.cls}`))),
      ...ALL_LABS.filter(l => l.cls === cls && (!l.route || route === l.route)).slice(0, 4).map(l =>
        h('a', { class: 'card', href: `#/lab/${l.id}` },
          h('div', { class: 'card-icon', 'aria-hidden': 'true' },
            l.title.includes('Depreciation') ? '📉' : l.title.includes('Partnership') ? '🤝' : l.title.includes('Company') ? '🏢' : l.title.includes('Ratio') ? '📊' : l.title.includes('Cash') ? '💸' : '📖'),
          h('h3', {}, l.title), h('p', {}, l.summary), h('span', { class: 'chip' }, `Class ${l.cls}`)))),

    // Honest coverage — decluttered to one line + meter
    h('section', { class: 'panel' },
      h('h3', { style: 'margin-top:0' }, 'Coverage'),
      h('p', { style: 'color:var(--muted);margin:.3rem 0 .7rem' }, `Class ${cls}: ${cov.interactive} interactive labs, ${cov.cardsOnly} theory cards, ${cov.none} not yet built.`),
      h('div', { class: 'meter', role: 'img', 'aria-label': `${cov.interactive} of ${cov.total} topics have an interactive lab` }, h('div', { class: 'meterfill', style: `width:${pct}%` })),
      h('div', { class: 'actions', style: 'margin-top:.9rem' }, h('a', { class: 'button', href: '#/cards' }, 'Concept cards'), h('a', { class: 'button', href: '#/rescue' }, 'Rescue plan'))),

    h('footer', { class: 'app-footer' },
      h('p', {}, 'Syllabus: ', h('a', { href: SOURCE.url, rel: 'noopener', target: '_blank' }, SOURCE.document), ` · ${UNITS.length} units · ${CLAUSES.length} topics. Nothing outside CBSE is taught.`),
      h('p', { class: 'declutter-hide' }, storageMode === 'indexeddb' ? 'Progress stays on this device.' : 'Storage limited — export from My Progress to keep your work.')));

}
