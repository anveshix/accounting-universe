/**
 * Visual simulators — two pages, one renderer.
 *
 *   `simsIndex`  the chapter-wise gallery: what each chapter needs, what is solved, what pays XP.
 *   `simPage`    one simulator: live controls, a picture, "what to notice", and one challenge.
 *
 * All numbers come from `packages/curriculum/src/simulators.ts`; this file only draws. The picture is plain HTML bars
 * (no <canvas>, no library): it scales on a phone, prints, and a screen reader gets the exact figure as text.
 */
import {
  CORE_SIMULATORS,
  SIM_ACHIEVEMENT_BADGES,
  SIM_BADGE_AT,
  SIMULATORS,
  clauseById,
  coreSimulatorsFor,
  simLabId,
  simulatorById,
  simulatorsByChapter,
  summariseCoreSimProgress,
  unitById,
  type ClassLevel,
  type SimControl,
  type Simulator,
  type SimVisual,
} from '../../../../packages/curriculum/src';
import { h, mount, reducedMotion } from '../dom';
import { onDispose } from '../machine-dom';
import { announce } from '../ui';
import { icon } from '../icons';
import { recordSeen, seen, type Seen } from '../store';
import { currentRewards, drawHud, notify } from '../rewards-ui';
import { loadInto } from '../async';
import { state } from '../state';

/** Solved simulators: a challenge solved is a `sim:<id>` seen event on the `example` tab. */
const solvedSet = (s: readonly Seen[]) => new Set(s.filter(x => x.tab === 'example' && x.lab.startsWith('sim:')).map(x => x.lab.slice(4)));
const chapterOf = (sim: Simulator) => clauseById(sim.clause)?.title ?? sim.clause;

/* ───────────────────────── the picture ───────────────────────── */

/** One collapsible working table. The picture stays the headline; the books are one click away. */
function tableBlock(title: string, head: readonly string[], rows: readonly (readonly string[])[], foot?: readonly string[]): HTMLElement {
  return h(
    'details',
    { class: 'simtable' },
    h('summary', {}, title),
    h(
      'div',
      { class: 'tablewrap' },
      h(
        'table',
        { class: 'data' },
        h('thead', {}, h('tr', {}, ...head.map(c => h('th', { scope: 'col' }, c)))),
        h('tbody', {}, ...rows.map(r => h('tr', {}, ...r.map(c => h('td', {}, c))))),
        foot ? h('tfoot', {}, h('tr', {}, ...foot.map(c => h('td', {}, c)))) : null,
      ),
    ),
  );
}

function visual(v: SimVisual): HTMLElement {
  const max = Math.max(1, ...v.bars.map(b => Math.abs(b.value)));
  return h(
    'figure',
    { class: 'simfig' },
    h('figcaption', { class: 'simhead' }, h('b', {}, v.headline), h('span', {}, v.headlineNote)),
    h(
      'div',
      { class: 'simbars', role: 'img', 'aria-label': `${v.barUnit} by step: ${v.bars.map(b => `${b.label} ${b.text}`).join(', ')}` },
      ...v.bars.map(b =>
        h(
          'div',
          { class: 'simrow', 'data-tone': b.tone ?? (b.value < 0 ? 'neg' : 'pos') },
          h('span', { class: 'simlabel' }, b.label),
          h('span', { class: 'simtrack', 'aria-hidden': 'true' }, h('span', { class: 'simfill', style: `width:${Math.max(1.5, (100 * Math.abs(b.value)) / max)}%` })),
          h('span', { class: 'simval' }, b.text),
        ),
      ),
    ),
    h('div', { class: 'simstats' }, ...v.stats.map(x => h('div', { class: 'simstat' }, h('b', {}, x.value), h('span', {}, x.label)))),
    h('h4', {}, 'What to notice'),
    h('ul', { class: 'simnotes' }, ...v.notes.map(x => h('li', {}, x))),
    ...(v.tables ?? []).map(t => tableBlock(t.title, t.head, t.rows, t.foot)),
    v.table ? tableBlock('Show the working, row by row', v.table.head, v.table.rows) : null,
    h('p', { class: 'hint simcap' }, v.caption),
  );
}

/* ───────────────────────── one simulator ───────────────────────── */

