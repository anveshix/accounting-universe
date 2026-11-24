import { CORE_SIMULATORS, coreSimulatorsFor, summariseCoreSimProgress, unitById, type ClassLevel, type CoreSimId } from '../../../../packages/curriculum/src';
import { Money } from '../../../../packages/engine/src';
import { h, mount } from '../dom';
import { icon, iconForLab } from '../icons';
import { ALL_LABS, PAGES, coverage } from '../labs';
import { pulseLedgerConfirmation } from '../motion';
import { state } from '../state';
import { attempts, seen, setProfile } from '../store';
import { navigate } from '../router';
import { en, tr } from '../i18n';
import { currentRewards } from '../rewards-ui';
import { todayPanel } from '../review-ui';
import { renderBalanceBeamSvg } from '../sim-labs/shell';

interface HeroVoucherLine {
  readonly lf: string;
  readonly particulars: string;
  readonly side: 'Dr' | 'Cr';
  readonly baseRupees: number;
}

interface HeroVoucherSpec {
  readonly code: string;
  readonly tab: string;
  readonly folio: string;
  readonly title: string;
  readonly narration: string;
  readonly targetLab: CoreSimId;
  readonly errorDeltaRupees: number;
  readonly lines: readonly HeroVoucherLine[];
}

function fmtRupees(amount: number): string {
  return Money.rupees(Math.max(0, Math.round(amount))).format();
}

