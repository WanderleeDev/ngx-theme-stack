---
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

```
provideThemeStack()          ← DI configuration (app.config.ts)
       │
  CoreThemeService           ← Foundation: state, persistence, DOM updates
       │
  ┌────┼────────────┐
  │    │             │
Toggle  Cycle     Select     ← Convenience services (pick ONE per component)
```

## Interaction Rules

When the user asks to implement theme switching but does NOT specify which
service pattern to use, you MUST ask them to choose before writing code.
Present these options clearly:

1. **Toggle** — A simple on/off switch between dark and light mode.
   Best for: apps with only two themes, toggle buttons, icon switches.
2. **Cycle** — A single button that rotates through all configured themes.
   Best for: apps with 3+ themes, minimal UI footprint, "next theme" buttons.
3. **Select** — A dropdown, radio group, or tab bar showing all theme options.
   Best for: settings pages, theme pickers, full visibility of all themes.

Only proceed after the user confirms their choice.

## Constraints

- Always import from `'ngx-theme-stack'` — never deep-import internal paths.
- Call `provideThemeStack()` exactly once, in the root `app.config.ts` providers.
- Custom themes are **merged** with built-ins. Passing `['sepia']` resolves to `['system', 'light', 'dark', 'sepia']`.
- After changing themes in `provideThemeStack()`, run: `ng generate ngx-theme-stack:sync --project PROJECT_NAME`.
- `isDark()` and `isLight()` return `false` for custom themes — use `resolvedTheme()` directly.
- Guard theme-dependent template content behind `isHydrated()` in SSR to prevent hydration mismatches.
- Never call `setTheme()` with a theme name not registered in the `themes` array — it throws `NgxThemeStackError`.
- Pick ONE convenience service per component — do not mix Toggle, Cycle, and Select in the same component.

## Installation

```bash
ng add ngx-theme-stack
```

For Bun environments (where `ng add` is unsupported):
```bash
bun add ngx-theme-stack
ng generate ngx-theme-stack:ng-add
```

## Configuration

Configure in `app.config.ts` via `provideThemeStack()`:

```typescript
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
```

| Option         | Type       | Default                       | Description                  |
| -------------- | ---------- | ----------------------------- | ---------------------------- |
| `themes`       | `string[]` | `['light', 'dark', 'system']` | Merged with built-ins        |
| `defaultTheme` | `string`   | `'system'`                    | Theme on first visit         |
| `mode`         | `NgMode`   | `'class'`                     | How the theme is applied     |
| `strategy`     | `NgStrategy`| `'critters'`                  | Anti-flash strategy          |
| `storageKey`   | `string`   | `'ngx-theme-stack'`           | localStorage persistence key |

## Services Quick Reference

| Service              | Method       | Use case                          |
| -------------------- | ------------ | --------------------------------- |
| `ThemeToggleService` | `toggle()`   | Binary dark/light switch          |
| `ThemeCycleService`  | `cycle()`    | Rotate through all themes         |
| `ThemeSelectService` | `select(t)`  | Dropdown / radio / tab selection  |
| `CoreThemeService`   | `setTheme(t)`| Advanced / low-level access       |

All services expose these signals: `selectedTheme()`, `resolvedTheme()`, `isDark()`, `isLight()`, `isSystem()`, `isHydrated()`.

For complete component templates, copy from `assets/` directory in this skill folder.
For full API details, read `references/api-reference.md`.

## SSR Hydration Guard

```html
@if (theme.isHydrated()) {
  <img [src]="theme.isDark() ? 'dark-logo.png' : 'light-logo.png'">
} @else {
  <div class="logo-skeleton"></div>
}
```

## CSS Theme Tokens

Define in `src/themes.css` (scaffolded by `ng add`):

```css
:root, .light { --bg: #fff; --text: #1a1a1a; }
.dark          { --bg: #0a0a0a; --text: #f5f5f5; }
.sunset        { --bg: #ff5f6d; --text: #fff; }
```

## Tailwind CSS v4

Map variables in `src/styles.css`:

```css
@import 'tailwindcss';
@theme {
  --color-bg: var(--bg);
  --color-text: var(--text);
}
```

Use semantic classes — no `dark:` prefix needed: `bg-bg text-text`.

## Anti-patterns

- Do NOT create your own localStorage logic — the library handles persistence.
- Do NOT use multiple convenience services in the same component.
- Do NOT access `document.documentElement` directly — the library handles DOM.
- Do NOT use Tailwind's `dark:` prefix for multi-theme support.
- Do NOT skip `ngx-theme-stack:sync` after changing `provideThemeStack()` config.
