import {
  implicitScheme,
  isValidThemeName,
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
