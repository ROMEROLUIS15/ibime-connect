/**
 * ChatOrchestrator — Deterministic routing engine for the IBIME AI assistant.
 *
 * Responsibilities:
 *   1. Classify the user's intent (via IntentClassifier — no LLM)
 *   2. Route to the correct flow:
 *      - "registration" → Direct DB tool call (LLM only used to ask for email when missing)
 *      - "catalog"      → RAG retrieval + LLM generation
 *      - "general"      → LLM generation with institutional knowledge only
 *   3. Apply ResponsePolicy as the last gate before any response reaches the user
 *   4. Emit structured observability logs
 *   5. Return a unified ChatResponse
 *
 * REGISTRATION FLOW DESIGN (critical):
 *   The LLM is NEVER allowed to produce the final answer for registration queries.
 *   When the email is known → executeTool('consultar_inscripciones') directly → format → return.
 *   When the email is unknown → LLM only asks the user for their email (no DB access).
 *   This eliminates hallucination at the source by removing the LLM from the critical path.
 */

import type { ChatResponse } from '@shared/types/domain.js';
import type { ILLMProvider, LLMMessage } from '../../domain/interfaces/index.js';
import { inject, injectable } from 'tsyringe';
import { createHash } from 'crypto';
import { classifyIntent } from './intent-classifier.js';
import { applyResponsePolicy, type ChatIntent as PolicyIntent } from './response-policy.js';
import { contextLogger } from '../../infrastructure/logger/index.js';
import { CHAT_SYSTEM_PROMPT } from './system-prompt.js';
import { ToolRegistry } from '../../services/tools.service.js';
import { CheckRegistrationTool } from '../../services/tools/check_registration.tool.js';
import type { SessionMemoryService } from '../../services/session-memory.service.js';

export interface ChatOrchestratorInput {
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>;
  /** UUID estable generado por el cliente al iniciar la conversación. */
  sessionId?: string;
}

/** Fallback hardcoded para cuando el LLM no devuelve nada al pedir el email */
const ASK_FOR_EMAIL_FALLBACK =
  '¡Claro que sí! Con mucho gusto te ayudo a verificar tus inscripciones. Por favor, indícame tu correo electrónico registrado para buscarlo en nuestro sistema.';

@injectable()
export class ChatOrchestrator {
  private toolRegistry: ToolRegistry;

  constructor(
    private llmProvider: ILLMProvider,
    private ragService: typeof import('../../services/rag.service.js').RAGService extends new (...args: any[]) => infer T ? T : never,
    @inject('SessionMemoryService') private sessionMemory: SessionMemoryService | null = null
  ) {
    this.toolRegistry = new ToolRegistry();
    this.toolRegistry.registerTool(new CheckRegistrationTool());
  }

  async process(input: ChatOrchestratorInput, requestId?: string): Promise<ChatResponse> {
    const logger = contextLogger(requestId);
    const { userMessage, conversationHistory } = input;
    const startTime = Date.now();

    logger.info('ChatOrchestrator processing request', {
      userMessageLength: userMessage.length,
      historyLength: conversationHistory.length,
    });

    const { intent, confidence } = classifyIntent(userMessage);
    logger.info('Intent classified', { intent, confidence });

    let result: ChatResponse;
    switch (intent) {
      case 'registration':
        result = await this.handleRegistration(userMessage, conversationHistory, requestId, input.sessionId);
        break;
      case 'catalog':
        result = await this.handleCatalog(userMessage, conversationHistory, requestId);
        break;
      case 'general':
      default:
        result = await this.handleGeneral(userMessage, conversationHistory, requestId);
        break;
    }

    const duration = Date.now() - startTime;
    logger.info('ChatOrchestrator request complete', {
      intent,
      duration,
      tokensUsed: result.tokensUsed,
      sourceCount: result.sources.length,
      answerLength: result.answer.length,
    });

    return result;
  }