function getHeroVouchers(cls: ClassLevel, route: string): readonly HeroVoucherSpec[] {
  const isXII = cls === 'XII';
  const isCas = isXII && route === 'OPTION_II_COMPUTERISED';
  if (isCas) {
    return [
      {
        code: 'VCH-104',
        tab: '01 Payroll',
        folio: 'CAS · Payment Voucher',
        title: 'Maker–Checker Verified Payroll Run',
        narration: 'Being monthly establishment salaries & statutory TDS posted via CAS voucher pipeline.',
        targetLab: 'computerised-accounting-lab',
        errorDeltaRupees: 6400,
        lines: [
          { lf: '5201', particulars: 'Salaries & Wages A/c (Dr)', side: 'Dr', baseRupees: 64000 },
          { lf: '2108', particulars: 'To TDS Payable A/c', side: 'Cr', baseRupees: 6400 },
          { lf: '1202', particulars: 'To HDFC Bank A/c', side: 'Cr', baseRupees: 57600 },
        ],
      },
      {
        code: 'VCH-109',
        tab: '02 Capex',
        folio: 'CAS · Asset Acquisition',
        title: 'Fixed Asset Master + Sub-Ledger Sync',
        narration: 'Being CNC equipment capitalised into Asset Register with automated SLM schedule.',
        targetLab: 'computerised-accounting-lab',
        errorDeltaRupees: 18000,
        lines: [
          { lf: '1104', particulars: 'Plant & Machinery A/c (Dr)', side: 'Dr', baseRupees: 180000 },
          { lf: '1409', particulars: 'Input IGST A/c (Dr)', side: 'Dr', baseRupees: 32400 },
          { lf: '1202', particulars: 'To HDFC Bank A/c', side: 'Cr', baseRupees: 212400 },
        ],
      },
      {
        code: 'VCH-115',
        tab: '03 Audit',
        folio: 'CAS · Period Lock',
        title: 'Closing Adjustment & Audit Hash',
        narration: 'Being annual depreciation batch posted and period locked against back-dated edits.',
        targetLab: 'computerised-accounting-lab',
        errorDeltaRupees: 3000,
        lines: [
          { lf: '5402', particulars: 'Depreciation Expense A/c (Dr)', side: 'Dr', baseRupees: 18000 },
          { lf: '1194', particulars: 'To Accumulated Depreciation A/c', side: 'Cr', baseRupees: 18000 },
        ],
      },
    ];
  }
  if (isXII) {
    return [
      {
        code: 'FOLIO XII-A',
        tab: '01 Appropriation',
        folio: 'Partnership · P&L Appropriation',
        title: 'Interest on Capital & Divisible Profit (3 : 2)',
        narration: 'Being net profit appropriated between Aarav & Meera as per Partnership Deed.',
        targetLab: 'partnership-lab',
        errorDeltaRupees: 12000,
        lines: [
          { lf: '3101', particulars: 'P&L Appropriation A/c (Dr)', side: 'Dr', baseRupees: 168000 },
          { lf: '2401', particulars: 'To Aarav Capital A/c (IoC + Share)', side: 'Cr', baseRupees: 100800 },
          { lf: '2402', particulars: 'To Meera Capital A/c (IoC + Share)', side: 'Cr', baseRupees: 67200 },
        ],
      },
      {
        code: 'FOLIO XII-B',
        tab: '02 Goodwill',
        folio: 'Admission · Sacrificing Ratio',
        title: 'Premium for Goodwill on Partner Admission',
        narration: 'Being incoming partner Kabir’s goodwill premium credited in sacrificing ratio 2 : 1.',
        targetLab: 'partnership-lab',
        errorDeltaRupees: 15000,
        lines: [
          { lf: '2490', particulars: 'Premium for Goodwill A/c (Dr)', side: 'Dr', baseRupees: 90000 },
          { lf: '2401', particulars: 'To Aarav Capital A/c', side: 'Cr', baseRupees: 60000 },
          { lf: '2402', particulars: 'To Meera Capital A/c', side: 'Cr', baseRupees: 30000 },
        ],
      },
      {
        code: 'FOLIO XII-C',
        tab: '03 Forfeiture',
        folio: 'Company Accounts · Share Capital',
        title: 'Share Forfeiture & Pro-Rata Reissue',
        narration: 'Being 400 defaulted shares forfeited and surplus transferred to Capital Reserve.',
        targetLab: 'company-lab',
        errorDeltaRupees: 4000,
        lines: [
          { lf: '2001', particulars: 'Share Capital A/c (Dr)', side: 'Dr', baseRupees: 40000 },
          { lf: '2014', particulars: 'To Calls-in-Arrears A/c', side: 'Cr', baseRupees: 12000 },
          { lf: '2019', particulars: 'To Share Forfeiture A/c', side: 'Cr', baseRupees: 28000 },
        ],
      },
    ];
  }
  return [
    {
      code: 'FOLIO XI-01',
      tab: '01 Capital',
      folio: 'Books of Original Entry · J.F. 01',
      title: 'Commencement of Business with Cash & Bank',
      narration: 'Being capital introduced by proprietor into cash chest and current bank account.',
      targetLab: 'equation-lab',
      errorDeltaRupees: 25000,
      lines: [
        { lf: '1001', particulars: 'Cash-in-Hand A/c (Dr)', side: 'Dr', baseRupees: 75000 },
        { lf: '1002', particulars: 'Cash at Bank A/c (Dr)', side: 'Dr', baseRupees: 175000 },
        { lf: '3001', particulars: 'To Proprietor Capital A/c', side: 'Cr', baseRupees: 250000 },
      ],
    },
    {
      code: 'FOLIO XI-02',
      tab: '02 GST Trade',
      folio: 'Purchases Journal · J.F. 04',
      title: 'Credit Inventory Purchase with Input GST',
      narration: 'Being traded goods bought from Sharma Traders @ 18% GST (9% CGST + 9% SGST).',
      targetLab: 'journal-ledger-lab',
      errorDeltaRupees: 9000,
      lines: [
        { lf: '4101', particulars: 'Purchases A/c (Dr)', side: 'Dr', baseRupees: 50000 },
        { lf: '1401', particulars: 'Input CGST / SGST A/c (Dr)', side: 'Dr', baseRupees: 9000 },
        { lf: '2104', particulars: 'To Sharma Traders A/c', side: 'Cr', baseRupees: 59000 },
      ],
    },
    {
      code: 'FOLIO XI-03',
      tab: '03 Closing',
      folio: 'Year-End Adjustment · J.F. 12',
      title: 'WDV Depreciation & Accrued Provision',
      narration: 'Being 10% WDV depreciation charged on machinery before Trial Balance extraction.',
      targetLab: 'depreciation-lab',
      errorDeltaRupees: 4000,
      lines: [
        { lf: '5301', particulars: 'Depreciation A/c (Dr)', side: 'Dr', baseRupees: 24000 },
        { lf: '1102', particulars: 'To Machinery A/c', side: 'Cr', baseRupees: 24000 },
      ],
    },
  ];
}

