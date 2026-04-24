import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { patchIndexHtml } from './anti-flash';
import { patchAppConfig } from './app-config';
import { DEFAULT_THEMES, DEFAULTS } from './constants';
import { Schema } from './schema';
import { ask, askList, buildProvideCall, createRl } from './utils';

/**
 * Collected configuration for the ng-add schematic.
 */
interface SchematicConfig {
  defaultTheme: string;
  storageKey: string;
  mode: string;
  themes: string[];
  strategy: 'critters' | 'blocking';
  provideCall: string;
}

/**
 * Interactively prompts the user for custom configuration options.
 */
async function collectCustomOptions(): Promise<SchematicConfig> {
  const rl = createRl();

  try {
    process.stdout.write('\n');

    const rawThemes = await ask(rl, '  Custom themes (comma-separated, Enter to skip): ');
    const customThemes = rawThemes
      ? rawThemes.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    const themes = [...DEFAULT_THEMES, ...customThemes];

    const defaultTheme = await askList(rl, 'Default theme:', themes, 0);

    const rawKey = await ask(rl, `  localStorage key [${DEFAULTS.storageKey}]: `);
    const storageKey = rawKey || DEFAULTS.storageKey;

    const MODES = ['class', 'attribute', 'both'] as const;
    const mode = await askList(rl, 'How to apply theme on <html>:', MODES, 0);

    const STRATEGIES = ['critters', 'blocking'] as const;
    process.stdout.write('\n  Anti-flash strategy:\n');
    process.stdout.write('  - critters: Zero network requests (inlines CSS in <head>)\n');
    process.stdout.write('  - blocking: Standard CSS loading (themes.css)\n');
    const strategy = (await askList(rl, 'Choose strategy:', STRATEGIES, 0)) as 'critters' | 'blocking';

    const provideCall = buildProvideCall(defaultTheme, storageKey, mode, themes, strategy);

    process.stdout.write('\n');
    return { defaultTheme, storageKey, mode, themes, strategy, provideCall };
  } finally {
    rl.close();
  }
}

/**
 * Main schematic factory for the 'ng-add' command.
 */
export function ngAdd(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspaceConfig = tree.read('/angular.json');
    if (!workspaceConfig) {
      throw new Error('Could not find angular.json. Are you in an Angular workspace?');
    }

    const workspace = JSON.parse(workspaceConfig.toString());
    const projectName = options.project || workspace.defaultProject || Object.keys(workspace.projects)[0];
    const project = workspace.projects[projectName];

    if (!project) {
      throw new Error(`Project "${projectName}" not found in angular.json.`);
    }

    const projectRoot = project.root || '';
    const projectSourceRoot = project.sourceRoot || `${projectRoot}/src`;

    context.logger.info('\n🎨  ngx-theme-stack — setup');
    context.logger.info(`    project: ${projectName}\n`);

    let config: SchematicConfig;

    if (options.mode === 'quick') {
      const themes = [...DEFAULT_THEMES];
      const { defaultTheme, storageKey, mode, strategy } = DEFAULTS;
      config = {
        defaultTheme,
        storageKey,
        mode,
        themes,
        strategy: strategy as 'critters' | 'blocking',
        provideCall: buildProvideCall(defaultTheme, storageKey, mode, themes, strategy),
      };
      context.logger.info('⚡ Quick setup — providing explicit defaults.');
    } else {
      context.logger.info('🛠  Custom setup — answer the prompts below:');
      config = await collectCustomOptions();
    }

    const changeset: string[] = [];
    const themesToScaffold = config.themes.filter((t) => t !== 'system');

    return chain([
      // 1. Scaffold themes.css
      (t: Tree) => {
        const themesPath = `${projectSourceRoot}/themes.css`.replace(/^\//, '');
        if (!t.exists(themesPath)) {
          let content = '/* ngx-theme-stack tokens */\n\n';
          themesToScaffold.forEach((theme) => {
            const selector = config.mode === 'attribute' ? `[data-theme="${theme}"]` : `.${theme}`;
            if (theme === 'light') {
              content += `:root, ${selector} {\n  /* Add your light theme variables here */\n}\n\n`;
            } else {
              content += `${selector} {\n  /* Add your ${theme} theme variables here */\n}\n\n`;
            }
          });
          t.create(themesPath, content);
          changeset.push(` \u001b[36mA\u001b[0m ${themesPath} (theme tokens)`);
        } else {
          changeset.push(` \u001b[90mℹ\u001b[0m ${themesPath} (already exists)`);
        }
      },

      // 2. Add prebuild script to package.json
      (t: Tree) => {
        const pkgPath = '/package.json';
        const buffer = t.read(pkgPath);
        if (buffer) {
          const pkg = JSON.parse(buffer.toString());
          pkg.scripts = pkg.scripts || {};
          pkg.scripts.prebuild = `ng generate ngx-theme-stack:sync --project ${projectName}`;
          t.overwrite(pkgPath, JSON.stringify(pkg, null, 2));
          changeset.push(' \u001b[33mM\u001b[0m package.json (prebuild script)');
        }
      },

      // 3. Update angular.json (styles & optimization)
      (t: Tree) => {
        const themesPath = `${projectSourceRoot}/themes.css`.replace(/^\//, '');
        const target = project.architect.build.options;

        if (target.styles && !target.styles.includes(themesPath)) {
          target.styles.unshift(themesPath);
        }

        const prodConfig = project.architect.build.configurations?.production;
        if (prodConfig && config.strategy === 'blocking') {
          if (typeof prodConfig.optimization === 'object') {
            prodConfig.optimization.styles = prodConfig.optimization.styles || {};
            prodConfig.optimization.styles.inlineCritical = false;
          } else {
            prodConfig.optimization = { styles: { inlineCritical: false } };
          }
        }

        t.overwrite('/angular.json', JSON.stringify(workspace, null, 2));
        changeset.push(' \u001b[33mM\u001b[0m angular.json (styles & optimization)');
      },

      // 4. Patch App Config and Index HTML
      async (t: Tree, ctx: SchematicContext) => {
        await patchAppConfig(t, ctx, projectSourceRoot, config.provideCall, projectName);
        changeset.push(' \u001b[33mM\u001b[0m app.config.ts (provided theme stack)');

        patchIndexHtml(t, ctx, projectSourceRoot, {
          storageKey: config.storageKey,
          defaultTheme: config.defaultTheme,
          mode: config.mode,
          themes: config.themes,
          strategy: config.strategy,
        });
        changeset.push(' \u001b[33mM\u001b[0m index.html (injected anti-flash)');

        ctx.logger.info('\n\u001b[1mChangeset:\u001b[0m');
        changeset.forEach((entry) => ctx.logger.info(entry));
        ctx.logger.info('\n\u001b[1m\u001b[32m🏁 Done.\u001b[0m\n');
      },
    ]);
  };
}
