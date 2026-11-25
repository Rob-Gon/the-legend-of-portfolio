// Same breakpoints as `$bp-tablet` / `$bp-desktop` in src/styles/tokens/_units.scss. CSS does the
// layout; JS only asks which layout is active (mobile sheet, grouped inventory, 3D viewer).
const MOBILE_QUERY = '(width < 768px)';
const DESKTOP_QUERY = '(width >= 1200px)';

const media = () => globalThis.matchMedia?.(MOBILE_QUERY);

export function isMobile() {
  return media()?.matches ?? false;
}

export function isDesktop() {
  return globalThis.matchMedia?.(DESKTOP_QUERY).matches ?? false;
}

/** Calls `callback` when the viewport crosses the mobile or the desktop breakpoint. */
export function onLayoutChange(callback) {
  media()?.addEventListener('change', callback);
  globalThis.matchMedia?.(DESKTOP_QUERY).addEventListener('change', callback);
}
