# ngx-theme-stack

A robust, SSR-safe, and signal-based theme management library for Angular applications.

## Features

- 🌓 **SSR Safe**: Works perfectly with Angular Universal/SSR.
- 🚦 **Signal-based**: Built with modern Angular Signals for reactive theme management.
- 🛠️ **Schematics Support**: Easy installation and configuration via `ng add`.
- 🧬 **Flexible**: Support for custom themes and system theme detection.

## Quick Start

### Installation

```bash
ng add @wanderleedev/ngx-theme-stack
```

### Usage

Inject the `ThemeService` into your component or use the provided directives.

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService } from 'ngx-theme-stack';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="theme.toggleTheme()">Toggle Theme</button>
    <p>Current theme: {{ theme.currentTheme() }}</p>
  `,
  imports: [],
})
export class AppComponent {
  theme = inject(ThemeService);
}
```

## Developing

### Building

To build the library, run:

```bash
ng build ngx-theme-stack
```

The build artifacts will be placed in the `dist/ngx-theme-stack` directory.

### Running unit tests

```bash
ng test ngx-theme-stack
```

## License

MIT
