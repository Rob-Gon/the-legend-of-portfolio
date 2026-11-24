# Accessibility and performance

## Budgets (checked in M9 and whenever a dependency or asset is added)

| Metric | Budget |
|---|---|
| Initial JS (gzip, excluding Three.js and Howler chunks) | ≤ 150 KB |
| LCP on mobile, simulated 4G | < 2.5 s |
| Lighthouse (performance, accessibility, best practices, SEO) | ≥ 90 each |
| Lighthouse accessibility on Quick mode | 100 |
| GLB per model | ≤ 1.5 MB |

## Performance checklist

- [ ] Three.js and Howler only via dynamic `import()`.
- [ ] Images: AVIF + WebP, `srcset`/`sizes` (480/960/1440), `width`/`height` set,
      `loading="lazy"` except the LCP image.
- [ ] Fonts self-hosted WOFF2, Latin subset, `font-display: swap`, preload only the title
      font weight used above the fold.
- [ ] Title screen LCP is text or a CSS/SVG background, not a heavy image.
- [ ] Data for the hub is preloaded on the title screen; no request waterfalls.
- [ ] No `backdrop-filter` below 1200 px; animate only `transform` and `opacity`.
- [ ] Measure before optimising (Lighthouse, DevTools Performance).

## Accessibility checklist (WCAG 2.2 AA)

- [ ] Semantic landmarks: `header`, `nav`, `main`, `footer`; one `h1` per page.
- [ ] ARIA roles per `input-navigation.md` (`tablist`, `grid`, `listbox`); roving tabindex.
- [ ] Everything works with keyboard only; focus always visible; no keyboard traps.
- [ ] `Tab` never intercepted; single-key shortcuts can be turned off.
- [ ] Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI graphics) on translucent panels,
      including completed quests.
- [ ] `alt` on every meaningful image; decorative SVG `aria-hidden="true"`.
- [ ] HUD values have text alternatives (e.g. hearts → "2 years and 5 months of
      professional experience").
- [ ] `prefers-reduced-motion` honoured by default; System toggle overrides it.
- [ ] Music never starts without a user action; volume and mute controls are labelled.
- [ ] Error states are announced (`role="status"` / `role="alert"`) and readable.
- [ ] Quick mode works without JavaScript.

## Resilience

- A failing JSON shows that section's error state; the rest of the app keeps working.
- A failing model shows the 2D avatar; failing audio disables sound silently (one toast).
- `localStorage` access always in try/catch.
