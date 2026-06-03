export interface AntiFlashScriptOptions {
  storageKey: string;
  defaultTheme: string;
  mode: string;
  themes: string[];
}

/**
 * Generates a minimal blocking inline script that applies the stored theme
 * to `<html>` before the browser paints.
 *
 * This is the single source of truth for the anti-flash script logic, shared
 * between ng-add and sync schematics.
 */
export function buildAntiFlashScript(options: AntiFlashScriptOptions): string {
  const { storageKey, defaultTheme, mode, themes } = options;

  return (
    `(function(){try{` +
    `var k=${JSON.stringify(storageKey)},` +
    `d=${JSON.stringify(defaultTheme)},` +
    `m=${JSON.stringify(mode)},` +
    `v=${JSON.stringify(themes)},` +
    `t=localStorage.getItem(k)||d,` +
    `e=document.documentElement;` +
    `if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(t)||v.indexOf(t)===-1)t=d;` +
    `if(t==='system')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
    `if(m==='class'||m==='both')e.classList.add(t);` +
    `if(m==='attribute'||m==='both')e.setAttribute('data-theme',t);` +
    `if(t==='dark'||t==='light')e.style.setProperty('color-scheme',t);` +
    `}catch(x){}})();`
  );
}
