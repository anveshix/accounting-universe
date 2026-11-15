# XI.2.equation — Accounting equation
Status: **UNSIGNED** (no reviewer named — D11 pending)
Reviewer: ____________  Qualification: ____________  Date: ________
Hindi reviewer (D10): ____________  Qualification: ____________  Date: ________

## Learning outcomes mapped (`packages/curriculum/src/outcomes.ts`)
- LO-XI.2-01
- LO-XI.2-02 — mapping is a developer proposal, pending your confirmation.

## Where it is taught / practised
Lab "Accounting Equation Visualizer" (`#/lab/xi-equation`); practice skills `eq-impact` (RU, legacy m1 bank, 50 templates) and `eq-balance` (AP)

## What to check
- The A / L / C effect of each of the 50 migrated m1 templates (`packages/curriculum/src/banks/legacy-v1.ts`) — especially goods sold at a profit (stock falls by cost, capital rises by profit).
- `eq-balance`: totals of assets and capital after 3–5 transactions (seeds 1–10).
- Inventory model (F-4): items m2#5, m2#21, m2#22, m2#61, m2#62 mix perpetual and periodic treatment and are held back from assessment until you decide.
- Typology tag (RU / AP / AEC) of each skill — proposals, not yet checked against the CBSE Sample Question Paper.
- Hindi (Devanagari) text of every question in Hindi mode (header button "हिन्दी (मसौदा)") — machine-assisted draft.

## Automated evidence (re-run before signing)
- `cd packages/curriculum && npx vitest run test/legacy-banks.test.ts test/questions-v1.test.ts test/outcomes.test.ts`
- `NODE_PATH="$(npm root -g)" node e2e/web-app-v1.cjs`

## Findings
| # | Where | Problem | Correct convention / reference | Fixed in |
|---|---|---|---|---|
| | | | | |

## Sign-off
- [ ] Calculations and conventions are correct for CBSE 2026-27
- [ ] English wording is suitable for Class XI
- [ ] Hindi (Devanagari) terminology follows NCERT Hindi-medium usage
- [ ] Learning-outcome mapping is correct

Signature: ____________
