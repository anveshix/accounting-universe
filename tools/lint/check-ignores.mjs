// Guards the regression that broke CI: flat-config ignore patterns without a leading `**/`
// match only at the repo root, so filing the legacy scripts under archive/legacy-tests/ made
// ESLint lint them (326 errors). Moving a file must never silently change whether it is linted.
// Run from the repo root (the `lint` script does): node tools/lint/check-ignores.mjs
import { ESLint } from 'eslint';

const eslint = new ESLint({ cwd: process.cwd(), overrideConfigFile: 'tools/lint/eslint.config.js' });

// Legacy / generated / shipped-separately files: excluded at any depth.
const mustBeIgnored = [
  'index.html',
  'test.js',
  'check_syntax.js',
  // The two paths below are the reason this guard exists: legacy scripts used to sit at the repo
  // root and were covered by `*.js`; the moment someone files them one directory deeper they must
  // stay excluded. Hand-written sources are .ts/.mjs/.cjs — a .js anywhere is not ours to lint.
  'legacy-tests/test.js',
  'packages/curriculum/scripts/old.js',
  'archive/legacy-tests/test.js',
  'archive/legacy-html/accounting_universe_backup.html',
  'packages/curriculum/src/banks/legacy-v1.ts',
  'e2e/coverage/index.html',
];

// Real sources: always linted.
const mustBeLinted = ['tools/lint/eslint.config.js', 'apps/web/src/main.ts', 'packages/engine/src/money.ts', 'e2e/web-app.cjs', 'tools/assemble-site.mjs'];

const problems = [];
for (const p of mustBeIgnored) if (!(await eslint.isPathIgnored(p))) problems.push(`should be ignored but is linted: ${p}`);
for (const p of mustBeLinted) if (await eslint.isPathIgnored(p)) problems.push(`should be linted but is ignored: ${p}`);

if (problems.length) {
  console.error('ESLint ignore rules are wrong:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`ignore rules ok: ${mustBeIgnored.length} legacy paths excluded, ${mustBeLinted.length} source paths linted.`);
