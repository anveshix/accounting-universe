// Builds the folder that GitHub Pages publishes:  /  = the new app (apps/web/dist),  /legacy/ = the old single-file app (index.html), nothing else.
// Run after `npm run build`:  node tools/assemble-site.mjs [outDir]   (default apps/web/dist)
// Only index.html is copied from the legacy side, so the old backup/scratch files in the repo root are NOT published (handoff §8.2).
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] ?? join(root, 'apps/web/dist');
if (!existsSync(join(out, 'index.html'))) throw new Error(`${out}/index.html is missing: build the web app first (npm run build)`);
if (!readFileSync(join(out, 'index.html'), 'utf8').includes('id="app"')) throw new Error(`${out}/index.html is not the new web app`);
mkdirSync(join(out, 'legacy'), { recursive: true });
copyFileSync(join(root, 'index.html'), join(out, 'legacy', 'index.html'));
console.log(`site: new app at /, legacy app at /legacy/  (${out})`);
