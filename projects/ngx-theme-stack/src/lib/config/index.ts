import { InjectionToken } from '@angular/core';
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
 * Provides Theme Stack configuration.
 *
 * The type parameter `T` is **inferred automatically** from the `themes` array
 * when you pass it as a `const` — no need to specify it manually.
 *
 * @typeParam T - Custom theme literals, inferred from the `themes` option.
 *
 * @example
 * // Closed union: TypeScript knows about 'sepia' and 'ocean'
 * provideThemeStack({
 *   themes: ['light', 'dark', 'system', 'sepia', 'ocean'],
 *   theme: 'sepia',    // ✅
 *   theme: 'invalid',  // ❌ Type error
 * });
 *
 * // Open (default): same as before, accepts any string
 * provideThemeStack();
 */
export function provideThemeStack<const T extends string = DefaultNgTheme>(
  config: Partial<NgConfig<T>> = {},
) {
  const themes = config.themes
    ? Array.from(new Set([...DEFAULT_NG_CONFIG.themes, ...config.themes]))
    : DEFAULT_NG_CONFIG.themes;

  return {
    provide: NGX_THEME_STACK_CONFIG,
    useValue: {
      ...DEFAULT_NG_CONFIG,
      ...config,
      themes,
    } as NgConfig<string>,
  };
}
