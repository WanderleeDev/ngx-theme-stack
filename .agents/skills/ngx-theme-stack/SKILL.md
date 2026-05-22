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

> [!IMPORTANT]
> **MANDATORY INTERACTION RULE**: If the user asks to implement theme switching, configuration, or a theme-related component but does NOT explicitly specify which convenience service to use (`ThemeToggleService`, `ThemeCycleService`, or `ThemeSelectService`), you **MUST NOT** make assumptions or start writing code.
> You **MUST** stop and ask the user to explicitly choose one of the three patterns before proceeding.
>
> Present these options clearly:
> 1. **Toggle** (`ThemeToggleService`) — Binary toggle between dark and light themes (best for simple buttons or icon toggles).
> 2. **Cycle** (`ThemeCycleService`) — Rotates through all configured themes (best for 3+ themes with a single button).
> 3. **Select** (`ThemeSelectService`) — Full dropdown/radio list of all available themes (best for settings pages or explicit pickers).
>
> **Custom Themes Inquiry**: In addition to the service choice, you **MUST** ask the user if they want to configure or need any **custom themes** (e.g. `sunset`, `ocean`, `sepia`) beyond the default `light`, `dark`, and `system`. Prompt the user for details on what they are looking for or need (such as specific custom theme names, colors, or CSS variables) to help them scaffold these customizations.
>
> **DO NOT** generate any component code or configurations until the user has explicitly responded to these questions.

## Constraints

- Always import from `'ngx-theme-stack'` — never deep-import internal paths.
- Call `provideThemeStack()` exactly once, in the root `app.config.ts` providers.
- Custom themes are **merged** with built-ins. Passing `['sepia']` resolves to `['system', 'light', 'dark', 'sepia']`.
- **Mandatory Theme Synchronization**: After configuring, adding, or modifying themes in `provideThemeStack()`, you **MUST** run the synchronization schematic command: `ng generate ngx-theme-stack:sync --project PROJECT_NAME` (or explicitly instruct the user to run it if you cannot execute commands). Failing to synchronize themes after modification is a critical violation that breaks theme compilation.
- `isDark()` and `isLight()` return `false` for custom themes — use `resolvedTheme()` directly.
- **Mandatory SSR Guard**: You MUST guard all theme-dependent template elements (e.g. text, icons, images, styling classes based on theme signals) using `@if (theme.isHydrated())`. Using theme signals (`isDark()`, `resolvedTheme()`, etc.) directly in templates without checking `isHydrated()` causes content flickering and critical Angular hydration mismatch errors in SSR.
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

## SSR Hydration Guard & Layout Stability

Guard theme-dependent template content behind `isHydrated()` in SSR to prevent hydration mismatches and layout flickering.

```html
@if (theme.isHydrated()) {
  <img [src]="theme.isDark() ? 'dark-logo.png' : 'light-logo.png'">
} @else {
  <!-- The placeholder/skeleton MUST match the exact size and spacing of the hydrated image -->
  <div class="logo-skeleton" style="width: 150px; height: 40px; display: inline-block;"></div>
}
```

### Skeleton & Layout Stability Guidelines

When designing fallback skeleton loaders/placeholders:
1. **Dimension & Spacing Match**: The fallback element (e.g., inside the `@else` block) MUST occupy the exact same space, size, margins, padding, positioning, and responsive constraints as the hydrated element. This ensures zero layout shift (preventing CLS issues) and keeps the Largest Contentful Paint (LCP) optimized.
2. **Granular Skeletons**: NEVER wrap an entire complex component or large layout block in an `isHydrated()` guard if only a single word, label, icon, or sub-element changes dynamically based on the theme. Instead, place the `isHydrated()` guard at the most granular level possible (e.g., directly wrapping just the dynamic text or icon inside the button), leaving the surrounding button wrapper and layout static. A full-element skeleton should only be used if the entire component's structure/layout is completely dynamic.

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
