import { el } from '../core/dom.js';

const SHOW_MS = 4000;
const shown = new Set();
let region = null;

/**
 * Non-blocking message in a polite live region (screen readers announce it). `once` is a key:
 * a message with the same key shows only once per visit (e.g. "audio is unavailable").
 */
export function toast(message, { once } = {}) {
  if (once) {
    if (shown.has(once)) return;
    shown.add(once);
  }
  if (!region?.isConnected) {
    region = el('div', { class: 'c-toast-region', role: 'status' });
    document.body.append(region);
  }
  const item = el('p', { class: 'c-toast', text: message });
  region.append(item);
  setTimeout(() => item.remove(), SHOW_MS);
}
