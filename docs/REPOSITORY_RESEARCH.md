# Repository Research (Phase 0)

Method: shallow, blob-filtered clones of the default branch; read README, root file tree, licence text,
and specific files named below. **Depth is limited**: this is architecture reconnaissance, not a full
source audit. No third-party code was executed, copied, or vendored. Licences were read from the
`LICENSE`/`COPYING` file in each repo root (verified, not assumed).

## Summary

| # | Repository | Licence (verified) | Stack | Code reuse permitted? | Use as |
|---|---|---|---|---|---|
| 1 | `carolynf2/Educational_Accounting_Simulator` | **No licence file** at root | Vanilla HTML/JS | **No** (all rights reserved by default) | Learning-design reference only |
| 2 | `aleksfet/LedgerLab` | **No licence file** at root | Vanilla JS + Node `assert` tests | **No** | Structure/testing-pattern reference only |
| 3 | `ildrm/ledgerly-international-accounting-platform` | **MIT** (© 2026 Shahin ILDEREMI) | NestJS, Next.js, PostgreSQL, Drizzle, Vitest | Yes with notice — but little portable | Architecture decisions (ADRs) |
| 4 | `Gnucash/gnucash` | **GPL v2 or v3** | C/C++ | **No** (copyleft; would encumber this app) | Behavioural reference |
| 5 | `beancount/beancount` | **GPL v2** (`COPYING`) | Python | **No** | Validation-concept reference |
| 6 | `ledger/ledger` | **BSD-style** (John Wiegley; 3-clause text, confirm full wording before any reuse) | C++ | Possible with notice, but not useful here | Concept reference |
| 7 | `frappe/erpnext` | **GPL v3** | Python/Frappe | **No** | Workflow reference |

Where there is no licence, or the licence is copyleft, treat as **ideas only**: re-derive independently,
write new code, do not paste or transliterate.

## Per-repository findings

### 1. Educational_Accounting_Simulator — learning design
Files: `js/{transaction-engine,journal-system,ledger-manager,statements-builder,progress-tracker,document-manager,storage-manager,company-data}.js`.
Worth adopting (as concepts): a **virtual-company scenario spine** (three business types, ~30 days of
transactions) driving every step from source document → journal → ledger → TB → statements;
a `JournalSystem` with named validation rules (≥2 lines, debit/credit mutual exclusivity per row);
a `ProgressTracker` with skill mastery across ~15 concepts, achievements and *mistake-pattern
analysis*. Weakness to avoid: logic is entangled with DOM event binding (`bindEvents` in the same class as the rules).

### 2. LedgerLab — separation of logic from UI, and tests
Files: `journal-entry.js`, `depreciation.js`, `bank-reconciliation.js`, `cash-flow.js`, `income-statement.js`, `tests/*.test.js`.
Worth adopting: each calculator is a **pure module with no DOM** exporting an API, unit-tested in Node
with built-in `assert`; a single chart-of-accounts table is the source of truth for type and normal
side ("direction derived, never re-typed per transaction"); straight-line schedule with **final-year
true-up** so book value lands exactly on salvage. **Do not copy its money model**: it uses
`Math.round(v*100)/100` on binary floats — the exact pattern the directive forbids.

