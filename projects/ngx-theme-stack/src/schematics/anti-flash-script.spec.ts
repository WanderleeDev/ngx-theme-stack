import { buildAntiFlashScript } from '../../schematics/utils/anti-flash-script';

describe('buildAntiFlashScript', () => {
  it('sets color-scheme for dark/light without schemeMap (legacy behavior)', () => {
    const script = buildAntiFlashScript({
      storageKey: 'key',
      defaultTheme: 'system',
      mode: 'class',
      themes: ['system', 'light', 'dark'],
    });
    expect(script).toContain(
      "if(t==='dark'||t==='light')e.style.setProperty('color-scheme',t);",
    );
  });

  it('uses schemeMap when provided', () => {
    const script = buildAntiFlashScript({
      storageKey: 'key',
      defaultTheme: 'sunset',
      mode: 'class',
      themes: ['system', 'light', 'dark', 'sunset', 'sepia'],
      schemeMap: { sunset: 'dark', sepia: 'light' },
    });
    expect(script).toContain('s={"sunset":"dark","sepia":"light"}');
    expect(script).toContain('sc=(s&&s[t])');
    expect(script).toContain("e.style.removeProperty('color-scheme')");
  });

  it('includes custom themes in the valid list', () => {
    const script = buildAntiFlashScript({
      storageKey: 'key',
      defaultTheme: 'sepia',
      mode: 'class',
      themes: ['system', 'light', 'dark', 'sepia'],
      schemeMap: { sepia: 'light' },
    });
    expect(script).toContain('v=["system","light","dark","sepia"]');
  });

  it('removes color-scheme when the scheme is auto', () => {
    const script = buildAntiFlashScript({
      storageKey: 'key',
      defaultTheme: 'system',
      mode: 'class',
      themes: ['system', 'light', 'dark'],
      schemeMap: { sepia: 'auto' },
    });
    expect(script).toContain(
      "if(sc==='auto'){e.style.removeProperty('color-scheme');}",
    );
  });

  it('never emits a none branch, because none is no longer a valid scheme', () => {
    const script = buildAntiFlashScript({
      storageKey: 'key',
      defaultTheme: 'system',
      mode: 'class',
      themes: ['system', 'light', 'dark'],
      schemeMap: { sepia: 'auto' },
    });
    expect(script).not.toContain("'none'");
  });
});