function controlRow(c: SimControl, values: Record<string, number | string>, redraw: () => void): HTMLElement {
  if (c.kind === 'select') {
    const sel = h(
      'select',
      {
        id: `ctl-${c.id}`,
        onchange: (e: Event) => {
          values[c.id] = (e.target as HTMLSelectElement).value;
          redraw();
        },
      },
      ...(c.options ?? []).map(o => h('option', { value: o.value }, o.label)),
    );
    sel.value = String(values[c.id] ?? '');
    return h('div', { class: 'field' }, h('label', { for: `ctl-${c.id}` }, c.label), sel, c.help ? h('small', {}, c.help) : null);
  }
  const out = h('output', { for: `ctl-${c.id}`, class: 'simout' });
  const shown = () => {
    const n = Number(values[c.id]);
    out.textContent = c.unit === '₹' ? `₹${n.toLocaleString('en-IN')}` : c.unit ? `${n.toLocaleString('en-IN')} ${c.unit}` : String(n);
  };
  const input = h('input', {
    id: `ctl-${c.id}`,
    type: 'range',
    min: String(c.min ?? 0),
    max: String(c.max ?? 100),
    step: String(c.step ?? 1),
    value: String(values[c.id] ?? c.min ?? 0),
    oninput: (e: Event) => {
      values[c.id] = Number((e.target as HTMLInputElement).value);
      shown();
      redraw();
    },
  });
  shown();
  return h('div', { class: 'field' }, h('label', { for: `ctl-${c.id}` }, c.label, ' ', out), input, c.help ? h('small', {}, c.help) : null);
}

function challengePanel(sim: Simulator, solved: boolean, onSolve: () => void): HTMLElement {
  const box = h('section', { class: 'panel simchallenge' });
  let done = solved;
  const draw = () => {
    mount(
      box,
      h('p', { class: 'eyebrow' }, done ? 'Challenge solved' : 'Challenge'),
      h('h3', { class: 'flush-top' }, sim.challenge.prompt),
      done
        ? h(
            'p',
            { class: 'note good', role: 'status' },
            icon('check-circle', 16),
            ' Correct. ',
            sim.challenge.why,
            h('br'),
            h('span', { class: 'hint' }, `Solved: +10 XP. ${SIM_BADGE_AT} solved challenges unlock the Visual Thinker badge.`),
          )
        : h(
            'div',
            { class: 'simactions', role: 'group', 'aria-label': 'Answer options' },
            ...sim.challenge.options.map((o, i) =>
              h(
                'button',
                {
                  type: 'button',
                  class: 'button',
                  onclick: async () => {
                    if (i !== sim.challenge.correct) {
                      announce('Not quite — look at the picture and try again');
                      mount(feedback, h('p', { class: 'note bad', role: 'alert' }, 'Not that one. Find the figure in the picture above, then choose again.'));
                      return;
                    }
                    done = true;
                    await recordSeen({ lab: simLabId(sim.id), tab: 'example', t: Date.now() });
                    void drawHud();
                    void currentRewards().then(({ r }) => {
                      if (r.simsSolved === SIM_BADGE_AT) notify(`Badge earned: Visual Thinker — ${SIM_BADGE_AT} chapter challenges solved`);
                    });
                    announce('Correct — challenge solved, ten XP');
                    draw();
                    onSolve();
                  },
                },
                o,
              ),
            ),
          ),
      feedback,
    );
  };
  const feedback = h('div', { 'aria-live': 'polite' });
  draw();
  return box;
}

/**
 * ▶ Play for a simulator whose picture is a sequence (`play.control` names a range control).
 * The button only moves that control and fires its own `input` event, so the picture is redrawn by exactly the same code
 * as a student dragging the slider — one source of truth, and Pause can never leave the books half-posted.
 */
function playControl(sim: Simulator, rows: readonly HTMLElement[]): HTMLElement | null {
  if (!sim.play) return null;
  const input = rows.map(r => r.querySelector<HTMLInputElement>(`#ctl-${sim.play!.control}`)).find(Boolean);
  if (!input) return null;
  const min = Number(input.min),
    max = Number(input.max),
    stepBy = Math.max(1, Number(input.step) || 1);
  const status = h('span', { class: 'simplay-status', 'aria-live': 'polite' });
  const btn = h('button', { type: 'button', class: 'primary', 'aria-pressed': 'false' }, '▶ Play');
  let timer: number | undefined;
  const say = () => {
    const v = Number(input.value);
    status.textContent = v >= max ? `All ${max} posted` : v === min ? 'Nothing posted yet' : `Entry ${v} of ${max}`;
  };
  const stop = () => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    btn.textContent = Number(input.value) >= max ? '↺ Play again' : '▶ Play';
    btn.setAttribute('aria-pressed', 'false');
  };
  const tick = () => {
    const next = Math.min(max, Number(input.value) + stepBy);
    input.value = String(next);
    input.dispatchEvent(new Event('input', { bubbles: true })); // the slider's own handler redraws the picture
    say();
    if (next >= max) stop();
  };
  const start = () => {
    if (Number(input.value) >= max) {
      input.value = String(min);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    say();
    btn.textContent = '⏸ Pause';
    btn.setAttribute('aria-pressed', 'true');
    timer = window.setInterval(tick, (sim.play!.everyMs ?? 1400) * (reducedMotion() ? 1.8 : 1));
  };
  btn.addEventListener('click', () => {
    if (timer !== undefined) stop();
    else start();
  });
  input.addEventListener('input', say);
  onDispose(stop);
  say();
  return h('div', { class: 'simplay' }, btn, status);
}

