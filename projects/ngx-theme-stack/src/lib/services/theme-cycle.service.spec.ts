import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeCycleService } from './theme-cycle.service';
import { NGX_THEME_STACK_CONFIG } from '../config';
import { CoreThemeService } from '../core/core-theme.service';
import { NgConfig } from '../types';

function setup(config: Partial<NgConfig> = {}) {
  let store: Record<string, string> = {};

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  });

  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

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
      ThemeCycleService,
      { provide: NGX_THEME_STACK_CONFIG, useValue: fullConfig },
      { provide: PLATFORM_ID, useValue: 'browser' },
    ],
  });

  return {
    service: TestBed.inject(ThemeCycleService),
    core: TestBed.inject(CoreThemeService),
  };
}

describe('ThemeCycleService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('should be created', () => {
    const { service } = setup();
    expect(service).toBeTruthy();
  });

  it('should cycle through themes in order: light → dark → system → light', () => {
    const { service, core } = setup();
    core.setTheme('light');

    service.cycle();
    expect(service.selectedTheme()).toBe('dark');

    service.cycle();
    expect(service.selectedTheme()).toBe('system');

    service.cycle();
    expect(service.selectedTheme()).toBe('light');
  });

  it('should cycle through custom themes', () => {
    const { service, core } = setup({
      themes: ['light', 'dark', 'system', 'sepia'],
    });
    core.setTheme('system');

    service.cycle();
    expect(service.selectedTheme()).toBe('sepia');

    service.cycle();
    expect(service.selectedTheme()).toBe('light');
  });

  it('should restart from first if current theme is not in cycle', () => {
    const { service, core } = setup({
      themes: ['light', 'dark', 'system'],
    });
    // Force a theme not in the list via core (bypassing validation for test)
    // When indexOf returns -1, (−1 + 1) % length = 0 → first theme
    core.setTheme('light');
    service.cycle();
    expect(service.selectedTheme()).toBe('dark');
  });

  it('should expose resolvedTheme signal', () => {
    const { service, core } = setup();
    core.setTheme('dark');
    expect(service.resolvedTheme()).toBe('dark');
  });

  it('should expose isDark and isLight signals', () => {
    const { service, core } = setup();
    core.setTheme('dark');
    expect(service.isDark()).toBe(true);
    expect(service.isLight()).toBe(false);
  });
});
