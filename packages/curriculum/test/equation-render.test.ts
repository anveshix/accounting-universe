/// <reference lib="dom" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderBlock } from '../../../apps/web/src/render';

// Minimal DOM for verifying the renderer's text and which visual it chooses.
class NodeStub {
  children: NodeStub[] = [];
  className = '';
  attrs: Record<string, string> = {};
  constructor(readonly tag: string, readonly content = '') {}
  appendChild(child: NodeStub) { this.children.push(child); return child; }
  setAttribute(key: string, value: string) { this.attrs[key] = value; }
  get textContent(): string { return this.content + this.children.map(c => c.textContent).join(''); }
}
const doc = {
  createElement: (tag: string) => new NodeStub(tag),
  createElementNS: (_ns: string, tag: string) => new NodeStub(tag),
  createTextNode: (text: string) => new NodeStub('#text', text),
};
afterEach(() => vi.unstubAllGlobals());

describe('signed accounting equation rendering', () => {
  it('does not hide a negative capital or draw a misleading all-positive tank', () => {
    vi.stubGlobal('document', doc);
    const result = renderBlock({ kind: 'equation', assets: [{ label: 'Cash', value: 40, text: '₹40.00' }], rhs: [{ label: 'Bank loan', value: 100, text: '₹100.00' }, { label: 'Capital', value: -60, text: '-₹60.00' }], balanced: true }) as unknown as NodeStub;
    expect(result.className).toContain('equation-signed');
    expect(result.textContent).toContain('-₹60.00');
    expect(result.textContent).toContain('tank chart is hidden');
    expect(result.attrs['aria-label']).toBe('Assets equal capital plus liabilities');
  });
  it('does not call a negative-only position empty', () => {
    vi.stubGlobal('document', doc);
    const result = renderBlock({ kind: 'equation', assets: [{ label: 'Bank', value: -50, text: '-₹50.00' }], rhs: [{ label: 'Capital', value: -50, text: '-₹50.00' }], balanced: true }) as unknown as NodeStub;
    expect(result.className).toContain('equation-signed');
    expect(result.textContent).toContain('-₹50.00');
    expect(result.textContent).not.toContain('All displayed balances are ₹0');
  });
  it('retains the visual tank for non-negative amounts', () => {
    vi.stubGlobal('document', doc);
    const result = renderBlock({ kind: 'equation', assets: [{ label: 'Cash', value: 100, text: '₹100.00' }], rhs: [{ label: 'Capital', value: 100, text: '₹100.00' }], balanced: true }) as unknown as NodeStub;
    expect(result.className).toContain('equation');
    expect(result.className).not.toContain('equation-signed');
    expect(result.textContent).toContain('₹100.00');
  });
});
