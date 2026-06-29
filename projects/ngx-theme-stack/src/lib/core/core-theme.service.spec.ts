import { Component, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NGX_THEME_STACK_CONFIG } from '../config';
import { NgConfig } from '../types';
import { CoreThemeService } from './core-theme.service';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
class TestComponent {}

// ── Helpers ──────────────────────────────────────────────────────────────────

let store: Record<string, string>;
let matchMediaMock: {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

function setup(
  config: Partial<NgConfig> = {},
  initialStore: Record<string, string> = {},
  systemPrefersDark = false,
  platformId = 'browser',
  mockStorageGetError = false,
  mockStorageSetError = false,
) {
  store = { ...initialStore };

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => {
      if (mockStorageGetError) throw new Error('Storage disabled');
      return store[key] ?? null;
    },
    setItem: (key: string, value: string) => {
      if (mockStorageSetError) throw new Error('Quota exceeded');
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  });

  matchMediaMock = {
    matches: systemPrefersDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(matchMediaMock));

  const fullConfig: NgConfig = {
    defaultTheme: 'system',
    storageKey: 'ngx-theme-stack',
    mode: 'class',
    themes: ['light', 'dark', 'system'],
    strategy: 'critters',
    ...config,
  };

  TestBed.configureTestingModule({
    providers: [
      CoreThemeService,
      { provide: NGX_THEME_STACK_CONFIG, useValue: fullConfig },
      { provide: PLATFORM_ID, useValue: platformId },
    ],
  });

  const service = TestBed.inject(CoreThemeService);
  return { service };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CoreThemeService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    const host = document.documentElement;
    host.className = '';
    host.removeAttribute('data-theme');
    host.style.removeProperty('color-scheme');
  });

  // ── Initialization ──

  it('should be created', () => {
    const { service } = setup();
    expect(service).toBeTruthy();
  });

  it('should resolve system preference to dark when OS prefers dark', () => {
    const { service } = setup({}, {}, true);
    expect(service.isDark()).toBe(true);
    expect(service.resolvedTheme()).toBe('dark');
  });

  it('should resolve system preference to light when OS prefers light', () => {
    const { service } = setup({}, {}, false);
    expect(service.isLight()).toBe(true);
    expect(service.resolvedTheme()).toBe('light');
  });

  it('should default selectedTheme to config.theme', () => {
    const { service } = setup({ defaultTheme: 'dark' });
    expect(service.selectedTheme()).toBe('dark');
  });

  // ── localStorage persistence ──

  it('should restore saved theme from localStorage', () => {
    const { service } = setup({}, { 'ngx-theme-stack': 'dark' });
    expect(service.selectedTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('should ignore invalid saved theme from localStorage', () => {
    const { service } = setup({}, { 'ngx-theme-stack': 'invalid-theme' });
    // Falls back to config.theme ('system')
    expect(service.selectedTheme()).toBe('system');
  });

  it('should save theme to localStorage when setTheme is called', () => {
    const { service } = setup();
    service.setTheme('dark');
    expect(store['ngx-theme-stack']).toBe('dark');
  });

  it('should use custom storageKey from config', () => {
    const { service } = setup({ storageKey: 'my-custom-key' }, { 'my-custom-key': 'dark' });
    expect(service.selectedTheme()).toBe('dark');
  });

  // ── setTheme ──

  it('should update selectedTheme and resolvedTheme when setTheme is called', () => {
    const { service } = setup();
    service.setTheme('dark');
    expect(service.selectedTheme()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('should toggle between dark and light correctly', () => {
    const { service } = setup();
    service.setTheme('dark');
    expect(service.isDark()).toBe(true);

    service.setTheme('light');
    expect(service.isLight()).toBe(true);
  });

  it('should be idempotent when setting the same theme', () => {
    const { service } = setup();
    service.setTheme('dark');
    service.setTheme('dark');
    expect(service.isDark()).toBe(true);
  });

  it('should throw on invalid theme', () => {
    const { service } = setup();
    expect(() => service.setTheme('nope')).toThrow('[ngx-theme-stack]');
  });

  // ── System theme listener ──

  it('should register system listener on init when theme is system', () => {
    setup({}, {}, false);
    expect(matchMediaMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should register system listener when switching to system', () => {
    const { service } = setup({ defaultTheme: 'dark' });
    matchMediaMock.addEventListener.mockClear();
    service.setTheme('system');
    expect(matchMediaMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should remove system listener when switching away from system', () => {
    const { service } = setup();
    service.setTheme('dark');
    expect(matchMediaMock.removeEventListener).toHaveBeenCalled();
  });

  // ── Custom themes ──

  it('should support custom themes', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system', 'sepia', 'ocean'],
    });
    service.setTheme('sepia');
    expect(service.selectedTheme()).toBe('sepia');
    expect(service.resolvedTheme()).toBe('sepia');
    expect(service.isDark()).toBe(false);
    expect(service.isLight()).toBe(false);
  });

  it('should reject themes not in the configured list', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system'],
    });
    expect(() => service.setTheme('sepia')).toThrow('Invalid theme');
  });

  // ── SSR safety ──

  it('should not touch DOM or localStorage in SSR for valid themes', () => {
    const { service } = setup({}, {}, false, 'server');

    // selectedTheme defaults to config value
    expect(service.selectedTheme()).toBe('system');

    // setTheme with a valid theme is a no-op for DOM/localStorage in SSR
    service.setTheme('dark');
    expect(service.selectedTheme()).toBe('system');
    expect(store['ngx-theme-stack']).toBeUndefined();
  });

  it('should throw on invalid theme even in SSR', () => {
    const { service } = setup({}, {}, false, 'server');
    expect(() => service.setTheme('nope')).toThrow('[ngx-theme-stack]');
  });

  it('should resolve resolvedTheme to config.theme in SSR (never system)', () => {
    const { service } = setup({ defaultTheme: 'dark' }, {}, false, 'server');
    expect(service.resolvedTheme()).toBe('dark');
  });

  // ── DOM updates and Modes ──

  it('should apply theme as class when mode is class', () => {
    const { service } = setup({ mode: 'class' });
    TestBed.tick();
    service.setTheme('dark');
    TestBed.tick();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('should apply theme as attribute when mode is attribute', () => {
    const { service } = setup({ mode: 'attribute' });
    TestBed.tick();
    service.setTheme('dark');
    TestBed.tick();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should apply theme as both when mode is both', () => {
    const { service } = setup({ mode: 'both' });
    TestBed.tick();
    service.setTheme('dark');
    TestBed.tick();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should apply color-scheme style property for light/dark themes and remove it for custom themes', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system', 'sepia'],
    });
    TestBed.tick();

    service.setTheme('dark');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('dark');

    service.setTheme('light');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('light');

    service.setTheme('sepia');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('');
  });

  // ── Hydration Signal ──

  it('should set isHydrated to true in browser environment after next render', () => {
    const { service } = setup();
    expect(service.isHydrated()).toBe(false);

    // Create a dummy component and trigger change detection/rendering to run afterNextRender
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    expect(service.isHydrated()).toBe(true);
  });

  it('should keep isHydrated as false in server environment (SSR)', () => {
    const { service } = setup({}, {}, false, 'server');
    expect(service.isHydrated()).toBe(false);
  });

  // ── Anti-flash ──

  it('should capture and remove anti-flash class in browser', () => {
    // Add 'dark' to document element representing pre-rendered state
    document.documentElement.classList.add('dark');

    // Setup service with storage theme 'dark' and mode 'attribute'
    // This ensures 'dark' is removed from classList by the anti-flash logic and not re-added as class
    setup({ mode: 'attribute' }, { 'ngx-theme-stack': 'dark' });
    TestBed.tick();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should capture and remove anti-flash class for system theme stored', () => {
    document.documentElement.classList.add('dark');
    // System pref is dark (true). Stored is 'system'.
    setup({ mode: 'attribute' }, { 'ngx-theme-stack': 'system' }, true);
    TestBed.tick();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should remove anti-flash class and apply both class and attribute when mode is both', () => {
    document.documentElement.classList.add('dark');
    setup({ mode: 'both' }, { 'ngx-theme-stack': 'light' });
    TestBed.tick();

    // 'dark' (anti-flash) removed, 'light' added as class and attribute
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should do nothing for anti-flash in SSR environment', () => {
    document.documentElement.classList.add('dark');
    setup({ mode: 'attribute' }, { 'ngx-theme-stack': 'dark' }, false, 'server');
    TestBed.tick();

    // In SSR, anti-flash is a no-op, so 'dark' class remains on element
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  // ── LocalStorage Error Handling ──

  it('should catch exceptions and log warning when localStorage.getItem throws', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

    const { service } = setup({}, {}, false, 'browser', true, false);
    expect(service.selectedTheme()).toBe('system'); // Falls back to default config theme
    expect(warnSpy).toHaveBeenCalledWith(
      '[ngx-theme-stack] Could not read theme from localStorage.',
      expect.any(Error),
    );
  });

  it('should catch exceptions and log warning when localStorage.setItem throws', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

    const { service } = setup({}, {}, false, 'browser', false, true);
    service.setTheme('dark');
    expect(warnSpy).toHaveBeenCalledWith(
      '[ngx-theme-stack] Could not save theme to localStorage.',
      expect.any(Error),
    );
  });
});
