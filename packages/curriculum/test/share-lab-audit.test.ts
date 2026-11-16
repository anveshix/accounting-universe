import { describe, expect, it } from 'vitest';
import { shares } from '../../../apps/web/src/labs/company';
import type { Block } from '../../../apps/web/src/spec';

const table = (blocks: Block[]) => blocks.find((b): b is Extract<Block, { kind: 'table' }> => b.kind === 'table' && b.caption === 'Share capital in the balance sheet (note)');
const warning = (blocks: Block[]) => blocks.some(b => b.kind === 'note' && b.text.includes('share-capital note cannot be prepared'));

describe('share lab reconciliation', () => {
  it('refuses impossible arrears and forfeiting more than allotted', () => {
    expect(() => shares.compute({ ...shares.example, arrCall: '999999999', fShares: '0', reShares: '0' })).toThrow(/arrears cannot exceed/i);
    expect(() => shares.compute({ ...shares.example, fShares: '100001', reShares: '0' })).toThrow(/cannot exceed shares allotted/i);
  });
  it('withholds a disclosure when remaining arrears lack a capital/premium breakdown', () => {
    const blocks = shares.compute({ ...shares.example, fShares: '0', reShares: '0' });
    expect(table(blocks)).toBeUndefined();
    expect(warning(blocks)).toBe(true);
  });
  it('discloses the actual subscribed total for a fully paid undersubscribed issue', () => {
    const blocks = shares.compute({ ...shares.example, offered: '100', pro: '80', rej: '0', arrCall: '0', arrAllot: '0', fShares: '0', reShares: '0' });
    const t = table(blocks)!;
    expect(t.rows).toContainEqual(['Issued capital', '₹1,000.00']);
    expect(t.rows).toContainEqual(['Subscribed and fully paid up', '₹800.00']);
    expect(t.foot).toEqual(['Total', '₹800.00']);
  });
  it('shows a correct note when all arrears are cleared by forfeiture and some shares are reissued', () => {
    const blocks = shares.compute({ ...shares.example });
    const t = table(blocks)!;
    expect(t.rows).toContainEqual(['Subscribed and fully paid up', '₹9,95,000.00']);
    expect(t.rows).toContainEqual(['Add: forfeited shares (amount received)', '₹4,000.00']);
    expect(t.foot).toEqual(['Total', '₹9,99,000.00']);
    expect(warning(blocks)).toBe(false);
  });
  it('refuses receipts inconsistent with the instalment arrears', () => {
    const partial = shares.compute({ ...shares.example, rCa: '750' });
    expect(warning(partial)).toBe(true); // ₹750 arrears remain on other shares
    expect(() => shares.compute({ ...shares.example, rCa: '0', arrCall: '4000' })).toThrow(/unpaid call on forfeited shares/i);
    expect(() => shares.compute({ ...shares.example, rApp: '0' })).toThrow(/application money on allotted shares/i);
  });
  it('refuses a partial reissue when aggregate receipts cannot determine a uniform amount per share in paise', () => {
    expect(() => shares.compute({ ...shares.example, rAl: '5999.99', arrAllot: '1500.01' })).toThrow(/not an exact paisa/i);
  });
});
