# Class XI visual labs — staged audit

The Visual Labs page shows these first when Class XI is selected (the first three are interactive pages):
1. Journal → Ledger → Trial Balance
2. Debit & Credit Trainer
3. Project Assistant (Class XI)
4. Depreciation Lab
5. Bank Reconciliation Lab

These are the current card order, not numbered syllabus units. Work proceeds one card at a time; the later cards have not been newly audited in this step. The prior depreciation improvements are documented in `AUDIT_STEP_1_DEPRECIATION.md`.

## Step 1 — Journal → Ledger → Trial Balance

**Findings and changes:**

- A negative capital balance was clamped to zero in the tank graphic while the text retained the negative amount; negative components were also excluded from the shared renderer's stacked tanks. The latter could even report an all-negative position as empty. The renderer now shows signed values as text rather than a misleading tank when any component is negative. The ledger hides its 3D scale for those positions.
- A credit balance on a normally debit account appeared with both a minus sign and `Cr`. T-account balances now display the absolute amount alongside their actual side.
- The page previously told learners that an unbalanced entry tilts the scale, though validation rejects it and leaves the books unchanged. The instructions now say so. A trial balance agreeing also does not prove all errors are absent.
- The story uses a periodic purchases account. Until closing stock is adjusted, the equation is a teaching representation of ledger balances, not a finished balance sheet or stock valuation. The page now makes this limitation visible.
- Removed a visual-lab-page claim that app output is automatically what will be marked correct in an exam; wording and presentation still require independent review.

**Independent example:** cash loan ₹100, rent paid ₹60 → cash/assets ₹40, loan ₹100, capital −₹60; ₹40 = ₹100 − ₹60. A negative bank balance of ₹50 appears as ₹50 Cr in the T-account. A matching trial balance cannot detect all errors of omission or principle.

**Evidence:** engine tests cover the signed equation; `packages/curriculum/test/equation-render.test.ts` checks renderer output using a minimal DOM stub. `e2e/web-app-states.cjs` adds a real browser scenario but it was not run in this environment. `npm ci`, `npm run check`, and `npm run build` passed. This is not an exhaustive audit of all manual-entry scenarios, visual accessibility, real devices, live deployment or official academic marking; a qualified CBSE teacher should review it.

## Next steps

2. Audit and improve the Debit & Credit Trainer using hand-worked cases and misconception feedback.
3. Review Project Assistant guidance against the official Class XI project requirements and privacy assumptions.
4. Revisit Depreciation Lab for remaining cases and teacher review.
5. Audit Bank Reconciliation, including overdraft, starting point, signs and reconciled examples.
