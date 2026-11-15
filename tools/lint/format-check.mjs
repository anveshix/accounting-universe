// Prettier "ratchet": existing hand-written files keep their dense style (listed in prettier-baseline.txt), every other file must be Prettier-clean,
// and a baseline file that becomes clean must be removed from the list. Run from the repo root: npm run format:check
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const bin = 'tools/lint/node_modules/.bin/prettier';
const baseline = new Set(readFileSync('tools/lint/prettier-baseline.txt', 'utf8').split('\n').map(l => l.trim()).filter(Boolean));
let out;
try {
  out = execFileSync(bin, ['--list-different', '--ignore-path', '.prettierignore', '{packages,apps,e2e,tools}/**/*.{ts,mjs,cjs,js,json,css}'], { encoding: 'utf8' });
} catch (e) { out = String(e.stdout ?? ''); if (!out) throw e; }       // exit code 1 just means "some files differ"
const different = new Set(out.split('\n').map(l => l.trim()).filter(Boolean));
const fresh = [...different].filter(f => !baseline.has(f)).sort(), healed = [...baseline].filter(f => !different.has(f)).sort();
if (fresh.length) console.log('Not Prettier-formatted (run: npx prettier --write <file>):\n  ' + fresh.join('\n  '));
if (healed.length) console.log('Now formatted — remove from tools/lint/prettier-baseline.txt:\n  ' + healed.join('\n  '));
if (fresh.length || healed.length) process.exit(1);
console.log(`format ok: ${different.size} legacy-style files still in the baseline, everything else is Prettier-clean.`);
