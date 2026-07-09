import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// pdf-parse is a CJS module that doesn't expose a native ESM default export
// Using createRequire is the correct pattern for CJS interop in pure ESM projects
const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer }) => PdfParser };
import { contextLogger } from '../infrastructure/logger/index.js';

export interface DocumentChunk {
  content: string;
  metadata?: Record<string, any>;
}

interface PdfParser {
  getText(): Promise<{ pages: { text: string }[]; total: number }>;
  destroy(): Promise<void>;
}

/** Texto plano de un PDF, junto al número de páginas de las que salió. */
export type PdfTextExtractor = (buffer: Buffer) => Promise<{ text: string; numpages: number }>;

/**
 * Extractor por defecto sobre pdf-parse v2, cuya API es una clase (`PDFParse`)
 * y no la función invocable que exponía la v1.
 *
 * Se concatena `pages[].text` en lugar de usar el `text` agregado: ese último
 * intercala marcadores de página ("-- 1 of 3 --") que acabarían indexados como
 * contenido en la base de conocimientos.
 */
const defaultPdfExtractor: PdfTextExtractor = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const { pages, total } = await parser.getText();
    return { text: pages.map((p) => p.text).join('\n\n'), numpages: total };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
};

export class DocumentProcessorService {
  private static CHUNK_SIZE = 1000;
  private static CHUNK_OVERLAP = 200;

  /** El extractor se inyecta para poder sustituirlo en tests: `require` esquiva los mocks de Vitest. */
  constructor(private readonly extractPdf: PdfTextExtractor = defaultPdfExtractor) {}

  /**
   * Extrae el texto de un archivo PDF en memoria (Buffer)
   */
  async extractTextFromPdf(buffer: Buffer, requestId?: string): Promise<string> {
    const logger = contextLogger(requestId);
    logger.debug('Iniciando extracción de texto del PDF...');

    try {
      const data = await this.extractPdf(buffer);
      logger.info('Texto extraído exitosamente del PDF', {
        pages: data.numpages,
        textLength: data.text.length
      });
      return data.text;
    } catch (error) {
      logger.error('Error al procesar el archivo PDF', { error });
      throw new Error('Fallo al extraer el texto del PDF', { cause: error });
    }
  }

  /**
   * Divide un texto largo en pequeños fragmentos (chunks) con solapamiento (overlap)
   * para mantener el contexto semántico entre párrafos.
   */
  chunkText(text: string, metadata: Record<string, any> = {}, requestId?: string): DocumentChunk[] {
    const logger = contextLogger(requestId);
    logger.debug('Iniciando división de texto (Chunking)...', { textLength: text.length });

    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: DocumentChunk[] = [];
    let startIndex = 0;

    // Limpiamos espacios múltiples y saltos de línea excesivos
    const cleanText = text.replace(/\s+/g, ' ').trim();

    while (startIndex < cleanText.length) {
      // Calculamos el fin tentativo del chunk
      let endIndex = startIndex + DocumentProcessorService.CHUNK_SIZE;

      // Si no hemos llegado al final del texto, buscamos un punto o espacio natural para cortar
      if (endIndex < cleanText.length) {
        const lastPeriod = cleanText.lastIndexOf('.', endIndex);
        const lastSpace = cleanText.lastIndexOf(' ', endIndex);
        
        // Preferimos cortar en el último punto (fin de oración) dentro de nuestro límite
        if (lastPeriod > startIndex + (DocumentProcessorService.CHUNK_SIZE / 2)) {
          endIndex = lastPeriod + 1;
        } else if (lastSpace > startIndex) {
          // Si no hay punto, cortamos en el último espacio
          endIndex = lastSpace;
        }
      } else {
        endIndex = cleanText.length;
      }

      const chunkContent = cleanText.slice(startIndex, endIndex).trim();
      if (chunkContent.length > 0) {
        chunks.push({
          content: chunkContent,
          metadata: { ...metadata, index: chunks.length }
        });
      }

      // Avanzamos el índice de inicio, restando el overlap para crear solapamiento
      startIndex = endIndex - DocumentProcessorService.CHUNK_OVERLAP;
      
      // Si el solapamiento nos lleva hacia atrás sin avanzar realmente, forzamos el avance
      if (startIndex <= chunks.length * (DocumentProcessorService.CHUNK_SIZE - DocumentProcessorService.CHUNK_OVERLAP)) {
         startIndex = endIndex; // Fallback de seguridad para evitar loops infinitos
      }
    }

    logger.info('Texto dividido en chunks exitosamente', { chunksCreated: chunks.length });
    return chunks;
  }
}
