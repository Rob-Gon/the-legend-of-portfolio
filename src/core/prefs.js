const STORAGE_KEY = 'tlop:prefs';

export const DEFAULT_PREFS = Object.freeze({
  lang: null,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  muted: false,
  motion: 'system',
  shortcuts: true,
});

const isUnit = (value) => typeof value === 'number' && value >= 0 && value <= 1;
const isBool = (value) => typeof value === 'boolean';

const VALIDATORS = {
  lang: (value) => value === null || value === 'es' || value === 'en',
  musicVolume: isUnit,
  sfxVolume: isUnit,
  muted: isBool,
  motion: (value) => ['system', 'full', 'reduced'].includes(value),
  shortcuts: isBool,
};

/** Keeps only known keys with valid values; anything else falls back to the default. */
export function sanitizePrefs(raw) {
  const prefs = { ...DEFAULT_PREFS };
  if (!raw || typeof raw !== 'object') return prefs;
  for (const [key, isValid] of Object.entries(VALIDATORS)) {
    if (key in raw && isValid(raw[key])) prefs[key] = raw[key];
  }
  return prefs;
}

/** Never throws: storage can be blocked, unavailable or hold hand-edited JSON. */
export function readPrefs(storage) {
  try {
    return sanitizePrefs(JSON.parse((storage ?? globalThis.localStorage).getItem(STORAGE_KEY)));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}
