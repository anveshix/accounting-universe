/**
 * Notes & teacher resources catalogue + freemium access rules. Pure: no DOM, no storage.
 * NOTE: the lock is a UI gate. Real protection for paid files needs a server (signed URLs); see docs/NOTES_AUTHORING.md.
 */
export type NoteSubject = 'ACT' | 'BST' | 'ETP';
export type NoteKind = 'NOTES' | 'PPT' | 'LESSON_PLAN' | 'WORKSHEET';
export type NoteTier = 'FREE' | 'PRO';
export type Plan = 'FREE' | 'PRO';
export type NoteAudience = 'STUDENT' | 'TEACHER';

export const SUBJECTS: Readonly<Record<NoteSubject, string>> = { ACT: 'Accountancy', BST: 'Business Studies', ETP: 'Entrepreneurship' };
export const KINDS: Readonly<Record<NoteKind, string>> = { NOTES: 'Notes', PPT: 'PPT', LESSON_PLAN: 'Lesson plan', WORKSHEET: 'Worksheet' };

export interface NoteItem {
  readonly id: string;
  readonly cls: 'XI' | 'XII';
  readonly subject: NoteSubject;
  readonly kind: NoteKind;
  readonly title: string;
  readonly summary: string;
  readonly tier: NoteTier;
  /** pages / slides / periods, shown on the card */
  readonly size: string;
  /** optional downloadable file under apps/web/public/notes/ (e.g. 'act-xii-partnership.pdf') */
  readonly file?: string;
}
export const audienceOf = (k: NoteKind): NoteAudience => (k === 'PPT' || k === 'LESSON_PLAN' ? 'TEACHER' : 'STUDENT');

export type Gate = { ok: true } | { ok: false; reason: string };
/** Free items open for everyone; Pro items need the Pro plan. The refusal is a sentence the user can act on. */
export function canOpen(item: Pick<NoteItem, 'tier' | 'title'>, plan: Plan): Gate {
  if (item.tier === 'FREE' || plan === 'PRO') return { ok: true };
  return { ok: false, reason: `“${item.title}” is part of Pro. Unlock it with an access code on the Pricing section below.` };
}

export interface Filter { cls?: 'XI' | 'XII'; subject?: NoteSubject; kind?: NoteKind; audience?: NoteAudience; q?: string }
export function filterNotes(items: readonly NoteItem[], f: Filter): NoteItem[] {
  const q = f.q?.trim().toLowerCase();
  return items.filter(i => (!f.cls || i.cls === f.cls) && (!f.subject || i.subject === f.subject) && (!f.kind || i.kind === f.kind)
    && (!f.audience || audienceOf(i.kind) === f.audience) && (!q || (i.title + ' ' + i.summary).toLowerCase().includes(q)));
}
export function counts(items: readonly NoteItem[]): { free: number; pro: number } {
  const free = items.filter(i => i.tier === 'FREE').length; return { free, pro: items.length - free };
}

/** Access code: AU-XXXX-XXXY, Y = check character of the first 7 characters. Pre-launch stand-in for a licence server. */
const ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function checkChar(body: string): string { let s = 0; for (let i = 0; i < body.length; i++) s += (ALPHA.indexOf(body[i]!) + 1) * (i + 1); return ALPHA[s % 36]!; }
export function makeCode(body7: string): string { const b = body7.toUpperCase(); return `AU-${b.slice(0, 4)}-${b.slice(4)}${checkChar(b)}`; }
export function redeemCode(raw: string): Gate {
  const c = raw.trim().toUpperCase();
  const m = /^AU-([A-Z0-9]{4})-([A-Z0-9]{3})([A-Z0-9])$/.exec(c);
  if (!m) return { ok: false, reason: 'That does not look like an access code. It reads like AU-XXXX-XXXX.' };
  if (checkChar(m[1]! + m[2]!) !== m[3]) return { ok: false, reason: 'That code is not valid. Check for a mistyped character (0 and O look alike).' };
  return { ok: true };
}

