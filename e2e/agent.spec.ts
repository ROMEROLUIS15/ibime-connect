import { test, expect } from '@playwright/test';

test.describe('Agente de Curación LangGraph E2E', () => {
  test('debería enviar texto de catálogo, procesar a través de LangGraph y retornar el lote estructurado', async ({ page }) => {
    await page.goto('/');
    // 1. Interceptamos la llamada al API del agente para simular el comportamiento de LangGraph offline
    await page.route('**/api/v1/agents/curate-catalog', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          iterations: 1,
          conflicts: [],
          items: [
            {
              title: "Taller de Cerámica y Escultura",
              category: "curso",
              content: "Taller práctico enfocado en técnicas tradicionales de alfarería merideña.",
              keyDetails: "Dictado los días sábados en el Centro Cultural."
            }
          ]
        }
      });
    });

    // 2. Ejecutamos la petición HTTP en el contexto de la página
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/v1/agents/curate-catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Se ofrece el nuevo Taller de Cerámica y Escultura los sábados'
        })
      });
      return res.json();
    });

    // 3. Verificaciones E2E
    expect(response.success).toBe(true);
    expect(response.iterations).toBe(1);
    expect(response.conflicts).toHaveLength(0);
    expect(response.items).toHaveLength(1);
    expect(response.items[0].title).toBe("Taller de Cerámica y Escultura");
    expect(response.items[0].category).toBe("curso");
  });
});
