import type { ClassLevel } from '../../../../packages/curriculum/src';
import { h, mount } from '../dom';
import { icon, iconForLab } from '../icons';
import { ALL_LABS, PAGES, coverage } from '../labs';
import { pulseLedgerConfirmation } from '../motion';
import { state } from '../state';
import { attempts, setProfile } from '../store';
import { navigate } from '../router';
import { en, tr } from '../i18n';
import { currentRewards } from '../rewards-ui';
import { todayPanel } from '../review-ui';

interface HeroVoucherSpec {
  readonly code: string;
  readonly tab: string;
  readonly folio: string;
  readonly title: string;
  readonly narration: string;
  readonly lines: readonly [string, string, string, string][];
  readonly total: string;
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
        lines: [
          ['5201', 'Salaries & Wages A/c (Dr)', '₹64,000', ''],
          ['2108', 'To TDS Payable A/c', '', '₹6,400'],
          ['1202', 'To HDFC Bank A/c', '', '₹57,600'],
        ],
        total: '₹64,000',
      },
      {
        code: 'VCH-109',
        tab: '02 Capex',
        folio: 'CAS · Asset Acquisition',
        title: 'Fixed Asset Master + Sub-Ledger Sync',
        narration: 'Being CNC equipment capitalised into Asset Register with automated SLM schedule.',
        lines: [
          ['1104', 'Plant & Machinery A/c (Dr)', '₹1,80,000', ''],
          ['1409', 'Input IGST A/c (Dr)', '₹32,400', ''],
          ['1202', 'To HDFC Bank A/c', '', '₹2,12,400'],
        ],
        total: '₹2,12,400',
      },
      {
        code: 'VCH-115',
        tab: '03 Audit',
        folio: 'CAS · Period Lock',
        title: 'Closing Adjustment & Audit Hash',
        narration: 'Being annual depreciation batch posted and period locked against back-dated edits.',
        lines: [
          ['5402', 'Depreciation Expense A/c (Dr)', '₹18,000', ''],
          ['1194', 'To Accumulated Depreciation A/c', '', '₹18,000'],
        ],
        total: '₹18,000',
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
        lines: [
          ['3101', 'P&L Appropriation A/c (Dr)', '₹1,68,000', ''],
          ['2401', 'To Aarav Capital A/c (IoC + Share)', '', '₹1,00,800'],
          ['2402', 'To Meera Capital A/c (IoC + Share)', '', '₹67,200'],
        ],
        total: '₹1,68,000',
      },
      {
        code: 'FOLIO XII-B',
        tab: '02 Goodwill',
        folio: 'Admission · Sacrificing Ratio',
        title: 'Premium for Goodwill on Partner Admission',
        narration: 'Being incoming partner Kabir’s goodwill premium credited in sacrificing ratio 2 : 1.',
        lines: [
          ['2490', 'Premium for Goodwill A/c (Dr)', '₹90,000', ''],
          ['2401', 'To Aarav Capital A/c', '', '₹60,000'],
          ['2402', 'To Meera Capital A/c', '', '₹30,000'],
        ],
        total: '₹90,000',
      },
      {
        code: 'FOLIO XII-C',
        tab: '03 Forfeiture',
        folio: 'Company Accounts · Share Capital',
        title: 'Share Forfeiture & Pro-Rata Reissue',
        narration: 'Being 400 defaulted shares forfeited and surplus transferred to Capital Reserve.',
        lines: [
          ['2001', 'Share Capital A/c (Dr)', '₹40,000', ''],
          ['2014', 'To Calls-in-Arrears A/c', '', '₹12,000'],
          ['2019', 'To Share Forfeiture A/c', '', '₹28,000'],
        ],
        total: '₹40,000',
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
      lines: [
        ['1001', 'Cash-in-Hand A/c (Dr)', '₹75,000', ''],
        ['1002', 'Cash at Bank A/c (Dr)', '₹1,75,000', ''],
        ['3001', 'To Proprietor Capital A/c', '', '₹2,50,000'],
      ],
      total: '₹2,50,000',
    },
    {
      code: 'FOLIO XI-02',
      tab: '02 GST Trade',
      folio: 'Purchases Journal · J.F. 04',
      title: 'Credit Inventory Purchase with Input GST',
      narration: 'Being traded goods bought from Sharma Traders @ 18% GST (9% CGST + 9% SGST).',
      lines: [
        ['4101', 'Purchases A/c (Dr)', '₹50,000', ''],
        ['1401', 'Input CGST / SGST A/c (Dr)', '₹9,000', ''],
        ['2104', 'To Sharma Traders A/c', '', '₹59,000'],
      ],
      total: '₹59,000',
    },
    {
      code: 'FOLIO XI-03',
      tab: '03 Closing',
      folio: 'Year-End Adjustment · J.F. 12',
      title: 'WDV Depreciation & Accrued Provision',
      narration: 'Being 10% WDV depreciation charged on machinery before Trial Balance extraction.',
      lines: [
        ['5301', 'Depreciation A/c (Dr)', '₹24,000', ''],
        ['1102', 'To Machinery A/c', '', '₹24,000'],
      ],
      total: '₹24,000',
    },
  ];
}

