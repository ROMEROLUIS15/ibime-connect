import type { ILLMProvider, LLMMessage } from '../domain/interfaces/index.js';
import type { RAGService } from './rag.service.js';
import { contextLogger } from '../infrastructure/logger/index.js';
import type { ChatResponse } from '../shared/types/domain.js';
import type { ToolRegistry } from './tools.service.js';

export class ChatService {
  private static readonly IBIME_SYSTEM_PROMPT = `Eres el Asistente Virtual oficial del IBIME (Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida, Venezuela).

Tu nombre es "Asistente IBIME". Respondes siempre en español, de manera amigable, institucional y concisa.

== INFORMACIÓN INSTITUCIONAL ==
- Institución: IBIME — Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida
- Gobernación: Estado Bolivariano de Mérida, Venezuela
- Dirección: Sector Glorias Patrias, Calle 1 Los Eucaliptos, entre Av. Gonzalo Picón y Tulio Febres, Mérida, Venezuela
- Teléfono: 0274-2623898
- Correo: contactoibime@gmail.com
- Web: ibime-connect.vercel.app
- Redes sociales: @ibimegob (Twitter/X, Facebook, Instagram) | YouTube: @ibime1800

== HORARIO DE ATENCIÓN ==
- Lunes a Viernes: 8:00 a.m. a 12:00 p.m. y 1:00 p.m. a 4:00 p.m.
- Sábados y domingos: Cerrado

== SERVICIOS PRINCIPALES ==
1. Red Bibliotecaria: 6 distritos cubriendo Norte, Sur, Este, Oeste, Central y Periférico. Total >40 bibliotecas y >71 puntos de lectura.
2. Sistema Koha: Sistema integrado de gestión bibliotecaria de código abierto. Permite buscar libros, revistas y recursos digitales, gestionar préstamos, renovaciones y reservas. Acceso: http://www.ibime.gob.ve:8001/
3. Alfabetización Digital: Talleres gratuitos de computación y uso de internet.

== CATÁLOGO KOHA ==
Para consultar libros disponibles, los usuarios deben usar el sistema Koha en: http://www.ibime.gob.ve:8001/

== REVISIÓN DE INSCRIPCIONES (HERRAMIENTAS) ==
Para verificar en cuáles cursos está inscrito un usuario, ES OBLIGATORIO usar la herramienta 'consultar_inscripciones'.
REGLA DE USO: Si el usuario pregunta por sus cursos o inscripciones, y AÚN NO TE HA DICHO SU CORREO ELECTRÓNICO, no uses la herramienta todavía.
CÓMO RESPONDER: En lugar de negarte o disculparte, responde con mucho entusiasmo y amabilidad. Por ejemplo: "¡Claro que sí! Con mucho gusto te ayudo a verificarlo. Por favor, indícame tu correo electrónico registrado para buscarlo en nuestro sistema". NUNCA uses frases negativas como "Lo siento, no puedo ayudarte sin tu correo".
SOLAMENTE CUANDO el usuario te haya escrito su correo real en la conversación, entonces SÍ usarás la herramienta 'consultar_inscripciones' pasándole ese correo como argumento.

== INSTRUCCIONES GENERALES ==
- Responde SOLO sobre temas del IBIME.
- Usa un tono cálido, profesional e institucional.`;

  constructor(
    private llmProvider: ILLMProvider,
    private ragService: RAGService,
    private toolRegistry?: ToolRegistry
  ) {}

  async processChat(
    input: {
      userMessage: string;
      conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>;
    },
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);
    const { userMessage, conversationHistory } = input;

    logger.info('Processing chat request', {
      userMessageLength: userMessage.length,
      historyLength: conversationHistory.length,
    });

    const startTime = Date.now();

    try {
      const { context: ragContext, sources } = await this.ragService.retrieveContext(userMessage, undefined, requestId);

      const systemPrompt = ChatService.IBIME_SYSTEM_PROMPT + '\n' + ragContext;
      const llmMessages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.text,
        })),
        { role: 'user', content: userMessage },
      ];

      const availableTools = this.toolRegistry?.getTools() || [];

      logger.debug('Generating first answer via LLMProvider');
      let response = await this.llmProvider.generateAnswer(llmMessages, { tools: availableTools }, requestId);
      let totalTokens = response.tokensUsed;

      // Handle tool calls loop
      if (response.toolCalls && response.toolCalls.length > 0 && this.toolRegistry) {
        logger.info('LLM requested tool calls', { count: response.toolCalls.length });
        
        // Append the assistant's request for tools to the message history so the model knows what happened
        llmMessages.push({
          role: 'assistant',
          content: response.content || '',
          tool_calls: response.toolCalls
        });

        // Execute all requested tools
        for (const toolCall of response.toolCalls) {
          logger.info(`Executing tool ${toolCall.function.name}`, { args: toolCall.function.arguments });
          const toolResult = await this.toolRegistry.executeTool(toolCall.function.name, toolCall.function.arguments);
          
          llmMessages.push({
            role: 'tool',
            content: toolResult,
            name: toolCall.function.name,
            tool_call_id: toolCall.id
          });
        }

        // Generate the final answer passing the tool responses back to the LLM
        logger.debug('Generating final answer after tool executions');
        response = await this.llmProvider.generateAnswer(llmMessages, { tools: availableTools }, requestId);
        totalTokens += response.tokensUsed;
      }

      const duration = Date.now() - startTime;
      logger.info('Chat processing completed', { duration, totalTokens, sourcesFound: sources.length });

      return {
        answer: response.content || 'Sin respuesta',
        sources,
        tokensUsed: totalTokens,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Chat processing failed', { error, duration });
      throw error;
    }
  }
}
