/**
 * ⚠ ATTENTION: SHARED CONFIGURATION VALUES
 *
 * These values MUST match the library defaults in:
 * projects/ngx-theme-stack/src/lib/services/theme-stack.config.ts
 *
 * Schematics run in Node.js (CommonJS) and cannot import from the library (ESM),
 * so these defaults are intentionally duplicated here for:
 * 1. Proposing hints/defaults in interactive prompts.
 * 2. Deciding if a property can be omitted from the generated provideThemeStack() call.
 */
export const DEFAULT_THEMES = ['system', 'light', 'dark'] as const;

export const DEFAULTS = {
  theme: 'system',
  storageKey: 'ngx-theme-stack-theme',
  mode: 'class',
  themes: [...DEFAULT_THEMES],
} as const;
