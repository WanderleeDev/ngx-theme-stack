import { inject, Injectable } from '@angular/core';
import { CoreThemeService } from '../core/core-theme.service';
import { NgTheme } from '../types';

/**
 * Convenience service for selecting a theme from a list.
 *
 * Use this when you want to bind a `<select>` or a group of radio/tab
 * buttons to the full set of available themes.
 */
@Injectable({ providedIn: 'root' })
export class ThemeSelectService {
  readonly #core = inject(CoreThemeService);

  /** List of all configured themes. Defaults to ['light', 'dark', 'system']. */
  readonly availableThemes = this.#core.availableThemes;

  /** The theme explicitly selected by the user. May be `'system'`. */
  readonly selectedTheme = this.#core.selectedTheme;

  /** Resolved theme applied to the DOM. Always concrete — never `'system'`. */
  readonly resolvedTheme = this.#core.resolvedTheme;

  /** Whether the currently applied theme is dark. */
  readonly isDark = this.#core.isDark;

  /** Whether the currently applied theme is light. */
  readonly isLight = this.#core.isLight;

  /** Whether the currently applied theme is system. */
  readonly isSystem = this.#core.isSystem;

  /**
   * Whether the service has completed client-side initialization.
   * `false` during SSR. Becomes `true` after the first browser render.
   */
  readonly isHydrated = this.#core.isHydrated.asReadonly();

  /**
   * Applies the given theme.
   *
   * @param theme - The theme to apply: `'dark'`, `'light'`, `'system'`, or custom.
   * @throws If `theme` is not a valid theme according to library configuration.
   */
  select(theme: NgTheme): void {
    this.#core.setTheme(theme);
  }
}
