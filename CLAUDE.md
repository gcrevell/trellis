# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@zupre/core` — the generic, product-agnostic base that Home Assistant custom Lovelace
cards are built on: the zustand store + Preact context (`src/store.ts`), the hooks
(`src/hooks/`), the `<ha-form>` wrapper (`src/editor/HaForm.tsx`), the minimal `BaseConfig`
type (`{ type: string }`, the only field every Lovelace card config is guaranteed to have),
and the shared webpack config factory (`webpack.base.js`).

**This package is built, and `dist/` is committed to git.** `main` is `dist/index.js`,
`types` is `dist/index.d.ts`, and `yarn build` (tsc) produces both.

Committing a build artifact looks wrong; it is load-bearing. Yarn 1 resolves a
`github:owner/repo#ref` dependency through its GitHub resolver, which downloads a
**codeload tarball** of that ref instead of cloning it — and the tarball path never runs
the package's `prepare` script. So a consumer gets exactly the files tracked in git at that
ref, and nothing builds anything on the way in. While `dist/` was gitignored, every
consumer installed a package whose `main` pointed at a file that wasn't there; webpack
reported it as `Can't resolve '@zupre/core'`, several layers away from the cause. (It looked
fine locally, because a `file://` git dependency *does* take the clone path and *does* run
`prepare`.)

Both workflows guard this: they build and then fail if the committed `dist/` differs from
what was just built. If you change anything under `src/`, run `yarn build` and commit the
result in the same change.

This repo was split out of [zupre](https://github.com/gcrevell/zupre), which held the base
and the card products together in one yarn-workspaces monorepo. History before the split is
preserved here, so some commit messages refer to card products (room-card, the monorepo
restructure) that live in the other repo — only their base-affecting changes are here.

## Commands

```bash
yarn install                    # also runs `prepare`, which builds dist/
yarn lint                       # ESLint across src/
yarn test                       # vitest run — src/ and scripts/
yarn build                      # tsc -p tsconfig.build.json -> dist/
node scripts/release-plan.mjs   # what a merge to main would release, and why
```

## Versioning and releases

Tagged `v<semver>`, one line for the whole package. **The released version lives in the git
tag, not in a committed file** — `scripts/release-plan.mjs` decides it:

| Situation | Released version |
|---|---|
| No tag yet | `package.json`'s version (first release) |
| PR left `package.json` alone | last tag with **patch + 1** |
| PR set version *above* the last tag (1.1.0, 2.0.0) | exactly that version |
| Nothing changed under `src/`, `dist/`, `webpack.base.js`, the tsconfigs, `package.json` or `yarn.lock` | skipped — a docs-only merge cuts no version |

So `package.json`'s `version` is a *floor* — how a human asks for a minor or major bump —
not a running total. It legitimately goes stale (it may say `1.0.0` while tags are at
`1.0.7`); the tag is the source of truth. Deriving from tags means CI never commits a
version bump back, so it can't retrigger itself.

`.github/workflows/ci.yml` runs lint/test/build plus both `dist/` guards on every PR, and
prints the version a merge would cut. `.github/workflows/release.yml` re-runs all of it on
merge to `main`, then creates the release — which creates the tag at that merge commit, so a
tag always points at a verified tree. Each release carries `zupre-core-<version>.tgz` from
`yarn pack`; that is an escape hatch, not the consumption path.

**Nothing auto-bumps consumers.** A card repo pins `"@zupre/core":
"github:gcrevell/trellis#v1.0.0"` and moves when it chooses to. That deliberate step is the
point of leaving `#main` behind — `#main` is a moving target that silently re-resolves on
every `yarn install`, so a card build was never reproducible and could never say which base
it was built against.

## Architecture

**Store** (`src/store.ts`): a zustand store holding `hass` and `config`, exposed to the
Preact tree through a context so each card instance gets its own store rather than a shared
singleton. The consuming card's web component writes into it from `set hass()` and
`setConfig()`; every hook here is a reactive selector over it.

**Hooks** (`src/hooks/`): `useEntity` / `useEntities` (selectors over `hass.states`),
`useHass` (raw `HomeAssistant` instance), `useConfig` (returns `BaseConfig | undefined`),
`useUser`, `useHistory`. `useConfig` intentionally stays generic — a consuming card wraps it
locally to cast to its own richer config type rather than threading a type parameter through
the store and context.

**`webpack.base.js`**: a factory taking `{ entry, outputFilename, outputPath }` and returning
a full webpack config, so loader rules live here once instead of being copy-pasted per card.
Two things in it are load-bearing:

- **CSS Modules class names** are generated as `<outputFilename-without-.js>-[local]--[hash:base64:5]`.
  The per-card prefix is not cosmetic: `[hash:base64:5]` alone collides identically across
  card bundles for any class name that appears in more than one of them (confirmed
  empirically — the hash depends only on the class name, not the file's path or content).
  Because every card clones *every* `<style data-card-style>` tag it finds in `document.head`
  into its own subtree, not just its own, an unprefixed collision lets one card's CSS silently
  override another's when two cards share a class name on the same dashboard. Keep the prefix.
- **`react` / `react-dom` are aliased to `preact/compat`**, so React-ecosystem libraries work
  unmodified. `vitest.config.mts` mirrors this, and it isn't optional there either — zustand
  has an optional `react` import that vitest otherwise fails to resolve.

**Style injection**: cards render into light DOM, but HA nests every card several Shadow DOM
boundaries deep (`hui-card`, `hui-view`, `home-assistant-main`, ...), so a `<style>` tag that
style-loader injects into `document.head` never reaches them — different CSS tree scope. The
workaround is split across repos: style-loader here tags its injected `<style>` with
`data-card-style`, and each card clones matching tags into its own subtree on first render.
Verify styling changes against something that actually nests the card under a Shadow DOM
ancestor; a plain test page without one will falsely look fine.

## Consuming this package

A card repo depends on `@zupre/core` as an ordinary git dependency pinned to a tag:

```json
"@zupre/core": "github:gcrevell/trellis#v1.0.0"
```

It resolves through **normal node_modules lookup** — no `compilerOptions.paths` mapping, no
alias. That works precisely because `dist/` is committed (above): what lands in the
consumer's `node_modules` is built JavaScript plus declarations, so ts-loader's
`exclude: /node_modules/` rule is correct rather than a problem. Do not point a consumer at
this `src/` directory; that was the old arrangement, from when the base was a sibling
workspace, and it is what the committed build replaces.

Jest is the one exception. `packages/printer-card/jest.config.js` in the card repo maps
`@zupre/core` to `@zupre/core/src/index.ts`, because tsc emits ES modules that Jest cannot
`require` — `src/` is in the published `files` list for exactly this reason.

`src/declarations.d.ts` declares the `ha-form` JSX intrinsic so this package type-checks
standalone. It is never `import`ed by name, so nothing pulls it into a consumer's TypeScript
program — **any consuming package that renders `<ha-form>` directly needs its own copy of
that three-line declaration.** Adding this `src/` to the consumer's `tsconfig.json`
`include` looks like the fix; don't — it was tried and it broke JSX resolution for every
standard intrinsic (`div`, `span`, ...) across the whole consuming program.

## ESLint

`eslint.config.mjs` is an ESLint 9 flat config using `typescript-eslint` (unified package) +
`eslint-plugin-react` + `eslint-plugin-react-hooks`, scoped to `src/**/*.{ts,tsx}`. No airbnb
config — it doesn't support the flat config format.
