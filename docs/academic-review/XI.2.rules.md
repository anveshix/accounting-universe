# XI.2.rules — Rules of debit and credit
Status: **UNSIGNED** (no reviewer named — D11 pending)
Reviewer: ____________  Qualification: ____________  Date: ________
Hindi reviewer (D10): ____________  Qualification: ____________  Date: ________

## Learning outcomes mapped (`packages/curriculum/src/outcomes.ts`)
- LO-XI.2-02 — mapping is a developer proposal, pending your confirmation.

## Where it is taught / practised
Practice skill `drcr-choose` (RU, legacy m2 bank, 69 scenes); Trainer (`#/trainer`)

## What to check
- Each scene's debit and credit account, and the "why" sentence shown as working (generated from `banks/accounts-xi.ts`).
- The account classification in `banks/accounts-xi.ts` (106 names) — it is the independent second opinion used to verify the legacy banks. Ambiguous names: Commission, Interest, Tax Expense.
- The explanations given for wrong choices: drawings as an expense, furniture as purchases, personal vs nominal account, sides swapped.
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
