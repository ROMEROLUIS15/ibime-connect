import { test, expect } from '@playwright/test';

test.describe('Formularios IBIME', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('debe enviar el formulario de contacto exitosamente', async ({ page }) => {
    // Aislar del backend real simulando respuesta 200 (evita fallos en CI sin base de datos)
    await page.route('**/api/contact/messages', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Scroll hasta la sección de contacto
    await page.locator('#contacto').scrollIntoViewIfNeeded();

    // Llenar campos
    await page.getByLabel(/Nombre Completo/i).first().fill('Test E2E');
    await page.getByLabel(/Correo Electrónico/i).first().fill('e2e@test.com');
    await page.getByLabel(/Mensaje/i).fill('Este es un mensaje automático de prueba E2E.');

    // Click en enviar
    await page.getByRole('button', { name: /Enviar Mensaje/i }).click();

    // Verificar notificación de éxito
    await expect(page.getByText(/¡Mensaje enviado!/i)).toBeVisible();
  });

  test('debe inscribirse a un evento exitosamente', async ({ page }) => {
    // Aislar del backend real simulando respuesta 200 (evita fallos en CI sin base de datos)
    await page.route('**/api/courses/register', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Scroll hasta la sección de eventos
    await page.locator('#eventos').scrollIntoViewIfNeeded();

    // Click en el primer botón de inscribirse
    await page.getByRole('button', { name: /Inscribirse/i }).first().click();

    // Llenar modal
    await page.getByLabel(/Nombre Completo/i).last().fill('Inscripción E2E');
    await page.getByLabel(/Correo Electrónico/i).last().fill('e2e_events@test.com');
    await page.getByLabel(/Teléfono/i).fill('0412-555.55.55');

    // Confirmar
    await page.getByRole('button', { name: /Confirmar Inscripción/i }).click();

    // Verificar éxito
    await expect(page.getByText(/¡Inscripción exitosa!/i)).toBeVisible();
  });
});
