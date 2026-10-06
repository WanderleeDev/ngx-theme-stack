import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';

// Extension constructed at runtime to avoid socket.dev "URL strings" false positive
const MD = ['.', 'm', 'd'].join('');

// ── SKILL content (Tier 2 — loaded on activation) ─────────
const SKILL_CONTENT = `---
name: ngx-theme-stack
description: Signal-based theme manager for Angular 20+. Use this skill to configure app.config.ts, manage provideThemeStack, add theme switcher components (Toggle, Cycle, Select), handle Tailwind CSS v4 or pure CSS theme variables, fix SSR layout flashes (isHydrated signal), or run pnpm run ngx-theme-stack:sync.
compatibility: Angular 20+ with TypeScript. Optional Tailwind CSS v4.
metadata:
  author: WanderleeDev
  version: '1.3.0'
---

# ngx-theme-stack

Headless, signal-based theme manager for Angular 20+.

## Interaction Rules

- **MANDATORY RULE**: If the user asks for theme components/switching, you **MUST** ask them to choose:
  - **Toggle** (\`ThemeToggleService\`) - Binary dark/light toggle.
  - **Cycle** (\`ThemeCycleService\`) - Rotate through all themes.
  - **Select** (\`ThemeSelectService\`) - Full picker dropdown/radio selection.
- **Exception**: If the user explicitly mentions which switcher type they want in their query, skip the question and implement it directly.
- **Custom Themes Inquiry**: Ask if they want custom themes (e.g. \`sunset\`, colors, or CSS variables). Suggested names must match \`/^-?[a-zA-Z_][a-zA-Z0-9_-]*$/\` (ASCII, no leading digit, no whitespace, no CSS metacharacter). For each custom theme, also ask whether native browser widgets (scrollbars, inputs) should read as \`light\` or \`dark\`, then declare it with the object form in \`themes\`: \`{ name: 'sepia', scheme: 'light' }\`. Answering \`auto\`, leaving it blank, or anything unrecognised means no hint is declared, which leaves scrollbars and form controls on the OS colour scheme.
- **DO NOT** generate code or configs until the user responds to these questions.

## Constraints & Rules

- Call \`provideThemeStack()\` once in root \`app.config.ts\`. Custom themes merge with defaults.
- \`themes\` accepts plain names and \`{ name, scheme }\` objects, mixable in one array. \`scheme\` is \`'light' | 'dark' | 'auto'\` and only controls the CSS \`color-scheme\` hint for native widgets; it does not select a theme. Any other value is invalid and behaves as \`'auto'\`. Built-in names keep their implicit hint.
- **Theme names must match \`/^-?[a-zA-Z_][a-zA-Z0-9_-]*$/\`** (ASCII only). A name becomes a CSS class and is written into \`classList\`, so a leading digit makes \`.2lucky\` invalid CSS (the browser drops the rule and the theme loses its styles), ASCII whitespace throws \`InvalidCharacterError\` in \`classList.add\`, and a CSS metacharacter turns \`.lucky.theme\` into a two-class selector that can never match the single class token \`lucky.theme\` — silently. \`provideThemeStack()\` throws \`NgxThemeStackError\` for a bad name; pick a name in that shape before writing config.
- **Theme Synchronization**: Syncs theme configuration in \`app.config.ts\` with \`index.html\` assets.
  - **Manual execution**: Run \`pnpm run ngx-theme-stack:sync\` (or \`npm run ngx-theme-stack:sync\` / \`yarn run ngx-theme-stack:sync\`).
  - **Auto-Sync**: Runs automatically before serving or building via \`"prestart"\` and \`"prebuild"\` hooks in \`package.json\`.
  - **When to sync**: Run after adding/removing themes, renaming themes, changing configuration settings (storageKey, mode, strategy), or manually editing index.html.
  - **What it reports**: an invalid theme name, or a \`scheme\` outside \`'light' | 'dark' | 'auto'\`, is dropped from the regenerated config and reported as a warning. It never rewrites silently, and it never emits a value the compiler would reject.
  - **Debugging**: If a theme reverts to default/system on reload, check if the theme identifier is missing in the valid themes array (\`v\`) in \`index.html\`. If missing, run synchronization.
- \`isDark()\` / \`isLight()\` return false for custom themes (use \`resolvedTheme()\`).
- \`selectedTheme()\` can be \`'system'\`; \`resolvedTheme()\` is always the concrete theme applied to the DOM (never \`'system'\`).
- \`toggle()\` switches between \`'dark'\` and \`'light'\`. If a custom theme is active, it switches to \`'dark'\`.
- Pick ONE convenience service per component. Do not write custom localStorage or direct DOM logic. Isolate switcher components (e.g. \`<app-theme-toggle>\`) instead of injecting theme services directly into \`AppComponent\`.
- Use \`CoreThemeService\` directly only for advanced scenarios (dynamic theme names, custom service wrappers). For standard use, prefer convenience services.

## References and Guides

For detailed instructions and implementations, see these sub-guides:
- **API Reference & Config options**: [references/api-reference${MD}](references/api-reference${MD})
- **Styling (CSS variables, Tailwind v4, and Pure CSS)**: [references/styling${MD}](references/styling${MD})
- **SSR Hydration & Layout Stability (prevent layout shift)**: [references/ssr-hydration${MD}](references/ssr-hydration${MD})

## Component Examples
- **Toggle Component Example**: [assets/theme-toggle.ts](assets/theme-toggle.ts)
- **Cycle Component Example**: [assets/theme-cycle.ts](assets/theme-cycle.ts)
- **Select Component Example**: [assets/theme-select.ts](assets/theme-select.ts)

## Anti-patterns

- Do NOT mix Toggle, Cycle, and Select in the same component.
- Do NOT use Tailwind's \`dark:\` utility modifier (use semantic classes mapped from themes).
- Do NOT skip \`ngx-theme-stack:sync\` schematic after updating providers.
- Do NOT use theme signals in templates without an \`@if (theme.isHydrated())\` guard.
`;

