// Flat ESLint config for the whole repo. Run from here (npm --prefix tools/lint run lint) — see package.json for why this is not a workspace.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['.claude/**', '**/node_modules/**', '**/dist/**', 'index.html', '*.html', '**/legacy-v1.ts', '*.js', '!tools/lint/eslint.config.js', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  { files: ['apps/web/**/*.ts'], languageOptions: { globals: globals.browser } },
  { files: ['**/*.cjs', '**/*.mjs', '**/tools/**/*.js'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { files: ['**/*.cjs'], languageOptions: { sourceType: 'commonjs' }, rules: { '@typescript-eslint/no-require-imports': 'off' } },
  { files: ['apps/web/public/sw.js'], languageOptions: { globals: globals.serviceworker } },
  // These two scripts call functions that live in the legacy page (SIM, M1_ACCTS, go …) inside page.evaluate(); ESLint cannot see those globals.
  { files: ['e2e/legacy-*.cjs'], rules: { 'no-undef': 'off' } },
  {
    // AGENTS.md rule 1: money is never a float. (A test also scans engine sources; this catches it at edit time.)
    files: ['packages/engine/src/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', { name: 'parseFloat', message: 'Money is never a float: use Money/Fraction.' }],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'round', message: 'Use Money/Fraction with an explicit rounding mode.' },
        { property: 'toFixed', message: 'Use Money.format() / Fraction, not Number#toFixed.' },
        { object: 'Number', property: 'parseFloat', message: 'Money is never a float.' },
      ],
    },
  },
);
