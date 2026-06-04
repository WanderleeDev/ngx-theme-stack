---
name: ngx-theme-stack
description: Signal-based theme manager for Angular 20+. Covers setup, services, SSR guards, and Tailwind v4.
compatibility: Angular 20+ with TypeScript. Optional Tailwind CSS v4.
metadata:
  author: WanderleeDev
  version: '1.1.0'
---

# ngx-theme-stack

Headless, signal-based theme manager for Angular 20+.

## Interaction Rules

- **MANDATORY RULE**: If the user asks for theme components/switching, you **MUST** ask them to choose:
  - **Toggle** (`ThemeToggleService`) - Binary dark/light toggle.
  - **Cycle** (`ThemeCycleService`) - Rotate through all themes.
  - **Select** (`ThemeSelectService`) - Full picker dropdown/radio selection.
- **Custom Themes Inquiry**: Ask if they want custom themes (e.g. `sunset`, colors, or CSS variables).
- **DO NOT** generate code or configs until the user responds to these questions.

## Constraints & Rules

- Call `provideThemeStack()` once in root `app.config.ts`. Custom themes merge with defaults.
- **Theme Synchronization**: Syncs theme configuration in `app.config.ts` with `index.html` assets.
  - **Manual execution**: Run `<package-manager> run ngx-theme-stack:sync` (e.g., `npm run ngx-theme-stack:sync`).
  - **Auto-Sync**: Runs automatically before serving or building via `"prestart"` and `"prebuild"` hooks in `package.json`.
  - **When to sync**: Run after adding/removing themes, renaming themes, changing configuration settings (storageKey, mode, strategy), or manually editing index.html.
  - **Debugging**: If a theme reverts to default/system on reload, check if the theme identifier is missing in the valid themes array (`v`) in `index.html`. If missing, run synchronization.
- `isDark()` / `isLight()` return false for custom themes (use `resolvedTheme()`).
- Pick ONE convenience service per component. Do not write custom localStorage or direct DOM logic.

## SSR Hydration & Layout Stability

Wrap theme-dependent elements in `@if (theme.isHydrated())` to prevent layout shift and SSR mismatches. Fallback placeholders in `@else` must match the exact hydrated dimensions.

```html
@if (theme.isHydrated()) {
<img [src]="theme.isDark() ? darkLogo : lightLogo" />
} @else {
<div class="logo-skeleton"></div>
}
```

## Configuration & API

See [references/api-reference.md](references/api-reference.md) for APIs. Examples: [Toggle](assets/theme-toggle.ts) · [Cycle](assets/theme-cycle.ts) · [Select](assets/theme-select.ts).

```typescript
import { provideThemeStack } from 'ngx-theme-stack';
export const appConfig = {
  providers: [provideThemeStack({ themes: ['sunset'] as const, strategy: 'critters' })],
};
```

| Service              | Method      | Signals                                                                                     |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `ThemeToggleService` | `toggle()`  | `selectedTheme()`, `resolvedTheme()`, `isDark()`, `isLight()`, `isSystem()`, `isHydrated()` |
| `ThemeCycleService`  | `cycle()`   |                                                                                             |
| `ThemeSelectService` | `select(t)` |                                                                                             |

## Styling: CSS Variables & Tailwind Separation

Define CSS variables in `src/themes.css` and map them to Tailwind in `src/styles.css` (use semantic classes, not `dark:`):

```css
/* src/themes.css */
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
```

```css
/* src/styles.css */
@import 'tailwindcss';
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

## Anti-patterns

- Do NOT mix Toggle, Cycle, and Select in the same component.
- Do NOT use Tailwind's `dark:` utility modifier (use semantic classes mapped from themes).
- Do NOT skip `ngx-theme-stack:sync` schematic after updating providers.
- Do NOT use theme signals in templates without an `@if (theme.isHydrated())` guard.
