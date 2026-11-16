import type { Lab } from './spec';

/** Share-link and session persistence for lab inputs. Pure except for the two storage helpers, which never throw. */
const MAX_LEN = 2000;

export function encodeValues(lab: Lab, values: Record<string, string>): string {
  const diff: Record<string, string> = {};
  for (const f of lab.fields) { const v = values[f.id] ?? ''; if (v !== (lab.example[f.id] ?? '')) diff[f.id] = v; }
  const bytes = new TextEncoder().encode(JSON.stringify(diff));
  let bin = ''; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Returns the full value set (example + shared changes), or undefined if the payload is not valid. Unknown fields are ignored. */
export function decodeValues(lab: Lab, payload: string | undefined): Record<string, string> | undefined {
  if (!payload || payload.length > 8000 || !/^[A-Za-z0-9_-]+$/.test(payload)) return undefined;
  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/'), bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const obj: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return undefined;
    const out: Record<string, string> = { ...lab.example };
    for (const f of lab.fields) { const v = (obj as Record<string, unknown>)[f.id]; if (typeof v === 'string' && v.length <= MAX_LEN) out[f.id] = v; }
    return out;
  } catch { return undefined; }
}

const key = (lab: Lab) => `au.lab.${lab.id}`;
export function loadSaved(lab: Lab): Record<string, string> | undefined {
  try { const raw = sessionStorage.getItem(key(lab)); return raw ? decodeValues(lab, raw) : undefined; } catch { return undefined; }
}
export function save(lab: Lab, values: Record<string, string>): void { try { sessionStorage.setItem(key(lab), encodeValues(lab, values)); } catch { /* storage unavailable: the lab still works */ } }
export const shareUrl = (lab: Lab, values: Record<string, string>): string => `${location.origin}${location.pathname}#/lab/${lab.id}/${encodeValues(lab, values)}`;