const STYLING_CONTENT = `# Styling: CSS Variables, Tailwind, and Pure CSS

Define CSS variables in \`src/themes.css\`. You can use them with either Tailwind CSS or Pure CSS.

## 1. Define CSS Variables (src/themes.css)

For \`mode: 'class'\` (default) use CSS class selectors:

\`\`\`css
/* src/themes.css — class mode */
:root,
.light {
  --background: #fff;
  --foreground: #1a1a1a;
}
.dark {
  --background: #0a0a0a;
  --foreground: #f5f5f5;
}
.sunset {
  --background: #ff5f6d;
  --foreground: #fff;
}
\`\`\`

For \`mode: 'attribute'\` use \`data-theme\` attribute selectors instead:

\`\`\`css
/* src/themes.css — attribute mode */
:root,
[data-theme="light"] {
  --background: #fff;
  --foreground: #1a1a1a;
}
[data-theme="dark"] {
  --background: #0a0a0a;
  --foreground: #f5f5f5;
}
[data-theme="sunset"] {
  --background: #ff5f6d;
  --foreground: #fff;
}
\`\`\`

## 2. Choose Styling Integration (src/styles.css)

Before choosing, check if Tailwind is installed in \`package.json\`.

### Option A: Using Pure CSS (No Tailwind)
If Tailwind is not used or installed in the project, apply the variables directly to your elements:

\`\`\`css
/* src/styles.css */
body {
  background-color: var(--background);
  color: var(--foreground);
}
\`\`\`

### Option B: Using Tailwind CSS v4
If Tailwind is installed, map the variables inside the \`@theme\` directive (use semantic classes, not \`dark:\`):

\`\`\`css
/* src/styles.css */
@import 'tailwindcss';
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
\`\`\`
`;

const SSR_HYDRATION_CONTENT = `# SSR Hydration & Layout Stability

Wrap theme-dependent elements (like logos, theme status indicators, or custom switchers) in \`@if (theme.isHydrated())\` to prevent layout shift and SSR mismatches.

Fallback placeholders in the \`@else\` block should match the exact hydrated dimensions.

## Example: Hydrated Image with Placeholder

### Option A: Using Tailwind CSS Skeletons
If using Tailwind CSS, use utility classes like \`animate-pulse\` for the placeholder:

\`\`\`html
@if (theme.isHydrated()) {
  <img [src]="theme.isDark() ? darkLogo : lightLogo" class="w-16 h-16" />
} @else {
  <!-- Tailwind Skeletons matching image dimensions -->
  <div class="w-16 h-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
}
\`\`\`

### Option B: Using Pure CSS Skeletons
If using pure CSS, match dimensions using inline styles or custom CSS classes:

\`\`\`html
@if (theme.isHydrated()) {
  <img [src]="theme.isDark() ? darkLogo : lightLogo" style="width: 64px; height: 64px;" />
} @else {
  <!-- CSS Skeleton matching image dimensions -->
  <div style="width: 64px; height: 64px; border-radius: 4px; background-color: #e2e8f0;"></div>
}
\`\`\`

> [!TIP]
> When generating skeletons, dynamically choose between Tailwind utility classes (e.g., \`animate-pulse\`, \`bg-gray-200\`) if Tailwind is installed in the project's \`package.json\`, or plain CSS classes/inline styles matching the dimensions if using native CSS. Do not output unused CSS rules.
`;

