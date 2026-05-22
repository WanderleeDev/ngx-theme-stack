# ngx-theme-stack API Reference

## provideThemeStack(config?)

Provides Theme Stack configuration to Angular's DI system.

```typescript
provideThemeStack({
  themes: ['sunset', 'ocean'] as const,
  defaultTheme: 'system',
  storageKey: 'ngx-theme-stack',
  mode: 'class',
  strategy: 'critters',
})
```

Custom themes are **merged** with built-in defaults (`'system'`, `'light'`, `'dark'`).
Passing `['sepia', 'ocean']` resolves to `['system', 'light', 'dark', 'sepia', 'ocean']`.

### Throws `NgxThemeStackError` when:
- A theme entry is empty or whitespace-only.
- `defaultTheme` is not in the resolved themes array.
- `storageKey` is empty or whitespace-only.

---

## CoreThemeService

Foundation service. Manages state (signals), persistence (localStorage),
system preference detection (matchMedia), and safe DOM manipulation (SSR compatible).

### Signals

| Signal             | Type                | Description                                         |
| ------------------ | ------------------- | --------------------------------------------------- |
| `selectedTheme()`  | `Signal<string>`    | Theme chosen by the user. May be `'system'`.         |
| `resolvedTheme()`  | `Signal<string>`    | Theme applied to DOM. Never `'system'`.              |
| `isDark()`          | `Signal<boolean>`   | `true` when resolved is `'dark'`. `false` for custom. |
| `isLight()`         | `Signal<boolean>`   | `true` when resolved is `'light'`. `false` for custom.|
| `isSystem()`        | `Signal<boolean>`   | `true` when user selected `'system'`.                |
| `isHydrated()`      | `Signal<boolean>`   | `true` after first browser render. Guard SSR content.|

### Methods

| Method            | Signature              | Description                              |
| ----------------- | ---------------------- | ---------------------------------------- |
| `setTheme()`      | `(theme: string): void`| Validates, applies to DOM, persists.     |

### Properties

| Property          | Type        | Description                               |
| ----------------- | ----------- | ----------------------------------------- |
| `availableThemes` | `string[]`  | Resolved list including built-ins.        |

---

## ThemeToggleService

Binary switch between `'dark'` and `'light'`.

### Signals
Inherits: `selectedTheme()`, `resolvedTheme()`, `isDark()`, `isLight()`, `isSystem()`, `isHydrated()`.

### Methods

| Method     | Description                                    |
| ---------- | ---------------------------------------------- |
| `toggle()` | If resolved is dark → light. Otherwise → dark. |

---

## ThemeCycleService

Rotates through all configured themes in order.

### Signals
Inherits all from CoreThemeService, plus:

| Signal         | Type              | Description                             |
| -------------- | ----------------- | --------------------------------------- |
| `cycleIndex()` | `Signal<number>`  | Index of current theme in the cycle.    |
| `upcoming()`   | `Signal<string>`  | Next theme in the cycle.                |
| `preceding()`  | `Signal<string>`  | Previous theme in the cycle.            |

### Methods

| Method    | Description                  |
| --------- | ---------------------------- |
| `cycle()` | Advances to the next theme.  |

### Properties

| Property          | Type        | Description                        |
| ----------------- | ----------- | ---------------------------------- |
| `availableThemes` | `string[]`  | Full list of themes in cycle order.|

---

## ThemeSelectService

Exposes the full theme list for dropdowns, radios, or tab selection.

### Signals
Inherits: `selectedTheme()`, `resolvedTheme()`, `isDark()`, `isLight()`, `isSystem()`, `isHydrated()`.

### Methods

| Method            | Signature              | Description                 |
| ----------------- | ---------------------- | --------------------------- |
| `select()`        | `(theme: string): void`| Applies the given theme.    |

### Properties

| Property          | Type        | Description                        |
| ----------------- | ----------- | ---------------------------------- |
| `availableThemes` | `string[]`  | Full list of configured themes.    |

---

## Types

| Type          | Definition                          | Description                       |
| ------------- | ----------------------------------- | --------------------------------- |
| `NgTheme<T>`  | `'system' \| 'light' \| 'dark' \| T`| Theme identifier union            |
| `NgSystemTheme`| `'light' \| 'dark'`                 | Resolved system theme             |
| `NgMode`       | `'class' \| 'attribute' \| 'both'`  | How theme is applied to DOM       |
| `NgStrategy`   | `'critters' \| 'blocking'`          | Anti-flash rendering strategy     |
| `NgConfig<T>`  | `interface`                          | Full library configuration        |

## Errors

| Error                | When thrown                                               |
| -------------------- | --------------------------------------------------------- |
| `NgxThemeStackError` | Invalid config, invalid theme name in `setTheme()`, etc.  |

Catch with: `if (e instanceof NgxThemeStackError) { ... }`
