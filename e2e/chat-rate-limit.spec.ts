import { test, expect, type Page } from '@playwright/test';

/**
 * La cuota de Groq se agota de verdad (~132 respuestas/día en el free tier), así
 * que el usuario VE estas respuestas. Se interceptan las llamadas para no gastar
 * cuota real ni depender del LLM en CI.
 */

async function abrirChatYPreguntar(page: Page, mensaje = '¿Cuál es el horario?') {
  await page.goto('/');
  await page.getByRole('button', { name: /Abrir Asistente/i }).click();
  await expect(page.getByRole('dialog', { name: /Asistente Virtual/i })).toBeVisible();

  await page.getByPlaceholder(/Escribe tu consulta/i).fill(mensaje);
  await page.keyboard.press('Enter');
}

test.describe('Asistente IBIME — límites de uso', () => {
  test('muestra un mensaje de espera cuando se satura el límite por minuto', async ({ page }) => {
    await page.route('**/*chat*', (route) =>
      route.fulfill({
        status: 429,
        json: {
          text: 'El asistente está muy ocupado en este momento. Por favor intenta de nuevo en 12 segundos.',
          retryAfterSeconds: 12,
        },
      })
    );

    await abrirChatYPreguntar(page);

    await expect(page.getByText(/muy ocupado/i)).toBeVisible({ timeout: 15000 });
  });

  test('invita a volver mañana cuando se agota la cuota diaria', async ({ page }) => {
    // El TPD es el límite que realmente aprieta: no se recupera en segundos,
    // sino a medianoche UTC. El mensaje debe reflejarlo.
    await page.route('**/*chat*', (route) =>
      route.fulfill({
        status: 429,
        json: {
          text: 'El asistente alcanzó su cuota de consultas por hoy. Por favor intenta de nuevo mañana.',
          retryAfterSeconds: 40000,
        },
      })
    );

    await abrirChatYPreguntar(page);

    await expect(page.getByText(/mañana/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/\d+ segundos/)).toHaveCount(0);
  });

  test('degrada con un mensaje legible si el backend falla', async ({ page }) => {
    await page.route('**/*chat*', (route) => route.fulfill({ status: 500, json: { text: 'Error interno' } }));

    await abrirChatYPreguntar(page);

    // No debe quedarse colgado en el indicador de carga ni mostrar un stack trace
    await expect(page.getByText(/at\s+\w+\s+\(/)).toHaveCount(0);
  });
});
