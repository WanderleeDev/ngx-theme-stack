# NgxThemeStack Workspace 🏗️

Welcome to the monorepo workspace for **ngx-theme-stack**. This repository contains the core library, schematics, and the official documentation/demonstration applications.

---

## 📁 Project Structure

*   **[`projects/ngx-theme-stack/`](./projects/ngx-theme-stack/)** - The core Angular library source code.
*   **[`projects/ngx-theme-stack/schematics/`](./projects/ngx-theme-stack/schematics/)** - Angular CLI schematics to automate library setup (such as `ng add`).
*   **[`projects/demo-ngx-theme-stack/`](./projects/demo-ngx-theme-stack/)** - Official demonstration application showcasing the zero-flash, signal-driven theme stack (also available as an [Interactive StackBlitz Demo](https://stackblitz.com/~/github.com/WanderleeDev/stackblitz-demo)).

---

## 🚀 Quick Start for Contributors

To set up the workspace locally, follow these steps:

### 1. Install Dependencies
This project uses **pnpm** as its package manager:
```bash
pnpm install
```

### 2. Quick Development Commands
Run these commands from the root directory:

| Task | Command | Description |
| ---- | ------- | ----------- |
| **Start Demo** | `pnpm start` | Launches the local dev server for the demo application. |
| **Build Library** | `pnpm build:lib` | Compiles the library and its schematics into the `dist/` directory. |
| **Run Tests** | `pnpm test` | Runs the test suites for the library and its services. |
| **Lint** | `pnpm lint` | Validates code style and quality across the workspace. |

---

## 🤝 Contribution Guidelines

We use conventional commits and structured branching to keep the history clean.

### Commit Messages
Please follow the **Conventional Commits** specification (e.g., `feat(lib): add support for custom strategy` or `fix(schematics): resolve config paths`).

### Development Workflow
1. Fork the repository and create your feature branch (`git checkout -b feature/my-new-feature`).
2. Implement your changes. Make sure to run `pnpm test` and `pnpm lint` to verify that everything builds and passes.
3. Commit your changes using conventional commits, push to your fork, and open a Pull Request.

---

For technical details on how to use the library in your own project, please refer to the **[Library README](./projects/ngx-theme-stack/README.md)**.
