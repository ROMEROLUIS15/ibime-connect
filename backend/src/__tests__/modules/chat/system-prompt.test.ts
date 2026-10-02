import { describe, it, expect } from 'vitest';
import { CHAT_SYSTEM_PROMPT } from '../../../modules/chat/system-prompt.js';

describe('CHAT_SYSTEM_PROMPT', () => {
  it('points citizens to the public Koha catalog (OPAC), not the staff login', () => {
    // :8000 es el catálogo público (OPAC); :8001 es el inicio de sesión del personal.
    expect(CHAT_SYSTEM_PROMPT).toContain('http://www.ibime.gob.ve:8000/');
    expect(CHAT_SYSTEM_PROMPT).not.toContain(':8001');
  });

  it('describes the library network as the 5 axes and 58 libraries of the official maps', () => {
    // Fuente: los mapas oficiales de cada eje, transcritos en frontend/src/data/library-network.ts.
    expect(CHAT_SYSTEM_PROMPT).toContain('58 bibliotecas públicas en 5 ejes');
    for (const axis of ['Metropolitano (17', 'Panamericano (12)', 'Mocotíes (11)', 'Páramo (11)', 'Pueblo del Sur (7)']) {
      expect(CHAT_SYSTEM_PROMPT).toContain(axis);
    }
    // Dato retirado del sitio en agosto de 2026: no debe volver al asistente.
    expect(CHAT_SYSTEM_PROMPT).not.toMatch(/distritos|71 puntos de lectura/i);
  });

  it('does not tell the model to use tools, because it is never given any', () => {
    // La consulta de inscripciones la hace el código (rama A del orquestador), no el
    // modelo. Si el prompt ordena usar una herramienta que no se envía, el modelo intenta
    // llamarla y Groq rechaza la petición (tool_use_failed, visto en producción el 2026-09-25).
    expect(CHAT_SYSTEM_PROMPT).not.toContain('consultar_inscripciones');
    expect(CHAT_SYSTEM_PROMPT).not.toMatch(/herramienta/i);
  });

  it('still tells the model to ask for the registered email and never guess enrollments', () => {
    expect(CHAT_SYSTEM_PROMPT).toContain('indícame tu correo electrónico registrado');
    expect(CHAT_SYSTEM_PROMPT).toContain('NUNCA inventes, asumas o adivines información sobre inscripciones');
  });

  it('forbids claiming the IBIME holds a specific book unless it is in the retrieved context', () => {
    expect(CHAT_SYSTEM_PROMPT).toContain('NUNCA afirmes que el IBIME o sus bibliotecas tienen un libro');
    expect(CHAT_SYSTEM_PROMPT).toMatch(/disponible[^\n]*Koha/);
  });
});
