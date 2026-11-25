import { dispatchAction } from './bus.js';

// Single-key shortcuts; they can be switched off in System (`prefs.shortcuts`).
const SHORTCUTS = {
  l: 'prevSection',
  q: 'prevSection',
  r: 'nextSection',
  e: 'nextSection',
  z: 'prevTab',
  c: 'nextTab',
  w: [0, -1],
  a: [-1, 0],
  s: [0, 1],
  d: [1, 0],
  m: 'toggleMute',
};
const ARROWS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
const FORM_CONTROLS = 'input, select, textarea, [contenteditable]:not([contenteditable="false"])';
// These already turn Enter/Space into a click, which reaches us through `data-action`.
const NATIVE_ACTIVATION = 'button, a[href], summary';

/**
 * Documented controls per action (Guide screen and button hints). Entries are display ids:
 * symbols and key names shown as is, except the words in `TRANSLATED_KEYS`, which come from
 * `ui.json` (`guide.keys`). A unit test checks every keyboard entry really maps to its action.
 */
export const CONTROLS = [
  { action: 'prevSection', keyboard: ['L', 'Q'], gamepad: ['LB'] },
  { action: 'nextSection', keyboard: ['R', 'E'], gamepad: ['RB'] },
  { action: 'prevTab', keyboard: ['Z'], gamepad: ['LT'] },
  { action: 'nextTab', keyboard: ['C'], gamepad: ['RT'] },
  {
    action: 'move',
    keyboard: ['↑', '↓', '←', '→', 'W', 'A', 'S', 'D'],
    gamepad: ['DPad', 'Stick'],
  },
  { action: 'select', keyboard: ['Enter', 'Space'], gamepad: ['A'] },
  { action: 'back', keyboard: ['Esc', 'Backspace'], gamepad: ['B'] },
  { action: 'toggleMute', keyboard: ['M'], gamepad: [] },
];
export const TRANSLATED_KEYS = ['Space', 'Backspace', 'DPad', 'Stick'];

/** First keycap and gamepad glyph per action, for button hints. */
export const KEY_HINTS = Object.fromEntries(
  CONTROLS.map(({ action, keyboard, gamepad }) => [
    action,
    { keyboard: keyboard[0], gamepad: gamepad[0] },
  ]),
);

const move = ([dx, dy]) => ({ type: 'move', dx, dy });

/**
 * Pure keyboard mapping. `context.inTablist`: the event comes from inside a tablist, where
 * ←/→ switch tabs. Returns an action or null (event left to the browser).
 */
export function eventToAction(event, prefs = {}, context = {}) {
  if (event.ctrlKey || event.altKey || event.metaKey) return null;
  if (event.target?.closest?.(FORM_CONTROLS)) return null;

  const { key } = event;
  let action = null;

  if (key in ARROWS) {
    const [dx, dy] = ARROWS[key];
    action = context.inTablist && dx ? { type: dx < 0 ? 'prevTab' : 'nextTab' } : move([dx, dy]);
  } else if (key === 'Enter' || key === ' ') {
    if (event.target?.closest?.(NATIVE_ACTIVATION)) return null;
    action = { type: 'select' };
  } else if (key === 'Escape' || key === 'Backspace') {
    action = { type: 'back' };
  } else if (prefs.shortcuts !== false && key?.length === 1) {
    const shortcut = SHORTCUTS[key.toLowerCase()];
    if (shortcut) action = Array.isArray(shortcut) ? move(shortcut) : { type: shortcut };
  }

  // Holding a key repeats movement only; a held R must not fly through every section.
  if (!action || (event.repeat && action.type !== 'move')) return null;
  return action;
}

// Standard gamepad mapping: https://w3c.github.io/gamepad/#remapping
const PAD_BUTTONS = {
  0: 'select',
  1: 'back',
  4: 'prevSection',
  5: 'nextSection',
  6: 'prevTab',
  7: 'nextTab',
};
const PAD_DPAD = { 12: [0, -1], 13: [0, 1], 14: [-1, 0], 15: [1, 0] };
export const DEAD_ZONE = 0.5;
export const REPEAT_MS = 150;
const IDLE_PAD = Object.freeze({ pressed: new Set(), direction: null, nextRepeat: 0 });

