import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../infrastructure/logger/index.js', () => ({
  contextLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { DocumentProcessorService, type PdfTextExtractor } from '../../services/document-processor.service.js';

// --- Helpers ------------------------------------------------------------------

const CHUNK_SIZE = 1000;

/**
 * PDF mínimo válido con una línea de texto. Se construye a mano para no depender
 * de un fixture binario en el repo ni de una librería de generación.
 */
function buildPdf(texto: string): Buffer {
  const stream = `BT /F1 18 Tf 20 100 Td (${texto}) Tj ET`;
  const pdf =
    '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R' +
    '/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
    `4 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream endobj\n` +
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
    'trailer<</Root 1 0 R/Size 6>>\n%%EOF';
  return Buffer.from(pdf, 'latin1');
}

/** Texto de `count` palabras únicas ("w000 w001 …"), 5 chars por palabra. */
function uniqueWords(count: number): string {
  return Array.from({ length: count }, (_, i) => `w${String(i).padStart(3, '0')}`).join(' ');
}

const firstWord = (s: string) => s.split(' ')[0];
const lastWord = (s: string) => s.split(' ').at(-1)!;

// --- Suite --------------------------------------------------------------------

describe('DocumentProcessorService', () => {
  let service: DocumentProcessorService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentProcessorService();
  });

  describe('chunkText — casos borde', () => {
    it('devuelve un array vacío para una cadena vacía', () => {
      expect(service.chunkText('')).toEqual([]);
    });

    it('devuelve un array vacío para un texto de solo espacios', () => {
      expect(service.chunkText('   \n\t  ')).toEqual([]);
    });

    it('devuelve un único chunk cuando el texto es más corto que el límite', () => {
      const chunks = service.chunkText('El IBIME abre de 8am a 4pm.');

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('El IBIME abre de 8am a 4pm.');
    });

    it('colapsa espacios múltiples y saltos de línea en un solo espacio', () => {
      const chunks = service.chunkText('Hola   \n\n  mundo \t cruel');

      expect(chunks[0].content).toBe('Hola mundo cruel');
    });
  });

  describe('chunkText — metadata', () => {
    it('propaga la metadata recibida y añade un índice incremental', () => {
      const chunks = service.chunkText(uniqueWords(500), { source: 'reglamento.pdf' });

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk, i) => {
        expect(chunk.metadata).toEqual({ source: 'reglamento.pdf', index: i });
      });
    });

    it('funciona sin metadata, dejando solo el índice', () => {
      const chunks = service.chunkText('texto corto');

      expect(chunks[0].metadata).toEqual({ index: 0 });
    });
  });

  describe('chunkText — puntos de corte', () => {
    it('corta en el final de una oración cuando hay un punto pasada la mitad del chunk', () => {
      const text = 'a'.repeat(600) + '. ' + 'b'.repeat(600);

      const chunks = service.chunkText(text);

      expect(chunks[0].content).toBe('a'.repeat(600) + '.');
      expect(chunks[0].content.endsWith('.')).toBe(true);
    });

    it('ignora un punto demasiado temprano y corta en el último espacio', () => {
      // El punto está en el índice 10, muy por debajo de CHUNK_SIZE/2 (500),
      // así que no sirve como corte de oración.
      const text = 'Doctor A. ' + uniqueWords(400);

      const chunks = service.chunkText(text);

      expect(chunks[0].content.endsWith('.')).toBe(false);
      // No parte una palabra por la mitad
      expect(lastWord(chunks[0].content)).toMatch(/^w\d{3}$/);
    });

    it('nunca produce un chunk más largo que el límite de 1000 caracteres', () => {
      const chunks = service.chunkText(uniqueWords(800));

      expect(chunks.length).toBeGreaterThan(2);
      for (const chunk of chunks) {
        expect(chunk.content.length).toBeLessThanOrEqual(CHUNK_SIZE);
      }
    });
  });

  describe('chunkText — solapamiento', () => {
    it('solapa los chunks a partir del segundo, repitiendo el final del anterior', () => {
      const chunks = service.chunkText(uniqueWords(500));

      expect(chunks).toHaveLength(3);
      // La cola del chunk 2 reaparece al principio del chunk 3.
      expect(chunks[2].content).toContain(lastWord(chunks[1].content));
      expect(firstWord(chunks[2].content)).not.toBe(firstWord(chunks[1].content));
    });

    it('DEFECTO CONOCIDO: el primer y el segundo chunk no solapan', () => {
      // El "fallback de seguridad" de chunkText (startIndex <= chunks.length *
      // (CHUNK_SIZE - CHUNK_OVERLAP)) se dispara en la primera iteración —
      // 800 <= 1*800 — y descarta el overlap recién calculado. Resultado: el
      // corte 1→2 pierde su contexto semántico, justo lo que el overlap existe
      // para evitar. Los cortes siguientes sí solapan 200 caracteres.
      //
      // Este test fija el comportamiento ACTUAL. Al corregir el fallback debe
      // pasar a afirmar lo contrario (que sí hay solapamiento).
      const chunks = service.chunkText(uniqueWords(500));

      expect(chunks[1].content).not.toContain(lastWord(chunks[0].content));
      expect(chunks[1].content).not.toContain(`${lastWord(chunks[0].content)} `);
    });

    it('no pierde texto: cada palabra del original aparece en algún chunk', () => {
      const text = uniqueWords(500);
      const chunks = service.chunkText(text);
      const cubierto = chunks.map((c) => c.content).join(' ');

      for (const palabra of text.split(' ')) {
        expect(cubierto).toContain(palabra);
      }
    });

    it('termina siempre (no entra en bucle infinito) con texto sin espacios ni puntos', () => {
      // Sin espacios ni puntos no hay corte natural: endIndex se queda en
      // startIndex + CHUNK_SIZE y el fallback debe garantizar el avance.
      const chunks = service.chunkText('x'.repeat(2500));

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every((c) => c.content.length <= CHUNK_SIZE)).toBe(true);
    });
  });

  describe('extractTextFromPdf — con extractor inyectado', () => {
    it('devuelve el texto que produce el extractor', async () => {
      const extractor = vi.fn(async () => ({ text: 'Reglamento del IBIME', numpages: 3 }));
      const svc = new DocumentProcessorService(extractor);

      await expect(svc.extractTextFromPdf(Buffer.from('%PDF-1.4'))).resolves.toBe('Reglamento del IBIME');
      expect(extractor).toHaveBeenCalledOnce();
    });

    it('envuelve el fallo del extractor en un error de dominio, conservando la causa', async () => {
      const causa = new Error('Invalid PDF structure');
      const svc = new DocumentProcessorService(vi.fn().mockRejectedValue(causa) as unknown as PdfTextExtractor);

      await expect(svc.extractTextFromPdf(Buffer.from('roto')))
        .rejects.toThrow('Fallo al extraer el texto del PDF');
      await expect(svc.extractTextFromPdf(Buffer.from('roto')))
        .rejects.toMatchObject({ cause: causa });
    });
  });

  describe('extractTextFromPdf — extractor real sobre pdf-parse v2', () => {
    // Regresión: el código llamaba `pdfParse(buffer)` como en la v1, pero la v2
    // exporta la clase PDFParse. El endpoint /upload-pdf devolvía siempre error.
    it('extrae el texto de un PDF real', async () => {
      const texto = await new DocumentProcessorService().extractTextFromPdf(buildPdf('Hola IBIME'));

      expect(texto).toContain('Hola IBIME');
    });

    it('no incluye los marcadores de página que pdf-parse añade a su texto agregado', async () => {
      // `getText().text` intercala "-- 1 of 1 --"; se usa pages[].text para evitar
      // que esos marcadores acaben indexados como conocimiento.
      const texto = await new DocumentProcessorService().extractTextFromPdf(buildPdf('Contenido util'));

      expect(texto).not.toMatch(/--\s*\d+\s+of\s+\d+\s*--/);
    });

    it('rechaza un buffer que no es un PDF', async () => {
      await expect(new DocumentProcessorService().extractTextFromPdf(Buffer.from('no soy un pdf')))
        .rejects.toThrow('Fallo al extraer el texto del PDF');
    });
  });
});
