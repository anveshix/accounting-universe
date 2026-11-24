import {
  ACCEPT_ATTR,
  CLAUSES,
  MATERIAL_KINDS,
  MATERIAL_LANGS,
  UNITS,
  countsByTopic,
  describeSize,
  guessKind,
  materialsFor,
  type ClassLevel,
  type MaterialKind,
  type MaterialLang,
} from '../../../../packages/curriculum/src';
import { h, mount } from '../dom';
import { addDevice, deviceUrl, listDevice, loadPublished, publishedUrl, removeDevice, type Listed } from '../materials-store';
import { announce } from '../ui';

const isClass = (x: string | undefined): x is ClassLevel => x === 'XI' || x === 'XII';
const KINDS = Object.keys(MATERIAL_KINDS) as MaterialKind[];
const OPEN_IN_TAB = new Set(['pdf', 'md', 'txt']);

/** The way a file is offered: PDFs and text open in a tab, Office files download. */
function actions(m: Listed): HTMLElement {
  const wrap = h('span', { class: 'material-actions' });
  if (!m.device) {
    const url = publishedUrl(m.file),
      name = m.file.split('/').pop()!;
    wrap.append(
      h('a', { class: 'button', href: url, ...(OPEN_IN_TAB.has(m.ext) ? { target: '_blank', rel: 'noopener' } : { download: name }), 'data-open': m.id }, OPEN_IN_TAB.has(m.ext) ? 'Open' : 'Download'),
    );
    if (OPEN_IN_TAB.has(m.ext)) wrap.append(h('a', { class: 'button', href: url, download: name }, 'Download'));
  } else {
    wrap.append(
      h(
        'button',
        {
          type: 'button',
          'data-open': m.id,
          onclick: async () => {
            const url = await deviceUrl(m.id);
            if (!url) return announce('That file is no longer on this device.');
            const a = h('a', { href: url, download: m.file.split('/').pop()!, ...(OPEN_IN_TAB.has(m.ext) ? { target: '_blank', rel: 'noopener' } : {}) });
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
          },
        },
        OPEN_IN_TAB.has(m.ext) ? 'Open' : 'Download',
      ),
    );
  }
  return wrap;
}

export function materialCard(m: Listed, onRemove?: () => void): HTMLElement {
  return h(
    'li',
    { class: 'material', 'data-material': m.id, 'data-kind': m.kind, 'data-device': String(m.device) },
    h(
      'div',
      { class: 'material-head' },
      h('span', { class: 'chip' }, MATERIAL_KINDS[m.kind]),
      h('span', { class: 'chip alt' }, MATERIAL_LANGS[m.lang]),
      m.device ? h('span', { class: 'chip warn', title: 'Stored in this browser only' }, 'On this device only') : null,
    ),
    h('p', { class: 'material-title' }, h('b', {}, m.title)),
    m.summary ? h('p', { class: 'material-summary' }, m.summary) : null,
    h('p', { class: 'material-meta muted-line' }, `${describeSize(m)} · added ${m.addedAt}`),
    h(
      'div',
      { class: 'material-foot' },
      actions(m),
      m.device && onRemove
        ? h(
            'button',
            {
              type: 'button',
              class: 'danger',
              'data-remove': m.id,
              onclick: async () => {
                await removeDevice(m.id);
                onRemove();
                announce('Removed from this device');
              },
            },
            'Remove',
          )
        : null,
    ),
  );
}

/** Items for one chapter, published first then the ones on this device. Used by the study page too. */
export async function itemsForTopic(topic: string): Promise<Listed[]> {
  const [pub, dev] = await Promise.all([loadPublished(), listDevice()]);
  return materialsFor([...pub.items, ...dev], topic) as Listed[];
}

