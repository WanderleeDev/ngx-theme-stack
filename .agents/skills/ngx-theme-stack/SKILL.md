---
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
- `selectedTheme()` can be `'system'`; `resolvedTheme()` is always the concrete theme applied to the DOM (never `'system'`).
- `toggle()` switches between `'dark'` and `'light'`. If a custom theme is active, it switches to `'dark'`.
- Pick ONE convenience service per component. Do not write custom localStorage or direct DOM logic.
- Use `CoreThemeService` directly only for advanced scenarios (dynamic theme names, custom service wrappers). For standard use, prefer convenience services.

## SSR Hydration & Layout Stability

Wrap theme-dependent elements in `@if (theme.isHydrated())` to prevent layout shift and SSR mismatches. Fallback placeholders in `@else` must match the exact hydrated dimensions.

```html
@if (theme.isHydrated()) {
  <img [src]="theme.isDark() ? darkLogo : lightLogo" />
} @else {
  <!-- Implement a custom skeleton matching the hydrated element's exact dimensions -->
}
```

## Configuration & API

See [references/api-reference.md](references/api-reference.md) for full API docs. Examples: [Toggle](assets/theme-toggle.ts) · [Cycle](assets/theme-cycle.ts) · [Select](assets/theme-select.ts).

```typescript
import { provideThemeStack } from 'ngx-theme-stack';
export const appConfig = {
  providers: [provideThemeStack({ themes: ['sunset'] as const, strategy: 'critters' })],
};
```

All convenience services share these signals: `selectedTheme()`, `resolvedTheme()`, `isDark()`, `isLight()`, `isSystem()`, `isHydrated()`.

| Service              | Method      | Exclusive API                                                                 |
| -------------------- | ----------- | ----------------------------------------------------------------------------- |
| `ThemeToggleService` | `toggle()`  | —                                                                             |
| `ThemeCycleService`  | `cycle()`   | `cycleIndex()`, `upcoming()`, `preceding()`, `availableThemes`               |
| `ThemeSelectService` | `select(t)` | `availableThemes`                                                             |

## Styling: CSS Variables, Tailwind, and Pure CSS

Define CSS variables in `src/themes.css`. You can use them with either Tailwind CSS or Pure CSS.

### 1. Define CSS Variables (src/themes.css)

For `mode: 'class'` (default) use CSS class selectors:

```css
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
```

For `mode: 'attribute'` use `data-theme` attribute selectors instead:

```css
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
```

### 2. Choose Styling Integration (src/styles.css)

Before choosing, check if Tailwind is installed in `package.json`.

#### Option A: Using Pure CSS (No Tailwind)
If Tailwind is not used or installed in the project, apply the variables directly to your elements:

```css
/* src/styles.css */
body {
  background-color: var(--background);
  color: var(--foreground);
}
```

#### Option B: Using Tailwind CSS v4
If Tailwind is installed, map the variables inside the `@theme` directive (use semantic classes, not `dark:`):

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
