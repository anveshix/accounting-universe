/** Accounting Error Detective (#/detective, #/detective/<seed>): classify the error, say whether the trial balance agrees, pass the rectifying entry. */
import { DETECTIVE_CLASSES, buildCase, detectiveAccountChoices } from '../../../../packages/curriculum/src';
import { h, mount } from '../dom';
import { recordAttempt, recordSeen } from '../store';
import { announce } from '../ui';

export function detectivePage(seedArg?: string): HTMLElement {
  const root = h('div', { class: 'detective', 'data-detective': '' });
  let seed = seedArg && /^\d{1,9}$/.test(seedArg) ? Number(seedArg) : 1 + Math.floor(Math.random() * 99999),
    solved = 0;
  void recordSeen({ lab: 'xi-detective', tab: 'try', t: Date.now() });
  const accounts = detectiveAccountChoices();
  const opts = (sel: HTMLSelectElement) => {
    sel.append(h('option', { value: '' }, '— choose —'), ...accounts.map(a => h('option', { value: a }, a)));
    return sel;
  };

  function draw() {
    const c = buildCase(seed);
    const cls = h('select', { id: 'dc-class' }, h('option', { value: '' }, '— choose —'), ...DETECTIVE_CLASSES.map(x => h('option', { value: x.id }, x.label)));
    const tb = h(
      'select',
      { id: 'dc-tb' },
      h('option', { value: '' }, '— choose —'),
      h('option', { value: 'yes' }, 'Yes, the trial balance still agrees'),
      h('option', { value: 'no' }, 'No, the trial balance will not agree'),
    );
    const dr = opts(h('select', { id: 'dc-dr' })),
      cr = opts(h('select', { id: 'dc-cr' }));
    const out = h('div', { 'aria-live': 'polite', 'data-result': '' });
    const submit = h('button', { type: 'submit', class: 'primary' }, 'Solve the case');
    const again = h(
      'button',
      {
        type: 'button',
        class: 'secondary',
        hidden: true,
        'data-next-case': '',
        onclick: () => {
          seed = 1 + Math.floor(Math.random() * 99999);
          draw();
        },
      },
      'Next case',
    );
    const form = h(
      'form',
      {
        onsubmit: (e: Event) => {
          e.preventDefault();
          check();
        },
      },
      h('div', { class: 'field' }, h('label', { for: 'dc-class' }, '1. What kind of error is it?'), cls),
      h('div', { class: 'field' }, h('label', { for: 'dc-tb' }, '2. Does the trial balance still agree?'), tb),
      c.rectification
        ? h(
            'fieldset',
            { class: 'field' },
            h('legend', {}, '3. Rectifying entry'),
            h('div', { class: 'field' }, h('label', { for: 'dc-dr' }, 'Debit'), dr),
            h('div', { class: 'field' }, h('label', { for: 'dc-cr' }, 'Credit'), cr),
          )
        : h('p', { class: 'hint' }, 'This one needs several corrections, so only steps 1 and 2 are asked.'),
      h('div', { class: 'actions' }, submit, again),
    );
    function check() {
      if (!cls.value || !tb.value || (c.rectification && (!dr.value || !cr.value))) {
        mount(out, h('p', { class: 'note warn', role: 'alert' }, 'Answer every step before you solve the case.'));
        return;
      }
      const r1 = cls.value === c.cls,
        r2 = (tb.value === 'yes') === !c.affectsTb;
      const r3 = !c.rectification || (dr.value === c.rectification.dr && cr.value === c.rectification.cr);
      const parts = c.rectification ? 3 : 2,
        correct = +r1 + +r2 + (c.rectification ? +r3 : 0),
        mistakes: string[] = [];
      const label = DETECTIVE_CLASSES.find(x => x.id === c.cls)!;
      if (!r1) mistakes.push(`Called it "${DETECTIVE_CLASSES.find(x => x.id === cls.value)!.label}" instead of "${label.label}"`);
      if (!r2)
        mistakes.push(c.affectsTb ? 'Thought the trial balance would agree, but one-sided errors break it' : 'Thought the trial balance would not agree, but two-sided errors leave it agreeing');
      if (!r3) mistakes.push(`Rectifying entry should be Dr ${c.rectification!.dr}, Cr ${c.rectification!.cr}`);
      void recordAttempt({
        t: Date.now(),
        skill: 'error-detective',
        clause: 'XI.2.errors',
        seed,
        mode: 'PRACTICE',
        marks: correct,
        outOf: parts,
        hintsUsed: 0,
        mistakes,
        correctParts: correct,
        parts,
      });
      for (const el of [cls, tb, dr, cr]) el.disabled = true;
      submit.disabled = true;
      again.hidden = false;
      if (correct === parts) solved++;
      form.setAttribute('data-state', correct === parts ? 'SOLVED' : 'REVIEW');
      mount(
        out,
        h('p', { class: 'note ' + (correct === parts ? 'good' : 'bad'), role: 'status' }, correct === parts ? '✓ Case solved.' : `${correct} of ${parts} steps right.`),
        h(
          'ul',
          {},
          h('li', {}, h('b', {}, label.label), ' — ', label.clue),
          h('li', {}, c.explain),
          ...(c.rectification ? [h('li', {}, `Rectifying entry: Dr ${c.rectification.dr} ${c.rectification.amount.format()}; Cr ${c.rectification.cr} ${c.rectification.amount.format()}.`)] : []),
        ),
        mistakes.length ? h('p', { class: 'hint' }, 'What to fix: ' + mistakes.join('; ') + '.') : null,
      );
      announce(correct === parts ? 'Case solved' : 'Not quite');
    }
    mount(
      root,
      h(
        'header',
        { class: 'labhead' },
        h('p', { class: 'eyebrow' }, 'Class XI · Errors, rectification and suspense account'),
        h('h2', {}, 'Accounting Error Detective'),
        h('p', { class: 'lead' }, 'A transaction was recorded wrongly. Find the kind of error, decide whether the trial balance will notice, and pass the entry that fixes it.'),
      ),
      h(
        'section',
        { class: 'panel' },
        h('p', { class: 'eyebrow' }, `Case solved so far: ${solved}`),
        h('p', { class: 'stem' }, c.story),
        h('p', { class: 'stem' }, h('b', {}, 'What went wrong: '), c.wrongNote),
        form,
        out,
      ),
      h('p', { class: 'hint' }, 'Related: the ', h('a', { href: '#/crisis' }, 'Trial Balance Crisis'), ' hunts one error through a whole ledger.'),
    );
  }
  draw();
  return root;
}