  // ─── History Trimmer ─────────────────────────────────────────────────────
  private trimHistory(
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    maxTurns = 3
  ): Array<{ role: 'user' | 'assistant'; text: string }> {
    const maxMessages = maxTurns * 2;
    if (history.length <= maxMessages) return history;
    return history.slice(history.length - maxMessages);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRATION FLOW
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // TWO exclusive branches — no overlap, no LLM leakage:
  //
  //   BRANCH A (email known):
  //     executeTool('consultar_inscripciones') → parse → formatRegistrationResponse → applyPolicy
  //     ↑ LLM is NEVER called. isDbBacked = true. Guardrail skipped.
  //
  //   BRANCH B (email unknown):
  //     LLM with system prompt → asks user for email → applyPolicy
  //     ↑ LLM only produces a question, never a registration claim.
  //
  // Privacy gate runs BEFORE both branches to block second-email attacks.
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleRegistration(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
    requestId?: string,
    sessionId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);

    // Deriva un ID de sesión estable si no lo proporcionó el cliente.
    // Usa el primer mensaje del historial como base (estable a partir del turno 2).
    const effectiveSessionId: string | null =
      sessionId ?? (conversationHistory.length > 0
        ? this.deriveSessionId(conversationHistory[0].text)
        : null);

    // ─── PRIVACY GATE ────────────────────────────────────────────────────────
    // Fuente primaria: Redis (servidor). Fuente secundaria: historial del cliente.
    // El email del servidor siempre gana sobre el del cliente (a prueba de manipulación).
    const emailInCurrentMessage = this.extractEmailFromText(userMessage);

    // Consulta Redis como fuente autoritativa
    let serverEmail: string | null = null;
    if (effectiveSessionId && this.sessionMemory) {
      const ctx = await this.sessionMemory.getSessionContext(effectiveSessionId);
      serverEmail = ctx?.firstEmail ?? null;
    }

    // Fallback: extraer del historial del cliente si Redis no tiene datos
    const firstEmailInHistory = serverEmail ?? this.extractEmailFromConversation(conversationHistory, '');

    logger.info('Privacy Gate inputs', {
      effectiveSessionId,
      serverEmail,
      firstEmailInHistory,
      emailInCurrentMessage,
    });

    if (
      firstEmailInHistory !== null &&
      emailInCurrentMessage !== null &&
      emailInCurrentMessage !== firstEmailInHistory
    ) {
      logger.warn('Privacy gate triggered: second email detected in same session', {
        firstEmail: firstEmailInHistory,
        newEmail: emailInCurrentMessage,
      });
      return this.applyPolicy(
        'Para proteger tu privacidad y procesar una nueva consulta correctamente, por favor inicia un nuevo chat. ¡Estaré encantado de ayudarte con ese otro correo!',
        'registration',
        [],
        0,
        true,
        logger
      );
    }

    // Guardar email en Redis la primera vez que se captura
    if (emailInCurrentMessage && !serverEmail && effectiveSessionId && this.sessionMemory) {
      await this.sessionMemory.saveSessionContext(effectiveSessionId, {
        firstEmail: emailInCurrentMessage,
      });
      logger.info('Privacy Gate: email saved to session store', {
        sessionId: effectiveSessionId,
        email: emailInCurrentMessage,
      });
    }

    // Resuelve el email: servidor > cliente > mensaje actual
    const existingEmail = firstEmailInHistory ?? emailInCurrentMessage;
    logger.info('Registration flow', { hasEmail: existingEmail !== null, email: existingEmail });

    // ─── BRANCH A: EMAIL KNOWN → DIRECT TOOL CALL, NO LLM ───────────────────
    if (existingEmail !== null) {
      logger.info('BRANCH A — direct tool call, LLM bypassed entirely', { email: existingEmail });

      let rawResult: string;
      try {
        rawResult = await this.toolRegistry.executeTool(
          'consultar_inscripciones',
          JSON.stringify({ email: existingEmail })
        );
      } catch (toolExecError) {
        logger.error('Direct tool execution threw an exception', {
          email: existingEmail,
          error: String(toolExecError),
        });
        return this.applyPolicy(
          `Tuve un problema técnico al consultar el sistema para ${existingEmail}. Por favor intenta de nuevo en unos minutos o contáctanos al 0274-2623898.`,
          'registration',
          [],
          0,
          true,
          logger
        );
      }

      logger.info('BRANCH A — direct tool result received', {
        email: existingEmail,
        resultLength: rawResult?.length ?? 0,
      });

      if (!rawResult || rawResult.trim() === '') {
        return this.applyPolicy(
          `No recibí respuesta del sistema de inscripciones para ${existingEmail}. Por favor intenta más tarde o contacta al soporte.`,
          'registration',
          [],
          0,
          true,
          logger
        );
      }

      try {
        const parsed = JSON.parse(rawResult);
        const answer = this.formatRegistrationResponse(parsed, existingEmail);
        return this.applyPolicy(answer, 'registration', [], 0, true, logger);
      } catch (parseError) {
        logger.error('BRANCH A — failed to parse JSON result', {
          email: existingEmail,
          rawResult: rawResult.substring(0, 300),
          parseError: String(parseError),
        });
        return this.applyPolicy(
          `No pude interpretar la respuesta del sistema para ${existingEmail}. Por favor intenta de nuevo o contacta al soporte (contactoibime@gmail.com).`,
          'registration',
          [],
          0,
          true,
          logger
        );
      }
    }

    // ─── BRANCH B: EMAIL UNKNOWN → LLM asks user for email ──────────────────
    logger.info('BRANCH B — no email found, LLM will ask user for email');

    const ragResult = await this.ragService.retrieveContext(userMessage, { matchCount: 5 }, requestId);
    const systemPrompt = CHAT_SYSTEM_PROMPT + this.formatRagContextForPrompt(ragResult.context);
    const trimmedHistory = this.trimHistory(conversationHistory);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await this.llmProvider.generateAnswer(
      messages,
      { temperature: 0.2, maxTokens: 200 },
      requestId
    );

    const answer = response.content || ASK_FOR_EMAIL_FALLBACK;
    return this.applyPolicy(answer, 'registration', ragResult.sources, response.tokensUsed, false, logger);
  }

