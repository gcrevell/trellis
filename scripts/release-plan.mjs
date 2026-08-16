#!/usr/bin/env node
// Decides whether the current HEAD should cut a release, and at what version.
//
// The released version lives in the git tag (`v<semver>`), not in a committed
// file. Deriving it from tags means CI never has to push a version bump back to
// `main` — no commit-back, no risk of the release workflow retriggering itself.
//
// package.json's `version` is therefore a *floor*, not a running total. It is
// how a human asks for a minor or major bump:
//
//   declared > last tag   -> release exactly `declared` (an intentional bump)
//   otherwise             -> release last tag with patch + 1
//   no tag at all         -> release `declared` (first release)
//
// So a PR that leaves package.json alone gets an automatic patch bump, and a
// PR that sets version to 1.1.0 or 2.0.0 gets exactly that. The declared
// version legitimately goes stale (it may say 1.0.0 while tags are at 1.0.7);
// the tag is the source of truth.
//
// Nothing auto-bumps consumers. A card repo pins `#v<semver>` and moves when it
// chooses to — that deliberate step is the whole point of leaving `#main`
// behind.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Paths that can change what a consumer actually installs. `dist/` is in here
// because it is tracked (see CLAUDE.md — yarn fetches `github:` deps as a
// tarball and never runs `prepare`, so an untracked build never ships), and a
// docs-only merge deliberately cuts no version.
const RELEASE_PATHS = [
  'src',
  'dist',
  'webpack.base.js',
  'package.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'yarn.lock',
];

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export function parseSemver(value) {
  const match = SEMVER.exec(String(value).trim());
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
    raw: String(value).trim(),
  };
}

// Returns > 0 when a is newer than b. A prerelease sorts below its release
// (1.2.0-rc1 < 1.2.0), which is all the prerelease handling this repo needs.
export function compareSemver(a, b) {
  for (const part of ['major', 'minor', 'patch']) {
    if (a[part] !== b[part]) {
      return a[part] - b[part];
    }
  }
  if (a.prerelease === b.prerelease) {
    return 0;
  }
  if (a.prerelease === null) {
    return 1;
  }
  if (b.prerelease === null) {
    return -1;
  }
  return a.prerelease < b.prerelease ? -1 : 1;
}

export function bumpPatch(version) {
  return `${version.major}.${version.minor}.${version.patch + 1}`;
}

export function tagFor(version) {
  return `v${version}`;
}

function latestTag() {
  let output = '';
  try {
    output = git('tag', '--list', 'v*');
  } catch {
    return null;
  }

  const versions = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((tag) => parseSemver(tag.slice(1)))
    .filter(Boolean);

  if (versions.length === 0) {
    return null;
  }
  return versions.sort(compareSemver)[versions.length - 1];
}

// "Has anything a consumer would notice changed since the last release?"
// Comparing against the tag rather than the previous commit means a run that
// failed halfway does not lose changes — the next merge still sees them.
function changedSince(tag) {
  try {
    return git('diff', '--name-only', `${tag}..HEAD`, '--', ...RELEASE_PATHS).length > 0;
  } catch {
    // Tag unreachable (shallow clone, or a tag pointing outside this history).
    // Assume changed: a redundant release is far cheaper than a missed one.
    return true;
  }
}

export function plan({ force = false } = {}) {
  const declaredRaw = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  const declared = parseSemver(declaredRaw);
  if (!declared) {
    throw new Error(`package.json has an unparseable version: ${declaredRaw}`);
  }

  const previous = latestTag();
  const base = { declared: declared.raw, previous: previous?.raw ?? null };

  if (!previous) {
    return { ...base, release: true, version: declared.raw, reason: 'first release' };
  }

  if (compareSemver(declared, previous) > 0) {
    return {
      ...base,
      release: true,
      version: declared.raw,
      reason: `package.json declares ${declared.raw}, above the last released ${previous.raw}`,
    };
  }

  const changed = changedSince(tagFor(previous.raw));
  if (!changed && !force) {
    return { ...base, release: false, version: null, reason: `unchanged since ${previous.raw}` };
  }

  return {
    ...base,
    release: true,
    version: bumpPatch(previous),
    reason: changed ? `changes since ${previous.raw}` : 'forced',
  };
}

function main() {
  const result = plan({ force: process.argv.includes('--force') });
  const verdict = result.release ? `release ${tagFor(result.version)}` : 'skip';

  // Human summary on stderr, machine-readable plan on stdout, so the workflow
  // can pipe this straight into jq without losing the explanation from the log.
  process.stderr.write(`${verdict} (${result.reason})\n`);
  process.stdout.write(JSON.stringify(result));
}

// Only run when invoked directly, so the pure helpers above stay unit-testable.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
