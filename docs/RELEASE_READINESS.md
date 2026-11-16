# Release Readiness — 2026-11-07

**Verdict: ready for a supervised classroom pilot. Not ready to be called "complete" or "production".** Every syllabus topic now has a lab, a page or a concept card, and everything that is
claimed is tested — but the items under "Not done" matter before a wide release.


**2026-11-16 audit update:** Step 1 addresses depreciation part-year rounding, capped working notes and zero-value disposal entries. See `AUDIT_STEP_1_DEPRECIATION.md` for test evidence, remaining limitations and review status. This targeted engineering review is not a teacher sign-off or a fresh verification of live deployment; the historical counts and statuses below have not all been re-audited.

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
T0.1 is partly done: npm workspaces, ESLint and Prettier (ratchet) are in and verified from a clean copy; symlink removal (D9), the CI workflow (D12) and deleting the old per-package lockfiles still wait for you. Not done: T0.1 remainder, T0.9 preview deploy (D8a), a multi-line `ENTRY` part kind (journal items are
single debit / single credit; `journal-error` tests recognising mistakes instead), the Equation Visualizer reading the migrated m1 bank (the practice
skill `eq-impact` does), Hindi for labs, concept text and the wrong-answer explanations, rules and equation clauses still have only one or two bands
(rules = RU only; equation = RU + AP), 5 legacy items held for an inventory-model decision.

## Not done / not verified (read before releasing)
* **AI tutor is not live.** Code, guard and tests exist (`apps/tutor-proxy`) but it was never run against the real API, is not deployed, and needs your API key and a host (D4). The app works fully without it.
* **No accounts, sync or central teacher view** (D5): teachers work from files students hand over. By design, nothing about minors leaves the device.
* **No CI running** — example workflow in `docs/ci/`. 
* **Board-exam blueprint mock paper** (Class XII: 34 questions, 1/3/4/6-mark mix) is not built; Board *mode* gives single skill questions, not a full paper.
* **Dissolution** is a calculator, not a step-by-step realisation simulation. Animation controls exist only on the ledger page.
* **Directive items deliberately not done:** debenture *redemption* entries (not prescribed in 2026-27, D2); segment reports (listed only as a project aspect).
* **Hinglish** covers concept cards and rule cards only; labs are English.
* **Not verified:** axe on routes other than the V1 views, screen readers, Lighthouse, Safari/Firefox, real phones, a teacher's or accountant's review of wording and conventions, classes of 30+ student files.

## Owner decisions
D1 strangler stack (assumed) · D2 omit redemption (assumed) · D3 Option II after Option I (done) · **D4 deploy the tutor proxy and supply a key** · D5 backend/minors' data · D6 repository licence · D7 Class XI sample paper to validate against.

## Data & privacy
Progress is stored on the device (IndexedDB, memory fallback). Nothing is uploaded. The proxy receives only a question, a chapter name and engine figures — no names or progress. No API key exists anywhere in the repository.