function simNotFound(): HTMLElement {
  return h(
    'div',
    { class: 'panel' },
    h('h2', {}, 'Simulator not found'),
    h('p', {}, 'That address does not name a visual simulator.'),
    h('p', {}, h('a', { class: 'button', href: '#/sims' }, 'All chapter simulators')),
  );
}

export function simPage(id: string): HTMLElement {
  const sim = simulatorById(id);
  if (!sim) return simNotFound();
  void recordSeen({ lab: simLabId(sim.id), tab: 'try', t: Date.now() });
  const values: Record<string, number | string> = { ...sim.defaults };
  const list = SIMULATORS.filter(x => x.cls === sim.cls && (!x.route || x.route === state.profile.route));
  const at = list.findIndex(x => x.id === sim.id);
  const prev = at > 0 ? (list[at - 1] ?? null) : null,
    next = at >= 0 && at < list.length - 1 ? (list[at + 1] ?? null) : null;

  const root = h('div', { class: 'sim-page' });
  loadInto(
    root,
    seen,
    s => {
      const pic = h('div', { class: 'simpic' });
      const redraw = () => mount(pic, visual(sim.compute(values)));
      redraw();
      const fields = sim.controls.map(c => controlRow(c, values, redraw));
      const play = playControl(sim, fields);
      mount(
        root,
        h('nav', { class: 'breadcrumb', 'aria-label': 'Breadcrumb' }, h('a', { href: '#/sims' }, 'Visual simulators'), h('span', { 'aria-hidden': 'true' }, ' / '), h('span', {}, chapterOf(sim))),
        h(
          'header',
          { class: 'labhead' },
          h('p', { class: 'eyebrow' }, `${sim.cls === 'XI' ? 'Class XI' : 'Class XII'} · ${chapterOf(sim)}`),
          h('h2', {}, sim.title),
          h('p', { class: 'lead' }, sim.need),
        ),
        h('section', { class: 'panel simwhy' }, h('p', {}, sim.intro)),
        h(
          'div',
          { class: 'simgrid' },
          h('section', { class: 'panel simcont', 'aria-labelledby': 'sim-try' }, h('h3', { id: 'sim-try', class: 'flush-top' }, 'Change the numbers'), play, ...fields),
          h('section', { class: 'panel simcanvas', 'aria-labelledby': 'sim-pic' }, h('h3', { id: 'sim-pic', class: 'flush-top' }, 'The picture'), pic),
        ),
        challengePanel(sim, solvedSet(s).has(sim.id), () => {
          /* progress strip below is static per visit */
        }),
        h(
          'nav',
          { class: 'simnav', 'aria-label': 'More simulators' },
          prev ? h('a', { class: 'button', href: `#/sim/${prev.id}` }, `← ${prev.title}`) : h('span', {}),
          h('a', { class: 'button', href: '#/sims' }, 'All chapter simulators'),
          next ? h('a', { class: 'button', href: `#/sim/${next.id}` }, `${next.title} →`) : h('span', {}),
        ),
      );
    },
    'this simulator',
  );
  return root;
}

/* ───────────────────────── the gallery ───────────────────────── */

