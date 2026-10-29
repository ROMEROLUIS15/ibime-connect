import { test, expect } from '@playwright/test';

test.describe('Formularios IBIME', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('debe enviar el formulario de contacto exitosamente', async ({ page }) => {
    // Aislar del backend real simulando respuesta 200 (evita fallos en CI sin base de datos)
    await page.route('**/*contact*', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Scroll hasta la sección de contacto
    await page.locator('#contacto').scrollIntoViewIfNeeded();

    // Llenar campos usando IDs específicos para evitar colisiones
    await page.locator('#name').fill('Test E2E');
    await page.locator('#email').fill('e2e@test.com');
    await page.locator('#message').fill('Este es un mensaje automático de prueba E2E.');

    // Click en enviar
    await page.getByRole('button', { name: /Enviar Mensaje/i }).click();

    // Verificar notificación de éxito (Regex flexible para evitar problemas de encoding con '¡')
    await expect(page.getByText(/Mensaje enviado/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('debe inscribirse a un evento exitosamente', async ({ page }) => {
    // Aislar del backend real simulando respuesta 200 (evita fallos en CI sin base de datos)
    await page.route('**/*registrations*', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Scroll hasta la sección de eventos
    await page.locator('#eventos').scrollIntoViewIfNeeded();

    // Click en el primer botón de inscribirse
    await page.getByRole('button', { name: /Inscribirse/i }).first().click();

    // Llenar modal usando IDs específicos (localizados en el modal)
    await page.locator('#reg-name').fill('Inscripción E2E');
    await page.locator('#reg-email').fill('e2e_events@test.com');
    await page.locator('#reg-phone').fill('+58 412 5555555');

    // Alejar el cursor: tras el clic en "Inscribirse" puede quedar justo en el borde de
    // "Confirmar", y el efecto hover de btn-hero (translate + scale) lo hace parpadear.
    await page.mouse.move(0, 0);

    // Confirmar
    await page.getByRole('button', { name: /Confirmar Inscripción/i }).click();

    // Verificar notificación de éxito (Regex flexible para evitar problemas de encoding con '¡')
    await expect(page.getByText(/Inscripción exitosa/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('avisa que ya está inscrito si el correo ya está en ese curso', async ({ page }) => {
    // El backend responde 409 cuando el correo ya está inscrito en el curso (UNIQUE email + curso).
    await page.route('**/*registrations*', async (route) => {
      await route.fulfill({
        status: 409,
        json: { text: 'Ya estás inscrito en este curso. Si necesitas actualizar tus datos, llámanos al 0274-2623898.' },
      });
    });

    await page.locator('#eventos').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /Inscribirse/i }).first().click();
    await page.locator('#reg-name').fill('Inscripción E2E');
    await page.locator('#reg-email').fill('e2e_events@test.com');
    await page.locator('#reg-phone').fill('+58 412 5555555');
    await page.mouse.move(0, 0);
    await page.getByRole('button', { name: /Confirmar Inscripción/i }).click();

    await expect(page.getByText(/Ya estás inscrito en este curso/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Inscripción exitosa/i)).toHaveCount(0);
  });
});