function buildHeroLedgerPreview(cls: ClassLevel, route: string): HTMLElement {
  const specs = getHeroVouchers(cls, route);
  let activeIdx = 0;
  let scalePct = 100;
  let injectError = false;
  const card = h('div', { class: 'hero-ledger-card' });

  const drawFolio = (animateTally: boolean) => {
    const cur = (specs[activeIdx] ?? specs[0])!;
    const lastCreditIdx = cur.lines.reduce((acc, l, idx) => (l.side === 'Cr' ? idx : acc), -1);

    let drSum = 0;
    let crSum = 0;
    const computedRows = cur.lines.map((line, idx) => {
      let amt = Math.round((line.baseRupees * scalePct) / 100);
      if (injectError && idx === lastCreditIdx) {
        amt = Math.max(0, amt - Math.round((cur.errorDeltaRupees * scalePct) / 100));
      }
      if (line.side === 'Dr') drSum += amt;
      else crSum += amt;
      return { ...line, amt, isTampered: injectError && idx === lastCreditIdx };
    });

    const balanced = drSum === crSum;
    const diffFormatted = fmtRupees(Math.abs(drSum - crSum));
    const drTotalText = fmtRupees(drSum);
    const crTotalText = fmtRupees(crSum);

    const tallyFoot = h(
      'tfoot',
      {},
      h(
        'tr',
        { class: balanced ? '' : 'tally-mismatch' },
        h('th', { scope: 'row', colspan: 2 }, balanced ? 'Double-Entry Tally' : `Suspense Diff (${diffFormatted})`),
        h('td', { class: 'num' }, drTotalText),
        h('td', { class: 'num' }, crTotalText),
      ),
    );

    const beamSvg = renderBalanceBeamSvg({
      leftLabel: 'Total Debit (Dr)',
      leftAmount: drTotalText,
      leftValue: drSum,
      rightLabel: 'Total Credit (Cr)',
      rightAmount: crTotalText,
      rightValue: crSum,
      balanced,
    });

    mount(
      card,
      h(
        'div',
        { class: 'hero-ledger-head' },
        h('span', { class: 'hero-ledger-kicker' }, `CBSE 055 · CLASS ${cls} · ${cur.code}`),
        h('span', { class: 'hero-ledger-badge' + (balanced ? '' : ' bad') }, icon(balanced ? 'check-circle' : 'scale', 14), ' ', balanced ? 'Dr = Cr Verified' : `Mismatch ${diffFormatted}`),
      ),
      h(
        'div',
        { class: 'hero-folio-tabs', role: 'group', 'aria-label': 'Sample accounting vouchers' },
        ...specs.map((sp, idx) =>
          h(
            'button',
            {
              type: 'button',
              class: 'hero-folio-tab' + (idx === activeIdx ? ' on' : ''),
              'aria-pressed': String(idx === activeIdx),
              onclick: () => {
                if (activeIdx === idx) return;
                activeIdx = idx;
                injectError = false;
                scalePct = 100;
                drawFolio(true);
              },
            },
            sp.tab,
          ),
        ),
      ),
      h('div', { class: 'hero-folio-meta' }, h('span', {}, cur.folio), h('p', { class: 'hero-ledger-title' }, cur.title)),
      h(
        'div',
        { class: 'hero-sandbox-controls' },
        h(
          'div',
          { class: 'hero-scale-label' },
          h('label', { for: 'hero-scale-range' }, `Scale transaction (${scalePct}%)`),
          h('input', {
            id: 'hero-scale-range',
            type: 'range',
            min: 50,
            max: 200,
            step: 25,
            value: scalePct,
            oninput: (e: Event) => {
              scalePct = Number((e.target as HTMLInputElement).value) || 100;
              drawFolio(false);
            },
          }),
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'hero-error-toggle' + (injectError ? ' active' : ''),
            'aria-pressed': String(injectError),
            onclick: () => {
              injectError = !injectError;
              drawFolio(true);
            },
          },
          icon(injectError ? 'check-circle' : 'flame', 13),
          ' ',
          injectError ? 'Restore Dr = Cr' : 'Test Unbalanced Error',
        ),
      ),
      h('div', { class: 'hero-beam-wrap' }, beamSvg),
      h(
        'div',
        { class: 'hero-table-scroll' },
        h(
          'table',
          { class: 'hero-ledger-table' },
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              h('th', { scope: 'col', class: 'lf-col' }, 'L.F.'),
              h('th', { scope: 'col' }, 'Particulars'),
              h('th', { scope: 'col', class: 'num' }, 'Dr (₹)'),
              h('th', { scope: 'col', class: 'num' }, 'Cr (₹)'),
            ),
          ),
          h(
            'tbody',
            {},
            ...computedRows.map(row =>
              h(
                'tr',
                { class: (row.side === 'Cr' ? 'cr-row' : 'dr-row') + (row.isTampered ? ' row-error' : '') },
                h('td', { class: 'lf-col' }, row.lf),
                h('td', {}, row.particulars),
                h('td', { class: 'num' }, row.side === 'Dr' ? fmtRupees(row.amt) : '—'),
                h('td', { class: 'num' }, row.side === 'Cr' ? fmtRupees(row.amt) : '—'),
              ),
            ),
          ),
          tallyFoot,
        ),
      ),
      h(
        'div',
        { class: 'hero-folio-foot' },
        h('p', { class: 'hero-folio-narration' }, cur.narration),
        h('a', { class: 'hero-workbench-link', href: `#/sim-lab/${cur.targetLab}` }, 'Open Full Workbench →'),
      ),
    );
    if (animateTally) pulseLedgerConfirmation(tallyFoot);
  };

  drawFolio(false);
  return h('div', { class: 'hero-preview', lang: 'en' }, card);
}

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

  // TODAY: what is due for revision right now. Filled asynchronously so the hero paints immediately, and silent if
  // storage is unavailable (the rest of the page must still work in private mode).
  const todayBox = h('div', { class: 'today-slot' });
  void (async () => {
    try {
      const [a, { r }] = await Promise.all([attempts(), currentRewards()]);
      mount(todayBox, todayPanel(a, r, Date.now(), cls));
    } catch {
      /* no stored attempts: the hero already offers a first step */
    }
  })();

  // Interactive Flagship Accounting Workbenches (A–J) for the selected Class & Option
  const coreSims = coreSimulatorsFor(cls, route);
  const xiExposure = cls === 'XI' ? CORE_SIMULATORS.filter(s => s.id === 'computerised-accounting-lab') : [];
  const workbenchSpecs = [...coreSims, ...xiExposure];
  const workbenchGrid = h('div', { class: 'cards home-workbench-grid' });

  const renderWorkbenches = (completedSet: ReadonlySet<string>) => {
    mount(
      workbenchGrid,
      ...workbenchSpecs.map(cs => {
        const cleared = cs.missions.filter(m => completedSet.has(`${cs.id}:${m.tier}`)).length;
        const unitTitle = unitById(cs.unit)?.title ?? cs.unit;
        const titleNode = state.lang === 'hi' ? cs.titleHi : cs.title;
        return h(
          'a',
          {
            class: 'card home-workbench-card',
            href: `#/sim-lab/${cs.id}`,
            'data-home-workbench': cs.id,
          },
          h(
            'div',
            { class: 'folio-card-head' },
            h('div', { class: 'card-icon' }, icon(iconForLab(cs.id, cs.title), 18)),
            h('span', { class: 'simlab-code-pill' }, en(`Lab ${cs.code}`)),
            h('span', { class: 'simlab-meta-count' }, tr('home.workbenches.missions', { done: cleared })),
          ),
          h('h4', { class: 'home-wb-title' }, titleNode),
          h('p', { class: 'simlab-card-sub' }, en(cs.subtitle)),
          h('div', { class: 'simlab-tier-dots', 'aria-hidden': 'true' }, ...cs.missions.map(m => h('i', { class: completedSet.has(`${cs.id}:${m.tier}`) ? 'done' : '' }))),
          h('div', { class: 'home-workbench-foot' }, h('small', { class: 'hint' }, en(unitTitle)), h('span', { class: 'home-workbench-cta' }, tr('home.workbenches.open'), ' →')),
        );
      }),
    );
  };
  renderWorkbenches(new Set());
  void (async () => {
    try {
      const s = await seen();
      const prog = summariseCoreSimProgress(s, route);
      renderWorkbenches(prog.completedMissions);
    } catch {
      /* keep initial zero-progress state in restricted storage */
    }
  })();

  // The one thing a new visitor should do first, per class (and per Class XII option).
  const first = cls === 'XI' ? PAGES.find(p => p.id === 'xi-ledger') : route === 'OPTION_II_COMPUTERISED' ? PAGES.find(p => p.id === 'xii-cas') : ALL_LABS.find(l => l.cls === 'XII' && !l.route);
  const firstHref = first ? ('href' in first ? first.href : `#/lab/${first.id}`) : `#/class/${cls}`;
  const firstTitle = first ? first.title : `Class ${cls} syllabus`;

  const starterItems = [
    ...PAGES.filter(p => p.cls === cls && (!p.route || route === p.route))
      .slice(0, 2)
      .map(p => ({ id: p.id, href: p.href, title: p.title, summary: p.summary, cls: p.cls })),
    ...ALL_LABS.filter(l => l.cls === cls && (!l.route || route === l.route))
      .slice(0, 4)
      .map(l => ({ id: l.id, href: `#/lab/${l.id}`, title: l.title, summary: l.summary, cls: l.cls })),
  ];

  return h(
    'div',
    { class: 'home' },
    // HERO: Architectural Chartered Folio Masthead + Interactive Live Voucher Specimen
    h(
      'section',
      { class: 'hero hero-split' },
      h(
        'div',
        { class: 'hero-copy' },
        h('p', { class: 'eyebrow' }, tr('home.eyebrow')),
        h('h2', {}, tr('home.h2a'), h('span', { class: 'hero-accent' }, tr('home.h2b')), tr('home.h2c')),
        h('p', { class: 'lead' }, tr('home.lead')),
        h(
          'div',
          { class: 'classpick', role: 'radiogroup', 'aria-label': tr('home.chooseClass') },
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
              h('b', {}, tr('ui.class', { cls: c })),
              h('span', {}, tr(c === 'XI' ? 'home.xi.sub' : 'home.xii.sub')),
            ),
          ),
        ),
        cls === 'XII'
          ? h(
              'fieldset',
              { class: 'routebox' },
              h('legend', {}, tr('home.route.legend')),
              ...(
                [
                  ['OPTION_I_ANALYSIS', tr('home.route.1')],
                  ['OPTION_II_COMPUTERISED', tr('home.route.2')],
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
              route === 'OPTION_II_COMPUTERISED' ? h('p', { class: 'note info route-note' }, tr('home.route.note')) : null,
            )
          : null,
        h(
          'div',
          { class: 'actions hero-actions' },
          h('button', { type: 'button', class: 'primary', 'data-start': '', onclick: () => navigate(firstHref) }, tr('home.start'), en(firstTitle)),
          h('button', { type: 'button', onclick: () => navigate('#/practice') }, tr('home.practise')),
          h('button', { type: 'button', class: 'ghost', onclick: () => navigate(`#/class/${cls}`) }, tr('home.map', { cls })),
        ),
      ),
      buildHeroLedgerPreview(cls, route),
    ),

    todayBox,

    // FLAGSHIP INTERACTIVE ACCOUNTING WORKBENCHES (A–J) — Surfaced right on Home!
    h(
      'section',
      { class: 'home-workbenches-sec', 'aria-labelledby': 'home-workbenches-title' },
      h(
        'div',
        { class: 'section-head' },
        h('div', {}, h('h3', { id: 'home-workbenches-title' }, tr('home.workbenches.t', { cls })), h('p', { class: 'muted-line flush-bottom' }, tr('home.workbenches.sub'))),
        h('a', { class: 'button small primary', href: '#/sims' }, tr('home.workbenches.all')),
      ),
      workbenchGrid,
    ),

    // HOW IT WORKS: Architectural 3-Column Ledger Protocol Strip
    h(
      'section',
      { class: 'steps3', 'aria-label': tr('home.steps.aria') },
      ...(
        [
          ['01', 'book', tr('home.step1.t'), tr('home.step1.d')],
          ['02', 'flask', tr('home.step2.t'), tr('home.step2.d')],
          ['03', 'check-circle', tr('home.step3.t'), tr('home.step3.d')],
        ] as const
      ).map(([idx, ic, title, text]) =>
        h(
          'div',
          { class: 'step3' },
          h('div', { class: 'step3-top' }, h('span', { class: 'step3-num', 'aria-hidden': 'true' }, idx), h('div', { class: 'step3-icon' }, icon(ic, 20))),
          h('div', { class: 'step3-body' }, h('b', {}, title), h('span', {}, text)),
        ),
      ),
    ),

    // START HERE: Ledger Folio Index for the Chosen Class
    h('div', { class: 'section-head' }, h('h3', {}, tr('home.popular', { cls })), h('a', { class: 'button small', href: '#/labs' }, tr('home.allLabs'))),
    h(
      'section',
      { class: 'cards folio-grid' },
      ...starterItems.map((item, idx) =>
        h(
          'a',
          { class: 'card folio-card', href: item.href },
          h(
            'div',
            { class: 'folio-card-head' },
            h('div', { class: 'card-icon' }, icon(iconForLab(item.id, item.title), 20)),
            h('span', { class: 'folio-index', 'aria-hidden': 'true' }, `0${idx + 1}`),
          ),
          h('h3', {}, en(item.title)),
          h('p', {}, en(item.summary)),
          h('span', { class: 'chip' }, tr('ui.class', { cls: item.cls })),
        ),
      ),
    ),

    // VISUAL ACCOUNTING & CLASSROOM DOORS: Editorial Two-Column Ledger Dispatch
    h(
      'div',
      { class: 'editorial-dispatch-grid' },
      h(
        'section',
        { class: 'panel sims-band', 'aria-labelledby': 'sims-band-title' },
        h('div', {}, h('h3', { id: 'sims-band-title', class: 'flush-top' }, tr('home.sims.t')), h('p', {}, tr('home.sims.body'))),
        h('a', { class: 'button primary', href: '#/sims' }, tr('home.sims.btn')),
      ),
      h(
        'section',
        { class: 'panel teacher-band', 'aria-labelledby': 'teacher-band-title' },
        h('div', { class: 'teacher-band-icon' }, icon('chalkboard', 24)),
        h('div', { class: 'teacher-band-text' }, h('h3', { id: 'teacher-band-title' }, tr('home.teacher.t')), h('p', {}, tr('home.teacher.d'))),
        h('a', { class: 'button primary', href: '#/teacher' }, tr('home.teacher.btn')),
      ),
    ),

    // WHAT IS COVERED: Audited Syllabus Coverage Ledger Bar
    h(
      'section',
      { class: 'panel coverage-folio' },
      h('h3', { class: 'flush-top' }, tr('home.cover.t', { cls })),
      h('p', { class: 'muted-line' }, tr('home.cover.line', { a: cov.interactive, b: cov.total, c: cov.cardsOnly, d: cov.none })),
      h('div', { class: 'meter', role: 'img', 'aria-label': tr('home.cover.aria', { a: cov.interactive, b: cov.total, pct }) }, h('div', { class: 'meterfill', style: `width:${pct}%` })),
      h('div', { class: 'actions' }, h('a', { class: 'button', href: '#/cards' }, tr('home.cards')), h('a', { class: 'button', href: '#/rescue' }, tr('home.rescue'))),
    ),
  );
}
