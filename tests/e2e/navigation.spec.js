import { expect, test } from '@playwright/test';

const heading = (page) => page.getByRole('heading', { level: 1 });

test('L/R and tab keys switch sections and tabs, and Back undoes them', async ({ page }) => {
  await page.goto('./');
  await expect(heading(page)).toHaveText('Diario de Aventura');
  await expect(page).toHaveURL(/#\/diario\/misiones$/);

  await page.keyboard.press('r');
  await expect(heading(page)).toHaveText('Inventario');
  await expect(page).toHaveURL(/#\/inventario\/tecnologias$/);
  await expect(page.getByRole('tab', { name: 'Armas' })).toBeFocused();

  await page.keyboard.press('c');
  await expect(page).toHaveURL(/#\/inventario\/habilidades$/);
  await expect(page.getByRole('tab', { name: 'Armaduras' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await page.goBack();
  await expect(page).toHaveURL(/#\/inventario\/tecnologias$/);
  await page.goBack();
  await expect(heading(page)).toHaveText('Diario de Aventura');
});

test('pointer: neighbour labels and tabs are clickable', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Inventario/ }).click();
  await expect(heading(page)).toHaveText('Inventario');

  await page.getByRole('tab', { name: 'Objetos clave' }).click();
  await expect(page).toHaveURL(/#\/inventario\/objetos-clave$/);
});

test('deep links open the right section; unknown routes land on the first one', async ({
  page,
}) => {
  await page.goto('./#/sistema');
  await expect(heading(page)).toHaveText('Sistema');

  await page.goto('./#/no-existe');
  await expect(heading(page)).toHaveText('Diario de Aventura');
  await expect(page).toHaveURL(/#\/diario\/misiones$/);
});
