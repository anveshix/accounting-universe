/**
 * Shared shell, progressive mission controls, bilingual terminology helper, playback controls,
 * and reward wiring for the 10 flagship CBSE Class XI & XII Simulator & Visualiser experiences (A–J).
 */
import { SIM_DIFFICULTIES, clauseById, coreSimMissionLabId, summariseCoreSimProgress, type CoreSimId, type CoreSimulatorSpec, type SimDifficulty } from '../../../../packages/curriculum/src';
import { TERM_HI, accountHi } from '../../../../packages/curriculum/src/i18n';
import { h, mount, svg } from '../dom';
import { icon } from '../icons';
import { drawHud, notify } from '../rewards-ui';
import { recordSeen, seen } from '../store';
import { announce } from '../ui';
import { state } from '../state';

export interface SimShellContext {
  readonly spec: CoreSimulatorSpec;
  readonly getDifficulty: () => SimDifficulty;
  readonly isBilingual: () => boolean;
  /** Format an account/term label in English or bilingual EN + HI when toggled on. */
  readonly term: (enLabel: string, customHi?: string) => string;
  /** Award XP & badge celebration when the active mission's accounting goal is verified. */
  readonly completeMission: (reason: string) => Promise<void>;
  /** Subscribe to difficulty or bilingual toggle changes so the simulator body can re-render. */
  readonly onChange: (fn: () => void) => void;
  /** Register cleanup logic (timers, WebGL handles) invoked when leaving the route. */
  readonly addCleanup: (fn: () => void) => void;
}

export type SimulatorRenderer = (stage: HTMLElement, ctx: SimShellContext) => void;

/** SVG dual-pan balance beam (pure vector fallback/companion that works in every viewport & theme). */
export function renderBalanceBeamSvg(opts: { leftLabel: string; leftAmount: string; leftValue: number; rightLabel: string; rightAmount: string; rightValue: number; balanced: boolean }): SVGElement {
  const maxVal = Math.max(1, Math.abs(opts.leftValue), Math.abs(opts.rightValue));
  const diffRatio = (opts.rightValue - opts.leftValue) / maxVal;
  const deg = opts.balanced ? 0 : Math.max(-11, Math.min(11, diffRatio * 18));
  const toneColor = opts.balanced ? 'var(--ok)' : 'var(--bad)';

  return svg(
    'svg',
    {
      viewBox: '0 0 520 155',
      class: 'simlab-beam-svg',
      role: 'img',
      'aria-label': `${opts.leftLabel} ${opts.leftAmount} versus ${opts.rightLabel} ${opts.rightAmount}: ${opts.balanced ? 'balanced' : 'unbalanced'}`,
    },
    svg('rect', { x: 190, y: 138, width: 140, height: 10, rx: 5, fill: 'var(--line)' }),
    svg('polygon', { points: '260,64 244,138 276,138', fill: 'var(--brand)' }),
    svg(
      'g',
      { transform: `rotate(${deg.toFixed(2)} 260 64)` },
      svg('rect', { x: 68, y: 60, width: 384, height: 8, rx: 4, fill: toneColor }),
      svg('line', { x1: 96, y1: 66, x2: 96, y2: 102, stroke: 'var(--muted)', 'stroke-width': 2 }),
      svg('line', { x1: 424, y1: 66, x2: 424, y2: 102, stroke: 'var(--muted)', 'stroke-width': 2 }),
      svg(
        'g',
        { transform: `rotate(${(-deg).toFixed(2)} 96 102)` },
        svg('rect', { x: 24, y: 98, width: 144, height: 34, rx: 8, fill: 'var(--card)', stroke: 'var(--brand)', 'stroke-width': 2 }),
        svg('text', { x: 96, y: 113, 'text-anchor': 'middle', class: 'simlab-svg-sub' }, opts.leftLabel),
        svg('text', { x: 96, y: 127, 'text-anchor': 'middle', class: 'simlab-svg-val' }, opts.leftAmount),
      ),
      svg(
        'g',
        { transform: `rotate(${(-deg).toFixed(2)} 424 102)` },
        svg('rect', { x: 352, y: 98, width: 144, height: 34, rx: 8, fill: 'var(--card)', stroke: 'var(--accent)', 'stroke-width': 2 }),
        svg('text', { x: 424, y: 113, 'text-anchor': 'middle', class: 'simlab-svg-sub' }, opts.rightLabel),
        svg('text', { x: 424, y: 127, 'text-anchor': 'middle', class: 'simlab-svg-val' }, opts.rightAmount),
      ),
    ),
    svg('circle', { cx: 260, cy: 64, r: 9, fill: toneColor }),
  );
}

