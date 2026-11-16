import { Machine } from '../../../../packages/engine/src';
import { TRAINER_ROUND } from '../../../../packages/curriculum/src';
import { migratedTrainerScenes } from '../../../../packages/curriculum/src/questions-v1';
import { trainerFeedback, trainerSample, type TrainerItem } from '../../../../packages/curriculum/src/trainer';
import { onDispose, track, unregister } from '../machine-dom';
import { starterChartClassXI, type Side } from '../../../../packages/engine/src';
import { h, mount } from '../dom';
import { recordAttempt, recordSeen } from '../store';
import { announce } from '../ui';
import { TYPE_WORD, ruleText } from '../rules';
import { TRAINER_EXAMPLES } from '../trainer-examples';

export function trainerPage(): HTMLElement {
  const chart = starterChartClassXI();
  // pool = the 15 hand-written items + verified legacy scenes whose accounts exist in this chart; each round is 15 random items
  const pool: TrainerItem[] = [...TRAINER_EXAMPLES, ...migratedTrainerScenes(chart.list()).filter(m => !TRAINER_EXAMPLES.some(q => q.text === m.text))];
  const draw15 = () => trainerSample(pool, 15);
  const order = draw15();
  let i = 0, score = 0, review = false;
  let missed: TrainerItem[] = [];
  const root = h('div', { class: 'trainer' });
  const tm = new Machine(TRAINER_ROUND, { hasBoth: false });          // ASKING → ANSWERED → (ASKING | COMPLETE)
  track(root, tm); onDispose(() => unregister(tm));
  void recordSeen({ lab: 'xi-trainer', tab: 'learn', t: Date.now() });
  const opts = (sel: HTMLSelectElement) => { sel.append(h('option', { value: '' }, '— choose —'), ...chart.list().map(a => h('option', { value: a.id }, `${a.name} (${TYPE_WORD[a.type]})`))); return sel; };

  function draw() {
    if (i >= order.length) {
      const begin = (questions: TrainerItem[], reviewing: boolean) => {
        if (!tm.send('AGAIN').ok) return;
        order.splice(0, order.length, ...questions); i = 0; score = 0; missed = []; review = reviewing; draw();
      };
      mount(root, head(), h('section', { class: 'panel' }, h('h3', {}, review ? 'Review complete' : 'Round complete'), h('p', { class: 'lead' }, `You got ${score} of ${order.length} fully right.`), h('p', {}, missed.length ? 'Review the same transactions you missed, or start a new round.' : 'Try another round or post your own entries in the Ledger lab.'),
        h('div', { class: 'actions' }, ...(missed.length ? [h('button', { type: 'button', class: 'primary', onclick: () => begin([...missed], true) }, `Retry missed (${missed.length})`)] : []), h('button', { type: 'button', onclick: () => begin(draw15(), false) }, 'Play again'), h('a', { class: 'button', href: '#/ledger' }, 'Open the Ledger lab'))));
      return;
    }
    const q = order[i]!;
    const dr = opts(h('select', { id: 'dr' })), cr = opts(h('select', { id: 'cr' }));
    const out = h('div', { 'aria-live': 'polite' }), next = h('button', { type: 'button', class: 'primary', hidden: true, onclick: () => { tm.send(i + 1 >= order.length ? 'FINISH' : 'NEXT'); i++; draw(); } }, i + 1 === order.length ? 'Finish' : 'Next →');
    const submit = h('button', { type: 'submit', class: 'primary' }, 'Check');
    const check = () => {
      // Ignore duplicate programmatic submissions without erasing the explanation.
      if (!tm.is('ASKING')) return;
      tm.ctx.hasBoth = !!(dr.value && cr.value);
      const sent = tm.send('ANSWER');                                    // refused: nothing chosen yet, or already answered
      if (!sent.ok) { mount(out, h('p', { class: 'note warn', role: 'alert' }, sent.reason!)); return; }
      const okDr = dr.value === q.dr, okCr = cr.value === q.cr, ok = okDr && okCr;
      if (ok) score++; else missed.push(q);
      const mistakes: string[] = [];
      if (!okDr) mistakes.push(`Debited ${chart.get(dr.value).name} instead of ${chart.get(q.dr).name}`);
      if (!okCr) mistakes.push(`Credited ${chart.get(cr.value).name} instead of ${chart.get(q.cr).name}`);
      void recordAttempt({ t: Date.now(), skill: 'rules-trainer', clause: 'XI.2.rules', seed: pool.indexOf(q) + 1, mode: 'BEGINNER', marks: ok ? 1 : 0, outOf: 1, hintsUsed: 0, mistakes: ok ? [] : [mistakes.join('; ')], correctParts: Number(okDr) + Number(okCr), parts: 2 });
      void recordSeen({ lab: 'xi-trainer', tab: 'example', t: Date.now() });
      dr.disabled = true; cr.disabled = true; submit.disabled = true; next.hidden = false;
      mount(out, h('p', { class: 'note ' + (ok ? 'good' : 'bad'), role: 'status' }, ok ? '✓ Correct.' : `Not quite. ${mistakes.join('. ')}.`), h('ul', {}, h('li', {}, trainerFeedback(chart, q, dr.value, 'DR')), h('li', {}, trainerFeedback(chart, q, cr.value, 'CR')), h('li', {}, ruleText(chart, q.dr, 'DR' as Side)), h('li', {}, ruleText(chart, q.cr, 'CR' as Side))), h('p', { class: 'hint' }, q.why));
      announce(ok ? 'Correct' : 'Not quite');
    };
    mount(root, head(), h('section', { class: 'panel' }, h('p', { class: 'eyebrow' }, `${review ? 'Review · ' : ''}Question ${i + 1} of ${order.length} · score ${score}`), h('p', { class: 'stem' }, q.text),
      h('form', { onsubmit: (e: Event) => { e.preventDefault(); check(); } }, h('div', { class: 'field' }, h('label', { for: 'dr' }, 'Debit (Dr.)'), dr), h('div', { class: 'field' }, h('label', { for: 'cr' }, 'Credit (Cr.)'), cr), h('div', { class: 'actions' }, submit, next)), out));
  }
  const head = () => h('header', { class: 'labhead' }, h('p', { class: 'eyebrow' }, 'Class XI'), h('h2', {}, 'Debit & Credit Trainer'), h('p', { class: 'lead' }, 'For each transaction choose the account to debit and the account to credit. After you answer you see the rule that decides it.'),
    h('p', { class: 'hint' }, 'Each question asks for one debit and one credit. Purchases means goods bought for resale; sales use the periodic method. You can retry missed transactions after each round.'),
    h('p', { class: 'hint' }, 'Rule of thumb: assets and expenses (and drawings) increase on the DEBIT side; liabilities, capital and income increase on the CREDIT side. Decreases are the opposite.'));
  draw();
  return root;
}
