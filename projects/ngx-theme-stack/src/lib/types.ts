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
 * Color scheme hint applied to the root element via `color-scheme`.
 *
 * - `'light'` / `'dark'` — forces the browser to use matching native UI widgets.
 * - `'auto'` — no explicit hint; the browser chooses based on surrounding styles.
 * - `'none'` — explicitly removes any inherited `color-scheme` (legacy default).
 *
 * This value is forwarded to `document.documentElement.style.color-scheme`.
 * It only affects how the browser paints native widgets (scrollbars, inputs,
 * form controls) in that color scheme — it does not pick a theme for you.
 */
export type NgColorScheme = 'light' | 'dark' | 'auto' | 'none';

/**
 * Declarative theme entry.
 *
 * A theme can be declared as a plain string (no color-scheme hint) or as an
 * object that pairs a name with a color-scheme hint.
 *
 * @example
 * ```ts
 * provideThemeStack({
 *   themes: ['system', 'light', 'dark', { name: 'sepia', scheme: 'light' }],
 * });
 * ```
 */
export interface NgThemeOption {
  /** Theme identifier. Must match `/^[a-zA-Z][a-zA-Z0-9_-]*$/`. */
  name: string;
  /**
   * Optional color-scheme hint for native UI widgets when this theme is active.
   * - Omitted (or `'auto'`): the library will not set a `color-scheme` hint.
   * - `'light'` / `'dark'`: hint is set on the root element while the theme is active.
   * - `'none'`: explicitly removed.
   */
  scheme?: NgColorScheme;
}

/**
 * Single entry in a `themes` array. Accepts either a plain string or a
 * {@link NgThemeOption} object.
 */
export type NgThemeInput = string | NgThemeOption;

/**
 * Normalized internal representation of every theme, regardless of the
 * user-facing input shape.
 */
export interface ResolvedTheme {
  /** Theme identifier, validated to be a valid CSS identifier. */
  name: string;
  /** Color-scheme hint to apply. Defaults to `'auto'` when omitted. */
  scheme: NgColorScheme;
}

/**
 * Normalizes a `themes` input (string or object form) into `ResolvedTheme[]`.
 *
 * - String entries are treated as scheme-less and default to `'auto'`.
 * - Object entries must have a non-empty `name` and a valid `scheme`.
 * - Built-in themes `'system'`, `'light'`, `'dark'` are special-cased:
 *   `'light'` and `'dark'` carry an implicit scheme of their own name;
 *   `'system'` is scheme-less (resolved via `matchMedia` at runtime).
 */
export function normalizeThemeInputs(themes: readonly NgThemeInput[]): ResolvedTheme[] {
  const seen = new Set<string>();
  const out: ResolvedTheme[] = [];
  for (const entry of themes) {
    if (typeof entry === 'string') {
      const name = entry.trim();
      if (name === '') continue;
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({ name, scheme: implicitScheme(name) });
    } else {
      const name = entry.name.trim();
      if (name === '') continue;
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({ name, scheme: entry.scheme ?? 'auto' });
    }
  }
  return out;
}

/**
 * Returns the implicit color-scheme hint for a built-in theme name.
 *
 * - `'light'` → `'light'`, `'dark'` → `'dark'` (matching CSS `color-scheme`).
 * - `'system'` → `'auto'` (resolved at runtime via `matchMedia`).
 * - any other name → `'auto'` (no hint; the browser picks).
 */
export function implicitScheme(name: string): NgColorScheme {
  if (name === 'light') return 'light';
  if (name === 'dark') return 'dark';
  return 'auto';
}

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
   * The list of supported theme identifiers.
   *
   * Accepts two input shapes (mixable in one array):
   * - **String**: plain theme name. No color-scheme hint is applied for custom
   *   themes; built-in names keep their implicit hint (`light`/`dark`).
   * - **Object**: `{ name, scheme? }`. Use when a custom theme needs an
   *   explicit `color-scheme` hint so native UI widgets match the theme.
   *
   * The built-in themes (`'light'`, `'dark'`, `'system'`) are **always
   * included** in the resolved list even if not in your array. Your entries
   * are appended after them.
   *
   * @example
   * // Legacy: string-only (works, no hints on custom themes)
   * themes: ['sepia', 'ocean'] as const
   *
   * @example
   * // New: object form with scheme hints
   * themes: [
   *   { name: 'sepia', scheme: 'light' },
   *   { name: 'ocean', scheme: 'dark' },
   * ] as const
   *
   * Resolved value stored in `resolvedThemes` (see {@link NgConfig.resolvedThemes}):
   * // [{ name: 'system', scheme: 'auto' }, { name: 'light', scheme: 'light' },
   * //  { name: 'dark', scheme: 'dark' }, { name: 'sepia', scheme: 'light' },
   * //  { name: 'ocean', scheme: 'dark' }]
   */
  themes: (NgTheme<T> | NgThemeOption)[];

  /**
   * Internal, normalized view of {@link NgConfig.themes}.
   * Populated by {@link normalizeThemeInputs}; read-only for consumers.
   * The public `themes` field is user-facing, while `resolvedThemes` carries
   * the parsed scheme hints.
   */
  resolvedThemes: ResolvedTheme[];
}
