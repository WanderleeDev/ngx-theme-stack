import * as readline from 'readline';

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
    `      themes: [${themesArr}],`,
    `      defaultTheme: '${defaultTheme}',`,
    `      storageKey: '${storageKey}',`,
    `      mode: '${mode}',`,
    `      strategy: '${strategy}',`,
    '    })',
  ].join('\n');
}
