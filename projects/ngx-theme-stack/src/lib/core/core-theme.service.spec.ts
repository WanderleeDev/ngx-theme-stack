import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CoreThemeService } from './core-theme.service';
import { NgConfig } from '../types';
import { NGX_THEME_STACK_CONFIG } from '../config';

// ── Helpers ──────────────────────────────────────────────────────────────────

let store: Record<string, string>;
let matchMediaMock: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };

function setup(
  config: Partial<NgConfig> = {},
  initialStore: Record<string, string> = {},
  systemPrefersDark = false,
  platformId = 'browser',
) {
  store = { ...initialStore };

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  });

  matchMediaMock = {
    matches: systemPrefersDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(matchMediaMock));

  const fullConfig: NgConfig = {
    theme: 'system',
    storageKey: 'ngx-theme-stack-theme',
    mode: 'class',
    themes: ['light', 'dark', 'system'],
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
  });

  // ── Initialization ──

  it('should be created', () => {
    const { service } = setup();
    expect(service).toBeTruthy();
  });

  it('should resolve system preference to dark when OS prefers dark', () => {
    const { service } = setup({}, {}, true);
    expect(service.isDark()).toBe(true);
    expect(service.userTheme()).toBe('dark');
  });

  it('should resolve system preference to light when OS prefers light', () => {
    const { service } = setup({}, {}, false);
    expect(service.isLight()).toBe(true);
    expect(service.userTheme()).toBe('light');
  });

  it('should default selectedTheme to config.theme', () => {
    const { service } = setup({ theme: 'dark' });
    expect(service.selectedTheme()).toBe('dark');
  });

  // ── localStorage persistence ──

  it('should restore saved theme from localStorage', () => {
    const { service } = setup({}, { 'ngx-theme-stack-theme': 'dark' });
    expect(service.selectedTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('should ignore invalid saved theme from localStorage', () => {
    const { service } = setup({}, { 'ngx-theme-stack-theme': 'invalid-theme' });
    // Falls back to config.theme ('system')
    expect(service.selectedTheme()).toBe('system');
  });

  it('should save theme to localStorage when setTheme is called', () => {
    const { service } = setup();
    service.setTheme('dark');
    expect(store['ngx-theme-stack-theme']).toBe('dark');
  });

  it('should use custom storageKey from config', () => {
    const { service } = setup(
      { storageKey: 'my-custom-key' },
      { 'my-custom-key': 'dark' },
    );
    expect(service.selectedTheme()).toBe('dark');
  });

  // ── setTheme ──

  it('should update selectedTheme and userTheme when setTheme is called', () => {
    const { service } = setup();
    service.setTheme('dark');
    expect(service.selectedTheme()).toBe('dark');
    expect(service.userTheme()).toBe('dark');
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
    const { service } = setup({ theme: 'dark' });
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
    expect(service.userTheme()).toBe('sepia');
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

  it('should not touch DOM or localStorage in SSR', () => {
    const { service } = setup({}, {}, false, 'server');

    // selectedTheme defaults to config value
    expect(service.selectedTheme()).toBe('system');

    // setTheme is a no-op in SSR
    service.setTheme('dark');
    expect(service.selectedTheme()).toBe('system');
    expect(store['ngx-theme-stack-theme']).toBeUndefined();
  });

  it('should resolve userTheme to config.theme in SSR (never system)', () => {
    const { service } = setup({ theme: 'dark' }, {}, false, 'server');
    expect(service.userTheme()).toBe('dark');
  });
});
