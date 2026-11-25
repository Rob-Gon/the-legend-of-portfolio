import { expect, test } from '@playwright/test';

test.use({ locale: 'es-ES' });

const prefs = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('tlop:prefs') ?? '{}'));

test('the music bar pauses, sets the master volume and remembers both', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');

  await page.getByRole('button', { name: 'Pausar la música' }).click();
  await expect(page.getByRole('button', { name: 'Reanudar la música' })).toBeVisible();

  await page.getByRole('slider', { name: 'Volumen general' }).fill('30');
  expect(await prefs(page)).toMatchObject({ musicPaused: true, volume: 0.3 });

  await page.reload();
  await expect(page.getByRole('button', { name: 'Reanudar la música' })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Volumen general' })).toHaveValue('30');

  await page.keyboard.press('m');
  expect(await prefs(page)).toMatchObject({ muted: true });
  expect(errors).toEqual([]);
});

test('System settings apply immediately', async ({ page }) => {
  await page.goto('./#/sistema');
  const motion = page.locator('[data-setting="motion"]');
  await motion.click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await motion.click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');

  await page.locator('[data-setting="shortcuts"]').click();
  await page.keyboard.press('l');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sistema');
});
