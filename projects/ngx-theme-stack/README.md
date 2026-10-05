<div align="center">

# 🎨 ngx-theme-stack

**A simple and powerful headless theme manager for Angular.**  
Built for performance, signal-driven reactivity, and SSR zero-flash support.

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

## 🚀 Features

- **⚡ Single Command Setup:** Fully configured via standard `ng add ngx-theme-stack`.
- **🌓 OS Preference Auto-Detection:** Automatically synchronizes with system dark/light modes.
- **🧱 Angular Signals:** Built natively with reactive signals for maximum performance.
- **🌍 SSR & Hydration Ready:** Guaranteed zero flicker or layout shift on startup.
- **🔄 Extensible & Custom Themes:** Seamlessly add sepia, sunset, or custom color palettes.
- **🎛️ Per-Theme Color Scheme Hints:** Declara el `color-scheme` para cada custom theme y deja que los widgets nativos del browser (scrollbars, inputs) coincidan con el tema activo.
- **🤖 AI Code Assistants Integration:** Work with AI coding assistants using the generated `SKILL.md` standard.

---

## 📦 Installation

```bash
ng add ngx-theme-stack
```

> [!TIP]
> **Using Bun?**
> Since `ng add` is not supported in Bun environments, use the manual two-step process:
>
> ```bash
> bun add ngx-theme-stack
> ng generate ngx-theme-stack:ng-add
> ```

> [!TIP]
> **Using an Nx monorepo?**
> Since `ng add` doesn't run in Nx workspaces, use the Nx-native two-step process:
>
> ```bash
> nx add ngx-theme-stack
> nx g ngx-theme-stack:ng-add --project <app-name>
> ```

---

## 🛠️ Quick Start

Below is a simple example of a standalone theme toggle component.

> [!TIP]
> **💡 Architecture Best Practice:**
> Isolate the theme switcher logic (using `ThemeToggleService`, `ThemeCycleService`, or `ThemeSelectService`) in dedicated switcher components rather than injecting them directly into the root `AppComponent`.
>
> This keeps your root component clean, respects the single-responsibility principle, and ensures that theme-switching UI elements are highly reusable. Only inject the service at the root level if the root UI structure itself needs to dynamically react to theme changes (e.g., for dynamic logo assets or theme-dependent styles not covered by CSS variables).

```typescript
import { inject, Component } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-toggle',
  template: `
    @if (theme.isHydrated()) {
      <button (click)="theme.toggle()">
        {{ theme.isDark() ? '🌙' : '☀️' }}
      </button>
    } @else {
      <!-- Placeholder matching dimensions to prevent layout shifts -->
      <div
        class="theme-toggle-skeleton"
        style="width: 40px; height: 40px; background: #e2e8f0; border-radius: 4px;"
      ></div>
    }
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeToggleService);
}
```

---

## 🎛️ Per-Theme Color Scheme Hints

When you use custom themes, the library can also apply a `color-scheme` hint to the root element so that native UI widgets (scrollbars, form controls) match the active theme.

```typescript
// Legacy: string form — no hint on custom themes
provideThemeStack({
  themes: ['sepia', 'ocean'] as const,
})

// New: object form — explicit hint per custom theme
provideThemeStack({
  themes: [
    { name: 'sepia', scheme: 'light' },
    { name: 'ocean', scheme: 'dark' },
  ] as const,
})
```

Both shapes can be mixed in the same array:

```typescript
provideThemeStack({
  themes: ['light', 'dark', 'system', { name: 'forest' }] as const,
  // 'light' and 'dark' keep their implicit hint; 'forest' defaults to 'auto' (no hint)
})
```

`scheme` values:

| Value   | Effect on `color-scheme`            |
|---------|-------------------------------------|
| `'light'` | Sets `color-scheme: light` on the root element while the theme is active. |
| `'dark'`  | Sets `color-scheme: dark`. |
| `'auto'`  | No hint is set; the browser decides, usually from the OS. Also the default when `scheme` is omitted. |

Any other value is invalid and falls back to `'auto'`. The hint is applied to `<html>` in the runtime and in the anti-flash script (before Angular boots), and is regenerated by the `sync` schematic — which drops an invalid `scheme` and warns about it instead of writing it back.

---

## 📚 Advanced Guides & Documentation

For details on more advanced topics, check out the official guides:

- **[⚙️ Getting Started & Configuration](https://ngx-theme-stack-docs.wanderlee.site/guides/getting-started/)** - Detailed setup options and configuration properties.
- **[🎨 Styling & Custom Themes](https://ngx-theme-stack-docs.wanderlee.site/guides/styling/)** - Learn how to define CSS variables for custom themes.
- **[🌪️ Tailwind CSS v4 Integration](https://ngx-theme-stack-docs.wanderlee.site/guides/tailwind/)** - Map variables natively to Tailwind v4 theme configurations.
- **[⚡ Performance & Anti-Flash Strategies](https://ngx-theme-stack-docs.wanderlee.site/guides/performance/)** - Learn how the zero-flash system works and how to choose between `critters` and `blocking` modes.
- **[🤖 AI Agent Skill Setup](https://ngx-theme-stack-docs.wanderlee.site/guides/agent-integration/)** - Work with AI code assistants using the generated `SKILL.md` standard.
- **[🛡️ API Reference](https://ngx-theme-stack-docs.wanderlee.site/reference/api/)** - Deep dive into convenience services, methods, and `CoreThemeService` signals.

---

## 🤝 Contributing & Issues

Contributions are welcome! If you find a bug or have a suggestion, feel free to open an issue or submit a pull request:
- Report bugs or request features on [GitHub Issues](https://github.com/WanderleeDev/ngx-theme-stack/issues).
- For local development guidelines (how to build, test, and run the demo), please refer to the workspace [README](../../README.md).

---

## 📄 License

[MIT](https://github.com/WanderleeDev/ngx-theme-stack/blob/main/LICENSE)
