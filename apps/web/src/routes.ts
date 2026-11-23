/**
 * The single source of truth for navigation. Pure (no DOM): the router renders from it, the header highlights from it,
 * tests and docs read it. Adding a page = one row here + one factory in main.ts.
 */
export type RouteId = 'home' | 'class' | 'labs' | 'lab' | 'sims' | 'sim' | 'build' | 'ledger' | 'practice' | 'cards' | 'trainer' | 'crisis' | 'study' | 'paper' | 'about' | 'cas' | 'project' | 'rescue' | 'assignment' | 'tutor' | 'progress' | 'teacher' | 'notes' | 'notfound';
export type NavKey = 'Home' | 'Class XI' | 'Class XII' | 'Visual labs' | 'Practice' | 'Help' | 'Notes' | 'My progress' | 'Teacher dashboard';
export const NAV: readonly { key: NavKey; hash: string }[] = [
  { key: 'Home', hash: '#/' }, { key: 'Class XI', hash: '#/class/XI' }, { key: 'Class XII', hash: '#/class/XII' }, { key: 'Visual labs', hash: '#/labs' },
  { key: 'Practice', hash: '#/practice' }, { key: 'Notes', hash: '#/notes' }, { key: 'Help', hash: '#/tutor' }, { key: 'My progress', hash: '#/progress' }, { key: 'Teacher dashboard', hash: '#/teacher' },
];
/** first path segment → route + the nav item it lives under. `valid` checks the remaining segments structurally. */
const ROUTES: readonly { head: string; id: RouteId; nav: NavKey; valid?: (rest: string[]) => boolean }[] = [
  { head: 'class', id: 'class', nav: 'Class XI', valid: r => r[0] === 'XI' || r[0] === 'XII' },
  // study guide: #/study (my class), #/study/XI, #/study/XII, #/study/<topic id such as XI.2.journal>; it lives under the nav item of its class
  // practice paper: #/paper (set-up), #/paper/XII/I/<seed> (Class XII, Option I), #/paper/XII/II/<seed>, #/paper/XI/<seed>
  { head: 'paper', id: 'paper', nav: 'Practice', valid: r => r.length === 0 || (r[0] === 'XI' && r.length === 2 && /^\d{1,9}$/.test(r[1]!)) || (r[0] === 'XII' && r.length === 3 && (r[1] === 'I' || r[1] === 'II') && /^\d{1,9}$/.test(r[2]!)) },
  { head: 'study', id: 'study', nav: 'Class XI', valid: r => r.length <= 1 && (r[0] === undefined || /^(XI|XII)(\.[A-Za-z0-9-]+){0,2}$/.test(r[0])) },
  { head: 'labs', id: 'labs', nav: 'Visual labs' }, { head: 'lab', id: 'lab', nav: 'Visual labs', valid: r => !!r[0] }, { head: 'build', id: 'build', nav: 'Visual labs', valid: r => r.length === 0 }, { head: 'ledger', id: 'ledger', nav: 'Visual labs' },
  { head: 'sims', id: 'sims', nav: 'Visual labs', valid: r => r.length === 0 }, { head: 'sim', id: 'sim', nav: 'Visual labs', valid: r => r.length === 1 && !!r[0] },
  { head: 'trainer', id: 'trainer', nav: 'Visual labs' }, { head: 'crisis', id: 'crisis', nav: 'Visual labs' }, { head: 'cas', id: 'cas', nav: 'Visual labs' }, { head: 'cards', id: 'cards', nav: 'Visual labs' }, { head: 'project', id: 'project', nav: 'Visual labs' },
  { head: 'practice', id: 'practice', nav: 'Practice' }, { head: 'assignment', id: 'assignment', nav: 'Practice', valid: r => !!r[0] }, { head: 'rescue', id: 'rescue', nav: 'Practice' },
  { head: 'tutor', id: 'tutor', nav: 'Help' }, { head: 'about', id: 'about', nav: 'Help', valid: r => r.length === 0 }, { head: 'progress', id: 'progress', nav: 'My progress' }, { head: 'teacher', id: 'teacher', nav: 'Teacher dashboard' }, { head: 'notes', id: 'notes', nav: 'Notes' },
];
export interface Resolved { id: RouteId; nav: NavKey | null; rest: string[] }
export function resolve(path: readonly string[]): Resolved {
  if (path.length === 0) return { id: 'home', nav: 'Home', rest: [] };
  const r = ROUTES.find(x => x.head === path[0]);
  if (!r) return { id: 'notfound', nav: null, rest: [...path] };
  const rest = path.slice(1);
  // the header highlight follows the first segment (and the class for /class/XI vs /class/XII), even when the page itself is "not found"
  const nav: NavKey = r.id === 'class' || r.id === 'study' ? (rest[0]?.startsWith('XII') ? 'Class XII' : 'Class XI') : r.nav;
  const okClass = r.id !== 'class' || r.valid!(rest);
  return { id: r.valid && !r.valid(rest) ? 'notfound' : r.id, nav: r.id === 'class' && !okClass ? null : nav, rest };
}
export const hashFor = (...segments: string[]) => '#/' + segments.map(encodeURIComponent).join('/');
