/**
 * The two places spaced review shows up:
 *   • Today   (home page)  — what is due, your streak, one obvious next action.
 *   • Review  (progress)   — the queue itself, with the coming week.
 *
 * Pure view code: every number arrives from `review.ts` / `rewards.ts`; nothing is stored here. Inspired by the review
 * queues of Anki (ts-fsrs, MIT) and Duolingo's daily loop, scaled down to one honest panel each.
 */
import { clauseById, dueReviews, relativeDay, reviewSummary, skillTitle, upcomingReviews, type Attempt, type ClassLevel, type Rewards } from '../../../packages/curriculum/src';
import { h } from './dom';
import { icon } from './icons';

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function todayPanel(a: readonly Attempt[], r: Rewards, now: number, cls: ClassLevel): HTMLElement {
  const s = reviewSummary(a, now);
  const nextSkillId = s.first?.skill;
  const lead = nextSkillId ? skillTitle(nextSkillId) : null;
  const cta = h('a', { class: 'button primary', href: nextSkillId ? `#/practice/${encodeURIComponent(nextSkillId)}` : '#/practice' }, nextSkillId ? `Review “${lead}” →` : 'Start practising →');
  return h(
    'section',
    { class: 'panel today', 'aria-labelledby': 'today-h', 'data-today': '' },
    h(
      'div',
      { class: 'today-head' },
      h('h3', { id: 'today-h', class: 'flush-top' }, 'Today'),
      h('span', { class: 'chip today-streak' + (r.streak ? ' on' : '') }, icon('flame', 14), r.streak ? `${r.streak} day streak` : 'no streak yet'),
    ),
    h(
      'div',
      { class: 'today-stats' },
      h('div', { class: 'today-stat' + (s.due ? ' hot' : '') }, h('b', {}, String(s.due)), h('span', {}, s.due === 1 ? 'skill to review' : 'skills to review')),
      h('div', { class: 'today-stat' }, h('b', {}, String(s.scheduled)), h('span', {}, 'scheduled ahead')),
      h('div', { class: 'today-stat' }, h('b', {}, `${r.today} XP`), h('span', {}, r.goalMet ? 'daily goal met' : 'of your daily goal')),
    ),
    h(
      'p',
      { class: 'lead' },
      s.due
        ? `Your memory for ${s.due === 1 ? 'this skill' : 'these skills'} is due for a refresh. Ten minutes now beats an hour the night before the exam.`
        : a.length
          ? `Nothing is due right now. The next review comes back ${nextDueLabel(a, now)}; until then, new practice is the best use of your time.`
          : 'Answer your first question and this panel starts scheduling your revision: one day, then six, then further apart each time you get it right.',
    ),
    h('div', { class: 'actions' }, cta, h('a', { class: 'button', href: '#/progress' }, 'See the full queue'), h('a', { class: 'button ghost', href: `#/class/${cls}` }, `Class ${cls} map`)),
    h('p', { class: 'hint' }, 'Spaced review uses the same exact answers you already gave — nothing extra is saved, and it works offline.'),
  );
}

function nextDueLabel(a: readonly Attempt[], now: number): string {
  const upcoming = upcomingReviews(a, now, 8).find(d => d.cards.length > 0);
  return upcoming ? relativeDay(upcoming.at, now) : 'when you practise again';
}

export function reviewPanel(a: readonly Attempt[], now: number): HTMLElement {
  const due = dueReviews(a, now);
  const week = upcomingReviews(a, now, 7);
  const weekTotal = week.reduce((n, d) => n + d.cards.length, 0);
  const max = Math.max(1, ...week.map(d => d.cards.length));
  return h(
    'section',
    { class: 'panel review', 'aria-labelledby': 'review-h', 'data-review': '' },
    h('h3', { id: 'review-h' }, 'What to review'),
    a.length === 0
      ? h('p', { class: 'empty' }, 'Practise anything once and it appears here, then comes back when it is due — just before you would forget it.')
      : due.length === 0
        ? h('p', { class: 'note good' }, `Nothing due right now. ${weekTotal ? `${weekTotal} review${weekTotal === 1 ? '' : 's'} coming up this week.` : 'Practise a new skill to add one.'}`)
        : h(
            'ul',
            { class: 'reviewlist' },
            ...due
              .slice(0, 6)
              .map(c =>
                h(
                  'li',
                  { 'data-review-skill': c.skill },
                  h(
                    'div',
                    { class: 'review-what' },
                    h('b', {}, skillTitle(c.skill)),
                    h('span', { class: 'hint' }, `${clauseById(c.clause)?.title ?? c.clause} · last score ${pct(c.lastScore)}${c.lapses ? ` · lapsed ${c.lapses}×` : ''}`),
                  ),
                  h('span', { class: 'review-when' + (c.dueAt < now - 2 * 86_400_000 ? ' late' : '') }, relativeDay(c.dueAt, now)),
                  h('a', { class: 'button small', href: `#/practice/${encodeURIComponent(c.skill)}`, 'aria-label': `Practise ${skillTitle(c.skill)}` }, 'Practise'),
                ),
              ),
          ),
    due.length > 6 ? h('p', { class: 'hint' }, `…and ${due.length - 6} more due. Start with the ones above; the oldest is first.`) : null,
    h('h4', {}, 'Coming up'),
    h(
      'div',
      { class: 'upcoming', role: 'img', 'aria-label': `Reviews due each day this week: ${week.map(d => d.cards.length).join(', ')}` },
      ...week.map((d, i) =>
        h(
          'div',
          { class: 'up-day', title: `${new Date(d.at).toDateString()}: ${d.cards.length} due` },
          h('i', {
            class: `up-bar l${d.cards.length ? Math.max(1, Math.ceil((4 * d.cards.length) / max)) : 0}`,
            style: `--h:${d.cards.length ? Math.max(8, Math.round((100 * d.cards.length) / max)) : 0}%`,
          }),
          h('span', {}, i === 0 ? 'today' : new Date(d.at).toLocaleDateString(undefined, { weekday: 'short' })),
        ),
      ),
    ),
    h('p', { class: 'hint' }, 'Intervals grow 1 day → 6 days → about three weeks → … each time you answer well; a wrong answer brings the skill back tomorrow.'),
  );
}
