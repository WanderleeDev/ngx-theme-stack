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
- [x] T9: Work-unit commits + verify build
- [x] T10: Repair the unit-test runner (jsdom/undici + duplicate Angular)
- [x] T11: Fix sync theme parsing for object form

## Commits (branch `dev`)

| Commit | Subject |
| --- | --- |
| `5c631ae` | feat(lib): per-theme color-scheme hints for custom themes |
| `15622ea` | docs(lib): document per-theme color-scheme hints |
| `5622c07` | fix(deps): pin jsdom's undici and drop the duplicate Angular copy |
| `585e945` | fix(lib): return the merged theme list from provideThemeStack |
| `f349eab` | fix(schematics): keep object-form themes intact in sync |

## Verification

- `pnpm test`: 110 passing in the library + 1 in the demo (was: worker crash,
  zero tests executed).
- `pnpm run build:lib`: succeeds; dist exports `NgColorScheme`,
  `ResolvedTheme` and `normalizeThemeInputs`, and the schematics carry
  `schemeMap`.
- `pnpm run build:demo`: succeeds; the `prebuild` sync runs end to end and the
  generated anti-flash script contains `s={"sunset":"dark","sepia":"light"}`.
- `pnpm exec ng lint <project>`: clean for both projects.
- Sync is idempotent: a second run produces byte-identical files.
- `pnpm install --frozen-lockfile`: OK (CI parity).

## Test runner incident (T10) — root cause

Two independent defects had made the Angular unit-test runner unusable:

1. **jsdom/undici mismatch.** `jsdom@28.1.0` requires `undici@^7.21.0` and
   imports `undici/lib/handler/wrap-handler.js`, a subpath removed in undici 8.
   The workspace hoisted `undici@8.11.2` (via `release-it`), so the vitest
   worker died at startup with `MODULE_NOT_FOUND` and no test ever ran.
   Fixed with a jsdom-scoped override: `jsdom@28.1.0>undici: '^7.21.0'`.

2. **Duplicate Angular copy.** The library declares `@angular/core` and
   `@angular/common` as `peerDependencies`, so pnpm auto-installed its own copy
   (`@angular/core@22.0.4`) under `projects/ngx-theme-stack/node_modules` while
   the workspace root had `22.2.1`. The builder initializes `TestBed` from the
   root copy, so every spec failed with "Need to call
   TestBed.initTestEnvironment() first". Fixed with `autoInstallPeers: false`
   (camelCase — pnpm silently ignores the snake_case key) so the library
   resolves Angular from the workspace root.

## Notes

- `tsc --noEmit` passes cleanly for `tsconfig.lib.json`,
  `tsconfig.schematics.json`, and `tsconfig.spec.json`.
- Pre-existing and out of scope: `pnpm run lint` (all projects) also lints the
  generated `dist/**/*.d.ts`, reporting 8 unrelated errors. Per-project lint is
  clean. Also pre-existing: 3 `@angular-eslint/component-selector` errors in the
  demo components (`theme-cycle.ts`, `theme-select.ts`, `theme-toggle.ts`),
  identical on `main`.
- Brand-new finding worth a follow-up: `.gitignore` does not exclude `dist`
  from lint, and the demo components use a non-project selector prefix.
