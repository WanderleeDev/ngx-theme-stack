import { TestBed } from '@angular/core/testing';
import { provideThemeStack, NGX_THEME_STACK_CONFIG, DEFAULT_NG_CONFIG } from './index';
import { NgxThemeStackError } from '../errors';

describe('provideThemeStack', () => {
  it('should provide default configuration when no config is passed', () => {
    TestBed.configureTestingModule({
      providers: [provideThemeStack()],
    });

    const config = TestBed.inject(NGX_THEME_STACK_CONFIG);
    expect(config).toEqual(DEFAULT_NG_CONFIG);
  });

  it('should merge custom themes with default themes', () => {
    TestBed.configureTestingModule({
      providers: [
        provideThemeStack({
          themes: ['sepia', 'ocean'] as const,
        }),
      ],
    });

    const config = TestBed.inject(NGX_THEME_STACK_CONFIG);
    // Default themes: ['system', 'light', 'dark']
    // Merged: default themes + custom themes (avoiding duplicates)
    expect(config.themes).toEqual(['system', 'light', 'dark', 'sepia', 'ocean']);
  });

  it('should throw an error if a theme name is empty or whitespace', () => {
    expect(() =>
      provideThemeStack({
        themes: [''] as any,
      })
    ).toThrow(NgxThemeStackError);

    expect(() =>
      provideThemeStack({
        themes: ['   '] as any,
      })
    ).toThrow('Theme cannot be empty or whitespace.');
  });

  it('should throw an error if defaultTheme is not in the resolved themes list', () => {
    expect(() =>
      provideThemeStack({
        themes: ['sepia'] as const,
        defaultTheme: 'invalid-theme' as any,
      })
    ).toThrow(NgxThemeStackError);

    expect(() =>
      provideThemeStack({
        themes: ['sepia'] as const,
        defaultTheme: 'invalid-theme' as any,
      })
    ).toThrow('"defaultTheme" must be one of the resolved themes: [system, light, dark, sepia].');
  });

  it('should throw an error if storageKey is empty or whitespace', () => {
    expect(() =>
      provideThemeStack({
        storageKey: '',
      })
    ).toThrow(NgxThemeStackError);

    expect(() =>
      provideThemeStack({
        storageKey: '   ',
      })
    ).toThrow('"storageKey" cannot be empty or whitespace.');
  });

  it('should allow valid custom configurations', () => {
    const customKey = 'my-custom-key';
    TestBed.configureTestingModule({
      providers: [
        provideThemeStack({
          storageKey: customKey,
          defaultTheme: 'dark',
          mode: 'attribute',
        }),
      ],
    });

    const config = TestBed.inject(NGX_THEME_STACK_CONFIG);
    expect(config.storageKey).toBe(customKey);
    expect(config.defaultTheme).toBe('dark');
    expect(config.mode).toBe('attribute');
  });
});
