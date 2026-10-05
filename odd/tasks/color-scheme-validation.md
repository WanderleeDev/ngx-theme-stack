# Consolidate `auto` and fix the unvalidated scheme prompt

## Context

The `color-scheme` feature (see `theme-color-scheme.md`) shipped with two
defects that were only visible while testing it by hand:

1. **`'none'` was a duplicate.** It was the same code path as `'auto'` (both call
   `removeProperty('color-scheme')`), so it offered two spellings for one
   behaviour. Since `3.10.0-next.0` is a prerelease and `'none'` never reached a
   stable release, this was the moment to drop it.

2. **The scheme prompt validated nothing.** It stored whatever the user typed, and
   `buildProvideCall` interpolated it verbatim into `app.config.ts`. Typing
   `banana` therefore produced an app that **does not compile**:

   ```
   error TS2322: Type '"banana"' is not assignable to type 'NgColorScheme | undefined'
   ```

## Scope (approved)

Consolidate `auto`, make the prompt explain the options and fall back to `auto`,
and make `sync` do the same. Items 2 and 3 from the audit (validating theme
*names*, and a runtime whitelist) were explicitly deferred.

### Changes

| Area | Change |
| --- | --- |
| `lib/types.ts` | `NgColorScheme = 'light' \| 'dark' \| 'auto'`. `'none'` removed. |
| `lib/core/core-theme.service.ts` | Hint removal now keyed on `scheme === 'auto'` only. |
| `schematics/ng-add/constants.ts` | New `COLOR_SCHEMES`, `DEFAULT_COLOR_SCHEME`, `parseColorScheme()`. Duplicated from the lib on purpose (schematics are CommonJS and cannot import the ESM library), with the same KEEP-IN-SYNC warning used for `DEFAULT_THEMES`. |
| `schematics/ng-add/index.ts` | The prompt lists `light`/`dark`/`auto` and what each does, states that anything else falls back to `'auto'`, and warns when it does. The `[y/N]` gate before it was removed. |
| `schematics/utils/theme-input.ts` | Validates `scheme`. An invalid value is dropped (the entry behaves as scheme-less) and reported via `invalidSchemes`. |
| `schematics/sync/index.ts` | Warns for each dropped invalid scheme instead of silently rewriting it. |
| `schematics/utils/anti-flash-script.ts` | Generated JS checks `sc==='auto'` only. |
| docs | README table, skill template, regenerated `.agents/**`, re-synced demo. |

### Prompt flow change (flagging it)

The previous flow asked `Do your custom themes need explicit color-scheme hints?
[y/N]` and **defaulted to no**, so most users never saw the explanation. That
gate was removed: the explanation is printed, then each custom theme is asked
once, and Enter accepts `auto`. Only custom themes are asked; built-ins keep
their implicit hint. Reverting to a gate is a one-line change if the extra
prompt is unwanted.

## Verification

- `pnpm exec ng test ngx-theme-stack --watch=false` → **117 passed** (was 110;
  +7 for `parseColorScheme` and the invalid-scheme paths).
- `tsc --noEmit` clean for `tsconfig.lib.json`, `tsconfig.schematics.json`, and
  `tsconfig.spec.json`.
- `pnpm exec ng lint ngx-theme-stack` clean.
- `pnpm run build:lib`, `pnpm run build:demo` OK.
- `pnpm run ngx-theme-stack:sync` regenerated the demo's `index.html`; its
  anti-flash script now reads `sc==='auto'` and contains no `'none'`.
- `node scripts/verify-publish-guards.mjs` still passes.

## Incident during verification: the stale Angular cache

Bisecting with `git stash` / `git checkout --` produced a misleading result: the
library suite crashed the vitest worker with `Worker exited unexpectedly` and
**no** `Caused by` line, and it crashed even with only part of the change
applied. The cause was a corrupted `.angular/cache` incremental state left by
repeatedly reverting and restoring the same files. Deleting `.angular/cache` and
re-running passed 117 tests with the full change set.

**Rule for this repo**: when bisecting library changes, remove `.angular/cache`
between runs, or the incremental build state will lie to you.

## Deferred

- **Item 2** — validate theme *names* against `/^[a-zA-Z][a-zA-Z0-9_-]*$/`, the
  rule the anti-flash script and the runtime already enforce. A name like
  `2lucky` or `lucky theme` is accepted by the schematic but makes the anti-flash
  fall back to the default theme on first paint (a flash), and produces
  `<div class="lucky theme">` (two classes) in the critters trick.
- **Item 3** — runtime whitelist, so a hand-written config bypassing the types
  cannot push an arbitrary string into `setProperty('color-scheme', ...)`.
