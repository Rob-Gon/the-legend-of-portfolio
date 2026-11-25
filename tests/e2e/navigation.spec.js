import { expect, test } from '@playwright/test';

const heading = (page) => page.getByRole('heading', { level: 1 });

test.use({ locale: 'es-ES' });

test('title → Start → hub; L/R and tab keys switch; Back undoes them', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/#\/inicio$/);
  await expect(page.getByRole('button', { name: 'Iniciar' })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Diario de Aventura');
  await expect(page).toHaveURL(/#\/diario\/misiones$/);

  await page.keyboard.press('r');
  await expect(heading(page)).toHaveText('Inventario');
  await expect(page).toHaveURL(/#\/inventario\/tecnologias$/);
  await expect(page.getByRole('tab', { name: 'Armas' })).toBeFocused();

  await page.keyboard.press('c');
  await expect(page).toHaveURL(/#\/inventario\/habilidades$/);

  await page.goBack();
  await expect(page).toHaveURL(/#\/inventario\/tecnologias$/);

  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#\/inicio$/);
});

test('pointer: neighbour labels and tabs are clickable', async ({ page }) => {
  await page.goto('./#/diario');
  await page.getByRole('button', { name: /Inventario/ }).click();
  await expect(heading(page)).toHaveText('Inventario');

  await page.getByRole('tab', { name: 'Objetos clave' }).click();
  await expect(page).toHaveURL(/#\/inventario\/objetos-clave$/);
});

test('deep links open the right screen; unknown routes go to the title', async ({ page }) => {
  await page.goto('./#/sistema');
  await expect(heading(page)).toHaveText('Sistema');

  await page.goto('./#/no-existe');
  await expect(page).toHaveURL(/#\/inicio$/);
  await expect(heading(page)).toHaveText(/The Legend Of Roberto/);
});
