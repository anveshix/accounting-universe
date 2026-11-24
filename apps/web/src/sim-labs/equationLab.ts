/**
 * Experience A — Accounting Equation & Debit/Credit Rules Lab (`XI.2.equation`, `XI.2.rules`)
 * Powered by `runEquationSteps` & `verifyEquationAnalysis` in `packages/engine`.
 */
import { Money, runEquationSteps, verifyEquationAnalysis, type EquationBucket, type EquationLineChange, type EquationTransaction } from '../../../../packages/engine/src';
import type { SimDifficulty } from '../../../../packages/curriculum/src';
import { h, mount } from '../dom';
import { mountBalanceScale, type BalanceHandle } from '../experience/balanceScale';
import { createPlaybackBar, renderBalanceBeamSvg, type SimShellContext } from './shell';

interface EquationScenario {
  readonly tier: SimDifficulty;
  readonly prompt: string;
  readonly storyTxns: readonly EquationTransaction[];
  readonly challengePrompt: string;
  readonly defaultDraft: EquationLineChange[];
  readonly expected: readonly EquationLineChange[];
}

const R = (m: Money) => m.format();

const SCENARIOS: readonly EquationScenario[] = [
  {
    tier: 'BEGINNER',
    prompt: 'Follow Aarav Traders from Day 1: Capital investment, cash asset swap, and credit stock purchase.',
    storyTxns: [
      {
        id: 's1',
        narration: 'Owner invested ₹1,00,000 cash as Capital',
        changes: [
          { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(100000) },
          { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(100000) },
        ],
      },
      {
        id: 's2',
        narration: 'Bought Furniture for ₹25,000 cash',
        changes: [
          { bucket: 'ASSETS', head: 'Furniture', delta: Money.rupees(25000) },
          { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-25000) },
        ],
      },
    ],
    challengePrompt: 'Analyse: Purchased Furniture for ₹25,000 in cash (after ₹1,00,000 Capital is already in the business).',
    defaultDraft: [{ bucket: 'ASSETS', head: 'Furniture', delta: Money.rupees(25000) }],
    expected: [
      { bucket: 'ASSETS', head: 'Furniture', delta: Money.rupees(25000) },
      { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-25000) },
    ],
  },
  {
    tier: 'PRACTICE',
    prompt: 'Credit purchase of goods and payment of office rent.',
    storyTxns: [
      {
        id: 'p1',
        narration: 'Started business with Cash ₹1,00,000',
        changes: [
          { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(100000) },
          { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(100000) },
        ],
      },
      {
        id: 'p2',
        narration: 'Bought goods on credit from Creditors ₹40,000',
        changes: [
          { bucket: 'ASSETS', head: 'Stock', delta: Money.rupees(40000) },
          { bucket: 'LIABILITIES', head: 'Creditors', delta: Money.rupees(40000) },
        ],
      },
      {
        id: 'p3',
        narration: 'Paid office rent ₹6,000 in cash',
        changes: [
          { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-6000) },
          { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(-6000) },
        ],
      },
    ],
    challengePrompt: 'Build the combined movement for: Paid office rent ₹6,000 in cash.',
    defaultDraft: [{ bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-6000) }],
    expected: [
      { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-6000) },
      { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(-6000) },
    ],
  },
  {
    tier: 'CHALLENGE',
    prompt: 'Goods sold at a profit — the classic Class XI Capital trap!',
    storyTxns: [
      {
        id: 'c1',
        narration: 'Opening Cash ₹80,000 and Stock ₹50,000 (Capital ₹1,30,000)',
        changes: [
          { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(80000) },
          { bucket: 'ASSETS', head: 'Stock', delta: Money.rupees(50000) },
          { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(130000) },
        ],
      },
      {
        id: 'c2',
        narration: 'Sold goods costing ₹30,000 for ₹42,000 cash',
        changes: [
          { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(42000) },
          { bucket: 'ASSETS', head: 'Stock', delta: Money.rupees(-30000) },
          { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(12000) },
        ],
      },
    ],
    challengePrompt: 'Fix the clerk’s faulty analysis below! Goods costing ₹30,000 were sold for ₹42,000 cash (clerk wrongly added ₹42,000 to Capital):',
    defaultDraft: [
      { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(42000) },
      { bucket: 'ASSETS', head: 'Stock', delta: Money.rupees(-30000) },
      { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(42000) },
    ],
    expected: [
      { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(42000) },
      { bucket: 'ASSETS', head: 'Stock', delta: Money.rupees(-30000) },
      { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(12000) },
    ],
  },
  {
    tier: 'MASTER',
    prompt: 'Audit a multi-head loan repayment with interest (Principal ₹15,000 + Interest ₹1,500 paid in cash).',
    storyTxns: [
      {
        id: 'm1',
        narration: 'Cash ₹90,000, Bank Loan ₹40,000, Capital ₹50,000',
        changes: [
          { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(90000) },
          { bucket: 'LIABILITIES', head: 'Bank Loan', delta: Money.rupees(40000) },
          { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(50000) },
        ],
      },
      {
        id: 'm2',
        narration: 'Repaid Bank Loan instalment ₹16,500 (Principal ₹15,000 + Interest ₹1,500)',
        changes: [
          { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-16500) },
          { bucket: 'LIABILITIES', head: 'Bank Loan', delta: Money.rupees(-15000) },
          { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(-1500) },
        ],
      },
    ],
    challengePrompt: 'Audit & repair: Paid ₹16,500 cash toward Bank Loan principal ₹15,000 and interest ₹1,500 (clerk deducted all ₹16,500 from Bank Loan):',
    defaultDraft: [
      { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-16500) },
      { bucket: 'LIABILITIES', head: 'Bank Loan', delta: Money.rupees(-16500) },
    ],
    expected: [
      { bucket: 'ASSETS', head: 'Cash', delta: Money.rupees(-16500) },
      { bucket: 'LIABILITIES', head: 'Bank Loan', delta: Money.rupees(-15000) },
      { bucket: 'CAPITAL', head: 'Capital', delta: Money.rupees(-1500) },
    ],
  },
];

