import { THEME_NAME_PATTERN } from '../ng-add/constants';

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
    // Same rule as the library and the schematics. This guard is NOT redundant:
    // the value comes from localStorage, which the user (or anything with access
    // to the browser) can write, and the declared list it is compared against is
    // a plain, hand-editable array in index.html. It runs before Angular and
    // writes to classList and to an attribute, so it validates on its own.
    `if(!/${THEME_NAME_PATTERN.source}/.test(t)||v.indexOf(t)===-1)t=d;` +
    `if(t==='system')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
    `if(m==='class'||m==='both')e.classList.add(t);` +
    `if(m==='attribute'||m==='both')e.setAttribute('data-theme',t);` +
    (schemeMap
      ? `var sc=(s&&s[t])||'';if(sc==='auto'){e.style.removeProperty('color-scheme');}else{e.style.setProperty('color-scheme',sc);}`
      : `if(t==='dark'||t==='light')e.style.setProperty('color-scheme',t);`) +
    `}catch(x){}})();`
  );
}
