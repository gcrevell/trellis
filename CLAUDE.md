# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@zupre/core` — the generic, product-agnostic base that Home Assistant custom Lovelace
cards are built on: the zustand store + Preact context (`src/store.ts`), the hooks
(`src/hooks/`), the `<ha-form>` wrapper (`src/editor/HaForm.tsx`), the minimal `BaseConfig`
type (`{ type: string }`, the only field every Lovelace card config is guaranteed to have),
and the shared webpack config factory (`webpack.base.js`).

**There is no build script, and that's deliberate.** This package is never bundled on its
own — consuming card repos compile it as TypeScript source into their own bundle. `main`
points at `src/index.ts`, not at a `dist/`.

This repo was split out of [zupre](https://github.com/gcrevell/zupre), which held the base
and the card products together in one yarn-workspaces monorepo. History before the split is
preserved here, so some commit messages refer to card products (room-card, the monorepo
restructure) that live in the other repo — only their base-affecting changes are here.

## Commands

```bash
yarn install
yarn lint        # ESLint across src/
yarn test        # vitest run
```

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

A card repo depends on `@zupre/core` and must resolve it **to this source directory, not
through node_modules package resolution** — ts-loader's rule excludes `node_modules/`, so an
import resolving through a symlink there would leave core's TypeScript silently uncompiled.
Map the bare specifier to the checkout path via `compilerOptions.paths` in the consumer's
`tsconfig.json` (resolved at build time by `tsconfig-paths-webpack-plugin`), so webpack sees
these files as ordinary first-party source.

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
