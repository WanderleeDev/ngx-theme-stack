/**
 * Values and helpers used by the schematics.
 *
 * The values that the library also owns live in ./generated-config.ts, which is
 * produced by scripts/generate-schematic-constants.mjs. The schematics compile to
 * CommonJS with `rootDir: "schematics"` and cannot import the ESM library, so the
 * build copies those values instead of relying on a "KEEP IN SYNC" comment:
 *
 *     error TS6059: File '.../src/lib/types.ts' is not under 'rootDir' '.../schematics'
 *
 * Everything below is derived from that generated file, or is schematic-only.
 */
import {
  DEFAULT_NG_CONFIG,
  DEFAULT_THEMES as GENERATED_DEFAULT_THEMES,
  NG_COLOR_SCHEMES,
  THEME_NAME_SOURCE,
} from './generated-config';

export const DEFAULT_THEMES = GENERATED_DEFAULT_THEMES;

/**
 * Pattern a theme identifier must match to be usable as a CSS class.
 *
 * Why each part matters is documented on the library copy
 * (src/lib/types.ts → THEME_NAME_SOURCE). In short: a leading digit breaks the
 * class selector, an ASCII space throws in `classList.add`, and a CSS
 * metacharacter turns `.lucky.theme` into a two-class selector that can never
 * match the single class token `lucky.theme`.
 *
 * The anti-flash script inlines this same pattern, because it runs before
 * anything else and writes an untrusted localStorage value into the DOM. It is
 * defence in depth: the value is also checked against the declared list.
 */
export const THEME_NAME_PATTERN = new RegExp(THEME_NAME_SOURCE);

/** Whether `name` is usable as a theme identifier. See {@link THEME_NAME_PATTERN}. */
export function isValidThemeName(name: string): boolean {
  return THEME_NAME_PATTERN.test(name);
}

/** Explains why a name was rejected, so prompts and warnings can be actionable. */
export function describeInvalidThemeName(name: string): string {
  if (name.trim() === '') return 'it is empty';
  if (/^[0-9]/.test(name)) return 'it starts with a digit, which is not a valid CSS class';
  // Only ASCII whitespace throws in classList.add; anything else non-ASCII falls
  // through to the allowed-set message below, which is the accurate reason.
  if (/[\t\n\f\r ]/.test(name))
    return 'it contains whitespace, which throws in classList.add';
  if (/[.#>+~[\]:*(),]/.test(name))
    return 'it contains a CSS metacharacter, which changes what the selector matches';
  return 'it contains a character outside the allowed set';
}

/**
 * Valid `color-scheme` hints for a custom theme.
 *
 * Derived from the library's NgColorScheme. That union lost its `'none'` value on
 * purpose: it was the same code path as `'auto'` (both simply remove the inline
 * hint), so it only added a way to express the same thing twice.
 */
export const COLOR_SCHEMES = NG_COLOR_SCHEMES;
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
  ...DEFAULT_NG_CONFIG,
  themes: [...DEFAULT_THEMES],
} as const;