const N = (id: string, cls: 'XI' | 'XII', subject: NoteSubject, kind: NoteKind, tier: NoteTier, title: string, summary: string, size: string, file?: string): NoteItem => ({ id, cls, subject, kind, tier, title, summary, size, ...(file ? { file } : {}) });
/** SAMPLE catalogue: replace/extend with your own (see docs/NOTES_AUTHORING.md). Bodies live in apps/web/src/notes-bodies.ts. */
export const NOTES: readonly NoteItem[] = [
  N('act-xi-equation', 'XI', 'ACT', 'NOTES', 'FREE', 'Accounting Equation', 'Assets = Liabilities + Capital, with worked transactions.', '4 pages'),
  N('act-xi-rules', 'XI', 'ACT', 'NOTES', 'FREE', 'Rules of Debit and Credit', 'Golden rules by account type, with a one-page cheat sheet.', '3 pages'),
  N('act-xi-depn', 'XI', 'ACT', 'NOTES', 'PRO', 'Depreciation: SLM & WDV', 'Both methods with journal entries and solved numericals.', '8 pages'),
  N('act-xi-bank', 'XI', 'ACT', 'NOTES', 'PRO', 'Bank Reconciliation Statement', 'Step-by-step BRS with the usual traps.', '7 pages'),
  N('act-xii-admission', 'XII', 'ACT', 'NOTES', 'FREE', 'Partnership: Admission of a Partner (overview)', 'Sacrificing ratio, goodwill and revaluation at a glance.', '4 pages'),
  N('act-xii-cfs', 'XII', 'ACT', 'NOTES', 'PRO', 'Cash Flow Statement (indirect)', 'Operating, investing and financing activities, with format.', '10 pages'),
  N('bst-xi-business', 'XI', 'BST', 'NOTES', 'FREE', 'Business, Trade and Commerce', 'Nature, objectives and classification of business activities.', '5 pages'),
  N('bst-xi-forms', 'XI', 'BST', 'NOTES', 'PRO', 'Forms of Business Organisation', 'Sole proprietorship to company: merits, limits, comparison table.', '9 pages'),
  N('bst-xii-mgmt', 'XII', 'BST', 'NOTES', 'FREE', 'Nature and Significance of Management', 'Definition, features, levels and functions of management.', '5 pages'),
  N('bst-xii-principles', 'XII', 'BST', 'NOTES', 'PRO', 'Principles of Management', 'Fayol and Taylor compared, with case-based questions.', '8 pages'),
  N('etp-xi-perspective', 'XI', 'ETP', 'NOTES', 'FREE', 'Entrepreneurial Perspective', 'Concept, traits and myths about entrepreneurship.', '4 pages'),
  N('etp-xii-opportunity', 'XII', 'ETP', 'NOTES', 'PRO', 'Entrepreneurial Opportunity', 'Spotting and evaluating opportunities.', '6 pages'),
  N('act-xi-equation-ppt', 'XI', 'ACT', 'PPT', 'FREE', 'Accounting Equation: classroom deck', 'Animated walkthrough, 12 slides with board questions.', '12 slides'),
  N('act-xi-depn-ppt', 'XI', 'ACT', 'PPT', 'PRO', 'Depreciation: classroom deck', 'SLM vs WDV with live-calculation slides.', '24 slides'),
  N('bst-xii-mgmt-ppt', 'XII', 'BST', 'PPT', 'PRO', 'Management: classroom deck', 'Levels, functions and activity prompts.', '20 slides'),
  N('act-xi-equation-lp', 'XI', 'ACT', 'LESSON_PLAN', 'FREE', 'Accounting Equation: lesson plan', '2-period plan with objectives, activities and exit ticket.', '2 periods'),
  N('act-xii-cfs-lp', 'XII', 'ACT', 'LESSON_PLAN', 'PRO', 'Cash Flow Statement: lesson plan', '5-period unit plan with assessment rubric.', '5 periods'),
  N('etp-xi-perspective-lp', 'XI', 'ETP', 'LESSON_PLAN', 'PRO', 'Entrepreneurial Perspective: lesson plan', 'Activity-led plan with group task.', '3 periods'),
  N('act-xi-rules-ws', 'XI', 'ACT', 'WORKSHEET', 'PRO', 'Debit/Credit practice worksheet', '30 graded questions with answer key.', '4 pages'),
];
