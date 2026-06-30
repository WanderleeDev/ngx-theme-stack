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

## 📚 Advanced Guides & Documentation

For details on more advanced topics, check out the official guides:

- **[⚙️ Getting Started & Configuration](https://ngx-theme-stack-docs.wanderlee.site/guides/getting-started/)** - Detailed setup options and configuration properties.
- **[🎨 Styling & Custom Themes](https://ngx-theme-stack-docs.wanderlee.site/guides/styling/)** - Learn how to define CSS variables for custom themes.
- **[🌪️ Tailwind CSS v4 Integration](https://ngx-theme-stack-docs.wanderlee.site/guides/tailwind/)** - Map variables natively to Tailwind v4 theme configurations.
- **[⚡ Performance & Anti-Flash Strategies](https://ngx-theme-stack-docs.wanderlee.site/guides/performance/)** - Learn how the zero-flash system works and how to choose between `critters` and `blocking` modes.
- **[🤖 AI Agent Skill Setup](https://ngx-theme-stack-docs.wanderlee.site/guides/agent-integration/)** - Work with AI code assistants using the generated `SKILL.md` standard.
- **[🛡️ API Reference](https://ngx-theme-stack-docs.wanderlee.site/reference/api/)** - Deep dive into convenience services, methods, and `CoreThemeService` signals.

---

## 📄 License

[MIT](https://github.com/WanderleeDev/ngx-theme-stack/blob/main/LICENSE)
