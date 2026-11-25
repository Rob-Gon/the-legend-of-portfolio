const cache = new Map();
// Settled results, so screens can read preloaded files synchronously while rendering.
const settled = new Map();

/** Removes invented example items (`_placeholder: true`) from list files. */
export function stripPlaceholders(data) {
  if (!Array.isArray(data?.items)) return data;
  return { ...data, items: data.items.filter((item) => !item._placeholder) };
}

async function request(url, fetcher) {
  try {
    const response = await fetcher(url);
    if (!response.ok) {
      return { ok: false, error: new Error(`HTTP ${response.status} loading ${url}`) };
    }
    const data = await response.json();
    return { ok: true, data: import.meta.env.PROD ? stripPlaceholders(data) : data };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * Loads `public/data/<lang>/<file>.json`. Never throws: resolves to `{ ok: true, data }` or
 * `{ ok: false, error }`. Successes are cached per language; failures are retried next time.
 */
export function load(lang, file, fetcher = globalThis.fetch) {
  const key = `${lang}/${file}`;
  if (!cache.has(key)) {
    const url = `${import.meta.env.BASE_URL}data/${key}.json`;
    cache.set(
      key,
      request(url, fetcher).then((result) => {
        if (result.ok) settled.set(key, result);
        else cache.delete(key);
        return result;
      }),
    );
  }
  return cache.get(key);
}

/** The loaded result of a file preloaded with `load()`, or undefined if it never loaded. */
export function peek(lang, file) {
  return settled.get(`${lang}/${file}`);
}
