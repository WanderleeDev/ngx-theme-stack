/**
 * Runtime list of built-in themes.
 *
 * Lives here (and not in config/index.ts) because it defines a type:
 * config/index.ts already imports from types.ts, so placing DEFAULT_THEMES
 * here avoids any circular dependency.
 *
 * ⚠ KEEP IN SYNC with the duplicate in:
 * projects/ngx-theme-stack/schematics/ng-add/constants.ts → DEFAULT_THEMES
 *
 * Schematics compile to CommonJS and cannot import from this ESM file,
 * so the values are intentionally duplicated. Change both at the same time.
 */
export const DEFAULT_THEMES = ['system', 'light', 'dark'] as const;

/** Literal union of built-in themes: `'system' | 'light' | 'dark'`. */
export type DefaultNgTheme = (typeof DEFAULT_THEMES)[number];

/**
 * Theme type.
 *
 * - **Without** `T`: open union — accepts any `string` with IDE autocomplete
 *   hints for the built-in themes (`'system' | 'light' | 'dark'`).
 * - **With** `T`: closed union — exactly `DefaultNgTheme | T`, enabling
 *   full type-safety for custom theme sets.
 *
 * @example
 * NgTheme            // 'system' | 'light' | 'dark' | (string & {})
 * NgTheme<'sepia'>   // 'system' | 'light' | 'dark' | 'sepia'
 */
export type NgTheme<T extends string = string & {}> = DefaultNgTheme | T;

/**
 * Resolved theme — always `'light'` or `'dark'`, never `'system'`.
 * Represents the value that comes from `matchMedia`, not user selection.
 */
export type NgSystemTheme = Exclude<DefaultNgTheme, 'system'>;

/**
 * Theme application mode.
 * - `'attribute'`: sets `data-theme` attribute on `<html>`
 * - `'class'`: adds theme class to `<html>`
 * - `'both'`: uses both attribute and class
 */
export type NgMode = 'attribute' | 'class' | 'both';

/**
 * Theme application strategy.
 * - `'blocking'`: theme CSS is loaded synchronously before rendering
 * - `'critters'`: theme CSS is inlined using Critters for SSR/SSG
 */
export type NgStrategy = 'blocking' | 'critters';

/**
 * Library configuration.
 *
 * @typeParam T - Custom theme literals. Defaults to open `string`, preserving
 * backwards compatibility. Pass specific literals (e.g. `'sepia' | 'ocean'`)
 * via {@link provideThemeStack} to get a closed, type-safe theme union.
 */
export interface NgConfig<T extends string = string & {}> {
  /** The theme to use on first visit or when no preference is saved. Default: 'system'. */
  defaultTheme: NgTheme<T>;

  /** Key used to persist theme preference in localStorage. Default: 'ngx-theme-stack'. */
  storageKey: string;

  /** 
   * How the theme should be applied to the document (via class, attribute or both). 
   * Default: 'class'.
   */
  mode: NgMode;

  /** 
   * Performance strategy for anti-flash.
   * Use 'critters' (default) to inline all theme CSS in <head> — works for CSR, SSR, and SSG.
   * Use 'blocking' to load themes.css as a render-blocking stylesheet (HTTP-cacheable).
   */
  strategy: NgStrategy;

  /**
   * The **resolved** list of supported theme identifiers, always including the
   * built-in themes (`'light'`, `'dark'`, `'system'`).
   *
   * When you pass custom themes to {@link provideThemeStack}, they are **merged**
   * with the built-in defaults — your custom values are appended after them.
   *
   * @example
   * // Input to provideThemeStack:
   * themes: ['sepia', 'ocean'] as const
   *
   * // Resolved value stored in NgConfig:
   * // ['system', 'light', 'dark', 'sepia', 'ocean']
   *
   * Default (no custom themes): `['system', 'light', 'dark']`.
   */
  themes: NgTheme<T>[];
}
