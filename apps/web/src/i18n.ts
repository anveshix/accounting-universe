import { h } from './dom';
import { HINDI_REVIEWED, t } from '../../../packages/curriculum/src/i18n';

/** Shown wherever Hindi text appears. Hindi is a DRAFT until a qualified reviewer signs it off (handoff decision D10). */
export function hindiDraftNote(): HTMLElement {
  return h('p', { class: 'note draft-hi', lang: 'hi', 'data-hindi-draft': HINDI_REVIEWED ? 'reviewed' : 'draft' },
    HINDI_REVIEWED ? null : h('b', {}, t('hi', 'draft.title')), HINDI_REVIEWED ? null : h('span', { lang: 'en' }, t('en', 'draft.body')));
}
