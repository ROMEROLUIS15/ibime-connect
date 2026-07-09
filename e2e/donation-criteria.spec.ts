import { test, expect } from '@playwright/test';

test.describe('Página de Criterios de Donación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/donation-criteria');
  });

  test('debe mostrar la portada con el título institucional', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Dona conocimiento/i);
    await expect(page.getByText(/Tu donación de libros y materiales bibliográficos/i)).toBeVisible();
  });

  test('debe renderizar las secciones de criterios y de proceso', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Criterios detallados/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Así funciona la donación/i })).toBeVisible();
  });

  test('la sección de criterios es alcanzable por su ancla', async ({ page }) => {
    await page.goto('/donation-criteria#criterios');

    await expect(page.locator('#criterios')).toBeInViewport();
  });

  test('no debe romperse en viewport móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // El body nunca debe desbordar horizontalmente
    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(desborda).toBe(false);
  });
});
