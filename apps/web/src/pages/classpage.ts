import { CORE_SIMULATORS, CLAUSES, UNITS, coreSimulatorsFor, summariseCoreSimProgress, titleHiOf, unitById, type ClassLevel } from '../../../../packages/curriculum/src';
import { h, mount } from '../dom';
import { PAGES, ALL_LABS, labsOfClause, hrefOf, titleOf, isCard } from '../labs';
import { icon, iconForLab } from '../icons';
import { en, tr } from '../i18n';
import type { Key } from '../../../../packages/curriculum/src/i18n';
import { state } from '../state';
import { seen, setProfile } from '../store';

export function classPage(cls: ClassLevel): HTMLElement {
  let route = state.profile.route;
  let query = '';
  let filterMode: 'ALL' | 'INTERACTIVE' | 'VISITED' = 'ALL';
  let seenLabIds = new Set<string>();
  let completedMissions: ReadonlySet<string> = new Set<string>();

  const allClassClauses = CLAUSES.filter(c => c.id.startsWith(`${cls}.`));
  const interactiveTotal = allClassClauses.filter(c => labsOfClause(c.id).some(id => !isCard(id))).length;

  const searchInput = h('input', {
    type: 'search',
    id: `class-search-${cls}`,
    placeholder: tr('class.search.ph'),
    autocomplete: 'off',
  }) as HTMLInputElement;

  const routeBox = h('div', { class: 'class-route-bar' });
  const workbenchesBox = h('section', { class: 'class-workbenches-sec', 'aria-labelledby': `cls-wb-${cls}` });
  const filterGroup = h('div', { class: 'modes class-filter-modes', role: 'group', 'aria-label': tr('class.search') });
  const unitsContainer = h('div', { class: 'class-units-stack' });

  const isClauseVisited = (clauseId: string): boolean => {
    const ids = labsOfClause(clauseId);
    if (ids.some(id => seenLabIds.has(id))) return true;
    return CORE_SIMULATORS.some(cs => cs.clauses.includes(clauseId) && seenLabIds.has(`sim-core:${cs.id}`));
  };

  function drawRouteSwitcher() {
    if (cls !== 'XII') {
      mount(routeBox);
      return;
    }
    mount(
      routeBox,
      h(
        'div',
        { class: 'panel class-option-panel' },
        h('span', { class: 'class-option-label' }, tr('class.route.title')),
        h(
          'div',
          { class: 'modes', role: 'group', 'aria-label': tr('class.route.title') },
          ...(
            [
              ['OPTION_I_ANALYSIS', tr('ui.optionI')],
              ['OPTION_II_COMPUTERISED', tr('ui.optionII')],
            ] as const
          ).map(([val, label]) =>
            h(
              'button',
              {
                type: 'button',
                class: route === val ? 'on' : 'secondary',
                'aria-pressed': String(route === val),
                onclick: () => {
                  route = val;
                  state.profile = { ...state.profile, route: val };
                  void setProfile(state.profile);
                  drawAll();
                },
              },
              label,
            ),
          ),
        ),
      ),
    );
  }

  function drawWorkbenches() {
    const sims = coreSimulatorsFor(cls, route);
    mount(
      workbenchesBox,
      h('div', { class: 'section-head' }, h('h3', { id: `cls-wb-${cls}` }, tr('class.workbenches.t', { cls })), h('a', { class: 'button small', href: '#/sims' }, tr('home.workbenches.all'))),
      h(
        'div',
        { class: 'cards home-workbench-grid' },
        ...sims.map(cs => {
          const cleared = cs.missions.filter(m => completedMissions.has(`${cs.id}:${m.tier}`)).length;
          const unitTitle = unitById(cs.unit)?.title ?? cs.unit;
          return h(
            'a',
            { class: 'card home-workbench-card', href: `#/sim-lab/${cs.id}`, 'data-cls-workbench': cs.id },
            h(
              'div',
              { class: 'folio-card-head' },
              h('div', { class: 'card-icon' }, icon(iconForLab(cs.id, cs.title), 18)),
              h('span', { class: 'simlab-code-pill' }, en(`Lab ${cs.code}`)),
              h('span', { class: 'simlab-meta-count' }, tr('home.workbenches.missions', { done: cleared })),
            ),
            h('h4', {}, state.lang === 'hi' ? cs.titleHi : cs.title),
            h('p', { class: 'simlab-card-sub' }, en(cs.subtitle)),
            h('div', { class: 'simlab-tier-dots', 'aria-hidden': 'true' }, ...cs.missions.map(m => h('i', { class: completedMissions.has(`${cs.id}:${m.tier}`) ? 'done' : '' }))),
            h('div', { class: 'home-workbench-foot' }, h('small', { class: 'hint' }, en(unitTitle)), h('span', { class: 'home-workbench-cta' }, tr('home.workbenches.open'), ' →')),
          );
        }),
      ),
    );
  }

  function drawFilterModes() {
    const visitedCount = allClassClauses.filter(c => isClauseVisited(c.id)).length;
    const buttons: readonly ['ALL' | 'INTERACTIVE' | 'VISITED', string][] = [
      ['ALL', tr('class.filter.all', { n: allClassClauses.length })],
      ['INTERACTIVE', tr('class.filter.interactive', { n: interactiveTotal })],
      ['VISITED', tr('class.filter.visited', { n: visitedCount })],
    ];
    mount(
      filterGroup,
      ...buttons.map(([id, label]) =>
        h(
          'button',
          {
            type: 'button',
            class: filterMode === id ? 'on' : 'secondary',
            'aria-pressed': String(filterMode === id),
            onclick: () => {
              filterMode = id;
              drawFilterModes();
              drawUnits();
            },
          },
          label,
        ),
      ),
    );
  }

  function drawUnits() {
    const q = query.trim().toLowerCase();
    const unitSections = UNITS.filter(u => u.cls === cls)
      .map(u => {
        const inRoute = u.route === 'COMMON' || u.route === route;
        const allClauses = CLAUSES.filter(c => c.unit === u.id);
        const clauses = allClauses.filter(c => {
          const labs = labsOfClause(c.id);
          const hasInteractive = labs.some(id => !isCard(id));
          if (filterMode === 'INTERACTIVE' && !hasInteractive) return false;
          if (filterMode === 'VISITED' && !isClauseVisited(c.id)) return false;
          if (!q) return true;
          const hiTitle = titleHiOf(c.id) ?? '';
          const labTitles = labs.map(id => titleOf(id)).join(' ');
          return `${c.id} ${c.title} ${hiTitle} ${u.title} ${labTitles}`.toLowerCase().includes(q);
        });

        if (!clauses.length && (q || filterMode !== 'ALL')) return null;

        const interactiveCount = allClauses.filter(c => labsOfClause(c.id).some(id => !isCard(id))).length;
        return h(
          'section',
          { class: 'panel unit' + (inRoute ? '' : ' dim') },
          h(
            'div',
            { class: 'unit-row-head' },
            h('h3', { class: 'flush-top' }, tr(`unit.${u.id}` as Key)),
            h(
              'div',
              { class: 'unit-row-chips' },
              h('span', { class: 'chip' }, tr('ui.marks', { n: u.marks })),
              u.route !== 'COMMON' ? h('span', { class: 'chip alt' }, tr(u.route === 'OPTION_I_ANALYSIS' ? 'ui.optionI' : 'ui.optionII')) : null,
              h('span', { class: 'chip solved' }, tr('cls.labsOf', { a: interactiveCount, b: allClauses.length })),
            ),
          ),
          !inRoute ? h('p', { class: 'hint unit-other-note' }, tr('cls.otherOption')) : null,
          h(
            'ul',
            { class: 'clauselist' },
            ...clauses.map(c => {
              const labs = labsOfClause(c.id);
              const coreMatches = CORE_SIMULATORS.filter(cs => cs.clauses.includes(c.id));
              const visited = isClauseVisited(c.id);
              const labsNode =
                labs.length || coreMatches.length
                  ? h(
                      'div',
                      { class: 'labs', style: 'margin-top:.35rem;display:flex;flex-wrap:wrap;gap:.35rem' },
                      ...coreMatches.map(cs => h('a', { class: 'pill workbench-pill', href: `#/sim-lab/${cs.id}` }, en(`Lab ${cs.code}: ${cs.title}`))),
                      ...labs.map(id =>
                        h('a', { class: 'pill' + (isCard(id) ? ' card-pill' : '') + (seenLabIds.has(id) ? ' seen-pill' : ''), href: hrefOf(id) }, seenLabIds.has(id) ? '✓ ' : '', en(titleOf(id))),
                      ),
                    )
                  : h('span', { class: 'pill none' }, tr('cls.notBuilt'));
              // CRITICAL: keep first child inside `li > div` as `B` followed by `SPAN.cid` for Hindi DOM structure contract
              return h(
                'li',
                { class: visited ? 'clause-visited' : '' },
                h(
                  'div',
                  {},
                  h('b', { style: 'font-weight:650' }, h('a', { class: 'study-link', href: `#/study/${c.id}` }, state.lang === 'hi' ? (titleHiOf(c.id) ?? en(c.title)) : c.title)),
                  ' ',
                  h('span', { class: 'cid', lang: 'en', title: tr('cls.code') }, c.id),
                  c.limit ? h('em', { class: 'limit' }, tr('cls.limit'), en(c.limit)) : null,
                ),
                labsNode,
              );
            }),
          ),
        );
      })
      .filter(Boolean) as HTMLElement[];

    mount(unitsContainer, ...unitSections);
  }

  function drawAll() {
    drawRouteSwitcher();
    drawWorkbenches();
    drawFilterModes();
    drawUnits();
  }

  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    drawUnits();
  });

  drawAll();
  void (async () => {
    try {
      const s = await seen();
      seenLabIds = new Set(s.map(entry => entry.lab));
      completedMissions = summariseCoreSimProgress(s, route).completedMissions;
      drawAll();
    } catch {
      /* keep synchronous render if IndexedDB unavailable */
    }
  })();

  return h(
    'div',
    { class: 'classpage' },
    h(
      'header',
      { class: 'labhead' },
      h(
        'nav',
        { class: 'breadcrumb', 'aria-label': 'Breadcrumb' },
        h('a', { href: '#/' }, tr('ui.home')),
        h('span', { 'aria-hidden': 'true' }, ' \u203A '),
        h('span', { 'aria-current': 'page' }, tr('ui.class', { cls })),
      ),
      h('p', { class: 'eyebrow' }, tr('cls.eyebrow')),
      h('h2', {}, tr('cls.h2', { cls })),
      h('p', { class: 'lead' }, tr('cls.lead')),
      h('p', { class: 'experience-note' }, icon('compass', 18), h('span', {}, h('b', {}, tr('cls.howto')), tr('cls.howto.d'))),
    ),
    h(
      'div',
      { class: 'class-cta-strip' },
      h('a', { class: 'button primary', href: '#/labs' }, tr('cls.openLabs')),
      h('a', { class: 'button', href: '#/sims' }, tr('labs.sims.link')),
      h('a', { class: 'button', href: '#/practice' }, tr('cls.practise')),
      h('a', { class: 'button', href: `#/study/${cls}` }, tr('cls.study')),
      h('a', { class: 'button', href: '#/cards' }, tr('home.cards')),
    ),
    routeBox,
    workbenchesBox,
    h('div', { class: 'lab-tools class-filter-bar' }, h('div', { class: 'field grow' }, h('label', { for: `class-search-${cls}` }, tr('class.search')), searchInput), filterGroup),
    unitsContainer,
  );
}

