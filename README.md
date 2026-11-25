# The Legend Of Roberto - Portfolio Of The Wild

Personal portfolio of **Roberto Báez González**, full-stack web developer (Laravel, PHP,
JavaScript, React). The interface is a homage to the structure and feel of a classic
adventure-game pause menu: a title screen and a hub with three sections switched with
**L / R**, plus a plain, fast **Quick mode** with the same content.

> **Unofficial fan project. Not affiliated with, endorsed by or sponsored by Nintendo.**
> No game files are used: artwork, icons and models are original or permissively licensed.
> Some music tracks are fan-made lo-fi arrangements published on Pixabay; every third-party
> asset is credited in [`THIRD_PARTY.md`](THIRD_PARTY.md).

Live site: https://rob-gon.github.io/the-legend-of-roberto/

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

## Design system

Component showcase (development only): run `npm run dev` and open
`http://localhost:5173/the-legend-of-roberto/dev/design-system.html`.

## Quick mode

A plain, static version of the whole CV for recruiters in a hurry. It works without
JavaScript and is generated at build time from the same JSON (`src/render/quick.js`,
`build/vite-plugin-static-pages.js`):

- Spanish: https://rob-gon.github.io/the-legend-of-roberto/quick/
- English: https://rob-gon.github.io/the-legend-of-roberto/en/quick/

The build also writes `sitemap.xml`, `robots.txt` and the Open Graph tags (`public/og-image.png`).

## Layouts

Desktop (≥ 1200 px) is a scaled 16:9 stage. Tablet shows list and detail side by side. Mobile
shows one column, an L/R bar at the bottom (or swipe left/right), a grouped inventory and the
detail in a bottom sheet.

## Music and sounds

`public/audio/manifest.json` lists the music (with title, author, licence and source) and the
sound effects. To add a track, copy the MP3 into `public/audio/music/` and add an entry; the unit
tests check that every listed file exists. Music never starts before the visitor interacts.

## Editing content

All text and data live in `public/data/{es,en}/*.json` — no code changes needed. See
[`.claude/rules/content-data.md`](.claude/rules/content-data.md) for the schema and the meaning
of the `_source`, `_review` and `_placeholder` fields.

## Deploy

Every push to `main` runs lint, unit tests, build and smoke tests, then deploys `dist/` to
GitHub Pages (`.github/workflows/ci-deploy.yml`). The Vite `base` is
`/the-legend-of-roberto/`.

## Credits and licences

Third-party fonts, icons and sounds are listed in [`THIRD_PARTY.md`](THIRD_PARTY.md).
