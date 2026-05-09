import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { NGX_THEME_STACK_CONFIG } from '../config';
import { NgxThemeStackError } from '../errors';
import { NgSystemTheme, NgTheme } from '../types';

/**
 * Core service for managing the application's color theme.
 *
 * Handles theme persistence, system preference detection, and DOM updates.
 * Supports built-in themes ('dark', 'light', 'system') and custom extensions.
 */
@Injectable({ providedIn: 'root' })
export class CoreThemeService {
  // ── Dependencies ──────────────────────────────────────────────────────────

  readonly #config = inject(NGX_THEME_STACK_CONFIG);
  readonly #destroyRef = inject(DestroyRef);
  readonly #document = inject(DOCUMENT);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // ── Theme configuration ───────────────────────────────────────────────────

  /** The initial stored theme read from localStorage on startup. */
  readonly #initialStoredTheme = this.readStoredTheme();

  /** List of available themes for Select/Cycle services. Defaults to ['system', 'light', 'dark']. */
  readonly availableThemes = this.#config.themes;

  /** Internal Set for O(1) existence checks. */
  readonly #validThemes = new Set<NgTheme>(this.availableThemes);

  /**
   * The anti-flash class to remove from the host element.
   * Internal mechanism to bridge the gap between the blocking script's
   * initial DOM state and Angular's first effect run.
   */
  #antiFlashClass: string | null = null;

  // ── System preference ─────────────────────────────────────────────────────

