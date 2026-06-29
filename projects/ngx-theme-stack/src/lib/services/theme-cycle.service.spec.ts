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
    const { service } = setup({
      defaultTheme: 'system',
      themes: ['light', 'dark'],
    });
    // selectedTheme is 'system' (which is not in ['light', 'dark'])
    expect(service.selectedTheme()).toBe('system');
    expect(service.cycleIndex()).toBe(-1);

    service.cycle();
    expect(service.selectedTheme()).toBe('light');
  });

  it('should compute preceding and upcoming correctly when cycleIndex is -1', () => {
    const { service } = setup({
      defaultTheme: 'system',
      themes: ['light', 'dark'], // len = 2
    });
    expect(service.cycleIndex()).toBe(-1);
    // index = -1
    // preceding: (-1 - 1 + 2) % 2 = 0 -> themes[0] = 'light'
    // upcoming: (-1 + 1) % 2 = 0 -> themes[0] = 'light'
    expect(service.preceding()).toBe('light');
    expect(service.upcoming()).toBe('light');
  });

  it('should compute cycleIndex, preceding and upcoming correctly', () => {
    const { service, core } = setup({
      themes: ['light', 'dark', 'system'],
    });

    core.setTheme('light');
    expect(service.cycleIndex()).toBe(0);
    expect(service.preceding()).toBe('system');
    expect(service.upcoming()).toBe('dark');

    core.setTheme('dark');
    expect(service.cycleIndex()).toBe(1);
    expect(service.preceding()).toBe('light');
    expect(service.upcoming()).toBe('system');

    core.setTheme('system');
    expect(service.cycleIndex()).toBe(2);
    expect(service.preceding()).toBe('dark');
    expect(service.upcoming()).toBe('light');
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
