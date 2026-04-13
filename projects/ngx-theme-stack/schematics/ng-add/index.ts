import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { patchIndexHtml } from './anti-flash';
import { patchAppConfig } from './app-config';
import { DEFAULT_THEMES, DEFAULTS } from './constants';
import { Schema } from './schema';
import { ask, askList, buildProvideCall, createRl } from './utils';

/**
 * Interactively prompts the user for custom configuration options using readline.
 * It allows defining additional themes, selecting a default theme from the expanded list,
 * providing a custom localStorage key, and choosing a CSS application mode.
 *
 * @returns A promise resolving to the user's selected configuration options.
 */
async function collectCustomOptions(): Promise<{
  defaultTheme: string;
  storageKey: string;
  mode: string;
  themes: string[];
  strategy: 'critters' | 'blocking';
}> {
  const rl = createRl();

  try {
    process.stdout.write('\n');

    const rawThemes = await ask(rl, '  Custom themes (comma-separated, Enter to skip): ');
    const customThemes = rawThemes
      ? rawThemes
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const allThemes = [...DEFAULT_THEMES, ...customThemes];

    const defaultTheme = await askList(rl, 'Default theme:', allThemes, 0);

    const rawKey = await ask(rl, `  localStorage key [${DEFAULTS.storageKey}]: `);
    const storageKey = rawKey || DEFAULTS.storageKey;

    const MODES = ['class', 'attribute', 'both'] as const;
    const mode = await askList(rl, 'How to apply theme on <html>:', MODES, 0);

    const STRATEGIES = ['critters', 'blocking'] as const;
    process.stdout.write('\n');
    process.stdout.write('  Anti-flash strategy:\n');
    process.stdout.write('  - critters: Zero network requests (inlines CSS in <head>)\n');
    process.stdout.write('  - blocking: Standard CSS loading (themes.css)\n');
    const strategy = (await askList(rl, 'Choose strategy:', STRATEGIES, 0)) as 'critters' | 'blocking';

    process.stdout.write('\n');
    return { defaultTheme, storageKey, mode, themes: allThemes, strategy };
  } finally {
    rl.close();
  }
}

/**
 * Main schematic factory for the 'ng-add' command.
 * Depending on the 'mode' option, it either applies default library values ("quick")
 * or starts an interactive session to collect personalized configuration ("custom").
 *
 * @param options The schema options provided by the Angular CLI.
 * @returns A rule that modifies the project's setup.
 */