  // ─── CATALOG FLOW ───────────────────────────────────────────────────────
  private async handleCatalog(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);

    const ragResult = await this.ragService.retrieveContext(userMessage, { matchCount: 5 }, requestId);
    logger.info('Catalog flow RAG result', {
      hit: ragResult.hit,
      maxSimilarity: ragResult.maxSimilarity,
      sourceCount: ragResult.sources.length,
    });

    const systemPrompt = CHAT_SYSTEM_PROMPT + this.formatRagContextForPrompt(ragResult.context);
    const trimmedHistory = this.trimHistory(conversationHistory);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await this.llmProvider.generateAnswer(messages, {
      temperature: 0.3,
      maxTokens: 350,
    }, requestId);

    const answer = response.content || '';
    return this.applyPolicy(answer, 'catalog', ragResult.sources, response.tokensUsed, false, logger);
  }

  // ─── GENERAL FLOW ───────────────────────────────────────────────────────
  private async handleGeneral(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);

    if (this.isGreeting(userMessage)) {
      logger.info('Detected greeting — using deterministic response');
      return { answer: this.getGreetingResponse(userMessage), sources: [], tokensUsed: 0 };
    }

    const ragResult = await this.ragService.retrieveContext(userMessage, { matchCount: 5 }, requestId);
    logger.info('General flow RAG result', {
      hit: ragResult.hit,
      maxSimilarity: ragResult.maxSimilarity,
      sourceCount: ragResult.sources.length,
    });

    if (!ragResult.hit) {
      logger.info('RAG miss (fail-hard) — using fallback LLM call');
      return this.handleGeneralFallback(userMessage, conversationHistory, requestId);
    }

    const systemPrompt = CHAT_SYSTEM_PROMPT + this.formatRagContextForPrompt(ragResult.context);
    const trimmedHistory = this.trimHistory(conversationHistory);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await this.llmProvider.generateAnswer(messages, {
      temperature: 0.3,
      maxTokens: 350,
    }, requestId);

    const answer = response.content || '';
    return this.applyPolicy(answer, 'general', ragResult.sources, response.tokensUsed, false, logger);
  }

  // ─── GENERAL FALLBACK ───────────────────────────────────────────────────
  private async handleGeneralFallback(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);
    logger.info('Using general fallback (no RAG context)');

    const systemPrompt =
      CHAT_SYSTEM_PROMPT +
      '\n\nNota: No se encontró información específica en la base de conocimientos para esta consulta. Responde con tu conocimiento institucional general o indica amablemente que no tienes esa información disponible.';
    const trimmedHistory = this.trimHistory(conversationHistory);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await this.llmProvider.generateAnswer(messages, {
      temperature: 0.3,
      maxTokens: 300,
    }, requestId);

    const answer = response.content || '';
    return this.applyPolicy(answer, 'general', [], response.tokensUsed, false, logger);
  }

  // ─── ResponsePolicy wrapper ─────────────────────────────────────────────
  private applyPolicy(
    answer: string,
    intent: PolicyIntent,
    sources: any[],
    tokensUsed: number,
    isDbBacked: boolean,
    logger: ReturnType<typeof contextLogger>
  ): ChatResponse {
    const policyResult = applyResponsePolicy(answer, intent, isDbBacked);

    if (!policyResult.valid) {
      logger.warn('ResponsePolicy BLOCKED response', {
        intent,
        isDbBacked,
        reason: policyResult.reason,
        originalSnippet: answer.substring(0, 100),
      });
    }

    return { answer: policyResult.answer, sources, tokensUsed };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  /**
   * Extrae el primer email válido de un string arbitrario.
   */
  private extractEmailFromText(text: string): string | null {
    if (!text || text.trim() === '') return null;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const validationRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
    const matches = text.match(emailRegex);
    if (!matches) return null;
    const candidate = matches[0].toLowerCase().trim();
    return validationRegex.test(candidate) ? candidate : null;
  }

  /**
   * Extrae el primer email del historial + (opcionalmente) del mensaje actual.
   * Si currentMessage es '' (vacío), sólo analiza el historial.
   */
  private extractEmailFromConversation(
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    currentMessage: string
  ): string | null {
    const sources = currentMessage.trim() === ''
      ? history
      : [...history, { role: 'user' as const, text: currentMessage }];

    const allText = sources.map(m => m.text).join(' ');
    return this.extractEmailFromText(allText);
  }


  /**
   * Deriva un sessionId estable a partir del primer mensaje del usuario.
   * Usado como fallback cuando el frontend no envía un UUID de sesión.
   * NO es criptográficamente seguro — solo es un identificador estable de conversación.
   */
  private deriveSessionId(firstUserMessage: string): string {
    return createHash('sha256')
      .update(firstUserMessage.slice(0, 200))
      .digest('hex')
      .slice(0, 24);
  }

  private isGreeting(message: string): boolean {
    const normalized = message.toLowerCase().trim();
    return (
      /^(hola|buenos|buenas|hey|saludos|qué tal|que tal|hi|buen día|buen dia)$/i.test(normalized) ||
      /^(hola|buenos|buenas|hey|saludos)\s/i.test(normalized)
    );
  }

  private getGreetingResponse(message: string): string {
    const normalized = message.toLowerCase().trim();
    if (/\bnoche/i.test(normalized)) return '¡Buenas noches! Soy el Asistente IBIME. ¿En qué puedo ayudarte?';
    if (/\btarde/i.test(normalized)) return '¡Buenas tardes! Soy el Asistente IBIME. ¿En qué puedo ayudarte?';
    return '¡Hola! Soy el Asistente IBIME. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre nuestros servicios, horarios, talleres o información institucional.';
  }

  private formatRagContextForPrompt(ragContext: string): string {
    if (!ragContext || ragContext.trim() === '') return '';
    return `\n\n${ragContext}\n\nUtiliza la información anterior como referencia para responder con precisión. Si no es relevante para la pregunta del usuario, responde con tu conocimiento institucional.`;
  }

  private formatRegistrationResponse(result: any, email: string): string {
    if (!result || typeof result !== 'object') {
      return `No pude obtener información del sistema para el correo ${email}. Por favor intenta de nuevo o contacta al soporte (contactoibime@gmail.com).`;
    }

    if (result.error) {
      return `Tuve un inconveniente técnico al consultar las inscripciones para ${email}. Por favor intenta en unos minutos o comunícate con nosotros al 0274-2623898.`;
    }

    // PRIORIDAD 1: hay cursos → mostrarlos siempre (evaluado ANTES de result.status)
    if (Array.isArray(result.cursos) && result.cursos.length > 0) {
      const cantidad = result.cantidad_cursos ?? result.cursos.length;
      const courseList = result.cursos
        .filter((c: any) => typeof c === 'string' && c.trim() !== '')
        .map((c: string) => `• ${c.trim()}`)
        .join('\n');
      return `¡Encontré tu inscripción! Estás registrado(a) en ${cantidad} curso(s):\n${courseList}\n\n¿Hay algo más en lo que pueda ayudarte?`;
    }

    // PRIORIDAD 2: sin cursos, estado explícito
    if (result.status === 'no_registrado') {
      return `No encontré inscripciones activas en el sistema para el correo **${email}**. ¿Es posible que hayas usado un correo diferente al registrarte, o que aún no te hayas inscrito en algún taller? Puedes contactarnos al 0274-2623898 para más información.`;
    }

    // PRIORIDAD 3: estado 'registrado' pero array vacío/ausente (inconsistencia de DB)
    if (result.status === 'registrado') {
      return `El sistema indica que tienes un registro para el correo ${email}, pero no pude obtener el detalle de los cursos en este momento. Por favor contáctanos al 0274-2623898 para que podamos ayudarte directamente.`;
    }

    // Fallback seguro — nunca expone internals de depuración al usuario
    return `No pude procesar la respuesta del sistema para el correo ${email}. Por favor intenta de nuevo o contáctanos al 0274-2623898 o a contactoibime@gmail.com.`;
  }
}
