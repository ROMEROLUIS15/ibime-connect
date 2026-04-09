import { test, expect } from '@playwright/test';

test.describe('Asistente Virtual IBIME', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/');
  });

  test('debe abrir la ventana de chat y responder a un saludo', async ({ page }) => {
    // Aislar la IA simulando una respuesta 200 (evita fallos en CI sin base de datos)
    await page.route('**/*chat*', async (route) => {
      await route.fulfill({ 
        status: 200, 
        json: { 
          response: "Hola, soy el asistente virtual del IBIME. Ofrecemos servicios de biblioteca, préstamos interbibliotecarios, eventos culturales y asesoría para investigaciones." 
        } 
      });
    });

    // 1. Click en el botón del asistente
    const chatButton = page.getByRole('button', { name: /Abrir Asistente/i });
    await expect(chatButton).toBeVisible();
    await chatButton.click();

    // 2. Verificar que se abre el panel
    const chatPanel = page.getByRole('dialog', { name: /Asistente Virtual/i });
    await expect(chatPanel).toBeVisible();

    // 3. Enviar un mensaje
    const input = page.getByPlaceholder(/Escribe tu consulta/i);
    await input.fill('Hola, ¿qué servicios ofrecen?');
    await page.keyboard.press('Enter');

    // 4. Verificar que aparece el mensaje del usuario
    await expect(page.getByText('Hola, ¿qué servicios ofrecen?')).toBeVisible();

    // 5. Esperar la respuesta del asistente (timeout extendido para IA)
    // El asistente muestra "..." mientras carga, luego llega el texto.
    const assistantMessage = page.locator('div', { hasText: /IBIME/ }).last();
    // Esperamos un tiempo razonable para el LLM
    await expect(assistantMessage).toBeVisible({ timeout: 60000 });
    
    // Verificar que la respuesta contiene texto útil
    const text = await assistantMessage.innerText();
    expect(text.length).toBeGreaterThan(20);
  });
});
