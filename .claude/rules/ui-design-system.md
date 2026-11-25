# UI design system

## Fidelity principle

Match the reference screenshots in **layout, proportions, rhythm and interaction**; never in
artwork. Original references: `D:\AA - MY STUFF\OBSIDIAN VAULTS\Proyectos 👨🏻‍💻\Zelda Portfolio\Referencias`
(quote the path; local only). When in doubt, compare against the screenshot and adjust spacing
or timing — do not copy an icon or texture.

## Stage scaling (desktop ≥ 1200 px)

- Designs are specified on a **1280 × 720** stage.
- `--u` is one stage pixel: `min(100vw / 1280, 100vh / 720)` on desktop, `1px` elsewhere.
- Size everything with the SCSS helper `u($px)` (= `calc($px * var(--u))`). It never
  compounds with parent font sizes. Never use raw `px`, `em` or `rem` for layout, except 1 px
  hairlines.
- Below 1200 px `--u` is `1px`, so the same values work; `responsive.md` adapts layouts.

## Tokens

Defined once as CSS custom properties in `src/styles/tokens/`; SCSS variables only for
compile-time things (breakpoints, `u()`). Values: `docs/PROJECT_BRIEF.md` §6. Key ones:

- Text `--c-text #E9E1D1` (never pure white) · muted `#B8B1A3` · done `#9A958B`
- Accents: yellow `#E2D146` (locations) · red `#F15050` (highlights) · green `#6FD49C`
  (effects) · blue `#3CD3FC` (focus, glow) · equipped gradient `#1F8BFF → #0B5FD0`
- Surfaces: panel `rgb(0 0 0 / .6)` · row/cell `rgb(0 0 0 / .78)` · border
  `rgb(226 222 211 / .35)` · strong border `#E2DED3`
- Radii: 0 (rows, cells) · 2 px (chips) · 4 px max
- Fonts: **Cinzel** 600 (title screen only) · **Roboto** italic 500/700 (all UI)
- Motion: `--t-fast 120ms` (cursor, slight overshoot) · `--t-base 180ms` ·
  `--t-section 280ms` · `--t-sheet 240ms` · `--t-intro 600ms` · `--t-pulse 1200ms`

## Components (SCSS partial in `src/styles/components/`; JS module in `src/components/` when it builds DOM)

Live showcase (dev only, not built): `npm run dev` → `/the-legend-of-roberto/dev/design-system.html`.

| Component | Key traits |
|---|---|
| `panel` | Translucent dark fill + inner hairline frame (`::after`, inset 3 px), notched corners on large panels |
| `list-row` | 420 × 56, icon · bold italic title 22 · yellow subtitle 13 · status box right; `done` state greys text to `--c-text-done` |
| `grid-cell` | 82 × 82, gap 16; number badge bottom-right; `equipped/featured` = blue gradient |
| `tabs` | Icon row; active white with label above, others muted; underline with key hint |
| `detail-card` | Stars/level, name, chips (icon + value), effect chip, short italic description |
| `button-hints` | Bottom-right action list with keycap/glyph per device |
| `hud` | Hearts (top-left), section title + neighbours with L/R (top-centre), gem counter + availability (top-right) |
| `sheet` | Mobile detail as native `<dialog>` sliding from the bottom |
| `toast` | Non-blocking error/info message |

## Selection and focus

- Selected item: white **corner brackets** + warm glow, gentle pulse (`--t-pulse`). No solid
  highlight fill.
- Keyboard focus = selection (roving tabindex). `:focus-visible` always shows the brackets plus
  a 2 px `--c-accent-blue` outline; never `outline: none` without a replacement.

## Do / don't

- Do keep text contrast ≥ 4.5:1 on every surface, including greyed (completed) quests.
- Do keep the BEM-like naming `c-<component>__<part>--<modifier>`; layouts `l-…`; screens `s-…`.
- Don't use `backdrop-filter` below 1200 px.
- Don't add colours or sizes outside the tokens; add a token first.
