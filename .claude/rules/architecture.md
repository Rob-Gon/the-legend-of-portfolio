# Architecture

## Layout

```
index.html                 App shell (title + hub). Meta/OG injected at build.
quick/index.html           Quick mode ES — generated at build
en/quick/index.html        Quick mode EN — generated at build
public/data/{es,en}/       ui, profile, quests, sidequests, projects, tech, softskills (.json)
public/{audio,models,img,cv}/
src/main.js                Bootstrap order: prefs → device → i18n/data → router → screens
src/core/                  bus, store, sections, router, input, i18n, data, prefs, device, experience, dom
src/components/            panel, list-row, grid, tabs, detail-card, button-hints, hud, sheet, menu, music, fairy, toast
src/screens/               title, guide, hub, journal, inventory, system
src/audio/audio.js         Howler wrapper (lazy)
src/three/                 viewer, tech-icon, avatar (lazy chunk, desktop only)
src/render/quick.js        Pure string renderers, shared with the build plugin
src/styles/                tokens/ base/ components/ layouts/ main.scss
build/                     vite-plugin-static-pages.js
schemas/                   JSON Schemas for public/data
tests/unit/ tests/e2e/
```

## Module contracts

- **bus** (`core/bus.js`): one native `EventTarget`. Events: `action`, `state:change`,
  `ui:sfx`, `data:error`. No custom emitter class.
- **store** (`core/store.js`): one plain state object + `set(patch)` that emits
  `state:change` with the changed keys. State: `lang`, `route`, `section`, `tab`,
  `selection`, `prefs`, `device`. Data is not in the store; `data.js` caches it.
- **router** (`core/router.js`): pure `parse(hash)` / `format(state)` (unit-tested) + wiring.
  `pushState` on section/tab change, `replaceState` on selection change. Unknown → `#/inicio`.
- **input** (`core/input.js`): the only place that reads keyboard, gamepad, pointer and touch.
  Emits normalised actions. See `input-navigation.md`.
- **screens**: each exports `mount(root)`, `update(changedKeys)`, `handle(action) → boolean`.
  Unhandled actions bubble to `hub.js` (section/tab switching).
- **data** (`core/data.js`): `load(lang, file) → {ok, data} | {ok: false, error}`. Never throws
  to callers. Caches per language. Filters `_placeholder` items in production.
- **experience** (`core/experience.js`): pure month/year maths from job periods (inclusive).

## Patterns

- DOM is created with `el(tag, attrs, children)` from `core/dom.js`, text via `textContent`.
  **Never `innerHTML` with data.** Rich text only via the `{{highlight}}` parser.
- Pure logic (router, input mapping, i18n, data, experience, highlight parser) lives in
  side-effect-free functions so Vitest can test it without a browser.
- Lazy features (`audio`, `three`) are loaded with dynamic `import()` and fail soft: catch,
  toast once, disable the feature.
- No global singletons beyond `bus` and `store`. No framework-like abstractions (no virtual
  DOM, no component base class).
- Keep `src/render/quick.js` free of DOM APIs: it must run in Node during the build.
