/**
 * ⚠ ATTENTION: SHARED CONFIGURATION VALUES
 *
 * These values MUST match the library defaults in:
 * - projects/ngx-theme-stack/src/lib/types.ts → DEFAULT_THEMES
 * - projects/ngx-theme-stack/src/lib/config/index.ts → DEFAULT_NG_CONFIG
 *
 * Schematics run in Node.js (CommonJS) and cannot import from the library (ESM),
 * so the values are intentionally duplicated. Change all three at the same time.
 */
export const DEFAULT_THEMES = ['system', 'light', 'dark'] as const;

export const DEFAULTS = {
  defaultTheme: 'system',
  storageKey: 'ngx-theme-stack-theme',
  mode: 'class',
  themes: [...DEFAULT_THEMES],
} as const;
