import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { DEFAULTS } from '../ng-add/constants';
import { Schema } from './schema';

// ── Regex patterns ────────────────────────────────────────────────────────────

/**
 * Matches the provideThemeStack() call in app.config.ts.
 * Captures the full options object string (may be empty).
 *
 * Examples matched:
 *   provideThemeStack()
 *   provideThemeStack({ mode: 'attribute', themes: ['dark', 'light'] })
 */
const PROVIDE_CALL_RE = /provideThemeStack\s*\(([^)]*)\)/;

/**
 * Extracts "mode" value from the captured options string.
 * e.g.  { mode: 'attribute', ... }  →  'attribute'
 */
const OPTION_MODE_RE = /mode\s*:\s*['"]([^'"]+)['"]/;

/**
 * Extracts "storageKey" value from the captured options string.
 */
const OPTION_KEY_RE = /storageKey\s*:\s*['"]([^'"]+)['"]/;

/**
 * Extracts "defaultTheme" value from the captured options string.
 */
const OPTION_DEFAULT_THEME_RE = /defaultTheme\s*:\s*['"]([^'"]+)['"]/;

/**
 * Identifies the inline anti-flash script injected by ng-add.
 * We look for the unique comment marker.
 */
const SCRIPT_MARKER = 'ngx-theme-stack anti-flash';

/**
 * Matches the complete <script> block that contains the anti-flash script.
 * Captures everything between the comment marker and the closing </script>.
 */
const SCRIPT_BLOCK_RE =
  /<!-- ngx-theme-stack anti-flash -->\s*<script>[\s\S]*?<\/script>/;

// ── Config extraction ─────────────────────────────────────────────────────────

interface ExtractedConfig {
  storageKey: string;
  defaultTheme: string;
  mode: string;
}

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
        `⚠ provideThemeStack() not found in ${filePath}. Using library defaults.`,
      );
      break;
    }

    const opts = provideMatch[1]; // everything inside provideThemeStack(...)

    const mode = OPTION_MODE_RE.exec(opts)?.[1] ?? DEFAULTS.mode;
    const storageKey = OPTION_KEY_RE.exec(opts)?.[1] ?? DEFAULTS.storageKey;
    const defaultTheme = OPTION_DEFAULT_THEME_RE.exec(opts)?.[1] ?? DEFAULTS.defaultTheme;

    context.logger.info(`   Detected mode         : ${mode}`);
    context.logger.info(`   Detected storageKey   : ${storageKey}`);
    context.logger.info(`   Detected defaultTheme : ${defaultTheme}`);

    return { mode, storageKey, defaultTheme };
  }

  // Fallback to defaults if no config file found
  return {
    mode: DEFAULTS.mode,
    storageKey: DEFAULTS.storageKey,
    defaultTheme: DEFAULTS.defaultTheme,
  };
}

// ── Script generation ─────────────────────────────────────────────────────────

/**
 * Builds the minimal blocking inline script — identical logic to anti-flash.ts
 * but read-only (no themes list needed; generic regex validation).
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

// ── index.html patching ───────────────────────────────────────────────────────

function syncIndexHtml(
  tree: Tree,
  context: SchematicContext,
  sourceRoot: string,
  config: ExtractedConfig,
): void {
  const candidates = [`${sourceRoot}/index.html`, 'public/index.html'].map((p) =>
    p.startsWith('/') ? p.slice(1) : p,
  );

  for (const path of candidates) {
    if (!tree.exists(path)) continue;

    const content = tree.readText(path);

    if (!content.includes(SCRIPT_MARKER)) {
      context.logger.warn(
        `⚠ Anti-flash script marker not found in ${path}.\n` +
          `  Run 'ng add ngx-theme-stack' first, or add the script manually.`,
      );
      return;
    }

    const newScriptBlock =
      `<!-- ngx-theme-stack anti-flash -->\n  <script>${buildScript(config)}</script>`;

    const updated = content.replace(SCRIPT_BLOCK_RE, newScriptBlock);

    if (updated === content) {
      context.logger.warn(
        `⚠ Could not replace script block in ${path}. The format may have changed.`,
      );
      return;
    }

    tree.overwrite(path, updated);
    context.logger.info(`✔ Anti-flash script synced in ${path}`);
    return;
  }

  context.logger.warn(
    `⚠ Could not find index.html (tried: ${candidates.join(', ')}).`,
  );
}

// ── Schematic factory ─────────────────────────────────────────────────────────

/**
 * `ng generate ngx-theme-stack:sync`
 *
 * Reads the current `provideThemeStack()` configuration from `app.config.ts`
 * and regenerates the anti-flash inline script in `index.html` to match.
 *
 * Run this whenever you change `mode`, `storageKey`, or `defaultTheme`
 * inside `provideThemeStack()` to keep the anti-flash script in sync.
 */
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

    context.logger.info('');
    context.logger.info(`🔄  ngx-theme-stack sync [project: ${projectName}]`);
    context.logger.info('');

    const config = extractConfig(tree, sourceRoot, context);
    syncIndexHtml(tree, context, sourceRoot, config);

    context.logger.info('');
    context.logger.info('✅  Done! The anti-flash script is now in sync with your provider config.');
    context.logger.info('');
  };
}
