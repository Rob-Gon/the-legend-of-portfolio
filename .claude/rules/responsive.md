# Responsive

Mobile-first SCSS; breakpoints as SCSS variables and matching `matchMedia` queries in
`core/device.js`.

| Name | Range | Layout |
|---|---|---|
| mobile | < 768 px | One section at a time; L/R bar fixed at the bottom; tabs always visible at the top; 4-column grid; Weapons pages become stacked groups with headings; detail in a bottom sheet (`<dialog>`); swipe left/right changes section; no 3D (avatar image); lighter motion |
| tablet | 768–1199 px | Grid/list and detail side by side; tabs always visible; HUD simplified; no 3D (avatar image) |
| desktop | ≥ 1200 px | Full 16:9 stage scaled with `em` (see `ui-design-system.md`); HUD; 3D viewer on the right |

## What shows where

| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| HUD hearts / gems / availability | Compact top bar | Yes | Yes |
| L/R neighbour labels | Bottom bar buttons | Top, with keycaps | Top, with keycaps |
| Button hints | Hidden (touch icons only where needed) | Device-adapted | Device-adapted |
| 3D viewer | No | No | Yes (if WebGL) |
| Avatar image | In Key items | Side panel | Fallback when 3D fails |
| `backdrop-filter` | No | No | Allowed |

## Rules

- Touch targets ≥ 44 × 44 px. Body text ≥ 16 px on mobile.
- Respect safe areas (`env(safe-area-inset-*)`) for the fixed bottom bar.
- Layout changes come from CSS; JS only reads breakpoints to decide 3D and hints.
- Check at **360, 390, 768, 1024, 1280, 1920 px**, portrait and landscape, before closing any
  UI milestone (Playwright screenshots or manual).
- Browser zoom ≥ 200 % on desktop must fall back to the tablet layout and stay usable.
