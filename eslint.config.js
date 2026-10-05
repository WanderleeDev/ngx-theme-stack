// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    // Generated output only. `files: ['**/*.ts']` below matches the whole
    // workspace, and ESLint 9+/flat config does not ignore `dist` or build
    // caches by default, so any glob that reaches them reports errors on code
    // nobody wrote:
    //   - dist/**.d.ts: Angular emits `#private` fields and `any`.
    //   - .agents/**: generated skill assets, whose example components use an
    //     `app-` selector (correct for a consumer app, but the workspace rule
    //     below demands the `lib` prefix).
    // Scoped per-project lint already skips them; this keeps IDE/plugin/root
    // globs honest too.
    ignores: [
      'dist/**',
      '.agents/**',
      '.angular/**',
      'out-tsc/**',
      'coverage/**',
      'vitest-coverage/**',
    ],
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "lib",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "lib",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  }
]);
