import { InjectionToken } from '@angular/core';
import { DEFAULT_THEMES, NgConfig } from '../types';

/**
 * ⚠ ATTENTION: SHARED CONFIGURATION VALUES
 *
 * These values MUST match the schematic defaults in:
 * projects/ngx-theme-stack/schematics/ng-add/index.ts
 *
 * If you change any of these, you MUST also update the schematic's DEFAULTS
 * constant so 'ng add' continues to provide correct hints and clean code.
 */
export const DEFAULT_NG_CONFIG = {
  theme: 'system',
  storageKey: 'ngx-theme-stack-theme',
  mode: 'class',
  themes: [...DEFAULT_THEMES],
} satisfies NgConfig;

export const NGX_THEME_STACK_CONFIG = new InjectionToken<NgConfig>('NGX_THEME_STACK_CONFIG', {
  factory: () => DEFAULT_NG_CONFIG,
});

/**
 * Helper function to provide Theme Stack configuration.
 */
export function provideThemeStack(config: Partial<NgConfig> = {}) {
  return {
    provide: NGX_THEME_STACK_CONFIG,
    useValue: {
      ...DEFAULT_NG_CONFIG,
      ...config,
    } satisfies NgConfig,
  };
}
