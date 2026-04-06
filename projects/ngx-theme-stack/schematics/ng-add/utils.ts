import * as readline from 'readline';
import { DEFAULT_THEMES, DEFAULTS } from './constants';

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

/**
 * Builds the 'provideThemeStack({...})' string representation.
 * It compares the selected values with library defaults to generate a 
 * minimal call string (omitting properties that match defaults).
 */
export function buildProvideCall(
  defaultTheme: string,
  storageKey: string,
  mode: string,
  themes: string[],
): string {
  const defaultThemesList = [...DEFAULT_THEMES] as string[];
  const isDefaultThemes =
    themes.length === defaultThemesList.length && themes.every((t, i) => t === defaultThemesList[i]);

  const isAllDefault =
    defaultTheme === DEFAULTS.defaultTheme &&
    storageKey === DEFAULTS.storageKey &&
    mode === DEFAULTS.mode &&
    isDefaultThemes;

  if (isAllDefault) return `provideThemeStack()`;

  const parts: string[] = [];
  if (defaultTheme !== DEFAULTS.defaultTheme) parts.push(`defaultTheme: '${defaultTheme}'`);
  if (storageKey !== DEFAULTS.storageKey) parts.push(`storageKey: '${storageKey}'`);
  if (mode !== DEFAULTS.mode) parts.push(`mode: '${mode}'`);
  if (!isDefaultThemes) {
    const arr = themes.map((t) => `'${t}'`).join(', ');
    parts.push(`themes: [${arr}]`);
  }

  return `provideThemeStack({ ${parts.join(', ')} })`;
}
