import { defineConfig } from 'vite';
import { staticPages } from './build/vite-plugin-static-pages.js';

// GitHub Pages project site: https://rob-gon.github.io/the-legend-of-roberto/
export const BASE = '/the-legend-of-roberto/';
export const SITE_URL = `https://rob-gon.github.io${BASE}`;

export default defineConfig({
  base: BASE,
  plugins: [staticPages({ base: BASE, siteUrl: SITE_URL })],
  build: {
    target: 'es2022',
  },
  test: {
    // DOM tests opt in per file with `// @vitest-environment jsdom`.
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
  },
});
