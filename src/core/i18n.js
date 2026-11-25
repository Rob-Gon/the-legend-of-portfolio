import { load } from './data.js';

export const SUPPORTED_LANGS = ['es', 'en'];
export const DEFAULT_LANG = 'es';

/** Saved preference → Spanish if the browser lists any `es*` language → English. */
export function detectLang(saved, languages = []) {
  if (SUPPORTED_LANGS.includes(saved)) return saved;
  return languages.some((lang) => String(lang).toLowerCase().startsWith('es')) ? 'es' : 'en';
}

const lookup = (dict, key) => key.split('.').reduce((node, part) => node?.[part], dict);

/**
 * Pure translator: `t('hud.gems', { count: 11 })`. Missing keys fall back to `fallback`
 * (the Spanish file), then to the key itself; `warn` is called once per missing key.
 */
export function createTranslator(dict, fallback = {}, warn = () => {}) {
  const warned = new Set();
  return (key, vars) => {
    let value = lookup(dict, key);
    if (typeof value !== 'string') {
      if (!warned.has(key)) {
        warned.add(key);
        warn(key);
      }
      value = lookup(fallback, key);
    }
    if (typeof value !== 'string') return key;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (match, name) =>
      name in vars ? String(vars[name]) : match,
    );
  };
}

let translate = (key) => key;

export function t(key, vars) {
  return translate(key, vars);
}

export function applyDocumentLang(lang, doc = document) {
  doc.documentElement.lang = lang;
  doc.title = t('meta.siteTitle');
  doc.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
}

/** Loads `ui.json` for `lang` (plus Spanish as fallback) and makes it the active dictionary. */
export async function loadLanguage(lang) {
  const [ui, fallback] = await Promise.all([load(lang, 'ui'), load(DEFAULT_LANG, 'ui')]);
  if (!ui.ok) return ui;

  const warn = import.meta.env.DEV
    ? (key) => console.warn(`ui.json (${lang}) is missing "${key}"`)
    : undefined;
  translate = createTranslator(ui.data, fallback.ok ? fallback.data : {}, warn);
  applyDocumentLang(lang);
  return { ok: true };
}
