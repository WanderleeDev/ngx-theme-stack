import * as readline from 'readline';
import { SchematicsException, Tree } from '@angular-devkit/schematics';

/**
 * Creates a readline interface using the system's standard input and output.
 */
export function createRl(): readline.Interface {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

/**
 * Prompts the user with a question and returns their trimmed answer.
 */
export function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));
}

/**
 * Displays a numbered list of items to the user and returns the selected item.
 * If the input is invalid or ignored, the default index item is returned.
 */
export async function askList(
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

export function buildProvideCall(
  defaultTheme: string,
  storageKey: string,
  mode: string,
  themes: string[],
  strategy: string,
): string {
  const themesArr = themes.map((t) => `'${t}'`).join(', ');
  return [
    'provideThemeStack({',
    `      themes: [${themesArr}] as const,`,
    `      defaultTheme: '${defaultTheme}',`,
    `      storageKey: '${storageKey}',`,
    `      mode: '${mode}',`,
    `      strategy: '${strategy}',`,
    '    })',
  ].join('\n');
}

/**
 * True when a `main.ts` content looks like a NestJS bootstrap instead of an
 * Angular entry point. Used to fail loudly instead of patching a Nest app.
 */
export function looksLikeNestMain(mainContent: string | null | undefined): boolean {
  if (!mainContent) return false;
  return /@nestjs\/core|NestFactory\.create/.test(mainContent);
}

/**
 * Guards a schematic against targeting a non-Angular application. When the
 * resolved project's `main.ts` is a NestJS bootstrap, stop with an actionable
 * error instead of wiring the provider/scripts into the wrong app.
 */
export function assertAngularProject(
  tree: Tree,
  sourceRoot: string,
  projectName: string,
): void {
  const mainPath = `${sourceRoot}/main.ts`.replace(/^\//, '');
  if (!looksLikeNestMain(tree.read(mainPath)?.toString())) return;
  throw new SchematicsException(
    `"${projectName}" looks like a NestJS application, not an Angular app. ` +
      `Pass --project <angular-app-name> to target the Angular app.`,
  );
}

/**
 * Detect the workspace package manager (monorepo-aware).
 * Reads the `packageManager` field first, then falls back to lockfiles.
 * Unknown or absent managers default to `npm`.
 */
export function detectPackageManager(tree: Tree): string {
  try {
    const pkgPath = '/package.json';
    if (tree.exists(pkgPath)) {
      const pkg = JSON.parse(tree.read(pkgPath)!.toString()) as {
        packageManager?: string;
      };
      const pmField = pkg.packageManager;
      if (pmField) {
        const name = pmField.split('@')[0];
        if (['npm', 'yarn', 'pnpm', 'bun'].includes(name)) return name;
      }
    }
  } catch {
    // malformed package.json — fall through to lockfile detection
  }
  if (tree.exists('pnpm-lock.yaml')) return 'pnpm';
  if (tree.exists('yarn.lock')) return 'yarn';
  if (tree.exists('bun.lockb') || tree.exists('bun.lock')) return 'bun';
  if (tree.exists('package-lock.json')) return 'npm';
  return 'npm';
}