interface Tool {
  id: string;
  title: string;
  summary: string;
  cls: ClassLevel;
  href: string;
  unit: string;
}
const unitOf = (clauses: readonly string[]) => CLAUSES.find(c => c.id === clauses[0])?.unit ?? '';

export function labsIndex(): HTMLElement {
  const mine = state.profile.cls;
  const route = state.profile.route;
  // every page and lab as one list, each placed in the syllabus unit of its first topic
  const tools: Tool[] = [
    ...PAGES.map(p => ({ id: p.id, title: p.title, summary: p.summary, cls: p.cls, href: p.href, unit: unitOf(p.clauses) })),
    ...ALL_LABS.map(l => ({ id: l.id, title: l.title, summary: l.summary, cls: l.cls, href: `#/lab/${l.id}`, unit: unitOf(l.clauses) })),
  ];
  let query = '';
  let show: 'MINE' | 'ALL' = 'MINE';
  let seenSet = new Set<string>();
  let completedMissions: ReadonlySet<string> = new Set<string>();

  const searchBox = h('input', { type: 'search', id: 'labsearch', placeholder: tr('labs.placeholder'), autocomplete: 'off', 'aria-describedby': 'labcount' });
  const count = h('p', { id: 'labcount', class: 'status', role: 'status', 'aria-live': 'polite' });
  const workbenchesShowcase = h('section', { class: 'panel labs-workbenches-showcase' });
  const body = h('div', { class: 'labs-body' });
  const filterBtns = (['MINE', 'ALL'] as const).map(v =>
    h(
      'button',
      {
        type: 'button',
        role: 'radio',
        'data-filter': v,
        'aria-checked': String(v === show),
        class: v === show ? 'on' : '',
        onclick: () => {
          show = v;
          draw();
        },
      },
      v === 'MINE' ? tr('ui.class', { cls: mine }) : tr('labs.filter.both'),
    ),
  );

  const card = (t: Tool, idx: number) => {
    const visited = seenSet.has(t.id);
    return h(
      'a',
      { class: 'card folio-card' + (visited ? ' visited-card' : ''), href: t.href, 'data-tool': t.id },
      h(
        'div',
        { class: 'folio-card-head' },
        h('div', { class: 'card-icon' }, icon(iconForLab(t.id, t.title), 20)),
        h('span', { class: 'folio-index', 'aria-hidden': 'true' }, (visited ? '✓ ' : '') + String(idx + 1).padStart(2, '0')),
      ),
      h('h3', {}, en(t.title)),
      h('p', {}, en(t.summary)),
      h('span', { class: 'chip' + (visited ? ' solved' : '') }, tr('ui.class', { cls: t.cls })),
    );
  };

  function drawWorkbenches(q: string) {
    const pool = show === 'MINE' ? coreSimulatorsFor(mine, route) : CORE_SIMULATORS;
    const filtered = pool.filter(cs => !q || `${cs.title} ${cs.titleHi} ${cs.subtitle} ${cs.summary}`.toLowerCase().includes(q));
    if (!filtered.length) {
      workbenchesShowcase.hidden = true;
      return;
    }
    workbenchesShowcase.hidden = false;
    mount(
      workbenchesShowcase,
      h(
        'div',
        { class: 'section-head flush-top' },
        h('div', {}, h('h3', { class: 'flush-top' }, tr('labs.workbenches.t')), h('p', { class: 'muted-line flush-bottom' }, tr('labs.workbenches.sub'))),
        h('a', { class: 'button small primary', href: '#/sims' }, tr('labs.sims.link')),
      ),
      h(
        'div',
        { class: 'labs-wb-grid' },
        ...filtered.map(cs => {
          const cleared = cs.missions.filter(m => completedMissions.has(`${cs.id}:${m.tier}`)).length;
          return h(
            'a',
            { class: 'labs-wb-tile', href: `#/sim-lab/${cs.id}`, 'data-labs-workbench': cs.id },
            h(
              'div',
              { class: 'folio-card-head' },
              h('div', { class: 'card-icon' }, icon(iconForLab(cs.id, cs.title), 18)),
              h('span', { class: 'simlab-code-pill' }, en(`Lab ${cs.code} · Class ${cs.cls}`)),
              h('span', { class: 'simlab-meta-count' }, tr('home.workbenches.missions', { done: cleared })),
            ),
            h('h4', {}, state.lang === 'hi' ? cs.titleHi : cs.title),
            h('p', { class: 'simlab-card-sub' }, en(cs.subtitle)),
            h('div', { class: 'simlab-tier-dots', 'aria-hidden': 'true' }, ...cs.missions.map(m => h('i', { class: completedMissions.has(`${cs.id}:${m.tier}`) ? 'done' : '' }))),
          );
        }),
      ),
    );
  }

  function draw() {
    const q = query.trim().toLowerCase();
    filterBtns.forEach(b => {
      const on = b.getAttribute('data-filter') === show;
      b.setAttribute('aria-checked', String(on));
      b.classList.toggle('on', on);
    });
    drawWorkbenches(q);

    const classes: ClassLevel[] = show === 'MINE' ? [mine] : [mine, mine === 'XI' ? 'XII' : 'XI'];
    let total = 0;
    const sections = classes.flatMap(cls => {
      const units = UNITS.filter(u => u.cls === cls);
      const blocks = units
        .map(u => {
          const inRoute = u.route === 'COMMON' || u.route === route;
          const list = tools.filter(t => t.unit === u.id && (!q || `${t.title} ${t.summary} ${u.title}`.toLowerCase().includes(q)));
          if (!list.length) return null;
          total += list.length;
          return h(
            'details',
            { class: 'unit-group', 'data-unit': u.id, ...(q || cls === mine ? { open: true } : {}) },
            h(
              'summary',
              {},
              h('span', { class: 'unit-name' }, tr(`unit.${u.id}` as Key)),
              h('span', { class: 'chip' }, list.length === 1 ? tr('labs.group.one') : tr('labs.group.n', { n: list.length })),
              inRoute ? null : h('span', { class: 'chip alt' }, tr(u.route === 'OPTION_I_ANALYSIS' ? 'ui.optionI' : 'ui.optionII')),
            ),
            h('div', { class: 'cards' }, ...list.map(card)),
          );
        })
        .filter(Boolean) as HTMLElement[];
      return blocks.length ? [h('h3', { class: 'blockhead class-head', 'data-class': cls }, tr('ui.class', { cls })), ...blocks] : [];
    });
    count.textContent = total === 0 ? tr('labs.count.none') : total === 1 ? tr('labs.count.one') : tr('labs.count.n', { n: total });
    mount(body, ...sections);
  }
  searchBox.addEventListener('input', () => {
    query = (searchBox as HTMLInputElement).value;
    draw();
  });
  draw();
  void (async () => {
    try {
      const s = await seen();
      seenSet = new Set(s.map(x => x.lab));
      completedMissions = summariseCoreSimProgress(s, route).completedMissions;
      draw();
    } catch {
      /* ignore if storage unavailable */
    }
  })();

  return h(
    'div',
    { class: 'labsindex' },
    h(
      'header',
      { class: 'labhead' },
      h(
        'nav',
        { class: 'breadcrumb', 'aria-label': 'Breadcrumb' },
        h('a', { href: '#/' }, tr('ui.home')),
        h('span', { 'aria-hidden': 'true' }, ' \u203A '),
        h('span', { 'aria-current': 'page' }, tr('labs.crumb')),
      ),
      h('p', { class: 'eyebrow' }, tr('labs.eyebrow')),
      h('h2', {}, tr('labs.h2')),
      h('p', { class: 'lead' }, tr('labs.lead')),
    ),
    h(
      'div',
      { class: 'lab-tools' },
      h('div', { class: 'field grow' }, h('label', { for: 'labsearch' }, tr('labs.search')), searchBox),
      h('div', { class: 'modes', role: 'radiogroup', 'aria-label': tr('labs.filter.aria') }, ...filterBtns),
    ),
    workbenchesShowcase,
    count,
    body,
    h('p', { class: 'experience-note' }, icon('lightbulb', 18), h('span', {}, tr('labs.tip'))),
  );
}
