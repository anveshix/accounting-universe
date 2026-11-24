#!/usr/bin/env node
// Chapter-wise materials pipeline. Run from the repository root:  node tools/materials/cli.mjs help
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLAUSES } from '../../packages/curriculum/src/syllabus.ts';
import { MATERIAL_KINDS } from '../../packages/curriculum/src/materials.ts';
import { addFromDrive, addMaterial, buildCatalogue, coverage, processIncoming, removeMaterial, reportOf, validateAll, writeCatalogue } from './lib.mjs';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROOT = join(repo, 'apps/web/public/materials'),
  INCOMING = join(repo, 'incoming');

const HELP = `Chapter-wise materials (notes, slides, lesson plans, worksheets)

  ingest --topic <id> [--kind NOTES|PPT|LESSON_PLAN|WORKSHEET] [--title "..."] [--summary "..."] [--lang en|hi|en-hi] [--replace] <file-or-drive-link>...
      Add files from this computer or public Google Drive links. Kind is guessed from the file when left out.
  incoming [--report report.md]
      Process everything in incoming/ (see incoming/README.md): files in incoming/<topic>/[KIND/]<file> and incoming/drive-links.txt.
  build        Rebuild apps/web/public/materials/catalogue.json from the records.
  validate     Check files, checksums, topics and that the catalogue is current (used by CI). Exit 1 on any problem.
  list [--topic <id>]
  coverage     Which of the 54 topics have no material yet.
  remove <id>  Delete one material (id as shown by list).
  topics       Print every topic id with its title.
`;

function parse(argv) {
  const flags = {},
    rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (['replace', 'dry-run'].includes(k)) flags[k] = true;
      else flags[k] = argv[++i];
    } else rest.push(a);
  }
  return { flags, rest };
}

async function main() {
  const [cmd = 'help', ...argv] = process.argv.slice(2),
    { flags, rest } = parse(argv);
  switch (cmd) {
    case 'help':
    case '-h':
    case '--help':
      console.log(HELP);
      return 0;
    case 'topics':
      for (const c of CLAUSES) console.log(`${c.id.padEnd(26)} ${c.title}`);
      return 0;
    case 'ingest': {
      if (!flags.topic) {
        console.error('Add --topic <id>  (see: node tools/materials/cli.mjs topics)');
        return 2;
      }
      if (!rest.length) {
        console.error('Give at least one file or Google Drive link.');
        return 2;
      }
      let failed = 0;
      for (const src of rest) {
        try {
          const kind = flags.kind?.toUpperCase().replace(/[- ]/g, '_');
          const common = {
            root: ROOT,
            topic: flags.topic,
            kind,
            title: rest.length === 1 ? flags.title : undefined,
            summary: rest.length === 1 ? flags.summary : undefined,
            lang: flags.lang ?? 'en',
            replace: !!flags.replace,
          };
          const r = /^https?:\/\//i.test(src) ? await addFromDrive({ ...common, url: src }) : addMaterial({ ...common, name: src.split(/[\\/]/).pop(), bytes: readFileSync(resolve(src)) });
          console.log(`${r.status === 'added' ? 'added    ' : 'unchanged'} ${r.meta.id}  (${MATERIAL_KINDS[r.meta.kind]})`);
        } catch (e) {
          failed++;
          console.error(`REFUSED   ${src}\n          ${e.message}`);
        }
      }
      if (failed < rest.length) writeCatalogue(ROOT);
      return failed ? 1 : 0;
    }
    case 'incoming': {
      const results = await processIncoming({ incoming: INCOMING, root: ROOT, lang: flags.lang ?? 'en' });
      writeCatalogue(ROOT);
      const report = reportOf(results);
      console.log(report);
      if (flags.report) writeFileSync(flags.report, report + '\n');
      return results.some(r => !r.ok) ? (results.some(r => r.ok) ? 3 : 1) : 0;
    }
    case 'build': {
      const items = writeCatalogue(ROOT);
      console.log(`catalogue.json: ${items.length} item${items.length === 1 ? '' : 's'}`);
      return 0;
    }
    case 'validate': {
      const problems = validateAll(ROOT);
      if (problems.length) {
        console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'} in apps/web/public/materials:\n- ` + problems.join('\n- '));
        return 1;
      }
      console.log(`materials ok: ${buildCatalogue(ROOT).items.length} item(s)`);
      return 0;
    }
    case 'list':
      for (const m of buildCatalogue(ROOT).items.filter(x => !flags.topic || x.topic === flags.topic)) console.log(`${m.id}  [${m.kind}] ${m.title}`);
      return 0;
    case 'coverage': {
      const c = coverage(ROOT);
      console.log(`${c.covered} of ${c.total} topics have material.`);
      if (c.missing.length) console.log('Without material:\n  ' + c.missing.join('\n  '));
      return 0;
    }
    case 'remove': {
      if (!rest[0]) {
        console.error('Give the id from: list');
        return 2;
      }
      removeMaterial(ROOT, rest[0]);
      writeCatalogue(ROOT);
      console.log(`removed ${rest[0]}`);
      return 0;
    }
    default:
      console.error(`Unknown command “${cmd}”.\n\n${HELP}`);
      return 2;
  }
}
process.exit(
  await main().catch(e => {
    console.error(e.message);
    return 1;
  }),
);
