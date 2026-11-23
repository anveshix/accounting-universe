# Accounting Univers 2.0 — Planning Audit & Implementation Handoff

> **Status:** planning deliverable. No source code was changed to produce it.
> **Update 2026-11-15:** P0 tasks T0.2–T0.8 implemented on branch `claude/accounting-universe-errors-merge-v0y0kv` except the owner-gated parts; see `docs/RELEASE_READINESS.md` → "P0 vertical V1 status" for exactly what is done, tested and still open.
> **Prepared:** 2026-11-15, against `main` @ `c7cf6ca` (PR #5 merged; feature branch `claude/accounting-universe-errors-merge-v0y0kv` has no unmerged commits).
> **Audience:** the coding agent (or engineer) who implements the approved work, without access to the planning conversation.
> **Rule for the implementer:** every statement marked *[verified]* was checked by a command shown in §0.3. Re-run them before you start; if a result differs, the repo has moved and this plan must be re-checked first.

---

## Contents

0. [How to use this document](#0-how-to-use-this-document)
1. [Existing application audit](#1-existing-application-audit)
2. [CBSE XI–XII syllabus coverage matrix](#2-cbse-xixii-syllabus-coverage-matrix)
3. [Architecture and database assessment](#3-architecture-and-database-assessment)
4. [Prioritised P0 / P1 / P2 roadmap](#4-prioritised-p0--p1--p2-roadmap)
5. [UI/UX improvement specification](#5-uiux-improvement-specification)
6. [Accounting calculation validation strategy](#6-accounting-calculation-validation-strategy)
7. [Automated testing strategy](#7-automated-testing-strategy)
8. [Deployment and security recommendations](#8-deployment-and-security-recommendations)
9. [Risk register](#9-risk-register)
10. [Implementation handoff (task-level)](#10-implementation-handoff-task-level)
- [Appendix A — Decisions that need the owner](#appendix-a--decisions-that-need-the-owner)
- [Appendix B — Definition-of-Done checklist (copy per feature)](#appendix-b--definition-of-done-checklist-copy-per-feature)

---

## 0. How to use this document

### 0.1 The one-paragraph summary

The repository contains **two products**. The **live** product (served by GitHub Pages from the repo root) is the **legacy single-file app `index.html`** (353 KB, 18 Class XI modules, accurate scenario banks, but float money, no persistence, no service worker, and hard-coded final-accounts data). The **new** product, `apps/web`, sits on an exact, well-tested accounting engine (`packages/engine`) and a machine-readable 2026-27 syllabus (`packages/curriculum`), and covers all 54 syllabus topics. It is **not deployed**. "Accounting Univers 2.0" should therefore **not be a rewrite**. It is the deliberate **promotion of `apps/web` to the live product**, plus four missing layers:

1. CBSE **learning outcomes** in the data model.
2. Real **Hindi (Devanagari)** content.
3. **Assessment** for the 17 topics that have none.
4. **Human academic sign-off.**

The legacy app's scenario banks get migrated into data, and the legacy app keeps running until v2 reaches parity on each workflow. Work proceeds **one vertical workflow at a time**, starting with Class XI *Transaction → Equation → Journal → Ledger → Trial Balance*.

### 0.2 Weak assumptions in the brief — challenged

| Assumption in the brief | What the evidence says | Consequence for the plan |
|---|---|---|
| "Upgrade the existing application" (as if there were one) | There are two. Users get the legacy app; almost all verified engineering is in `apps/web`. | Decide which is "the product" (Appendix A, **D8**). Recommendation: promote `apps/web`; keep legacy as a "lite" entry until parity. |
| "Map every topic to the syllabus" — done? | Topic mapping exists (54 clauses, SHA-pinned to the official PDF). **Learning outcomes are not modelled at all**, although the PDF has a *Learning Outcomes* column for every unit. | The traceability chain breaks at "Learning Outcome". P0 task T0.2 adds it. |
| "English and Hindi explanations" — partly done? | **Zero Devanagari characters** in the whole repo. What exists is Hinglish (Hindi in Roman script) on 16 concept cards and 10 glossary entries. | Hinglish ≠ Hindi. P0 adds Devanagari for the first vertical. It needs a qualified human reviewer, using NCERT Hindi-medium *लेखाशास्त्र* terminology as the authority (**D10**). |
| "Calculations independently verified" = "academically verified" | Engine results are checked against CBSE marking-scheme answers and hand-worked oracles, with mutation testing. **No qualified human (teacher or accountant) has reviewed any lab.** | Under the brief's own Definition of Done (item 2), **no feature is "complete" today**. Academic sign-off is a P0 gate (**D11**). |
| "Competency-based questions" | 30 question generators exist; almost all test *applying*. The paper design weights items **40 % remembering/understanding · 30 % applying · 30 % analysing/evaluating/creating**. No item is typology-tagged. | P0 adds typology tags and a coverage test; P1 adds case-based / assertion-reason formats checked against the Sample Question Paper. |
| "Teacher-accessible reports" implies a server and database | Today: by design there is no server. Teachers aggregate progress *files* students export. That is privacy-preserving and works offline. | Keep local-first for P0/P1. A backend is P2 and gated on a privacy/legal decision (minors' data; **D5**). |
| "Database assessment" | There is no server database. Persistence is per-device IndexedDB (schema v2) with an in-memory fallback. | §3.3 assesses it as such. Do not introduce a database to satisfy a checklist. |
| "Classroom-tested product" | Nothing has been classroom-tested. Agents cannot do this. | Pilot protocol in §10.6; it is a gate for switching the live site (**D8**). |
| Directive asked for "Redemption of Debentures" earlier | The 2026-27 syllabus prescribes issue *with terms of* redemption but **no redemption entries**. | Stays omitted (D2). Never add topics beyond the PDF. |

### 0.3 Facts re-verified for this document *[verified]*

| Fact | Command | Result on 2026-11-15 |
|---|---|---|
| All checks pass | `tools/check-all.sh` | engine **222**, curriculum **271**, tutor-proxy **12**, browser **260 + 54 + 51 + 8**, legacy smoke + simulator regression **pass** |
| Official PDF unchanged since adoption | `sha256sum` of the stored download and the owner's upload | both `4a87dbd1…7ecc27` (matches `packages/curriculum/src/syllabus.ts` `SOURCE.sha256`) |
| PDF has learning outcomes | `pdftotext -layout` + `grep "Learning Outcomes"` | 7 unit blocks; outcomes are per **unit**, not per topic |
| Paper typology | same text | 40 % / 30 % / 30 % (32 / 24 / 24 of 80 marks) |
| No Devanagari anywhere | Python scan of `apps/web/src`, `packages/*/src`, `index.html` for U+0900–U+097F | **0** characters |
| Topics with no assessment | registry export (`labsOfClause`, `SKILLS`, `CARDS`) | **17 of 54** (list in §2.3) |
| Live site = legacy | `_config.yml` + repo-root `index.html`; `apps/web/dist` is git-ignored | Pages serves root `index.html` and every other root file |
| Stale public files | `ls *.html *.js` | 6 backup HTML files (191–336 KB each) and `test.js`, `test_init.js` sit in the published root |
| Bundle size of v2 | `gzip -c apps/web/dist/assets/index-*.js \| wc -c` | **~121 KB gz** JS (+18 KB CSS raw) |
| No CI, no lint, no workspace | `ls .github package.json`; `grep eslint` | none present |

---

## 1. Existing application audit

### 1.1 Inventory

| Component | Path | Tech | Status |
|---|---|---|---|
| Legacy app (**live**) | `index.html` | Single file, vanilla JS, `innerHTML` templates, dark "neon" theme | 18 Class XI modules (m1–m18). Fixes applied: injected scripts removed; goods-sold logic; depreciation typing; final-accounts boss-fight double count; **F-1** simulator ledger |
| Accounting engine | `packages/engine` | TypeScript, zero runtime deps, Vitest | Exact `Money` (bigint paise), `Fraction`, closed chart of accounts, frozen journal, reversal, audit trail, TB, equation, every Class XI/XII calculator, `Machine` kit |
| Curriculum | `packages/curriculum` | TypeScript, Vitest | 10 units / 54 clauses with official limits; 30 seeded generators; mastery model; 16 bilingual (EN + Hinglish) cards; rescue plan; assignments; teacher report; 13 state-machine specs |
| New web app (**not deployed**) | `apps/web` | Vite 8, TypeScript, vanilla DOM, SVG, IndexedDB, service worker | 32 labs/pages, practice (Beginner/Practice/Board), progress, teacher dashboard (file-based), project assistants, CAS simulator, offline helper "tutor" |
| Tutor proxy (**not deployed**) | `apps/tutor-proxy` | Node 18+, zero deps | Server-side key, output guard (withholds replies containing figures not supplied by the engine), rate and daily limits; tested only against a mock upstream |
| Tests | `packages/*/test`, `e2e/*.cjs`, `tools/check-all.sh` | Vitest, Node test runner, Playwright (Chromium) | All green (§0.3) |
| Docs | `docs/*.md`, `AGENTS.md` | Markdown | Syllabus matrix, audit, engine design, validation report, testing, UI system, state machines (generated), release readiness |

### 1.2 What works (preserve)

**Legacy app** — content is the asset. Earlier audits checked every Cash Book, Rectification, Virtual Client and BRS item against standard CBSE Class XI treatment and found them correct. Scenario banks worth preserving:

| Legacy module | Content | Equivalent in v2? |
|---|---|---|
| m1 Live Equation | 50 transaction templates | Partial — Equation Visualizer has 9 transaction types, not the 50-item bank |
| m2 Transaction Lab | 70 drag-to-Dr/Cr scenes | Partial — Debit & Credit Trainer has 15 items |
| m3 ALERE wheel, m9 Memory Hack | Reflex game, mnemonics | **No** |
| m4 Drag-Drop Lab | ~50 journal scenes | **No** (v2 has free-form journal entry, not scene-based) |
| m5 Equation Game | MCQ impact quiz | **No** |
| m8 CFO Simulator | KPIs from sliders | **No** — enrichment, *not syllabus*; label it as such if ported |
| m10 Cash Book Lab | 30 transactions | Partial — v2 Cash Book Simulator takes free input; no 30-item bank |
| m13 Source Documents | Transaction ↔ document matching | **No** (v2 has a concept card only) |
| m14 Rectification | 6 cases | v2 Error Detective is generic; cases not ported |
| m15 Virtual Client | 25 conceptual MCQs | **No** |
| m16 Tally-style | Computerised-accounting UI | v2 CAS Simulator (Option II) supersedes |
| m18 BRS Detective | Generated recon | v2 BRS lab + generator |
| Gamification | XP / level / badges | **No** (and legacy does not persist them — F-6) |

**v2** — engine, syllabus model, labs, practice, progress, offline, state machines (details in `docs/RELEASE_READINESS.md`, `docs/STATE_MACHINES.md`).

### 1.3 What is broken or weak

**Legacy app** (from `docs/EXISTING_APP_AUDIT.md`; only F-1 has been fixed inside the legacy file):

| ID | Sev. | Defect | Fixed in legacy? | Fixed in v2? |
|---|---|---|---|---|
| F-1 | S1 | Simulator ledger untyped / mis-signed | **Yes** (regression test) | n/a (engine) |
| F-2 | S1 | Money is binary float (`56000.299999999996`); validation tolerates 0.005 | No | **Yes** (bigint paise; float banned by test) |
| F-3 | S2 | No reversal, no IDs, mutable journal, no audit trail | No | **Yes** |
| F-4 | S2 | Perpetual (m1) and periodic (m6/m7) models coexist without telling the student | No | Periodic only; the perpetual view isn't explained either (gap, §5) |
| F-5 | S2 | m1 mirror overwrites student balances with totals | Partially (mirror zeroes before write) | n/a |
| F-6 | S2 | No progress persistence | No | **Yes** (IndexedDB) |
| F-7 | S2 | "Offline-first" claimed, no service worker | No | **Yes** |
| F-8 | S3 | Dead code / unreachable screen | No | n/a |
| F-9 | S3 | Final-accounts data hard-coded, not computed | No | **Yes** (engine `finalAccounts`) |
| F-10 | S3 | Each module has its own state and classifier | No | **Yes** |
| F-11 | S3 | `innerHTML` markup; weak accessibility | No | Mostly (text nodes only; DOM a11y checks; not axe-verified) |
| F-12 | S3 | No Hindi; regex "tutor" | No | Hinglish only; offline helper; proxy ready, not live |

**v2** — known weaknesses (none critical; all listed in `docs/RELEASE_READINESS.md`):
- **Assessment:** no assessment for 17 topics; no learning-outcome layer; no typology tags; no Board blueprint paper.
- **Hindi:** no Devanagari.
- **Academic review:** no human academic review of any lab text or convention.
- **Dissolution lab:** a calculator, not a step-by-step simulation. Animation controls exist only on the ledger page.
- **Verification:** Chromium-only testing; contrast and axe not measured; Lighthouse not run.
- **Repository hygiene:** `packages/curriculum/node_modules` is a **committed symlink** to `../engine/node_modules`. It already broke the GitHub Pages build once, which was fixed by excluding it in `_config.yml`. There is no workspace tooling and no CI.

### 1.4 Calculation and state-management errors found to date

| # | Where | Error | Status |
|---|---|---|---|
| C1 | Legacy m1 | Goods sold did not reduce stock or add margin to P&L | Fixed (legacy) |
| C2 | Legacy | Depreciation lines typed as assets | Fixed |
| C3 | Legacy m12 | Boss-fight double count, wrong-line reduction, reset persistence | Fixed |
| C4 | Legacy m7 | F-1 simulator ledger | Fixed + regression test |
| C5 | Legacy | **F-2 float money** | **Open in live app** |
| C6 | Engine (pre-release) | Commission deducted twice (Q22A) | Fixed, test |
| C7 | Engine (pre-release) | Rejected applicants' money adjusted to allotment (Q26B) | Fixed, test |
| C8 | Official material | SQP Q31A marking scheme omits the printed Wages row (NPBT 13 L → 29 L, +123.08 %, not +105.88 %) | Documented; **needs a teacher's ruling** |
| S1 | v2 | Ledger animation timer leaked after leaving the page; Play dead after the end | Fixed (state machine + test) |
| S2 | v2 | Hints active after submission; double submit guarded only implicitly | Fixed |
| S3 | v2 | Failed load = endless spinner; no banner when storage unavailable | Fixed |
| S4 | v2 | Viewer could start a new CAS year; forfeiture accepted with nothing unpaid | Fixed |

---

## 2. CBSE XI–XII syllabus coverage matrix

### 2.1 Source of truth

- Official PDF: `https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Accountancy_SecP2_2026-27.pdf`, SHA-256 `4a87dbd15758e42c2aa454d83708299a04b6fc12896392b13d12b9ae857ecc27`. Index page: `https://cbseacademic.nic.in/curriculum_2027.html`.
- Machine-readable model: `packages/curriculum/src/syllabus.ts` (units, clauses, official limits). Human matrix with provenance: `docs/CBSE_2026_27_SYLLABUS_MATRIX.md`.
- **Do not commit the PDF** (copyright). Commit its SHA and the verbatim learning-outcome text needed for traceability (short quotations, attributed).
- **Re-verify before every release:** download, compare SHA. If it changed, stop and diff the syllabus before shipping.

### 2.2 Required traceability chain and where each link lives

`Class → Unit → Topic (clause) → Learning Outcome → Simulation → Assessment`

| Link | Exists? | Location / task |
|---|---|---|
| Class, Unit, Topic | Yes | `syllabus.ts` (`UNITS`, `CLAUSES`) |
| **Learning Outcome** | **No** | Add `packages/curriculum/src/outcomes.ts` (T0.2) |
| Simulation | Yes | `apps/web/src/labs/index.ts` (`labsOfClause`, `PAGES`) |
| Assessment | Partial | `SKILLS` (generators), `CARDS` (self-checks) — 17 topics have none |

### 2.3 Current matrix *[verified — generated from the code registry on 2026-11-15]*

"LO" is a placeholder until T0.2 maps the official outcomes. "Assessment" lists practice generators (`` `skill` ``) and concept-card self-checks.

| Clause | Topic (official limit in italics) | Learning outcome | Simulation (v2) | Assessment | Status |
|---|---|---|---|---|---|
| **XI.1** | **Theoretical Framework** (12 marks) | | | | |
| XI.1.intro | Introduction to accounting: meaning, objectives, users, qualitative characteristics | LO-XI.1.? (to map) | — | card “What is accounting?” (2 checks) | cards only |
| XI.1.terms | Basic accounting terms (assets, liabilities, capital, drawings, expenditure, discount …) | LO-XI.1.? (to map) | — | card “Basic accounting terms” (2 checks) | cards only |
| XI.1.concepts | Theory base: GAAP and the accounting concepts | LO-XI.1.? (to map) | — | card “GAAP and accounting concepts” (3 checks) | cards only |
| XI.1.basis | Cash and accrual basis of accounting | LO-XI.1.? (to map) | — | card “Cash basis and accrual basis” (1 checks) | cards only |
| XI.1.standards | Accounting standards: AS and Ind AS (applicability) | LO-XI.1.? (to map) | — | card “Accounting standards: AS and Ind AS” (1 checks) | cards only |
| XI.1.gst | GST: characteristics and advantages | LO-XI.1.? (to map) | Invoice, Trade Discount & GST | card “GST: characteristics and advantages” (2 checks) | interactive |
| **XI.2** | **Accounting Process** (44 marks) | | | | |
| XI.2.vouchers | Source documents and vouchers | LO-XI.2.? (to map) | — | card “Source documents and vouchers” (2 checks) | cards only |
| XI.2.equation | Accounting equation approach: meaning and analysis | LO-XI.2.? (to map) | Accounting Equation Visualizer; Journal → Ledger → Trial Balance | **none** | interactive |
| XI.2.rules | Rules of debit and credit | LO-XI.2.? (to map) | Journal → Ledger → Trial Balance; Debit & Credit Trainer | **none** | interactive |
| XI.2.journal | Journal (book of original entry) | LO-XI.2.? (to map) | Journal → Ledger → Trial Balance; Debit & Credit Trainer | **none** | interactive |
| XI.2.cashbook | Cash book: simple, with bank column, petty cash book | LO-XI.2.? (to map) | Petty Cash (Imprest) Lab; Cash Book Simulator (cash + bank columns) | `cashbook` | interactive |
| XI.2.subsidiary | Purchases, sales, purchases-return, sales-return books and journal proper — *limit: Including trade discount, freight and cartage for simple GST calculation* | LO-XI.2.? (to map) | Invoice, Trade Discount & GST; Subsidiary Books Simulator | `gst` | interactive |
| XI.2.ledger | Ledger: format, posting, balancing | LO-XI.2.? (to map) | Journal → Ledger → Trial Balance | **none** | interactive |
| XI.2.brs | Bank reconciliation statement | LO-XI.2.? (to map) | Bank Reconciliation Lab | `brs` | interactive |
| XI.2.depreciation | Depreciation: SLM and WDV, recording, disposal of an asset — *limit: Excluding change of method* | LO-XI.2.? (to map) | Depreciation Lab | `dep-wdv`; `dep-slm`; `disposal` | interactive |
| XI.2.provisions | Provisions and reserves; types of reserves | LO-XI.2.? (to map) | Provision & Reserve Lab | `pdd-provision`; card “Provisions and reserves” (2 checks) | interactive |
| XI.2.tb | Trial balance — *limit: Balance method only* | LO-XI.2.? (to map) | Error Detective & Suspense Account; Journal → Ledger → Trial Balance | **none** | interactive |
| XI.2.errors | Errors, rectification and suspense account | LO-XI.2.? (to map) | Error Detective & Suspense Account | `suspense` | interactive |
| **XI.3** | **Financial Statements of Sole Proprietorship** (24 marks) | | | | |
| XI.3.concepts | Financial statements: meaning; capital and revenue items; deferred revenue expenditure; opening entry | LO-XI.3.? (to map) | Opening Entry & Capital vs Revenue | `opening-capital`; card “Capital and revenue items; deferred revenue expenditure” (2 checks) | interactive |
| XI.3.trading-pl | Trading and Profit & Loss account: gross, operating and net profit | LO-XI.3.? (to map) | Final Accounts with Adjustments | **none** | interactive |
| XI.3.balance-sheet | Balance sheet: grouping and marshalling | LO-XI.3.? (to map) | Final Accounts with Adjustments | **none** | interactive |
| XI.3.adjustments | Adjustments: closing stock, outstanding/prepaid, accrued/advance income, depreciation, bad debts, provisions, abnormal loss, personal use, interest on capital, manager's commission | LO-XI.3.? (to map) | Final Accounts with Adjustments | `pdd` | interactive |
| XI.3.incomplete | Incomplete records: statement of affairs method — *limit: Excluding the conversion method* | LO-XI.3.? (to map) | Incomplete Records — Statement of Affairs | `soa` | interactive |
| **XI.P** | **Project Work** (20 marks) | | | | |
| XI.P.project | Project: vouchers / BRS / comprehensive sole-proprietorship project (any one) | LO-XI.P.? (to map) | Project Assistant (Class XI) | **none** | interactive |
| **XII.1** | **Accounting for Partnership Firms** (36 marks) | | | | |
| XII.1.fundamentals | Partnership: features, deed, Indian Partnership Act 1932 default provisions | LO-XII.1.? (to map) | Partnership Fundamentals Lab | card “Partnership: features, deed and the Act’s default rules” (3 checks) | interactive |
| XII.1.capital | Fixed vs fluctuating capital accounts | LO-XII.1.? (to map) | Profit & Loss Appropriation Lab; Fixed vs Fluctuating Capital Lab | card “Fixed and fluctuating capital” (1 checks) | interactive |
| XII.1.appropriation | P&L appropriation account: interest, salary, commission, division of profit | LO-XII.1.? (to map) | Profit & Loss Appropriation Lab | `int-drawings` | interactive |
| XII.1.guarantee | Guarantee of profits | LO-XII.1.? (to map) | Profit & Loss Appropriation Lab | `guarantee` | interactive |
| XII.1.past-adjustments | Past adjustments (interest on capital/drawings, salary, profit-sharing ratio) | LO-XII.1.? (to map) | Profit & Loss Appropriation Lab | **none** | interactive |
| XII.1.goodwill | Goodwill: nature, factors, valuation by average profit, super profit and capitalisation — *limit: Only these three methods* | LO-XII.1.? (to map) | Goodwill Valuation Lab | `goodwill-avg`; `goodwill-super` | interactive |
| XII.1.ratio-change | Change in profit-sharing ratio: sacrificing and gaining ratio, revaluation, reserves | LO-XII.1.? (to map) | Change in Profit-Sharing Ratio Lab; Revaluation Account Lab | `sacrifice`; `revaluation` | interactive |
| XII.1.admission | Admission of a partner (goodwill per AS 26, revaluation, capital adjustment) | LO-XII.1.? (to map) | Admission of a Partner Lab; Revaluation Account Lab | `admission-premium` | interactive |
| XII.1.retirement | Retirement of a partner; loan account of the retiring partner | LO-XII.1.? (to map) | Retirement & Death of a Partner Lab; Revaluation Account Lab | `exit-goodwill` | interactive |
| XII.1.death | Death of a partner; share of profit to date of death; executor's account | LO-XII.1.? (to map) | Retirement & Death of a Partner Lab | **none** | interactive |
| XII.1.dissolution | Dissolution: realisation account and settlement — *limit: Excluding piecemeal distribution, sale to a company and insolvency of partners* | LO-XII.1.? (to map) | Dissolution of a Firm Lab | `dissolution` | interactive |
| **XII.2** | **Accounting for Companies** (24 marks) | | | | |
| XII.2.fundamentals | Features and types of companies; share and share capital | LO-XII.2.? (to map) | Share Capital Lab | card “Company: features, types, shares and share capital” (2 checks) | interactive |
| XII.2.issue | Issue and allotment of shares: over/under-subscription, par and premium — *limit: Calls in advance and arrears exclude interest* | LO-XII.2.? (to map) | Calls in Advance Lab; Share Capital Lab | `pro-rata`; `calls-advance` | interactive |
| XII.2.forfeiture | Forfeiture and re-issue of shares | LO-XII.2.? (to map) | Share Capital Lab | `forfeit`; `reissue` | interactive |
| XII.2.concepts | Private placement, ESOP, sweat equity; shares for consideration other than cash | LO-XII.2.? (to map) | Shares for Consideration Other Than Cash | card “Private placement, ESOP, sweat equity, shares for non-cash consideration” (2 checks) | interactive |
| XII.2.disclosure | Disclosure of share capital in the balance sheet (Schedule III) | LO-XII.2.? (to map) | Share Capital Lab | **none** | interactive |
| XII.2.debentures | Debentures: issue at par/premium/discount, with terms of redemption, collateral security, interest — *limit: TDS excluded; redemption accounting is not prescribed* | LO-XII.2.? (to map) | Debentures Lab | `debenture-issue` | interactive |
| **XII.3** | **Analysis of Financial Statements** (12 marks, Option I) | | | | |
| XII.3.statements | Company financial statements in Schedule III format — *limit: Exceptional/extraordinary items and discontinued operations excluded* | LO-XII.3.? (to map) | Company Statements in Schedule III Format; Comparative & Common-size Statements Lab | **none** | interactive |
| XII.3.comparative | Comparative statements | LO-XII.3.? (to map) | Comparative & Common-size Statements Lab | **none** | interactive |
| XII.3.common-size | Common-size statements | LO-XII.3.? (to map) | Comparative & Common-size Statements Lab | **none** | interactive |
| XII.3.liquidity | Liquidity ratios: current and quick | LO-XII.3.? (to map) | Ratio Analysis Lab | `ratio-liquidity` | interactive |
| XII.3.solvency | Solvency ratios: debt-equity, total assets to debt, proprietary, interest coverage, debt to capital employed | LO-XII.3.? (to map) | Ratio Analysis Lab | `ratio-solvency` | interactive |
| XII.3.activity | Activity ratios: inventory, receivables, payables, fixed-asset, net-asset, working-capital turnover | LO-XII.3.? (to map) | Ratio Analysis Lab | `ratio-activity` | interactive |
| XII.3.profitability | Profitability ratios: gross profit, operating, operating profit, net profit, ROI — *limit: Net profit ratio on profit before and after tax* | LO-XII.3.? (to map) | Ratio Analysis Lab | **none** | interactive |
| **XII.4** | **Cash Flow Statement** (8 marks, Option I) | | | | |
| XII.4.classification | Cash flow: meaning, cash equivalents, classification of activities | LO-XII.4.? (to map) | Cash Flow Statement Lab | **none** | interactive |
| XII.4.preparation | Preparation of the cash flow statement per AS 3 (Revised) — *limit: Indirect method only* | LO-XII.4.? (to map) | Cash Flow Statement Lab | `cfo` | interactive |
| **XII.C** | **Computerised Accounting** (20 marks, Option II) | | | | |
| XII.C.cas | Computerised accounting system: features, structure, packages | LO-XII.C.? (to map) | Computerised Accounting Simulator | card “Computerised accounting system: features, structure, packages” (1 checks) | interactive |
| XII.C.spreadsheet | Electronic spreadsheet applications (BRS, asset accounting, loan schedule, ratio analysis) | LO-XII.C.? (to map) | Spreadsheet Lab: loan, depreciation, ratios, BRS | `loan-emi`; card “Electronic spreadsheets for accounting” (1 checks) | interactive |
| XII.C.using | Using a CAS: codification, data entry, adjusting/closing entries, security | LO-XII.C.? (to map) | Computerised Accounting Simulator | card “Using a CAS: codes, data entry, adjusting and closing entries, security” (2 checks) | interactive |
| **XII.P** | **Project / Practical Work** (20 marks) | | | | |
| XII.P.project | Project on analysis of a company (any two aspects) / Practical file and viva (Option II) | LO-XII.P.? (to map) | Project / Practical Assistant (Class XII) | **none** | interactive |

**Topics with no assessment (17):** XI.2.equation, XI.2.rules, XI.2.journal, XI.2.ledger, XI.2.tb, XI.3.trading-pl, XI.3.balance-sheet, XI.P.project, XII.1.past-adjustments, XII.1.death, XII.2.disclosure, XII.3.statements, XII.3.comparative, XII.3.common-size, XII.3.profitability, XII.4.classification, XII.P.project.

The first five are the foundation of the whole subject. (The Debit & Credit Trainer records attempts under a non-generator id, so they never reach practice or Board mode.)

### 2.4 Omitted, additional and outdated topics

| Kind | Item | Action |
|---|---|---|
| Omitted (no topic missing; **depth** gaps) | Learning outcomes; Board-pattern paper; case-based / assertion-reason items; Class XI sample-paper validation (no Class XI SQP obtained — D7) | P0/P1 tasks |
| Additional (not in syllabus) | Legacy m8 CFO Simulator; legacy gamification | Keep only if labelled "Enrichment — not in the CBSE 2026-27 syllabus". Never in assessment |
| Misplaced | Legacy m16 Tally-style sits in a Class XI app but belongs to **Class XII Option II** | Do not port to XI; v2 CAS supersedes it |
| Deliberately excluded by the syllabus | Debenture redemption entries; interest on calls in arrears/advance; TDS; conversion method; piecemeal distribution; goodwill methods other than three; change of depreciation method; direct cash-flow method | Keep enforced (tests exist) |
| Outdated? | Legacy content was written before the 2026-27 PDF was adopted. Its banks were checked for *correctness*, not for *scope* | T0.5 scopes each migrated item to a clause; drop or flag anything out of scope |
| Official inconsistencies | Option II replaces only Part B (rationale paragraph says otherwise); unit numbering differs between the marks table and body; SQP Q31A wages row | Recorded in the syllabus matrix and validation report; teacher ruling needed on Q31A |

---

## 3. Architecture and database assessment

### 3.1 Current architecture

```
packages/engine      pure TS, exact arithmetic, no I/O          ← single source of accounting truth
packages/curriculum  pure TS: syllabus, generators, mastery, machines (imports engine via relative path)
apps/web             Vite + TS + DOM; imports both packages by relative path; IndexedDB; service worker
apps/tutor-proxy     optional Node server; never computes accounting figures
index.html           legacy, independent, live
```

**Strengths** (keep): no runtime dependencies (security, bandwidth, longevity); pure logic is fully testable; data-driven labs (`Lab` objects) are rendered and browser-tested generically; state machines as data (`docs/STATE_MACHINES.md`); local-first privacy.

**Weaknesses** (fix, but do not rewrite):

| # | Weakness | Evidence | Recommended change | Why not leave it |
|---|---|---|---|---|
| A1 | Package wiring by relative paths plus a committed symlink | `packages/curriculum/node_modules → ../engine/node_modules`; broke Pages once | Root `package.json` with **npm workspaces** (`packages/*`, `apps/*`); remove the symlink (**D9**) | Fragile CI, fresh clones and hosting |
| A2 | No CI | no `.github/` | Add the workflow from `docs/ci/github-actions.example.yml` (needs a token with `workflow` scope; **D12**) | Tests only run when someone remembers |
| A3 | No linter / formatter | none configured | ESLint (typescript-eslint) + Prettier, **no reformat of legacy `index.html`** | Consistency for multiple agents |
| A4 | Two products | §0.1 | Promote v2 (D8), keep legacy as "lite" until per-workflow parity | Students otherwise get float money and no persistence |
| A5 | Learning outcomes absent | §2.2 | `outcomes.ts` + mapping + tests | Traceability requirement |
| A6 | i18n absent | only Hinglish strings inside data | Message catalogue `packages/curriculum/src/i18n/{en,hi}.ts` with typed keys; the language is a profile setting | Hindi requirement; avoids string duplication in labs |

**Do not:** introduce React, a component framework or a CSS framework. The current vanilla-DOM approach meets the bundle budget (121 KB gz), is tested, and nothing in the brief requires a framework. Changing it would be a rewrite without evidence.

### 3.2 Legacy → v2 transition (strangler, per workflow)

1. Build each vertical in v2 to parity with the legacy module(s) it replaces, **including migrated scenario banks** (§10, T0.5).
2. Publish v2 under `/v2/` as a preview (**D8a**). The root stays legacy.
3. After the pilot (§10.6) and owner approval (**D8b**), make v2 the root and keep the legacy app at `/lite/` with a notice.
4. Never delete legacy content without approval. Backup HTML files are removed from the *published* site only with approval (**D9**).

### 3.3 Data / "database" assessment

| Store | Contents | Assessment | Action |
|---|---|---|---|
| IndexedDB `accounting-universe` v2 | stores: attempts, seen, profile, assignments, projects | Adequate for local-first. Risks: no **migration tests** across versions; no quota handling; memory fallback is now announced to the user | Add migration tests (v1 → v2 → v3 fixtures); add `navigator.storage.persist()` request; export reminder |
| Export file (JSON v1) | student progress for teachers | Validated by `parseExport`; no signature (a student could edit their file) | Acceptable for formative use. State it in the teacher UI. Do not use for grading |
| Assignment file | teacher → students | Validated; deterministic seeds | OK |
| Server DB | none | Intentional (privacy, offline, cost) | P2 only, gated by **D5**: lawful basis and parental consent for minors' data, data minimisation, retention, location of storage. Needs legal review before design |

---

## 4. Prioritised P0 / P1 / P2 roadmap

**Execution rule:** one vertical workflow at a time, each meeting Appendix B before the next starts. Units are ordered by marks weight and dependency.

### P0 — Release 2.0-alpha: one complete, verified vertical + the cross-cutting layers it needs

**Vertical V1: Class XI "Transaction → Accounting Equation → Journal → Ledger → Trial Balance"** (XI.2.equation, XI.2.rules, XI.2.journal, XI.2.ledger, XI.2.tb; Unit 2 = 44 marks).

Why first: it is the prerequisite for everything else, it has labs but **no assessment**, it is where legacy content is richest (m1, m2, m4, m5, m7, m11), and it exercises every cross-cutting layer once.

| ID | Task | Outcome |
|---|---|---|
| T0.1 | Repo foundations: npm workspaces, remove the symlink (D9), ESLint/Prettier, CI (D12) | Fresh clone → `npm ci && npm test` works; CI green |
| T0.2 | Learning-outcome layer: transcribe the official unit LOs verbatim; map LO ↔ clause; tests | Traceability for all 54 clauses (LO mapping reviewed by D11 reviewer) |
| T0.3 | Assessment for V1: generators for equation impact, Dr/Cr choice, journal entry (multi-line), posting/balancing, TB (incl. suspense-free agreement); typology tags on every generator | V1's 5 clauses have ≥1 generator each in all 3 typology bands |
| T0.4 | Hindi (Devanagari) for V1: i18n catalogue, glossary per NCERT Hindi medium, language toggle, rendering tests | Every V1 string has `hi` text reviewed by a qualified person (D10) |
| T0.5 | Migrate legacy banks for V1 (m1 50 templates, m2 70 scenes, m4 ~50 journal scenes, m5 MCQs, m11 TB items) into typed data; **each item re-verified by the engine**; scope-tagged to clauses | Parity with legacy for V1; legacy defects not copied |
| T0.6 | Stepwise feedback for V1: "why correct / why wrong" from the rule engine (`ruleText`) and distractor detection | Every wrong answer gets a rule-based explanation |
| T0.7 | Teacher report for V1 by LO (extends heat-map) | Teacher sees mastery per LO, not only per clause |
| T0.8 | Academic sign-off for V1 (D11) and accessibility pass (axe in CI) | Signed review record; zero serious axe violations |
| T0.9 | Preview deployment of v2 at `/v2/` (D8a) via GitHub Actions artifact deploy; stop publishing backups/tests from the root (D9) | Preview URL; root unchanged |

### P1 — 2.0-beta: remaining verticals, in this order

| # | Vertical | Clauses | Notes |
|---|---|---|---|
| V2 | XI Unit 2 remainder: vouchers, cash book, subsidiary books, BRS, depreciation, provisions, errors & suspense | XI.2.* | Migrate legacy m10, m13, m14, m18 banks |
| V3 | XI Unit 3: final accounts with adjustments, incomplete records, capital/revenue | XI.3.* | Add assessment for trading-pl, balance-sheet; resolve F-4 by stating the inventory model in UI |
| V4 | XII Partnership (36 marks) | XII.1.* | Add assessment for past-adjustments, death; step-by-step dissolution simulation |
| V5 | XII Companies (24 marks) | XII.2.* | Assessment for disclosure (Schedule III note) |
| V6 | XII Option I Analysis + Cash Flow (20 marks) | XII.3.*, XII.4.* | Assessment for statements, comparative, common-size, profitability, classification |
| V7 | XII Option II Computerised Accounting | XII.C.* | Existing CAS simulator + spreadsheet lab; academic review |
| V8 | Board-pattern papers | — | Class XII blueprint: 34 Q / 80 marks; 1×20, 3×6, 4×3, 6×5; internal choice; 40/30/30 typology. Class XI only after D7 |
| V9 | Projects (XI.P, XII.P) | — | Assistants exist; add LO mapping and teacher rubric view |

### P2 — later, each behind an owner decision

| Item | Gate |
|---|---|
| AI tutor live (proxy deployed with key) | D4 + security review §8.4 |
| Accounts / sync / central teacher dashboard | D5 + legal review |
| Gamification (port legacy XP/badges, persisted) | Product decision; never in assessment scores |
| Enrichment modules (CFO simulator) | Labelled non-syllabus |
| Safari/Firefox/real-device matrix, Lighthouse budget gate | Before 2.0 GA |

**Explicitly out of scope** (from the brief): ERP, school administration, generic chatbot, multi-agent frameworks.

---

## 5. UI/UX improvement specification

| Area | Specification | Acceptance test |
|---|---|---|
| Layout | Mobile-first single column ≤ 959 px; **workbench split** ≥ 960 px: left = instructions, data and inputs; right = live output (journal, ledger, visual, explanation). The lab page `tabpanel` becomes a two-pane grid on the Try tab | Playwright at 390 / 768 / 1280 px: no horizontal page scroll, inputs and output both visible at 1280 |
| Language | Global EN/हिन्दी toggle in the header, stored in the profile, applied to all strings via the i18n catalogue; `lang="hi"` on Hindi content; font stack adds `"Noto Sans Devanagari"` (already in CSS) with line-height ≥ 1.6 for Devanagari | Screenshot test in both languages; no clipped matras; `lang` attribute present |
| Numbers | Indian grouping (₹1,23,456.00) everywhere (exists); **tabular numerals**; in statements show deductions in parentheses `(₹5,000.00)` as in CBSE answers, never a bare hyphen; Western digits in both languages (as in CBSE papers) | Unit test of formatter; visual check |
| Feedback | Every check shows: verdict → the rule that decides it → the student's mistake (distractor match) → the correct working, step by step, revealed one step at a time in Beginner mode | Browser test for each V1 generator |
| Guided learning | Learn → Worked example → Try (exists) plus the 5-level rescue plan; show the current LO at the top of each lab | LO visible on each V1 page |
| Inventory model | Where Stock vs Purchases matters (F-4), a one-line banner states which model the lab uses and why | Present on V1 and V3 labs |
| Accessibility | WCAG 2.2 AA target; axe-core in CI (zero serious/critical); 44 px targets (exists); focus rings (exist); unavailable actions explained (exists) | axe report in CI artifacts |
| Low bandwidth | Budgets: JS ≤ 150 KB gz (now ~121 KB), first load ≤ 300 KB total, no web fonts downloaded by default (use system Devanagari font; offer download only if missing); offline after first visit (exists) | Build-time size check script fails over budget |
| Visual identity | Keep v2's calm palette and light/dark tokens; do **not** port the legacy neon theme | Design review |
| States | Loading, empty, error-with-retry, and "why unavailable" patterns (exist; see `docs/STATE_MACHINES.md`) are required on every new screen | State-machine browser suite extended per screen |

---

## 6. Accounting calculation validation strategy

1. **Oracle hierarchy** (use the highest available, never the engine's own output):
   1. CBSE marking-scheme answers for the 2026-27 Sample Question Paper.
   2. NCERT textbook worked examples (cite chapter and illustration number).
   3. Hand-worked cases by the academic reviewer, with the arithmetic written in the test.
   4. Invariants and property tests: Dr = Cr; A = L + C; allocations sum exactly; reversals net to zero.
2. **Every calculator** has ≥ 1 oracle test at levels 1–3 and ≥ 1 invariant test. Mutation checks (`packages/engine/test/mutation-*.py`) must kill every listed mutant; add mutants for each new calculator.
3. **Conventions register** (`docs/ACCOUNTING_VALIDATION_REPORT.md`). Conventions the engine chooses where textbooks vary, such as:
   - forfeiture amount
   - PDD before discount provision
   - insufficient-profit scaling
   - interest on a partner's loan as a charge

   Each needs **reviewer sign-off**, and the UI must state the convention where a student might meet a different one.
4. **Discrepancy log:** official-material errors (Q31A) are recorded with both answers. The app follows arithmetic and says so.
5. **Content banks** migrated from legacy are verified **by the engine at test time** (each item's expected answer is recomputed and must match the stored answer). A mismatch blocks the build and goes to the reviewer.
6. **Rounding policy:** paise exact; explicit `HALF_UP` unless a source specifies otherwise; largest-remainder for shares (exists).
7. **Academic sign-off record** — one file per clause in `docs/academic-review/<clause>.md` holding:
   - the reviewer's name and qualification
   - the date
   - the cases reviewed
   - the conventions accepted
   - the text reviewed (EN/HI)
   - any open issues

   A feature without a signed record is not Done (Appendix B).

---

## 7. Automated testing strategy

| Layer | Tool | Exists | Add for 2.0 |
|---|---|---|---|
| Engine unit, oracle, property, mutation | Vitest, Python mutation scripts | Yes (222 + 35 mutants) | Oracles for every new calculator |
| Curriculum: generators (1,500 seeds each), syllabus integrity, machines, routes, generated docs | Vitest | Yes (271) | **LO coverage test:** every LO ↔ ≥ 1 clause, every clause ↔ ≥ 1 LO; **typology coverage** per vertical; **bank verification** (each migrated item recomputed) |
| i18n | Vitest | No | Every key present in `en` and `hi`; no Latin-only `hi` strings for V1; placeholders consistent |
| Browser: labs generic (example, blank, garbage, reset), flows, state machines, tutor ↔ proxy (mock) | Playwright (Chromium) | Yes (373 checks) | Per-vertical flow tests; Hindi screenshots; workbench layout at 3 widths |
| Accessibility | axe-core in Playwright | No | Zero serious/critical on every route |
| Performance / size | build script | No | Size budget gate; Lighthouse (mobile, slow 4G) in CI, report only at first |
| Persistence | Playwright + IndexedDB fixtures | Partial | Schema migration v1 → v2 → v3; memory fallback (exists) |
| Legacy | Playwright | Yes (smoke + regression) | Keep running until legacy is retired |
| Cross-browser | Playwright WebKit/Firefox | No | Before 2.0 GA (P2) |

**Rules:**
- Tests must be able to fail. Show this with a mutant or a pre-fix run for each new suite.
- No sleeps: wait on `data-state` / `data-app` (see `AGENTS.md`).
- `tools/check-all.sh` stays the single local command; CI runs the same.

---

## 8. Deployment and security recommendations

### 8.1 Current state *[verified]*

- GitHub Pages builds the repo root with Jekyll. `_config.yml` excludes `node_modules`, `packages`, `apps`, `e2e`, `tools`, `AGENTS.md`.
- **Still published:** the 6 backup HTML files, `test.js`, `test_init.js`, `check_syntax.js`, and `docs/*.md`. A pattern scan of the tracked files for API keys, cloud keys, GitHub tokens and private keys (`git grep -E 'sk-ant-…|AKIA…|ghp_…|BEGIN … PRIVATE KEY|api_key = "…"'`) found **no hits** on 2026-11-15. The files are clutter that confuses users and exposes stale, defective versions of the app.

### 8.2 Recommended pipeline (needs D8a + D12)

1. GitHub Actions: `npm ci` → `tools/check-all.sh` → build `apps/web` → assemble `site/` = legacy `index.html` at root + `apps/web/dist` at `/v2/` → `actions/upload-pages-artifact` → `actions/deploy-pages`. Pages source switches to "GitHub Actions", so only built artefacts are published and the backups disappear from the site without deleting them from git.
2. `vite.config.ts` already uses `base: './'`, so `/v2/` works without change. Service-worker scope = `/v2/` (it registers `./sw.js`).
3. **No production switch** (v2 at root) without D8b.

### 8.3 Web security

- Add a Content-Security-Policy `<meta>` to v2: `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self' <tutor-proxy-origin>`. The app has no inline scripts.
- Keep the zero-runtime-dependency policy; pin dev dependencies with lockfiles; enable Dependabot alerts.
- `innerHTML` is not used in v2 (text nodes only). Keep it that way (lint rule `no-restricted-properties` for `innerHTML`).

### 8.4 AI tutor (P2, D4)

- **Hosting:** host the proxy on a platform with secret storage. Set `TUTOR_ORIGIN` to the site origin; set `TUTOR_DAILY_CAP` and `TUTOR_RPH` to budgeted values.
- **Requests:** keep the request free of student identity (already true).
- **Before go-live:** run against the live API in a staging origin. Record the output-guard withhold rate on 100 real questions. Confirm hint mode does not leak answers, with a teacher present.
- **Model:** current default `claude-haiku-5-5`, set by env `TUTOR_MODEL`. Confirm the model choice and pricing at deployment time; do not hard-code it.

### 8.5 Privacy

- Students are minors. Today no data leaves the device; keep that true until D5.
- Any server-side processing needs a legal review under India's Digital Personal Data Protection Act, 2023, covering consent for children's data, purpose limitation and retention. This plan does not substitute for that review.

---

## 9. Risk register

| ID | Risk | L | I | Mitigation | Owner | Trigger to act |
|---|---|---|---|---|---|---|
| R1 | Students keep using the live legacy app with float money and no saved progress | H | H | D8 preview → pilot → switch | Owner | Now |
| R2 | Hindi text inaccurate or non-standard terminology | H (if machine-translated) | H | NCERT Hindi-medium glossary as authority; qualified reviewer (D10); no unreviewed machine translation shipped | Reviewer | Any `hi` string without sign-off |
| R3 | Convention disagreement with a school's teacher (e.g. PDD order, forfeiture) | M | M | Conventions stated in UI; sign-off record; switchable only if the syllabus allows | Reviewer | Teacher complaint |
| R4 | Syllabus revised mid-year | L | H | SHA re-verification step each release; matrix diff | Implementer | SHA mismatch |
| R5 | Agent "completes" features without academic verification | H | H | Appendix B gate; CI check that each Done clause has a review file | Implementer | PR without review file |
| R6 | Scope creep (gamification, enrichment, chatbot) delays verticals | M | M | One vertical at a time; P2 gates | Owner | New feature request mid-vertical |
| R7 | IndexedDB schema change loses progress | L | H | Migration tests; export reminder; never delete stores | Implementer | Schema version bump |
| R8 | Pages / build breakage (symlink, Jekyll) | M | M | Workspaces (A1); Actions-based deploy (§8.2) | Implementer | Any Pages failure |
| R9 | Tutor cost overrun or prompt abuse | M | M | Daily cap, per-IP limit, output guard, staging trial | Owner | D4 |
| R10 | Privacy breach if a backend is added hastily | L | H | D5 legal review; data minimisation | Owner | Any server-side storage proposal |
| R11 | Legacy scenario banks contain out-of-scope or outdated items | M | M | T0.5 scope tagging + engine re-verification | Reviewer | Bank migration |
| R12 | Accessibility claims unverified | M | M | axe in CI; manual screen-reader pass before GA | Implementer | GA |
| R13 | Single maintainer / agent context loss | M | M | This handoff, `AGENTS.md`, generated docs, CI | Owner | — |
| R14 | Board-paper blueprint misread | L | H | Encode blueprint as data with a test against the SQP structure | Implementer | V8 |

---

## 10. Implementation handoff (task-level)

### 10.1 Before you start

```bash
git checkout main && git pull
tools/check-all.sh            # must be ALL CHECKS PASSED; if not, stop and report
cat AGENTS.md docs/STATE_MACHINES.md docs/RELEASE_READINESS.md
```

**Non-negotiables** (from `AGENTS.md`, restated):
- Money is never a float.
- The engine computes; nothing else does.
- Syllabus limits are features.
- Never claim without a test.
- No secrets.
- Progress stays on the device.
- Do not refactor `index.html`.
- **Owner approval is required** for every item in Appendix A, for any deletion, and for any deployment.

### 10.2 T0.1 Repository foundations (needs D9, D12)

- Add a root `package.json` with `"workspaces": ["packages/*", "apps/*"]`. Make `packages/curriculum` depend on `@accounting-universe/engine` (`"*"`). Keep the relative imports working, or switch imports to the package name *in one PR with no other change*.
- `git rm packages/curriculum/node_modules` (the symlink; approval D9). Verify fresh-clone `npm ci && tools/check-all.sh`.
- ESLint (typescript-eslint, `no-restricted-properties` for `innerHTML`, `no-restricted-globals` for `parseFloat` in `packages/engine`) and Prettier. Format only `packages/` and `apps/`.
- Copy `docs/ci/github-actions.example.yml` to `.github/workflows/ci.yml` (D12). Add the axe step later (T0.8).
- **Done when:** a fresh clone passes; CI is green on a PR.

### 10.3 T0.2 Learning outcomes

- **Source:** the "Learning Outcomes" column of the official PDF, 7 unit blocks (XI Units 1–3 including project; XII Partnership, Companies, Analysis, Cash Flow; check whether Option II has its own block and record what you find).
- **Create `packages/curriculum/src/outcomes.ts`:**
  ```ts
  export interface Outcome { id: string; unit: string; text: string; clauses: string[]; source: { pdfSha256: string; unitHeading: string } }
  // id format: 'LO-XI.2-07' (unit, two-digit order as printed). text = verbatim from the PDF (fix only obvious OCR/typo such as "modem" → keep verbatim and add a `note`).
  ```
- **Tests:**
  - every outcome's `unit` exists and its `clauses` exist and belong to that unit;
  - every clause of a theory unit is covered by ≥ 1 outcome;
  - outcome count per unit equals the count recorded in a fixture taken from the PDF;
  - the SHA equals `SOURCE.sha256`.
- **UI:** show the clause's outcomes on each lab's Learn tab and in the teacher report (T0.7).
- **Review:** the D11 reviewer signs the LO ↔ clause mapping (it is a judgement).

### 10.4 T0.3–T0.6 Vertical V1 (Class XI core)

**Assessment generators** (in `packages/curriculum/src/questions.ts`, same contract as existing generators):

| Skill id | Clause | Typology | Item |
|---|---|---|---|
| `eq-impact` | XI.2.equation | Understanding | "Effect on A / L / C" of a transaction (MCQ-style TEXT part + amount) |
| `eq-balance` | XI.2.equation | Applying | Find the missing figure after 3–5 transactions |
| `drcr-choose` | XI.2.rules | Remembering/Understanding | Choose Dr and Cr accounts (TEXT parts), reusing trainer data |
| `journal-entry` | XI.2.journal | Applying | Multi-line entry. Needs a new part kind `ENTRY` with a checker comparing account and side sets plus amounts |
| `ledger-balance` | XI.2.ledger | Applying | Post 4–6 entries; balance c/d of one account, with side |
| `tb-agree` | XI.2.tb | Analysing | Given balances, find the error or the suspense amount and side |
| `case-ledger` | XI.2.ledger/tb | Analysing/Evaluating | Short case + 2–3 linked parts (competency-based) |

- **Typology:** add `typology: 'RU' | 'AP' | 'AEC'` to `Gen` and `Question`. Test that V1 has items in all three bands, and that the global share across XI generators is reported (not forced) against 40/30/30.
- **Feedback (T0.6):** every V1 generator provides distractors keyed to the classic mistakes and a `working` that cites the rule (`ruleText`):
  - drawings treated as an expense;
  - furniture treated as purchases;
  - debit and credit swapped;
  - personal account confused with nominal.
- **Bank migration (T0.5):**
  - Write a read-only extraction script (Node, no edits to `index.html`). It pulls the arrays behind m1, m2, m4, m5 and m11 into `packages/curriculum/src/banks/xi-v1.json`.
  - Each item gets: `clause`, `typology`, `expected` (recomputed by the engine), `legacyRef`.
  - Test: the recomputed expectation equals the legacy answer. Any mismatch is listed for the reviewer, never auto-fixed.
- **UI:**
  - The Equation Visualizer and Trainer read from the migrated banks.
  - The Practice page offers the new skills.
  - The Learn tab shows the LOs.
- **Hindi (T0.4):**
  - Create `packages/curriculum/src/i18n/en.ts` and `hi.ts` as typed key maps. Labs reference keys for V1 strings only.
  - Seed `hi` from the NCERT Hindi-medium glossary (D10 reviewer supplies or approves it).
  - Tests check key parity, and that every V1 key has Devanagari in `hi`.
- **Done when:** Appendix B is satisfied for all 5 clauses.

### 10.5 T0.7–T0.9

- **T0.7 Teacher report by LO:**
  - Add `classReport` grouping by `Outcome.id` via clause mapping. Add a heat-map column per LO and a CSV column.
  - Test with fixtures: two students, three LOs.
- **T0.8 Academic sign-off and axe:**
  - Add a `docs/academic-review/` template.
  - Add `@axe-core/playwright` to the browser suite (zero serious/critical) and to CI.
- **T0.9 Preview deploy (D8a, D12):** implement §8.2. Confirm:
  - the legacy root is unchanged;
  - `/v2/` is offline-capable;
  - backups are no longer served.

### 10.6 Classroom pilot protocol (gate for D8b)

1. **Participants:** 1–2 Class XI sections, one teacher, V1 only, 2 weeks, devices as students actually use (shared Android phones included).
2. **Measures:** completion of V1 rescue levels; pre/post 10-item check built from V1 generators; error-type tally (teacher report); teacher-rated clarity of EN and HI text; crash/stuck reports (state machines record history locally — collect only with consent and only state names).
3. **Exit:** no S1 defects; teacher sign-off; owner decision D8b.

### 10.7 Working agreement for the implementer

- One PR per task. Each PR includes the test evidence (command plus pass counts) and updates `docs/CHANGELOG.md` and `docs/RELEASE_READINESS.md`.
- Never mark a clause Done without its review file.
- Regenerate generated docs (`UPDATE_DOCS=1 npx vitest run test/machines.test.ts`).
- If evidence contradicts this plan, stop and report; do not improvise scope.

---

## Appendix A — Decisions that need the owner

| ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| D1–D3 | Strangler stack; omit debenture redemption; Option II after Option I | Already assumed (see roadmap doc) | — |
| D4 | Deploy the AI tutor (host + API key + budget) | P2, after staging trial | P2 tutor |
| D5 | Any backend / accounts / central teacher data | Not before legal review | P2 sync |
| D6 | Repository licence | Choose before inviting contributors | Public contribution |
| D7 | Provide a Class XI Sample Question Paper + marking scheme | Needed for XI oracles and XI board papers | V8 (XI) |
| **D8a** | Publish v2 as a preview at `/v2/` | **Yes** | T0.9 |
| **D8b** | Make v2 the live root (legacy → `/lite/`) | After pilot | Release |
| **D9** | Remove the committed symlink; stop *publishing* (not deleting) backup HTML / test JS | **Yes** | T0.1, T0.9 |
| **D10** | Hindi reviewer and glossary authority (NCERT Hindi medium) | Name a qualified person | T0.4 |
| **D11** | Academic reviewer (Accountancy teacher / CA) for conventions, LO mapping and lab text | Name a person; sign-off per clause | Every Done |
| **D12** | Allow a GitHub token with `workflow` scope (CI + Pages via Actions) | **Yes** | T0.1, T0.9 |
| D13 | Teacher's ruling on SQP Q31A wages discrepancy | Follow arithmetic, show both | V6 |

## Appendix B — Definition-of-Done checklist (copy per feature)

```
Feature: ______________________   Clauses: ______________   Vertical: V_
[ ] 1 Syllabus: clauses + learning outcomes mapped (outcomes.ts), SHA unchanged
[ ] 2 Academically verified: docs/academic-review/<clause>.md signed (name, qualification, date, cases, conventions, EN/HI text)
[ ] 3 Calculations: oracle tests (level 1–3) + invariants + mutants killed — paste counts
[ ] 4 Visualisation: browser test waits on data-state and asserts the rendered result
[ ] 5 Mobile: 390 px flow test passes; no horizontal scroll; 44 px targets
[ ] 6 No critical regression: tools/check-all.sh ALL CHECKS PASSED — paste summary
[ ] 7 Docs: CHANGELOG, RELEASE_READINESS, syllabus matrix, STATE_MACHINES (regenerated) updated
[ ] 8 Evidence: PR description contains the commands and their output
[ ] Hindi: all strings of this feature have reviewed Devanagari text
[ ] Accessibility: axe zero serious/critical on affected routes
```
