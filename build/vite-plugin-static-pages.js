// Build-time static pages: Quick mode (one per language), sitemap.xml, robots.txt and the
// Open Graph tags of index.html. Everything comes from public/data, like the app itself.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as sass from 'sass';
import { stripPlaceholders } from '../src/core/data.js';
import { escape, renderQuickPage } from '../src/render/quick.js';

const FILES = ['ui', 'profile', 'quests', 'sidequests', 'projects', 'tech', 'softskills'];
const LANGS = ['es', 'en'];
const quickPath = (lang) => `${lang === 'es' ? '' : `${lang}/`}quick/`;

export function staticPages({ base, siteUrl, root = process.cwd() }) {
  const read = (lang, file) =>
    JSON.parse(readFileSync(resolve(root, 'public/data', lang, `${file}.json`), 'utf8'));

  function renderQuick(lang, production) {
    const data = Object.fromEntries(
      FILES.map((file) => {
        const content = read(lang, file);
        // Same rule as the app: invented examples never reach production.
        return [file, production ? stripPlaceholders(content) : content];
      }),
    );
    const other = LANGS.find((code) => code !== lang);
    return renderQuickPage(
      { ...data, fallbackUi: read('es', 'ui') },
      {
        lang,
        base,
        siteUrl,
        alternate: {
          lang: other,
          href: `${siteUrl}${quickPath(other)}`,
          path: `${base}${quickPath(other)}`,
        },
        styles: sass.compile(resolve(root, 'src/styles/quick.scss'), { style: 'compressed' }).css,
      },
    );
  }

  const sitemap = () => {
    const urls = [siteUrl, ...LANGS.map((lang) => `${siteUrl}${quickPath(lang)}`)];
    const entries = urls.map((url) => `  <url><loc>${escape(url)}</loc></url>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  };

  return {
    name: 'static-pages',

    // `npm run dev`: serve Quick mode on the fly from the current JSON.
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url.split('?')[0];
        const lang = LANGS.find((code) => path === `${base}${quickPath(code)}`);
        if (!lang) return next();
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.end(renderQuick(lang, false));
      });
    },

    generateBundle() {
      for (const lang of LANGS) {
        this.emitFile({
          type: 'asset',
          fileName: `${quickPath(lang)}index.html`,
          source: renderQuick(lang, true),
        });
      }
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap() });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nSitemap: ${siteUrl}sitemap.xml\n`,
      });
    },

    // Social previews: crawlers do not run JavaScript, so these tags must be static.
    transformIndexHtml(html) {
      const ui = read('es', 'ui');
      const tags = [
        `<link rel="canonical" href="${escape(siteUrl)}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="${escape(ui.meta.siteTitle)}" />`,
        `<meta property="og:title" content="${escape(ui.meta.siteTitle)}" />`,
        `<meta property="og:description" content="${escape(ui.meta.description)}" />`,
        `<meta property="og:url" content="${escape(siteUrl)}" />`,
        `<meta property="og:image" content="${escape(`${siteUrl}og-image.png`)}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta property="og:locale" content="es_ES" />`,
        `<meta property="og:locale:alternate" content="en_US" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
      ];
      return html.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`);
    },
  };
}
