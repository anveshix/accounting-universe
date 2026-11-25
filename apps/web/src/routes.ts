/**
 * The single source of truth for navigation. Pure (no DOM): the router renders from it, the header highlights from it,
 * tests and docs read it. Adding a page = one row here + one factory in main.ts.
 */
export type RouteId = 'home' | 'class' | 'labs' | 'lab' | 'sims' | 'sim' | 'sim-lab' | 'build' | 'ledger' | 'practice' | 'cards' | 'trainer' | 'crisis' | 'study' | 'paper' | 'about' | 'cas' | 'project' | 'detective' | 'tlm' | 'rescue' | 'assignment' | 'tutor' | 'progress' | 'teacher' | 'notes' | 'materials' | 'notfound';
export type NavKey = 'Home' | 'Learn' | 'Explore' | 'Challenge' | 'My progress' | 'Classroom TLM';
export const NAV: readonly { key: NavKey; hash: string }[] = [
  { key: 'Home', hash: '#/' }, { key: 'Learn', hash: '#/class/XI' }, { key: 'Explore', hash: '#/labs' }, { key: 'Challenge', hash: '#/practice' },
  { key: 'My progress', hash: '#/progress' }, { key: 'Classroom TLM', hash: '#/tlm' },
];
/** first path segment → route + the nav item it lives under. `valid` checks the remaining segments structurally. */
const ROUTES: readonly { head: string; id: RouteId; nav: NavKey; valid?: (rest: string[]) => boolean }[] = [
  { head: 'class', id: 'class', nav: 'Learn', valid: r => r[0] === 'XI' || r[0] === 'XII' },
  // study guide: #/study (my class), #/study/XI, #/study/XII, #/study/<topic id such as XI.2.journal>; it lives under the nav item of its class
  // practice paper: #/paper (set-up), #/paper/XII/I/<seed> (Class XII, Option I), #/paper/XII/II/<seed>, #/paper/XI/<seed>
  { head: 'paper', id: 'paper', nav: 'Challenge', valid: r => r.length === 0 || (r[0] === 'XI' && r.length === 2 && /^\d{1,9}$/.test(r[1]!)) || (r[0] === 'XII' && r.length === 3 && (r[1] === 'I' || r[1] === 'II') && /^\d{1,9}$/.test(r[2]!)) },
  { head: 'study', id: 'study', nav: 'Learn', valid: r => r.length <= 1 && (r[0] === undefined || /^(XI|XII)(\.[A-Za-z0-9-]+){0,2}$/.test(r[0])) },
  { head: 'labs', id: 'labs', nav: 'Explore' }, { head: 'lab', id: 'lab', nav: 'Explore', valid: r => !!r[0] }, { head: 'build', id: 'build', nav: 'Explore', valid: r => r.length === 0 }, { head: 'ledger', id: 'ledger', nav: 'Explore' },
  { head: 'sims', id: 'sims', nav: 'Explore', valid: r => r.length === 0 }, { head: 'sim', id: 'sim', nav: 'Explore', valid: r => r.length === 1 && !!r[0] }, { head: 'sim-lab', id: 'sim-lab', nav: 'Explore', valid: r => r.length === 1 && !!r[0] },
  { head: 'trainer', id: 'trainer', nav: 'Explore' }, { head: 'crisis', id: 'crisis', nav: 'Challenge' }, { head: 'cas', id: 'cas', nav: 'Explore' }, { head: 'cards', id: 'cards', nav: 'Explore' }, { head: 'detective', id: 'detective', nav: 'Challenge', valid: r => r.length <= 1 }, { head: 'tlm', id: 'tlm', nav: 'Classroom TLM', valid: r => r.length <= 1 }, { head: 'project', id: 'project', nav: 'Explore' },
  { head: 'practice', id: 'practice', nav: 'Challenge' }, { head: 'assignment', id: 'assignment', nav: 'Challenge', valid: r => !!r[0] }, { head: 'rescue', id: 'rescue', nav: 'Challenge' },
  { head: 'tutor', id: 'tutor', nav: 'Learn' }, { head: 'about', id: 'about', nav: 'Learn', valid: r => r.length === 0 }, { head: 'progress', id: 'progress', nav: 'My progress' }, { head: 'teacher', id: 'teacher', nav: 'Classroom TLM' }, { head: 'notes', id: 'notes', nav: 'Learn' }, { head: 'materials', id: 'materials', nav: 'Learn', valid: r => r.length <= 1 && (r[0] === undefined || /^(XI|XII)(\.[A-Za-z0-9-]+){0,2}$/.test(r[0])) },
];
export interface Resolved { id: RouteId; nav: NavKey | null; rest: string[] }
export function resolve(path: readonly string[]): Resolved {
  if (path.length === 0) return { id: 'home', nav: 'Home', rest: [] };
  const r = ROUTES.find(x => x.head === path[0]);
  if (!r) return { id: 'notfound', nav: null, rest: [...path] };
  const rest = path.slice(1);
  // the header highlight follows the first segment, even when the page itself is "not found"
  const nav: NavKey = r.nav;
  const okClass = r.id !== 'class' || r.valid!(rest);
  return { id: r.valid && !r.valid(rest) ? 'notfound' : r.id, nav: r.id === 'class' && !okClass ? null : nav, rest };
}
export const hashFor = (...segments: string[]) => '#/' + segments.map(encodeURIComponent).join('/');
