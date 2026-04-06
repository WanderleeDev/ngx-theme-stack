import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeSelectService } from './theme-select.service';
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
    storageKey: 'ngx-theme-stack-theme',
    mode: 'class',
    themes: ['light', 'dark', 'system'],
    ...config,
  };

  TestBed.configureTestingModule({
    providers: [
      CoreThemeService,
      ThemeSelectService,
      { provide: NGX_THEME_STACK_CONFIG, useValue: fullConfig },
      { provide: PLATFORM_ID, useValue: 'browser' },
    ],
  });

  return {
    service: TestBed.inject(ThemeSelectService),
  };
}

describe('ThemeSelectService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('should be created', () => {
    const { service } = setup();
    expect(service).toBeTruthy();
  });

  it('should expose availableThemes from config', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system', 'sepia'],
    });
    expect(service.availableThemes).toEqual(['light', 'dark', 'system', 'sepia']);
  });

  it('should select a theme', () => {
    const { service } = setup();
    service.select('dark');
    expect(service.selectedTheme()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('should select a custom theme', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system', 'ocean'],
    });
    service.select('ocean');
    expect(service.selectedTheme()).toBe('ocean');
    expect(service.resolvedTheme()).toBe('ocean');
  });

  it('should throw on invalid theme selection', () => {
    const { service } = setup();
    expect(() => service.select('nope')).toThrow('[ngx-theme-stack]');
  });

  it('should resolve system to concrete theme', () => {
    const { service } = setup();
    service.select('system');
    expect(service.selectedTheme()).toBe('system');
    // resolvedTheme should be resolved (light since matchMedia matches=false)
    expect(service.resolvedTheme()).toBe('light');
  });
});
