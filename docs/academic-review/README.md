# Academic review records (handoff T0.8, decision D11)

A clause may be called **Done** only when its file here is **signed by a qualified reviewer** (a Commerce teacher or a
Chartered/Cost Accountant) — see Appendix B of `docs/ACCOUNTING_UNIVERS_2_0_HANDOFF.md`. Software tests prove the figures
agree with independent oracles; they do **not** prove the wording, conventions and pedagogy are right for CBSE Class XI.

**Status of every file in this folder: UNSIGNED — no reviewer has been named yet (D11 pending). Hindi text is an unreviewed DRAFT (D10 pending).**

## How to review a clause
1. Open the app (`cd apps/web && npm run build`, then serve `apps/web/dist`) and the clause's file below.
2. Work through every item in "What to check". Use the listed seeds so that you and the developer see the same questions
   (`#/practice/<skill>/<seed>/board`).
3. Record each problem in the "Findings" table (what, where, why, the correct convention, NCERT/CBSE reference).
4. Sign only when every finding is fixed or explicitly accepted.

## Template (copy for a new clause)
```
# <clause id> — <title>
Status: UNSIGNED
Reviewer: ____________  Qualification: ____________  Date: ________
Hindi reviewer (D10): ____________  Qualification: ____________  Date: ________

## Learning outcomes mapped (outcomes.ts)
## Where it is taught / practised
## What to check
## Findings
| # | Where | Problem | Correct convention / reference | Fixed in |
|---|---|---|---|---|
## Sign-off
[ ] Calculations and conventions are correct for CBSE 2026-27
[ ] English wording is suitable for Class XI
[ ] Hindi (Devanagari) terminology follows NCERT Hindi-medium usage
[ ] Learning-outcome mapping is correct
Signature: ____________
```
