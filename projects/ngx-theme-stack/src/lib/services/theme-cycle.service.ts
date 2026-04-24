import { computed, inject, Injectable } from '@angular/core';
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

  /** List of all configured themes for cycling. Defaults to `['light', 'dark', 'system']`. */
  readonly availableThemes = this.#core.availableThemes;

  /** The theme explicitly selected by the user. May be `'system'`. */
  readonly selectedTheme = this.#core.selectedTheme;

  /** Resolved theme currently applied to the DOM. Always concrete — never `'system'`. */
  readonly resolvedTheme = this.#core.resolvedTheme;

  /** Index of the currently selected theme in the cycle. */
  readonly cycleIndex = computed(() => {
    return this.availableThemes.indexOf(this.selectedTheme());
  });

  /** The theme that comes before the currently selected theme in the cycle. */
  readonly preceding = computed(() => {
    const index = this.cycleIndex();
    const len = this.availableThemes.length;
    return this.availableThemes[(index - 1 + len) % len];
  });

  /** The theme that comes after the currently selected theme in the cycle. */
  readonly upcoming = computed(() => {
    const index = this.cycleIndex();
    return this.availableThemes[(index + 1) % this.availableThemes.length];
  });

  /** Whether the currently applied theme is `'dark'`. */
  readonly isDark = this.#core.isDark;

  /** Whether the currently applied theme is `'light'`. */
  readonly isLight = this.#core.isLight;

  /** Whether the user has explicitly selected `'system'` preference. */
  readonly isSystem = this.#core.isSystem;

  /**
   * Whether the service has completed client-side initialization and
   * resolved the real persisted theme. Use to prevent hydration flashes.
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
    this.#core.setTheme(this.upcoming());
  }
}
