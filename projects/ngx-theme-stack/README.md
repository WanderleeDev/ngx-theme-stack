<div align="center">

# 🎨 ngx-theme-stack

**A simple and powerful headless theme manager for Angular.**  
Built for performance and SSR support.

[![npm version](https://img.shields.io/npm/v/ngx-theme-stack.svg?style=flat-square)](https://www.npmjs.com/package/ngx-theme-stack)
[![license](https://img.shields.io/npm/l/ngx-theme-stack.svg?style=flat-square)](https://github.com/WanderleeDev/ngx-theme-stack/blob/main/LICENSE)
[![angular](https://img.shields.io/badge/angular-v20%20%7C%20v21-dd0031.svg?style=flat-square&logo=angular)](https://angular.dev/)
[![signals](https://img.shields.io/badge/signals-powered-a78bfa.svg?style=flat-square)](https://angular.dev/guide/signals)
[![SSR](https://img.shields.io/badge/SSR-ready-4ade80.svg?style=flat-square)](https://angular.dev/guide/ssr)

[🌐 Live Demo](https://demo-ngx-theme-stack.wanderlee.site/) · [📚 Documentation](https://ngx-theme-stack-docs.wanderlee.site/) · [⭐ Star on GitHub](https://github.com/WanderleeDev/ngx-theme-stack)

![ngx-theme-stack banner](https://raw.githubusercontent.com/WanderleeDev/ngx-theme-stack/refs/heads/main/projects/demo-ngx-theme-stack/public/banner.png)

</div>

---

## 📖 Table of Contents

- [🚀 Features](#-features)
- [📦 Installation](#-installation)
- [🤖 What does `ng add` do for you?](#-what-does-ng-add-do-for-you)
- [🏗️ Architecture & Extensibility](#️-architecture--extensibility)
- [📐 Supported Versions](#-supported-versions)
- [⚙️ Configuration](#️-configuration)
- [🛠️ Usage](#️-usage)
- [🛡️ CoreThemeService API](#️-advanced-corethemeservice-api)
- [🎨 Styling](#-styling)
- [🌪️ Tailwind CSS v4 Integration](#️-tailwind-css-v4-integration)
- [⚡ Performance Strategies](#-performance-strategies)
- [📄 License](#-license)

---

## 🚀 Features

|     | Feature                         | Description                                         |
| --- | ------------------------------- | --------------------------------------------------- |
| ⚡  | **Single command setup**        | Automatic configuration via `ng add`                |
| 🌓  | **System preference detection** | Auto-syncs with OS via `prefers-color-scheme`       |
| 🔄  | **Dynamic switching**           | Toggle, cycle, or select between themes             |
| 🛠️  | **Highly customizable**         | Custom themes, class prefixes, configurable storage |
| 🧱  | **Angular Signals**             | Maximum reactivity and performance                  |
| 🌍  | **SSR ready**                   | Safe in server-side rendering environments          |
| 🚫  | **Zero flicker**                | Anti-flash script + Critters Trick strategy         |

---

## 📦 Installation

```bash
ng add ngx-theme-stack
```

> [!TIP]
> **🚀 Using Bun?**
> Since `ng add` is currently not supported for Bun environments, use this two-step process:
>
> ```bash
> bun add ngx-theme-stack
> ng generate ngx-theme-stack:ng-add
> ```

### Installation modes

When running `ng add`, you choose between two modes:

<details>
<summary><strong>⚡ Quick mode</strong> — default, applies instantly</summary>

| Option           | Value                     |
| ---------------- | ------------------------- |
| Initial theme    | `system`                  |
| Apply mode       | `class` on `<html>`       |
| Available themes | `light`, `dark`, `system` |
| Strategy         | `critters` — zero flash   |

</details>

<details>
<summary><strong>🛠️ Custom mode</strong> — full control</summary>

- Choose which themes to include (e.g. `blue`, `high-contrast`)
- Configure the default theme on startup
- Change the `localStorage` key
- Apply via `class`, `data-theme` attribute, or both
- Pick your anti-flash strategy: `critters` or `blocking`

</details>

---

## 🤖 What does `ng add` do for you?

The installation command automates the following:

| File            | What changes                                                            |
| --------------- | ----------------------------------------------------------------------- |
| `app.config.ts` | Injects `provideThemeStack()` using AST — follows imports automatically |
| `index.html`    | Injects the blocking anti-flash script into `<head>`                    |
| `package.json`  | Adds a `"prebuild"` script for theme synchronization                    |
| `angular.json`  | Registers `themes.css` and optimizes build config                       |
| `themes.css`    | Scaffolds base theme tokens if they don't exist                         |

> [!TIP]
> **Re-configuration support:** Run `ng add` multiple times freely. The schematic updates existing code without duplicating it.

---

## 🏗️ Architecture & Extensibility

The **`CoreThemeService`** is the foundation — it manages state (Signals), persistence (localStorage), system detection (matchMedia), and safe DOM manipulation (SSR compatible).

### Utility services

| Service              | Pattern | Description                                                               |
| -------------------- | ------- | ------------------------------------------------------------------------- |
| `ThemeToggleService` | Toggle  | Binary switch between `light` and `dark`                                  |
| `ThemeSelectService` | Select  | Exposes the full theme list; ideal for dropdowns                          |
| `ThemeCycleService`  | Cycle   | Rotates through all themes; exposes `upcoming`, `preceding`, `cycleIndex` |

---

## 📐 Supported Versions

| Angular Version | Status    |
| --------------- | --------- |
| Angular 21      | ✅ Stable |
| Angular 20      | ✅ Stable |

---

## ⚙️ Configuration

```typescript
import { provideThemeStack } from 'ngx-theme-stack';

export const appConfig: ApplicationConfig = {
  providers: [
    provideThemeStack({
      themes: ['light', 'dark', 'sunset'], // your theme identifiers
      defaultTheme: 'system', // resolves via matchMedia
      mode: 'class', // 'class' | 'attribute' | 'both'
      strategy: 'critters', // 'critters' | 'blocking'
      storageKey: 'ngx-theme-stack', // localStorage key
    }),
  ],
};
```

### Options reference

| Option         | Type         | Default                       | Description              |
| -------------- | ------------ | ----------------------------- | ------------------------ |
| `themes`       | `string[]`   | `['light', 'dark', 'system']` | Merged with built-ins    |
| `defaultTheme` | `string`     | `'system'`                    | Theme on first visit     |
| `mode`         | `NgMode`     | `'class'`                     | How the theme is applied |
| `strategy`     | `NgStrategy` | `'critters'`                  | Anti-flash strategy      |
| `storageKey`   | `string`     | `'ngx-theme-stack'`           | Persistence key          |

> [!NOTE]
> Custom themes are **merged** with built-ins. Passing `['sepia', 'ocean']` resolves to `['system', 'light', 'dark', 'sepia', 'ocean']`. After config changes, run:
>
> ```bash
> ng generate ngx-theme-stack:sync --project YOUR_PROJECT_NAME
> ```

---

## 🛠️ Usage

### 1 — Simple toggle (dark/light)

```typescript
import { inject } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button (click)="toggle.toggle()">Switch to {{ toggle.isDark() ? 'Light' : 'Dark' }}</button>
  `,
})
export class ThemeToggleComponent {
  protected toggle = inject(ThemeToggleService);
}
```

### 2 — Multi-theme cycle

```typescript
import { inject } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-cycler',
  standalone: true,
  template: `
    <button (click)="theme.cycle()">Next: {{ theme.upcoming() }}</button>
    <p>Theme {{ theme.cycleIndex() + 1 }} of {{ theme.availableThemes.length }}</p>
  `,
})
export class ThemeCycleComponent {
  protected theme = inject(ThemeCycleService);
}
```

### 3 — Direct selection (dropdowns/lists)

```typescript
import { inject } from '@angular/core';
import { ThemeSelectService } from 'ngx-theme-stack';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <select [ngModel]="theme.selectedTheme()" (ngModelChange)="theme.select($event)">
      @for (t of theme.availableThemes; track t) {
        <option [value]="t">{{ t }}</option>
      }
    </select>
  `,
})
export class ThemeSelectComponent {
  protected theme = inject(ThemeSelectService);
}
```

---

## 🛡️ Advanced: CoreThemeService API

```typescript
import { inject } from '@angular/core';
import { CoreThemeService } from 'ngx-theme-stack';

@Component({ ... })
export class MyAdvancedComponent {
  themeService = inject(CoreThemeService);

  // ── Signals ──────────────────────────────────────────
  selectedTheme = this.themeService.selectedTheme;  // chosen by user
  resolvedTheme = this.themeService.resolvedTheme;  // applied to DOM
  isDark        = this.themeService.isDark;
  isLight       = this.themeService.isLight;
  isSystem      = this.themeService.isSystem;
  isHydrated    = this.themeService.isHydrated;     // true after first render

  // ── Methods ──────────────────────────────────────────
  changeTheme(newTheme: string) {
    this.themeService.setTheme(newTheme); // validates + applies + persists
  }
}
```

> [!NOTE]
> `isDark` and `isLight` are `false` when a custom theme is active (e.g. `'sunset'`). For custom theme guards, use `resolvedTheme()` directly:
>
> ```typescript
> const isSunset = computed(() => themeService.resolvedTheme() === 'sunset');
> ```
>
> Use `isHydrated()` to guard conditional content (icons, images) against SSR hydration mismatches:
>
> ```html
> @if (theme.isHydrated()) {
>   <img [src]="theme.isDark() ? 'dark-logo.png' : 'light-logo.png'">
> }
> ```

---

## 🎨 Styling

`ng add` creates `src/themes.css` automatically. Define your CSS variables there:

```css
/* src/themes.css */

:root,
.light {
  --bg-color: #ffffff;
  --text-color: #333333;
}

.dark {
  --bg-color: #121212;
  --text-color: #ffffff;
}

.sunset {
  --bg-color: #ff5f6d;
  --text-color: #ffffff;
}
```

---

## 🌪️ Tailwind CSS v4 Integration

### Map semantic variables (recommended)

```css
/* src/styles.css */
@import 'tailwindcss';

@theme {
  --color-main-bg: var(--bg-color);
  --color-main-text: var(--text-color);
}
```

### Use in components — no `dark:` prefix needed

```html
<div class="bg-main-bg text-main-text shadow-xl">
  <!-- automatically reflects the active theme -->
</div>
```

> **Why this works:** CSS variables are set on `<html>` before Angular boots. Tailwind tokens point directly to those variables, covering all themes (dark, light, sunset, etc.) without extra configuration.

<details>
<summary><strong>Optional: enable the <code>dark:</code> prefix</strong></summary>

Only needed if you want `dark:` utilities tied to ngx-theme-stack's toggle:

```css
/* Class mode */
@custom-variant dark (&:where(.dark, .dark *));

/* Attribute mode */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

> **⚠️** This disconnects `dark:` from OS preference and only covers the built-in `dark` theme. For multi-theme support, prefer the CSS variable approach above.

</details>

---

## ⚡ Performance Strategies

### How the theme is applied on first load

`ng add` injects a minimal blocking script as the **first child of `<head>`**. It runs before any stylesheet or Angular bundle:

```
1. Read stored theme from localStorage
2. If 'system' → resolve OS preference via matchMedia('prefers-color-scheme: dark')
3. Apply theme to <html> (class, attribute, or both)
4. Set color-scheme CSS property for native browser adaptation
```

### Strategy comparison

|                           | critters (default)                 | blocking                                   |
| ------------------------- | ---------------------------------- | ------------------------------------------ |
| **How it works**          | Inlines all CSS vars into `<head>` | Loads `themes.css` as render-blocking file |
| **Network requests**      | Zero                               | One (then cached)                          |
| **Flash risk**            | None                               | None                                       |
| **Works with CSR**        | ✅                                 | ✅                                         |
| **Works with SSR/SSG**    | ✅                                 | ⚠️ May flash on SSG                       |
| **Strict CSP compatible** | ❌ requires `unsafe-inline`        | ✅                                         |
| **Best for**              | Most apps                          | Strict CSP, many themes                    |

<details>
<summary><strong>When to choose blocking over critters</strong></summary>

- **Strict CSP** — Critters generates inline `<style>` tags requiring `'unsafe-inline'` in `style-src`
- **Many themes** — All theme variables get inlined into HTML on every request; a cached file is more efficient
- **Critters conflicts** — Complex CSS pipelines (PostCSS, CSS Modules) can conflict with Critters
- **Simpler debugging** — An explicit stylesheet is easier to inspect in DevTools

</details>

---

## 📄 License

[MIT](https://github.com/WanderleeDev/ngx-theme-stack/blob/main/LICENSE)
