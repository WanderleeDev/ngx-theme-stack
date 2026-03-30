import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CoreThemeService } from './core-theme.service';
import { ThemeToggleService } from './theme-toggle.service';
import { NGX_THEME_STACK_CONFIG } from './theme-stack.config';
import { NgConfig } from './types';

function setup(systemPrefersDark = false) {
  let store: Record<string, string> = {};

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  });

  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: systemPrefersDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

  const config: NgConfig = {
    theme: 'system',
    storageKey: 'ngx-theme-stack-theme',
    mode: 'class',
    themes: ['light', 'dark', 'system'],
  };

  TestBed.configureTestingModule({
    providers: [
      CoreThemeService,
      ThemeToggleService,
      { provide: NGX_THEME_STACK_CONFIG, useValue: config },
      { provide: PLATFORM_ID, useValue: 'browser' },
    ],
  });

  return {
    service: TestBed.inject(ThemeToggleService),
    core: TestBed.inject(CoreThemeService),
  };
}

describe('ThemeToggleService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('should be created', () => {
    const { service } = setup();
    expect(service).toBeTruthy();
  });

  it('should expose userTheme signal', () => {
    const { service } = setup(false);
    expect(service.userTheme()).toBe('light');
  });

  it('should toggle from light to dark', () => {
    const { service, core } = setup();
    core.setTheme('light');
    expect(service.isLight()).toBe(true);

    service.toggle();
    expect(service.isDark()).toBe(true);
    expect(service.userTheme()).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    const { service, core } = setup();
    core.setTheme('dark');
    expect(service.isDark()).toBe(true);

    service.toggle();
    expect(service.isLight()).toBe(true);
    expect(service.userTheme()).toBe('light');
  });

  it('should toggle from system to dark', () => {
    const { service } = setup(false);
    // system resolves to light, toggle should go to dark
    service.toggle();
    expect(service.isDark()).toBe(true);
  });
});
