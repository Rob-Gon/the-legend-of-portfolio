import { defineConfig } from 'vite';

// GitHub Pages project site: https://rob-gon.github.io/the-legend-of-portfolio/
export const BASE = '/the-legend-of-portfolio/';

export default defineConfig({
  base: BASE,
  build: {
    target: 'es2022',
  },
  test: {
    // DOM tests opt in per file with `// @vitest-environment jsdom`.
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
  },
});
