import { SchematicContext, Tree } from '@angular-devkit/schematics';

/**
 * Attempts to automatically locate and update the application configuration files.
 * It searches for standard Angular file paths relative to the project's source root.
 *
 * @param tree The virtual file tree of the project.
 * @param context The schematic's execution context.
 * @param sourceRoot The source root for the project (e.g. 'projects/demo-ngx-theme-stack/src').
 * @param provideCall The pre-formatted code string for provideThemeStack().
 */
export function patchAppConfig(
  tree: Tree,
  context: SchematicContext,
  sourceRoot: string,
  provideCall: string,
): void {
  const candidates = [`${sourceRoot}/app/app.config.ts`, `${sourceRoot}/main.ts`, `${sourceRoot}/app/app.module.ts`].map(p => p.startsWith('/') ? p.slice(1) : p);

  for (const filePath of candidates) {
    if (!tree.exists(filePath)) continue;

    const content = tree.readText(filePath);

    let updated = content;

    if (updated.includes('provideThemeStack')) {
      updated = updated.replace(/provideThemeStack\s*\([\s\S]*?\)/, provideCall);
      tree.overwrite(filePath, updated);
      return;
    }

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
    return;
  }

  context.logger.warn(
    `⚠ Could not find app.config.ts / main.ts / app.module.ts.\n` +
      `  Add manually:\n\n` +
      `  import { provideThemeStack } from 'ngx-theme-stack';\n\n` +
      `  providers: [ ${provideCall} ]`,
  );
}
