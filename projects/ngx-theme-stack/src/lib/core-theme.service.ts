import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { NGX_THEME_STACK_CONFIG } from './theme-stack.config';
import { NgSystemTheme, NgTheme } from './types';

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

  /** List of available themes for Select/Cycle services. Defaults to ['light', 'dark', 'system']. */
  readonly availableThemes = this.#config.themes;

  /** Internal Set for O(1) existence checks. */
  readonly #validThemes = new Set<NgTheme>(this.availableThemes);

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
  readonly userTheme = computed(() => {
    const theme = this.#selectedTheme();
    return theme === 'system' ? this.#systemPreference() : theme;
  });

  /** Whether the currently applied theme is dark. */
  readonly isDark = computed(() => this.userTheme() === 'dark');

  /** Whether the currently applied theme is light. */
  readonly isLight = computed(() => this.userTheme() === 'light');

  // ── Event handler ─────────────────────────────────────────────────────────

  readonly #onSystemPreferenceChange = () =>
    this.#systemPreference.set(this.resolveSystemPreference());

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    if (this.#isBrowser && this.#selectedTheme() === 'system') {
      this.startSystemThemeListener();
    }

    effect(() => this.applyThemeToDOM(this.userTheme()));

    this.#destroyRef.onDestroy(() => this.stopSystemThemeListener());
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Changes the active theme.
   *
   * Persists the choice explicitly so that switching e.g. from `'system'` to
   * `'light'` is saved even when the resolved `userTheme` did not change
   * (system preference was already `'light'`).
   *
   * @param theme - The theme to apply: `'dark'`, `'light'`, `'system'`, or a custom theme name.
   * @throws If `theme` is not a valid theme according to library configuration.
   */
  public setTheme(theme: NgTheme): void {
    if (!this.#isBrowser) return;

    if (!this.#validThemes.has(theme)) {
      throw new Error(
        `[ngx-theme-stack] Invalid theme: "${theme}". Valid values are: ${[...this.#validThemes].join(', ')}.`,
      );
    }

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
    if (!this.#isBrowser) return this.#config.theme;
    return this.readStoredTheme() ?? this.#config.theme;
  }

  private startSystemThemeListener(): void {
    if (!this.#mediaQuery) return;
    this.stopSystemThemeListener();
    this.#mediaQuery.addEventListener('change', this.#onSystemPreferenceChange);
  }

  private stopSystemThemeListener(): void {
    this.#mediaQuery?.removeEventListener('change', this.#onSystemPreferenceChange);
  }

  private applyThemeToDOM(userTheme: NgTheme): void {
    if (!this.#isBrowser) return;

    const host = this.#document.documentElement;
    const { mode } = this.#config;

    if (mode === 'attribute' || mode === 'both') {
      this.applyThemeAttribute(host, userTheme);
    }

    if (mode === 'class' || mode === 'both') {
      this.applyThemeClasses(host, userTheme);
    }

    this.applyColorSchemeHint(host, userTheme);
  }

  private applyThemeAttribute(host: HTMLElement, theme: NgTheme): void {
    host.setAttribute('data-theme', theme);
  }

  private applyThemeClasses(host: HTMLElement, theme: NgTheme): void {
    for (const t of this.availableThemes) {
      host.classList.remove(t);
    }

    host.classList.add(theme);
  }

  private applyColorSchemeHint(host: HTMLElement, theme: NgTheme): void {
    if (theme === 'dark' || theme === 'light') {
      host.style.setProperty('color-scheme', theme);
      return;
    }

    host.style.removeProperty('color-scheme');
  }

  private readStoredTheme(): NgTheme | null {
    try {
      const stored = localStorage.getItem(this.#config.storageKey);
      if (stored && this.#validThemes.has(stored as NgTheme)) {
        return stored as NgTheme;
      }
      return null;
    } catch (e) {
      console.warn('[ngx-theme-stack] Could not read theme from localStorage.', e);
      return null;
    }
  }

  private saveTheme(theme: NgTheme): void {
    try {
      localStorage.setItem(this.#config.storageKey, theme);
    } catch (e) {
      console.warn('[ngx-theme-stack] Could not save theme to localStorage.', e);
    }
  }
}
