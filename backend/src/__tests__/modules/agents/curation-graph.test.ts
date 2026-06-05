import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurationGraph } from '../../../modules/agents/curation-graph.js';
import type { ILLMProvider } from '../../../domain/interfaces/index.js';

// Mock supabaseClient para aislar los tests de la conexión real a base de datos
vi.mock('../../../config/supabase.config.js', () => {
  return {
    supabaseClient: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          in: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      })
    }
  };
});

describe('CurationGraph', () => {
  let graph: CurationGraph;
  let mockLLMProvider: ILLMProvider;

  beforeEach(() => {
    mockLLMProvider = {
      generateAnswer: vi.fn()
    };
    graph = new CurationGraph(mockLLMProvider);
    vi.clearAllMocks();
  });

  it('debería extraer y curar correctamente un elemento válido en una iteración', async () => {
    vi.mocked(mockLLMProvider.generateAnswer).mockResolvedValue({
      content: JSON.stringify([
        {
          title: "Taller de Pintura Mérida",
          category: "curso",
          content: "Este curso enseña a pintar paisajes merideños tradicionales utilizando óleo.",
          keyDetails: "Todos los sábados de 9am a 12m"
        }
      ]),
      tokensUsed: 150,
      model: 'llama-3.1-8b-instant'
    });

    const result = await graph.curate("Texto que contiene información sobre el taller de pintura");

    expect(result.approved).toBe(true);
    expect(result.extractedItems).toHaveLength(1);
    expect(result.extractedItems[0].title).toBe("Taller de Pintura Mérida");
    expect(result.extractedItems[0].category).toBe("curso");
    expect(result.conflicts).toHaveLength(0);
    expect(result.iterations).toBe(1);
  });

  it('debería entrar en el ciclo reflexivo de autocorrección ante un JSON con conflictos', async () => {
    // Primera llamada (extractor): devuelve un JSON con categorías y contenidos inválidos
    // Segunda llamada (corrector): devuelve el JSON corregido resolviendo las inconsistencias
    vi.mocked(mockLLMProvider.generateAnswer)
      .mockResolvedValueOnce({
        content: JSON.stringify([
          {
            title: "Taller de Costura",
            category: "invalido", // Provoca conflicto de categoría
            content: "Corto",      // Provoca conflicto de longitud
            keyDetails: ""
          }
        ]),
        tokensUsed: 100,
        model: 'llama-3.1-8b-instant'
      })
      .mockResolvedValueOnce({
        content: JSON.stringify([
          {
            title: "Taller de Costura - Edición 2026",
            category: "curso", // Corregido!
            content: "Un taller completo de costura básica impartido en las instalaciones del IBIME Mérida.", // Corregido!
            keyDetails: "Lunes a Viernes de 2pm a 5pm"
          }
        ]),
        tokensUsed: 120,
        model: 'llama-3.1-8b-instant'
      });

    const result = await graph.curate("Texto sobre costura en el IBIME");

    // Debería ser aprobado después de la corrección
    expect(result.approved).toBe(true);
    expect(result.extractedItems[0].category).toBe("curso");
    expect(result.extractedItems[0].content.length).toBeGreaterThan(20);
    expect(result.conflicts).toHaveLength(0);
  });

  it('debería registrar conflictos estructurados de Zod si el LLM devuelve un formato de datos inválido en extractorNode', async () => {
    vi.mocked(mockLLMProvider.generateAnswer).mockResolvedValue({
      content: JSON.stringify([
        {
          title: "", // Título vacío (Error Zod)
          category: "invalido", // Categoría inválida (Error Zod)
          content: "Corto", // Contenido muy corto (Error Zod)
          keyDetails: ""
        }
      ]),
      tokensUsed: 80,
      model: 'llama-3.1-8b-instant'
    });

    const result = (await graph['compiledGraph'].invoke({
      rawText: "Texto de prueba inválido",
      extractedItems: [],
      conflicts: [],
      iterations: 2, // Fuerza a finalizar en la primera validación sin entrar al bucle corrector
      approved: false,
    })) as any;

    expect(result.approved).toBe(false);
    expect(result.conflicts).toContain('Fallo de validación estructurada del catálogo.');
    expect(result.conflicts.some((c: string) => c.includes('title') || c.includes('título'))).toBe(true);
    expect(result.conflicts.some((c: string) => c.includes('category') || c.includes('categoría'))).toBe(true);
    expect(result.conflicts.some((c: string) => c.includes('content') || c.includes('contenido'))).toBe(true);
  });
});
