import { describe, expect, it } from 'vitest';
import { EN, HI, HINDI_REVIEWED, t } from '../src/i18n';

const DEVANAGARI = /[ऀ-ॿ]/;
describe('V1 UI string catalogue (T0.4)', () => {
  it('English and Hindi have exactly the same keys', () => { expect(Object.keys(HI).sort()).toEqual(Object.keys(EN).sort()); });
  it('every Hindi string contains Devanagari (except the switch back to English)', () => {
    for (const [k, v] of Object.entries(HI)) if (k !== 'lang.toggle') expect(v, k).toMatch(DEVANAGARI);
  });
  it('placeholders match between languages, and t() fills them', () => {
    for (const k of Object.keys(EN) as (keyof typeof EN)[]) expect((HI[k].match(/\{\w+\}/g) ?? []).sort(), k).toEqual((EN[k].match(/\{\w+\}/g) ?? []).sort());
    expect(t('en', 'practice.scored', { marks: 2, outOf: 3 })).toBe('You scored 2 / 3.');
    expect(t('hi', 'practice.scored', { marks: 2, outOf: 3 })).toBe('आपके अंक 2 / 3।');
  });
  it('Hindi stays labelled as an unreviewed draft until a reviewer signs it off (D10)', () => { expect(HINDI_REVIEWED).toBe(false); });
});
