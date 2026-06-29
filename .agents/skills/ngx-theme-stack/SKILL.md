---
name: ngx-theme-stack
description: Signal-based theme manager for Angular 20+. Use this skill to configure app.config.ts, manage provideThemeStack, add theme switcher components (Toggle, Cycle, Select), handle Tailwind CSS v4 or pure CSS theme variables, fix SSR layout flashes (isHydrated signal), or run pnpm run ngx-theme-stack:sync.
compatibility: Angular 20+ with TypeScript. Optional Tailwind CSS v4.
metadata:
  author: WanderleeDev
  version: '1.2.2'
---

# ngx-theme-stack

Headless, signal-based theme manager for Angular 20+.

## Interaction Rules

- **MANDATORY RULE**: If the user asks for theme components/switching, you **MUST** ask them to choose:
  - **Toggle** (`ThemeToggleService`) - Binary dark/light toggle.
  - **Cycle** (`ThemeCycleService`) - Rotate through all themes.
  - **Select** (`ThemeSelectService`) - Full picker dropdown/radio selection.
- **Exception**: If the user explicitly mentions which switcher type they want in their query, skip the question and implement it directly.
- **Custom Themes Inquiry**: Ask if they want custom themes (e.g. `sunset`, colors, or CSS variables).
- **DO NOT** generate code or configs until the user responds to these questions.

## Constraints & Rules

- Call `provideThemeStack()` once in root `app.config.ts`. Custom themes merge with defaults.
- **Theme Synchronization**: Syncs theme configuration in `app.config.ts` with `index.html` assets.
  - **Manual execution**: Run `pnpm run ngx-theme-stack:sync` (or `npm run ngx-theme-stack:sync` / `yarn run ngx-theme-stack:sync`).
  - **Auto-Sync**: Runs automatically before serving or building via `"prestart"` and `"prebuild"` hooks in `package.json`.
  - **When to sync**: Run after adding/removing themes, renaming themes, changing configuration settings (storageKey, mode, strategy), or manually editing index.html.
  - **Debugging**: If a theme reverts to default/system on reload, check if the theme identifier is missing in the valid themes array (`v`) in `index.html`. If missing, run synchronization.
- `isDark()` / `isLight()` return false for custom themes (use `resolvedTheme()`).
- `selectedTheme()` can be `'system'`; `resolvedTheme()` is always the concrete theme applied to the DOM (never `'system'`).
- `toggle()` switches between `'dark'` and `'light'`. If a custom theme is active, it switches to `'dark'`.
- Pick ONE convenience service per component. Do not write custom localStorage or direct DOM logic.
- Use `CoreThemeService` directly only for advanced scenarios (dynamic theme names, custom service wrappers). For standard use, prefer convenience services.

## References and Guides

For detailed instructions and implementations, see these sub-guides:
- **API Reference & Config options**: [references/api-reference.md](references/api-reference.md)
- **Styling (CSS variables, Tailwind v4, and Pure CSS)**: [references/styling.md](references/styling.md)
- **SSR Hydration & Layout Stability (prevent layout shift)**: [references/ssr-hydration.md](references/ssr-hydration.md)

## Component Examples
- **Toggle Component Example**: [assets/theme-toggle.ts](assets/theme-toggle.ts)
- **Cycle Component Example**: [assets/theme-cycle.ts](assets/theme-cycle.ts)
- **Select Component Example**: [assets/theme-select.ts](assets/theme-select.ts)

## Anti-patterns

- Do NOT mix Toggle, Cycle, and Select in the same component.
- Do NOT use Tailwind's `dark:` utility modifier (use semantic classes mapped from themes).
- Do NOT skip `ngx-theme-stack:sync` schematic after updating providers.
- Do NOT use theme signals in templates without an `@if (theme.isHydrated())` guard.
