import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurationGraph } from '../../../modules/agents/curation-graph.js';
import type { ILLMProvider } from '../../../domain/interfaces/index.js';

const mocks = vi.hoisted(() => ({ inMock: vi.fn() }));

vi.mock('../../../config/supabase.config.js', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        in: mocks.inMock,
      }),
    }),
  },
}));

// --- Fixtures -----------------------------------------------------------------

const VALID_ITEM = {
  title: 'Taller de Pintura Merida',
  category: 'curso',
  content: 'Este curso ensena a pintar paisajes merida tradicionales utilizando oleo.',
  keyDetails: 'Todos los sabados de 9am a 12m',
};

const INVALID_ITEM = {
  title: '',
  category: 'invalido',
  content: 'Corto',
  keyDetails: '',
};

// --- Suite --------------------------------------------------------------------

describe('CurationGraph', () => {
  let graph: CurationGraph;
  let mockLLMProvider: ILLMProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.inMock.mockResolvedValue({ data: [], error: null });

    mockLLMProvider = { generateAnswer: vi.fn() };
    graph = new CurationGraph(mockLLMProvider);
  });

  describe('curate — successful path (single iteration)', () => {
    it('should extract and approve a valid item in one iteration when the LLM output passes schema validation', async () => {
      // Arrange
      vi.mocked(mockLLMProvider.generateAnswer).mockResolvedValue({
        content: JSON.stringify([VALID_ITEM]),
        tokensUsed: 150,
        model: 'openai/gpt-oss-20b',
      });

      // Act
      const result = await graph.curate('Texto que contiene informacion sobre el taller de pintura');

      // Assert
      expect(result.approved).toBe(true);
      expect(result.extractedItems).toHaveLength(1);
      expect(result.extractedItems[0]).toMatchObject({
        title: VALID_ITEM.title,
        category: VALID_ITEM.category,
      });
      expect(result.conflicts).toHaveLength(0);
      expect(result.iterations).toBe(1);
    });
  });

  describe('curate — self-correction loop (two iterations)', () => {
    it('should trigger the self-correction loop and return an approved item on the second iteration', async () => {
      // Arrange — first call returns invalid data, second call fixes it
      vi.mocked(mockLLMProvider.generateAnswer)
        .mockResolvedValueOnce({
          content: JSON.stringify([{ title: 'Taller de Costura', category: 'invalido', content: 'Corto', keyDetails: '' }]),
          tokensUsed: 100,
          model: 'openai/gpt-oss-20b',
        })
        .mockResolvedValueOnce({
          content: JSON.stringify([{
            title: 'Taller de Costura - Edicion 2026',
            category: 'curso',
            content: 'Un taller completo de costura basica impartido en las instalaciones del IBIME Merida.',
            keyDetails: 'Lunes a Viernes de 2pm a 5pm',
          }]),
          tokensUsed: 120,
          model: 'openai/gpt-oss-20b',
        });

      // Act
      const result = await graph.curate('Texto sobre costura en el IBIME');

      // Assert
      expect(result.approved).toBe(true);
      expect(result.extractedItems[0].category).toBe('curso');
      expect(result.extractedItems[0].content.length).toBeGreaterThan(20);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('curate — rejection after max iterations', () => {
    it('should mark result as not approved and report descriptive conflicts when data remains invalid after all retries', async () => {
      // Arrange — LLM always returns the same invalid data
      vi.mocked(mockLLMProvider.generateAnswer).mockResolvedValue({
        content: JSON.stringify([INVALID_ITEM]),
        tokensUsed: 80,
        model: 'openai/gpt-oss-20b',
      });

      // Act
      const result = await graph.curate('Texto de prueba invalido');

      // Assert
      expect(result.approved).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
      // Conflicts must mention the problematic field names for traceability
      expect(result.conflicts.some((c) => c.includes('title') || c.includes('elemento'))).toBe(true);
    });
  });

  describe('validator — duplicates against knowledge_base (RAG-06)', () => {
    it.each([
      ['the title column (seed, Koha)', 'title', { title: VALID_ITEM.title, metadata: null }],
      ['metadata.title (PDF chunks titled "… (Parte N)")', 'metadata->>title', { title: 'Catalogo.pdf (Parte 1)', metadata: { title: VALID_ITEM.title } }],
    ])('should flag an item whose title already exists in %s', async (_label, column, existingRow) => {
      // Arrange — only the query that filters by `column` finds the existing row
      mocks.inMock.mockImplementation((filteredColumn: string) =>
        Promise.resolve({ data: filteredColumn === column ? [existingRow] : [], error: null })
      );
      vi.mocked(mockLLMProvider.generateAnswer).mockResolvedValue({
        content: JSON.stringify([VALID_ITEM]),
        tokensUsed: 150,
        model: 'openai/gpt-oss-20b',
      });

      // Act
      const result = await graph.curate('Texto con un taller que ya existe en la base');

      // Assert
      expect(result.approved).toBe(false);
      expect(result.conflicts).toContain(`El elemento "${VALID_ITEM.title}" ya existe en la base de datos institucional.`);
    });
  });
});
