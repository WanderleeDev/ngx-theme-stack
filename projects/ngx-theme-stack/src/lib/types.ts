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

/**
 * Canonical list of accepted `color-scheme` hints.
 *
 * The type is derived from this runtime array, so the list and the union can
 * never disagree. It is copied into the schematics by
 * scripts/generate-schematic-constants.mjs.
 */
export const NG_COLOR_SCHEMES = ['light', 'dark', 'auto'] as const;

/**
 * Whether `value` is one of the accepted color schemes.
 *
 * Used to validate a hand-written config, which can reach the runtime without
 * the compiler having checked it.
 */
export function isNgColorScheme(value: unknown): value is NgColorScheme {
  return (NG_COLOR_SCHEMES as readonly unknown[]).includes(value);
}

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
 * - `'auto'` — no explicit hint; the browser chooses, usually from the OS.
 *
 * An unknown value is not a valid hint: the schematic falls back to `'auto'`.
 *
 * This value is forwarded to `document.documentElement.style.color-scheme`.
 * It only affects how the browser paints native widgets (scrollbars, inputs,
 * form controls) in that color scheme — it does not pick a theme for you.
 */
export type NgColorScheme = (typeof NG_COLOR_SCHEMES)[number];

/**
 * Pattern a theme identifier must match to be usable as a CSS class.
 *
 * A theme name is emitted as a class selector (`.name`) in class mode, so it has
 * to be a valid CSS identifier. The anti-flash script also puts it into
 * `classList`, where an ASCII whitespace throws `InvalidCharacterError`.
 *
 * This is deliberately ASCII-only: a narrower, easy-to-reason-about subset than
 * the full CSS identifier grammar, which also admits non-ASCII characters. The
 * point is that the rule is **enforced**, so a name that would break is a build
 * error instead of a silent first-paint flash.
 *
 * What each part excludes, and why it matters:
 * - a leading digit (`2lucky`) makes `.2lucky` invalid CSS, so the browser drops
 *   the whole rule and the theme silently loses its styles;
 * - an ASCII space (`lucky theme`) throws in `classList.add`;
 * - a CSS metacharacter (`.`, `#`, `>`, `[`, `:`, ...) changes what the selector
 *   means: `.lucky.theme` looks for two classes while the class token is the
 *   single string `lucky.theme`, so the styles never match, with no error.
 *
 * ⚠ KEEP IN SYNC with THEME_NAME_PATTERN in
 * projects/ngx-theme-stack/schematics/ng-add/constants.ts — the schematics are
 * CommonJS and cannot import this ESM module, so the pattern is duplicated and
 * a spec asserts both copies are identical.
 */
export const THEME_NAME_SOURCE = '^-?[a-zA-Z_][a-zA-Z0-9_-]*$';

export const THEME_NAME_PATTERN = new RegExp(THEME_NAME_SOURCE);

/** Whether `name` is usable as a theme identifier. See {@link THEME_NAME_PATTERN}. */
export function isValidThemeName(name: string): boolean {
  return THEME_NAME_PATTERN.test(name);
}

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
  /** Theme identifier. Must match {@link THEME_NAME_PATTERN}. */
  name: string;
  /**
   * Optional color-scheme hint for native UI widgets when this theme is active.
   * - Omitted (or `'auto'`): no hint is set; the browser decides.
   * - `'light'` / `'dark'`: hint is set on the root element while the theme is active.
   *
   * Any other value is invalid and is treated as `'auto'`.
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
 * - Object entries must have a non-empty `name`. A `scheme` outside
 *   {@link NG_COLOR_SCHEMES} is replaced by `'auto'` rather than passed through:
 *   a hand-written config can reach the runtime without the compiler having
 *   checked it, and `'banana'` would otherwise be written straight into
 *   `style.setProperty('color-scheme', ...)`.
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
      out.push({ name, scheme: isNgColorScheme(entry.scheme) ? entry.scheme : 'auto' });
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
