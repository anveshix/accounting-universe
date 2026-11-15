import { EN, type Key } from './en';
import { HI } from './hi';
export { EN, HI, type Key };
export { HINDI_REVIEWED, TERM_HI, TYPE_HI, accountHi, hasAccountHi } from './glossary-hi';
/** Look up a V1 UI string; `{name}` placeholders are filled from `vars`. */
export function t(lang: 'en' | 'hi', key: Key, vars: Record<string, string | number> = {}): string {
  return (lang === 'hi' ? HI[key] : EN[key]).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
