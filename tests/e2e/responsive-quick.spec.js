import { expect, test } from '@playwright/test';

test.describe('Quick mode (no JavaScript)', () => {
  test.use({ javaScriptEnabled: false, locale: 'es-ES' });

  test('renders the whole CV in Spanish and links to English', async ({ page }) => {
    await page.goto('./quick/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Roberto Báez González');
    await expect(page.getByRole('heading', { name: 'Experiencia' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver la versión interactiva' })).toBeVisible();

    await page.getByRole('link', { name: 'English version' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();
  });

  test('publishes the sitemap and robots.txt', async ({ request }) => {
    const sitemap = await (await request.get('./sitemap.xml')).text();
    expect(sitemap).toContain('/the-legend-of-roberto/quick/');
    expect(sitemap).toContain('/the-legend-of-roberto/en/quick/');
    expect(await (await request.get('./robots.txt')).text()).toContain('Sitemap: https://');
  });
});

test.describe('mobile', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    locale: 'es-ES',
  });

  test('bottom bar changes section and a tapped row opens the detail sheet', async ({ page }) => {
    await page.goto('./#/diario/misiones');
    const bar = page.getByRole('navigation', { name: 'Secciones' });
    await bar.getByRole('button', { name: 'Inventario' }).tap();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inventario');
    await expect(page.getByRole('heading', { name: 'Secundarias' })).toBeVisible();

    await bar.getByRole('button', { name: 'Diario de Aventura' }).tap();
    await page.getByRole('option', { name: /Crealia/ }).tap();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Desarrollador Full-Stack');

    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(page).toHaveURL(/#\/diario\/misiones\/crealia-it$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
});
