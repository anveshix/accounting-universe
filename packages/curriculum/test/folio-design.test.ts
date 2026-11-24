// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { homePage } from '../../../apps/web/src/pages/home';
import { classPage, labsIndex } from '../../../apps/web/src/pages/classpage';
import { state } from '../../../apps/web/src/state';

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]/u;
const DEV = /[\u0900-\u097F]/;
const ALLOWED_EN = new Set(['CBSE', 'depreciation', 'goodwill', 'ratio', 'XI', 'XII']);

function untaggedEnglishWords(root: HTMLElement): string[] {
  const out: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || el.closest('[lang="en"]') || el.closest('script,style')) continue;
    for (const m of (n.textContent ?? '').matchAll(/[A-Za-z]{3,}/g)) {
      const w = m[0];
      if (!ALLOWED_EN.has(w) && !/^[A-Z]{3,6}$/.test(w) && w !== 'Ind') {
        out.push(`${w} in "${(n.textContent ?? '').trim().slice(0, 40)}"`);
      }
    }
  }
  return out;
}

describe('Chartered Ledger Folio UI/UX Pro Max invariants (Home, Labs Index, Class Map, Hindi)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    state.profile = { ...state.profile, cls: 'XI', route: 'OPTION_I_ANALYSIS', lang: 'en' };
    state.lang = 'en';
  });

  it('renders the Chartered Ledger Folio home page with interactive voucher tabs and preserves all DOM contracts', () => {
    let rerendered = 0;
    const home = homePage(() => {
      rerendered++;
    });
    document.body.appendChild(home);

    const visibleText = home.textContent ?? '';
    expect(visibleText).not.toMatch(/bigint|paise|engine computes|apps\/|proxy|D4\b/i);
    expect(EMOJI.test(visibleText)).toBe(false);
    expect(home.querySelector('h2')?.textContent).toBe('Learn Accounting by Doing Accounting.');
    expect(home.querySelectorAll('.step3').length).toBe(3);
    expect(home.querySelectorAll('.card .icon svg').length).toBeGreaterThanOrEqual(4);
    expect(home.querySelector('.hero-scene')).toBeNull();
    expect(home.querySelector('.hero canvas')).toBeNull();
    expect(home.querySelector('[data-start]')?.textContent).toMatch(/Start here: Journal → Ledger → Trial Balance/);
    expect(home.querySelector('.teacher-band a.button')?.getAttribute('href')).toBe('#/teacher');

    // Interactive Hero Voucher Folio switches tabs cleanly and updates Dr = Cr tally
    const tabs = home.querySelectorAll<HTMLButtonElement>('.hero-folio-tab');
    expect(tabs.length).toBe(3);
    expect(home.querySelector('.hero-ledger-table tfoot')?.textContent).toContain('₹2,50,000');
    expect(home.querySelector('.hero-beam-wrap svg.simlab-beam-svg')).not.toBeNull();

    // Live transaction scale slider updates exact INR amounts and balance beam
    const slider = home.querySelector<HTMLInputElement>('#hero-scale-range');
    expect(slider).not.toBeNull();
    slider!.value = '150';
    slider!.dispatchEvent(new Event('input', { bubbles: true }));
    expect(home.querySelector('.hero-ledger-table tfoot')?.textContent).toContain('₹3,75,000');

    // Posting error toggle tilts the SVG balance beam and flags Suspense difference
    const errBtn = home.querySelector<HTMLButtonElement>('.hero-error-toggle');
    expect(errBtn).not.toBeNull();
    errBtn!.click();
    expect(home.querySelector('.hero-ledger-badge.bad')?.textContent).toContain('Mismatch');
    expect(home.querySelector('.hero-ledger-table tfoot tr.tally-mismatch')).not.toBeNull();

    // Switching voucher tabs resets scale & restores balanced tally
    tabs[1]!.click();
    expect(home.querySelector('.hero-ledger-table tfoot')?.textContent).toContain('₹59,000');
    tabs[2]!.click();
    expect(home.querySelector('.hero-ledger-table tfoot')?.textContent).toContain('₹24,000');

    // Flagship Interactive Workbenches (A–F + CAS exposure) & Quick Double-Entry Drill are surfaced right on Home
    expect(home.querySelectorAll('[data-home-workbench]').length).toBeGreaterThanOrEqual(6);
    expect(home.querySelectorAll('.home-metric-tile').length).toBe(4);
    const drillOpt = home.querySelector<HTMLButtonElement>('[data-drill-opt="0"]');
    expect(drillOpt).not.toBeNull();
    drillOpt!.click();
    expect(home.querySelector('.home-drill-feedback.good')).not.toBeNull();

    // Class XII toggle triggers rerender and updates hero vouchers
    const xiiBtn = Array.from(home.querySelectorAll<HTMLButtonElement>('.bigchoice')).find(b => b.textContent?.includes('Class XII'));
    expect(xiiBtn).toBeDefined();
    xiiBtn!.click();
    expect(rerendered).toBe(1);
    expect(state.profile.cls).toBe('XII');
  });

  it('supports interactive topic filtering and Part B Option switching on Class Map', () => {
    const clsXII = classPage('XII');
    document.body.replaceChildren(clsXII);
    expect(clsXII.querySelectorAll('[data-cls-workbench]').length).toBeGreaterThanOrEqual(3);

    const search = clsXII.querySelector<HTMLInputElement>('#class-search-XII');
    expect(search).not.toBeNull();
    search!.value = 'forfeiture';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    expect(clsXII.querySelectorAll('.clauselist li').length).toBeGreaterThanOrEqual(1);
    expect(clsXII.textContent?.toLowerCase()).toContain('forfeiture');
  });

  it('keeps zero untagged English words on Home, Labs Index, and Class Map when switched to Hindi mode', () => {
    state.lang = 'hi';
    state.profile = { ...state.profile, lang: 'hi', cls: 'XI' };

    const homeHi = homePage(() => {});
    document.body.replaceChildren(homeHi);
    expect(DEV.test(homeHi.querySelector('h2')?.textContent ?? '')).toBe(true);
    expect(untaggedEnglishWords(homeHi)).toEqual([]);

    const labsHi = labsIndex();
    document.body.replaceChildren(labsHi);
    expect(labsHi.querySelectorAll('details.unit-group').length).toBeGreaterThanOrEqual(3);
    expect(untaggedEnglishWords(labsHi)).toEqual([]);

    const clsHi = classPage('XI');
    document.body.replaceChildren(clsHi);
    const firstRowChildren = Array.from(clsHi.querySelector('.clauselist li > div')?.children ?? []).map(c => `${c.tagName}.${c.className}`);
    expect(firstRowChildren[0]).toMatch(/^B\./);
    expect(firstRowChildren.join(' | ')).toContain('SPAN.cid');
    expect(untaggedEnglishWords(clsHi)).toEqual([]);
  });
});