/** Step-by-step / Replay / Reset control bar shared across flow-based simulators. */
export function createPlaybackBar(opts: {
  totalSteps: number;
  currentStep: number;
  playing: boolean;
  label?: string;
  onStepChange: (step: number) => void;
  onTogglePlay: () => void;
  onReset: () => void;
}): HTMLElement {
  const atStart = opts.currentStep <= 0;
  const atEnd = opts.currentStep >= opts.totalSteps;
  return h(
    'div',
    { class: 'simlab-playback', role: 'group', 'aria-label': opts.label ?? 'Step-by-step playback controls' },
    h(
      'button',
      {
        type: 'button',
        class: 'secondary simlab-ctl-btn',
        disabled: atStart && !opts.playing,
        onclick: opts.onReset,
      },
      'Reset',
    ),
    h(
      'button',
      {
        type: 'button',
        class: 'secondary simlab-ctl-btn',
        disabled: atStart,
        onclick: () => opts.onStepChange(Math.max(0, opts.currentStep - 1)),
      },
      '← Prev step',
    ),
    h(
      'button',
      {
        type: 'button',
        class: 'simlab-ctl-btn',
        onclick: opts.onTogglePlay,
      },
      opts.playing ? 'Pause' : atEnd ? 'Replay' : 'Play flow',
    ),
    h(
      'button',
      {
        type: 'button',
        class: 'secondary simlab-ctl-btn',
        disabled: atEnd,
        onclick: () => opts.onStepChange(Math.min(opts.totalSteps, opts.currentStep + 1)),
      },
      'Next step →',
    ),
    h('span', { class: 'simlab-step-pill', 'aria-live': 'polite' }, `Step ${opts.currentStep} of ${opts.totalSteps}`),
  );
}

