// Kept out of the Three.js chunk: deciding whether to load 3D must not load 3D.

export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** System setting first ('reduced' / 'full'), otherwise the OS preference. */
export function prefersReducedMotion() {
  const forced = document.documentElement.dataset.motion;
  if (forced) return forced === 'reduced';
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
