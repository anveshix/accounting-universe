# Testing Strategy

## Layers

| Layer | Tool | Where | What it protects |
|---|---|---|---|
| Engine unit + property tests | Vitest | `packages/engine/test` | Money exactness, validation, ledger, reversal, TB, equation |
| Type safety | `tsc --noEmit` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | engine | Misuse of the API |
| Legacy regression / smoke | Playwright (Chromium) | `e2e/*.cjs` | The shipped single-file app: loads clean, 20 screens open, accounting fixes stay fixed |
| Curriculum / practice / progress | Vitest | `packages/curriculum/test` | Syllabus totals, 1,500 seeds per generator, mastery model, teacher report, lab registry vs syllabus |
| Web app browser flows | Playwright (desktop + 390px mobile) | `e2e/web-app.cjs` | Every lab (example, try-it, blank, garbage input, reset), ledger play/step/reverse, practice round-trip, progress export → teacher import, offline, no console errors, label/heading/alt checks |
| (planned) Accessibility / offline / perf | axe, service-worker tests, Lighthouse | Phase 8 | Directive Part 13 |

## Rules we hold ourselves to

1. **Independent oracles.** Expected values are worked out by hand (textbook / marking-scheme style) and
   written into the test with the arithmetic in a comment. Reading them back from the engine proves nothing.
   "Trial balance balances" is never the only assertion.
2. **Tests must be able to fail.** Each new suite is checked against the broken behaviour (or a mutant). Evidence so far:
   * `legacy-simulator-regression`: **12 of 14 checks fail on the pre-fix code**, all 14 pass now.
   * Engine mutation check — each of these deliberate breakages is caught: 1-paisa tolerance in Dr=Cr (3 tests fail),
     expenses made credit-normal (6), reversal without side flip (2), `HALF_UP` rounding down (4), drawings not reducing
     capital (2), entries not frozen (1).
3. **Cite the clause.** Syllabus-bound labs name the matrix row they implement (`CBSE_2026_27_SYLLABUS_MATRIX.md`).
4. **Property tests are seeded** (reproducible). Current: 300 random compound entries in paise; books balance after
   every post; reversing all 300 returns every account to exactly zero.
5. **No float in money paths** — enforced by a source-scanning guard test.

## Current results (run locally 2026-11-15, `tools/check-all.sh` → ALL CHECKS PASSED)

* Engine: **222 tests** (10 files) incl. the `Machine` kit (property test: 10,000 random events) and the journal-entry lifecycle; mutation checks **25/25** (`test/mutation-check.py`) and **10/10** on the later calculators (`test/mutation-extras.py`).
* Curriculum: **378 tests** (13 files). New for P0 V1: legacy-bank re-verification by the engine plus an independent account classification, with corruption tests that prove each check can fail (`legacy-banks`, 14); official learning outcomes (`outcomes`, 6); V1 generators with oracles recomputed from the question text and rule-based feedback for every wrong option (`questions-v1`, 12); report by learning outcome on hand-worked fixtures (`outcome-report`, 3); EN/HI catalogue parity (`i18n`, 4); review files match the outcome mapping and stay unsigned (`academic-review`, 2). Earlier suites include incl. every state machine (validity, random walks, scenarios with the exact user-facing messages), the route table vs the old router as an oracle, and a test that fails if `docs/STATE_MACHINES.md` is stale.
* Tutor proxy: **12 tests** (`node --test`) against a mock upstream — key never returned, output guard, limits incl. fake-clock day rollover and idle-client eviction, CORS.
* Web: `tsc` clean; browser suites `web-app` **260**, `web-app-extra` **54**, `web-app-states` **51** (states readable, refusals explained, timer-leak/double-submit/storage-banner regressions), `web-app-tutor` **8** (panel ↔ real proxy ↔ mock upstream), `web-app-v1` **54** (each new skill answered wrong then right, CHOICE parts, Hindi draft toggle persists and renders Devanagari, learning outcomes on the Learn tab, teacher outcome table + CSV against a hand-made file, 390 px no horizontal scroll, **axe-core zero serious/critical** on practice EN/HI, lab Learn tab, teacher, home).
* Legacy: `e2e/legacy-simulator-regression.cjs` 14/14; `e2e/legacy-smoke.cjs` 12/12.
* All of the above in one command: `tools/check-all.sh`.

## Lint and format
`npm --prefix tools/lint ci` once, then `npm run lint` (ESLint, 0 errors; engine sources may not use `parseFloat`/`Math.round`/`toFixed`) and `npm run format:check` (Prettier ratchet, see AGENTS.md). Both are part of `tools/check-all.sh` when installed. CI (`.github/workflows/ci.yml`) runs them too.

## Running

```
cd packages/engine && npm install && npm run check
(cd packages/curriculum && npx vitest run)
(cd apps/tutor-proxy && npm test)
(cd apps/web && npm install && npm run build) && NODE_PATH="$(npm root -g)" node e2e/web-app.cjs && node e2e/web-app-extra.cjs
tools/check-all.sh        # everything
NODE_PATH="$(npm root -g)" node e2e/legacy-smoke.cjs                  # needs playwright + chromium
NODE_PATH="$(npm root -g)" node e2e/legacy-simulator-regression.cjs
```

## Known gaps

CI exists (`.github/workflows/ci.yml`) but has not been observed running; the token used here may be unable to push workflow files. No coverage measurement.
Accessibility: axe-core runs on 5 views in `web-app-v1` (zero serious/critical); the other routes still rely on hand-written DOM assertions. No screen-reader test. No Lighthouse run. Chromium only; no real devices. The tutor proxy has never
talked to the live API. Lab result values are verified in the engine tests and by 11 browser spot checks, not for every lab number in the browser.
Concept-card text is original and reviewed by me, not by a teacher.