export function ngAdd(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    // ── Workspace Resolution ──────────────────────────────────────────────────
    // In a monorepo, we must find the project's actual root and sourceRoot.
    const workspaceConfig = tree.read('/angular.json');
    if (!workspaceConfig) {
      throw new Error('Could not find angular.json. Are you in an Angular workspace?');
    }

    const workspace = JSON.parse(workspaceConfig.toString());
    const projectName = options.project || workspace.defaultProject;
    const project = workspace.projects[projectName];

    if (!project) {
      throw new Error(`Project "${projectName}" not found in angular.json.`);
    }

    const projectRoot = project.root || '';
    const projectSourceRoot = project.sourceRoot || `${projectRoot}/src`;

    context.logger.info('');
    context.logger.info(`🎨  ngx-theme-stack — setup [project: ${projectName}]`);
    context.logger.info('');

    let provideCall: string;
    let scriptOptions: { storageKey: string; defaultTheme: string; mode: string };
    let finalThemes: string[];
    let themesToScaffold: string[];
    let finalStrategy: 'critters' | 'blocking';

    if (options.mode === 'quick') {
      const themes = [...DEFAULT_THEMES];
      const { defaultTheme, storageKey, mode } = DEFAULTS;
      const strategy = 'critters'; // default for quick
      provideCall = buildProvideCall(defaultTheme, storageKey, mode, themes);
      scriptOptions = { storageKey, defaultTheme, mode };
      finalThemes = themes;
      themesToScaffold = themes.filter((t) => t !== 'system');
      finalStrategy = strategy;
      context.logger.info('⚡ Quick setup — providing explicit defaults (strategy: critters).');
    } else {
      context.logger.info('🛠  Custom setup — answer the prompts below:');
      const opts = await collectCustomOptions();
      const { defaultTheme, storageKey, mode, themes, strategy } = opts;

      context.logger.info('   Applying your configuration:');
      context.logger.info(`   defaultTheme : ${defaultTheme}`);
      context.logger.info(`   themes       : [${themes.join(', ')}]`);
      context.logger.info(`   storageKey   : ${storageKey}`);
      context.logger.info(`   mode         : ${mode}`);
      context.logger.info(`   strategy     : ${strategy}`);

      provideCall = buildProvideCall(defaultTheme, storageKey, mode, themes);
      scriptOptions = { storageKey, defaultTheme, mode };
      finalThemes = themes;
      themesToScaffold = themes.filter((t) => t !== 'system');
      finalStrategy = strategy;
    }

    return chain([
      (t: Tree, context: SchematicContext) => {
        const themesPath = `${projectSourceRoot}/themes.css`;
        if (!t.exists(themesPath)) {
          let content = '/* ngx-theme-stack tokens */\n\n';

          themesToScaffold.forEach((theme) => {
            const selector =
              scriptOptions.mode === 'attribute' ? `[data-theme="${theme}"]` : `.${theme}`;

            if (theme === 'light') {
              content += `:root, ${selector} {\n  /* Add your light theme variables here */\n}\n\n`;
            } else {
              content += `${selector} {\n  /* Add your ${theme} theme variables here */\n}\n\n`;
            }
          });

          t.create(themesPath, content);
          context.logger.info(`\n \u001b[36mResume :\u001b[0m \n`);
          context.logger.info(`\u001b[32m✔ Created ${themesPath} with your theme selectors.\u001b[0m`);
        } else {
          context.logger.info(`\n \u001b[36mResume :\u001b[0m \n`);
          context.logger.info(
            `\u001b[33mℹ ${themesPath} already exists. Skipping creation to preserve your styles.\u001b[0m`,
          );
          context.logger.info(
            `  Tip: Make sure to manually add selectors (class or attribute) for any new themes.`,
          );
        }
      },
      (t: Tree) => {
        const pkgPath = '/package.json';
        const buffer = t.read(pkgPath);
        if (buffer) {
          const pkg = JSON.parse(buffer.toString());
          pkg.scripts = pkg.scripts || {};
          pkg.scripts.prebuild = `ng generate ngx-theme-stack:sync --project ${projectName}`;
          t.overwrite(pkgPath, JSON.stringify(pkg, null, 2));
        }
      },
      (t: Tree, context: SchematicContext) => {
        const workspaceConfig = t.read('/angular.json');
        if (workspaceConfig) {
          const workspace = JSON.parse(workspaceConfig.toString());
          const project = workspace.projects[projectName];
          const target = project.architect.build.options;
          const themesPath = `${projectSourceRoot}/themes.css`.replace(/^\//, '');

          // Add themes.css to styles if not already there
          if (target.styles && !target.styles.includes(themesPath)) {
            target.styles.unshift(themesPath);
          }

          // Handle inlineCritical optimization for the blocking strategy
          const prodConfig = project.architect.build.configurations?.production;
          if (prodConfig && finalStrategy === 'blocking') {
            if (typeof prodConfig.optimization === 'object') {
              prodConfig.optimization.styles = prodConfig.optimization.styles || {};
              prodConfig.optimization.styles.inlineCritical = false;
            } else {
              prodConfig.optimization = {
                styles: { inlineCritical: false },
              };
            }
            context.logger.info(`✔ Disabled inlineCritical in angular.json for blocking strategy.`);
          }

          t.overwrite('/angular.json', JSON.stringify(workspace, null, 2));
        }
      },
      (t: Tree, ctx: SchematicContext) => {
        patchAppConfig(t, ctx, projectSourceRoot, provideCall);
        patchIndexHtml(t, ctx, projectSourceRoot, {
          ...scriptOptions,
          themes: finalThemes,
          strategy: (options.strategy as 'critters' | 'blocking') || finalStrategy,
        });
        ctx.logger.info('');
        ctx.logger.info('✅  Done! ngx-theme-stack is ready with automatic sync on build.');
        ctx.logger.info('');
      },
    ]);
  };
}
