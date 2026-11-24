# Input and navigation

All input goes through `src/core/input.js`, which emits **actions** on the bus. Screens never
listen to raw `keydown`/gamepad events themselves (exception: native form controls).

## Action map

| Action | Keyboard | Gamepad (standard mapping) | Pointer | Touch |
|---|---|---|---|---|
| `prevSection` | `L`, `Q` | LB | Click left neighbour label | Swipe right / L button in bottom bar |
| `nextSection` | `R`, `E` | RB | Click right neighbour label | Swipe left / R button in bottom bar |
| `prevTab` | `Z`; `←` inside tablist | LT | Click tab | Tap tab |
| `nextTab` | `C`; `→` inside tablist | RT | Click tab | Tap tab |
| `move {dx,dy}` | Arrows, `W A S D` | D-pad, left stick (dead zone 0.5, repeat 150 ms) | Hover | — |
| `select` | `Enter`, `Space` | A (bottom face button) | Click | Tap |
| `back` | `Esc`, `Backspace` | B (right face button) | Click "Back" hint | Back hint / close sheet |

- **`Tab` is never intercepted.** It moves focus between composite widgets (tablist, list/grid,
  detail, hints) as the browser does.
- **Single-key shortcuts** (letters: L R Q E Z C W A S D) can be switched off in System
  (`prefs.shortcuts`, default on). Arrows, Enter, Space and Esc always work.
- Ignore shortcuts when the event target is an `input`, `select`, `textarea` or
  contenteditable, or when a modifier key (Ctrl/Alt/Meta) is held.
- Gamepad polling runs only while a gamepad is connected (`gamepadconnected`) and the page is
  visible.

## Focus model

- Roving tabindex: exactly one `tabindex="0"` element per composite widget; the rest `-1`.
- Focus follows selection; selection updates the detail panel and the URL (`replaceState`).
- ARIA: tab rows `role="tablist"`/`tab`/`tabpanel`; inventory `role="grid"` with rows;
  quest/project lists `role="listbox"`/`option` with `aria-selected`.
- After a section change, focus moves to the active tab of the new section.
- Mobile sheet: focus is trapped by `<dialog>`; on close, focus returns to the cell.

## Button hints

Shown bottom-right and adapted to the last used input: keycaps on keyboard, A/B glyphs on
gamepad, nothing on mouse-only, touch icons on touch. Hint labels come from `ui.json`.

## Sound feedback

Emit `ui:sfx` with `cursor` (move), `select`, `back`, `tab`, `section`. Never more than one
`cursor` sound per 60 ms.

## Tests

Unit-test the pure mapping `eventToAction(event, prefs, context)` for every row above, the
shortcut toggle and the form-control guard.