export function materialsPage(arg?: string): HTMLElement {
  if (arg && !isClass(arg) && !CLAUSES.some(c => c.id === arg))
    return h('div', { class: 'panel' }, h('h2', {}, 'Chapter not found'), h('p', {}, `There is no chapter “${arg}”.`), h('a', { class: 'button', href: '#/materials' }, 'All chapter materials'));
  const topicArg = arg && !isClass(arg) && CLAUSES.some(c => c.id === arg) ? arg : undefined;
  let cls: ClassLevel = isClass(arg) ? arg : topicArg ? (topicArg.startsWith('XII') ? 'XII' : 'XI') : 'XI';
  let kindFilter: MaterialKind | '' = '';
  let q = '';
  let all: Listed[] = [];
  const status = h('p', { class: 'note', role: 'status' }),
    list = h('div', { class: 'material-chapters' }),
    bar = h('div', { class: 'notes-filters' });

  const draw = () => {
    const shown = all.filter(m => (!kindFilter || m.kind === kindFilter) && (!q || (m.title + ' ' + m.summary).toLowerCase().includes(q)));
    const counts = countsByTopic(all);
    const units = UNITS.filter(u => u.cls === cls);
    mount(
      list,
      ...units.map(u => {
        const clauses = CLAUSES.filter(c => c.unit === u.id);
        return h(
          'section',
          { class: 'panel unit', 'data-unit': u.id },
          h('div', { class: 'unit-head' }, h('h3', {}, u.title)),
          ...clauses.map((c, i) => {
            const mine = materialsFor(shown, c.id) as Listed[],
              total = Object.values(counts[c.id] ?? {}).reduce((s, n) => s + (n ?? 0), 0);
            return h(
              'details',
              { class: 'material-topic', 'data-topic': c.id, ...(total && (mine.length || topicArg === c.id) ? { open: true } : topicArg === c.id ? { open: true } : {}) },
              h(
                'summary',
                {},
                h('span', { class: 'topic-no' }, String(i + 1)),
                ' ',
                h('span', { class: 'topic-title' }, c.title),
                h(
                  'span',
                  { class: 'topic-meta' },
                  total
                    ? KINDS.filter(k => counts[c.id]?.[k]).map(k => h('span', { class: 'chip' }, `${counts[c.id]![k]} ${MATERIAL_KINDS[k]}`))
                    : h('span', { class: 'muted-line' }, 'no material yet'),
                ),
              ),
              mine.length
                ? h('ul', { class: 'materials' }, ...mine.map(m => materialCard(m, () => void refresh())))
                : h(
                    'p',
                    { class: 'note' },
                    total ? 'Nothing here matches the filters.' : 'No material for this chapter yet. Add one below, or publish it for everyone (see “How to publish for everyone”).',
                  ),
              h('p', { class: 'no-print' }, h('a', { href: `#/study/${c.id}` }, 'Open the study notes for this chapter →')),
            );
          }),
        );
      }),
    );
    const pub = all.filter(m => !m.device).length,
      dev = all.length - pub,
      chapters = new Set(all.filter(m => !m.device).map(m => m.topic)).size;
    status.textContent = `${pub} published item${pub === 1 ? '' : 's'} across ${chapters} of ${CLAUSES.length} chapters${dev ? ` · ${dev} on this device` : ''}`;
  };
  async function refresh() {
    const [pub, dev] = await Promise.all([loadPublished(), listDevice()]);
    all = [...pub.items, ...dev];
    draw();
    if (pub.problems.length) status.textContent += ` · ${pub.problems.length} catalogue entr${pub.problems.length === 1 ? 'y was' : 'ies were'} skipped as invalid`;
  }

  const chip = <T extends string>(label: string, value: T | '', current: () => T | '', set: (v: T | '') => void) =>
    h(
      'button',
      {
        type: 'button',
        'aria-pressed': String(current() === value),
        class: current() === value ? 'on' : '',
        onclick: () => {
          set(value);
          drawBar();
          draw();
        },
      },
      label,
    );
  const drawBar = () =>
    mount(
      bar,
      h(
        'div',
        { class: 'modes', role: 'group', 'aria-label': 'Class' },
        ...(['XI', 'XII'] as const).map(c =>
          h(
            'button',
            {
              type: 'button',
              'aria-pressed': String(cls === c),
              class: cls === c ? 'on' : '',
              'data-class': c,
              onclick: () => {
                cls = c;
                drawBar();
                draw();
              },
            },
            `Class ${c}`,
          ),
        ),
      ),
      h(
        'div',
        { class: 'modes', role: 'group', 'aria-label': 'Kind' },
        chip(
          'All kinds',
          '',
          () => kindFilter,
          v => (kindFilter = v),
        ),
        ...KINDS.map(k =>
          chip(
            MATERIAL_KINDS[k],
            k,
            () => kindFilter,
            v => (kindFilter = v),
          ),
        ),
      ),
      h('input', {
        type: 'search',
        'aria-label': 'Search materials',
        placeholder: 'Search, e.g. depreciation',
        value: q,
        oninput: (e: Event) => {
          q = (e.target as HTMLInputElement).value.trim().toLowerCase();
          draw();
        },
      }),
    );

  // ── add to this device ──
  const topicSel = h(
    'select',
    { id: 'mat-topic', required: true },
    h('option', { value: '' }, 'Choose a chapter…'),
    ...UNITS.map(u =>
      h(
        'optgroup',
        { label: `Class ${u.cls} · ${u.title}` },
        ...CLAUSES.filter(c => c.unit === u.id).map(c => h('option', { value: c.id, ...(topicArg === c.id ? { selected: true } : {}) }, c.title)),
      ),
    ),
  );
  const kindSel = h('select', { id: 'mat-kind' }, ...KINDS.map(k => h('option', { value: k }, MATERIAL_KINDS[k])));
  const langSel = h('select', { id: 'mat-lang' }, ...(Object.keys(MATERIAL_LANGS) as MaterialLang[]).map(l => h('option', { value: l }, MATERIAL_LANGS[l])));
  const titleIn = h('input', { id: 'mat-title', type: 'text', maxlength: 120, placeholder: 'e.g. SLM and WDV: worked examples' });
  const fileIn = h('input', {
    id: 'mat-file',
    type: 'file',
    accept: ACCEPT_ATTR,
    required: true,
    onchange: () => {
      const f = fileIn.files?.[0];
      if (f) {
        kindSel.value = guessKind(f.name);
        if (!titleIn.value) titleIn.placeholder = f.name.replace(/\.[A-Za-z0-9]{1,5}$/, '');
      }
    },
  });
  const result = h('p', { class: 'note', role: 'status', 'aria-live': 'polite', id: 'mat-result' });
  const form = h(
    'form',
    {
      class: 'material-form',
      onsubmit: async (e: Event) => {
        e.preventDefault();
        mount(result);
        const file = fileIn.files?.[0];
        if (!file) return mount(result, h('span', { class: 'bad', role: 'alert' }, 'Choose a file first.'));
        const r = await addDevice({ topic: topicSel.value, kind: kindSel.value as MaterialKind, title: titleIn.value, lang: langSel.value as MaterialLang, file });
        if (!r.ok) return mount(result, h('span', { class: 'bad', role: 'alert' }, r.reason));
        mount(result, h('span', { class: 'good' }, `✓ Added “${r.meta.title}” to this device under ${CLAUSES.find(c => c.id === r.meta.topic)!.title}. It is not shared with anyone.`));
        announce('File added on this device');
        form.reset();
        await refresh();
      },
    },
    h('label', {}, 'Chapter', topicSel),
    h('label', {}, 'File (PDF, PPTX, DOCX, XLSX, MD or TXT, up to 25 MB)', fileIn),
    h('label', {}, 'Kind', kindSel),
    h('label', {}, 'Title (optional)', titleIn),
    h('label', {}, 'Language', langSel),
    h('button', { type: 'submit', class: 'primary' }, 'Add to this device'),
    result,
  );

  void refresh();
  drawBar();
  return h(
    'article',
    { class: 'materials-page', 'data-materials': '' },
    h(
      'header',
      { class: 'labhead' },
      h(
        'nav',
        { class: 'breadcrumb', 'aria-label': 'Breadcrumb' },
        h('a', { href: '#/' }, 'Home'),
        h('span', { 'aria-hidden': 'true' }, ' › '),
        h('a', { href: '#/notes' }, 'Notes'),
        h('span', { 'aria-hidden': 'true' }, ' › '),
        h('span', { 'aria-current': 'page' }, 'By chapter'),
      ),
      h('p', { class: 'eyebrow' }, 'Chapter materials'),
      h('h2', {}, 'Notes, slides and lesson plans, chapter by chapter'),
      h('p', { class: 'lead' }, 'Everything is filed under the official CBSE 2026-27 chapters. Open it, or add your own file for a chapter.'),
      status,
    ),
    bar,
    list,
    h(
      'section',
      { class: 'panel', id: 'add' },
      h('h3', {}, 'Add a file for a chapter (on this device)'),
      h(
        'p',
        { class: 'note info' },
        'The file stays in this browser. It is not uploaded and nobody else can see it. Files are checked first: PDFs, PowerPoint, Word, Excel, Markdown and text only, no macros, up to 25 MB.',
      ),
      form,
    ),
    h(
      'section',
      { class: 'panel', id: 'publish' },
      h('h3', {}, 'How to publish for everyone'),
      h('p', {}, 'Teachers can add a file or a Google Drive link so that every student sees it. Nothing goes live until it has been checked and approved.'),
      h(
        'ol',
        {},
        h(
          'li',
          {},
          'Put the file on GitHub in ',
          h('code', {}, 'incoming/<chapter id>/<KIND>/<file>'),
          ' (for example ',
          h('code', {}, 'incoming/XI.2.depreciation/PPT/slm-and-wdv.pptx'),
          '), or list Drive links in ',
          h('code', {}, 'incoming/drive-links.txt'),
          ' as ',
          h('code', {}, 'chapter | kind | title | link'),
          '.',
        ),
        h('li', {}, 'The “Materials ingest” workflow checks every file (type, size, macros, chapter id) and opens a pull request with the result.'),
        h('li', {}, 'A reviewer approves it; the site rebuilds and the item appears here.'),
      ),
      h('p', { class: 'note' }, 'A Drive link must be shared as “Anyone with the link”. Folders are not supported: share the files one by one. Full guide: docs/MATERIALS_PIPELINE.md.'),
    ),
  );
}
