# Release Readiness — 2026-11-07

**Verdict: ready for a supervised classroom pilot. Not ready to be called "complete" or "production".** Every syllabus topic now has a lab, a page or a concept card, and everything that is
claimed is tested — but the items under "Not done" matter before a wide release.


**2026-11-16 audit update:** Step 1 addresses depreciation part-year rounding, capped working notes and zero-value disposal entries. See `AUDIT_STEP_1_DEPRECIATION.md` for test evidence, remaining limitations and review status. This targeted engineering review is not a teacher sign-off or a fresh verification of live deployment; the historical counts and statuses below have not all been re-audited.

**Lab audit (2026-11-16):** every one of the 30 labs is now named in a test with hand-worked figures (`packages/curriculum/test/lab-oracles.test.ts`; worked from textbook method, not from engine output). Select inputs are validated centrally (`guarded()` in `labs/index.ts`) and a fuzz-style test proves no field can make a lab throw anything but an `InputError`. Fixes found by that audit: the Ratio lab's worked example did not balance (fixed + current assets ₹10,00,000 vs funds + liabilities ₹12,00,000) — the example is corrected and the lab now warns when a student's balance sheet does not balance; Cash-flow stream totals no longer drop the sign of an outflow. Depreciation now accepts decimal rates (12.5%), a scrap value and an asset name. Try-tab UX: live recompute, focus and `aria-describedby` on the invalid field, in-place Reset/Clear, per-tab persistence, copy-a-link to share the numbers, and "What if…" experiments that highlight the figures that changed (`e2e/web-app-labs.cjs`). **Interactive coverage, stated separately from cards:** Class XI 18 of 24 clauses (6 are concept-card only), Class XII 30 of 30. Hindi explanations now exist for 4 labs (depreciation, bank reconciliation, final accounts, admission of a partner) as an unreviewed DRAFT, labelled as such; field labels and computed tables stay English. Remaining limits: 26 labs are English only, non-integer partnership ratios are not accepted, `namedAmounts` rejects negative amounts, and no teacher has reviewed the new what-if wording or the Hindi text. The pre-existing browser failures `home: Option II route explained` (web-app.cjs) and two axe findings on the practice page (web-app-v1.cjs) are unchanged by this work.

**Class XII share-capital audit step:** Issue arrears are now bounded by the amount due after application adjustment; the lab checks forfeiture counts and receipts, and withholds the share-capital note if arrears remain without enough information for a reliable breakdown. Reissue assumes uniform receipts per forfeited share; non-uniform cases and a full partly-paid disclosure workflow remain future work. Independent examples are in `packages/engine/test/company.test.ts` and `packages/curriculum/test/share-lab-audit.test.ts`. Browser verification and independent CBSE teacher review remain pending.

**Class XI visual labs, step 1:** signed balances in the Journal → Ledger view now use a textual fallback rather than an inaccurate positive-only tank; see `AUDIT_XI_VISUAL_LABS.md`. Engine and minimal-DOM tests pass. The added browser scenario, live deployment, accessibility and independent teacher review remain unverified.

**Class XI visual labs, step 2:** the Debit & Credit Trainer now supports retrying missed transactions and gives targeted feedback; see `AUDIT_XI_VISUAL_LABS.md`. Automated unit tests pass; browser verification and independent teacher review remain pending.

## Works and is tested
| Area | Evidence |
|---|---|
| Engine: exact money, journal/ledger/reversal/audit, partnership, company, depreciation, final accounts, ratios, cash flow, and the later calculators | 222 tests; mutation 25/25 + 10/10 |
| Curriculum, 40 practice skills, learning outcomes, migrated legacy banks, mastery levels, rescue plan, assignments/tests, teacher report/heat-map + by outcome | 348 tests |
| Web app: 32 labs/pages incl. Computerised Accounting Simulator, 15 bilingual concept cards, practice (3 modes), progress, teacher, project assistants, offline/PWA | 425 browser checks (desktop + mobile) incl. axe on the V1 views |
| Tutor proxy | 9 tests against a mock upstream |
| Legacy single-file app still ships | 14/14, 12/12 |

Coverage as shown in the app: Class XI — 18 of 24 topics interactive, 6 theory-only (cards); Class XII — 30 of 30 interactive.

## P0 vertical V1 status (2026-11-15)
Implemented and tested: T0.2 learning outcomes, T0.3 V1 generators + typology, T0.4 Hindi **draft**, T0.5 bank migration with engine re-verification,
T0.6 rule-based feedback, T0.7 teacher report by outcome, T0.8 review templates + axe on the new views. **No V1 clause is "Done"** under Appendix B:
the review files are unsigned (D11) and the Hindi is unreviewed (D10).
Also done since: four more skills (`ledger-side` RU, `tb-side` RU, `journal-error` AEC, `case-ledger` AEC competency case), so every V1 clause has items in at
least two typology bands and ledger has all three; the Debit & Credit Trainer now draws on the migrated bank (hand-written items + verified legacy scenes whose
accounts exist in the starter chart); the Hinglish-card toggle no longer switches the whole app to Hindi.
T0.1 is done except one item: npm workspaces, ESLint, Prettier (ratchet), symlink removal (D9) and the CI workflow (D12) are in and verified locally from a clean copy; the workflow has not yet been observed running on GitHub, and deleting the old per-package lockfiles still waits for your approval. Not done: T0.1 remainder, T0.9 preview deploy (D8a), a multi-line `ENTRY` part kind (journal items are
single debit / single credit; `journal-error` tests recognising mistakes instead), the Equation Visualizer reading the migrated m1 bank (the practice
skill `eq-impact` does), Hindi for labs, concept text and the wrong-answer explanations, rules and equation clauses still have only one or two bands
(rules = RU only; equation = RU + AP), 5 legacy items held for an inventory-model decision.