export function simsIndex(): HTMLElement {
  const root = h('div', { class: 'sims' });
  let filterCls: ClassLevel | 'ALL' = state.profile.cls;
  let searchQuery = '';
  const searchInput = h('input', {
    type: 'search',
    id: 'sim-hub-search',
    placeholder: 'Search workbenches or chapter visualisers (e.g. BRS, Goodwill, Depreciation, Ratio)…',
    autocomplete: 'off',
  }) as HTMLInputElement;

  loadInto(
    root,
    seen,
    s => {
      const drawGallery = () => {
        const q = searchQuery.trim().toLowerCase();
        const solved = solvedSet(s);
        const rawGroups = simulatorsByChapter(filterCls === 'ALL' ? state.profile.cls : filterCls, state.profile.route);
        const all = rawGroups.flatMap(g => g.sims);
        const done = all.filter(x => solved.has(x.id)).length;
        const groups = rawGroups
          .map(g => ({
            ...g,
            sims: g.sims.filter(sim => !q || `${sim.title} ${sim.need} ${g.title}`.toLowerCase().includes(q)),
          }))
          .filter(g => g.sims.length > 0);

        const coreProg = summariseCoreSimProgress(s, state.profile.route);
        const baseCoreSims =
          filterCls === 'ALL' ? CORE_SIMULATORS.filter(cs => cs.cls === 'XI' || cs.route === 'COMMON' || cs.route === state.profile.route) : coreSimulatorsFor(filterCls, state.profile.route);

        // Also surface Computerised Accounting Lab as compulsory Class XI exposure when viewing Class XI
        const xiCasExposure = filterCls === 'XI' ? CORE_SIMULATORS.filter(cs => cs.id === 'computerised-accounting-lab') : [];
        const visibleCore = [...baseCoreSims, ...xiCasExposure].filter(cs => !q || `${cs.title} ${cs.titleHi} ${cs.subtitle} ${cs.summary}`.toLowerCase().includes(q));

        mount(
          root,
          h(
            'header',
            { class: 'labhead' },
            h('p', { class: 'eyebrow' }, `CBSE 2026–27 (Code 055) · Class ${state.profile.cls} · Interactive Simulator & Visualiser`),
            h('h2', {}, 'Visual simulators'),
            h(
              'p',
              { class: 'lead' },
              'Learn accounting by doing accounting: step through CBSE Class XI and Class XII interactive simulators with progressive missions, live double-entry validation, What-if controls, and chapter-wise visualisers.',
            ),
          ),

          // ── Flagship Interactive Simulator & Visualiser Section (Experiences A–J) ──
          h(
            'section',
            {
              class: 'panel simlab-hub-section',
              'data-flagship-hub': '',
              'aria-labelledby': 'flagship-sim-h',
            },
            h(
              'div',
              { class: 'simlab-hub-head' },
              h(
                'div',
                {},
                h('p', { class: 'eyebrow' }, 'Interactive CBSE Workbenches · Beginner to Master'),
                h('h3', { id: 'flagship-sim-h', class: 'flush-top' }, 'Class XI & XII Simulator Workbenches'),
              ),
              h(
                'div',
                { class: 'modes', role: 'group', 'aria-label': 'Filter simulators by syllabus class' },
                h(
                  'button',
                  {
                    type: 'button',
                    class: filterCls === 'XI' ? 'on' : 'secondary',
                    'data-sim-cls': 'XI',
                    onclick: () => {
                      filterCls = 'XI';
                      drawGallery();
                    },
                  },
                  'Class XI (6 Labs)',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    class: filterCls === 'XII' ? 'on' : 'secondary',
                    'data-sim-cls': 'XII',
                    onclick: () => {
                      filterCls = 'XII';
                      drawGallery();
                    },
                  },
                  `Class XII (${state.profile.route === 'OPTION_II_COMPUTERISED' ? 'Option II · CAS' : 'Option I · Analysis'})`,
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    class: filterCls === 'ALL' ? 'on' : 'secondary',
                    'data-sim-cls': 'ALL',
                    onclick: () => {
                      filterCls = 'ALL';
                      drawGallery();
                    },
                  },
                  'Both Classes',
                ),
              ),
            ),
            h(
              'div',
              { class: 'simlab-hub-kpis' },
              h('div', { class: 'simlab-kpi-box' }, h('span', {}, 'Workbench Missions'), h('b', {}, `${coreProg.totalMissionsCompleted} / ${coreProg.totalMissionsAvailable}`)),
              h('div', { class: 'simlab-kpi-box' }, h('span', {}, 'Workbench Badges'), h('b', {}, `${coreProg.earnedBadges.length} / ${SIM_ACHIEVEMENT_BADGES.length}`)),
              h('div', { class: 'simlab-kpi-box' }, h('span', {}, 'Chapter Visualisers'), h('b', {}, `${done} / ${all.length}`)),
            ),
            h(
              'div',
              { class: 'simlab-badge-strip' },
              ...SIM_ACHIEVEMENT_BADGES.map(b => {
                const earned = coreProg.earnedBadges.some(eb => eb.id === b.id);
                return h(
                  'span',
                  {
                    class: 'simlab-hub-badge' + (earned ? ' earned' : ''),
                    title: b.description,
                    'data-sim-badge': b.id,
                  },
                  icon(earned ? 'medal' : 'lock', 15),
                  ' ',
                  b.title,
                );
              }),
            ),
            h('div', { class: 'sim-hub-search-row' }, h('label', { class: 'sr-only', for: 'sim-hub-search' }, 'Search simulators and visualisers'), searchInput),
            h(
              'div',
              { class: 'cards simlab-core-grid' },
              ...visibleCore.map((cs, idx) => {
                const clearedTiers = cs.missions.filter(m => coreProg.completedMissions.has(`${cs.id}:${m.tier}`)).length;
                const unitTitle = unitById(cs.unit)?.title ?? cs.unit;
                const isExposure = filterCls === 'XI' && cs.id === 'computerised-accounting-lab';
                return h(
                  'a',
                  {
                    class: 'card simlab-core-card' + (idx === 0 ? ' featured' : ''),
                    href: `#/sim-lab/${cs.id}`,
                    'data-core-card': cs.id,
                  },
                  h(
                    'div',
                    { class: 'simlab-card-top' },
                    h('span', { class: 'simlab-code-pill' }, `Lab ${cs.code} · ${isExposure ? 'XI Exposure / XII CAS' : `Class ${cs.cls}`}`),
                    h('span', { class: 'simlab-meta-count' }, `${clearedTiers} / 4 missions`),
                  ),
                  h('h4', { class: 'simlab-card-title' }, cs.title),
                  h('p', { class: 'simlab-card-sub' }, cs.subtitle),
                  h('p', {}, cs.summary),
                  h('div', { class: 'simlab-tier-dots', 'aria-hidden': 'true' }, ...cs.missions.map(m => h('i', { class: coreProg.completedMissions.has(`${cs.id}:${m.tier}`) ? 'done' : '' }))),
                  h('small', { class: 'hint' }, `${unitTitle} · ${cs.titleHi}`),
                );
              }),
            ),
          ),

          // ── Quick Chapter-Wise Visualisers (kept 100% compatible with existing progress & tests) ──
          h(
            'section',
            { class: 'panel simprogress' },
            h(
              'div',
              { class: 'simportop' },
              h('b', {}, `${done} of ${all.length} solved`),
              h('span', { class: 'hint' }, 'each solved chapter challenge: +10 XP · five unlock the “Visual Thinker” badge'),
            ),
            h(
              'div',
              {
                class: 'meter',
                role: 'progressbar',
                'aria-valuemin': 0,
                'aria-valuemax': all.length || 1,
                'aria-valuenow': done,
                'aria-label': `${done} of ${all.length} simulators solved`,
              },
              h('div', { class: 'meterfill', style: `width:${all.length ? Math.round((100 * done) / all.length) : 0}%` }),
            ),
          ),
          groups.length === 0
            ? h('p', { class: 'empty' }, `No visual simulators for Class ${state.profile.cls} on this route yet.`)
            : h(
                'div',
                { class: 'simchapters' },
                ...groups.map(g =>
                  h(
                    'section',
                    { class: 'simchapter', 'aria-labelledby': `ch-${g.unit}` },
                    h('div', { class: 'section-head' }, h('h3', { id: `ch-${g.unit}` }, g.title), h('span', { class: 'chip' }, `${g.sims.length} simulator${g.sims.length === 1 ? '' : 's'}`)),
                    h(
                      'div',
                      { class: 'cards' },
                      ...g.sims.map(sim =>
                        h(
                          'a',
                          {
                            class: 'card simcard',
                            href: `#/sim/${sim.id}`,
                            'data-sim': sim.id,
                            'data-solved': String(solved.has(sim.id)),
                          },
                          h('div', { class: 'card-icon' }, icon('flask', 22)),
                          h('h3', {}, sim.title),
                          h('p', {}, sim.need),
                          h(
                            'span',
                            { class: 'chip' + (solved.has(sim.id) ? ' solved' : '') },
                            solved.has(sim.id) ? '✓ Solved' : sim.play ? '▶ Play it · challenge inside' : 'Challenge inside · +10 XP',
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          h('p', { class: 'hint' }, 'Bar lengths are geometry; every rupee figure is computed by the exact money engine with an explicit rounding mode.'),
        );
      };
      searchInput.oninput = () => {
        searchQuery = searchInput.value;
        drawGallery();
        if (document.activeElement !== searchInput) {
          searchInput.focus();
          searchInput.setSelectionRange(searchQuery.length, searchQuery.length);
        }
      };
      drawGallery();
    },
    'the simulators',
  );
  return root;
}
