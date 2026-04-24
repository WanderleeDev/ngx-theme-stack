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
If you modify the themes in `appConfig`, run the sync command to refresh `index.html`:
```bash
pnpm prebuild
```

## 🏗️ Structure
- `src/app/app.config.ts`: Library configuration.
- `src/themes.css`: Theme tokens and variables.
- `src/index.html`: Injected anti-flash script and critters trick.