function buildHeroLedgerPreview(cls: ClassLevel, route: string): HTMLElement {
  const specs = getHeroVouchers(cls, route);
  let activeIdx = 0;
  const card = h('div', { class: 'hero-ledger-card' });

  const drawFolio = (animateTally: boolean) => {
    const cur = (specs[activeIdx] ?? specs[0])!;
    const tallyFoot = h(
      'tfoot',
      {},
      h(
        'tr',
        {},
        h('th', { scope: 'row', colSpan: 2 }, 'Double-Entry Tally'),
        h('td', { class: 'num' }, cur.total),
        h('td', { class: 'num' }, cur.total),
      ),
    );
    mount(
      card,
      h(
        'div',
        { class: 'hero-ledger-head' },
        h('span', { class: 'hero-ledger-kicker' }, `CBSE 055 · CLASS ${cls} · ${cur.code}`),
        h('span', { class: 'hero-ledger-badge' }, icon('check-circle', 14), ' Dr = Cr Verified'),
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
            ...cur.lines.map(([lf, p, dr, cr]) =>
              h(
                'tr',
                { class: cr ? 'cr-row' : 'dr-row' },
                h('td', { class: 'lf-col' }, lf),
                h('td', {}, p),
                h('td', { class: 'num' }, dr || '—'),
                h('td', { class: 'num' }, cr || '—'),
              ),
            ),
          ),
          tallyFoot,
        ),
      ),
      h('p', { class: 'hero-folio-narration' }, cur.narration),
    );
    if (animateTally) pulseLedgerConfirmation(tallyFoot);
  };

  drawFolio(false);
  return h('aside', { class: 'hero-preview', lang: 'en', 'aria-label': 'Interactive accounting voucher folio' }, card);
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

  // The one thing a new visitor should do first, per class (and per Class XII option).
  const first =
    cls === 'XI'
      ? PAGES.find(p => p.id === 'xi-ledger')
      : route === 'OPTION_II_COMPUTERISED'
        ? PAGES.find(p => p.id === 'xii-cas')
        : ALL_LABS.find(l => l.cls === 'XII' && !l.route);
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
    h(
      'div',
      { class: 'section-head' },
      h('h3', {}, tr('home.popular', { cls })),
      h('a', { class: 'button small', href: '#/labs' }, tr('home.allLabs')),
    ),
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
        h(
          'div',
          { class: 'teacher-band-text' },
          h('h3', { id: 'teacher-band-title' }, tr('home.teacher.t')),
          h('p', {}, tr('home.teacher.d')),
        ),
        h('a', { class: 'button primary', href: '#/teacher' }, tr('home.teacher.btn')),
      ),
    ),

    // WHAT IS COVERED: Audited Syllabus Coverage Ledger Bar
    h(
      'section',
      { class: 'panel coverage-folio' },
      h('h3', { class: 'flush-top' }, tr('home.cover.t', { cls })),
      h('p', { class: 'muted-line' }, tr('home.cover.line', { a: cov.interactive, b: cov.total, c: cov.cardsOnly, d: cov.none })),
      h(
        'div',
        { class: 'meter', role: 'img', 'aria-label': tr('home.cover.aria', { a: cov.interactive, b: cov.total, pct }) },
        h('div', { class: 'meterfill', style: `width:${pct}%` }),
      ),
      h('div', { class: 'actions' }, h('a', { class: 'button', href: '#/cards' }, tr('home.cards')), h('a', { class: 'button', href: '#/rescue' }, tr('home.rescue'))),
    ),
  );
}