/** Mounts the complete simulator shell around one of the 10 flagship experiences (A–J). */
export function mountSimulatorShell(root: HTMLElement, spec: CoreSimulatorSpec, renderExperience: SimulatorRenderer, allSpecs: readonly CoreSimulatorSpec[]): () => void {
  let difficulty: SimDifficulty = 'BEGINNER';
  let bilingual = state.lang === 'hi';
  let hintsRevealed = 0;
  let completedSet = new Set<string>();
  const listeners: (() => void)[] = [];
  const cleanups: (() => void)[] = [];

  const term = (enLabel: string, customHi?: string): string => {
    if (!bilingual) return enLabel;
    const hi = customHi ?? accountHi(enLabel);
    return hi && hi !== enLabel ? `${enLabel} · ${hi}` : enLabel;
  };

  const missionBox = h('section', { class: 'panel simlab-mission-bar', 'aria-label': 'Mission and difficulty controls' });
  const stage = h('div', { class: 'simlab-stage', 'data-sim-stage': spec.id });
  const statusBanner = h('div', { class: 'simlab-mission-status', role: 'status', 'aria-live': 'polite' });

  const refreshSeen = async () => {
    const s = await seen();
    const prog = summariseCoreSimProgress(s, state.profile.route);
    completedSet = new Set(prog.completedMissions);
    drawMissionBar();
  };

  const completeMission = async (reason: string) => {
    const key = `${spec.id}:${difficulty}`;
    const already = completedSet.has(key);
    completedSet.add(key);
    const beforeSeen = await seen();
    const beforeBadges = summariseCoreSimProgress(beforeSeen, state.profile.route).earnedBadges.map(b => b.id);
    await recordSeen({ t: Date.now(), lab: coreSimMissionLabId(spec.id as CoreSimId, difficulty), tab: 'example' });
    const afterSeen = await seen();
    const afterSummary = summariseCoreSimProgress(afterSeen, state.profile.route);
    await drawHud();

    if (!already) {
      notify(`Mission cleared: ${spec.code} · ${difficulty} (+15 XP)`);
      for (const b of afterSummary.earnedBadges) {
        if (!beforeBadges.includes(b.id)) {
          notify(`Achievement Badge Unlocked: ${b.title}`);
        }
      }
    }
    mount(statusBanner, h('div', { class: 'note good simlab-win' }, icon('check-circle', 18), h('div', {}, h('b', {}, `${difficulty} Mission Verified — `), reason)));
    announce(`Mission verified: ${reason}`);
    drawMissionBar();
  };

  function drawMissionBar() {
    const m = spec.missions.find(x => x.tier === difficulty) ?? spec.missions[0];
    const diffMeta = SIM_DIFFICULTIES.find(d => d.id === difficulty)!;
    const isDone = completedSet.has(`${spec.id}:${difficulty}`);
    const maxHints = Math.min(diffMeta.hintBudget, m.hints.length);

    mount(
      missionBox,
      h(
        'div',
        { class: 'simlab-tier-row' },
        h(
          'div',
          { class: 'modes simlab-tiers', role: 'group', 'aria-label': 'Progressive difficulty' },
          ...SIM_DIFFICULTIES.map(d => {
            const done = completedSet.has(`${spec.id}:${d.id}`);
            const active = d.id === difficulty;
            return h(
              'button',
              {
                type: 'button',
                class: active ? 'on' : 'secondary',
                'aria-pressed': String(active),
                'data-tier': d.id,
                onclick: () => {
                  difficulty = d.id;
                  hintsRevealed = 0;
                  mount(statusBanner);
                  drawMissionBar();
                  listeners.forEach(fn => fn());
                },
              },
              done ? '✓ ' : '',
              bilingual ? d.labelHi : d.label,
            );
          }),
        ),
        h(
          'button',
          {
            type: 'button',
            class: bilingual ? 'simlab-lang-chip on' : 'secondary simlab-lang-chip',
            'aria-pressed': String(bilingual),
            'data-bilingual-toggle': '',
            onclick: () => {
              bilingual = !bilingual;
              drawMissionBar();
              drawGlossary();
              listeners.forEach(fn => fn());
            },
          },
          bilingual ? `EN + हिन्दी (${TERM_HI.debit}/${TERM_HI.credit}) · ON` : 'Show EN + हिन्दी Terms',
        ),
      ),
      h(
        'div',
        { class: 'simlab-mission-card' },
        h(
          'div',
          { class: 'simlab-mission-main' },
          h('p', { class: 'eyebrow' }, `Mission · ${diffMeta.label}${isDone ? ' · Completed' : ''}`),
          h('h3', {}, bilingual ? `${m.title} · ${m.titleHi}` : m.title),
          h('p', {}, m.objective),
          h('p', { class: 'hint simlab-whatif-tip' }, icon('lightbulb', 16), ' What-if: ', m.whatIfPrompt),
        ),
        h(
          'div',
          { class: 'simlab-hint-box' },
          maxHints > 0
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'secondary',
                  'data-sim-hint': '',
                  disabled: hintsRevealed >= maxHints,
                  onclick: () => {
                    hintsRevealed = Math.min(maxHints, hintsRevealed + 1);
                    drawMissionBar();
                  },
                },
                icon('lightbulb', 16),
                hintsRevealed >= maxHints ? `All ${maxHints} hints shown` : `Contextual hint (${hintsRevealed}/${maxHints})`,
              )
            : h('span', { class: 'badge-pill' }, 'Master mode · 0 hints'),
          hintsRevealed > 0 && h('ol', { class: 'simlab-hints-list' }, ...m.hints.slice(0, hintsRevealed).map(txt => h('li', {}, txt))),
        ),
      ),
    );
  }

  const glossaryStrip = h('div', { class: 'simlab-glossary', 'aria-label': 'Key CBSE accounting terms' });
  function drawGlossary() {
    mount(glossaryStrip, ...spec.keyTerms.map(k => h('span', { class: 'simlab-term-pill' }, h('b', {}, k.en), ' · ', h('span', { lang: 'hi' }, k.hi))));
  }

  const idx = allSpecs.findIndex(s => s.id === spec.id);
  const prev = idx > 0 ? allSpecs[idx - 1] : undefined;
  const next = idx >= 0 && idx < allSpecs.length - 1 ? allSpecs[idx + 1] : undefined;

  mount(
    root,
    h(
      'div',
      { class: 'simlab-page', 'data-core-sim': spec.id },
      h(
        'div',
        { class: 'labhead simlab-hero' },
        h(
          'div',
          {},
          h(
            'p',
            { class: 'eyebrow' },
            `Experience ${spec.code} · Class ${spec.cls} · ${spec.clauses
              .map(c => clauseById(c)?.title.split(':')[0] ?? c)
              .slice(0, 2)
              .join(' · ')}`,
          ),
          h('h2', {}, icon(spec.cls === 'XI' ? 'scale' : 'building', 24), ' ', spec.title),
          h('p', { class: 'lede' }, spec.summary),
          spec.syllabusBoundaryNote && h('p', { class: 'note info simlab-boundary' }, h('b', {}, 'CBSE 2026–27 Scope: '), spec.syllabusBoundaryNote),
        ),
        h(
          'div',
          { class: 'simlab-hero-actions' },
          h('a', { class: 'btn secondary', href: '#/sims' }, '← All Simulators'),
          h('span', { class: 'simlab-badge-tag' }, icon('medal', 16), ' ', spec.badgeTitle),
        ),
      ),
      glossaryStrip,
      missionBox,
      statusBanner,
      stage,
      h(
        'nav',
        { class: 'simnav', 'aria-label': 'Other flagship simulators' },
        prev ? h('a', { class: 'btn secondary', href: `#/sim-lab/${prev.id}` }, `← ${prev.code}. ${prev.title}`) : h('span'),
        h('a', { class: 'btn secondary', href: '#/sims' }, 'Simulator Hub (Class XI & XII)'),
        next ? h('a', { class: 'btn secondary', href: `#/sim-lab/${next.id}` }, `${next.code}. ${next.title} →`) : h('span'),
      ),
    ),
  );

  drawGlossary();
  drawMissionBar();
  void recordSeen({ t: Date.now(), lab: `sim-core:${spec.id}`, tab: 'try' });
  void refreshSeen();

  const ctx: SimShellContext = {
    spec,
    getDifficulty: () => difficulty,
    isBilingual: () => bilingual,
    term,
    completeMission,
    onChange: fn => listeners.push(fn),
    addCleanup: fn => cleanups.push(fn),
  };

  renderExperience(stage, ctx);

  return () => {
    for (const fn of cleanups) {
      try {
        fn();
      } catch {
        /* ignore cleanup error */
      }
    }
  };
}
