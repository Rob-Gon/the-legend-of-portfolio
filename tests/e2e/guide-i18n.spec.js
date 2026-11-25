import { expect, test } from '@playwright/test';

const heading = (page) => page.getByRole('heading', { level: 1 });

test.describe('Spanish browser', () => {
  test.use({ locale: 'es-ES' });

  test('Guide opens from the title and from System, and Back returns there', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Guía' }).click();
    await expect(page).toHaveURL(/#\/guia\/controles$/);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.locator('.c-fairy__bubble')).toContainText('¡Hey!');

    await page.keyboard.press('c');
    await expect(page).toHaveURL(/#\/guia\/leyenda$/);
    await expect(page.getByRole('heading', { name: 'Marcador' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/#\/inicio$/);

    await page.goto('./#/sistema');
    await page.getByRole('button', { name: 'Guía' }).click();
    await expect(heading(page)).toHaveText('Guía');
    await page.getByRole('button', { name: /Atrás/ }).click();
    await expect(heading(page)).toHaveText('Sistema');
  });

  test('language switch updates the page and is remembered', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    await page.getByRole('button', { name: 'Idioma: Español', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Language: English', exact: true }),
    ).toBeVisible();
  });

  test('the language shortcut by the music bar switches language from any screen', async ({
    page,
  }) => {
    await page.goto('./#/inventario/objetos-clave');
    const shortcut = page.getByRole('button', { name: /Cambiar a inglés/ });
    await expect(shortcut).toHaveText('ES');

    await shortcut.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const back = page.getByRole('button', { name: /Switch to Spanish/ });
    await expect(back).toHaveText('EN');
    await expect(back).toBeFocused();
    await expect(page).toHaveURL(/#\/inventario\/objetos-clave/);
  });

  test('only the inner tabpanel scrolls, so the panel frame stays in place', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('./#/guia');
    const overflow = await page.locator('.s-guide__panel').evaluate((panel) => {
      const scroll = panel.querySelector('[role="tabpanel"]');
      return {
        panel: panel.scrollHeight - panel.clientHeight,
        scroll: scroll.scrollHeight - scroll.clientHeight,
      };
    });
    expect(overflow.panel).toBe(0);
    expect(overflow.scroll).toBeGreaterThan(0);
  });

  test('the fairy stays still with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./#/guia');
    const durations = await page
      .locator('.c-fairy__flight, .c-fairy__hover, .c-fairy__wing')
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationDuration));
    expect(durations.every((value) => value === '0s')).toBe(true);
  });
});

test.describe('English browser', () => {
  test.use({ locale: 'en-US' });

  test('defaults to English when the browser is not Spanish', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(heading(page)).toHaveText('Adventure Log');
  });
});
