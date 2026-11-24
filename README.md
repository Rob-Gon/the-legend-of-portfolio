# The Legend Of Portfolio - Roberto Of The Wild

Personal portfolio of **Roberto Báez González**, full-stack web developer (Laravel, PHP,
JavaScript, React). The interface is a homage to the structure and feel of a classic
adventure-game pause menu: a title screen and a hub with three sections switched with
**L / R**, plus a plain, fast **Quick mode** with the same content.

> **Unofficial fan project. Not affiliated with, endorsed by or sponsored by Nintendo.**
> No Nintendo assets are used: all artwork, icons and models are original or under a
> permissive licence (see [`THIRD_PARTY.md`](THIRD_PARTY.md)).

Live site: https://rob-gon.github.io/the-legend-of-portfolio/

## Stack

Vite · semantic HTML · SCSS · vanilla JavaScript (ES modules, no framework) ·
Howler.js · Three.js (desktop only, lazy-loaded) · ESLint · Prettier · Stylelint ·
Vitest · Playwright · GitHub Actions + GitHub Pages.

## Requirements

- Node.js 22.22+ or 24.15+ (LTS) and npm

## Getting started

```bash
npm ci
npm run dev          # Vite dev server
```

## Scripts

| Command            | What it does                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `npm run dev`      | Development server with hot reload                                                                             |
| `npm run build`    | Production build into `dist/`                                                                                  |
| `npm run preview`  | Serves the production build locally                                                                            |
| `npm test`         | Unit tests (Vitest)                                                                                            |
| `npm run test:e2e` | Smoke tests (Playwright, Chromium) against the production build. First time: `npx playwright install chromium` |
| `npm run lint`     | ESLint + Stylelint + Prettier check                                                                            |
| `npm run format`   | Auto-format and auto-fix                                                                                       |

## Editing content

All text and data live in `public/data/{es,en}/*.json` — no code changes needed. See
[`.claude/rules/content-data.md`](.claude/rules/content-data.md) for the schema and the meaning
of the `_source`, `_review` and `_placeholder` fields.

## Deploy

Every push to `main` runs lint, unit tests, build and smoke tests, then deploys `dist/` to
GitHub Pages (`.github/workflows/ci-deploy.yml`). The Vite `base` is
`/the-legend-of-portfolio/`.

## Credits and licences

Third-party fonts, icons and sounds are listed in [`THIRD_PARTY.md`](THIRD_PARTY.md).
