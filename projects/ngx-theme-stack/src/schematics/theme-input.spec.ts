import {
  parseThemeEntry,
  parseThemeInputArray,
  splitTopLevelEntries,
} from '../../schematics/utils/theme-input';

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
    });
  });

  it('parses a string-only array with an empty schemeMap', () => {
    expect(parseThemeInputArray("'system', 'light', 'dark'")).toEqual({
      themes: ['system', 'light', 'dark'],
      schemeMap: {},
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
    });
  });
});
