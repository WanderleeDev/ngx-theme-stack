import { InjectionToken } from '@angular/core';
import { NgxThemeStackError } from '../errors';
import { DEFAULT_THEMES, DefaultNgTheme, NgConfig } from '../types';

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

export const DEFAULT_NG_CONFIG = {
  defaultTheme: 'system',
  storageKey: 'ngx-theme-stack-theme',
  mode: 'class',
  themes: [...DEFAULT_THEMES],
} satisfies NgConfig;

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
 * Custom `themes` are **merged** with the built-in defaults
 * (`'light'`, `'dark'`, `'system'`), so you never lose the base themes.
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
 *   mode: 'class',
 * })
 */
export function provideThemeStack<const T extends string = DefaultNgTheme>(
  config: Partial<NgConfig<T>> = {},
) {
  config.themes?.forEach((t) => {
    if (t.trim() === '') throw new NgxThemeStackError('Theme cannot be empty or whitespace.');
  });

  const themes = config.themes
    ? Array.from(new Set([...DEFAULT_NG_CONFIG.themes, ...config.themes]))
    : DEFAULT_NG_CONFIG.themes;

  if (config.defaultTheme && !(themes as string[]).includes(config.defaultTheme as string)) {
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
      themes,
    } as NgConfig<string>,
  };
}
