# Audit and improvement plan — step 1: Class XI depreciation

Status: **engineering review, not a CBSE teacher sign-off**. This is a targeted first pass, not a full audit of every lab or a review of the live website. Scope is the repository at this branch; no live browser, real-device or current GitHub Pages deployment verification was performed. The syllabus reference below is the repository's traceability matrix, not an independently re-downloaded official PDF. An experienced CBSE Accountancy teacher should review the wording, worked examples and assessment alignment before classroom sign-off.

## Evidence and findings

| Priority | Evidence | Finding / impact | Status |
| --- | --- | --- | --- |
| High | `packages/engine/src/depreciation.ts`; `packages/engine/test/classxi.test.ts` | A part-year calculation rounded the annual amount first and then the partial-year amount, potentially overstating the charge by a paisa. For example ₹0.01 × 50% × 6/12 is ₹0.0025, which rounds to ₹0.00, not ₹0.01. | Fixed: apply the exact rate and period fraction before rounding once. Regression tests cover SLM and WDV. |
| High | `apps/web/src/labs/xi.ts` | SLM workings asserted the full annual charge even when the engine capped it at the remaining book value. This could teach a false equation. | Fixed: explain the computed charge and cap, with independent ₹100, 60% example. |
| Medium | `packages/engine/src/depreciation.ts` | The provision method could output empty or zero-value disposal journal entries when there was no depreciation, proceeds or profit/loss. Inputs to the public engine function also allowed impossible accumulated depreciation. | Fixed: omit zero-only entries and validate disposal amounts. |
| Medium | `apps/web/src/labs/xi.ts` | The original concept described depreciation simply as a fall in value, and omitted visible assumptions about zero residual value, rounding and when disposal takes place. | Wording and assumptions clarified; teacher review still required. |
| Medium | `apps/web/src/labs/xi.ts`, `apps/web/src/inputs.ts` | The lab accepts only whole-number percentages, assumes zero residual value, permits sale only at the end of the last modelled year, and teaches through generated output rather than requiring a student-prepared journal or ledger. The syllabus matrix includes two recording approaches and asset disposal. | Limitations disclosed in the lab; richer inputs, student entry and assessment remain future work. Do not treat this calculator as complete mastery of the clause. |
| Medium | `apps/web/src/labs/index.ts`, `packages/curriculum/test/labs-registry.test.ts` | Coverage is based on whether a lab/page is linked to a syllabus clause, not verification that every learning outcome, exam format or adjustment is taught and assessed. | Open: distinguish presence, partial coverage and independently reviewed mastery in a later step. |
| Medium | `docs/RELEASE_READINESS.md`, `docs/academic-review/` | Earlier readiness and coverage claims predate later deployment changes; review files remain unsigned. A passing test is not independent academic approval. | Open: update status as each area is independently reviewed; obtain teacher review. |
| Medium | `apps/web/public/sw.js`, `.github/workflows/deploy-pages.yml` | The Pages workflow builds the app but does not run the browser E2E suite; the service worker caches same-origin responses. Deployment, upgrade behaviour and offline recovery have not been verified in this step. | Open: test version upgrades, project subpath and browser scenarios before claiming production readiness. |

## Scope and assumptions for this iteration

- The lab is rate-based, with an assumed zero residual value. The first period can be shorter; subsequent periods are full years. Sale happens at the end of the final period, after depreciation. It does not handle mid-year disposal, multiple assets, revaluation, or changing method.
- The repository's `docs/CBSE_2026_27_SYLLABUS_MATRIX.md` records SLM, WDV, both recording methods and disposal within Class XI, excluding change of method. No claim of official endorsement is made.
- Money is exact paise; a period's charge is rounded HALF_UP to the nearest paisa and capped at opening value (or scrap in the lower-level engine). Students should follow their teacher's or question's specified rounding convention.

## Validation and next steps

Automated: `npm ci`, `npm run check`, and `npm run build`. Regression cases include part-year rounding, SLM cap, no zero entry, disposal, and the existing hand-worked WDV example. Browser E2E, accessibility, actual Pages deployment and academic sign-off remain unverified.

Suggested order, one bounded iteration at a time:
1. **This step:** repair and document depreciation calculations and explanations; seek teacher review.
2. **Next:** audit Journal → Ledger → Trial Balance against hand-worked entries, including posting, balancing and learner error feedback; add independent tests before expanding UI.
3. Review remaining Class XI labs one clause at a time, then Class XII partnership/company and both Part B options, recording omissions and syllabus limits.
4. Audit deployment/offline upgrades, accessibility, mobile and teacher workflows; independently review marking-scheme examples and Hindi before release claims.
