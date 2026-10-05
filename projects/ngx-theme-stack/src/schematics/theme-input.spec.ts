import {
  parseThemeEntry,
  parseThemeInputArray,
  splitTopLevelEntries,
} from '../../schematics/utils/theme-input';
import { COLOR_SCHEMES, parseColorScheme } from '../../schematics/ng-add/constants';

describe('parseColorScheme', () => {
  it('accepts every declared scheme', () => {
    for (const scheme of COLOR_SCHEMES) {
      expect(parseColorScheme(scheme)).toBe(scheme);
    }
  });

  it('rejects anything outside the declared list', () => {
    expect(parseColorScheme('banana')).toBeUndefined();
    expect(parseColorScheme('Light')).toBeUndefined();
    expect(parseColorScheme('lightt')).toBeUndefined();
    expect(parseColorScheme('')).toBeUndefined();
    expect(parseColorScheme('  ')).toBeUndefined();
  });

  it('rejects none, which was removed on purpose', () => {
    expect(COLOR_SCHEMES).not.toContain('none');
    expect(parseColorScheme('none')).toBeUndefined();
  });

  it('trims before matching', () => {
    expect(parseColorScheme('  dark  ')).toBe('dark');
  });
});

describe('splitTopLevelEntries', () => {
  it('splits plain string entries', () => {
    expect(splitTopLevelEntries("'light', 'dark', 'system'")).toEqual([
      "'light'",
      "'dark'",
      "'system'",
    ]);
  });

  it('keeps object entries intact', () => {
    expect(
      splitTopLevelEntries("'system', { name: 'sepia', scheme: 'light' }, 'ocean'"),
    ).toEqual(["'system'", "{ name: 'sepia', scheme: 'light' }", "'ocean'"]);
  });

  it('does not split on commas inside quotes', () => {
    expect(splitTopLevelEntries("'a,b', 'c'")).toEqual(["'a,b'", "'c'"]);
  });

  it('does not split on commas inside nested brackets', () => {
    expect(splitTopLevelEntries("['a', 'b'], 'c'")).toEqual(["['a', 'b']", "'c'"]);
  });

  it('handles a trailing comma gracefully', () => {
    expect(splitTopLevelEntries("'a', 'b',")).toEqual(["'a'", "'b'"]);
  });

  it('returns an empty list for an empty body', () => {
    expect(splitTopLevelEntries('')).toEqual([]);
  });
});

describe('parseThemeEntry', () => {
  it('parses a plain quoted name', () => {
    expect(parseThemeEntry("'sepia'")).toEqual({ name: 'sepia' });
  });

  it('parses an object with name and scheme', () => {
    expect(parseThemeEntry("{ name: 'sepia', scheme: 'light' }")).toEqual({
      name: 'sepia',
      scheme: 'light',
    });
  });

  it('parses an object with scheme before name', () => {
    expect(parseThemeEntry("{ scheme: 'dark', name: 'ocean' }")).toEqual({
      name: 'ocean',
      scheme: 'dark',
    });
  });

  it('parses an object without a scheme', () => {
    expect(parseThemeEntry('{ name: "forest" }')).toEqual({ name: 'forest' });
  });

  it('returns null for an unrecognized entry', () => {
    expect(parseThemeEntry('{ scheme: "dark" }')).toBeNull();
    expect(parseThemeEntry('garbage')).toBeNull();
  });
});

describe('parseThemeInputArray', () => {
  it('parses the mixed string + object form used by the demo', () => {
    const body =
      "'system', 'light', 'dark', { name: 'sunset', scheme: 'dark' }, { name: 'sepia', scheme: 'light' }";

    expect(parseThemeInputArray(body)).toEqual({
      themes: ['system', 'light', 'dark', 'sunset', 'sepia'],
      schemeMap: { sunset: 'dark', sepia: 'light' },
      invalidSchemes: [],
    });
  });

  it('parses a string-only array with an empty schemeMap', () => {
    expect(parseThemeInputArray("'system', 'light', 'dark'")).toEqual({
      themes: ['system', 'light', 'dark'],
      schemeMap: {},
      invalidSchemes: [],
    });
  });

  it('multiline object entries survive a comma split', () => {
    const body = `
      'light',
      'dark',
      {
        name: 'sepia',
        scheme: 'light'
      },
    `;

    expect(parseThemeInputArray(body)).toEqual({
      themes: ['light', 'dark', 'sepia'],
      schemeMap: { sepia: 'light' },
      invalidSchemes: [],
    });
  });

  it('drops an invalid scheme and reports it instead of failing', () => {
    const body =
      "'light', { name: 'lucky', scheme: 'banana' }, { name: 'sunset', scheme: 'dark' }";

    expect(parseThemeInputArray(body)).toEqual({
      themes: ['light', 'lucky', 'sunset'],
      schemeMap: { sunset: 'dark' },
      invalidSchemes: [{ name: 'lucky', scheme: 'banana' }],
    });
  });

  it('drops a legacy none scheme and reports it', () => {
    const body = "'light', { name: 'paper', scheme: 'none' }";

    expect(parseThemeInputArray(body)).toEqual({
      themes: ['light', 'paper'],
      schemeMap: {},
      invalidSchemes: [{ name: 'paper', scheme: 'none' }],
    });
  });

  it('keeps an explicit auto untouched', () => {
    const body = "'light', { name: 'paper', scheme: 'auto' }";

    expect(parseThemeInputArray(body)).toEqual({
      themes: ['light', 'paper'],
      schemeMap: { paper: 'auto' },
      invalidSchemes: [],
    });
  });
});