function padDirection(pad) {
  for (const [index, vector] of Object.entries(PAD_DPAD)) {
    if (pad.buttons[index]?.pressed) return vector;
  }
  const [x = 0, y = 0] = pad.axes;
  if (Math.max(Math.abs(x), Math.abs(y)) < DEAD_ZONE) return null;
  if (Math.abs(x) > Math.abs(y)) return [Math.sign(x), 0];
  return [0, Math.sign(y)];
}

/**
 * Pure gamepad step: actions for this poll plus the state for the next one. Buttons fire on
 * press; a held direction fires at once and then every REPEAT_MS.
 */
export function pollGamepad(pad, previous = IDLE_PAD, now = 0) {
  const actions = [];
  const pressed = new Set();

  pad.buttons.forEach((button, index) => {
    if (!button?.pressed || !PAD_BUTTONS[index]) return;
    pressed.add(index);
    if (!previous.pressed.has(index)) actions.push({ type: PAD_BUTTONS[index] });
  });

  const vector = padDirection(pad);
  const direction = vector && vector.join();
  let { nextRepeat } = previous;
  if (direction && (direction !== previous.direction || now >= nextRepeat)) {
    actions.push(move(vector));
    nextRepeat = now + REPEAT_MS;
  }

  return { actions, state: { pressed, direction, nextRepeat } };
}

function setInputMode(mode) {
  document.documentElement.dataset.input = mode;
}

function startGamepad(dispatch) {
  const pads = new Map();
  let frame = 0;

  // Polls only while a gamepad is connected and the page is visible.
  const loop = () => {
    frame = 0;
    let connected = false;
    for (const pad of navigator.getGamepads?.() ?? []) {
      if (!pad) continue;
      connected = true;
      const { actions, state } = pollGamepad(pad, pads.get(pad.index), performance.now());
      pads.set(pad.index, state);
      if (actions.length) setInputMode('gamepad');
      actions.forEach(dispatch);
    }
    if (connected && document.visibilityState === 'visible') frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (!frame) frame = requestAnimationFrame(loop);
  };

  window.addEventListener('gamepadconnected', start);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') start();
  });
}

export const SWIPE_MIN_PX = 60;
const SWIPE_MAX_MS = 600;

/**
 * Pure swipe mapping: a quick, mostly horizontal swipe changes section (left → next, like
 * turning a page). Returns an action or null.
 */
export function swipeToAction({ dx, dy, ms }) {
  if (ms > SWIPE_MAX_MS || Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < 2 * Math.abs(dy)) {
    return null;
  }
  return { type: dx < 0 ? 'nextSection' : 'prevSection' };
}

function startSwipe(dispatch) {
  let start = null;
  document.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.touches[0];
      // Sliders and open sheets keep their own horizontal gestures.
      const ignored = event.target.closest?.('input, dialog');
      start =
        event.touches.length === 1 && !ignored
          ? { x: touch.clientX, y: touch.clientY, t: event.timeStamp }
          : null;
    },
    { passive: true },
  );
  document.addEventListener('touchend', (event) => {
    if (!start) return;
    const touch = event.changedTouches[0];
    const action = swipeToAction({
      dx: touch.clientX - start.x,
      dy: touch.clientY - start.y,
      ms: event.timeStamp - start.t,
    });
    start = null;
    if (action) dispatch(action);
  });
}

/** The only place that reads raw keyboard, pointer, touch and gamepad input. */
export function startInput({ getPrefs, dispatch = dispatchAction }) {
  document.addEventListener('keydown', (event) => {
    setInputMode('keyboard');
    const inTablist = Boolean(event.target.closest?.('[role="tablist"]'));
    const action = eventToAction(event, getPrefs(), { inTablist });
    if (action && dispatch(action)) event.preventDefault();
  });

  document.addEventListener('pointerdown', (event) => {
    setInputMode(event.pointerType === 'touch' ? 'touch' : 'pointer');
  });

  // Buttons declare what they do with `data-action` (plus `data-id` for direct targets).
  document.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-action]');
    if (!target || target.disabled) return;
    const { action, id } = target.dataset;
    dispatch(id ? { type: action, id } : { type: action });
  });

  startGamepad(dispatch);
  startSwipe(dispatch);
}
