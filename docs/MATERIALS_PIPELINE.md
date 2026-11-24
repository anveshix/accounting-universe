# Chapter materials pipeline (notes, slides, lesson plans, worksheets)

Goal: a teacher can add a file, or a Google Drive link, for any of the 54 syllabus chapters; it is checked, filed in a fixed structure, reviewed, and then shown to every student under **Notes → Chapter materials** and on the chapter's study page.

## The structure

```
apps/web/public/materials/
  catalogue.json                      generated; the site reads this
  XI.2.depreciation/                  one folder per syllabus chapter id
    ppt-slm-and-wdv.pptx              <kind>-<title slug>.<ext>
    ppt-slm-and-wdv.pptx.meta.json    record: title, summary, kind, language, size, slides/pages, sha256, source, date
incoming/                             drop folder (not published)
  <chapter id>/[KIND/]<file>
  drive-links.txt                     chapter | kind | title | link
```

Kinds: `NOTES`, `PPT` (slides), `LESSON_PLAN`, `WORKSHEET`. Languages: `en`, `hi`, `en-hi`. Chapter ids are the 54 topic ids of the app (`node tools/materials/cli.mjs topics`).

## Three ways in

| Way | Who | Steps |
|---|---|---|
| **Drop folder** (files) | any GitHub collaborator | On GitHub: *Add file → Upload files* into `incoming/<chapter id>/<KIND>/` (GitHub's web upload takes files up to 25 MB). The **Materials ingest** workflow runs on the push. |
| **Drive links** | any collaborator | Add lines to `incoming/drive-links.txt` (see `incoming/README.md`), or run the workflow by hand (*Actions → materials-ingest → Run workflow*) and fill in chapter, kind, title and link. |
| **Command line** | maintainer | `node tools/materials/cli.mjs ingest --topic XI.2.depreciation --kind PPT --title "SLM and WDV" deck.pptx` (also accepts a Drive link). Then `validate` and commit. |

In all three the result is a pull request listing what was added and what was refused (with the reason). CI re-runs the checks. After review and merge, the normal Pages deploy publishes it.

A fourth path needs no GitHub: on **#/materials** anyone can *Add a file for a chapter (on this device)*. The file is checked by the same rules and kept in that browser only (IndexedDB `au-materials`). It is never uploaded, never part of a progress backup, and can be removed. It is for a teacher's own use on one device.

## What is checked (every path)

- Type by content, not by name: PDF (`%PDF-`), PPTX/DOCX/XLSX (a real zip containing the expected part, e.g. `ppt/presentation.xml`), Markdown/text (valid UTF-8, no binary).
- **Refused**: macro-enabled files (`.pptm`, `.docm`, `.xlsm`, or any Office zip containing `vbaProject.bin`), old binary `.ppt/.doc/.xls`, executables and scripts, empty files, anything over 25 MB, and web pages saved under a document name (what Google returns when a Drive file is not shared).
- The chapter id must be one of the 54; the kind must suit the file type (a deck can be slides or a lesson plan, not a worksheet).
- Checksum (sha256) recorded; `validate` fails if a file is edited later, a file has no record, or `catalogue.json` is out of date.
- Summary and slide/page counts are read from the file; the title defaults to the file name.

## Google Drive links

- The file must be shared as **Anyone with the link**. No Google account, key or token is used anywhere.
- Understood: `drive.google.com/file/d/<id>/…`, `…/open?id=<id>`, and Google Docs / Slides / Sheets links (exported as DOCX / PPTX / XLSX).
- Not supported: **folder links** (listing a folder needs a Google key), private files, other websites. Each refusal says what to do.
- Large files: Google's "cannot scan for viruses" page is followed once.

## Review checklist (also in every generated pull request)

1. The uploader owns the material or has the right to share it with students.
2. It stays inside the official CBSE 2026-27 syllabus (no excluded topics; see `docs/CBSE_2026_27_SYLLABUS_MATRIX.md`).
3. It contains no student names or marks.
4. Title and summary read well; the language label is right.

## Setup, once

- Repository *Settings → Actions → General → Workflow permissions*: allow **Read and write**, and tick **Allow GitHub Actions to create and approve pull requests**. Without the second, the workflow still pushes a `materials/run-…` branch and prints a warning; open the pull request by hand.
- Pages deploy is unchanged: `apps/web/public/materials/` is copied into the site by the normal build.

## Commands

```
node tools/materials/cli.mjs help | topics | list [--topic id] | coverage | build | validate | remove <id>
node tools/materials/cli.mjs ingest --topic <id> [--kind K] [--title T] [--summary S] [--lang en|hi|en-hi] [--replace] <file-or-link>...
node tools/materials/cli.mjs incoming [--report report.md]
```
`npm run materials -- <command>` is the same. `npm run test:tools` runs the pipeline tests.

## Limits (honest)

- A published item is public: GitHub Pages has no login. Paid or restricted material cannot be protected this way (the existing Pro lock on the sample Notes page is a UI gate only; see `NOTES_AUTHORING.md`).
- The Drive download was tested against recorded responses, not live: the build sandbox cannot reach Google. Try one real link after setup.
- The workflow file could not be run here; its commands (`incoming`, `validate`) are the tested ones, the git/`gh` steps around them are not.
- Page and slide counts of PDFs are estimates (files that pack their page tree into compressed streams show no count). The page is English only (no Hindi catalogue strings yet); material titles and files can be in Hindi.
- Search covers titles and summaries, not the text inside files.
