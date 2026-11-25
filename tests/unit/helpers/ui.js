import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { vi } from 'vitest';
import { loadLanguage } from '../../../src/core/i18n.js';

/** Serves `public/data` through a stubbed fetch and activates `lang` for `t()`. */
export async function useLanguage(lang = 'es') {
  vi.stubGlobal('fetch', async (url) => {
    // Tests run from the project root; the app requests `<base>data/<lang>/<file>.json`.
    const path = resolve('public', String(url).match(/data\/.+$/)[0]);
    return { ok: true, status: 200, json: async () => JSON.parse(readFileSync(path, 'utf8')) };
  });
  const result = await loadLanguage(lang);
  if (!result.ok) throw result.error;
}
