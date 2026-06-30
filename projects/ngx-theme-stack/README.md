<div align="center">

# 🎨 ngx-theme-stack

**A simple and powerful headless theme manager for Angular.**  
Built for performance and SSR support.

[![npm version](https://img.shields.io/npm/v/ngx-theme-stack.svg?style=flat-square)](https://www.npmjs.com/package/ngx-theme-stack)
[![license](https://img.shields.io/npm/l/ngx-theme-stack.svg?style=flat-square)](https://github.com/WanderleeDev/ngx-theme-stack/blob/main/LICENSE)
[![angular](https://img.shields.io/badge/angular-v20+-dd0031.svg?style=flat-square&logo=angular)](https://angular.dev/)
[![signals](https://img.shields.io/badge/signals-powered-a78bfa.svg?style=flat-square)](https://angular.dev/guide/signals)
[![SSR](https://img.shields.io/badge/SSR-ready-4ade80.svg?style=flat-square)](https://angular.dev/guide/ssr)
[![AI Skill](https://img.shields.io/badge/AI%20Skill-ready-6366f1.svg?style=flat-square)](#-ai-code-assistants-integration)

[🌐 Live Demo](https://demo-ngx-theme-stack.wanderlee.site/) · [⚡ StackBlitz Demo](https://stackblitz.com/~/github.com/WanderleeDev/stackblitz-demo) · [📚 Documentation](https://ngx-theme-stack-docs.wanderlee.site/) · [⭐ Star on GitHub](https://github.com/WanderleeDev/ngx-theme-stack)

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
- [🔄 Theme Synchronization](#-theme-synchronization)
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
| `package.json`  | Adds a central `"ngx-theme-stack:sync"` script and configures `"prestart"` / `"prebuild"` hooks to run it automatically |
| `angular.json`  | Registers `themes.css` and optimizes build config                       |
| `themes.css`    | Scaffolds base theme tokens if they don't exist                         |
| `SKILL.md`      | Generates an AI Agent Skill under `.agents/skills/` (optional)          |

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
| Angular 22      | ✅ Stable |
| Angular 21      | ✅ Stable |
| Angular 20      | ✅ Stable |

---

## ⚙️ Configuration

```typescript
import { provideThemeStack } from 'ngx-theme-stack';

export const appConfig: ApplicationConfig = {
  providers: [
    provideThemeStack({
      themes: ['light', 'dark', 'sunset'] as const, // your theme identifiers
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

> [!IMPORTANT]
> Custom themes are **merged** with built-ins. Passing `['sepia', 'ocean']` resolves to `['system', 'light', 'dark', 'sepia', 'ocean']`.
> After making any configuration changes, you **must** synchronize the workspace. See [🔄 Theme Synchronization](#-theme-synchronization) below for instructions and when to run it.

---

## 🔄 Theme Synchronization

The synchronization schematic validates and compiles your theme configuration in `app.config.ts` into static assets (like the zero-flash anti-flash script in `index.html` and critters placeholders).

### Centralized Script

The installation schematic registers a centralized `"ngx-theme-stack:sync"` script in your `package.json` to compile configurations:

```bash
# Run manually using your package manager of choice:
npm run ngx-theme-stack:sync
pnpm run ngx-theme-stack:sync
yarn run ngx-theme-stack:sync
bun run ngx-theme-stack:sync
```

### When should you run sync?

You should run this command after:
- ➕ **Adding or removing** themes in `provideThemeStack`
- 🏷️ **Renaming** a theme identifier
- ⚙️ **Changing** configuration settings like `storageKey`, `mode`, or `strategy`
- 📝 **Manually editing** the anti-flash script in your `index.html` file

### Development vs. Production (Serving vs. Building)

To prevent you from having to run this command manually, the `ng add` command automatically detects your package manager and registers hooks in your `package.json` (appending/prepending safely to any existing scripts):

```json
"scripts": {
  "ngx-theme-stack:sync": "ng generate ngx-theme-stack:sync --project YOUR_PROJECT_NAME",
  "prestart": "npm run ngx-theme-stack:sync",
  "start": "ng serve",
  "prebuild": "npm run ngx-theme-stack:sync",
  "build": "ng build"
}
```

This ensures that the theme configuration is synchronized automatically before running your local development server (`npm start` / `pnpm start` / `yarn start` / `bun start`) and before production builds (`ng build`).

> [!WARNING]
> If you run `ng serve` or `ng build` directly from the CLI (bypassing npm/pnpm/yarn/bun scripts), the package manager hooks (`prestart` and `prebuild`) will not run. In this case, you must run the synchronization command manually after making configuration changes.

### Troubleshooting: Theme reverts to Default/System on reload

If you select a newly added custom theme (e.g. `'sunset'`) and reload the page, but the page reverts to the default theme (e.g. `'system'`), the theme is being rejected by the anti-flash script.

**Diagnostic steps:**
1. Open your `src/index.html` file.
2. Locate the `<script>` tag inside `<head>` marked with `<!-- ngx-theme-stack anti-flash -->`.
3. Check the valid themes array (`v`) defined in that script (e.g., `v=["system","light","dark"]`).
4. **Verify if your custom theme is missing from this array.** To prevent layout flicker and XSS injections, the blocking script rejects any theme not explicitly registered in this array and falls back to the default.
5. If it is missing, run the synchronization script:
   ```bash
   npm run ngx-theme-stack:sync
   ```

---

## 🛠️ Usage

> [!TIP]
> **💡 Architecture Best Practice:**
> Isolate the theme switcher logic (using `ThemeToggleService`, `ThemeCycleService`, or `ThemeSelectService`) in dedicated, standalone switcher components rather than injecting them directly into the root `AppComponent`.
>
> This keeps your root component clean, respects the single-responsibility principle, and ensures that theme-switching UI elements are highly reusable. Only inject the service at the root level if the root UI structure itself needs to dynamically react to theme changes (e.g., for dynamic logo assets or theme-dependent styles not covered by CSS variables).

### 1 — Simple toggle (dark/light)

```typescript
import { inject } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-toggle',
  template: `
    @if (theme.isHydrated()) {
      <button (click)="theme.toggle()">
        {{ theme.isDark() ? '🌙' : '☀️' }}
      </button>
    } @else {
      <div class="theme-toggle-skeleton"></div>
    }
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeToggleService);
}
```

### 2 — Multi-theme cycle

```typescript
import { inject } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-cycle',
  template: `
    @if (theme.isHydrated()) {
      <button (click)="theme.cycle()">🔄 Cycle Theme</button>
    } @else {
      <div class="theme-cycle-skeleton"></div>
    }
  `,
})
export class ThemeCycle {
  protected readonly theme = inject(ThemeCycleService);
}
```

### 3 — Direct selection (dropdowns/lists)

```typescript
import { inject } from '@angular/core';
import { ThemeSelectService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-select',
  template: `
    @if (theme.isHydrated()) {
      <select name="select-theme" (change)="onThemeChange($event)">
        @for (t of theme.availableThemes; track t) {
          <option [value]="t" [selected]="theme.selectedTheme() === t">
            {{ t }}
          </option>
        }
      </select>
    } @else {
      <div class="theme-select-skeleton"></div>
    }
  `,
})
export class ThemeSelect {
  protected readonly theme = inject(ThemeSelectService);

  onThemeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.theme.select(value);
  }
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
> <img [src]="theme.isDark() ? darkLogo : lightLogo" />
> }
> ```

---

## 🎨 Styling

`ng add` creates `src/themes.css` automatically. Define your CSS variables there:

```css
/* src/themes.css */

:root,
.light {
  --background: #ffffff;
  --foreground: #333333;
}

.dark {
  --background: #121212;
  --foreground: #ffffff;
}

.sunset {
  --background: #ff5f6d;
  --foreground: #ffffff;
}
```

---

## 🌪️ Tailwind CSS v4 Integration

### Map semantic variables (recommended)

```css
/* src/styles.css */
@import 'tailwindcss';

@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

### Use in components — no `dark:` prefix needed

```html
<div class="bg-background text-foreground shadow-xl">
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

## 🤖 AI Code Assistants Integration

`ngx-theme-stack` includes out-of-the-box support for AI coding assistants (such as Google Antigravity, Gemini, Claude Code, and other agents that support the open `SKILL.md` standard).

The AI Agent Skill tells coding assistants exactly how to implement theme toggles, cycles, and dropdowns, use Tailwind CSS v4 variables correctly, and handle SSR hydration protection to avoid layout flashes.

### Setup

1. **Automatic:** During `ng add`, you are prompted to generate the skill file. Selecting **Yes** automatically creates `.agents/skills/ngx-theme-stack/SKILL.md` in your project root.
2. **Manual:** If you did not generate it during installation, or deleted it, you can create/re-create the skill by running:
   ```bash
   ng generate ngx-theme-stack:skill
   ```

Once the skill is in your workspace, your AI assistant will automatically read it and generate bug-free theme management code on the first try!

---

## ⚡ Performance Strategies

### How the theme is applied on first load

`ng add` injects a minimal blocking script as the **first child of `<head>`**. It runs before any stylesheet or Angular bundle:

```
1. Read stored theme from localStorage (or fallback to default theme)
2. Validate the theme name format (regex) and ensure it exists in the configured themes (otherwise fallback to default)
3. If 'system' → resolve OS preference via matchMedia('prefers-color-scheme: dark')
4. Apply theme to <html> (class, attribute, or both)
5. Set color-scheme CSS property for native browser adaptation
```

### Strategy comparison

|                           | critters (default)                 | blocking                                   |
| ------------------------- | ---------------------------------- | ------------------------------------------ |
| **How it works**          | Inlines all CSS vars into `<head>` | Loads `themes.css` as render-blocking file |
| **Network requests**      | Zero                               | One (then cached)                          |
| **Flash risk**            | None                               | None                                       |
| **Works with CSR**        | ✅                                 | ✅                                         |
| **Works with SSR/SSG**    | ✅                                 | ⚠️ May flash on SSG                        |
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