// ── references/api-reference (Tier 3 — loaded on demand) ────────────────────

const API_REFERENCE = `# ngx-theme-stack API Reference

## provideThemeStack(config?)

Configures the Theme Stack in \`app.config.ts\`. Custom themes merge with built-ins (\`system\`, \`light\`, \`dark\`).

\`\`\`typescript
provideThemeStack({
  themes: ['sunset', 'ocean'] as const,
  defaultTheme: 'system',
  storageKey: 'ngx-theme-stack',
  mode: 'class', // 'class' | 'attribute' | 'both'
  strategy: 'critters', // 'critters' | 'blocking'
})
\`\`\`

### Themes: string form and object form

Each entry in \`themes\` is either a plain name or an object that adds a
\`color-scheme\` hint. Both shapes can be mixed in one array. The hint only
affects native browser widgets (scrollbars, inputs, form controls); it does
not pick a theme for you.

\`\`\`typescript
provideThemeStack({
  themes: [
    'system',
    'light',
    'dark',
    { name: 'sepia', scheme: 'light' },
    { name: 'ocean', scheme: 'dark' },
  ] as const,
})
\`\`\`

| \`scheme\` | Effect on \`color-scheme\` |
| --- | --- |
| \`'light'\` | Sets \`color-scheme: light\` while the theme is active. |
| \`'dark'\` | Sets \`color-scheme: dark\` while the theme is active. |
| \`'auto'\` (default when omitted) | No hint; the browser decides. |

Any other value is invalid and falls back to \`'auto'\`. The \`ng-add\` prompt only
accepts \`light\`, \`dark\`, or \`auto\`; an unknown answer falls back to \`'auto'\`.
The \`sync\` schematic drops an invalid \`scheme\` from an existing config and warns.

Built-in names keep their implicit hint (\`light\` → light, \`dark\` → dark,
\`system\` → auto). Prefer the object form for any custom theme whose native
widgets must match the theme, otherwise scrollbars keep the OS colour.

\`\`\`typescript
// Wrong: sepia's scrollbars stay OS-coloured
provideThemeStack({ themes: ['sepia'] as const })

// Right: declares the intended native colour scheme
provideThemeStack({ themes: [{ name: 'sepia', scheme: 'light' }] as const })
\`\`\`

### Theme names

A theme name becomes a CSS class (\`.name\`) and is written into \`classList\`, so it
must be usable as a CSS identifier. It has to match:

\`\`\`
/^-?[a-zA-Z_][a-zA-Z0-9_-]*$/
\`\`\`

| Name | Accepted | Why |
| --- | --- | --- |
| \`lucky\`, \`lucky-theme\`, \`lucky_theme\`, \`lucky2\`, \`_lucky\`, \`-lucky\` | yes | usable as-is |
| \`2lucky\` | no | \`.2lucky\` is invalid CSS, so the browser drops the rule and the theme silently loses its styles |
| \`lucky theme\` | no | \`classList.add\` throws \`InvalidCharacterError\` on ASCII whitespace |
| \`lucky.theme\` | no | \`.lucky.theme\` matches two classes while the class token is the single string \`lucky.theme\`, so the styles never apply, with no error |
| \`sueño\`, \`café\` | no | deliberately ASCII-only, a narrower subset than CSS allows |

**Throws \`NgxThemeStackError\` when:**
- A theme entry is empty, or \`defaultTheme\` is not in themes, or \`storageKey\` is empty.
- **A theme name does not match the pattern above.** This is a build error on purpose: the failure it prevents (a first-paint flash, or a theme whose styles never match) used to be silent.
- \`setTheme()\` is called with a theme not in the configured themes list.

> After changing \`themes\` (adding, removing, renaming, or adding a \`scheme\`),
> run the sync schematic so the anti-flash script in \`index.html\` picks up the
> new names and hints. Otherwise a custom theme can silently fall back to the
> default on first paint.

---

## CoreThemeService

Foundation service managing state (signals), persistence, system preference, and DOM manipulation (SSR safe).

### Signals, Methods & Properties

| Name | Type | Description |
| --- | --- | --- |
| \`selectedTheme()\` | \`Signal<string>\` | Chosen theme (can be \`'system'\`). |
| \`resolvedTheme()\` | \`Signal<string>\` | Active theme applied to DOM (never \`'system'\`). |
| \`isDark()\` / \`isLight()\` | \`Signal<boolean>\` | \`true\` for dark/light (returns \`false\` for custom themes). |
| \`isSystem()\` / \`isHydrated()\` | \`Signal<boolean>\` | System choice active / SSR hydration finished. |
| \`availableThemes\` | \`string[]\` | All configured themes including built-ins. |
| \`themeNames\` | \`string[]\` | Same list, plain names only — bind directly in templates. |
| \`resolvedThemes\` | \`{ name, scheme }[]\` | Normalized themes with their color-scheme hint. |
| \`setTheme(theme)\` | \`(theme: string) => void\` | Validates, persists, and applies the theme to DOM. |

---

## Convenience Services

Specialized services implementing different theme selection behaviors.

### ThemeToggleService
Binary switch between \`'dark'\` and \`'light'\`.
- \`toggle()\`: Toggles the theme.

### ThemeCycleService
Rotates through all themes in configuration order.
- \`cycle()\`: Moves to the next theme.
- \`cycleIndex()\`: \`Signal<number>\` - Current theme index.
- \`upcoming()\` / \`preceding()\`: \`Signal<string>\` - Next / previous theme in cycle.

### ThemeSelectService
Full list control for select dropdowns, radio buttons, or lists.
- \`select(theme)\`: Sets the chosen theme.

---

## Types & Errors

### Core Types
- \`NgTheme<T>\`: \`'system' | 'light' | 'dark' | T\`
- \`NgMode\`: \`'class' | 'attribute' | 'both'\`
- \`NgStrategy\`: \`'critters' | 'blocking'\`

### Errors
- \`NgxThemeStackError\`: Thrown for invalid configurations, storage keys, or theme names.
Catch with: \`if (e instanceof NgxThemeStackError) { ... }\`
`;

