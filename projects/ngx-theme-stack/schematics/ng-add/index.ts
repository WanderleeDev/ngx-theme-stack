import { Rule, SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { DEFAULT_THEMES, DEFAULTS } from './constants';
import { createRl, ask, askList, buildProvideCall } from './utils';
import { patchAppConfig } from './app-config';
import { patchIndexHtml } from './anti-flash';

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

    process.stdout.write('\n');
    return { defaultTheme, storageKey, mode, themes: allThemes };
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
  return async (_tree: Tree, context: SchematicContext) => {
    context.logger.info('');
    context.logger.info('🎨  ngx-theme-stack — setup');
    context.logger.info('');

    let provideCall: string;
    let scriptOptions: { storageKey: string; defaultTheme: string; mode: string; themes: string[] };

    if (options.mode === 'quick') {
      provideCall = 'provideThemeStack()';
      scriptOptions = {
        storageKey: DEFAULTS.storageKey,
        defaultTheme: DEFAULTS.defaultTheme,
        mode: DEFAULTS.mode,
        themes: [...DEFAULTS.themes],
      };
      context.logger.info('⚡ Quick setup — defaults applied by the library (DEFAULT_NG_CONFIG).');
    } else {
      context.logger.info('🛠  Custom setup — answer the prompts below:');
      const opts = await collectCustomOptions();
      const { defaultTheme, storageKey, mode, themes } = opts;

      context.logger.info('   Applying your configuration:');
      context.logger.info(`   defaultTheme : ${defaultTheme}`);
      context.logger.info(`   themes       : [${themes.join(', ')}]`);
      context.logger.info(`   storageKey   : ${storageKey}`);
      context.logger.info(`   mode         : ${mode}`);

      provideCall = buildProvideCall(defaultTheme, storageKey, mode, themes);
      scriptOptions = { storageKey, defaultTheme, mode, themes };
    }

    return chain([
      (t: Tree, ctx: SchematicContext) => {
        patchAppConfig(t, ctx, provideCall);
        patchIndexHtml(t, ctx, scriptOptions);
        ctx.logger.info('');
        ctx.logger.info('✅  Done! Run `ng serve` to see ngx-theme-stack in action.');
        ctx.logger.info('');
      },
    ]);
  };
}