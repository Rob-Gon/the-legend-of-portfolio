import { expect, test } from '@playwright/test';

test('app shell loads without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('./');

  await expect(page).toHaveTitle(/The Legend Of Roberto/);
  await expect(page.locator('main#app')).toBeAttached();
  expect(errors).toEqual([]);
});