## Trial Balance Crisis challenge (2026-11-16)
Built and tested (13 unit tests with independent oracles, 35 browser checks incl. axe and 390 px). Not verified: a teacher's review of the wording, the
rectification convention and the what-if answers (D11); the Hindi text is an unreviewed draft (D10); the 3D scale is decorative and was only checked in headless Chromium;
classroom use with real students. Only one-sided posting errors in a single account are generated (no compound or two-sided errors, which need no Suspense).

## Language switch (2026-11-18)
One switch for the whole app is in and tested. Hindi pages: header, navigation, home, labs index, class map, practice screens, Crisis challenge and the six V1 skills. English-only (with a notice): ledger page, progress, teacher dashboard, lab pages, help, trainer, concept cards, rescue, projects, simulator, and the explanations inside labs. The Hindi is an **unreviewed draft** (D10). Concept cards still have their own Hinglish (Hindi in English letters) toggle.

## Not done / not verified (read before releasing)
* **AI tutor is not live.** Code, guard and tests exist (`apps/tutor-proxy`) but it was never run against the real API, is not deployed, and needs your API key and a host (D4). The app works fully without it.
* **No accounts, sync or central teacher view** (D5): teachers work from files students hand over. By design, nothing about minors leaves the device.
* **CI is written but unobserved** — `.github/workflows/ci.yml` (D12) mirrors `tools/check-all.sh`; it has not yet been seen running on GitHub. 
* **Practice paper** (`#/paper`) is built and tested against the Class XII blueprint (34 questions, 20×1/6×3/3×4/5×6, unit marks, typology 32/24/24, internal choice in six). Its 3-, 4- and 6-mark questions are often *sets of linked smaller generated questions*, not long board-style questions; no generator makes a true 6-mark question yet. The Class XI paper uses the official unit marks with the Class XII pattern and is labelled not official (D7). Marking scheme = engine answers, not an official CBSE scheme.
* **Dissolution** is a calculator, not a step-by-step realisation simulation. Animation controls exist only on the ledger page.
* **Directive items deliberately not done:** debenture *redemption* entries (not prescribed in 2026-27, D2); segment reports (listed only as a project aspect).
* **Hinglish/Hindi** covers concept cards, rule cards and the explanation text of 4 labs (draft, unreviewed); the other 26 labs are English.
* **Not verified:** axe on routes other than the V1 views, screen readers, Lighthouse, Safari/Firefox, real phones, a teacher's or accountant's review of wording and conventions, classes of 30+ student files.

## Study guide, practice paper, About page (2026-11-22)
* **Study guide** (`#/study`): all 54 syllabus topics have a page (notes, formats, steps, mistakes, how it is asked, a verified worked example on every topic (54 of 54; each figure is re-worked in `study-examples.test.ts` and `study.test.ts`), official outcomes, links to labs/practice, print). Original text; tests recompute every example and check excluded topics are not taught (`study.test.ts`, `e2e/web-app-study.cjs`). **Not reviewed by a subject teacher (D11); English only.**
* **Practice paper** (`#/paper`): see above (`paper.test.ts`, `e2e/web-app-paper.cjs`). Same number = same paper, shareable link, print view.
* **About and trust** (`#/about`): states what is official, what is ours, review status and data handling; counts come from code.
* Not done: Notes library still has placeholder text and a client-side-only paywall (cannot protect content); Hindi for study/paper pages; a guided learning path; shared XP/badges for paper results.

## Owner decisions
D1 strangler stack (assumed) · D2 omit redemption (assumed) · D3 Option II after Option I (done) · **D4 deploy the tutor proxy and supply a key** · D5 backend/minors' data · D6 repository licence · D7 Class XI sample paper to validate against.

## Data & privacy
Progress is stored on the device (IndexedDB, memory fallback). Nothing is uploaded. The proxy receives only a question, a chapter name and engine figures — no names or progress. No API key exists anywhere in the repository.

## Question bank expansion (V2)
- Added 18 numerical generators (trading and P&L, closing capital, outstanding/prepaid, missing TB figure, purchases book, credit sales, error correction, fixed/fluctuating capitals, past adjustments, death of a partner, goodwill from capital, premium issue, paid-up capital, comparative and common-size, profitability and receivables ratios, investing/financing cash flows) and 20 concept banks (about 142 authored MCQs) for the theory chapters of Classes XI and XII.
- Tests: packages/curriculum/test/questions-v2.test.ts (hand-worked oracles) plus the generic per-generator suite; e2e/web-app-questions.cjs.
- Not yet: Hindi for V2 questions, questions for the two project clauses, and a PGT review pass of the MCQ wording.

## Question formats V3 (step-wise, case-based, assertion-reason)
- Added 6 step-wise numerical problems (depreciation and sale, admission goodwill, retirement, cash from operations, forfeiture and re-issue, adjusted profit), 6 case-based sets with computed options (equation, depreciation, BRS, admission, forfeiture, cash-flow classification) and 11 assertion-reason banks in the standard four-option format (concepts, errors, depreciation, BRS, adjustments, final accounts, admission, retirement, forfeiture, debentures, ratios, cash flow).
- Assertion-reason answers are derived from truth flags, never typed. Tests: packages/curriculum/test/questions-v3.test.ts, e2e/web-app-questions.cjs.
- NOT verified: the live CBSE 2026-27 sample paper could not be fetched (host returned 503), so the exact count and marks of each question type in the board paper are not encoded. The repo only relies on what the syllabus PDF states (typology 40/30/30). Compare these formats with the official sample paper and marking scheme before claiming board-paper parity.
