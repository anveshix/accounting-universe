# Drop folder for new chapter materials

Put files here and the **Materials ingest** workflow will check them, file them under the right chapter and open a pull request.

## Files

Path: `incoming/<chapter id>/<KIND>/<file>`; the KIND folder is optional.

| Example | Result |
|---|---|
| `incoming/XI.2.depreciation/PPT/slm-and-wdv.pptx` | slides for Depreciation |
| `incoming/XII.1.goodwill/NOTES/goodwill-notes.pdf` | notes for Goodwill |
| `incoming/XII.4.preparation/cash-flow-worksheet.xlsx` | kind guessed from the file (here: worksheet) |

KIND is one of `NOTES`, `PPT`, `LESSON_PLAN`, `WORKSHEET`. Chapter ids: run `node tools/materials/cli.mjs topics`, or see `docs/MATERIALS_PIPELINE.md`.

Accepted: PDF, PPTX, DOCX, XLSX, Markdown, text; up to 25 MB; no macros. Save old `.ppt`/`.doc` files as `.pptx`/`.docx` first.

## Google Drive links

Add one line per file to `incoming/drive-links.txt`:

```
chapter | kind | title | link
XI.2.depreciation | PPT | SLM and WDV | https://drive.google.com/file/d/…/view
XII.1.goodwill | | | https://docs.google.com/presentation/d/…/edit
```

Kind and title may be left empty. The file must be shared as **Anyone with the link**. Google Docs, Slides and Sheets links are exported as DOCX, PPTX and XLSX. Folder links cannot be fetched: share the files one by one.

## What happens next

1. The workflow runs `node tools/materials/cli.mjs incoming`. Files that pass are moved to `apps/web/public/materials/<chapter>/` with a record of who/when/checksum; files that fail stay here, with the reason in the pull request.
2. It opens a pull request. CI re-checks everything. A reviewer confirms the material is yours to share and stays inside the CBSE 2026-27 syllabus.
3. After the merge the site rebuilds and the item appears under **Notes → Chapter materials** and on the chapter's study page.
