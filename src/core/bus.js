/** App-wide event bus. Events: `action`, `state:change`, `ui:sfx`, `data:error`. */
export const bus = new EventTarget();

export function emit(type, detail) {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
}

/**
 * Sends a normalised input action. Listeners call `preventDefault()` when they handle it, so the
 * caller knows whether to cancel the browser default (e.g. arrow keys scrolling the page).
 */
export function dispatchAction(action) {
  return !bus.dispatchEvent(new CustomEvent('action', { detail: action, cancelable: true }));
}
