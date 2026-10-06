import {
  DEFAULT_THEMES as LIB_DEFAULT_THEMES,
  NG_COLOR_SCHEMES,
  THEME_NAME_SOURCE,
} from '../lib/types';
import { DEFAULT_NG_CONFIG } from '../lib/config';
import {
  COLOR_SCHEMES,
  DEFAULT_THEMES,
  DEFAULTS,
  THEME_NAME_PATTERN,
  describeInvalidThemeName,
} from '../../schematics/ng-add/constants';

/**
 * The schematics compile to CommonJS with `rootDir: "schematics"` and cannot
 * import the ESM library, so scripts/generate-schematic-constants.mjs copies the
 * shared values into schematics/ng-add/generated-config.ts.
 *
 * This spec is the mechanism that keeps the copies honest. It fails when the
 * generated file is stale — the library changed and the generator was not re-run
 * — or when someone edits the generated file by hand.
 *
 * Regenerate with: pnpm --filter ngx-theme-stack run generate:constants
 */
describe('generated schematic constants stay in sync with the library', () => {
  it('copies DEFAULT_THEMES', () => {
    expect(DEFAULT_THEMES).toEqual(LIB_DEFAULT_THEMES);
  });

  it('copies the color schemes', () => {
    expect(COLOR_SCHEMES).toEqual(NG_COLOR_SCHEMES);
  });

  it('copies the theme name pattern source', () => {
    expect(THEME_NAME_PATTERN.source).toBe(THEME_NAME_SOURCE);
  });

  it('copies the default configuration', () => {
    expect(DEFAULTS.defaultTheme).toBe(DEFAULT_NG_CONFIG.defaultTheme);
    expect(DEFAULTS.storageKey).toBe(DEFAULT_NG_CONFIG.storageKey);
    expect(DEFAULTS.mode).toBe(DEFAULT_NG_CONFIG.mode);
    expect(DEFAULTS.strategy).toBe(DEFAULT_NG_CONFIG.strategy);
    expect(DEFAULTS.themes).toEqual(DEFAULT_NG_CONFIG.themes);
  });

  // Equal `.source` already implies equal behaviour, but asserting the verdicts
  // documents what the pattern is FOR, and catches a future change that keeps the
  // two copies in step while making them both wrong.
  it('agrees with the library on the names it accepts', () => {
    const libPattern = new RegExp(THEME_NAME_SOURCE);
    const cases = [
      'lucky',
      'lucky-theme',
      'lucky_theme',
      'lucky2',
      'Lucky',
      '_lucky',
      '-lucky',
      '',
      '2lucky',
      'lucky theme',
      'lucky.theme',
      'lucky#theme',
      'lucky>theme',
      'sueño',
      'año',
    ];
    for (const name of cases) {
      expect(THEME_NAME_PATTERN.test(name)).toBe(libPattern.test(name));
    }
  });
});

describe('describeInvalidThemeName', () => {
  it('explains an empty name', () => {
    expect(describeInvalidThemeName('  ')).toMatch(/empty/);
  });

  it('explains a leading digit', () => {
    expect(describeInvalidThemeName('2lucky')).toMatch(/starts with a digit/);
  });

  it('explains whitespace', () => {
    expect(describeInvalidThemeName('lucky theme')).toMatch(/whitespace/);
    expect(describeInvalidThemeName('lucky\ttheme')).toMatch(/whitespace/);
  });

  it('explains a CSS metacharacter', () => {
    expect(describeInvalidThemeName('lucky.theme')).toMatch(/metacharacter/);
    expect(describeInvalidThemeName('lucky#theme')).toMatch(/metacharacter/);
    expect(describeInvalidThemeName('lucky:hover')).toMatch(/metacharacter/);
  });

  it('falls back to the allowed-set explanation', () => {
    expect(describeInvalidThemeName('sueño')).toMatch(/outside the allowed set/);
    // Non-breaking space is not ASCII whitespace, so it does not throw in
    // classList; the accurate reason is that it is outside the allowed set.
    expect(describeInvalidThemeName('lucky\u00a0theme')).toMatch(/outside the allowed set/);
  });
});
