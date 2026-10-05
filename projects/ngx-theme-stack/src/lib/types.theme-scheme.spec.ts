import {
  implicitScheme,
  normalizeThemeInputs,
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
