# Student-experience audit and upgrade (Nov 2026)

Evidence base: code read on `main` (27587a0), 2,531 unit tests + 20 browser suites green before changes. The deployed app is `apps/web` at `/` (GitHub Pages, `deploy-pages.yml`); `index.html` is the frozen legacy app at `/legacy/` and was not touched.

## Audit findings (by severity)

| # | Finding | Evidence | Status |
|---|---|---|---|
| 1 | **Visits were rewarded.** Opening any lab/study page paid 5 XP and extended the streak, while the Quest board claimed "Time on the page earns nothing". 54 study pages = 270 XP for scrolling. | `rewards.ts` `XP_FIRST_SEEN`, `firstSeen` loop | **Fixed**: visits earn 0 XP and no streak day; XP/streak come only from answers, solved simulators, recorded attempts |
| 2 | "Own Brain" badge counted hint-free attempts even when wrong. | `hintFree++` | **Fixed**: needs ≥ half marks |
| 3 | Mastery levels 1–2 ("Understand", "Observe") still come from opening a tab. Levels 3–5 need real attempts, so a visit can never exceed level 2. | `progress.ts levelFor` | Kept (by design, documented); *not* changed to avoid rewriting stored progress |
| 4 | Nine nav items with overlapping meaning (Class XI/XII, Visual labs, Practice, Notes, Help, Teacher dashboard). | `routes.ts` | **Fixed**: six items Home · Learn · Explore · Challenge · My progress · Classroom TLM; all URLs unchanged; Notes, Materials, Help, About moved to a footer "More" row |
| 5 | Home stacked ten blocks; the stat ribbon (four tiles linking to places already in the nav) and the generic 3-step strip were decoration. | `home.ts` | **Removed**; Today/Due-revision, class choice, workbenches, quick drill, recommended labs kept |
| 6 | Teacher tooling had no way to produce classroom material (only assignments/dashboard). | — | **Added** Classroom TLM |
| 7 | Error-spotting existed only as one long ledger hunt (Trial Balance Crisis). | — | **Added** Error Detective (transaction level) |
| 8 | `sim-lab` axe `aria-required-children` on `.simlab-subtabs` (partnership, CAS labs). | `web-app-sim-labs.cjs` | **Pre-existing, not fixed** (fails identically on the untouched baseline) |
| 9 | `web-app-tutor.cjs` cannot start in this sandbox (port 4181 `EADDRINUSE`), also on baseline. | — | Environment issue, not run |

Genuine gamification already present: XP scaled by correctness/mode/hints, comeback bonus, spaced-revision queue, Crisis lives, simulator challenges. Decorative: confetti on every goal, stat ribbon, "Explorer" badge (opening labs; no XP attached).

## Delivered slices
1. Rewards integrity (`packages/curriculum/src/rewards.ts`, tests updated with hand-worked values).
2. Six-item information architecture (`apps/web/src/routes.ts`, `main.ts`, i18n en/hi, tests).
3. Home declutter (`pages/home.ts`).
4. **Classroom TLM Factory** — `packages/curriculum/src/tlm.ts` (pure kit builder, every set posted through the engine `Ledger` and validated) + `apps/web/src/pages/tlm.ts`: topics Rules of Dr/Cr, Journal, Ledger, Trial balance (all Class XI clauses XI.2.\*). Output: full-screen smartboard demonstration driven by the `tlm-stage` state machine (predict → reveal → next, keyboard + large buttons), teacher prediction questions, A4 worksheet and answer key, transaction and account cards, matching set, and a student link `#/tlm/<topic>-s<seed>-play` that records real attempts.
5. **Accounting Error Detective** — `detective.ts` + `pages/detective.ts`: 9 templates covering omission, partial omission, commission, principle, compensating, one-sided amount; error class and trial-balance effect from the engine tables, rectifying entry from engine `rectify()`.

## Not done (honest list)
* **Accounting Escape Room** and **Run Your Own Business** simulation: not started. Each needs its own design and review.
* **Transaction-to-Final-Accounts journey**: not built; the existing Ledger story and CAS/Final-accounts labs remain the nearest experiences.
* **QR codes**: no QR encoder is in the repo and none was added (no new dependencies; a hand-written encoder could not be verified here). The student link is a copyable URL.
* **Hindi**: nav, footer and home strings have Hindi *draft* text; TLM and Detective pages are English-only (the app shows its English-only notice). Hindi is not teacher-reviewed.
* **Independent teacher review** of the TLM/Detective accounting content has not happened; hand-worked unit tests are the only check.
* TLM kits cover one scenario family (a trader's first month) with seeded amounts and names.
* Optional leaderboards: none exist, none added.
