import { Rule, SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { Schema } from './schema';

// ---------------------------------------------------------------------------
// Default configuration (mirrors DEFAULT_NG_CONFIG from the library)
// ---------------------------------------------------------------------------
const DEFAULTS = {
  theme: 'system',
  storageKey: 'ngx-theme-stack-theme',
  themeMode: 'class',
} as const;

// ---------------------------------------------------------------------------
// Helper: build the provideThemeStack() call string
// ---------------------------------------------------------------------------
function buildProvideCall(theme: string, storageKey: string, themeMode: string): string {
  const isDefault =
    theme === DEFAULTS.theme &&
    storageKey === DEFAULTS.storageKey &&
    themeMode === DEFAULTS.themeMode;

  if (isDefault) {
    // Clean call — no arguments needed, defaults will be used by the library
    return `provideThemeStack()`;
  }

  const parts: string[] = [];
  if (theme !== DEFAULTS.theme) parts.push(`theme: '${theme}'`);
  if (storageKey !== DEFAULTS.storageKey) parts.push(`storageKey: '${storageKey}'`);
  if (themeMode !== DEFAULTS.themeMode) parts.push(`mode: '${themeMode}'`);

  return `provideThemeStack({ ${parts.join(', ')} })`;
}

// ---------------------------------------------------------------------------
// Helper: patch app.config.ts (or main.ts for bootstrapApplication)
// ---------------------------------------------------------------------------
function patchAppConfig(tree: Tree, context: SchematicContext, provideCall: string): void {
  // Try app.config.ts first (standalone Angular ≥ 17 default)
  const candidates = [
    'src/app/app.config.ts',
    'src/main.ts',
    'src/app/app.module.ts',
  ];

  let patched = false;

  for (const filePath of candidates) {
    if (!tree.exists(filePath)) continue;

    const content = tree.readText(filePath);

    // Already configured?
    if (content.includes('provideThemeStack')) {
      context.logger.info(`✔ ngx-theme-stack is already configured in ${filePath}`);
      patched = true;
      break;
    }

    // -----------------------------------------------------------------------
    // app.config.ts / standalone bootstrapApplication pattern
    // -----------------------------------------------------------------------
    if (filePath.endsWith('app.config.ts') || filePath.endsWith('main.ts')) {
      // Add import statement
      let updated = content;

      if (!updated.includes("from 'ngx-theme-stack'")) {
        const lastImportIndex = updated.lastIndexOf("import ");
        const endOfLine = updated.indexOf('\n', lastImportIndex);
        const importStatement = `import { provideThemeStack } from 'ngx-theme-stack';`;
        updated =
          updated.slice(0, endOfLine + 1) +
          importStatement + '\n' +
          updated.slice(endOfLine + 1);
      }

      // Inject into providers array
      if (updated.includes('providers:')) {
        // Insert before closing bracket of providers array
        updated = updated.replace(
          /providers:\s*\[([\s\S]*?)\]/,
          (_match: string, inner: string) => {
            const trimmed = inner.trimEnd();
            const separator = trimmed.length > 0 && !trimmed.endsWith(',') ? ',\n    ' : '\n    ';
            return `providers: [${trimmed}${separator}${provideCall}\n  ]`;
          },
        );
      } else if (updated.includes('bootstrapApplication')) {
        // No providers key yet — add it
        updated = updated.replace(
          /bootstrapApplication\s*\(\s*([^,)]+)\s*\)/,
          `bootstrapApplication($1, {\n  providers: [\n    ${provideCall}\n  ]\n})`,
        );
      }

      tree.overwrite(filePath, updated);
      context.logger.info(`✔ Added ${provideCall} to ${filePath}`);
      patched = true;
      break;
    }

    // -----------------------------------------------------------------------
    // app.module.ts (legacy NgModule pattern)
    // -----------------------------------------------------------------------
    if (filePath.endsWith('app.module.ts')) {
      let updated = content;

      if (!updated.includes("from 'ngx-theme-stack'")) {
        const lastImportIndex = updated.lastIndexOf("import ");
        const endOfLine = updated.indexOf('\n', lastImportIndex);
        const importStatement = `import { provideThemeStack } from 'ngx-theme-stack';`;
        updated =
          updated.slice(0, endOfLine + 1) +
          importStatement + '\n' +
          updated.slice(endOfLine + 1);
      }

      // Add to NgModule providers
      updated = updated.replace(
        /providers:\s*\[([\s\S]*?)\]/,
        (_match: string, inner: string) => {
          const trimmed = inner.trimEnd();
          const separator = trimmed.length > 0 && !trimmed.endsWith(',') ? ',\n    ' : '\n    ';
          return `providers: [${trimmed}${separator}${provideCall}\n  ]`;
        },
      );

      tree.overwrite(filePath, updated);
      context.logger.info(`✔ Added ${provideCall} to ${filePath}`);
      patched = true;
      break;
    }
  }

  if (!patched) {
    context.logger.warn(
      `⚠ Could not locate app.config.ts, main.ts, or app.module.ts.\n` +
        `  Please add the following manually to your providers array:\n\n` +
        `  import { provideThemeStack } from 'ngx-theme-stack';\n\n` +
        `  providers: [ ${provideCall} ]`,
    );
  }
}

// ---------------------------------------------------------------------------
// Schematic factory
// ---------------------------------------------------------------------------
export function ngAdd(options: Schema): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    context.logger.info('');
    context.logger.info('🎨  ngx-theme-stack — setup');
    context.logger.info('');

    // Resolve final config values
    // In 'quick' mode the x-prompt for theme/storageKey/themeMode are never shown
    // (they keep their schema defaults), so we always have usable values here.
    const theme = options.mode === 'quick' ? DEFAULTS.theme : (options.theme ?? DEFAULTS.theme);
    const storageKey =
      options.mode === 'quick' ? DEFAULTS.storageKey : (options.storageKey ?? DEFAULTS.storageKey);
    const themeMode =
      options.mode === 'quick' ? DEFAULTS.themeMode : (options.themeMode ?? DEFAULTS.themeMode);

    if (options.mode === 'quick') {
      context.logger.info('⚡ Quick setup — applying default configuration:');
    } else {
      context.logger.info('🛠  Custom setup — applying your configuration:');
    }

    context.logger.info(`   theme      : ${theme}`);
    context.logger.info(`   storageKey : ${storageKey}`);
    context.logger.info(`   mode       : ${themeMode}`);
    context.logger.info('');

    const provideCall = buildProvideCall(theme, storageKey, themeMode);

    return chain([
      (t: Tree, ctx: SchematicContext) => {
        patchAppConfig(t, ctx, provideCall);
        ctx.logger.info('');
        ctx.logger.info('✅  ngx-theme-stack configured successfully!');
        ctx.logger.info('   Run `ng serve` to see your theme stack in action.');
        ctx.logger.info('');
      },
    ]);
  };
}