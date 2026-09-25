import { injectable, inject } from 'tsyringe';
import { StateGraph, Annotation, CompiledStateGraph } from '@langchain/langgraph';
import type { ILLMProvider, LLMMessage } from '../../domain/interfaces/index.js';
import { supabaseClient } from '../../config/supabase.config.js';
import { logger } from '../../infrastructure/logger/index.js';
import { wrapChain } from '../../infrastructure/observability/tracing.js';
import { z } from 'zod';

export interface ExtractedItem {
  title: string;
  category: 'libro' | 'evento' | 'tramite' | 'horario' | 'curso' | 'servicio' | 'contacto';
  content: string;
  keyDetails: string;
}

// ─── 1. Definición del Estado de LangGraph ─────────────────────────────────
export const CurationStateAnnotation = Annotation.Root({
  rawText: Annotation<string>(),
  extractedItems: Annotation<ExtractedItem[]>(),
  conflicts: Annotation<string[]>(),
  iterations: Annotation<number>(),
  approved: Annotation<boolean>(),
});

export type CurationState = typeof CurationStateAnnotation.State;

/** Tope de salida de las llamadas del extractor y del corrector. */
const LLM_MAX_TOKENS = 800;

/** Por encima de esta espera, GroqProvider está reportando la cuota diaria, no la del minuto. */
const DAILY_QUOTA_WAIT_SEC = 3600;

/**
 * Traduce el fallo de una llamada al LLM del grafo en un conflicto que diga la causa.
 * Antes cualquier error (cuota de Groq, respuesta cortada, red) se reportaba como
 * "JSON Parsing Error", sin indicar si había que esperar o dividir el documento.
 */
export function describeCurationFailure(error: unknown, finishReason?: string): string {
  const message = error instanceof Error ? error.message : String(error);

  // GroqProvider lanza "RATE_LIMIT_EXCEEDED:<segundos>:<mensaje para el chat>".
  if (message.startsWith('RATE_LIMIT_EXCEEDED:')) {
    const waitSec = Number(message.split(':')[1]) || 60;
    if (waitSec >= DAILY_QUOTA_WAIT_SEC) {
      return 'Se alcanzó la cuota diaria de Groq. Reintenta mañana.';
    }
    return `Se agotó el presupuesto por minuto de Groq: reintenta en ${waitSec} s. Si el documento es largo, divídelo (cada llamada reserva el texto completo más la respuesta).`;
  }

  if (finishReason === 'length') {
    return `La respuesta del LLM se cortó en el límite de ${LLM_MAX_TOKENS} tokens: el documento tiene demasiados ítems. Divídelo en documentos más cortos.`;
  }

  if (message === 'Empty response from Groq') {
    return 'El LLM devolvió una respuesta vacía. Reintenta; si se repite, divide el documento.';
  }

  if (error instanceof SyntaxError) {
    return 'Fallo al estructurar o interpretar la información extraída (JSON Parsing Error).';
  }

  return `Fallo al llamar al LLM: ${message.slice(0, 200)}`;
}

@injectable()
export class CurationGraph {
  private compiledGraph: CompiledStateGraph<CurationState, any, any>;

  constructor(
    @inject('ILLMProvider') private llmProvider: ILLMProvider
  ) {
    this.compiledGraph = this.buildGraph();
  }

  curate = wrapChain(
    async (rawText: string, requestId?: string): Promise<CurationState> => {
      return this._curate(rawText, requestId);
    },
    'CurationGraph.curate',
    { graph: 'curation' }
  );

