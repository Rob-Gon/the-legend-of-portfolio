# The Legend Of Portfolio - Roberto Of The Wild

<!-- This file overrides the global rules in ~/.claude/. Detailed project rules live in .claude/rules/. -->

## Project

Static personal portfolio of Roberto Báez González (full-stack web developer), aimed at
recruiters and clients. The UI is a fan homage to the *structure and feel* of the pause menu of
*Breath of the Wild*: title screen → hub with three sections switched with L / R
(Adventure Log · Inventory · System), plus a plain **Quick mode** page.
All content comes from hand-edited JSON. No backend, no database.

Unofficial fan project, not affiliated with Nintendo. The repository is **public**.

Full plan, decisions and content proposal: `docs/PROJECT_BRIEF.md`.

## Stack & versions

- Node 22 · npm (only npm, never mix package managers)
- Vite · semantic HTML · SCSS (Dart Sass) · **vanilla JavaScript ES modules, no framework,
  no TypeScript, no type checking**
- Howler.js (audio) · Three.js (desktop-only lazy chunk)
- ESLint + Prettier · Stylelint (SCSS) · Vitest (+ jsdom) · Playwright (Chromium smoke test)

## Local environment

- `npm run dev` (Vite dev server). **Not Laragon**: no `.test` virtual host, no PHP, no MySQL.
- No `.env` and no secrets: the site is fully static.

## Commands

- install: `npm ci`
- dev:     `npm run dev`
- test:    `npm test` (Vitest) · `npm run test:e2e` (Playwright, against `vite preview`)
- lint:    `npm run lint` (ESLint + Stylelint + Prettier check) · `npm run format`
- build:   `npm run build` · `npm run preview`

## Architecture

- `src/core/` — bus (native `EventTarget`), store, router, input, i18n, data, prefs, device,
  experience, dom helpers
- `src/components/` — UI building blocks · `src/screens/` — title, hub, journal, inventory, system
- `src/audio/`, `src/three/` — lazy-loaded features · `src/render/quick.js` — pure renderers
  shared with the build plugin
- `public/data/{es,en}/*.json` — all content and UI strings · `schemas/` — JSON Schemas
- `build/vite-plugin-static-pages.js` — Quick mode prerender, meta/OG, sitemap

Details: `.claude/rules/architecture.md`.

## Project conventions (override global rules)

- **No Laravel / PHP / Laragon / MySQL.** Global rules `06-backend-laravel.md` and the Laragon
  section of the global `CLAUDE.md` do not apply. Pint, PHPStan, Pest, `composer audit` do not apply.
- **Frontend stack is fixed** (above). Global suggestion "Blade + Alpine + Tailwind" does not apply.
- **No TypeScript and no JSDoc type checking** (owner's decision), overriding the global
  "TypeScript in new code" preference.
- Phased work: never start the next phase or milestone without the owner's OK
  (see `docs/PROJECT_BRIEF.md` §8). Each milestone ends with green tests, a commit (only after the
  owner's OK) and a stop. Commits carry no authorship trailers (no `Co-Authored-By`).
- Every visible string comes from JSON (`ui.json` or content files). No hard-coded copy in JS
  or HTML, except the minimal fallback error shown when `ui.json` itself fails to load.
- Chat with the owner in Spanish; code, comments, commits and docs in English. Content JSON is
  in Spanish (`es/`) and English (`en/`).

## Deploy

- Platform: **GitHub Pages via GitHub Actions** (not Forge, not a VPS). Global rule
  `08-deploy-maintenance.md` does not apply except its general advice on CI.
- Repo: `the-legend-of-portfolio` → Vite `base: '/the-legend-of-portfolio/'`.
- Branch deployed: `main`, only after lint, tests, build and e2e pass.
- Environments: local (`npm run dev`) · production (`https://rob-gon.github.io/the-legend-of-portfolio/`).

Details: `.claude/rules/deploy.md`.

## External services & integrations

None at runtime. Fonts are self-hosted. GitHub API is only used manually while writing content.

## Do not touch

- `docs/sources/` (CVs and LinkedIn export): read-only, git-ignored, never copied elsewhere
  except the CV PDFs into `public/cv/` (approved).
- `docs/references/` and any game screenshot: local only, git-ignored.
- Never publish: the Grupo ARI ERP's internal product name, Crealia IT client names, phone
  number or age in JSON/HTML (the CV PDFs are published as they are, by the owner's decision).
  See `.claude/rules/content-data.md`.
- Never add Nintendo assets (see `.claude/rules/assets-ip.md`).
