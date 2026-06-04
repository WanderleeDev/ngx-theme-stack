import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';

// ── SKILL.md (Tier 2 — loaded on activation) ────────────────────────────────

const SKILL_CONTENT = `---
name: ngx-theme-stack
description: >-
  Use when installing, configuring, or building theme-switching UI with
  ngx-theme-stack in Angular 20+. Covers provideThemeStack setup,
  ThemeToggle/Cycle/Select services, SSR hydration guards, CSS variable
  theming, and Tailwind CSS v4 integration. Do not use for generic Angular
  styling, standalone dark-mode CSS, or projects not using ngx-theme-stack.
compatibility: Angular 20+ with TypeScript. Optional Tailwind CSS v4.
metadata:
  author: WanderleeDev
  version: "1.0.0"
---

# ngx-theme-stack

A headless, signal-based theme manager for Angular 20+.
Supports dark/light/system/custom themes, SSR, and zero-flash rendering.

## Architecture

\`\`\`
provideThemeStack()          ← DI configuration (app.config.ts)
       │
  CoreThemeService           ← Foundation: state, persistence, DOM updates
       │
  ┌────┼────────────┐
  │    │             │
Toggle  Cycle     Select     ← Convenience services (pick ONE per component)
\`\`\`

## Interaction Rules

> [!IMPORTANT]
> **MANDATORY INTERACTION RULE**: If the user asks to implement theme switching, configuration, or a theme-related component but does NOT explicitly specify which convenience service to use (\`ThemeToggleService\`, \`ThemeCycleService\`, or \`ThemeSelectService\`), you **MUST NOT** make assumptions or start writing code.
> You **MUST** stop and ask the user to explicitly choose one of the three patterns before proceeding.
>
> Present these options clearly:
> 1. **Toggle** (\`ThemeToggleService\`) — Binary toggle between dark and light themes (best for simple buttons or icon toggles).
> 2. **Cycle** (\`ThemeCycleService\`) — Rotates through all configured themes (best for 3+ themes with a single button).
> 3. **Select** (\`ThemeSelectService\`) — Full dropdown/radio list of all available themes (best for settings pages or explicit pickers).
>
> **Custom Themes Inquiry**: In addition to the service choice, you **MUST** ask the user if they want to configure or need any **custom themes** (e.g. \`sunset\`, \`ocean\`, \`sepia\`) beyond the default \`light\`, \`dark\`, and \`system\`. Prompt the user for details on what they are looking for or need (such as specific custom theme names, colors, or CSS variables) to help them scaffold these customizations.
>
> **DO NOT** generate any component code or configurations until the user has explicitly responded to these questions.

## Constraints

- Always import from \`'ngx-theme-stack'\` — never deep-import internal paths.
- Call \`provideThemeStack()\` exactly once, in the root \`app.config.ts\` providers.
- Custom themes are **merged** with built-ins. Passing \`['sepia']\` resolves to \`['system', 'light', 'dark', 'sepia']\`.
- **Mandatory Theme Synchronization**: After configuring, adding, or modifying themes in \`provideThemeStack()\`, you **MUST** run the synchronization schematic command: \`ng generate ngx-theme-stack:sync --project PROJECT_NAME\` (or explicitly instruct the user to run it if you cannot execute commands). Failing to synchronize themes after modification is a critical violation that breaks theme compilation.
- \`isDark()\` and \`isLight()\` return \`false\` for custom themes — use \`resolvedTheme()\` directly.
- **Mandatory SSR Guard**: You MUST guard all theme-dependent template elements (e.g. text, icons, images, styling classes based on theme signals) using \`@if (theme.isHydrated())\`. Using theme signals (\`isDark()\`, \`resolvedTheme()\`, etc.) directly in templates without checking \`isHydrated()\` causes content flickering and critical Angular hydration mismatch errors in SSR.
- Never call \`setTheme()\` with a theme name not registered in the \`themes\` array — it throws \`NgxThemeStackError\`.
- Pick ONE convenience service per component — do not mix Toggle, Cycle, and Select in the same component.

## Installation

\`\`\`bash
ng add ngx-theme-stack
\`\`\`

For Bun environments (where \`ng add\` is unsupported):
\`\`\`bash
bun add ngx-theme-stack
ng generate ngx-theme-stack:ng-add
\`\`\`

## Configuration

Configure in \`app.config.ts\` via \`provideThemeStack()\`:

\`\`\`typescript
import { provideThemeStack } from 'ngx-theme-stack';

export const appConfig: ApplicationConfig = {
  providers: [
    provideThemeStack({
      themes: ['sunset', 'ocean'] as const,
      defaultTheme: 'system',
      mode: 'class',
      strategy: 'critters',
      storageKey: 'ngx-theme-stack',
    }),
  ],
};
\`\`\`

| Option         | Type       | Default                       | Description                  |
| -------------- | ---------- | ----------------------------- | ---------------------------- |
| \`themes\`       | \`string[]\` | \`['light', 'dark', 'system']\` | Merged with built-ins        |
| \`defaultTheme\` | \`string\`   | \`'system'\`                    | Theme on first visit         |
| \`mode\`         | \`NgMode\`   | \`'class'\`                     | How the theme is applied     |
| \`strategy\`     | \`NgStrategy\`| \`'critters'\`                  | Anti-flash strategy          |
| \`storageKey\`   | \`string\`   | \`'ngx-theme-stack'\`           | localStorage persistence key |

## Services Quick Reference

| Service              | Method       | Use case                          |
| -------------------- | ------------ | --------------------------------- |
| \`ThemeToggleService\` | \`toggle()\`   | Binary dark/light switch          |
| \`ThemeCycleService\`  | \`cycle()\`    | Rotate through all themes         |
| \`ThemeSelectService\` | \`select(t)\`  | Dropdown / radio / tab selection  |
| \`CoreThemeService\`   | \`setTheme(t)\`| Advanced / low-level access       |

All services expose these signals: \`selectedTheme()\`, \`resolvedTheme()\`, \`isDark()\`, \`isLight()\`, \`isSystem()\`, \`isHydrated()\`.

Ver [ejemplo Toggle](assets/theme-toggle.ts) · [ejemplo Cycle](assets/theme-cycle.ts) · [ejemplo Select](assets/theme-select.ts)

For full API details, read [references/api-reference.md](references/api-reference.md).

## SSR Hydration Guard & Layout Stability

Guard theme-dependent template content behind \`isHydrated()\` in SSR to prevent hydration mismatches and layout flickering.

\`\`\`html
@if (theme.isHydrated()) {
  <img [src]="theme.isDark() ? darkLogo : lightLogo">
} @else {
  <!-- The placeholder/skeleton MUST match the exact size and spacing of the hydrated image -->
  <div class="logo-skeleton" style="width: 150px; height: 40px; display: inline-block;"></div>
}
\`\`\`

### Skeleton & Layout Stability Guidelines

When designing fallback skeleton loaders/placeholders:
1. **Dimension & Spacing Match**: The fallback element (e.g., inside the \`@else\` block) MUST occupy the exact same space, size, margins, padding, positioning, and responsive constraints as the hydrated element. This ensures zero layout shift (preventing CLS issues) and keeps the Largest Contentful Paint (LCP) optimized.
2. **Granular Skeletons**: NEVER wrap an entire complex component or large layout block in an \`isHydrated()\` guard if only a single word, label, icon, or sub-element changes dynamically based on the theme. Instead, place the \`isHydrated()\` guard at the most granular level possible (e.g., directly wrapping just the dynamic text or icon inside the button), leaving the surrounding button wrapper and layout static. A full-element skeleton should only be used if the entire component's structure/layout is completely dynamic.

## CSS Theme Tokens

Define in \`src/themes.css\` (scaffolded by \`ng add\`):

\`\`\`css
:root, .light { --bg: #fff; --text: #1a1a1a; }
.dark          { --bg: #0a0a0a; --text: #f5f5f5; }
.sunset        { --bg: #ff5f6d; --text: #fff; }
\`\`\`

## Tailwind CSS v4

Map variables in \`src/styles.css\`:

\`\`\`css
@import 'tailwindcss';
@theme {
  --color-bg: var(--bg);
  --color-text: var(--text);
}
\`\`\`

Use semantic classes — no \`dark:\` prefix needed: \`bg-bg text-text\`.

## Anti-patterns

- Do NOT create your own localStorage logic — the library handles persistence.
- Do NOT use multiple convenience services in the same component.
- Do NOT access \`document.documentElement\` directly — the library handles DOM.
- Do NOT use Tailwind's \`dark:\` prefix for multi-theme support.
- Do NOT skip \`ngx-theme-stack:sync\` after changing \`provideThemeStack()\` config.
`;

