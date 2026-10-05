/**
 * Parsing helpers for the `themes` option of `provideThemeStack()`.
 *
 * Themes can be written in two shapes, mixable in one array:
 *   themes: ['system', 'light', { name: 'sepia', scheme: 'light' }] as const
 *
 * A naive `split(',')` breaks the object entries, so the array body is split
 * on top-level commas only (ignoring commas nested in braces, brackets,
 * parentheses, or quotes).
 */

/** One parsed theme entry: its name and optional color-scheme hint. */
export interface ParsedThemeInput {
  name: string;
  scheme?: string;
}

/**
 * Splits the body of a `themes: [...]` array into top-level entries.
 *
 * Commas inside `{}`, `[]`, `()`, or string literals do not split.
 */
export function splitTopLevelEntries(body: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let current = '';
  let quote: string | null = null;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];

    if (quote) {
      current += ch;
      if (ch === quote && body[i - 1] !== '\\') quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') depth--;

    if (ch === ',' && depth === 0) {
      entries.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) entries.push(current);
  return entries.map((e) => e.trim()).filter(Boolean);
}

/**
 * Parses one theme entry, either `'name'` or `{ name: 'n', scheme: 's' }`.
 * Property order inside the object is not significant.
 */
export function parseThemeEntry(entry: string): ParsedThemeInput | null {
  if (entry.startsWith('{')) {
    const name = /name\s*:\s*['"]([^'"]+)['"]/.exec(entry)?.[1];
    const scheme = /scheme\s*:\s*['"]([^'"]+)['"]/.exec(entry)?.[1];
    return name ? { name, scheme } : null;
  }
  const match = /^['"]([^'"]+)['"]$/.exec(entry);
  return match ? { name: match[1] } : null;
}

/**
 * Parses the raw body of a `themes: [...]` array into ordered theme names and
 * a `name -> scheme` map for the entries that declare a hint.
 */
export function parseThemeInputArray(body: string): {
  themes: string[];
  schemeMap: Record<string, string>;
} {
  const themes: string[] = [];
  const schemeMap: Record<string, string> = {};

  for (const entry of splitTopLevelEntries(body)) {
    const parsed = parseThemeEntry(entry);
    if (!parsed) continue;
    themes.push(parsed.name);
    if (parsed.scheme) schemeMap[parsed.name] = parsed.scheme;
  }

  return { themes, schemeMap };
}
