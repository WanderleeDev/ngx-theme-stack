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
  readonly userTheme = this.#core.userTheme;

  /** Whether the currently applied theme is dark. */
  readonly isDark = this.#core.isDark;

  /** Whether the currently applied theme is light. */
  readonly isLight = this.#core.isLight;

  /**
   * Toggles between `'dark'` and `'light'`.
   *
   * If the selected theme is explicitly `'dark'`, switches to `'light'`.
   * Otherwise (including `'system'`), switches to `'dark'`.
   */
  toggle(): void {
    const next = this.#core.selectedTheme() === 'dark' ? 'light' : 'dark';
    this.#core.setTheme(next);
  }
}
