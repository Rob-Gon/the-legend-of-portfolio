// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { REPEAT_MS, eventToAction, pollGamepad, startInput } from '../../src/core/input.js';

const target = document.createElement('div');
const key = (value, extra = {}) => ({ key: value, target, ...extra });
const on = (tag, attrs = {}) => {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
};

describe('eventToAction', () => {
  it.each([
    ['ArrowUp', { type: 'move', dx: 0, dy: -1 }],
    ['ArrowDown', { type: 'move', dx: 0, dy: 1 }],
    ['ArrowLeft', { type: 'move', dx: -1, dy: 0 }],
    ['ArrowRight', { type: 'move', dx: 1, dy: 0 }],
    ['w', { type: 'move', dx: 0, dy: -1 }],
    ['a', { type: 'move', dx: -1, dy: 0 }],
    ['s', { type: 'move', dx: 0, dy: 1 }],
    ['d', { type: 'move', dx: 1, dy: 0 }],
    ['l', { type: 'prevSection' }],
    ['q', { type: 'prevSection' }],
    ['L', { type: 'prevSection' }],
    ['r', { type: 'nextSection' }],
    ['e', { type: 'nextSection' }],
    ['z', { type: 'prevTab' }],
    ['c', { type: 'nextTab' }],
    ['Enter', { type: 'select' }],
    [' ', { type: 'select' }],
    ['Escape', { type: 'back' }],
    ['Backspace', { type: 'back' }],
  ])('%j → %j', (value, action) => {
    expect(eventToAction(key(value))).toEqual(action);
  });

  it.each(['Tab', 'x', 'F5', 'Shift'])('leaves %j to the browser', (value) => {
    expect(eventToAction(key(value))).toBeNull();
  });

  it('switches tabs with ←/→ inside a tablist; ↑/↓ still move', () => {
    const context = { inTablist: true };
    expect(eventToAction(key('ArrowLeft'), {}, context)).toEqual({ type: 'prevTab' });
    expect(eventToAction(key('ArrowRight'), {}, context)).toEqual({ type: 'nextTab' });
    expect(eventToAction(key('ArrowDown'), {}, context)).toEqual({ type: 'move', dx: 0, dy: 1 });
  });

  it('ignores single-key shortcuts when they are switched off', () => {
    const prefs = { shortcuts: false };
    for (const letter of ['l', 'r', 'q', 'e', 'z', 'c', 'w', 'a', 's', 'd']) {
      expect(eventToAction(key(letter), prefs)).toBeNull();
    }
    expect(eventToAction(key('ArrowUp'), prefs)).toEqual({ type: 'move', dx: 0, dy: -1 });
    expect(eventToAction(key('Enter'), prefs)).toEqual({ type: 'select' });
    expect(eventToAction(key('Escape'), prefs)).toEqual({ type: 'back' });
  });

  it.each([
    ['input', on('input')],
    ['select', on('select')],
    ['textarea', on('textarea')],
    ['contenteditable', on('div', { contenteditable: 'true' })],
  ])('never acts inside a form control (%s)', (_, control) => {
    for (const value of ['r', 'ArrowLeft', 'Enter', 'Escape', ' ']) {
      expect(eventToAction({ key: value, target: control })).toBeNull();
    }
  });

  it('ignores keys with Ctrl, Alt or Meta held', () => {
    expect(eventToAction(key('r', { ctrlKey: true }))).toBeNull();
    expect(eventToAction(key('ArrowLeft', { altKey: true }))).toBeNull();
    expect(eventToAction(key('l', { metaKey: true }))).toBeNull();
  });

  it('lets buttons and links handle Enter/Space natively', () => {
    expect(eventToAction({ key: 'Enter', target: on('button') })).toBeNull();
    expect(eventToAction({ key: ' ', target: on('a', { href: '#' }) })).toBeNull();
    expect(eventToAction({ key: 'Escape', target: on('button') })).toEqual({ type: 'back' });
  });

  it('repeats movement on key hold but nothing else', () => {
    expect(eventToAction(key('ArrowDown', { repeat: true }))).toEqual({
      type: 'move',
      dx: 0,
      dy: 1,
    });
    expect(eventToAction(key('r', { repeat: true }))).toBeNull();
    expect(eventToAction(key('Enter', { repeat: true }))).toBeNull();
  });
});

const pad = ({ pressed = [], axes = [0, 0] } = {}) => ({
  axes,
  buttons: Array.from({ length: 17 }, (_, index) => ({ pressed: pressed.includes(index) })),
});

describe('pollGamepad', () => {
  it.each([
    [0, 'select'],
    [1, 'back'],
    [4, 'prevSection'],
    [5, 'nextSection'],
    [6, 'prevTab'],
    [7, 'nextTab'],
  ])('button %i → %s', (index, type) => {
    expect(pollGamepad(pad({ pressed: [index] })).actions).toEqual([{ type }]);
  });

  it('fires buttons once per press', () => {
    const first = pollGamepad(pad({ pressed: [0] }), undefined, 0);
    const held = pollGamepad(pad({ pressed: [0] }), first.state, 500);
    const released = pollGamepad(pad(), held.state, 600);
    const again = pollGamepad(pad({ pressed: [0] }), released.state, 700);

    expect(held.actions).toEqual([]);
    expect(again.actions).toEqual([{ type: 'select' }]);
  });

  it('ignores unmapped buttons such as Start', () => {
    expect(pollGamepad(pad({ pressed: [9] })).actions).toEqual([]);
  });

  it('repeats a held direction every REPEAT_MS', () => {
    const down = { type: 'move', dx: 0, dy: 1 };
    const first = pollGamepad(pad({ pressed: [13] }), undefined, 1000);
    const early = pollGamepad(pad({ pressed: [13] }), first.state, 1000 + REPEAT_MS - 1);
    const repeat = pollGamepad(pad({ pressed: [13] }), early.state, 1000 + REPEAT_MS);

    expect(first.actions).toEqual([down]);
    expect(early.actions).toEqual([]);
    expect(repeat.actions).toEqual([down]);
  });

  it('applies the stick dead zone and picks the dominant axis', () => {
    expect(pollGamepad(pad({ axes: [0.4, -0.3] })).actions).toEqual([]);
    expect(pollGamepad(pad({ axes: [0.8, 0.6] })).actions).toEqual([
      { type: 'move', dx: 1, dy: 0 },
    ]);
    expect(pollGamepad(pad({ axes: [0.2, -0.9] })).actions).toEqual([
      { type: 'move', dx: 0, dy: -1 },
    ]);
  });
});

describe('startInput', () => {
  const dispatch = vi.fn(() => true);
  startInput({ getPrefs: () => ({}), dispatch });

  it('dispatches keyboard actions, cancels the default and records the input mode', () => {
    const event = new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);

    expect(dispatch).toHaveBeenLastCalledWith({ type: 'nextSection' });
    expect(event.defaultPrevented).toBe(true);
    expect(document.documentElement.dataset.input).toBe('keyboard');
  });

  it('turns clicks on data-action elements into actions', () => {
    const button = on('button', { 'data-action': 'tab', 'data-id': 'armor' });
    button.append(on('span'));
    document.body.append(button);
    button.firstChild.click();

    expect(dispatch).toHaveBeenLastCalledWith({ type: 'tab', id: 'armor' });
  });

  it('ignores clicks on disabled buttons', () => {
    dispatch.mockClear();
    const button = on('button', { 'data-action': 'nextPage', disabled: '' });
    document.body.append(button);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dispatch).not.toHaveBeenCalled();
  });
});
