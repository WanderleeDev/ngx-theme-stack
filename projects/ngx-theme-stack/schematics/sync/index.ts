import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { DEFAULTS } from '../ng-add/constants';
import { Schema } from './schema';

// ── Regex patterns ────────────────────────────────────────────────────────────

/**
 * Matches the provideThemeStack() call in app.config.ts.
 * Captures the full options object string (may be empty or span multiple lines).
 *
 * Examples matched:
 *   provideThemeStack()
 *   provideThemeStack({ mode: 'attribute', themes: ['dark', 'light'] })
 *   provideThemeStack({          ← multi-line call (new explicit format)
 *     themes: ['light', 'dark'],
 *     defaultTheme: 'system',
 *   })
 */
const PROVIDE_CALL_RE = /provideThemeStack\s*\(([\s\S]*?)\)/;

/** Extracts "mode" value from the captured options string. */
const OPTION_MODE_RE = /mode\s*:\s*['"]([^'"]+)['"]/;

/** Extracts "storageKey" value from the captured options string. */
const OPTION_KEY_RE = /storageKey\s*:\s*['"]([^'"]+)['"]/;

/** Extracts "defaultTheme" value from the captured options string. */
const OPTION_DEFAULT_THEME_RE = /defaultTheme\s*:\s*['"]([^'"]+)['"]/;
const OPTION_STRATEGY_RE = /strategy\s*:\s*['"]([^'"]+)['"]/;


/**
 * Extracts the themes array from the options string.
 * Matches: themes: ['light', 'dark', 'sunset']
 */
const OPTION_THEMES_RE = /themes\s*:\s*\[([^\]]*)\]/;

/** Matches the complete <script> anti-flash block (identified by its marker comment). */
const SCRIPT_BLOCK_RE =
  /<!-- ngx-theme-stack anti-flash -->\s*<script>[\s\S]*?<\/script>/;

/** Marker injected by ng-add that delimits the Critters Trick zone in <body>. */
const CRITTERS_MARKER = '<!-- ngx-theme-stack critters-trick -->';

/** Regex that matches the entire Critters Trick block (marker + divs). */
const CRITTERS_BLOCK_RE =
  /<!-- ngx-theme-stack critters-trick -->[\s\S]*?<!-- \/ngx-theme-stack critters-trick -->/;

// ── Types ────────────────────────────────────────────────────────────────────

interface ExtractedConfig {
  storageKey: string;
  defaultTheme: string;
  mode: string;
  strategy?: string;
  themes: string[];
}

// ── Config extraction ─────────────────────────────────────────────────────────

/**
 * Reads `app.config.ts` (or `main.ts`) and extracts the current
 * `provideThemeStack()` configuration using regex.
 *
 * Falls back to library defaults for any option that is not found.
 */
function extractConfig(
  tree: Tree,
  sourceRoot: string,
  context: SchematicContext,
): ExtractedConfig {
  const candidates = [
    `${sourceRoot}/app/app.config.ts`,
    `${sourceRoot}/main.ts`,
  ].map((p) => (p.startsWith('/') ? p.slice(1) : p));

  for (const filePath of candidates) {
    if (!tree.exists(filePath)) continue;

    const content = tree.readText(filePath);
    const provideMatch = PROVIDE_CALL_RE.exec(content);

    if (!provideMatch) {
      context.logger.warn(
        `⚠ provideThemeStack() not found in ${filePath}. Using library defaults.\n` +
          `  Tip: Add provideThemeStack({...}) to your providers for explicit control.`,
      );
      break;
    }

    const opts = provideMatch[1]; // everything inside provideThemeStack(...)

    const mode = OPTION_MODE_RE.exec(opts)?.[1] ?? DEFAULTS.mode;
    const storageKey = OPTION_KEY_RE.exec(opts)?.[1] ?? DEFAULTS.storageKey;
    const defaultTheme = OPTION_DEFAULT_THEME_RE.exec(opts)?.[1] ?? DEFAULTS.defaultTheme;
    const strategy = OPTION_STRATEGY_RE.exec(opts)?.[1] ?? undefined;

    // Extract themes array: ['light', 'dark', 'sunset'] → ['light', 'dark', 'sunset']
    const themesRaw = OPTION_THEMES_RE.exec(opts)?.[1] ?? '';
    const themes: string[] = themesRaw
      ? themesRaw
          .split(',')
          .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      : [...DEFAULTS.themes];

    context.logger.info(`   Detected mode         : ${mode}`);
    context.logger.info(`   Detected strategy     : ${strategy ?? '(not in code, using auto-detect)'}`);
    context.logger.info(`   Detected storageKey   : ${storageKey}`);
    context.logger.info(`   Detected defaultTheme : ${defaultTheme}`);
    context.logger.info(`   Detected themes       : [${themes.join(', ')}]`);

    return { mode, strategy, storageKey, defaultTheme, themes };
  }

  // Fallback to defaults if no config file found
  return {
    mode: DEFAULTS.mode,
    storageKey: DEFAULTS.storageKey,
    defaultTheme: DEFAULTS.defaultTheme,
    themes: [...DEFAULTS.themes],
  };
}

