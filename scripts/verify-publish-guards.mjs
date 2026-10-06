#!/usr/bin/env node
/**
 * Verifies the release guards in .github/workflows/publish.yml.
 *
 * Run it after touching the workflow:
 *     node scripts/verify-publish-guards.mjs
 *
 * The guard `run:` bodies are extracted FROM THE WORKFLOW FILE and executed with
 * real SHAs from this repo, so this exercises the actual shell logic CI runs
 * rather than a copy of it. The `if:` conditions are mirrored below, but the
 * harness first asserts that the mirrored strings are byte-identical to the ones
 * in the workflow, so the mirror cannot silently drift.
 *
 * Why this exists: `latest` is what `npm install ngx-theme-stack` resolves for
 * everyone. A stable tag created outside main must never reach it, and the
 * manual `workflow_dispatch` path used to reach it from any branch.
 */
import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WF = resolve(repoRoot, '.github/workflows/publish.yml');
const wf = readFileSync(WF, 'utf8');
const sh = (args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();

// ── 1. Parse steps (6-space indented "- name:") ───────────────────────────────
const lines = wf.split('\n');
const steps = [];
for (let i = 0; i < lines.length; i++) {
  const m = /^ {6}- name: (.+)$/.exec(lines[i]);
  if (!m) continue;
  const body = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^ {6}- name: /.test(lines[j]) || /^ {4,6}[a-z]+:/.test(lines[j])) break;
    body.push(lines[j]);
  }
  steps.push({ name: m[1].trim(), body: body.join('\n') });
}

const guards = steps.filter((s) => s.name.startsWith('Guard — '));
if (guards.length !== 2) throw new Error(`expected 2 guards, found ${guards.length}`);

/** Pull the shell out of a step's `run: |` block. */
function runBody(step) {
  const idx = step.body.indexOf('run: |');
  if (idx === -1) throw new Error(`no run block in "${step.name}"`);
  const after = step.body.slice(idx + 'run: |'.length).split('\n');
  const out = [];
  for (const l of after) {
    if (l.trim() === '') { out.push(''); continue; }
    if (!/^ {10}/.test(l)) break;           // dedent ends the block
    out.push(l.slice(10));
  }
  return out.join('\n');
}

function ifExpr(step) {
  const m = /^ {8}if: (.+)$/m.exec(step.body);
  return m ? m[1].trim() : null;
}

// ── 2. Assert the mirrored conditions are identical to the workflow ───────────
const EXPECTED_IF = {
  'Guard — a stable tag must live on main':
    "${{ github.ref_type == 'tag' && !contains(github.ref_name, '-') }}",
  'Guard — a manual publish must run from main':
    "${{ github.event_name == 'workflow_dispatch' }}",
};
for (const g of guards) {
  const actual = ifExpr(g);
  if (actual !== EXPECTED_IF[g.name]) {
    throw new Error(
      `if: drifted for "${g.name}"\n  expected: ${EXPECTED_IF[g.name]}\n  actual:   ${actual}`,
    );
  }
}
console.log('OK  conditions in the workflow match the mirrored evaluators\n');

/** Mirror of the `if:` expressions (asserted above). */
function applies(name, env) {
  if (name === 'Guard — a stable tag must live on main') {
    return env.GITHUB_REF_TYPE === 'tag' && !env.GITHUB_REF_NAME.includes('-');
  }
  if (name === 'Guard — a manual publish must run from main') {
    return env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  }
  throw new Error(`unknown guard: ${name}`);
}

// ── 3. Scenarios against real commits ────────────────────────────────────────
const MAIN = sh(['rev-parse', 'main']);
const DEV = sh(['rev-parse', 'dev']);
sh(['rev-parse', '--verify', 'origin/main']);          // the guard needs this ref

const scenarios = [
  { label: '1. stable tag ON main       -> must PASS', refType: 'tag', refName: 'v3.9.5', sha: MAIN, event: 'push', expect: 'pass' },
  { label: '2. stable tag OFF main      -> must FAIL', refType: 'tag', refName: 'v4.0.0', sha: DEV, event: 'push', expect: 'fail' },
  { label: '3. prerelease tag on dev    -> guards SKIP', refType: 'tag', refName: 'v3.10.0-next.0', sha: DEV, event: 'push', expect: 'skip' },
  { label: '4. manual dispatch from dev -> must FAIL', refType: 'branch', refName: 'dev', sha: DEV, event: 'workflow_dispatch', expect: 'fail' },
  { label: '5. manual dispatch from main-> must PASS', refType: 'branch', refName: 'main', sha: MAIN, event: 'workflow_dispatch', expect: 'pass' },
];

let failures = 0;
console.log(`main=${MAIN.slice(0, 7)}  dev=${DEV.slice(0, 7)}\n`);

for (const s of scenarios) {
  const env = {
    ...process.env,
    GITHUB_REF_TYPE: s.refType,
    GITHUB_REF_NAME: s.refName,
    GITHUB_SHA: s.sha,
    GITHUB_EVENT_NAME: s.event,
  };

  const active = guards.filter((g) => applies(g.name, env));
  let outcome = 'skip';
  let detail = 'no guard applies';

  for (const g of active) {
    const r = spawnSync('bash', ['-eo', 'pipefail', '-c', runBody(g)], {
      cwd: repoRoot,
      env,
      encoding: 'utf8',
    });
    if (r.status === 0) {
      outcome = 'pass';
      detail = `ran "${g.name}"`;
    } else {
      outcome = 'fail';
      detail =
        (r.stderr + r.stdout)
          .trim()
          .split('\n')
          .find((l) => l.includes('::error::')) ?? `exit ${r.status}`;
      break;
    }
  }

  const ok = outcome === s.expect;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${s.label}`);
  console.log(`      got=${outcome} expected=${s.expect}  | ${detail}`);
}

console.log(
  failures === 0 ? '\nAll scenarios behaved as required.' : `\n${failures} scenario(s) FAILED.`,
);
process.exit(failures === 0 ? 0 : 1);
