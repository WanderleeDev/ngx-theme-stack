import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { buildAntiFlashScript } from '../utils/anti-flash-script';

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


    const scriptTag = `\n  <!-- ngx-theme-stack anti-flash -->\n  <script>${buildAntiFlashScript({
      storageKey: options.storageKey,
      defaultTheme: options.defaultTheme,
      mode: options.mode,
      themes: options.themes,
    })}</script>`;

    let updated = content;

    // ── 1. Update Anti-Flash Script ──────────────────────────────────────────
    const SCRIPT_BLOCK_RE = /<!--\s*ngx-theme-stack\s*anti-flash\s*-->\s*<script[^>]*>[\s\S]*?<\/script>/;
    if (SCRIPT_BLOCK_RE.test(updated)) {
      updated = updated.replace(SCRIPT_BLOCK_RE, scriptTag);
    } else {
      updated = updated.replace('<head>', `<head>${scriptTag}`);
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
      } else if (CRITTERS_ID_RE.test(updated)) {
        updated = updated.replace(CRITTERS_ID_RE, crittersBlock);
      } else {
        updated = updated.replace('</body>', `  ${crittersBlock}\n  </body>`);
      }
    } else {
      // If switching to blocking strategy, remove existing trick
      if (CRITTERS_BLOCK_RE.test(updated)) {
        updated = updated.replace(CRITTERS_BLOCK_RE, '');
      } else if (CRITTERS_ID_RE.test(updated)) {
        updated = updated.replace(CRITTERS_ID_RE, '');
      }
    }

    tree.overwrite(path, updated);

    return;
  }

  context.logger.warn(
    `⚠ Could not find index.html (tried: ${candidates.join(', ')}).\n` +
      `  Add the anti-flash script manually to the <head> of your index.html.`,
  );
}
