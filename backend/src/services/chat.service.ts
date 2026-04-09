import type { ILLMProvider } from '../domain/interfaces/index.js';
import type { RAGService } from './rag.service.js';
import { contextLogger } from '../infrastructure/logger/index.js';
import type { ChatResponse } from '../../../shared/types/domain.js';

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
3. Libro Hablado: Servicio de audiolibros y recursos accesibles para personas con discapacidad visual.
4. Fondo Editorial: Publicaciones y material editorial del IBIME.
5. Alfabetización Digital: Talleres gratuitos de computación y uso de internet, especialmente para adultos mayores.
6. Club de Lectura: Reuniones mensuales de discusión literaria.
7. Cuentacuentos Infantil: Sesiones de narración oral para niños de 3 a 10 años con actividades interactivas.
8. Talleres culturales: Talleres de escritura, exposiciones y actividades culturales gratuitas.

== CATÁLOGO KOHA ==
Para consultar libros disponibles, reservar o gestionar préstamos, los usuarios deben acceder directamente al sistema Koha en: http://www.ibime.gob.ve:8001/
Si el usuario pregunta por un libro específico, indícale que lo busque en el catálogo Koha o que llame al 0274-2623898. No puedes dar información de existencias en tiempo real.

== INSTRUCCIONES ==
- Responde SOLO sobre temas relacionados con el IBIME, bibliotecas, cultura, educación y servicios bibliotecarios de Mérida.
- Si alguien pregunta algo fuera de ese ámbito, redirige amablemente hacia los servicios del IBIME.
- Sé conciso: máximo 3-4 oraciones por respuesta, salvo que el usuario pida más detalles.
- Si no tienes información exacta, indica que el usuario puede llamar al 0274-2623898 o escribir a contactoibime@gmail.com.
- NUNCA inventes datos de libros, existencias o disponibilidad.
- Usa un tono cálido, profesional e institucional.`;

  constructor(
    private llmProvider: ILLMProvider,
    private ragService: RAGService
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
      logger.debug('Retrieving context via RAGService');
      const { context: ragContext, sources } = await this.ragService.retrieveContext(userMessage, undefined, requestId);

      const systemPrompt = ChatService.IBIME_SYSTEM_PROMPT + ragContext;
      const llmMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.text,
        })),
        { role: 'user' as const, content: userMessage },
      ];

      logger.debug('Generating answer via LLMProvider');
      const { content: answer, tokensUsed } = await this.llmProvider.generateAnswer(llmMessages, undefined, requestId);

      const duration = Date.now() - startTime;
      logger.info('Chat processing completed', { duration, tokensUsed, sourcesFound: sources.length });

      return {
        answer,
        sources,
        tokensUsed,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Chat processing failed', { error, duration });
      throw error;
    }
  }
}
