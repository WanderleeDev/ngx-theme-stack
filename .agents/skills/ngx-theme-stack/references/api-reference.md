# ngx-theme-stack API Reference

## provideThemeStack(config?)

Configures the Theme Stack in `app.config.ts`. Custom themes merge with built-ins (`system`, `light`, `dark`).

```typescript
provideThemeStack({
  themes: ['sunset', 'ocean'] as const,
  defaultTheme: 'system',
  storageKey: 'ngx-theme-stack',
  mode: 'class', // 'class' | 'attribute' | 'both'
  strategy: 'critters', // 'critters' | 'blocking'
})
```

### Themes: string form and object form

Each entry in `themes` is either a plain name or an object that adds a
`color-scheme` hint. Both shapes can be mixed in one array. The hint only
affects native browser widgets (scrollbars, inputs, form controls); it does
not pick a theme for you.

```typescript
provideThemeStack({
  themes: [
    'system',
    'light',
    'dark',
    { name: 'sepia', scheme: 'light' },
    { name: 'ocean', scheme: 'dark' },
  ] as const,
})
```

| `scheme` | Effect on `color-scheme` |
| --- | --- |
| `'light'` | Sets `color-scheme: light` while the theme is active. |
| `'dark'` | Sets `color-scheme: dark` while the theme is active. |
| `'auto'` (default when omitted) | No hint; the browser decides. |

Any other value is invalid and falls back to `'auto'`. The `ng-add` prompt only
accepts `light`, `dark`, or `auto`; an unknown answer falls back to `'auto'`.
The `sync` schematic drops an invalid `scheme` from an existing config and warns.

Built-in names keep their implicit hint (`light` → light, `dark` → dark,
`system` → auto). Prefer the object form for any custom theme whose native
widgets must match the theme, otherwise scrollbars keep the OS colour.

```typescript
// Wrong: sepia's scrollbars stay OS-coloured
provideThemeStack({ themes: ['sepia'] as const })

// Right: declares the intended native colour scheme
provideThemeStack({ themes: [{ name: 'sepia', scheme: 'light' }] as const })
```

### Theme names

A theme name becomes a CSS class (`.name`) and is written into `classList`, so it
must be usable as a CSS identifier. It has to match:

```
/^-?[a-zA-Z_][a-zA-Z0-9_-]*$/
```

| Name | Accepted | Why |
| --- | --- | --- |
| `lucky`, `lucky-theme`, `lucky_theme`, `lucky2`, `_lucky`, `-lucky` | yes | usable as-is |
| `2lucky` | no | `.2lucky` is invalid CSS, so the browser drops the rule and the theme silently loses its styles |
| `lucky theme` | no | `classList.add` throws `InvalidCharacterError` on ASCII whitespace |
| `lucky.theme` | no | `.lucky.theme` matches two classes while the class token is the single string `lucky.theme`, so the styles never apply, with no error |
| `sueño`, `café` | no | deliberately ASCII-only, a narrower subset than CSS allows |

**Throws `NgxThemeStackError` when:**
- A theme entry is empty, or `defaultTheme` is not in themes, or `storageKey` is empty.
- **A theme name does not match the pattern above.** This is a build error on purpose: the failure it prevents (a first-paint flash, or a theme whose styles never match) used to be silent.
- `setTheme()` is called with a theme not in the configured themes list.

> After changing `themes` (adding, removing, renaming, or adding a `scheme`),
> run the sync schematic so the anti-flash script in `index.html` picks up the
> new names and hints. Otherwise a custom theme can silently fall back to the
> default on first paint.

---

## CoreThemeService

Foundation service managing state (signals), persistence, system preference, and DOM manipulation (SSR safe).

### Signals, Methods & Properties

| Name | Type | Description |
| --- | --- | --- |
| `selectedTheme()` | `Signal<string>` | Chosen theme (can be `'system'`). |
| `resolvedTheme()` | `Signal<string>` | Active theme applied to DOM (never `'system'`). |
| `isDark()` / `isLight()` | `Signal<boolean>` | `true` for dark/light (returns `false` for custom themes). |
| `isSystem()` / `isHydrated()` | `Signal<boolean>` | System choice active / SSR hydration finished. |
| `availableThemes` | `string[]` | All configured themes including built-ins. |
| `themeNames` | `string[]` | Same list, plain names only — bind directly in templates. |
| `resolvedThemes` | `{ name, scheme }[]` | Normalized themes with their color-scheme hint. |
| `setTheme(theme)` | `(theme: string) => void` | Validates, persists, and applies the theme to DOM. |

---

## Convenience Services

Specialized services implementing different theme selection behaviors.

### ThemeToggleService
Binary switch between `'dark'` and `'light'`.
- `toggle()`: Toggles the theme.

### ThemeCycleService
Rotates through all themes in configuration order.
- `cycle()`: Moves to the next theme.
- `cycleIndex()`: `Signal<number>` - Current theme index.
- `upcoming()` / `preceding()`: `Signal<string>` - Next / previous theme in cycle.

### ThemeSelectService
Full list control for select dropdowns, radio buttons, or lists.
- `select(theme)`: Sets the chosen theme.

---

## Types & Errors

### Core Types
- `NgTheme<T>`: `'system' | 'light' | 'dark' | T`
- `NgMode`: `'class' | 'attribute' | 'both'`
- `NgStrategy`: `'critters' | 'blocking'`

### Errors
- `NgxThemeStackError`: Thrown for invalid configurations, storage keys, or theme names.
Catch with: `if (e instanceof NgxThemeStackError) { ... }`
