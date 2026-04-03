import * as readline from 'readline';
import { Rule, SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { Schema } from './schema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/**
 * ⚠ ATTENTION: SHARED CONFIGURATION VALUES
 *
 * These values MUST match the library defaults in:
 * projects/ngx-theme-stack/src/lib/services/theme-stack.config.ts
 *
 * Schematics run in Node.js (CommonJS) and cannot import from the library (ESM),
 * so these defaults are intentionally duplicated here for:
 * 1. Proposing hints/defaults in interactive prompts.
 * 2. Deciding if a property can be omitted from the generated provideThemeStack() call.
 */
const DEFAULT_THEMES = ['system', 'light', 'dark'] as const;

const DEFAULTS = {
  theme: 'system',
  storageKey: 'ngx-theme-stack-theme',
  mode: 'class',
  themes: [...DEFAULT_THEMES],
} as const;

// ---------------------------------------------------------------------------
// readline helpers
// ---------------------------------------------------------------------------
function createRl(): readline.Interface {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));
}

async function askList(
  rl: readline.Interface,
  label: string,
  items: readonly string[],
  defaultIndex = 0,
): Promise<string> {
  process.stdout.write(`\n  ${label}\n`);
  items.forEach((item, i) => process.stdout.write(`    ${i + 1}) ${item}\n`));
  const raw = await ask(rl, `  Choice [${defaultIndex + 1}]: `);
  const n = parseInt(raw, 10);
  return isNaN(n) || n < 1 || n > items.length ? items[defaultIndex] : items[n - 1];
}

// ---------------------------------------------------------------------------
// Build provideThemeStack() call string
// ---------------------------------------------------------------------------
function buildProvideCall(
  theme: string,
  storageKey: string,
  mode: string,
  themes: string[],
): string {
  const defaultThemes = [...DEFAULT_THEMES] as string[];
  const isDefaultThemes =
    themes.length === defaultThemes.length && themes.every((t, i) => t === defaultThemes[i]);

  const isAllDefault =
    theme === DEFAULTS.theme &&
    storageKey === DEFAULTS.storageKey &&
    mode === DEFAULTS.mode &&
    isDefaultThemes;

  if (isAllDefault) return `provideThemeStack()`;

  const parts: string[] = [];
  if (theme !== DEFAULTS.theme) parts.push(`theme: '${theme}'`);
  if (storageKey !== DEFAULTS.storageKey) parts.push(`storageKey: '${storageKey}'`);
  if (mode !== DEFAULTS.mode) parts.push(`mode: '${mode}'`);
  if (!isDefaultThemes) {
    const arr = themes.map((t) => `'${t}'`).join(', ');
    parts.push(`themes: [${arr}]`);
  }

  return `provideThemeStack({ ${parts.join(', ')} })`;
}

// ---------------------------------------------------------------------------
// Patch app.config.ts / main.ts / app.module.ts
// ---------------------------------------------------------------------------
function patchAppConfig(tree: Tree, context: SchematicContext, provideCall: string): void {
  const candidates = ['src/app/app.config.ts', 'src/main.ts', 'src/app/app.module.ts'];

  for (const filePath of candidates) {
    if (!tree.exists(filePath)) continue;

    const content = tree.readText(filePath);

    if (content.includes('provideThemeStack')) {
      context.logger.info(`✔ ngx-theme-stack already configured in ${filePath}`);
      return;
    }

    let updated = content;

    // Add import if missing
    if (!updated.includes("from 'ngx-theme-stack'")) {
      const lastImport = updated.lastIndexOf('import ');
      const eol = updated.indexOf('\n', lastImport);
      updated =
        updated.slice(0, eol + 1) +
        `import { provideThemeStack } from 'ngx-theme-stack';\n` +
        updated.slice(eol + 1);
    }

    // Inject into providers array
    if (updated.includes('providers:')) {
      updated = updated.replace(
        /providers:\s*\[([\s\S]*?)\]/,
        (_m: string, inner: string) => {
          const trimmed = inner.trimEnd();
          const sep = trimmed.length > 0 && !trimmed.endsWith(',') ? ',\n    ' : '\n    ';
          return `providers: [${trimmed}${sep}${provideCall}\n  ]`;
        },
      );
    } else if (updated.includes('bootstrapApplication')) {
      updated = updated.replace(
        /bootstrapApplication\s*\(\s*([^,)]+)\s*\)/,
        `bootstrapApplication($1, {\n  providers: [\n    ${provideCall}\n  ]\n})`,
      );
    }

    tree.overwrite(filePath, updated);
    context.logger.info(`✔ Added ${provideCall} to ${filePath}`);
    return;
  }

  context.logger.warn(
    `⚠ Could not find app.config.ts / main.ts / app.module.ts.\n` +
      `  Add manually:\n\n` +
      `  import { provideThemeStack } from 'ngx-theme-stack';\n\n` +
      `  providers: [ ${provideCall} ]`,
  );
}

