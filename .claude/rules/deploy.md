# Deploy (GitHub Pages)

## Target

- Repo: `the-legend-of-portfolio` (owner `Rob-Gon`).
- URL: `https://rob-gon.github.io/the-legend-of-portfolio/`.
- Vite `base: '/the-legend-of-portfolio/'`. Every runtime URL (JSON, audio, models, images,
  CV) must be built from `import.meta.env.BASE_URL`, never from `/`.
- Hash routing means no SPA 404 fallback is needed. Quick mode pages are real files
  (`quick/index.html`, `en/quick/index.html`).
- `sitemap.xml` and `robots.txt` use the absolute production URL.

## Workflow `.github/workflows/ci-deploy.yml`

On every push and pull request:

1. `actions/checkout` · `actions/setup-node` (Node 22, npm cache) · `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. `npx playwright install --with-deps chromium` · `npm run test:e2e` (against
   `vite preview` with the production `base`)

Only on push to `main`, after all of the above:

6. `actions/upload-pages-artifact` with `dist/`
7. `actions/deploy-pages` (permissions `pages: write`, `id-token: write`;
   `concurrency: pages`)

Pages source must be set to **GitHub Actions** in the repo settings (owner does this once).

## Rules

- Never deploy from a branch other than `main`; never push without the owner's OK.
- Work on `feature/…`, `fix/…`, `chore/…` branches; merge to `main` via PR.
- Rollback: revert the commit on `main` (the workflow redeploys) or re-run the last good
  workflow run.
- No secrets are needed; never add any to the repo.
