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
  // mount Three.js after DOM attaches (microtask ensures element is in document)
  queueMicrotask(() => {
    const handle = mountHeroScene(heroScene);
    if (handle) {
      // dispose when page leaves — main.ts calls runDisposers which we hook via a simple weak ref
      const obs = new MutationObserver(() => {
        if (!document.body.contains(heroScene)) { handle.dispose(); obs.disconnect(); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  });

  return h('div', { class: 'home' },
    h('section', { class: 'hero' }, heroScene,
      h('p', { class: 'eyebrow' }, 'CBSE Accountancy (055) · 2026-27 · Offline-first'),
      h('h2', {}, 'Learn Accounting ', h('span', { style: 'color:#f0c75a' }, 'by Doing'), ' Accounting.'),
      h('p', { class: 'lead' }, 'Not a video lecture. Change the numbers, post the entries and watch the Trial Balance, Balance Sheet and Cash Flow update — instantly, with every figure computed by one exact accounting engine.'),
      h('div', { class: 'classpick', role: 'radiogroup', 'aria-label': 'Choose your class' },
        ...(['XI', 'XII'] as ClassLevel[]).map(c => h('button', {
          type: 'button', role: 'radio', 'aria-checked': String(c === cls),
          class: 'bigchoice' + (c === cls ? ' on' : ''),
          onclick: () => choose(c),
        }, h('b', {}, `Class ${c}`), h('span', {}, c === 'XI' ? 'The accounting process & final accounts — the foundation.' : 'Partnerships, companies & financial analysis — the board year.')))),
      cls === 'XII' ? h('fieldset', { class: 'routebox' }, h('legend', {}, 'Your Class XII option (as per CBSE syllabus)'),
        ...([['OPTION_I_ANALYSIS', 'Option I — Analysis of Financial Statements + Cash Flow'], ['OPTION_II_COMPUTERISED', 'Option II — Computerised Accounting']] as const).map(([v, label]) =>
          h('label', { class: 'radio' }, h('input', { type: 'radio', name: 'route', value: v, ...(route === v ? { checked: true } : {}), onchange: () => { state.profile = { ...state.profile, route: v }; void setProfile(state.profile); rerender(); } }), ' ', label)),
        route === 'OPTION_II_COMPUTERISED'
          ? h('p', { class: 'note info', style: 'margin-top:.6rem;background:rgba(255,255,255,.92);color:var(--ink);border-radius:8px;padding:.6rem .8rem;' }, 'Option II replaces the Analysis and Cash Flow units. Use the Computerised Accounting Simulator and the Spreadsheet Lab; Partnership and Company labs are shared by both options.')
          : null) : null,
      h('div', { class: 'actions', style: 'margin-top:1.1rem' },
        h('button', { type: 'button', class: 'primary', onclick: () => navigate(`#/class/${cls}`) }, `Open Class ${cls} syllabus →`),
        h('button', { type: 'button', onclick: () => navigate('#/practice') }, 'Start practising'),
        h('button', { type: 'button', class: 'ghost', onclick: () => navigate('#/labs') }, 'Explore all labs')),
      // Trust bar
      h('div', { class: 'actions', style: 'margin-top:1rem;gap:.5rem;opacity:.92' },
        h('span', { class: 'chip alt', style: 'background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.35);' }, '✓ No data leaves your device'),
        h('span', { class: 'chip alt', style: 'background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.35);' }, '✓ Works offline'),
        h('span', { class: 'chip alt', style: 'background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.35);' }, '✓ Syllabus-locked'))),

    // Professional feature highlights — well arranged, not scattered
    h('section', { class: 'features', 'aria-label': 'Why this works' },
      h('div', { class: 'feature' }, h('i', { 'aria-hidden': 'true' }, '📘'), h('div', {}, h('b', {}, 'Exact engine, not mock-ups'), h('span', {}, 'Money is bigint paise. Every journal, ledger and ratio is computed — never hand-coded.'))),
      h('div', { class: 'feature' }, h('i', { 'aria-hidden': 'true' }, '🎓'), h('div', {}, h('b', {}, 'Experiential, not passive'), h('span', {}, 'Drag transactions, tilt the balance scale, watch the 3D ledger respond — learn by doing.'))),
      h('div', { class: 'feature' }, h('i', { 'aria-hidden': 'true' }, '📊'), h('div', {}, h('b', {}, 'Teacher-ready progress'), h('span', {}, 'Attempts, heat-maps and exports stay on-device and are ready for your teacher.')))),

    // Stats — honest coverage
    h('section', { class: 'stat-row' },
      h('div', { class: 'stat-card' }, h('b', {}, `${cov.interactive}`), h('span', {}, `interactive labs for Class ${cls}`)),
      h('div', { class: 'stat-card' }, h('b', {}, `${pct}%`), h('span', {}, 'syllabus topics have a hands-on lab')),
      h('div', { class: 'stat-card' }, h('b', {}, `${cov.total}`), h('span', {}, 'syllabus topics modelled in total')),
      h('div', { class: 'stat-card' }, h('b', {}, '∞'), h('span', {}, 'practice questions generated fresh'))),

    // Well-arranged lab cards
    h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:1.4rem 0 .8rem;' },
      h('h3', { style: 'margin:0' }, `Start here — Class ${cls}`),
      h('a', { class: 'button small', href: '#/labs' }, 'View all labs →')),
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

    h('section', { class: 'panel' },
      h('div', { class: 'kicker' }, 'Honest coverage'),
      h('h3', { style: 'margin-top:.6rem' }, 'What is built — and what is not (yet)'),
      h('p', { style: 'color:var(--muted);margin:.4rem 0 .8rem' }, `Class ${cls} has ${cov.total} syllabus topics: ${cov.interactive} have an interactive lab or page, ${cov.cardsOnly} are covered by concept cards (theory), and ${cov.none} are not built yet. Nothing is claimed unless it works.`),
      h('div', { class: 'meter', role: 'img', 'aria-label': `${cov.interactive} of ${cov.total} topics have an interactive lab` }, h('div', { class: 'meterfill', style: `width:${pct}%` })),
      h('div', { style: 'display:flex;gap:.6rem;margin-top:.7rem;flex-wrap:wrap;' },
        h('span', { class: 'chip' }, `✓ ${cov.interactive} labs`), h('span', { class: 'chip alt' }, `📄 ${cov.cardsOnly} cards`), cov.none ? h('span', { class: 'pill none' }, `${cov.none} not built`) : null),
      h('div', { class: 'actions', style: 'margin-top:1rem' }, h('a', { class: 'button', href: '#/cards' }, 'Concept cards →'), h('a', { class: 'button', href: '#/rescue' }, 'I’m stuck — rescue plan →'))),

    h('footer', { class: 'app-footer' },
      h('p', {}, 'Syllabus source: ', h('a', { href: SOURCE.url, rel: 'noopener', target: '_blank' }, SOURCE.document), ` · SHA-256 ${SOURCE.sha256.slice(0, 12)}… · ${UNITS.length} units · ${CLAUSES.length} topics modelled. Nothing outside it is taught.`),
      h('p', {}, storageMode === 'indexeddb' ? 'Your progress is saved on this device only — it never leaves your browser.' : 'Storage is limited in this browser mode, so progress lasts until you close the tab. Use “Export” on My Progress to keep it.'),
      h('p', { style: 'margin-top:.6rem' }, 'Built for CBSE Class XI & XII (2026-27). Every figure verified by the accounting engine.')));

}
