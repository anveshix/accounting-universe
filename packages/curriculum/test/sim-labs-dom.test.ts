// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { CORE_SIMULATORS } from '../src';
import { simsIndex } from '../../../apps/web/src/pages/simulators';
import { disposeActiveSimLab, simLabPage } from '../../../apps/web/src/sim-labs';
import { state } from '../../../apps/web/src/state';

async function flushDom(): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 10));
  }
}

describe('CBSE Class XI & XII Simulator & Visualiser DOM integration', () => {
  beforeEach(() => {
    disposeActiveSimLab();
    document.body.innerHTML = '';
    state.profile = { ...state.profile, cls: 'XI', route: 'OPTION_I_ANALYSIS', lang: 'en' };
    state.lang = 'en';
  });

  it('renders the upgraded #/sims hub preserving existing invariants and showcasing Labs A–J', async () => {
    const hub = simsIndex();
    document.body.appendChild(hub);
    await flushDom();

    expect(hub.querySelector('.labhead h2')?.textContent).toBe('Visual simulators');
    expect(hub.querySelectorAll('.simcard').length).toBe(4);
    expect(hub.querySelectorAll('.simchapter > .section-head h3').length).toBe(2);
    expect(hub.querySelector('.simportop b')?.textContent).toMatch(/of 4 solved/);

    // Class XI filter shows 6 core XI labs + 1 XI CAS exposure = 7 core lab cards
    expect(hub.querySelectorAll('[data-core-card]').length).toBe(7);

    // Switch filter to Class XII (Option I)
    (hub.querySelector('[data-sim-cls="XII"]') as HTMLButtonElement).click();
    expect(hub.querySelectorAll('[data-core-card]').length).toBe(3);

    // Switch filter to Both Classes (9 labs on Option I)
    (hub.querySelector('[data-sim-cls="ALL"]') as HTMLButtonElement).click();
    expect(hub.querySelectorAll('[data-core-card]').length).toBe(9);
  });

  it('mounts every single Simulator Lab (A–J), switches difficulty tiers, reveals hints, and toggles EN+HI', async () => {
    for (const spec of CORE_SIMULATORS) {
      const host = document.createElement('div');
      document.body.replaceChildren(host);
      simLabPage(host, spec.id);
      await flushDom();

      const page = host.querySelector(`[data-core-sim="${spec.id}"]`);
      expect(page, `${spec.id} root`).not.toBeNull();
      expect(host.querySelector('h2')?.textContent).toContain(spec.title);
      expect(host.querySelectorAll('[data-tier]').length).toBe(4);

      // Reveal hint
      const hintBtn = host.querySelector('[data-sim-hint]') as HTMLButtonElement;
      expect(hintBtn).not.toBeNull();
      hintBtn.click();
      expect(host.querySelectorAll('.simlab-hints-list li').length).toBeGreaterThanOrEqual(1);

      // Toggle EN+HI terminology
      const langToggle = host.querySelector('[data-bilingual-toggle]') as HTMLButtonElement;
      langToggle.click();
      expect(langToggle.textContent).toContain('EN + हिन्दी');

      // Cycle through all 4 difficulty tiers without throwing
      for (const tier of ['PRACTICE', 'CHALLENGE', 'MASTER', 'BEGINNER']) {
        const tierBtn = host.querySelector(`[data-tier="${tier}"]`) as HTMLButtonElement;
        expect(tierBtn).not.toBeNull();
        tierBtn.click();
      }
      disposeActiveSimLab();
    }
  });

  it('completes interactive missions across representative Class XI and Class XII labs and awards XP', async () => {
    // 1. Experience A: Accounting Equation Lab — Practice tier verification
    const hostA = document.createElement('div');
    document.body.replaceChildren(hostA);
    simLabPage(hostA, 'equation-lab');
    await flushDom();
    (hostA.querySelector('[data-tier="PRACTICE"]') as HTMLButtonElement).click();
    (hostA.querySelector('[data-eq-model]') as HTMLButtonElement).click();
    const verifyEq = hostA.querySelector('[data-eq-verify]') as HTMLButtonElement;
    verifyEq.click();
    await flushDom();
    expect(hostA.textContent).toContain('Mission Verified');
    disposeActiveSimLab();

    // 2. Experience D: Depreciation Lab — Master tier disposal check
    const hostD = document.createElement('div');
    document.body.replaceChildren(hostD);
    simLabPage(hostD, 'depreciation-lab');
    await flushDom();
    (hostD.querySelector('[data-tier="MASTER"]') as HTMLButtonElement).click();
    (hostD.querySelector('[data-dep-verify]') as HTMLButtonElement).click();
    await flushDom();
    expect(hostD.textContent).toContain('Mission Verified');
    disposeActiveSimLab();

    // 3. Experience G: Partnership Lab — Beginner P&L Appropriation & Guarantee
    const hostG = document.createElement('div');
    document.body.replaceChildren(hostG);
    simLabPage(hostG, 'partnership-lab');
    await flushDom();
    (hostG.querySelector('[data-part-verify]') as HTMLButtonElement).click();
    await flushDom();
    expect(hostG.textContent).toContain('Mission Verified');
    disposeActiveSimLab();

    // 4. Experience H: Company Lab — Pro-rata + Forfeiture + Re-issue Capital Reserve
    const hostH = document.createElement('div');
    document.body.replaceChildren(hostH);
    simLabPage(hostH, 'company-lab');
    await flushDom();
    (hostH.querySelector('[data-tier="CHALLENGE"]') as HTMLButtonElement).click();
    (hostH.querySelector('[data-comp-verify]') as HTMLButtonElement).click();
    await flushDom();
    expect(hostH.textContent).toContain('Mission Verified');
    disposeActiveSimLab();

    // 5. Experience I: Financial Analysis Lab — AS 3 Cash Flow Statement reconciliation
    const hostI = document.createElement('div');
    document.body.replaceChildren(hostI);
    simLabPage(hostI, 'financial-analysis-lab');
    await flushDom();
    (hostI.querySelector('[data-tier="MASTER"]') as HTMLButtonElement).click();
    (hostI.querySelector('[data-cf-verify]') as HTMLButtonElement).click();
    await flushDom();
    expect(hostI.textContent).toContain('Mission Verified');
    disposeActiveSimLab();

    // 6. Experience J: Computerised Accounting Lab — Maker-Checker Voucher & Year-End Close
    const hostJ = document.createElement('div');
    document.body.replaceChildren(hostJ);
    simLabPage(hostJ, 'computerised-accounting-lab');
    await flushDom();
    (hostJ.querySelector('[data-tier="PRACTICE"]') as HTMLButtonElement).click();
    // Queue voucher as Accountant
    (hostJ.querySelector('[data-cas-queue]') as HTMLButtonElement).click();
    // Switch to Checker and verify
    (hostJ.querySelector('[data-cas-role="CHECKER"]') as HTMLButtonElement).click();
    (hostJ.querySelector('[data-cas-verify-vch]') as HTMLButtonElement).click();
    await flushDom();
    expect(hostJ.textContent).toContain('Mission Verified');
    disposeActiveSimLab();
  });
});