  /** MediaQueryList for OS color scheme, created once and reused. Null in SSR. */
  readonly #mediaQuery: MediaQueryList | null = this.#isBrowser
    ? (this.#document.defaultView?.matchMedia('(prefers-color-scheme: dark)') ?? null)
    : null;

  readonly #systemPreference = signal<NgSystemTheme>(this.resolveSystemPreference());

  // ── Theme state ───────────────────────────────────────────────────────────

  readonly #selectedTheme = signal<NgTheme>(this.resolveInitialTheme());

  /** The theme explicitly selected by the user. May be `'system'`. */
  readonly selectedTheme = this.#selectedTheme.asReadonly();

  /** Resolved theme applied to the DOM. Always `'dark'` or `'light'` (or custom) — never `'system'`. */
  readonly resolvedTheme = computed(() => {
    const theme = this.#selectedTheme();
    return theme === 'system' ? this.#systemPreference() : theme;
  });

  /**
   * Whether the currently applied theme is dark.
   *
   * Returns `false` when a custom theme (e.g. `'sunset'`) is active — use
   * `resolvedTheme()` directly if you need to inspect the current custom theme.
   */
  readonly isDark = computed(() => this.resolvedTheme() === 'dark');

  /**
   * Whether the currently applied theme is light.
   *
   * Returns `false` when a custom theme (e.g. `'sepia'`) is active — use
   * `resolvedTheme()` directly if you need to inspect the current custom theme.
   */
  readonly isLight = computed(() => this.resolvedTheme() === 'light');

  /** Whether the currently applied theme is system. */
  readonly isSystem = computed(() => this.selectedTheme() === 'system');

  /**
   * Whether the service has completed client-side initialization.
   *
   * `false` during SSR and on the very first render pass before the initial theme
   * is resolved from `localStorage`. Becomes `true` immediately after the
   * first browser render pass.
   *
   * **Important:** Guard template elements that display `selectedTheme()` or
   * `resolvedTheme()` behind this signal to prevent hydration-mismatch flashes
   * (e.g. if the server renders the default 'system' but the user has 'dark' stored).
   *
   * @example
   * ```html
   * {{ theme.isHydrated() ? theme.selectedTheme() : '...' }}
   * ```
   */
  readonly isHydrated = signal(false);

  // ── Event handler ─────────────────────────────────────────────────────────

  readonly #onSystemPreferenceChange = () =>
    this.#systemPreference.set(this.resolveSystemPreference());

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    this.captureAntiFlashClass();

    if (this.#isBrowser && this.#selectedTheme() === 'system') {
      this.startSystemThemeListener();
    }

    effect(() => this.applyThemeToDOM(this.resolvedTheme()));
    afterNextRender(() => this.isHydrated.set(true));
    this.#destroyRef.onDestroy(() => this.stopSystemThemeListener());
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Changes the active theme.
   *
   * Persists the choice explicitly so that switching e.g. from `'system'` to
   * `'light'` is saved even when the resolved theme did not change
   * (system preference was already `'light'`).
   *
   * @param theme - The theme to apply: `'dark'`, `'light'`, `'system'`, or a custom theme name.
   * @throws If `theme` is not a valid theme according to library configuration.
   */
  public setTheme(theme: NgTheme): void {
    if (!this.#validThemes.has(theme)) {
      throw new NgxThemeStackError(
        `Invalid theme: "${theme}". Valid values are: ${[...this.#validThemes].join(', ')}.`,
      );
    }
    if (!this.#isBrowser) return;
    if (theme === this.#selectedTheme()) return;
    if (theme === 'system') {
      this.#systemPreference.set(this.resolveSystemPreference());
      this.startSystemThemeListener();
    } else {
      this.stopSystemThemeListener();
    }

    this.#selectedTheme.set(theme);
    this.saveTheme(theme);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private resolveSystemPreference(): NgSystemTheme {
    return this.#mediaQuery?.matches ? 'dark' : 'light';
  }

  private resolveInitialTheme(): NgTheme {
    const theme = this.#initialStoredTheme;
    if (theme && this.#validThemes.has(theme as NgTheme)) {
      return theme as NgTheme;
    }
    return this.#config.defaultTheme;
  }

  private startSystemThemeListener(): void {
    if (!this.#mediaQuery) return;
    this.stopSystemThemeListener();
    this.#mediaQuery.addEventListener('change', this.#onSystemPreferenceChange);
  }

  private stopSystemThemeListener(): void {
    this.#mediaQuery?.removeEventListener('change', this.#onSystemPreferenceChange);
  }

  private applyThemeToDOM(theme: NgTheme): void {
    if (!this.#isBrowser) return;

    const host = this.#document.documentElement;

    if (this.#antiFlashClass) {
      host.classList.remove(this.#antiFlashClass);
      this.#antiFlashClass = null;
    }

    const { mode } = this.#config;

    if (mode === 'attribute' || mode === 'both') {
      this.applyThemeAttribute(host, theme);
    }

    if (mode === 'class' || mode === 'both') {
      this.applyThemeClasses(host, theme);
    }

    this.applyColorSchemeHint(host, theme);
  }

  private applyThemeAttribute(host: HTMLElement, theme: NgTheme): void {
    host.setAttribute('data-theme', theme);
  }

  private applyThemeClasses(host: HTMLElement, theme: NgTheme): void {
    host.classList.remove(...this.availableThemes);
    host.classList.add(theme);
  }

  private applyColorSchemeHint(host: HTMLElement, theme: NgTheme): void {
    if (theme === 'dark' || theme === 'light') {
      host.style.setProperty('color-scheme', theme);
      return;
    }

    host.style.removeProperty('color-scheme');
  }

  private captureAntiFlashClass(): void {
    if (!this.#isBrowser || !this.#initialStoredTheme) return;

    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(this.#initialStoredTheme)) {
      this.#antiFlashClass = null;
      return;
    }

    if (this.#initialStoredTheme === 'system') {
      this.#antiFlashClass = this.resolveSystemPreference();
      return;
    }

    this.#antiFlashClass = this.#initialStoredTheme;
  }

  private readStoredTheme(): string | null {
    if (!this.#isBrowser) return null;

    try {
      return localStorage.getItem(this.#config.storageKey);
    } catch (e) {
      console.warn('[ngx-theme-stack] Could not read theme from localStorage.', e);
      return null;
    }
  }

  private saveTheme(theme: NgTheme): void {
    if (!this.#isBrowser) return;

    try {
      localStorage.setItem(this.#config.storageKey, theme);
    } catch (e) {
      console.warn('[ngx-theme-stack] Could not save theme to localStorage.', e);
    }
  }
}
