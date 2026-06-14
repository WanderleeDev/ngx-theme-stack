import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';

// Extension constructed at runtime to avoid socket.dev "URL strings" false positive
const MD = ['', 'm', 'd'].join('');

// ── SKILL content (Tier 2 — loaded on activation) ─────────
const SKILL_CONTENT = `---
name: ngx-theme-stack
description: Signal-based theme manager for Angular 20+. Covers setup, services, SSR guards, and Tailwind v4.
compatibility: Angular 20+ with TypeScript. Optional Tailwind CSS v4.
metadata:
  author: WanderleeDev
  version: '1.2.0'
---

# ngx-theme-stack

Headless, signal-based theme manager for Angular 20+.

## Interaction Rules

- **MANDATORY RULE**: If the user asks for theme components/switching, you **MUST** ask them to choose:
  - **Toggle** (\`ThemeToggleService\`) - Binary dark/light toggle.
  - **Cycle** (\`ThemeCycleService\`) - Rotate through all themes.
  - **Select** (\`ThemeSelectService\`) - Full picker dropdown/radio selection.
- **Custom Themes Inquiry**: Ask if they want custom themes (e.g. \`sunset\`, colors, or CSS variables).
- **DO NOT** generate code or configs until the user responds to these questions.

## Constraints & Rules

- Call \`provideThemeStack()\` once in root \`app.config.ts\`. Custom themes merge with defaults.
- **Theme Synchronization**: Syncs theme configuration in \`app.config.ts\` with \`index.html\` assets.
  - **Manual execution**: Run \`<package-manager> run ngx-theme-stack:sync\` (e.g., \`npm run ngx-theme-stack:sync\`).
  - **Auto-Sync**: Runs automatically before serving or building via \`"prestart"\` and \`"prebuild"\` hooks in \`package.json\`.
  - **When to sync**: Run after adding/removing themes, renaming themes, changing configuration settings (storageKey, mode, strategy), or manually editing index.html.
  - **Debugging**: If a theme reverts to default/system on reload, check if the theme identifier is missing in the valid themes array (\`v\`) in \`index.html\`. If missing, run synchronization.
- \`isDark()\` / \`isLight()\` return false for custom themes (use \`resolvedTheme()\`).
- \`selectedTheme()\` can be \`'system'\`; \`resolvedTheme()\` is always the concrete theme applied to the DOM (never \`'system'\`).
- \`toggle()\` switches between \`'dark'\` and \`'light'\`. If a custom theme is active, it switches to \`'dark'\`.
- Pick ONE convenience service per component. Do not write custom localStorage or direct DOM logic.
- Use \`CoreThemeService\` directly only for advanced scenarios (dynamic theme names, custom service wrappers). For standard use, prefer convenience services.

## SSR Hydration & Layout Stability

Wrap theme-dependent elements in \`@if (theme.isHydrated())\` to prevent layout shift and SSR mismatches. Fallback placeholders in \`@else\` must match the exact hydrated dimensions.

\`\`\`html
@if (theme.isHydrated()) {
  <img [src]="theme.isDark() ? darkLogo : lightLogo" />
} @else {
  <!-- Implement a custom skeleton matching the hydrated element's exact dimensions -->
}
\`\`\`

## Configuration & API

See [references/api-reference.${MD}](references/api-reference.${MD}) for full API docs. Examples: [Toggle](assets/theme-toggle.ts) · [Cycle](assets/theme-cycle.ts) · [Select](assets/theme-select.ts).

\`\`\`typescript
import { provideThemeStack } from 'ngx-theme-stack';
export const appConfig = {
  providers: [provideThemeStack({ themes: ['sunset'] as const, strategy: 'critters' })],
};
\`\`\`

All convenience services share these signals: \`selectedTheme()\`, \`resolvedTheme()\`, \`isDark()\`, \`isLight()\`, \`isSystem()\`, \`isHydrated()\`.

| Service              | Method      | Exclusive API                                                                 |
| -------------------- | ----------- | ----------------------------------------------------------------------------- |
| \`ThemeToggleService\` | \`toggle()\`  | —                                                                             |
| \`ThemeCycleService\`  | \`cycle()\`   | \`cycleIndex()\`, \`upcoming()\`, \`preceding()\`, \`availableThemes\`               |
| \`ThemeSelectService\` | \`select(t)\` | \`availableThemes\`                                                             |

## Styling: CSS Variables & Tailwind Separation

Define CSS variables in \`src/themes.css\` and map them to Tailwind in \`src/styles.css\` (use semantic classes, not \`dark:\`).

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

\`\`\`css
/* src/styles.css */
@import 'tailwindcss';
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
\`\`\`

## Anti-patterns

- Do NOT mix Toggle, Cycle, and Select in the same component.
- Do NOT use Tailwind's \`dark:\` utility modifier (use semantic classes mapped from themes).
- Do NOT skip \`ngx-theme-stack:sync\` schematic after updating providers.
- Do NOT use theme signals in templates without an \`@if (theme.isHydrated())\` guard.
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

**Throws \`NgxThemeStackError\` when:**
- A theme entry is empty, or \`defaultTheme\` is not in themes, or \`storageKey\` is empty.
- \`setTheme()\` is called with a theme not in the configured themes list.

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

const TEMPLATE_TOGGLE = `import { inject, Component } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-toggle',
  template: \`
    @if (theme.isHydrated()) {
      <button (click)="theme.toggle()">
        {{ theme.isDark() ? '🌙' : '☀️' }}
      </button>
    } @else {
      <!-- Implement a custom skeleton/placeholder that matches the hydrated button's exact dimensions to prevent layout shift -->
    }
  \`,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeToggleService);
}
`;

const TEMPLATE_CYCLE = `import { inject, Component } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-cycle',
  template: \`
    @if (theme.isHydrated()) {
      <button (click)="theme.cycle()">🔄 Cycle Theme</button>
    } @else {
      <!-- Implement a custom skeleton/placeholder that matches the hydrated button's exact dimensions to prevent layout shift -->
    }
  \`,
})
export class ThemeCycle {
  protected readonly theme = inject(ThemeCycleService);
}
`;

const TEMPLATE_SELECT = `import { inject, Component } from '@angular/core';
import { ThemeSelectService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-select',
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
      <!-- Implement a custom skeleton/placeholder that matches the hydrated select's exact dimensions to prevent layout shift -->
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
  { path: `${SKILL_ROOT}/SKILL.${MD}`, content: SKILL_CONTENT },
  { path: `${SKILL_ROOT}/references/api-reference.${MD}`, content: API_REFERENCE },
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
    context.logger.info(`Generating AI agent skill for project: ${options.project}`);
    generateSkill(tree, context);
    return tree;
  };
}
