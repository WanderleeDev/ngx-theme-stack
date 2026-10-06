import {
  implicitScheme,
  isNgColorScheme,
  isValidThemeName,
  NG_COLOR_SCHEMES,
  normalizeThemeInputs,
  THEME_NAME_PATTERN,
  THEME_NAME_SOURCE,
} from './types';

describe('normalizeThemeInputs', () => {
  it('normalizes string entries with implicit scheme', () => {
    const result = normalizeThemeInputs(['light', 'dark', 'sepia']);
    expect(result).toEqual([
      { name: 'light', scheme: 'light' },
      { name: 'dark', scheme: 'dark' },
      { name: 'sepia', scheme: 'auto' },
    ]);
  });

  it('deduplicates entries by name (first wins)', () => {
    const result = normalizeThemeInputs([
      'light',
      { name: 'light', scheme: 'dark' },
      'light',
    ]);
    expect(result).toEqual([{ name: 'light', scheme: 'light' }]);
  });

  it('handles object entries with explicit scheme', () => {
    const result = normalizeThemeInputs([
      { name: 'sepia', scheme: 'light' },
      { name: 'ocean', scheme: 'dark' },
    ]);
    expect(result).toEqual([
      { name: 'sepia', scheme: 'light' },
      { name: 'ocean', scheme: 'dark' },
    ]);
  });

  it('defaults object entries to auto when scheme is omitted', () => {
    const result = normalizeThemeInputs([{ name: 'forest' }]);
    expect(result).toEqual([{ name: 'forest', scheme: 'auto' }]);
  });

  it('replaces an unknown scheme with auto instead of passing it through', () => {
    // A hand-written config can reach the runtime without the compiler having
    // checked it; the value must not travel to setProperty('color-scheme', ...).
    const result = normalizeThemeInputs([
      { name: 'ghost', scheme: 'banana' } as never,
      { name: 'paper', scheme: 'none' } as never,
    ]);
    expect(result).toEqual([
      { name: 'ghost', scheme: 'auto' },
      { name: 'paper', scheme: 'auto' },
    ]);
  });

  it('keeps every accepted scheme', () => {
    for (const scheme of NG_COLOR_SCHEMES) {
      expect(normalizeThemeInputs([{ name: 'x', scheme }])).toEqual([{ name: 'x', scheme }]);
    }
  });

  it('ignores empty-string entries', () => {
    const result = normalizeThemeInputs(['', '   ', 'dark']);
    expect(result).toEqual([{ name: 'dark', scheme: 'dark' }]);
  });

  it('ignores object entries with empty names', () => {
    const result = normalizeThemeInputs([{ name: '  ' }, 'dark']);
    expect(result).toEqual([{ name: 'dark', scheme: 'dark' }]);
  });

  it('mixes string and object entries', () => {
    const result = normalizeThemeInputs([
      'system',
      'light',
      'dark',
      { name: 'sepia', scheme: 'light' },
    ]);
    expect(result).toEqual([
      { name: 'system', scheme: 'auto' },
      { name: 'light', scheme: 'light' },
      { name: 'dark', scheme: 'dark' },
      { name: 'sepia', scheme: 'light' },
    ]);
  });

  it('trims whitespace in names', () => {
    const result = normalizeThemeInputs(['  ocean  ', '  reef']);
    expect(result).toEqual([
      { name: 'ocean', scheme: 'auto' },
      { name: 'reef', scheme: 'auto' },
    ]);
  });
});

describe('isValidThemeName', () => {
  it('accepts names usable as a CSS class', () => {
    for (const name of ['lucky', 'Lucky', 'lucky-theme', 'lucky_theme', 'lucky2', '_lucky', '-lucky']) {
      expect(isValidThemeName(name)).toBe(true);
    }
  });

  it('rejects a leading digit, which is not a valid CSS class selector', () => {
    expect(isValidThemeName('2lucky')).toBe(false);
  });

  it('rejects whitespace, which throws in classList.add', () => {
    expect(isValidThemeName('lucky theme')).toBe(false);
    expect(isValidThemeName('lucky\ttheme')).toBe(false);
  });

  it('rejects CSS metacharacters, which change what the selector matches', () => {
    // .lucky.theme looks for two classes, but the class token is the single
    // string 'lucky.theme', so the styles would never match — with no error.
    for (const name of ['lucky.theme', 'lucky#id', 'lucky>child', 'lucky[attr]', 'lucky:hover']) {
      expect(isValidThemeName(name)).toBe(false);
    }
  });

  it('rejects non-ASCII on purpose, as a documented narrower subset', () => {
    expect(isValidThemeName('sueño')).toBe(false);
    expect(isValidThemeName('año')).toBe(false);
  });

  it('rejects the empty string', () => {
    expect(isValidThemeName('')).toBe(false);
  });

  it('exposes the same source the schematics copy', () => {
    expect(THEME_NAME_PATTERN.source).toBe(THEME_NAME_SOURCE);
  });
});

describe('isNgColorScheme', () => {
  it('accepts every declared scheme', () => {
    for (const scheme of NG_COLOR_SCHEMES) {
      expect(isNgColorScheme(scheme)).toBe(true);
    }
  });

  it('rejects anything else, including non-strings', () => {
    for (const value of ['banana', 'Light', 'none', '', undefined, null, 0, {}]) {
      expect(isNgColorScheme(value)).toBe(false);
    }
  });
});

describe('implicitScheme', () => {
  it('maps light/dark to their matching scheme', () => {
    expect(implicitScheme('light')).toBe('light');
    expect(implicitScheme('dark')).toBe('dark');
  });

  it('returns auto for all other names', () => {
    expect(implicitScheme('system')).toBe('auto');
    expect(implicitScheme('sepia')).toBe('auto');
    expect(implicitScheme('ocean')).toBe('auto');
  });
});
