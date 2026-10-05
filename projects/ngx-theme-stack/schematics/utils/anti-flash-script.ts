export interface AntiFlashScriptOptions {
  storageKey: string;
  defaultTheme: string;
  mode: string;
  themes: string[];
  schemeMap?: Record<string, string>;
}

/**
 * Generates a minimal blocking inline script that applies the stored theme
 * to `<html>` before the browser paints.
 *
 * This is the single source of truth for the anti-flash script logic, shared
 * between ng-add and sync schematics.
 *
 * When `schemeMap` is provided (theme → color-scheme hint), the script also
 * sets the `color-scheme` hint on the root element so that native UI widgets
 * (scrollbars, inputs) match the theme even before Angular boots.
 */
export function buildAntiFlashScript(options: AntiFlashScriptOptions): string {
  const { storageKey, defaultTheme, mode, themes, schemeMap } = options;

  const schemeLookup = schemeMap
    ? `s=${JSON.stringify(schemeMap)},`
    : '';

  return (
    `(function(){try{` +
    `var k=${JSON.stringify(storageKey)},` +
    `d=${JSON.stringify(defaultTheme)},` +
    `m=${JSON.stringify(mode)},` +
    `v=${JSON.stringify(themes)},` +
    schemeLookup +
    `t=localStorage.getItem(k)||d,` +
    `e=document.documentElement;` +
    `if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(t)||v.indexOf(t)===-1)t=d;` +
    `if(t==='system')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
    `if(m==='class'||m==='both')e.classList.add(t);` +
    `if(m==='attribute'||m==='both')e.setAttribute('data-theme',t);` +
    (schemeMap
      ? `var sc=(s&&s[t])||'';if(sc==='auto'){e.style.removeProperty('color-scheme');}else{e.style.setProperty('color-scheme',sc);}`
      : `if(t==='dark'||t==='light')e.style.setProperty('color-scheme',t);`) +
    `}catch(x){}})();`
  );
}
