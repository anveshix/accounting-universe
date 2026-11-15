# XI.2.ledger — Ledger
Status: **UNSIGNED** (no reviewer named — D11 pending)
Reviewer: ____________  Qualification: ____________  Date: ________
Hindi reviewer (D10): ____________  Qualification: ____________  Date: ________

## Learning outcomes mapped (`packages/curriculum/src/outcomes.ts`)
- LO-XI.2-09 — mapping is a developer proposal, pending your confirmation.

## Where it is taught / practised
Practice skill `ledger-balance` (AP; postings and balances computed by the engine); Ledger page (`#/ledger`)

## What to check
- Balancing convention: "Balance c/d" on the smaller side; nature of the balance named after the bigger side.
- The month of transactions (seeds 1–10): amounts and dates plausible for Class XI.
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