const HEAD_OPTIONS: Record<EquationBucket, readonly string[]> = {
  ASSETS: ['Cash', 'Bank', 'Stock', 'Furniture', 'Machinery', 'Debtors', 'Prepaid Insurance'],
  LIABILITIES: ['Creditors', 'Bank Loan', 'Outstanding Rent'],
  CAPITAL: ['Capital'],
};

export function renderEquationLab(stage: HTMLElement, ctx: SimShellContext): void {
  let stepIdx = 1;
  let playing = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let whatIfPrice = 42000;
  let whatIfCredit = false;
  let draft: EquationLineChange[] = [];
  let feedbackNode: HTMLElement | null = null;
  let scaleHandle: BalanceHandle | null = null;

  const stopTimer = () => {
    playing = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
  ctx.addCleanup(() => {
    stopTimer();
    scaleHandle?.dispose();
  });

  const resetForTier = () => {
    stopTimer();
    const sc = SCENARIOS.find(s => s.tier === ctx.getDifficulty()) ?? SCENARIOS[0]!;
    stepIdx = sc.storyTxns.length;
    draft = sc.defaultDraft.map(d => ({ ...d }));
    feedbackNode = null;
  };
  resetForTier();
  ctx.onChange(() => {
    resetForTier();
    draw();
  });

  function draw() {
    scaleHandle?.dispose();
    scaleHandle = null;

    const sc = SCENARIOS.find(s => s.tier === ctx.getDifficulty()) ?? SCENARIOS[0]!;
    // Apply What-if overrides to build live step timeline
    const activeTxns: EquationTransaction[] = sc.storyTxns.map(tx => {
      if (tx.id === 's2' && whatIfCredit) {
        return {
          id: 's2-credit',
          narration: 'What-if: Bought Furniture ₹25,000 on CREDIT from WoodCraft',
          changes: [
            { bucket: 'ASSETS', head: 'Furniture', delta: Money.rupees(25000) },
            { bucket: 'LIABILITIES', head: 'Creditors', delta: Money.rupees(25000) },
          ],
        };
      }
      if (tx.id === 'c2') {
        const sale = Money.rupees(whatIfPrice);
        const cost = Money.rupees(30000);
        const diff = sale.sub(cost);
        return {
          id: 'c2-whatif',
          narration: `Sold goods costing ₹30,000 for ${R(sale)} cash (${diff.isNegative() ? 'Loss' : 'Profit'} ${R(diff.abs())})`,
          changes: [
            { bucket: 'ASSETS', head: 'Cash', delta: sale },
            { bucket: 'ASSETS', head: 'Stock', delta: cost.neg() },
            { bucket: 'CAPITAL', head: 'Capital', delta: diff },
          ],
        };
      }
      return tx;
    });

    const steps = runEquationSteps({ transactions: activeTxns.slice(0, Math.max(1, stepIdx)) });
    const cur = steps[steps.length - 1]!;
    const verdict = verifyEquationAnalysis(draft, sc.expected);

    const scaleHost = h('div', { class: 'simlab-3d-host', 'aria-hidden': 'true' });

    const headPills = (rec: Readonly<Record<string, Money>>) =>
      Object.entries(rec)
        .filter(([, m]) => !m.isZero())
        .map(([k, m]) => {
          const delta = cur.deltas.find(d => d.head === k)?.delta;
          return h(
            'div',
            { class: 'simlab-eq-item' + (delta ? (delta.isPositive() ? ' up' : ' down') : '') },
            h('span', {}, ctx.term(k)),
            h('strong', {}, R(m)),
            delta && h('small', { class: delta.isPositive() ? 'delta-up' : 'delta-down' }, `${delta.isPositive() ? '▲ +' : '▼ '}${R(delta)}`),
          );
        });

    const newBucketSel = h(
      'select',
      { 'aria-label': 'Equation bucket' },
      h('option', { value: 'ASSETS' }, ctx.term('Assets', 'परिसंपत्तियाँ')),
      h('option', { value: 'LIABILITIES' }, ctx.term('Liabilities', 'देयताएँ')),
      h('option', { value: 'CAPITAL' }, ctx.term('Capital', 'पूँजी')),
    ) as HTMLSelectElement;

    const newHeadSel = h('select', { 'aria-label': 'Account head' }) as HTMLSelectElement;
    const syncHeadOptions = () => {
      const b = (newBucketSel.value as EquationBucket) || 'ASSETS';
      mount(newHeadSel, ...HEAD_OPTIONS[b].map(hd => h('option', { value: hd }, ctx.term(hd))));
    };
    newBucketSel.addEventListener('change', syncHeadOptions);
    syncHeadOptions();

    const dirSel = h('select', { 'aria-label': 'Increase or decrease' }, h('option', { value: '1' }, '+ Increase (▲)'), h('option', { value: '-1' }, '− Decrease (▼)')) as HTMLSelectElement;

    const amtInput = h('input', {
      type: 'number',
      min: '1',
      step: '100',
      value: '25000',
      'aria-label': 'Amount in rupees',
    }) as HTMLInputElement;

    mount(
      stage,
      h(
        'div',
        { class: 'simlab-grid-2' },
        // Left: Live Visualiser + Playback + What-if
        h(
          'section',
          { class: 'panel simlab-card' },
          h('p', { class: 'eyebrow' }, 'Live Dual-Aspect Scale · Story Playback'),
          h('h3', {}, cur.narration),
          createPlaybackBar({
            totalSteps: activeTxns.length,
            currentStep: stepIdx,
            playing,
            onReset: () => {
              stopTimer();
              stepIdx = 1;
              draw();
            },
            onStepChange: next => {
              stopTimer();
              stepIdx = Math.max(1, next);
              draw();
            },
            onTogglePlay: () => {
              if (playing) {
                stopTimer();
                draw();
                return;
              }
              if (stepIdx >= activeTxns.length) stepIdx = 1;
              playing = true;
              draw();
              timer = setInterval(() => {
                if (stepIdx < activeTxns.length) {
                  stepIdx++;
                  draw();
                } else {
                  stopTimer();
                  draw();
                }
              }, 1100);
            },
          }),
          renderBalanceBeamSvg({
            leftLabel: ctx.term('Assets', 'परिसंपत्तियाँ'),
            leftAmount: R(cur.totalAssets),
            leftValue: Number(cur.totalAssets.paise),
            rightLabel: `${ctx.term('Liabilities', 'देयताएँ')} + ${ctx.term('Capital', 'पूँजी')}`,
            rightAmount: R(cur.rhsTotal),
            rightValue: Number(cur.rhsTotal.paise),
            balanced: cur.balanced,
          }),
          scaleHost,
          h(
            'div',
            { class: 'simlab-eq-columns' },
            h('div', { class: 'simlab-eq-col assets' }, h('h4', {}, `${ctx.term('Assets', 'परिसंपत्तियाँ')} = ${R(cur.totalAssets)}`), ...headPills(cur.assetHeads)),
            h(
              'div',
              { class: 'simlab-eq-col liab' },
              h('h4', {}, `${ctx.term('Liabilities', 'देयताएँ')} = ${R(cur.totalLiabilities)}`),
              ...(headPills(cur.liabilityHeads).length ? headPills(cur.liabilityHeads) : [h('p', { class: 'hint' }, '₹0.00 (No external liabilities)')]),
            ),
            h('div', { class: 'simlab-eq-col cap' }, h('h4', {}, `${ctx.term('Capital', 'पूँजी')} = ${R(cur.totalCapital)}`), ...headPills(cur.capitalHeads)),
          ),
          // What-if Controls
          h(
            'div',
            { class: 'simlab-whatif-box' },
            h('h4', {}, 'What-if Controls'),
            h(
              'label',
              { class: 'simlab-check-row' },
              h('input', {
                type: 'checkbox',
                checked: whatIfCredit,
                onchange: (e: Event) => {
                  whatIfCredit = (e.target as HTMLInputElement).checked;
                  draw();
                },
              }),
              ' What if furniture (₹25,000) is bought on credit instead of cash?',
            ),
            h(
              'label',
              { class: 'simlab-slider-row' },
              h('span', {}, `What-if Sale Price (Cost ₹30,000): ₹${whatIfPrice.toLocaleString('en-IN')}`),
              h('input', {
                type: 'range',
                min: '20000',
                max: '55000',
                step: '1000',
                value: String(whatIfPrice),
                oninput: (e: Event) => {
                  whatIfPrice = Number((e.target as HTMLInputElement).value);
                  draw();
                },
              }),
            ),
          ),
        ),

        // Right: Interactive Equation Builder & Detective
        h(
          'section',
          { class: 'panel simlab-card' },
          h('p', { class: 'eyebrow' }, 'Interactive Analysis Builder & Error Detector'),
          h('h3', {}, sc.challengePrompt),
          renderBalanceBeamSvg({
            leftLabel: 'Δ Assets',
            leftAmount: (verdict.assetDelta.isPositive() ? '+' : '') + R(verdict.assetDelta),
            leftValue: Math.abs(Number(verdict.assetDelta.paise)) + (verdict.balanced ? 100 : 500),
            rightLabel: 'Δ (Liabilities + Capital)',
            rightAmount: (verdict.liabilityDelta.add(verdict.capitalDelta).isPositive() ? '+' : '') + R(verdict.liabilityDelta.add(verdict.capitalDelta)),
            rightValue: Math.abs(Number(verdict.liabilityDelta.add(verdict.capitalDelta).paise)) + 100,
            balanced: verdict.balanced,
          }),
          h(
            'div',
            { class: 'simlab-draft-list', 'data-eq-draft': '' },
            ...draft.map((line, i) =>
              h(
                'div',
                { class: 'simlab-draft-row' },
                h('span', { class: 'badge-pill' }, line.bucket),
                h('strong', {}, ctx.term(line.head)),
                h('span', { class: line.delta.isPositive() ? 'delta-up' : 'delta-down' }, `${line.delta.isPositive() ? '+' : ''}${R(line.delta)}`),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'secondary simlab-mini-btn',
                    'aria-label': `Remove ${line.head} movement`,
                    onclick: () => {
                      draft.splice(i, 1);
                      draw();
                    },
                  },
                  'Remove',
                ),
              ),
            ),
          ),
          h(
            'div',
            { class: 'simlab-add-form' },
            newBucketSel,
            newHeadSel,
            dirSel,
            amtInput,
            h(
              'button',
              {
                type: 'button',
                class: 'secondary',
                'data-eq-add': '',
                onclick: () => {
                  const raw = Number(amtInput.value);
                  if (!Number.isFinite(raw) || raw <= 0) return;
                  const sign = dirSel.value === '-1' ? -1 : 1;
                  draft.push({
                    bucket: newBucketSel.value as EquationBucket,
                    head: newHeadSel.value,
                    delta: Money.rupees(Math.round(raw) * sign),
                  });
                  draw();
                },
              },
              '+ Add movement',
            ),
          ),
          h(
            'div',
            { class: 'simlab-action-row' },
            h(
              'button',
              {
                type: 'button',
                'data-eq-verify': '',
                onclick: () => {
                  const v = verifyEquationAnalysis(draft, sc.expected);
                  if (v.matchesExpected) {
                    feedbackNode = h(
                      'div',
                      { class: 'note good' },
                      `✓ Exact dual-aspect match! ΔAssets (${R(v.assetDelta)}) = ΔLiabilities (${R(v.liabilityDelta)}) + ΔCapital (${R(v.capitalDelta)}).`,
                    );
                    void ctx.completeMission(`Equation verified: ΔAssets ${R(v.assetDelta)} = Δ(L+C) ${R(v.liabilityDelta.add(v.capitalDelta))}.`);
                  } else {
                    feedbackNode = h(
                      'div',
                      { class: 'note bad' },
                      h('b', {}, v.balanced ? 'Balanced, yet wrong account head:' : 'Equation out of balance:'),
                      h('ul', {}, ...v.issues.map(msg => h('li', {}, msg))),
                    );
                  }
                  draw();
                },
              },
              'Verify Equation Analysis',
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'secondary',
                'data-eq-model': '',
                onclick: () => {
                  draft = sc.expected.map(x => ({ ...x }));
                  draw();
                },
              },
              'Load Model Analysis',
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'secondary',
                onclick: () => {
                  resetForTier();
                  draw();
                },
              },
              'Reset Card',
            ),
          ),
          feedbackNode,
          h(
            'details',
            { class: 'simlab-rules-ref' },
            h('summary', {}, 'Golden & Modern Rules of Debit and Credit (XI.2.rules)'),
            h(
              'div',
              { class: 'simtable-wrap' },
              h(
                'table',
                { class: 'simtable' },
                h('thead', {}, h('tr', {}, h('th', {}, 'Account Type'), h('th', {}, 'Increase (▲)'), h('th', {}, 'Decrease (▼)'))),
                h(
                  'tbody',
                  {},
                  h('tr', {}, h('td', {}, ctx.term('Assets')), h('td', {}, 'Debit (Dr.)'), h('td', {}, 'Credit (Cr.)')),
                  h('tr', {}, h('td', {}, ctx.term('Expenses / Losses')), h('td', {}, 'Debit (Dr.)'), h('td', {}, 'Credit (Cr.)')),
                  h('tr', {}, h('td', {}, ctx.term('Drawings')), h('td', {}, 'Debit (Dr.)'), h('td', {}, 'Credit (Cr.)')),
                  h('tr', {}, h('td', {}, ctx.term('Liabilities')), h('td', {}, 'Credit (Cr.)'), h('td', {}, 'Debit (Dr.)')),
                  h('tr', {}, h('td', {}, ctx.term('Capital')), h('td', {}, 'Credit (Cr.)'), h('td', {}, 'Debit (Dr.)')),
                  h('tr', {}, h('td', {}, ctx.term('Revenues / Gains')), h('td', {}, 'Credit (Cr.)'), h('td', {}, 'Debit (Dr.)')),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    if (typeof window !== 'undefined' && 'WebGLRenderingContext' in window) {
      scaleHandle = mountBalanceScale(scaleHost, {
        assets: Number(cur.totalAssets.paise) / 100,
        rhs: Number(cur.rhsTotal.paise) / 100,
        balanced: cur.balanced,
        assetsLabel: R(cur.totalAssets),
        rhsLabel: R(cur.rhsTotal),
      });
    }
  }

  draw();
}
