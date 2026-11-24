# Design System Master File — Accounting Universe

> **LOGIC:** When building or modifying a specific page, check `design-system/accounting-universe/pages/[page-name].md` first.
> If that file exists, its rules **override** this Master file.
> Otherwise, strictly follow the rules below.

---

**Project:** Accounting Universe (`@accounting-universe/web`)
**Generated via:** `ui-ux-pro-max` (`nextlevelbuilder/ui-ux-pro-max-skill`) + CBSE Domain Adaptation
**Aesthetic Direction:** **Chartered Ledger Folio** — Tactile Swiss-Editorial Financial Studio (inspired by archival Indian *Bahi-Khata* / Chartered Ledger folios, FT Weekend print typography, and precision financial workbenches)
**Design Dials:** Variance `8/10` (Bold / Asymmetric Architectural Grid) | Motion `6/10` (Tactile Ledger Physics via Anime.js v4) | Density `6/10` (Crisp Tabular Financial Readability)

---

## 1. Anti-Generic Manifesto (Why This Never Looks Like AI SaaS Slop)

1. **Zero Generic SaaS Cards:** Replace floating pill-rounded white boxes (`border-radius: 16px`, mushy drop-shadows, pastel icon circles) with **Architectural Ledger Folios** — crisp `2px`–`4px` corners, hairline structural borders (`1px solid var(--line)`), double-ruled accounting totals (`3px double var(--accent)`), and left-margin folio rules.
2. **Real Self-Hosted Editorial + Tabular Tri-Stack Typography:** Never rely on browser fallback `Inter`/`Arial`. Self-host **Instrument Serif** (editorial display & italic emphasis), **Instrument Sans** (precision interface & controls), and **JetBrains Mono** (voucher codes, account folios, `Dr`/`Cr` columns, and tabular rupee figures) in `apps/web/src/fonts/` (bundled into relative `./assets/` by Vite and precached by `sw.js`) so offline PWA, GitHub Pages subpaths, and sandboxed previews render exact letterforms.
3. **Interactive Hero Folio (Not a Static Mockup Card):** The hero right-hand column is a **Live Interactive Voucher Folio** with clickable transaction tabs (`01 Capital`, `02 Inventory`, `03 Appropriation / CAS`) that re-tally `Dr = Cr` in real time with Anime.js tactile confirmation.
4. **Ruled Paper & Ink Chromatic System:** Warm cotton ledger paper (`#F5F1E8`) with ruled folio grid texture, Chartered Pine-Ink (`#0B3B36`), Vermilion/Burnished Brass double-rule (`#9A5B13`), and Audit Emerald (`#14633A`). Full dark mode (`#0C1113` Obsidian Slate) and ultra-high-contrast classroom `projector` mode (`#FFFFFF` / `#111111`).

---

## 2. Semantic Color Tokens (WCAG AA/AAA Verified in Light, Dark & Projector)

### Light Mode — *Cotton Ledger & Chartered Pine*

| Semantic Token | Value | Contrast / Role |
|---|---|---|
| `--bg` | `#F5F1E8` | Warm archival cotton ledger paper |
| `--surface` | `#FCFBF7` | Crisp folio sheet surface |
| `--surface-2` | `#EFE9DC` | Ruled secondary well / voucher stub |
| `--ink` | `#161412` | Primary iron-gall ink (`15.4:1` on `--surface`) |
| `--ink-2` | `#2E2A24` | Secondary body ink (`11.8:1` on `--surface`) |
| `--muted` | `#575046` | Supporting caption & metadata ink (`6.9:1` on `--surface`, `6.1:1` on `--bg`) |
| `--brand` | `#0B3B36` | Chartered Pine primary authority (`11.6:1` with `#FFFFFF`) |
| `--brand-2` | `#072824` | Pressed / deep pine |
| `--brand-ink` | `#FFFFFF` | Text on `--brand` |
| `--accent` | `#9A5B13` | Burnished Brass / Ledger Rule (`5.1:1` on `--surface`) |
| `--eyebrow` | `#7C470B` | Folio kicker / section index (`6.8:1` on `--bg`) |
| `--line` | `#D8D0C0` | Hairline ledger rule |
| `--line-strong` | `#AEA491` | Structural frame & input border (`3.1:1` non-text UI contrast) |
| `--good` / `--good-bg` | `#14532D` / `#E5F3EA` | Balanced / verified (`Dr = Cr`) |
| `--bad` / `--bad-bg` | `#991B1B` / `#FCE8E6` | Out-of-balance / suspense discrepancy |
| `--warn` / `--warn-bg` | `#78490A` / `#FBF0D4` | Revision notice / caution |

