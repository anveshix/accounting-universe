import { describe, expect, it } from 'vitest';
import { ALL_LABS } from '../../../apps/web/src/labs';
import { decodeValues, encodeValues } from '../../../apps/web/src/labstate';

describe('lab share-link encoding', () => {
  it('round-trips changed values for every lab, including unicode', () => {
    for (const lab of ALL_LABS) {
      const v = { ...lab.example, [lab.fields[0]!.id]: '₹ 1,23,456 ज्ञान' };
      expect(decodeValues(lab, encodeValues(lab, v)), lab.id).toEqual(v);
    }
  });
  it('an unchanged lab encodes to a tiny payload', () => {
    const lab = ALL_LABS[0]!;
    expect(encodeValues(lab, { ...lab.example }).length).toBeLessThan(10);
  });
  it('rejects garbage, oversize and non-object payloads, and ignores unknown fields', () => {
    const lab = ALL_LABS[0]!;
    for (const bad of [undefined, '', '***', 'A'.repeat(9000), btoa('[1,2]').replace(/=+$/, ''), btoa('not json')]) expect(decodeValues(lab, bad), String(bad)).toBeUndefined();
    const evil = btoa(JSON.stringify({ __proto__: 'x', zzz: '1', [lab.fields[0]!.id]: 5 })).replace(/=+$/, '');
    expect(decodeValues(lab, evil)).toEqual({ ...lab.example });
  });
});
