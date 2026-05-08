import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { patchIndexHtml } from './anti-flash';
import { patchAppConfig } from './app-config';
import { DEFAULT_THEMES, DEFAULTS } from './constants';
import { Schema } from './schema';
import { ask, askList, buildProvideCall, createRl } from './utils';

interface SchematicConfig {
  defaultTheme: string;
  storageKey: string;
  mode: string;
  themes: string[];
  strategy: 'critters' | 'blocking';
  provideCall: string;
}

async function collectCustomOptions(): Promise<SchematicConfig> {
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
    const themes = [...DEFAULT_THEMES, ...customThemes];

    const defaultTheme = await askList(rl, 'Default theme:', themes, 0);

    const rawKey = await ask(rl, `  localStorage key [${DEFAULTS.storageKey}]: `);
    const storageKey = rawKey || DEFAULTS.storageKey;

    const MODES = ['class', 'attribute', 'both'] as const;
    const mode = await askList(rl, 'How to apply theme on <html>:', MODES, 0);

    const STRATEGIES = ['critters', 'blocking'] as const;
    process.stdout.write('\n  Anti-flash strategy:\n');
    process.stdout.write('  - critters (default): Inlines all theme CSS in <head> — zero network requests.\n');
    process.stdout.write('                        Works for CSR, SSR, and SSG apps.\n');
    process.stdout.write('                        Use blocking instead if you have a strict CSP or many themes.\n');
    process.stdout.write('  - blocking:           Loads themes.css as a render-blocking stylesheet.\n');
    process.stdout.write('                        HTTP-cacheable. Choose if Critters conflicts with your setup.\n');
    const strategy = (await askList(rl, 'Choose strategy:', STRATEGIES, 0)) as
      | 'critters'
      | 'blocking';

    const provideCall = buildProvideCall(defaultTheme, storageKey, mode, themes, strategy);

    process.stdout.write('\n');
    return { defaultTheme, storageKey, mode, themes, strategy, provideCall };
  } finally {
    rl.close();
  }
}

export function ngAdd(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspaceConfig = tree.read('/angular.json');
    if (!workspaceConfig) {
      throw new Error('Could not find angular.json. Are you in an Angular workspace?');
    }

    const workspace = JSON.parse(workspaceConfig.toString());
    const projectName =
      options.project || workspace.defaultProject || Object.keys(workspace.projects)[0];
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
    // Computed once and shared across steps to avoid duplication
    const themesPath = `${projectSourceRoot}/themes.css`.replace(/^\//, '');

    function scaffoldThemesCss(t: Tree): void {
      if (t.exists(themesPath)) {
        changeset.push(` \u001b[90mℹ\u001b[0m ${themesPath} (already exists)`);
        return;
      }

      let content = '/* ngx-theme-stack tokens */\n\n';
      themesToScaffold.forEach((theme) => {
        const selector = config.mode === 'attribute' ? `[data-theme="${theme}"]` : `.${theme}`;
        content +=
          theme === 'light'
            ? `:root, ${selector} {\n  /* Add your light theme variables here */\n}\n\n`
            : `${selector} {\n  /* Add your ${theme} theme variables here */\n}\n\n`;
      });

      t.create(themesPath, content);
      changeset.push(` \u001b[36mA\u001b[0m ${themesPath} (theme tokens)`);
    }

    function patchPrebuildScript(t: Tree): void {
      const pkgPath = '/package.json';
      const buffer = t.read(pkgPath);
      if (!buffer) return;

      const pkg = JSON.parse(buffer.toString());
      pkg.scripts = pkg.scripts || {};
      const syncCmd = `ng generate ngx-theme-stack:sync --project ${projectName}`;
      const existing = pkg.scripts.prebuild as string | undefined;

      if (!existing) {
        pkg.scripts.prebuild = syncCmd;
        changeset.push(' \u001b[33mM\u001b[0m package.json (prebuild script added)');
      } else if (!existing.includes('ngx-theme-stack:sync')) {
        pkg.scripts.prebuild = `${existing} && ${syncCmd}`;
        changeset.push(' \u001b[33mM\u001b[0m package.json (sync appended to existing prebuild)');
      } else {
        changeset.push(' \u001b[90mℹ\u001b[0m package.json (prebuild already contains sync — skipped)');
      }

      t.overwrite(pkgPath, JSON.stringify(pkg, null, 2));
    }

    function patchAngularJson(t: Tree): void {
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
    }

    async function patchProviderAndIndexHtml(t: Tree, ctx: SchematicContext): Promise<void> {
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
    }

    return chain([
      scaffoldThemesCss,
      patchPrebuildScript,
      patchAngularJson,
      patchProviderAndIndexHtml,
    ]);
  };
}
