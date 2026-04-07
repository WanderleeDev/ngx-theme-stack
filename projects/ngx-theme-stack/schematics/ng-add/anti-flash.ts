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
 * 2. Validates the value against the allowed themes list.
 * 3. Falls back to `defaultTheme`; resolves `'system'` via `matchMedia`.
 * 4. Applies the theme via class, data-attribute, or both on `<html>`.
 * 5. Sets the `color-scheme` CSS property for native browser adaptation.
 */
function buildAntiFlashScript(options: {
  storageKey: string;
  defaultTheme: string;
  mode: string;
  themes: string[];
}): string {
  const { storageKey, defaultTheme, mode, themes } = options;

  return (
    `(function(){try{` +
    `var k=${JSON.stringify(storageKey)},` +
    `d=${JSON.stringify(defaultTheme)},` +
    `m=${JSON.stringify(mode)},` +
    `v=${JSON.stringify(themes)};` +
    `var t=localStorage.getItem(k);` +
    `if(!t||v.indexOf(t)===-1)t=d;` +
    `if(t==='system')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
    `var e=document.documentElement;` +
    `if(m==='class'||m==='both'){v.forEach(function(x){e.classList.remove(x)});e.classList.add(t)}` +
    `if(m==='attribute'||m==='both')e.setAttribute('data-theme',t);` +
    `if(t==='dark'||t==='light')e.style.setProperty('color-scheme',t);` +
    `}catch(e){}})();`
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
  options: { storageKey: string; defaultTheme: string; mode: string; themes: string[] },
): void {
  const candidates = [`${sourceRoot}/index.html`, 'public/index.html'].map(p => p.startsWith('/') ? p.slice(1) : p);

  for (const path of candidates) {
    if (!tree.exists(path)) continue;

    const content = tree.readText(path);

    // Guard: idempotent — skip if script is already present
    if (content.includes('ngx-theme-stack-theme') || content.includes('ngx-theme-stack anti-flash')) {
      context.logger.info(`✔ Anti-flash script already present in ${path} — skipping.`);
      return;
    }

    const script = buildAntiFlashScript(options);

    // ── CSP Detection ────────────────────────────────────────────────────────
    // If the project uses a Content-Security-Policy meta tag, inline scripts
    // are blocked by default unless 'unsafe-inline' or a nonce is allowed.
    // We warn here; the user must add a nonce manually or adjust their CSP.
    const hasCspMeta =
      content.includes('Content-Security-Policy') ||
      content.includes('content-security-policy');

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

    // Inject immediately after <head> so it blocks rendering before any CSS.
    // If your project uses CSP nonces, add nonce="<%= CSP_NONCE %>" to the tag.
    const scriptTag = `\n  <!-- ngx-theme-stack anti-flash -->\n  <script>${script}</script>`;
    const updated = content.replace('<head>', `<head>${scriptTag}`);

    tree.overwrite(path, updated);
    context.logger.info(`✔ Anti-flash script injected into ${path}`);
    if (hasCspMeta) {
      context.logger.warn(
        `  → Remember to allow the inline script in your CSP before deploying.`,
      );
    }
    return;
  }

  context.logger.warn(
    `⚠ Could not find index.html (tried: ${candidates.join(', ')}).\n` +
      `  Add the anti-flash script manually to the <head> of your index.html.\n` +
      `  See: https://github.com/your-org/ngx-theme-stack#anti-flash`,
  );
}
