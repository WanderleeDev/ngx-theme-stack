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

/**
 * Valid `color-scheme` hints for a custom theme.
 *
 * ⚠ KEEP IN SYNC with `NgColorScheme` in
 * projects/ngx-theme-stack/src/lib/types.ts
 *
 * The library lost its `'none'` value on purpose: it was the same code path as
 * `'auto'` (both simply remove the inline hint), so it only added a way to
 * express the same thing twice.
 */
export const COLOR_SCHEMES = ['light', 'dark', 'auto'] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

/** The hint used when none is declared, or when the declared one is invalid. */
export const DEFAULT_COLOR_SCHEME: ColorScheme = 'auto';

/**
 * Maps user input to a valid {@link ColorScheme}, or `undefined` when the input
 * does not match one of the accepted values.
 *
 * Matching is exact after trimming, so `'Light'` is rejected rather than guessed
 * at: the prompt lists the accepted values, and an unknown one must not end up
 * in the generated config as a type error.
 */
export function parseColorScheme(input: string): ColorScheme | undefined {
  const value = input.trim();
  return (COLOR_SCHEMES as readonly string[]).includes(value)
    ? (value as ColorScheme)
    : undefined;
}

export const DEFAULTS = {
  defaultTheme: 'system',
  storageKey: 'ngx-theme-stack',
  mode: 'class',
  strategy: 'critters',
  themes: [...DEFAULT_THEMES],
} as const;