  private async _curate(rawText: string, requestId?: string): Promise<CurationState> {
    const startTime = Date.now();
    logger.info({ requestId, textLength: rawText.length }, 'CurationGraph: starting curating execution');

    try {
      const finalState = (await this.compiledGraph.invoke(
        {
          rawText,
          extractedItems: [],
          conflicts: [],
          iterations: 0,
          approved: false,
        },
        { configurable: { requestId } }
      )) as CurationState;

      const duration = Date.now() - startTime;
      logger.info(
        {
          requestId,
          duration,
          iterations: finalState.iterations,
          approved: finalState.approved,
          conflictsCount: finalState.conflicts.length,
          extractedItemsCount: finalState.extractedItems?.length ?? 0,
        },
        'CurationGraph: curating execution completed'
      );

      return finalState;
    } catch (error) {
      logger.error(error as Error, 'CurationGraph: critical execution failure');
      throw new Error('Failed to run curation graph workflow', { cause: error });
    }
  }

  // ─── 2. Nodos del Grafo ──────────────────────────────────────────────────

  /**
   * Nodo Extractor: Llama al LLM para parsear y estructurar el texto en JSON
   */
  private async extractorNode(state: CurationState, config?: any): Promise<Partial<CurationState>> {
    const requestId = config?.configurable?.requestId;
    logger.info({ requestId, iteration: state.iterations }, 'CurationGraph: Extractor Node executing');

    const systemPrompt = 
      'Eres el Agente Extractor de Conocimiento del IBIME.\n' +
      'Tu misión es analizar el texto crudo proporcionado y extraer una lista de elementos importantes ' +
      '(talleres, cursos, libros, trámites de la biblioteca, etc.).\n\n' +
      'Debes clasificar cada elemento exactamente en una de las siguientes categorías:\n' +
      '["libro", "evento", "tramite", "horario", "curso", "servicio", "contacto"]\n\n' +
      'REGLA DE FORMATO ESTRICTA:\n' +
      'Debes responder ÚNICAMENTE con un array JSON válido sin bloques markdown (sin ```json) y sin explicaciones.\n' +
      'Si no hay información extraíble, responde con un array vacío "[]".\n\n' +
      'Formato JSON requerido:\n' +
      '[\n' +
      '  {\n' +
      '    "title": "Nombre del curso o elemento",\n' +
      '    "category": "curso" | "libro" | "evento" | "tramite" | "horario" | "servicio" | "contacto",\n' +
      '    "content": "Descripción semántica y detallada del elemento (mínimo 20 caracteres)",\n' +
      '    "keyDetails": "Detalles clave (ej. fechas, profesores, horarios de atención)"\n' +
      '  }\n' +
      ']';

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Texto a analizar:\n${state.rawText}` }
    ];

    const extractedItemSchema = z.object({
      title: z.string().min(1, 'El título no puede estar vacío.'),
      category: z.enum(['libro', 'evento', 'tramite', 'horario', 'curso', 'servicio', 'contacto']),
      content: z.string().min(20, 'El contenido descriptivo debe tener al menos 20 caracteres.'),
      keyDetails: z.string().default(''),
    });

    const curationResultSchema = z.array(extractedItemSchema);

    let finishReason: string | undefined;
    try {
      const response = await this.llmProvider.generateAnswer(
        messages,
        { temperature: 0.1, maxTokens: LLM_MAX_TOKENS },
        requestId
      );
      finishReason = response.finishReason;

      const content = response.content?.trim() ?? '[]';
      // Limpiar posibles decoraciones markdown si el LLM ignoró la instrucción
      const jsonText = content.replace(/^```json/i, '').replace(/```$/, '').trim();

      const items = JSON.parse(jsonText);
      const validationResult = curationResultSchema.safeParse(items);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(
          (e: any) => `Error en "${e.path.join('.')}": ${e.message}`
        );
        logger.warn({ requestId, errors: errorMessages }, 'CurationGraph: Extractor Node JSON failed schema validation');
        return {
          extractedItems: [],
          iterations: state.iterations + 1,
          conflicts: [
            'Fallo de validación estructurada del catálogo.',
            ...errorMessages
          ]
        };
      }

      return {
        extractedItems: validationResult.data as ExtractedItem[],
        iterations: state.iterations + 1,
        conflicts: []
      };
    } catch (err) {
      logger.warn({ requestId, error: String(err), finishReason }, 'CurationGraph: Extractor Node failed');
      return {
        extractedItems: [],
        iterations: state.iterations + 1,
        conflicts: [describeCurationFailure(err, finishReason)]
      };
    }
  }

  /**
   * Nodo Validador: Chequea colisiones en Supabase e inconsistencias lógicas
   */
  private async validatorNode(state: CurationState, config?: any): Promise<Partial<CurationState>> {
    const requestId = config?.configurable?.requestId;
    logger.info({ requestId }, 'CurationGraph: Validator Node executing');

    const conflicts: string[] = [];
    const items = state.extractedItems ?? [];

    if (state.conflicts && state.conflicts.length > 0) {
      // Si el nodo extractor ya reportó conflictos (ej. JSON inválido), los mantenemos
      return { conflicts: state.conflicts, approved: false };
    }

    if (items.length === 0) {
      return {
        conflicts: ['No se detectó ni extrajo ningún elemento de información válido.'],
        approved: false,
      };
    }

    // 1. Validación de reglas locales
    const uniqueTitles = new Set<string>();
    const validCategories = ['libro', 'evento', 'tramite', 'horario', 'curso', 'servicio', 'contacto'];

    for (const item of items) {
      const normalizedTitle = item.title?.toLowerCase().trim();

      if (!normalizedTitle) {
        conflicts.push('Se detectó un elemento con título vacío.');
        continue;
      }

      if (uniqueTitles.has(normalizedTitle)) {
        conflicts.push(`Título duplicado detectado en el mismo lote: "${item.title}"`);
      }
      uniqueTitles.add(normalizedTitle);

      if (!validCategories.includes(item.category)) {
        conflicts.push(`Categoría inválida "${item.category}" para "${item.title}". Debe ser una de: ${validCategories.join(', ')}`);
      }

      if (!item.content || item.content.trim().length < 20) {
        conflicts.push(`El contenido para "${item.title}" es demasiado corto o no contiene información semántica relevante.`);
      }
    }

    // 2. Validación de duplicados en la base de datos Supabase (batch por columna).
    // El título real puede estar en la columna `title` (semilla, Koha) o solo en
    // `metadata.title`: la ingesta de PDF guarda la columna como "{documento} (Parte N)".
    const titles = items
      .map((item) => item.title?.trim())
      .filter((t): t is string => !!t);

    if (titles.length > 0) {
      try {
        const [byColumn, byMetadata] = await Promise.all([
          supabaseClient.from('knowledge_base').select('title').in('title', titles),
          supabaseClient.from('knowledge_base').select('metadata').in('metadata->>title', titles),
        ]);

        if (byColumn.error) throw byColumn.error;
        if (byMetadata.error) throw byMetadata.error;

        const existingTitles = new Set<string>(
          [
            ...(byColumn.data ?? []).map((row: { title: string | null }) => row.title),
            ...(byMetadata.data ?? []).map((row: { metadata: { title?: unknown } | null }) => row.metadata?.title),
          ].filter((t): t is string => typeof t === 'string')
        );
        for (const item of items) {
          const normalized = item.title?.trim();
          if (normalized && existingTitles.has(normalized)) {
            conflicts.push(`El elemento "${item.title}" ya existe en la base de datos institucional.`);
          }
        }
      } catch (dbError) {
        // Fail-closed: si no podemos verificar duplicados, NO aprobamos el lote a ciegas.
        // Aprobar sin verificar permitiría ingestar duplicados justo cuando la DB falla.
        logger.warn(
          { requestId, error: String(dbError) },
          'CurationGraph: DB validation error — el lote no se aprueba sin verificar duplicados'
        );
        conflicts.push('No se pudo verificar duplicados contra la base de datos institucional (error de conexión).');
      }
    }

    return {
      conflicts,
      approved: conflicts.length === 0
    };
  }

  /**
   * Nodo Corrector: LLM analiza los conflictos y re-escribe el lote estructurado
   */
  private async correctorNode(state: CurationState, config?: any): Promise<Partial<CurationState>> {
    const requestId = config?.configurable?.requestId;
    logger.info({ requestId, conflictsCount: state.conflicts.length }, 'CurationGraph: Corrector Node executing');

    const systemPrompt = 
      'Eres el Agente Corrector de Contenidos del IBIME.\n' +
      'Se han detectado inconsistencias o colisiones al validar el lote de información extraído.\n\n' +
      'Tu misión es analizar la lista de conflictos y corregir el JSON para dejarlos válidos:\n' +
      '1. Si un título ya existe en la base de datos institucional, renómbralo de manera sutil ' +
      '(ej. añade " - Cohorte II", " - Edición 2026" o una especificación temporal similar) para evitar la colisión.\n' +
      '2. Corrige las categorías erróneas para que correspondan exactamente a los valores aprobados.\n' +
      '3. Aumenta y enriquece la descripción de los elementos si fueron marcados como demasiado cortos.\n\n' +
      'REGLA DE FORMATO ESTRICTA:\n' +
      'Responde ÚNICAMENTE con el array JSON corregido sin explicaciones ni markdown (sin ```json).\n\n' +
      'Conflictos reportados:\n' +
      JSON.stringify(state.conflicts, null, 2);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `JSON original con errores:\n${JSON.stringify(state.extractedItems, null, 2)}` }
    ];

    let finishReason: string | undefined;
    try {
      const response = await this.llmProvider.generateAnswer(
        messages,
        { temperature: 0.2, maxTokens: LLM_MAX_TOKENS },
        requestId
      );
      finishReason = response.finishReason;

      const content = response.content?.trim() ?? '[]';
      const jsonText = content.replace(/^```json/i, '').replace(/```$/, '').trim();
      const correctedItems = JSON.parse(jsonText) as ExtractedItem[];

      return {
        extractedItems: correctedItems,
        iterations: state.iterations + 1,
        conflicts: [] // Limpiamos los conflictos para que el validador vuelva a evaluar la corrección
      };
    } catch (err) {
      logger.error(err as Error, 'CurationGraph: Corrector Node failed to fix JSON');
      return {
        iterations: state.iterations + 1,
        conflicts: [...state.conflicts, `Agente Corrector: ${describeCurationFailure(err, finishReason)}`]
      };
    }
  }

  // ─── 3. Ensamblaje del Grafo ─────────────────────────────────────────────

  private buildGraph(): CompiledStateGraph<CurationState, any, any> {
    const workflow = new StateGraph(CurationStateAnnotation)
      .addNode('extractor', (state, config) => this.extractorNode(state, config))
      .addNode('validator', (state, config) => this.validatorNode(state, config))
      .addNode('corrector', (state, config) => this.correctorNode(state, config));

    // Estructuramos las conexiones
    workflow.addEdge('__start__', 'extractor');
    workflow.addEdge('extractor', 'validator');

    // Transición condicional: Ciclo Reflexivo
    workflow.addConditionalEdges(
      'validator',
      (state) => {
        // Si hay conflictos y no hemos superado el límite de 3 iteraciones, vamos a corregir
        if (state.conflicts.length > 0 && state.iterations < 3) {
          logger.info({ iterations: state.iterations }, 'CurationGraph: validation failed, routing to corrector');
          return 'corrector';
        }
        logger.info({ approved: state.approved }, 'CurationGraph: completing workflow');
        return '__end__';
      },
      {
        corrector: 'corrector',
        __end__: '__end__'
      }
    );

    // Si el corrector corrige, vuelve a enrutar a validación
    workflow.addEdge('corrector', 'validator');

    return workflow.compile();
  }
}