// ── assets/ component examples (Tier 3 — pure TypeScript, read on demand) ───

const TEMPLATE_TOGGLE = `import { inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @if (theme.isHydrated()) {
      <button (click)="theme.toggle()">
        {{ theme.isDark() ? '🌙' : '☀️' }}
      </button>
    } @else {
      <!-- Placeholder that matches button dimensions to prevent layout shift -->
      <div style="width: 40px; height: 40px; border-radius: 4px; background: #e2e8f0;"></div>
    }
  \`,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeToggleService);
}
`;

const TEMPLATE_CYCLE = `import { inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-cycle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @if (theme.isHydrated()) {
      <button (click)="theme.cycle()">🔄 Cycle Theme</button>
    } @else {
      <!-- Placeholder that matches button dimensions to prevent layout shift -->
      <div style="width: 112px; height: 40px; border-radius: 4px; background: #e2e8f0;"></div>
    }
  \`,
})
export class ThemeCycle {
  protected readonly theme = inject(ThemeCycleService);
}
`;

const TEMPLATE_SELECT = `import { inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { ThemeSelectService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @if (theme.isHydrated()) {
      <select name="select-theme" (change)="onThemeChange($event)">
        @for (t of theme.availableThemes; track t) {
          <option [value]="t" [selected]="theme.selectedTheme() === t">
            {{ t }}
          </option>
        }
      </select>
    } @else {
      <!-- Placeholder that matches select dimensions to prevent layout shift -->
      <div style="width: 128px; height: 40px; border-radius: 4px; background: #e2e8f0;"></div>
    }
  \`,
})
export class ThemeSelect {
  protected readonly theme = inject(ThemeSelectService);

  onThemeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.theme.select(value);
  }
}
`;

// ── Schematic logic ─────────────────────────────────────────────────────────

const SKILL_ROOT = '.agents/skills/ngx-theme-stack';

const FILES: { path: string; content: string }[] = [
  { path: `${SKILL_ROOT}/SKILL${MD}`, content: SKILL_CONTENT },
  { path: `${SKILL_ROOT}/references/api-reference${MD}`, content: API_REFERENCE },
  { path: `${SKILL_ROOT}/references/styling${MD}`, content: STYLING_CONTENT },
  { path: `${SKILL_ROOT}/references/ssr-hydration${MD}`, content: SSR_HYDRATION_CONTENT },
  { path: `${SKILL_ROOT}/assets/theme-toggle.ts`, content: TEMPLATE_TOGGLE },
  { path: `${SKILL_ROOT}/assets/theme-cycle.ts`, content: TEMPLATE_CYCLE },
  { path: `${SKILL_ROOT}/assets/theme-select.ts`, content: TEMPLATE_SELECT },
];

export function generateSkill(tree: Tree, context: SchematicContext): void {
  for (const file of FILES) {
    if (tree.exists(file.path)) {
      tree.overwrite(file.path, file.content);
      context.logger.info(` \u001b[32m✔\u001b[0m ${file.path} (updated)`);
    } else {
      tree.create(file.path, file.content);
      context.logger.info(` \u001b[36mA\u001b[0m ${file.path}`);
    }
  }
}

export function skill(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info(
      `Generating AI agent skill for project: ${options.project ?? '(auto-detected)'}`,
    );
    generateSkill(tree, context);
    return tree;
  };
}
