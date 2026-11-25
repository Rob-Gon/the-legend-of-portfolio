import { expect, test } from '@playwright/test';

test.use({ locale: 'es-ES' });

test('weapons show computed years and turn pages; key items link the CV', async ({ page }) => {
  await page.goto('./#/inventario/tecnologias/laravel');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Laravel');
  await expect(page.locator('.c-detail__effect')).toHaveText('1 año y 8 meses de uso profesional');

  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.locator('.s-inventory__page')).toHaveText('Secundarias · 2/4');
  await expect(page).toHaveURL(/#\/inventario\/tecnologias\/laravel-reverb$/);

  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Jest');

  await page.goto('./#/inventario/objetos-clave');
  await page.getByRole('gridcell', { name: 'Currículum' }).click();
  const cv = page.getByRole('link', { name: 'Descargar el CV en PDF' });
  await expect(cv).toHaveAttribute('href', '/the-legend-of-roberto/cv/cv-es.pdf');
  const response = await page.request.get(await cv.getAttribute('href'));
  expect(response.headers()['content-type']).toContain('pdf');
});