### 3. Ledgerly — the right principles
Read in full: `docs/adr/0003-exact-money.md` ("never use binary floating point"; amounts exact decimal,
rounding mode explicit, tests beyond JS safe-integer range) and `0004-immutable-ledger.md` ("posted
journals are immutable; correct errors with linked equal-and-opposite journals; reversal reasons/dates
first-class"). Also: modular monolith, tenancy, a feature-matrix doc tracking what is *verified*.
Adopt the **principles**; reject the infrastructure (Docker/Postgres/NestJS is unwarranted for an offline classroom tool).

### 4–6. GnuCash, Beancount, Ledger — correctness vocabulary
Not read at source depth. From structure/READMEs: account hierarchy, multi-split transactions, and
Beancount's separation of *parse → validate → report* with explicit balance assertions. Take the
idea of **balance assertions** (a student states "Cash should be ₹X now", the engine checks) as a
teaching device; GPL forbids reusing their code.

### 7. ERPNext — realistic scenarios
Not read at source depth. Useful only as a checklist for believable flows (purchase invoice → payment
entry → GL). GPL v3: ideas only. Caution: ERPNext's perpetual-inventory/GST machinery is far beyond the CBSE scope and must not leak into exam mode.

## Decisions taken from this research

1. **Exact money**: integer minor units (paise) in a `Money` type; explicit rounding policy; property tests. (Ledgerly ADR-0003)
2. **Immutable journal + reversal entries**, never edit/delete; correction = linked opposite entry. (ADR-0004)
3. **Pure, DOM-free calculators** with Node tests for every lab. (LedgerLab pattern)
4. **One chart of accounts** as the only classification source. (LedgerLab, GnuCash)
5. **Scenario spine** for the business simulator and **mistake-pattern tracking** for remediation. (EAS)
6. **Balance assertions** as a pedagogical device. (Beancount concept)
7. No code is copied from any repository.

## Risks

* Two reference repos have no licence → do not reuse code.
* Three are GPL → cannot be linked or copied into a non-GPL product.
* Reference repos' accounting scope (perpetual inventory, multi-currency, GST/VAT, IFRS) exceeds
  CBSE; importing their treatments would violate "prescribed topics only".

---

# Phase 1 (2026-11-23): learning science and hands-on UX

Question this round: *the content and the engine are unusually strong — what do the best learning products do that this
app still does not?* Method: GitHub search API (queries such as "double entry accounting game", "spaced repetition
scheduler", "virtual business simulation education") plus repo metadata (`stars`, `licence`, `archived`) read from the API
on 2026-11-23. **No third-party code was copied, vendored or executed.** Copyleft repositories are read as ideas only.

## What the search says about this niche

The accounting-learning-game category is thin: the highest-starred dedicated results are starter projects
(`accounting-tycoon-game`, `ACCOQUEST`, `accounting-battle`, all 0★). There is no credible open-source competitor doing
CBSE-scoped, marking-scheme-accurate practice. **The differentiator is not graphics; it is exact marking and a memory
model.** That is where effort should go. By contrast, the adjacent categories (spaced repetition, plain-text accounting,
local-first finance) are mature and worth learning from.

| Repository | ★ | Licence (API) | What it is good at | Taken this round | Code reuse |
|---|---:|---|---|---|---|
| `open-spaced-repetition/ts-fsrs` | 889 | MIT | A typed scheduler: reviews are scheduled from history, not from a static list | The **shape** of the model: per-skill card, due date, ease, lapses — re-derived as SM-2 and tested | No (independent implementation) |
| `open-spaced-repetition/fsrs4anki` | 4,144 | MIT | DSR memory model, retention targets, benchmarking | Reference for the next upgrade (see roadmap) | No |
| `actualbudget/actual` | 30,421 | MIT | Local-first data, undo, fast transaction entry | Local-first confirmation that "no server" is viable | No |
| `firefly-iii/firefly-iii` | 25,322 | AGPL-3.0 | Fast entry forms, split transactions, reconciliation | Split-entry ergonomics (compound entries) informed the builder | **No — AGPL** |
| `beancount/beancount`, `beancount/fava` | 6,200 / 2,610 | GPL-2.0 | Parse → validate → report; balance assertions with precise errors | "Balance assertion" as a future exercise type | **No — GPL** |
| `hledgerorg/hledger` | 4,834 | GPL-3.0 | Fast CLI queries over journals | Query ideas for the teacher report | **No — GPL** |
| `oppia/oppia` | 7,002 | Apache-2.0 | State-based lessons, answer groups, exploration before explanation | Validates the repo's existing `Machine` approach | No (Python/Angular) |
| `phetsims/joist` (PhET framework) | 10 | MIT | Simulation UI: one variable at a time, immediate visual consequence | "Show the consequence while typing" — the live Dr/Cr totals | No |
| `excalidraw/excalidraw` | 136,178 | MIT | Freeform canvas that feels instant | Inspiration for a future T-account scratchpad | No |
| `d3/d3`, `chartjs/Chart.js` | 113,996 / 67,819 | ISC / MIT | Charts | Not adopted: the app's inline SVG is enough and dependency-free | No |
| `Khan/khan-exercises` | 1,674 | none (archived) | Hint ladders, step hints | Confirms hints/worked steps already shipped here | No |

## What was built from this (this branch)

1. **Spaced review** — `packages/curriculum/src/review.ts`. Replays stored attempts through SuperMemo-2; returns due
   cards, a seven-day forecast and a summary. **Nothing new is stored**, so it cannot drift from real work and it works
   offline. 14 tests with a hand-worked interval oracle (1 → 6 → 17 → 49 → 147 days) and lapse/reset behaviour.
2. **“Today” panel on the home page** — due count, streak, daily goal, and one obvious action. A student who returns
   after two days now sees *what to do next*, instead of the same marketing hero.
3. **Review queue on My Progress** — the overdue list (oldest first, with last score and lapse count) and a seven-day
   forecast strip.
4. **Journal Builder** — `apps/web/src/pages/build.ts` at `#/build`, with its case bank in
   `packages/curriculum/src/journal.ts`. Students pick accounts, choose the side and type amounts; live Dr/Cr totals must
   balance; marking compares the exact multiset of (account, side, amount) and then explains every line with the
   account's rule. Eight curated Class XI entries, five of them compound. 24 tests prove every case balances, uses only
   real chart accounts, never repeats a line on one side, and that parsing/marking reject wrong amounts, wrong sides,
   missing and extra lines.

**Licence position:** all of the above is original code. AGPL/GPL projects were read for behaviour only; MIT/Apache
projects could have been vendored but were not needed.

## Ranked next steps (impact ÷ effort)

| # | Step | Why | Effort |
|---|---|---|---|
| 1 | Replace SM-2 with **FSRS** (`ts-fsrs`, MIT) behind the same `ReviewCard` interface | Better intervals once there is attempt volume; keeps the UI unchanged | S/M |
| 2 | **Business-simulation campaign** (Phase-0 decision 5): one company, 30 days, document → journal → ledger → TB → statements | The single biggest “learn by doing” gap; the engine already computes every step | L |
| 3 | **Balance-assertion exercises** (“state Cash after these entries”) | Cheap to build on the engine, hard to guess, excellent diagnostic | S/M |
| 4 | **Undo** for posting, plus clearer offline/storage cues (Actual Budget pattern) | Trust: students experiment more when mistakes are reversible | M |
| 5 | **T-account scratchpad** (hand-rolled SVG, Excalidraw-inspired feel) | Lets students draw before formal entries | M |
| 6 | Teacher-authored assignments from the existing skill bank (Oppia-style states) | Turns a dashboard into a workflow | L |

**Non-goals, deliberately:** AI-generated journal entries (the engine computes; the tutor only explains), perpetual
inventory/GST/multi-currency (outside CBSE 2026-27), cloud accounts (progress stays on the device).
