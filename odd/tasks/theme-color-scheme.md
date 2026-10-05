# Feature: Per-Theme Color Scheme Hints

## Context

Today, the library only applies a `color-scheme` hint for the built-in
`'light'` and `'dark'` themes. Custom themes (e.g. `sepia`, `ocean`) get no
hint at all — native UI widgets (scrollbars, inputs) don't match the active
custom theme.

## Design

Accept two input shapes in `provideThemeStack().themes` (mixable in one array):

```ts
// Legacy: string-only (no hints on custom themes)
themes: ['sepia', 'ocean'] as const

// New: object form with scheme hints
themes: [
  { name: 'sepia', scheme: 'light' },
  { name: 'ocean', scheme: 'dark' },
] as const
```

- `scheme` is `'light' | 'dark' | 'auto' | 'none'` (default `'auto'` when
  omitted).
- `'auto'` and `'none'` → no `color-scheme` is set on the root element.
- `'light'` / `'dark'` → hint is set while that theme is active.
- Built-in themes keep their implicit hint (`'light'` → light,
  `'dark'` → dark, `'system'` → auto).

## Scope

- **Types**: `NgColorScheme`, `NgThemeOption`, `NgThemeInput`,
  `ResolvedTheme`, `normalizeThemeInputs()`, `implicitScheme()`.
- **Config**: `provideThemeStack()` normalizes inputs → `resolvedThemes`.
- **CoreThemeService**: applies per-theme `color-scheme` hint from the
  normalized map; exposes `themeNames: string[]`.
- **Public services** (`ThemeSelectService`, `ThemeCycleService`): expose
  `themeNames` for template binding.
- **ng-add schematic**: prompt for scheme hints on custom themes; render
  object-form entries in `provideThemeStack()`; pass `schemeMap` to the
  anti-flash script.
- **Anti-flash script**: when `schemeMap` is provided, sets the hint
  before Angular boots.
- **Sync schematic**: detects object-form themes + schemeMap in the existing
  config and regenerates the provider call + anti-flash script.
- **Demo**: `sepia` theme with `scheme: 'light'` added.

## Tasks

- [x] T1: Types (`types.ts`)
- [x] T2: `CoreThemeService` scheme hint logic
- [x] T3: Public services expose `themeNames`
- [x] T4: ng-add schematic (prompt + object form rendering)
- [x] T5: Anti-flash script respects per-theme scheme
- [x] T6: Sync schematic detects + preserves object form
- [x] T7: Specs (types, config, core, services, anti-flash)
- [x] T8: Demo app updated (sepia theme + index.html + themes.css)
- [ ] T9: Work-unit commit + verify build

## Notes

- Pre-existing test infra incident: `pnpm test` fails on this branch and on
  main with a jsdom `MODULE_NOT_FOUND` (undici) error in the vitest worker.
  This is not caused by this feature; it exists on main too.
- `tsc --noEmit` passes cleanly for `tsconfig.lib.json`,
  `tsconfig.schematics.json`, and `tsconfig.spec.json`.