### Dark Mode — *Obsidian Terminal & Brass*

| Semantic Token | Value | Contrast / Role |
|---|---|---|
| `--bg` | `#0B0F10` | Deep obsidian desk |
| `--surface` | `#12181A` | Elevated slate folio |
| `--surface-2` | `#182023` | Recessed ledger well |
| `--ink` | `#F2EFE9` | Warm parchment white (`15.8:1`) |
| `--ink-2` | `#D7D2C8` | Secondary parchment (`11.9:1`) |
| `--muted` | `#9FA6A2` | Muted sage-stone (`6.4:1` on `--surface`) |
| `--brand` | `#2A8C82` | Luminousjade-teal (`5.4:1` on `--surface` for links) |
| `--accent` | `#E5B15C` | Gilded brass rule (`9.6:1` on `--surface`) |
| `--line` | `#253034` | Hairline dark rule |
| `--line-strong` | `#3D4D53` | Control boundary |

---

## 3. Typography System (Self-Hosted OFL Tri-Stack)

- **`--font-display` (`Instrument Serif`)**: Hero headlines, page `h2` titles, and editorial callouts. Tight tracking (`-0.02em`), crisp vertical stress, unmistakable print authority. Falls back to `Noto Sans Devanagari` seamlessly for Hindi headings.
- **`--font` (`Instrument Sans`)**: Body prose, controls, form labels, syllabus clauses, and instructions (`16px` base, `1.6` line-height).
- **`--mono` (`JetBrains Mono`)**: Account codes (`1101`, `XI-U2-04`), folio badges (`LAB A`), `Dr`/`Cr` headers, and every tabular ₹ figure (`font-variant-numeric: tabular-nums`).

---

## 4. Layout, Geometry & Architectural Rules

- **Corner Discipline:** `--r-sm: 3px`, `--r: 4px`, `--r-lg: 6px`. No bubbly `16px–24px` SaaS pillows.
- **Architectural Index Grid:** Feature grids (`.cards`, `.steps3`, `.simlab-core-grid`) use crisp hairline ledger framing, top rule accents, monospace folio indices, and tactile hover ink-shifts instead of generic floating rounded white cards.
- **Double-Ruled Accounting Totals:** Every trial balance, appropriation summary, and ledger footing ends with a traditional `border-top: 1px solid var(--line-strong); border-bottom: 3px double var(--accent)`.
- **Navigation Masthead:** Sticky double-deck masthead — deep Chartered Pine top utility bar + frosted cotton-parchment ledger index ribbon with an Anime.js sliding brass rule indicator (`.nav-glide`).

---

## 5. Motion Choreography (`apps/web/src/motion.ts` — Anime.js v4)

- **Easing:** `cubicBezier(0.22, 1, 0.36, 1)` — crisp mechanical settle, zero cartoonish bounce.
- **Contrast-Safe Entrance:** Translate `Y` (`10px → 0`) only — **never** animate text opacity from `0`, ensuring WCAG 4.5:1 contrast holds on every single frame and `axe-core` never sees faded text.
- **Interactive Ledger Tally:** Clicking voucher tabs on the Hero Folio or completing a simulator mission triggers `pulseLedgerConfirmation()` on the `Dr = Cr` tally row.
- **Strict Guards:** Instantaneous (`0ms`) when `prefers-reduced-motion: reduce` is active, in `projector` mode, or under `jsdom`.

---

## 6. Non-Negotiable Pre-Delivery Checklist (`pro-rules.md` + Repo Invariants)

- [x] Self-hosted OFL fonts (`InstrumentSerif`, `InstrumentSans`, `JetBrainsMono`) precached by `sw.js` for 100% offline fidelity.
- [x] Zero emojis used as icons; 100% crisp stroke SVGs (`aria-hidden="true"` when beside text).
- [x] Bilingual Hindi (`data-lang="hi"`) leaves **zero** untagged English words (`lang="en"` on all English specimens/titles).
- [x] Touch targets `>= 44×44px` on controls; visible `:focus-visible` ring (`2px solid var(--focus)`).
- [x] Zero horizontal overflow at `320px`, `360px`, `390px`, `768px`, `1280px`.
- [x] Zero `axe-core` serious/critical violations across Light, Dark, Hindi, and Projector modes.
