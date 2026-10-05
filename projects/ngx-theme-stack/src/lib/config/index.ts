import { InjectionToken } from '@angular/core';
import { NgxThemeStackError } from '../errors';
import {
  DEFAULT_THEMES,
  DefaultNgTheme,
  NgConfig,
  normalizeThemeInputs,
  NgTheme,
  NgThemeInput,
  NgThemeOption,
} from '../types';

/**
 * ⚠ ATTENTION: SHARED CONFIGURATION VALUES
 *
 * These defaults MUST match the schematic defaults in:
 * projects/ngx-theme-stack/schematics/ng-add/constants.ts → DEFAULTS
 *
 * Schematics compile to CommonJS and cannot import from this ESM file,
 * so the values are intentionally duplicated. Change both at the same time.
 *
 * If you change defaults here, also update:
 * schematics/ng-add/constants.ts → DEFAULTS + DEFAULT_THEMES
 */

export const DEFAULT_NG_CONFIG: NgConfig = {
  defaultTheme: 'system',
  storageKey: 'ngx-theme-stack',
  mode: 'class',
  strategy: 'critters',
  themes: [...DEFAULT_THEMES] as (NgTheme | NgThemeOption)[],
  resolvedThemes: normalizeThemeInputs(DEFAULT_THEMES as unknown as NgThemeInput[]),
};

// The token uses NgConfig<string> because Angular DI resolves types at runtime
// and cannot carry generic parameters. Type-safety is enforced at the
// provideThemeStack() call site instead.
export const NGX_THEME_STACK_CONFIG = new InjectionToken<NgConfig<string>>(
  'NGX_THEME_STACK_CONFIG',
  {
    factory: () => DEFAULT_NG_CONFIG,
  },
);

/**
 * Provides Theme Stack configuration to Angular's DI system.
 *
 * The `themes` option accepts **additional** theme identifiers beyond the
 * built-in defaults. They are merged with `'light'`, `'dark'`, and `'system'`
 * so that the resolved {@link NgConfig.themes} array always includes all of
 * them — your custom values are appended after the built-ins.
 *
 * **Defaults:**
 * - `themes`: `['light', 'dark', 'system']`
 * - `defaultTheme`: `'system'`
 * - `storageKey`: `'ngx-theme-stack'`
 * - `mode`: `'class'`
 * - `strategy`: `'critters'`

 *
 * The type parameter `T` is **inferred automatically** from the `themes` array
 * when passed as a `const` — no need to specify it manually.
 *
 * @typeParam T - Custom theme string literals, inferred from the `themes` option.
 *
 * @param config - Optional partial configuration. Omitted fields fall back to
 *   {@link DEFAULT_NG_CONFIG}.
 *
 * @throws {@link NgxThemeStackError}
 *   - If any entry in `themes` is an empty or whitespace-only string.
 *   - If `defaultTheme` is not present in the resolved (merged) themes array.
 *   - If `storageKey` is an empty or whitespace-only string.
 *
 * @example
 * // Default — uses built-in themes and sensible defaults
 * provideThemeStack()
 *
 * @example
 * // Critters strategy — inlines all theme CSS in <head> (works for CSR, SSR, and SSG)
 * provideThemeStack({
 *   strategy: 'critters',
 *   mode: 'class',
 * })
 *
 * @example
 * // Closed union: TypeScript infers 'sepia' | 'ocean' from the array
 * provideThemeStack({
 *   themes: ['sepia', 'ocean'] as const,
 *   defaultTheme: 'sepia',   // ✅ in resolved themes
 *   // defaultTheme: 'nope', // ❌ throws NgxThemeStackError at runtime
 * })
 *
 * @example
 * // Custom storage key and mode
 * provideThemeStack({
 *   storageKey: 'my-app-theme',
 *   mode: 'attribute',
 * })
 */
export function provideThemeStack<const T extends string = DefaultNgTheme>(
  config: Partial<NgConfig<T>> = {},
) {
  // Validate user-supplied themes: any entry (string or object form) must
  // carry a non-empty, trimmed name.
  if (config.themes) {
    for (const entry of config.themes as NgThemeInput[]) {
      const name = typeof entry === 'string' ? entry : entry.name;
      if (name.trim() === '') {
        throw new NgxThemeStackError('Theme cannot be empty or whitespace.');
      }
    }
  }

  // Resolve built-in + user themes into a single list of names.
  const builtinNames: string[] = [...DEFAULT_NG_CONFIG.themes].map((t) =>
    typeof t === 'string' ? t : t.name,
  );
  const userNames: string[] = config.themes
    ? (config.themes as NgThemeInput[]).map((t) =>
        typeof t === 'string' ? t.trim() : t.name.trim(),
      )
    : [];
  const themes: string[] = Array.from(new Set([...builtinNames, ...userNames]));

  // Normalize to ResolvedTheme[] (with per-theme scheme hints).
  const allInputs: NgThemeInput[] = [
    ...DEFAULT_NG_CONFIG.themes,
    ...(config.themes ?? []),
  ];
  const resolvedThemes = normalizeThemeInputs(allInputs);

  if (config.defaultTheme && !themes.includes(config.defaultTheme as string)) {
    throw new NgxThemeStackError(
      `"defaultTheme" must be one of the resolved themes: [${themes.join(', ')}].`,
    );
  }

  if (config.storageKey !== undefined && config.storageKey.trim() === '') {
    throw new NgxThemeStackError('"storageKey" cannot be empty or whitespace.');
  }

  return {
    provide: NGX_THEME_STACK_CONFIG,
    useValue: {
      ...DEFAULT_NG_CONFIG,
      ...config,
      // `themes` stays the merged, deduplicated name list (backwards compatible);
      // `resolvedThemes` carries the normalized per-theme scheme hints.
      themes: themes as unknown as NgTheme[],
      resolvedThemes,
    } as NgConfig<string>,
  };
}
