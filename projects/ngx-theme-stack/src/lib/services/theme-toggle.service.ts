import { inject, Injectable } from '@angular/core';
import { CoreThemeService } from '../core/core-theme.service';

/**
 * Convenience service for toggling between `'dark'` and `'light'`.
 *
 * Use this when you only need a simple on/off switch and do not
 * need to manage `'system'` or cycle through themes.
 */
@Injectable({ providedIn: 'root' })
export class ThemeToggleService {
  readonly #core = inject(CoreThemeService);

  /** Resolved theme applied to the DOM. Always concrete — never `'system'`. */
  readonly resolvedTheme = this.#core.resolvedTheme;

  readonly selectedTheme = this.#core.selectedTheme;

  /** Whether the currently applied theme is dark. */
  readonly isDark = this.#core.isDark;

  /** Whether the currently applied theme is light. */
  readonly isLight = this.#core.isLight;

  /** Whether the currently applied theme is system. */
  readonly isSystem = this.#core.isSystem;

  /**
   * Whether the service has completed client-side initialization.
   * `false` during SSR. Becomes `true` after the first browser render.
   * Guard any template logic that shows `selectedTheme` or `resolvedTheme`
   * behind this signal to avoid a hydration-mismatch flash.
   */
  readonly isHydrated = this.#core.isHydrated.asReadonly();

  /**
   * Toggles between `'dark'` and `'light'`.
   *
   * If the selected theme is explicitly `'dark'`, switches to `'light'`.
   * Otherwise (including `'system'`), switches to `'dark'`.
   */
  toggle(): void {
    const next = this.#core.resolvedTheme() === 'dark' ? 'light' : 'dark';
    this.#core.setTheme(next);
  }
}
