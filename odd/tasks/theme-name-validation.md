# Theme name validation, and centralizing the values shared with the schematics

## Context

Two things surfaced while testing the `color-scheme` prerelease by hand.

**1. Nothing validated a theme name.** `provideThemeStack()` only checked that a
name was not empty, while `types.ts` documented a pattern and the anti-flash
script enforced a *different* one. Declaring a bad name degraded silently:

| Name | What actually happened |
| --- | --- |
| `2lucky` | `.2lucky` is invalid CSS (esbuild: `Unexpected ".2lucky"`), the browser drops the rule, and the theme silently loses its styles |
| `lucky theme` | `classList.add` throws `InvalidCharacterError` |
| `lucky.theme` | `.lucky.theme` matches two classes while the class token is the single string `lucky.theme`, so the styles never apply — with no error at all |

**2. The shared values were duplicated with a "KEEP IN SYNC" comment**, which is a
promise rather than a mechanism. There were four copies: `DEFAULT_THEMES`,
`DEFAULTS`, `COLOR_SCHEMES`, and now the theme-name pattern.

## Why the duplication existed

Not laziness — a hard compile-unit boundary, measured with a probe:

```
error TS6059: File '.../src/lib/types.ts' is not under 'rootDir' '.../schematics'.
              'rootDir' is expected to contain all source files.
```

| Unit | Config | Output |
| --- | --- | --- |
| Schematics | `rootDir: "schematics"`, `module: commonjs` | `dist/.../schematics/` |
| Library | ng-packagr from `src/public-api.ts` | `dist/.../fesm2022/` (ESM) |

One source file cannot belong to both.

## What was done

### The rule (unchanged policy: ASCII-only)

```
/^-?[a-zA-Z_][a-zA-Z0-9_-]*$/
```

Two fixes over the old `/^[a-zA-Z][a-zA-Z0-9_-]*$/`:

- it accepts `_lucky` and `-lucky`, which are valid CSS and worked in
  `classList`, but the old pattern rejected (causing an unnecessary flash);
- it is now **enforced**, so what used to be a silent runtime degradation is a
  build error.

Non-ASCII names (`sueño`, `café`) stay rejected **on purpose**: a narrower,
easy-to-reason-about subset. They are valid CSS, so this is a documented policy
choice, not a bug. The README and the skill say so explicitly.

### Enforcement

| Where | Behaviour |
| --- | --- |
| `provideThemeStack()` | throws `NgxThemeStackError` with the pattern and the reason |
| `ng-add` prompt | re-asks the whole list, printing why each name was rejected |
| `sync` | reports invalid names through `parseThemeInputArray().invalidNames` |
| anti-flash inline script | keeps validating — see below |

### The inline guard was kept, not simplified

An earlier proposal was to drop the anti-flash regex as redundant, since that
line also checks `v.indexOf(t) !== -1`. That was rejected, correctly: the value
comes from `localStorage`, which anyone with browser access can write, and the
declared list it is compared against is a plain, hand-editable array in
`index.html`. It runs before Angular and writes to `classList` and to an
attribute, so it validates on its own. Defence in depth, ~30 bytes. It now uses
the same pattern, so it no longer flashes `_lucky` / `-lucky`.

### Centralization (replaces the "KEEP IN SYNC" comments)

`scripts/generate-schematic-constants.mjs` copies the library-owned values into
`schematics/ng-add/generated-config.ts`. The library is the source of truth; the
schematic copy is generated.

- Extraction uses the **TypeScript compiler API**, not regular expressions, so it
  does not break on formatting, comments or trailing commas.
- The canonical values are exposed as **strings and string arrays**
  (`NG_COLOR_SCHEMES`, `THEME_NAME_SOURCE`), and both sides build their `RegExp`
  with `new RegExp(...)`. That removes the whole class of escaping bugs from the
  inlined script.
- Wired to `prebuild`, so `pnpm run build` (the schematics build) regenerates
  first and the copy cannot go stale.
- The generated file is **committed** (CI runs tests before `build:lib`, so a test
  importing it must find it without a prior build) and carries an
  AUTO-GENERATED header.

One mechanism replaces four duplicated value sets.

## Verification

- **138 tests pass** (was 117).
- `tsc --noEmit` clean for `tsconfig.lib.json`, `tsconfig.schematics.json`,
  `tsconfig.spec.json`.
- `ng lint ngx-theme-stack` clean; `build:lib` and `build:demo` OK; publish
  guards 5/5.
- The generator is idempotent (`unchanged` on a second run).
- **The drift test was verified by breaking it**: the generated pattern was
  tampered with by hand and the suite failed with 2 errors (`copies the theme
  name pattern source` and `agrees with the library on the names it accepts`).
  A drift test that never fails is worthless, so this was checked on purpose.
- The demo's `index.html` was re-synced and its inline script now reads
  `if(!/^-?[a-zA-Z_][a-zA-Z0-9_-]*$/.test(t)`, proving the
  generator → constants → inline-script chain end to end.

## Follow-ups

- `item 3` from the earlier audit is now covered for names; a runtime whitelist
  for `scheme` values in a hand-written config is still open.
- The `[Y/n]` prompt for the agent skill treats any input other than `n` as yes.
  Inconsistent with the other prompts, and untouched.
