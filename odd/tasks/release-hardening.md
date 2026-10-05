# Release Hardening — `latest` only from `main`

## Context

`publish.yml` published to the `latest` dist-tag based on a single heuristic:
whether the ref name contained a `-`.

That heuristic is correct for prereleases, but it had two holes:

1. **A stable tag created outside `main` still published to `latest`.**
   Tag `v4.0.0` on a feature branch → no `-` → `npm publish` → `latest`.
2. **`workflow_dispatch` published to `latest` from any branch.**
   `github.ref_name` for a manual run is the branch (`dev`), which has no `-`,
   so the `else` branch ran and published whatever version was in the manifest.

`latest` is what `npm install ngx-theme-stack` resolves for everyone, so
unstable code must never reach it.

## Scope (option A — approved)

`dev` keeps its name and remains the channel for `next` prereleases.

Two guards added to `publish.yml`, before the install/build/publish steps:

| Guard | Applies when | Rejects when |
| --- | --- | --- |
| A stable tag must live on `main` | `ref_type == 'tag'` and the tag has no `-` | the tagged commit is not an ancestor of `origin/main` |
| A manual publish must run from `main` | `event_name == 'workflow_dispatch'` | `ref_name != 'main'` |

Plus `fetch-depth: 0` on checkout: the first guard asks
`git merge-base --is-ancestor "$GITHUB_SHA" origin/main`, and the default
`fetch-depth: 1` leaves no remote-tracking refs, so the check would fail closed
and reject **every** valid release.

Prereleases keep working untouched: a tag containing `-` skips both guards and
is published under the `next` dist-tag.

## Verification

`scripts/verify-publish-guards.mjs` extracts the guard `run:` bodies **from the
workflow file** (not a copy) and executes them with real SHAs from this repo.
It also asserts the mirrored `if:` evaluators are byte-identical to the ones in
the workflow, so the mirror cannot drift silently.

```bash
node scripts/verify-publish-guards.mjs
```

| Scenario | Expected | Result |
| --- | --- | --- |
| 1. stable tag ON main | pass | PASS |
| 2. stable tag OFF main | fail | PASS — `::error::Stable tag 'v4.0.0' is not an ancestor of main` |
| 3. prerelease tag on dev | guards skip | PASS |
| 4. manual dispatch from dev | fail | PASS — `::error::Manual publish is only allowed from 'main'` |
| 5. manual dispatch from main | pass | PASS |

Also verified: the workflow parses as valid YAML and the step order is intact.

## Decisions taken

- **Branch name**: `dev` stays. A rename to `next` (for symmetry with the
  dist-tag) was offered and declined.
- **No OIDC migration yet**: `NPM_TOKEN` remains. Tracked as follow-up B.
- **No LTS machinery yet**: the project has a single live major (3.x). Tracked
  as follow-up C.

## Follow-ups (not in this unit)

- **B** — migrate to npm trusted publishing (OIDC), dropping the long-lived
  `NPM_TOKEN` and getting provenance automatically.
- **C** — full channel model: `release/N.x` branches + `vN-lts` dist-tags.
- Wire `scripts/verify-publish-guards.mjs` into CI so guard edits are checked.
- Observation, unchanged: `deploy.yml` deploys the public demo only on a push to
  `main`, never on a tag. Publishing `next` therefore leaves the demo untouched.
- Observation, unchanged: the GitHub Release step passes the **whole**
  `CHANGELOG.md` as release notes for every release, not just the new section.
- Observation, unchanged: every prerelease currently maps to the `next`
  dist-tag, so an `rc` tag would also land on `next`.
