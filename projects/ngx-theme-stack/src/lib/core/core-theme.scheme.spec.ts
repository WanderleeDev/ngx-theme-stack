import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CoreThemeService } from './core-theme.service';
import { NGX_THEME_STACK_CONFIG } from '../config';
import { NgConfig, normalizeThemeInputs, NgThemeInput } from '../types';

function setup(
  config: Partial<NgConfig> = {},
  initialStore: Record<string, string> = {},
  systemPrefersDark = false,
  platformId = 'browser',
) {
  let store: Record<string, string> = { ...initialStore };

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  });

  const matchMediaMock = {
    matches: systemPrefersDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(matchMediaMock));

  const themes = (config.themes as NgThemeInput[] | undefined) ?? ['light', 'dark', 'system'];
  const fullConfig: NgConfig = {
    defaultTheme: 'system',
    storageKey: 'ngx-theme-stack',
    mode: 'class',
    themes,
    strategy: 'critters',
    resolvedThemes: normalizeThemeInputs(themes as NgThemeInput[]),
    ...config,
  } as NgConfig;

  TestBed.configureTestingModule({
    providers: [
      CoreThemeService,
      { provide: NGX_THEME_STACK_CONFIG, useValue: fullConfig },
      { provide: PLATFORM_ID, useValue: platformId },
    ],
  });

  const service = TestBed.inject(CoreThemeService);
  return { service, matchMediaMock };
}

describe('CoreThemeService — per-theme color-scheme hints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    const host = document.documentElement;
    host.className = '';
    host.removeAttribute('data-theme');
    host.style.removeProperty('color-scheme');
  });

  it('applies the user-declared scheme for a custom theme', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system', { name: 'sepia', scheme: 'light' } as NgThemeInput],
    });
    service.setTheme('sepia');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('light');
  });

  it('applies dark scheme for a custom theme', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system', { name: 'ocean', scheme: 'dark' } as NgThemeInput],
    });
    service.setTheme('ocean');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('dark');
  });

  it('removes color-scheme when custom theme scheme is auto', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system', { name: 'forest' } as NgThemeInput],
    });
    service.setTheme('dark');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('dark');

    service.setTheme('forest');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('');
  });

  it('removes color-scheme when custom theme scheme is none', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system', { name: 'paper', scheme: 'none' } as NgThemeInput],
    });
    service.setTheme('dark');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('dark');

    service.setTheme('paper');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('');
  });

  it('keeps the implicit hint for built-in light/dark', () => {
    const { service } = setup({ themes: ['light', 'dark', 'system'] });
    service.setTheme('light');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('light');

    service.setTheme('dark');
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('dark');
  });

  it('accepts object-form themes and validates setTheme on the name', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system', { name: 'moss', scheme: 'dark' } as NgThemeInput],
    });
    service.setTheme('moss');
    expect(service.selectedTheme()).toBe('moss');
    expect(() => service.setTheme('nope')).toThrow('Invalid theme');
  });

  it('exposes themeNames as a plain string array on select/cycle', () => {
    const { service } = setup({
      themes: ['light', 'dark', 'system', { name: 'sepia', scheme: 'light' } as NgThemeInput],
    });
    expect(service.themeNames).toEqual(['light', 'dark', 'system', 'sepia']);
  });
});