// ── Anti-flash script generation ──────────────────────────────────────────────

/**
 * Builds the minimal blocking inline script — identical logic to anti-flash.ts
 * but kept here to avoid cross-directory dependencies in the schematic build.
 */
function buildScript(config: ExtractedConfig): string {
  const { storageKey, defaultTheme, mode } = config;

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

// ── Critters Trick div generation ─────────────────────────────────────────────

/**
 * Generates the hidden divs for the Critters Trick based on the mode.
 *
 * When Angular builds for production, Critters inlines "critical" CSS.
 * It determines "critical" by checking which selectors match elements in the HTML.
 * By placing hidden divs with the theme class/attribute, we trick Critters into
 * inlining ALL theme token blocks — achieving zero-network-request CSS for themes.
 *
 * @param themes - The list of themes to generate divs for (excludes 'system').
 * @param mode   - 'class' | 'attribute' | 'both'
 */
function buildCrittersDivs(themes: string[], mode: string): string {
  // 'system' is a meta-theme that resolves to 'light' or 'dark'; no CSS selector needed.
  const renderableThemes = themes.filter((t) => t !== 'system');

  const divs = renderableThemes
    .map((theme) => {
      if (mode === 'class') {
        return `      <div class="${theme}"></div>`;
      } else if (mode === 'attribute') {
        return `      <div data-theme="${theme}"></div>`;
      } else {
        // 'both'
        return `      <div class="${theme}" data-theme="${theme}"></div>`;
      }
    })
    .join('\n');

  return (
    `<!-- ngx-theme-stack critters-trick -->\n` +
    `    <div id="ngx-theme-stack-critters-trick" hidden>\n${divs}\n    </div>\n` +
    `    <!-- /ngx-theme-stack critters-trick -->`
  );
}

// ── index.html patching ───────────────────────────────────────────────────────

function syncIndexHtml(
  tree: Tree,
  context: SchematicContext,
  sourceRoot: string,
  config: ExtractedConfig,
  strategy: 'critters' | 'blocking',
): void {
  const candidates = [`${sourceRoot}/index.html`, 'public/index.html'].map((p) =>
    p.startsWith('/') ? p.slice(1) : p,
  );

  for (const path of candidates) {
    if (!tree.exists(path)) continue;

    let content = tree.readText(path);

    if (!content.includes('ngx-theme-stack anti-flash')) {
      context.logger.warn(
        `⚠ Anti-flash script marker not found in ${path}.\n` +
          `  Run 'ng add ngx-theme-stack' first, or add the script manually.`,
      );
      return;
    }

    // ── 1. Sync the anti-flash JS script ───────────────────────────────────
    const newScriptBlock =
      `<!-- ngx-theme-stack anti-flash -->\n  <script>${buildScript(config)}</script>`;

    const updatedScript = content.replace(SCRIPT_BLOCK_RE, newScriptBlock);

    if (updatedScript === content) {
      context.logger.warn(
        `⚠ Could not replace script block in ${path}. The format may have changed.`,
      );
      return;
    }
    content = updatedScript;
    context.logger.info(`✔ Anti-flash script synced in ${path}`);

    // ── 2. Sync the Critters Trick divs (only for 'critters' strategy) ─────
    if (strategy === 'critters') {
      const crittersBlock = buildCrittersDivs(config.themes, config.mode);
      const CRITTERS_ID_RE = /<div id="ngx-theme-stack-critters-trick"[\s\S]*?<\/div>/;

      if (CRITTERS_BLOCK_RE.test(content)) {
        content = content.replace(CRITTERS_BLOCK_RE, crittersBlock);
        context.logger.info(`✔ Critters Trick block updated in ${path}`);
      } else if (CRITTERS_ID_RE.test(content)) {
        content = content.replace(CRITTERS_ID_RE, crittersBlock);
        context.logger.info(`✔ Critters Trick div wrapped in ${path}`);
      } else if (content.includes(CRITTERS_MARKER)) {
        content = content.replace(CRITTERS_MARKER, crittersBlock);
        context.logger.info(`✔ Critters Trick divs injected in ${path}`);
      } else {
        content = content.replace('</body>', `  ${crittersBlock}\n  </body>`);
        context.logger.info(`✔ Critters Trick block added before </body> in ${path}`);
      }
    } else {
      // blocking strategy: remove any existing Critters divs if present
      if (CRITTERS_BLOCK_RE.test(content)) {
        content = content.replace(CRITTERS_BLOCK_RE, '');
        context.logger.info(`✔ Critters Trick divs removed (blocking strategy) in ${path}`);
      }
    }

    tree.overwrite(path, content);
    return;
  }

  context.logger.warn(
    `⚠ Could not find index.html (tried: ${candidates.join(', ')}).`,
  );
}

// ── angular.json patching ───────────────────────────────────────────────────

function syncAngularJson(
  tree: Tree,
  context: SchematicContext,
  projectName: string,
  strategy: 'critters' | 'blocking',
): void {
  const content = tree.read('/angular.json');
  if (!content) return;

  const workspace = JSON.parse(content.toString());
  const project = workspace.projects[projectName];
  if (!project) return;

  const buildTarget = project.architect?.build;
  if (!buildTarget) return;

  const prodConfig = buildTarget.configurations?.production;
  if (!prodConfig) return;

  if (strategy === 'blocking') {
    // Disable inlineCritical for blocking strategy
    if (typeof prodConfig.optimization === 'object') {
      prodConfig.optimization.styles = prodConfig.optimization.styles || {};
      if (prodConfig.optimization.styles.inlineCritical !== false) {
        prodConfig.optimization.styles.inlineCritical = false;
        context.logger.info(`✔ Disabled inlineCritical in angular.json projects/${projectName} (production).`);
      }
    } else {
      // It's either boolean or undefined
      prodConfig.optimization = {
        styles: { inlineCritical: false },
      };
      context.logger.info(`✔ Disabled inlineCritical in angular.json projects/${projectName} (production).`);
    }
  } else {
    // Enable inlineCritical (or revert to default) for critters strategy
    if (typeof prodConfig.optimization === 'object' && prodConfig.optimization.styles) {
      if (prodConfig.optimization.styles.inlineCritical === false) {
        prodConfig.optimization.styles.inlineCritical = true;
        context.logger.info(`✔ Re-enabled inlineCritical in angular.json projects/${projectName} (production).`);
      }
    }
  }

  tree.overwrite('/angular.json', JSON.stringify(workspace, null, 2));
}

// ── Schematic factory ─────────────────────────────────────────────────────────

/**
 * `ng generate ngx-theme-stack:sync`
 *
 * Reads the current `provideThemeStack()` configuration from `app.config.ts`
 * and regenerates:
 *
 * 1. **The anti-flash inline script** in `index.html` — keeping `storageKey`,
 *    `defaultTheme`, and `mode` in sync with the Angular provider.
 *
 * 2. **The Critters Trick divs** (if `strategy: 'critters'`) — hidden `<div>`
 *    elements that trick Angular's built-in CSS inliner (Critters) into treating
 *    all theme token blocks as "critical CSS", inlining them in the `<head>`
 *    at build time. This achieves zero-flash without any extra network requests.
 *
 * Run this whenever you change `mode`, `storageKey`, `defaultTheme`, or `themes`
 * inside `provideThemeStack()`. Tip: add it as a `prebuild` script in package.json
 * so it runs automatically before every build.
 *
 * @example
 * // One-off sync
 * ng generate ngx-theme-stack:sync
 *
 * @example
 * // Automatic sync (recommended — add to package.json)
 * "prebuild": "ng generate ngx-theme-stack:sync"
 */
/**
 * Auto-detects the strategy by checking if a Critters marker exists in index.html.
 * This allows the prebuild command to run with zero extra flags.
 */
function detectStrategy(
  tree: Tree,
  sourceRoot: string,
  explicitStrategy?: 'critters' | 'blocking',
): 'critters' | 'blocking' {
  if (explicitStrategy) return explicitStrategy;

  const candidates = [`${sourceRoot}/index.html`, 'public/index.html'].map((p) =>
    p.startsWith('/') ? p.slice(1) : p,
  );

  for (const path of candidates) {
    if (!tree.exists(path)) continue;
    const content = tree.readText(path);
    // If either the full block OR the bare marker comment exist → critters
    if (content.includes('ngx-theme-stack critters-trick')) return 'critters';
    return 'blocking';
  }

  return 'critters'; // safe default
}

export function sync(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const workspaceConfig = tree.read('/angular.json');
    if (!workspaceConfig) {
      throw new Error('Could not find angular.json. Are you in an Angular workspace?');
    }

    const workspace = JSON.parse(workspaceConfig.toString());
    const projectName = options.project ?? workspace.defaultProject;
    const project = workspace.projects[projectName];

    if (!project) {
      throw new Error(`Project "${projectName}" not found in angular.json.`);
    }

    const sourceRoot: string = project.sourceRoot || `${project.root ?? ''}/src`;
    const config = extractConfig(tree, sourceRoot, context);
    const strategy = (options.strategy || config.strategy || detectStrategy(tree, sourceRoot)) as 'critters' | 'blocking';

    context.logger.info('');
    context.logger.info(`🔄  ngx-theme-stack sync [project: ${projectName}, strategy: ${strategy}]`);
    context.logger.info('');

    syncIndexHtml(tree, context, sourceRoot, config, strategy);
    syncAngularJson(tree, context, projectName, strategy);

    context.logger.info('');
    context.logger.info('✅  Done! The anti-flash setup is now in sync with your provider config.');
    if (strategy === 'critters') {
      context.logger.info('   Critters Trick: theme CSS will be automatically inlined at build time.');
    }
    context.logger.info('');
  };
}