// ---------------------------------------------------------------------------
// Custom mode — interactive readline prompts
// ---------------------------------------------------------------------------
async function collectCustomOptions(): Promise<{
  theme: string;
  storageKey: string;
  mode: string;
  themes: string[];
}> {
  const rl = createRl();

  try {
    process.stdout.write('\n');

    // 1. Custom themes
    const rawThemes = await ask(
      rl,
      '  Custom themes (comma-separated, Enter to skip): ',
    );
    const customThemes = rawThemes
      ? rawThemes
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const allThemes = [...DEFAULT_THEMES, ...customThemes];

    // 2. Default theme — includes custom ones
    const theme = await askList(rl, 'Default theme:', allThemes, 0);

    // 3. Storage key
    const rawKey = await ask(
      rl,
      `  localStorage key [${DEFAULTS.storageKey}]: `,
    );
    const storageKey = rawKey || DEFAULTS.storageKey;

    // 4. Apply mode
    const MODES = ['class', 'attribute', 'both'] as const;
    const mode = await askList(
      rl,
      'How to apply theme on <html>:',
      MODES,
      0,
    );

    process.stdout.write('\n');
    return { theme, storageKey, mode, themes: allThemes };
  } finally {
    rl.close();
  }
}

// ---------------------------------------------------------------------------
// Schematic factory
// ---------------------------------------------------------------------------
export function ngAdd(options: Schema): Rule {
  return async (_tree: Tree, context: SchematicContext) => {
    context.logger.info('');
    context.logger.info('🎨  ngx-theme-stack — setup');
    context.logger.info('');

    let provideCall: string;

    if (options.mode === 'quick') {
      // ── Quick: delegate entirely to DEFAULT_NG_CONFIG in the library ────
      // No need to know the defaults here — provideThemeStack() with no args
      // applies DEFAULT_NG_CONFIG automatically at runtime.
      provideCall = 'provideThemeStack()';
      context.logger.info('⚡ Quick setup — defaults applied by the library (DEFAULT_NG_CONFIG).');
    } else {
      // ── Custom: interactive readline prompts ───────────────────────────
      context.logger.info('🛠  Custom setup — answer the prompts below:');
      const opts = await collectCustomOptions();
      const { theme, storageKey, mode, themes } = opts;

      context.logger.info('   Applying your configuration:');
      context.logger.info(`   theme      : ${theme}`);
      context.logger.info(`   themes     : [${themes.join(', ')}]`);
      context.logger.info(`   storageKey : ${storageKey}`);
      context.logger.info(`   mode       : ${mode}`);

      provideCall = buildProvideCall(theme, storageKey, mode, themes);
    }

    return chain([
      (t: Tree, ctx: SchematicContext) => {
        patchAppConfig(t, ctx, provideCall);
        ctx.logger.info('');
        ctx.logger.info('✅  Done! Run `ng serve` to see ngx-theme-stack in action.');
        ctx.logger.info('');
      },
    ]);
  };
}