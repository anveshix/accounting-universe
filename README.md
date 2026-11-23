# Accounting Universe

> Learn CBSE Class XI–XII Accountancy (2026–27) by doing: real journal entries, real calculators, real practice — checked by an exact money engine.

**[▶ Open the live app](https://anveshix.github.io/accounting-universe/)** · [Legacy single-file app](https://anveshix.github.io/accounting-universe/legacy/) · [Docs](docs/)

---

## Features

- **Exact money** — all amounts are `bigint` paise; no floating-point in money paths (enforced by a guard test).
- **Journal, ledger, trial balance** with reversal support and a balance check after every posting.
- **Calculators and labs** for syllabus topics such as depreciation and cash flow.
- **Practice generators** — seeded, reproducible question sets; each crisis shows its full solution.
- **Mastery tracking and a teacher report.**
- **English and Hindi UI.**
- **Optional AI tutor** via a separate proxy that keeps the API key on the server. If it is not configured, the tutor is hidden and the app works unchanged.

## Tech stack

| Area | Tools |
|---|---|
| Language | TypeScript (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) |
| Web app | Vite, vanilla DOM |
| Engine & curriculum | Plain TypeScript packages, npm workspaces |
| Tests | Vitest (unit and property tests), Playwright (end-to-end, desktop and mobile) |
| Hosting | GitHub Pages (built from `main` by `.github/workflows/deploy-pages.yml`) |

## Setup

Requirements: Node.js 20+.

```bash
git clone https://github.com/anveshix/accounting-universe.git
cd accounting-universe
npm install

npm run check                              # typecheck + all workspace tests
npm run dev -w @accounting-universe/web    # local dev server
npm run build                              # production build of apps/web
```

To enable the optional AI tutor, run `apps/tutor-proxy` with `ANTHROPIC_API_KEY` and `TUTOR_ORIGIN` set, then build the web app with `VITE_TUTOR_URL`. See [`apps/tutor-proxy/README.md`](apps/tutor-proxy/README.md).

## Usage

1. Open the app and pick a class (XI or XII) and a unit.
2. Work through a lab: enter transactions, post them, and check the ledger and trial balance.
3. Use practice sets to test yourself; mastery updates as you answer.

## Folder structure

```
.
├── apps/
│   ├── web/              # Vite + TypeScript web app (the published site)
│   └── tutor-proxy/      # Optional server that holds the AI key
├── packages/
│   ├── engine/           # Exact money, journal/ledger, calculators
│   └── curriculum/       # Syllabus data, question generators, mastery
├── e2e/                  # Playwright end-to-end tests
├── docs/                 # Design, audit, testing and release notes
├── tools/                # Lint, format and check scripts
├── archive/              # Old snapshots and broken scripts (not built)
├── index.html            # Legacy single-file app (served at /legacy/)
└── .github/              # Workflows, issue and PR templates
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

No licence has been chosen for this repository yet. Until one is added, the default applies: **all rights reserved** by the author (anveshix). Please ask before reusing or redistributing the code.

Third-party code keeps its own licence. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Author

**anveshix** — [github.com/anveshix](https://github.com/anveshix)
