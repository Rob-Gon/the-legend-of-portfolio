import { expect, test } from '@playwright/test';

test.use({ locale: 'es-ES' });

test('desktop: the 3D viewer loads lazily in the Inventory and replaces the 2D preview', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1600, height: 900 });

  await page.goto('./#/diario/misiones');
  await expect(page.locator('canvas')).toHaveCount(0);

  await page.goto('./#/inventario/tecnologias/laravel');
  // Lazy chunk + model download + shader compile in software WebGL: allow more than the default.
  await expect(page.locator('canvas.c-viewer__canvas')).toHaveCount(1, { timeout: 15_000 });
  await expect(page.locator('.s-inventory.has-3d')).toHaveCount(1);
  await expect(page.locator('.s-inventory__preview')).toBeHidden();

  // Changing item keeps the same single canvas.
  await page.getByRole('gridcell', { name: 'PHP' }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('mobile: no 3D at all', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'es-ES',
  });
  const page = await context.newPage();
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('./#/inventario/tecnologias');
  await expect(page.getByRole('heading', { name: 'Principales' })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(requests.filter((url) => url.includes('viewer'))).toEqual([]);
  await context.close();
});
