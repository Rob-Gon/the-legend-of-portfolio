// Same breakpoint as `$bp-tablet` in src/styles/tokens/_units.scss. CSS does the layout; JS only
// asks which layout is active (mobile detail sheet, grouped inventory).
const MOBILE_QUERY = '(width < 768px)';

const media = () => globalThis.matchMedia?.(MOBILE_QUERY);

export function isMobile() {
  return media()?.matches ?? false;
}

/** Calls `callback` when the viewport crosses the mobile breakpoint. */
export function onLayoutChange(callback) {
  media()?.addEventListener('change', callback);
}
