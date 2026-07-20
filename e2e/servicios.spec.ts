import { test, expect } from '@playwright/test';

test.describe('Sección Servicios · Red bibliotecaria por ejes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#servicios').scrollIntoViewIfNeeded();
  });

  test('muestra los cinco ejes con sus mapas', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Eje Metropolitano' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Eje Mocotíes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Eje Panamericano' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Eje Páramo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Eje Pueblos del Sur' })).toBeVisible();
  });

  test('conserva solo Distrito Oeste (Central y Periférico eliminados)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Distrito Oeste' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Distrito Central' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Distrito Periférico' })).toHaveCount(0);
  });

  test('al hacer clic en un mapa se abre el lightbox con el mapa ampliado', async ({ page }) => {
    await page.getByRole('button', { name: /Ampliar el mapa del Eje Metropolitano/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Eje Metropolitano' })).toBeVisible();
    await expect(dialog.locator('img')).toBeVisible();
  });

  test('el lightbox se cierra con la tecla Escape', async ({ page }) => {
    await page.getByRole('button', { name: /Ampliar el mapa del Eje Panamericano/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('no desborda horizontalmente en viewport móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(desborda).toBe(false);
  });
});
