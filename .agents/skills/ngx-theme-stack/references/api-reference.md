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

**Throws `NgxThemeStackError` when:**
- A theme entry is empty, or `defaultTheme` is not in themes, or `storageKey` is empty.
- `setTheme()` is called with a theme not in the configured themes list.

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
