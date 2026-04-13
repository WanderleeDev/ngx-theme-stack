import { SchematicContext, Tree } from '@angular-devkit/schematics';

/**
 * Generates a minimal blocking inline script that applies the stored theme
 * to `<html>` before the browser paints.
 *
 * This is the single source of truth for the anti-flash script logic.
 * Schematics compile to CommonJS (Node.js) and cannot import from the
 * library's ESM build, so this logic lives here — close to its only consumer.
 *
 * The generated script:
 * 1. Reads `localStorage` for the stored theme key.
 * 2. Validates the value using a Regex to prevent injections.
 * 3. Falls back to `defaultTheme`; resolves `'system'` via `matchMedia`.
 * 4. Applies the theme according to the configured `mode` (class, attribute, or both).
 * 5. Sets the `color-scheme` CSS property for native browser adaptation.
 */
function buildAntiFlashScript(options: {
  storageKey: string;
  defaultTheme: string;
  mode: string;
}): string {
  const { storageKey, defaultTheme, mode } = options;

  return (
    `(function(){try{` +
    `var k=${JSON.stringify(storageKey)},` +
    `d=${JSON.stringify(defaultTheme)},` +
    `m=${JSON.stringify(mode)},` +
    `t=localStorage.getItem(k)||d,` +
    `e=document.documentElement;` +
    `if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(t))t=d;` +
    `if(t==='system')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
    `if(m==='class'||m==='both')e.classList.add(t);` +
    `if(m==='attribute'||m==='both')e.setAttribute('data-theme',t);` +
    `if(t==='dark'||t==='light')e.style.setProperty('color-scheme',t);` +
    `}catch(x){}})();`
  );
}

/**
 * Finds `index.html` and injects the anti-flash blocking script as the very
 * first child of `<head>`. This is intentional: the script must run before
 * any stylesheets or Angular bundles to eliminate the flash of incorrect theme.
 *
 * Skips the patch gracefully if:
 * - `index.html` does not exist at the expected path.
 * - The script tag is already present (idempotent).
 *
 * Detection strategy (in order):
 * 1. `${sourceRoot}/index.html` — standard project layout.
 * 2. `public/index.html` — project-level public folder (e.g. Vite-based).
 *
 * @param tree The virtual file tree of the Angular project.
 * @param context The schematic's execution context for logging.
 * @param sourceRoot The source root for the project.
 * @param options The configuration options collected from the prompt.
 */
export function patchIndexHtml(
  tree: Tree,
  context: SchematicContext,
  sourceRoot: string,
  options: {
    storageKey: string;
    defaultTheme: string;
    mode: string;
    themes: string[];
    strategy: 'critters' | 'blocking';
  },
): void {
  const candidates = [`${sourceRoot}/index.html`, 'public/index.html'].map((p) =>
    p.startsWith('/') ? p.slice(1) : p,
  );

  for (const path of candidates) {
    if (!tree.exists(path)) continue;

    const content = tree.readText(path);

    // ── CSP Detection ────────────────────────────────────────────────────────
    const hasCspMeta =
      content.includes('Content-Security-Policy') || content.includes('content-security-policy');

    if (hasCspMeta) {
      context.logger.warn(
        `⚠ A Content-Security-Policy meta tag was detected in ${path}.\n` +
          `  Inline scripts may be blocked by your CSP.\n` +
          `  Options:\n` +
          `    1. Add a nonce to the injected <script> tag and allow it in your CSP.\n` +
          `    2. Add the script hash to your CSP: script-src 'sha256-<HASH>'.\n` +
          `    3. Allow 'unsafe-inline' (not recommended for production).\n` +
          `  See: https://angular.dev/guide/security#content-security-policy`,
      );
    }

    const scriptTag = `\n  <!-- ngx-theme-stack anti-flash -->\n  <script>${buildAntiFlashScript({
      storageKey: options.storageKey,
      defaultTheme: options.defaultTheme,
      mode: options.mode,
    })}</script>`;

    let updated = content;

    // ── 1. Update Anti-Flash Script ──────────────────────────────────────────
    const SCRIPT_BLOCK_RE = /<!-- ngx-theme-stack anti-flash -->\s*<script>[\s\S]*?<\/script>/;
    if (SCRIPT_BLOCK_RE.test(updated)) {
      updated = updated.replace(SCRIPT_BLOCK_RE, scriptTag);
      context.logger.info(`✔ Updated anti-flash script in ${path}`);
    } else {
      updated = updated.replace('<head>', `<head>${scriptTag}`);
      context.logger.info(`✔ Injected anti-flash script into ${path}`);
    }

    // ── 2. Update Critters Trick ─────────────────────────────────────────────
    const CRITTERS_BLOCK_RE =
      /<!-- ngx-theme-stack critters-trick -->[\s\S]*?<!-- \/ngx-theme-stack critters-trick -->/;
    const CRITTERS_ID_RE = /<div id="ngx-theme-stack-critters-trick"[\s\S]*?<\/div>/;

    if (options.strategy === 'critters') {
      const renderableThemes = options.themes.filter((t) => t !== 'system');
      const innerDivs = renderableThemes
        .map((theme) => {
          if (options.mode === 'class') return `      <div class="${theme}"></div>`;
          if (options.mode === 'attribute') return `      <div data-theme="${theme}"></div>`;
          return `      <div class="${theme}" data-theme="${theme}"></div>`;
        })
        .join('\n');

      const crittersBlock =
        `<!-- ngx-theme-stack critters-trick -->\n` +
        `    <div id="ngx-theme-stack-critters-trick" hidden aria-hidden="true" style="display: none; overflow: hidden; clip-path: inset(50%); position: absolute;">\n${innerDivs}\n    </div>\n` +
        `    <!-- /ngx-theme-stack critters-trick -->`;

      if (CRITTERS_BLOCK_RE.test(updated)) {
        updated = updated.replace(CRITTERS_BLOCK_RE, crittersBlock);
        context.logger.info(`✔ Updated Critters-trick block in ${path}`);
      } else if (CRITTERS_ID_RE.test(updated)) {
        updated = updated.replace(CRITTERS_ID_RE, crittersBlock);
        context.logger.info(`✔ Wrapped existing Critters-trick div with markers in ${path}`);
      } else {
        updated = updated.replace('</body>', `  ${crittersBlock}\n  </body>`);
        context.logger.info(`✔ Injected Critters-trick block before </body> in ${path}`);
      }
    } else {
      // If switching to blocking strategy, remove existing trick
      if (CRITTERS_BLOCK_RE.test(updated)) {
        updated = updated.replace(CRITTERS_BLOCK_RE, '');
      } else if (CRITTERS_ID_RE.test(updated)) {
        updated = updated.replace(CRITTERS_ID_RE, '');
      }
      context.logger.info(`✔ Removed Critters-trick from ${path}`);
    }

    tree.overwrite(path, updated);
    if (hasCspMeta) {
      context.logger.warn(`  → Remember to allow the inline script in your CSP before deploying.`);
    }
    return;
  }

  context.logger.warn(
    `⚠ Could not find index.html (tried: ${candidates.join(', ')}).\n` +
      `  Add the anti-flash script manually to the <head> of your index.html.\n` +
      `  See: https://github.com/your-org/ngx-theme-stack#anti-flash`,
  );
}