// ── references/api-reference.md (Tier 3 — loaded on demand) ─────────────────

const API_REFERENCE = `# ngx-theme-stack API Reference

## provideThemeStack(config?)

Provides Theme Stack configuration to Angular's DI system.

\`\`\`typescript
provideThemeStack({
  themes: ['sunset', 'ocean'] as const,
  defaultTheme: 'system',
  storageKey: 'ngx-theme-stack',
  mode: 'class',
  strategy: 'critters',
})
\`\`\`

Custom themes are **merged** with built-in defaults (\`'system'\`, \`'light'\`, \`'dark'\`).
Passing \`['sepia', 'ocean']\` resolves to \`['system', 'light', 'dark', 'sepia', 'ocean']\`.

### Throws \`NgxThemeStackError\` when:
- A theme entry is empty or whitespace-only.
- \`defaultTheme\` is not in the resolved themes array.
- \`storageKey\` is empty or whitespace-only.

---

## CoreThemeService

Foundation service. Manages state (signals), persistence (localStorage),
system preference detection (matchMedia), and safe DOM manipulation (SSR compatible).

### Signals

| Signal             | Type                | Description                                         |
| ------------------ | ------------------- | --------------------------------------------------- |
| \`selectedTheme()\`  | \`Signal<string>\`    | Theme chosen by the user. May be \`'system'\`.         |
| \`resolvedTheme()\`  | \`Signal<string>\`    | Theme applied to DOM. Never \`'system'\`.              |
| \`isDark()\`          | \`Signal<boolean>\`   | \`true\` when resolved is \`'dark'\`. \`false\` for custom. |
| \`isLight()\`         | \`Signal<boolean>\`   | \`true\` when resolved is \`'light'\`. \`false\` for custom.|
| \`isSystem()\`        | \`Signal<boolean>\`   | \`true\` when user selected \`'system'\`.                |
| \`isHydrated()\`      | \`Signal<boolean>\`   | \`true\` after first browser render. Guard SSR content.|

### Methods

| Method            | Signature              | Description                              |
| ----------------- | ---------------------- | ---------------------------------------- |
| \`setTheme()\`      | \`(theme: string): void\`| Validates, applies to DOM, persists.     |

### Properties

| Property          | Type        | Description                               |
| ----------------- | ----------- | ----------------------------------------- |
| \`availableThemes\` | \`string[]\`  | Resolved list including built-ins.        |

---

## ThemeToggleService

Binary switch between \`'dark'\` and \`'light'\`.

### Signals
Inherits: \`selectedTheme()\`, \`resolvedTheme()\`, \`isDark()\`, \`isLight()\`, \`isSystem()\`, \`isHydrated()\`.

### Methods

| Method     | Description                                    |
| ---------- | ---------------------------------------------- |
| \`toggle()\` | If resolved is dark → light. Otherwise → dark. |

---

## ThemeCycleService

Rotates through all configured themes in order.

### Signals
Inherits all from CoreThemeService, plus:

| Signal         | Type              | Description                             |
| -------------- | ----------------- | --------------------------------------- |
| \`cycleIndex()\` | \`Signal<number>\`  | Index of current theme in the cycle.    |
| \`upcoming()\`   | \`Signal<string>\`  | Next theme in the cycle.                |
| \`preceding()\`  | \`Signal<string>\`  | Previous theme in the cycle.            |

### Methods

| Method    | Description                  |
| --------- | ---------------------------- |
| \`cycle()\` | Advances to the next theme.  |

### Properties

| Property          | Type        | Description                        |
| ----------------- | ----------- | ---------------------------------- |
| \`availableThemes\` | \`string[]\`  | Full list of themes in cycle order.|

---

## ThemeSelectService

Exposes the full theme list for dropdowns, radios, or tab selection.

### Signals
Inherits: \`selectedTheme()\`, \`resolvedTheme()\`, \`isDark()\`, \`isLight()\`, \`isSystem()\`, \`isHydrated()\`.

### Methods

| Method            | Signature              | Description                 |
| ----------------- | ---------------------- | --------------------------- |
| \`select()\`        | \`(theme: string): void\`| Applies the given theme.    |

### Properties

| Property          | Type        | Description                        |
| ----------------- | ----------- | ---------------------------------- |
| \`availableThemes\` | \`string[]\`  | Full list of configured themes.    |

---

## Types

| Type          | Definition                          | Description                       |
| ------------- | ----------------------------------- | --------------------------------- |
| \`NgTheme<T>\`  | \`'system' \\| 'light' \\| 'dark' \\| T\`| Theme identifier union            |
| \`NgSystemTheme\`| \`'light' \\| 'dark'\`                 | Resolved system theme             |
| \`NgMode\`       | \`'class' \\| 'attribute' \\| 'both'\`  | How theme is applied to DOM       |
| \`NgStrategy\`   | \`'critters' \\| 'blocking'\`          | Anti-flash rendering strategy     |
| \`NgConfig<T>\`  | \`interface\`                          | Full library configuration        |

## Errors

| Error                | When thrown                                               |
| -------------------- | --------------------------------------------------------- |
| \`NgxThemeStackError\` | Invalid config, invalid theme name in \`setTheme()\`, etc.  |

Catch with: \`if (e instanceof NgxThemeStackError) { ... }\`
`;

// ── assets/ component examples (Tier 3 — pure TypeScript, read on demand) ───

const TEMPLATE_TOGGLE =
`import { inject, Component } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-toggle',
  template: \`
    @if (theme.isHydrated()) {
      <button (click)="theme.toggle()">
        {{ theme.isDark() ? '🌙' : '☀️' }}
      </button>
    } @else {
      <div class="theme-toggle-skeleton"></div>
    }
  \`,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeToggleService);
}
`;

const TEMPLATE_CYCLE =
`import { inject, Component } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-cycle',
  template: \`
    @if (theme.isHydrated()) {
      <button (click)="theme.cycle()">🔄 Cycle Theme</button>
    } @else {
      <div class="theme-cycle-skeleton"></div>
    }
  \`,
})
export class ThemeCycle {
  protected readonly theme = inject(ThemeCycleService);
}
`;

const TEMPLATE_SELECT =
`import { inject, Component } from '@angular/core';
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
      <div class="theme-select-skeleton"></div>
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
  { path: `${SKILL_ROOT}/SKILL.md`, content: SKILL_CONTENT },
  { path: `${SKILL_ROOT}/references/api-reference.md`, content: API_REFERENCE },
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
