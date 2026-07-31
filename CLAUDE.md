# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build       # Production build → dist/bundle.js
yarn watch       # Build with file watching
yarn dev         # Dev server with HMR (serves dist/, allows all hosts for HA integration)
yarn lint        # ESLint across src/
```

There are no tests in this project.

## Architecture

This is a Home Assistant custom card boilerplate built on Preact + zustand + CSS Modules.

**Data flow:** Home Assistant calls `set hass()` and `setConfig()` on the `BoilerplateCard` web component (`src/index.tsx`). Both methods write directly into the zustand store (`src/store.ts`), which triggers reactive re-renders of the Preact tree.

**Web component → Preact bridge** (`src/index.tsx`): `BoilerplateCard extends HTMLElement` wraps the Preact render (into a lazily-created child `<div>`, not `this` directly — DOM mutation isn't allowed inside a custom element's constructor). The card itself renders into light DOM (no shadow root), but HA nests every card several Shadow DOM boundaries deep (`hui-card`, `hui-view`, `home-assistant-main`, ...), so a `<style>` tag injected into `document.head` by style-loader never reaches it — it's a different CSS tree scope. To work around this, style-loader tags its injected `<style>` with `data-card-style` (see `webpack.config.js`), and on first render `BoilerplateCard` clones that tag into its own subtree, so the CSS travels with the card regardless of where HA places it. Verify styling changes against something that actually nests the card in a Shadow DOM ancestor (a plain test page without one will falsely look fine).

**Hooks** (`src/hooks/`): All hooks read from the zustand store. They are the primary interface for card components:
- `useEntity` / `useEntities` — reactive selectors over `hass.states`
- `useHass` — raw `HomeAssistant` instance for service/API calls
- `useConfig` — typed card config (extend `Config` in `src/types.ts` for your card)
- `useUser` — current HA user plus their entity from `person.*`
- `useHistory` — fetches entity history via `hass.callApi` and appends live state changes

**Path aliases** (tsconfig `baseUrl: "."` + `"*": ["./src/*"]`): Imports like `import store from 'store'` resolve to `src/store.ts`. webpack mirrors this via `tsconfig-paths-webpack-plugin`.

**CSS Modules** (`webpack.config.js`): `.module.css` files are processed by css-loader (with `esModule: false` to fix webpack harmony import interop) and injected at runtime by style-loader. Class names are generated as `[local]--[hash:base64:5]`. The TypeScript declaration for `*.module.css` imports lives in `src/declarations.d.ts`.

**Preact/React aliasing** (webpack config): `react` and `react-dom` are aliased to `preact/compat`, so React-ecosystem libraries work without modification.

**ESLint** (`eslint.config.mjs`): ESLint 9 flat config using `typescript-eslint` (unified package) + `eslint-plugin-react` + `eslint-plugin-react-hooks`. No airbnb config — it doesn't support the flat config format.

## Customization entry points

- `src/types.ts` — extend `Config` with your card's YAML config fields
- `src/card/index.tsx` + `src/card/card.module.css` — the root card component and its styles; replace the demo content here
- `src/index.tsx` — change `customElements.define('boilerplate-card', ...)` and the `window.customCards` entry to rename the card

## Deployment

Build produces `dist/bundle.js`. In Home Assistant, add it as a Lovelace resource and reference the card type in dashboard YAML. During development, `yarn dev` starts a webpack dev server that can be added as a resource URL pointing at `http://<your-machine>:8080/bundle.js`.
