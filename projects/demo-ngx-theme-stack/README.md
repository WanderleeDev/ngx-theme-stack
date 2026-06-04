# ngx-theme-stack Demo App 🚀

This is the official demonstration application for the **ngx-theme-stack** library. It showcases:

- **Critters Strategy**: Zero-flash theme application using inlined CSS variables.
- **Utility Services**: Implementation of `ThemeToggleService`, `ThemeCycleService`, and `ThemeSelectService`.
- **Dynamic Theming**: Support for `light`, `dark`, and a custom `sunset` theme.
- **Signals-based UI**: Reactive interface that updates instantly on theme changes.

## 🛠️ Development

### Running the Demo
From the root of the workspace:
```bash
pnpm start
```
Or specifically:
```bash
ng serve demo-ngx-theme-stack
```

### Syncing Configuration
If you modify the themes in `appConfig`, the configuration will sync automatically when starting the dev server (`pnpm start`). You can also run the sync command manually:
```bash
pnpm run ngx-theme-stack:sync
```

## 🏗️ Structure
- `src/app/app.config.ts`: Library configuration.
- `src/themes.css`: Theme tokens and variables.
- `src/index.html`: Injected anti-flash script and critters trick.
