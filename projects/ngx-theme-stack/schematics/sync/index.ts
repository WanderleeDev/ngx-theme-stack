import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { patchAppConfig } from '../ng-add/app-config';
import { buildProvideCall } from '../ng-add/utils';
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
/** Extracts "strategy" value from the captured options string. */
const OPTION_STRATEGY_RE = /strategy\s*:\s*['"]([^'"]+)['"]/;

/**
 * Extracts the themes array from the options string.
 * Supports both single-line and multiline array declarations:
 *   themes: ['light', 'dark', 'sunset']
 *   themes: [
 *     'light',
 *     'dark',
 *   ] as const
 */
const OPTION_THEMES_RE = /themes\s*:\s*\[([\s\S]*?)\]/;

/** Matches the complete <script> anti-flash block (identified by its marker comment). */
const SCRIPT_BLOCK_RE = /<!--\s*ngx-theme-stack\s*anti-flash\s*-->\s*<script[^>]*>[\s\S]*?<\/script>/;

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
      context.logger.info(`ℹ provideThemeStack() not found in ${filePath}. Injecting with defaults.`);
      break;
    }

    const opts = provideMatch[1]; // everything inside provideThemeStack(...)

    const mode = OPTION_MODE_RE.exec(opts)?.[1] ?? DEFAULTS.mode;
    const storageKey = OPTION_KEY_RE.exec(opts)?.[1] ?? DEFAULTS.storageKey;
    const defaultTheme = OPTION_DEFAULT_THEME_RE.exec(opts)?.[1] ?? DEFAULTS.defaultTheme;
    const strategy = OPTION_STRATEGY_RE.exec(opts)?.[1] ?? undefined;

    const themesRaw = OPTION_THEMES_RE.exec(opts)?.[1] ?? '';
    const themes: string[] = themesRaw
      ? themesRaw
          .split(',')
          .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      : [...DEFAULTS.themes];

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
        return `      <div class="${theme}" data-theme="${theme}"></div>`;
      }
    })
    .join('\n');

  return (
    `<!-- ngx-theme-stack critters-trick -->\n` +
    `    <div id="ngx-theme-stack-critters-trick" hidden aria-hidden="true" style="display: none; overflow: hidden; clip-path: inset(50%); position: absolute;">\n${divs}\n    </div>\n` +
    `    <!-- /ngx-theme-stack critters-trick -->`
  );
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
 *    elements that trick Angular's built-in CSS inliner into treating all theme
 *    token blocks as "critical CSS", inlining them in `<head>` at build time.
 *
 * Auto-detects the strategy from the existing `index.html` markers so the
 * prebuild command runs with zero extra flags.
 *
 * Run this whenever you change `mode`, `storageKey`, `defaultTheme`, or `themes`
 * inside `provideThemeStack()`. Tip: add it as a `prebuild` script in package.json.
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
  return async (tree: Tree, context: SchematicContext) => {
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
    const changeset: string[] = [];

    // Ensure provideThemeStack exists and is up to date in app.config.ts
    const provideCall = buildProvideCall(config.defaultTheme, config.storageKey, config.mode, config.themes, strategy);
    await patchAppConfig(tree, context, sourceRoot, provideCall, projectName);

    context.logger.info('');
    context.logger.info(`🔄  ngx-theme-stack — sync [project: ${projectName}]`);
    context.logger.info('');

    // ── 1. index.html ──
    const candidates = [`${sourceRoot}/index.html`, 'public/index.html'].map((p) =>
      p.startsWith('/') ? p.slice(1) : p,
    );

    for (const path of candidates) {
      if (!tree.exists(path)) continue;

      let content = tree.readText(path);
      let changed = false;

      if (content.includes('ngx-theme-stack anti-flash')) {
        const newScriptBlock = `<!-- ngx-theme-stack anti-flash -->\n  <script>${buildScript(config)}</script>`;
        if (SCRIPT_BLOCK_RE.test(content)) {
          const updatedScript = content.replace(SCRIPT_BLOCK_RE, newScriptBlock);
          if (updatedScript !== content) {
            content = updatedScript;
            changed = true;
            changeset.push(` \u001b[32m✔\u001b[0m ${path} (anti-flash script)`);
          }
        }
      }

      if (strategy === 'critters') {
        const crittersBlock = buildCrittersDivs(config.themes, config.mode);
        const CRITTERS_ID_RE = /<div id="ngx-theme-stack-critters-trick"[\s\S]*?<\/div>/;

        if (CRITTERS_BLOCK_RE.test(content)) {
          const updated = content.replace(CRITTERS_BLOCK_RE, crittersBlock);
          if (updated !== content) {
            content = updated;
            changed = true;
            changeset.push(` \u001b[32m✔\u001b[0m ${path} (critters-trick divs updated)`);
          }
        } else if (CRITTERS_ID_RE.test(content)) {
          content = content.replace(CRITTERS_ID_RE, crittersBlock);
          changed = true;
          changeset.push(` \u001b[32m✔\u001b[0m ${path} (critters-trick divs wrapped)`);
        } else if (content.includes(CRITTERS_MARKER)) {
          content = content.replace(CRITTERS_MARKER, crittersBlock);
          changed = true;
          changeset.push(` \u001b[32m✔\u001b[0m ${path} (critters-trick divs injected)`);
        } else {
          content = content.replace('</body>', `  ${crittersBlock}\n  </body>`);
          changed = true;
          changeset.push(` \u001b[32m✔\u001b[0m ${path} (critters-trick block added)`);
        }
      } else if (CRITTERS_BLOCK_RE.test(content)) {
        content = content.replace(CRITTERS_BLOCK_RE, '');
        changed = true;
        changeset.push(` \u001b[32m✔\u001b[0m ${path} (critters-trick divs removed)`);
      }

      if (changed) {
        tree.overwrite(path, content);
      } else {
        changeset.push(` \u001b[90mℹ\u001b[0m ${path} (already synced)`);
      }
    }

    // ── 2. angular.json ──
    const prodConfig = project.architect?.build?.configurations?.production;

    if (prodConfig) {
      let changed = false;
      if (strategy === 'blocking') {
        if (typeof prodConfig.optimization === 'object') {
          prodConfig.optimization.styles = prodConfig.optimization.styles || {};
          if (prodConfig.optimization.styles.inlineCritical !== false) {
            prodConfig.optimization.styles.inlineCritical = false;
            changed = true;
          }
        } else {
          prodConfig.optimization = { styles: { inlineCritical: false } };
          changed = true;
        }
      } else if (typeof prodConfig.optimization === 'object' && prodConfig.optimization.styles?.inlineCritical === false) {
        prodConfig.optimization.styles.inlineCritical = true;
        changed = true;
      }

      if (changed) {
        tree.overwrite('/angular.json', JSON.stringify(workspace, null, 2));
        changeset.push(' \u001b[33mM\u001b[0m angular.json (optimization synced)');
      }
    }

    context.logger.info('\u001b[1mChangeset:\u001b[0m');
    if (changeset.length === 0) {
      context.logger.info('  (no changes needed)');
    } else {
      changeset.forEach((entry) => context.logger.info(entry));
    }

    context.logger.info('');
    context.logger.info('\u001b[1m\u001b[32m🏁 Done.\u001b[0m');
    context.logger.info('');
  };
}
