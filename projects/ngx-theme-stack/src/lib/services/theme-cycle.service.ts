import { inject, Injectable } from '@angular/core';
import { CoreThemeService } from '../core/core-theme.service';

/**
 * Convenience service for cycling through themes in a fixed order.
 *
 * Default cycle: `'system'` → `'light'` → `'dark'` → `'system'` → ...
 *
 * Use this when you want to offer users a single button that rotates
 * through all available theme options.
 */
@Injectable({ providedIn: 'root' })
export class ThemeCycleService {
  readonly #core = inject(CoreThemeService);

  /** List of all configured themes for cycling. Defaults to ['light', 'dark', 'system']. */
  readonly #cycle = this.#core.availableThemes;

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
   * Advances to the next theme in the cycle.
   *
   * Cycle order is determined by the configured `themes` property in `NgConfig`.
   *
   * If the current theme is not found in the cycle (e.g. set externally),
   * the cycle restarts from the first theme.
   */
  cycle(): void {
    const current = this.#core.selectedTheme();
    const index = this.#cycle.indexOf(current);
    const next = this.#cycle[(index + 1) % this.#cycle.length];
    this.#core.setTheme(next);
  }
}
