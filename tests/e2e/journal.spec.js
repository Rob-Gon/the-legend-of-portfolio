import { expect, test } from '@playwright/test';

test.use({ locale: 'es-ES' });

test('the Adventure Log reads its JSON and keeps the selection in the URL', async ({ page }) => {
  await page.goto('./#/diario/misiones');
  await expect(page.getByRole('option')).toHaveCount(10);
  await expect(page.locator('.c-hud__hearts')).toHaveText(
    '2 años y 5 meses de experiencia profesional',
  );

  await page.getByRole('tab', { name: 'Misiones principales' }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page).toHaveURL(/#\/diario\/misiones\/matricular$/);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Matricular');

  await page.getByRole('option', { name: /Crealia IT/ }).click();
  await expect(page).toHaveURL(/#\/diario\/misiones\/crealia-it$/);
});

test('deep links open a project with its public links', async ({ page }) => {
  await page.goto('./#/diario/recuerdos/contact-form');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Formulario de contacto');
  await expect(page.getByRole('link', { name: 'Demo' })).toHaveAttribute(
    'href',
    'https://rob-gon.github.io/Contact-Form/',
  );
  await expect(page.getByRole('option', { selected: true })).toContainText(
    'Formulario de contacto',
  );
});
