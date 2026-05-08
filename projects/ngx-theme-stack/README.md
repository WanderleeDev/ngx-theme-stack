# ngx-theme-stack 🎨

![ngx-theme-stack banner](https://raw.githubusercontent.com/WanderleeDev/ngx-theme-stack/refs/heads/main/projects/demo-ngx-theme-stack/public/banner.png)

A simple and powerful headless theme manager for **Angular**. Built for performance and SSR support.

[**🌐 Live Demo**](https://demo-ngx-theme-stack.wanderlee.site/) | [**📚 Documentation**](https://ngx-theme-stack-docs.wanderlee.site/) | [**⭐ Star on GitHub**](https://github.com/WanderleeDev/ngx-theme-stack)

## 🚀 Features

- ⚡ **Single Command Installation**: Automatic configuration via `ng add`.
- 🌓 **System Preference Detection**: Automatic synchronization with OS settings (`prefers-color-scheme`).
- 🔄 **Dynamic Switching**: Multiple ways to toggle themes (toggle, cycle, select).
- 🛠️ **Highly Customizable**: Support for custom themes, class prefixes, and configurable storage.
- 🧱 **Modern Architecture**: Powered by Angular Signals for maximum reactivity and performance.
- 🌍 **SSR Ready**: Safe to use in Server-Side Rendering environments.
- 🚫 **Zero Flicker**: Includes an optimized anti-flash script and the **Critters Trick** strategy to prevent theme jumps and network requests on load.

## 📦 Installation

To install the library and configure it automatically in your project, run:

```bash
ng add ngx-theme-stack
```

### Installation Modes

> [!TIP]
> **🚀 Using Bun?**
> Since `ng add` is currently not supported for Bun environments, please use this two-step process:
>
> 1. **Install:** `bun add ngx-theme-stack`
> 2. **Configure:** `ng generate ngx-theme-stack:ng-add`
>
> This ensures Bun handles the dependency management while the schematic automates the code configuration (providers, index.html, tokens, etc.).

When running `ng add`, you will be presented with two configuration options:

1.  **Quick Mode**:
    - Applies default configuration instantly.
    - Initial theme: `system`.
    - Apply mode: `class` (adds the theme class to the `<html>` element).
    - Available themes: `['light', 'dark', 'system']`.
    - **Strategy**: `critters` (Zero-flash via CSS inlining).

2.  **Custom Mode**:
    - Choose which themes to include (e.g., if you have a `blue` or `high-contrast` theme).
    - Configure the default theme upon app startup.
    - Change the `localStorage` key where the theme choice is saved.
    - Decide how to apply themes: via classes (`class`), attributes (`data-theme`), or both.
    - **Pick your strategy**: `critters` for modern SSR/SSG apps or `blocking` for standard CSS loading.

## 🤖 What does `ng add` do for you?

To provide a "Zero Config" experience, the installation command automates the following:

1.  **`app.config.ts` (or `main.ts`)**: Injects `provideThemeStack()` into your providers array. It's **Smart**: it uses AST to follow imports and find your providers even if they are delegated to external files.
2.  **`index.html`**: Injects the blocking anti-flash script into the `<head>` to ensure a seamless theme experience.
3.  **`package.json`**: Adds a `"prebuild"` script to automate theme synchronization.
4.  **`angular.json`**: Registers `themes.css` and optimizes build configurations.
5.  **`themes.css`**: Scaffolds your base theme tokens if they don't exist.

> [!TIP]
> **Re-configuration support:** You can run `ng add` multiple times. If you change your mind about the `storageKey` or the `mode`, the schematic will update your existing code and script automatically without duplicating them.

## 🏗️ Architecture & Extensibility

The library is designed to be flexible. The **`CoreThemeService`** is the foundation:

- **Solid Base:** Manages state (`Signal`), persistence (`localStorage`), system detection (`matchMedia`), and safe DOM manipulation (SSR compatible).
- **Extensibility:** You can inject `CoreThemeService` to build your own custom services or components with specific business logic.

### Utility Services (Ready to Use)

For common use cases, we include three services with predefined logic:

1.  **`ThemeToggleService`**: A simple binary switch between `light` and `dark`.
2.  **`ThemeSelectService`**: Exposes the full list of themes and methods to select them.
3.  **`ThemeCycleService`**: A circular function to cycle through all available themes; exposes `upcoming`, `preceding`, and `cycleIndex` signals for UI feedback.

---

## ⚙️ Supported Versions

| Angular Version | Support   |
| :-------------- | :-------- |
| **Angular 21**  | ✅ Stable |
| **Angular 20**  | ✅ Stable |

## ⚙️ Configuration

The best way to configure the library is during installation, but you can also manually adjust the providers in your `app.config.ts`:

```typescript
import { provideThemeStack } from 'ngx-theme-stack';

export const appConfig: ApplicationConfig = {
  providers: [
    provideThemeStack({
      themes: ['light', 'dark', 'sunset'], // Your theme identifiers
      defaultTheme: 'system', // Initial fallback ('system' resolves via matchMedia)
      mode: 'class', // 'class', 'attribute' or 'both'
      strategy: 'critters', // 'critters' (SSR) or 'blocking' (Standard SPA)
      storageKey: 'ngx-theme-stack', // LocalStorage key
    }),
  ],
};
```

| Option         | Type         | Default                       | Description                                                               |
| :------------- | :----------- | :---------------------------- | :------------------------------------------------------------------------ |
| `themes`       | `string[]`   | `['light', 'dark', 'system']` | List of supported theme identifiers.                                      |
| `defaultTheme` | `string`     | `'system'`                    | Theme used on first visit or when no preference is saved.                 |
| `mode`         | `NgMode`     | `'class'`                     | How the theme is applied: `class`, `attribute` (`data-theme`), or `both`. |
| `strategy`     | `NgStrategy` | `'critters'`                  | Anti-flash performance strategy: `critters` (inlined CSS) or `blocking`.  |
| `storageKey`   | `string`     | `'ngx-theme-stack'`           | Key used to persist theme preference in `localStorage`.                   |

> [!IMPORTANT]
> Whenever you update these settings, run `ng generate ngx-theme-stack:sync` to ensure your `index.html` is updated with the correct anti-flash script.

## 🛠️ Usage

For most use cases, we recommend using the built-in **Utility Services**. They provide ready-to-use logic for common patterns.

### 1. Simple Toggle (Dark/Light)

Use `ThemeToggleService` when you only need a simple switch.

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

### 2. Multi-theme Cycle

Use `ThemeCycleService` to rotate through all your configured themes in order.

```typescript
import { inject } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-cycler',
  standalone: true,
  template: `
    <button (click)="theme.cycle()">Next theme: {{ theme.upcoming() }}</button>
    <p>Theme {{ theme.cycleIndex() + 1 }} of {{ theme.availableThemes.length }}</p>
  `,
})
export class ThemeCycleComponent {
  protected theme = inject(ThemeCycleService);
}
```

### 3. Direct Selection (Dropdowns/Lists)

Use `ThemeSelectService` to build selection interfaces like dropdowns or radio groups.

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

### 🛡️ Advanced: CoreThemeService API

If you need to build custom logic or want full control over the state, use the foundational `CoreThemeService`.

```typescript
import { inject } from '@angular/core';
import { CoreThemeService } from 'ngx-theme-stack';

@Component({ ... })
export class MyAdvancedComponent {
  themeService = inject(CoreThemeService);

  /* --- 📊 Reactive Signals --- */

  // The exact theme chosen by the user ('dark', 'light', 'system', etc.)
  selectedTheme = this.themeService.selectedTheme;

  // The theme finally applied to the DOM (resolves 'system' to 'dark' or 'light')
  resolvedTheme = this.themeService.resolvedTheme;

  // Helper boolean signals evaluating the applied theme
  isDark = this.themeService.isDark;
  isLight = this.themeService.isLight;
  isSystem = this.themeService.isSystem;

  // True after the first browser render. Great for preventing SSR flickering!
  isHydrated = this.themeService.isHydrated;

  /* --- 🛠️ Methods --- */

  changeTheme(newTheme: string) {
    // Validates, applies to the DOM, and saves to localStorage
    this.themeService.setTheme(newTheme);
  }
}
```

## 🎨 Styling

The `ng add` command automatically creates a **`src/themes.css`** file. This is where you should define your theme-specific CSS variables.

```css
/* src/themes.css */

/* Using Classes (Default Mode) */
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

## 🌪️ Tailwind CSS v4 Integration

If you are using **Tailwind CSS v4**, you can map your `themes.css` variables directly to Tailwind design tokens for a clean, theme-aware utility class experience.

### 1. Map Semantic Variables ✅ Recommended

In your `src/styles.css`, expose your theme variables as Tailwind tokens:

```css
@import 'tailwindcss';

@theme {
  --color-main-bg: var(--bg-color);
  --color-main-text: var(--text-color);
}
```

### 2. Usage in Components

Now you can write clean, theme-aware classes. Colors update **automatically** whenever `ngx-theme-stack` switches the active theme — no `dark:` prefix needed:

```html
<div class="bg-main-bg text-main-text shadow-xl">
  <!-- Automatically reflects the active theme (dark, light, sunset, etc.) -->
</div>
```

> **✅ Why this works:** The CSS variables on `<html>` are already set before Angular boots (see [Performance Strategies](#-performance-strategies)). Since the Tailwind tokens (`--color-main-bg`) point directly to those variables, **this single approach covers manual toggling + all themes** (dark, light, sunset, etc.) — without any extra Tailwind configuration.


---

### (Optional) Enable the `dark:` Tailwind Prefix

Only needed if you want to use `dark:` utilities directly (e.g. `dark:bg-black`) tied to ngx-theme-stack's toggle instead of the OS system preference.

```css
/* src/styles.css */
@import 'tailwindcss';

/* Class mode */
@custom-variant dark (&:where(.dark, .dark *));

/* Attribute mode */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

> **⚠️** Overriding `@custom-variant dark` disconnects `dark:` from the OS preference and only covers the `dark` theme. For multi-theme support, prefer the CSS variable approach above.




## ⚡ Performance Strategies

### How the theme is applied on first load

`ng add` injects a minimal blocking script as the **first child of `<head>`** in your `index.html`. This script runs before any stylesheet or Angular bundle:

```
1. Reads the stored theme from localStorage
2. If the theme (or defaultTheme) is 'system' →
   resolves OS preference via matchMedia('prefers-color-scheme: dark')
3. Applies the theme to <html> (class, attribute, or both)
4. Sets color-scheme CSS property for native browser adaptation
```

This script **always runs regardless of strategy** — it eliminates the flash of incorrect theme class. However, the CSS variables (your actual colors) still need to be delivered. That's where the strategy matters.

### Anti-flash strategies

There are two layers to prevent a flash:

| Layer | What it prevents | Always active? |
|---|---|---|
| Anti-flash script | Wrong theme class on `<html>` | ✅ Yes, always |
| Strategy | Unstyled variables flash | Depends on chosen strategy |

**1. Critters (Default)**

Injects hidden `<div>`s for each theme into `<body>`, forcing Angular's Critters optimizer to inline **all** CSS variables directly into `<head>`. When the anti-flash script sets the class, the variables are already there — **zero network requests, zero flash**. Works equally for CSR, SSR, and SSG apps.

**2. Blocking**

Disables Critters (`inlineCritical: false`) and loads `themes.css` as a render-blocking stylesheet. The browser blocks rendering until it's downloaded, so there's no visible flash — but it requires one network round-trip. The file is HTTP-cacheable after the first load.

**When to choose Blocking over Critters:**

- **Strict CSP** — Critters generates inline `<style>` tags, which require `'unsafe-inline'` in `style-src`. A blocking stylesheet avoids this.
- **Many themes** — All theme variables get inlined into the HTML on every request with Critters. If you have many themes with many variables, a cached external file is more efficient.
- **Critters conflicts** — Complex CSS pipelines (PostCSS, CSS Modules, etc.) can conflict with Critters. Blocking is the safe fallback.
- **Simpler debugging** — An explicit stylesheet is easier to inspect in DevTools than inlined styles.


Use the **Sync Command** to refresh your `index.html` if you change your configuration:

```bash
ng generate ngx-theme-stack:sync --project YOUR_PROJECT_NAME
```


## 📄 License

[MIT](./LICENSE)
