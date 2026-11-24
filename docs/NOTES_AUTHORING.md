# Notes & teacher resources: authoring and freemium

- Catalogue: `packages/curriculum/src/notes.ts` (`NOTES`). One row per item: class, subject (ACT/BST/ETP), kind (NOTES/PPT/LESSON_PLAN/WORKSHEET), `tier` FREE or PRO.
- Text bodies: `apps/web/src/notes-bodies.ts` keyed by item id (loaded lazily). For PPT/PDF files, drop them in `apps/web/public/notes/` and set `file`.
- Teacher resources = kinds PPT and LESSON_PLAN (shown under "Teacher resources").
- All current entries are SAMPLES. Replace with your own.
- Lock = UI gate only (`canOpen`). Anyone can read bundled files/text. Before charging money, serve Pro files from a server behind login or signed URLs, and replace `redeemCode` with a licence check. Payment is not implemented.
- Tests: `packages/curriculum/test/notes.test.ts`, `e2e/web-app-notes.cjs`.

## Chapter materials (the real library)
The catalogue above is a sample. Real, chapter-wise notes, slides, lesson plans and worksheets go through the materials pipeline: see `docs/MATERIALS_PIPELINE.md` (upload or Google Drive link, checked, reviewed, published under `#/materials`).
