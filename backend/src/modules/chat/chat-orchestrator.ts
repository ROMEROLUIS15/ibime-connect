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
import type { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service.js';
import type { VerificationThrottleService } from '../../services/verification-throttle.service.js';
import { maskEmail } from '../../utils/pii.util.js';

export interface ChatOrchestratorInput {
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>;
  /** UUID estable generado por el cliente al iniciar la conversación. */
  sessionId?: string;
}

/** Fallback hardcoded para cuando el LLM no devuelve nada al pedir el email */
const ASK_FOR_EMAIL_FALLBACK =
  '¡Claro que sí! Con mucho gusto te ayudo a verificar tus inscripciones. Por favor, indícame tu correo electrónico registrado para buscarlo en nuestro sistema.';

/**
 * Solicitud determinista del teléfono como prueba de propiedad.
 * Se muestra cuando ya tenemos el correo pero falta verificar la identidad.
 */
const ASK_FOR_PHONE =
  'Para proteger tus datos personales, antes de mostrarte tus inscripciones necesito verificar tu identidad. ¿Me confirmas el número de teléfono con el que te registraste?';

/**
 * Respuesta GENÉRICA anti-enumeración. Idéntica tanto si el correo no existe como
 * si el teléfono no coincide: así nunca se revela si un correo está o no registrado.
 */
const NOT_VERIFIED_GENERIC =
  'No encontré inscripciones que coincidan con los datos proporcionados. Verifica que el correo y el teléfono sean exactamente los que usaste al registrarte. Si el problema persiste, contáctanos al 0274-2623898 o a contactoibime@gmail.com.';

/** Mensaje cuando el throttle anti fuerza-bruta bloquea temporalmente un correo. */
const THROTTLE_MSG =
  'Por seguridad hemos pausado temporalmente la verificación para este correo debido a varios intentos seguidos. Por favor intenta de nuevo en unos minutos, o contáctanos directamente al 0274-2623898 para ayudarte.';

/** Error técnico genérico — nunca expone detalles internos ni el correo consultado. */
const TECH_ERROR_MSG =
  'Tuve un problema técnico al consultar el sistema de inscripciones. Por favor intenta de nuevo en unos minutos o contáctanos al 0274-2623898.';

/**
 * Prefijo inyectado al systemPrompt cuando el usuario parece frustrado.
 * Solo afecta a los flujos que invocan el LLM (Branch B, catalog, general).
 * Branch A (DB directo) es completamente inmune a esta variable.
 */
const EMPATHY_ALERT =
  'ALERTA DE FRUSTRACIÓN: El usuario está experimentando problemas o molestia. ' +
  'Adopta un tono de máxima empatía humana, sé breve, valida su frustración de inmediato, ' +
  'y recuérdale con total cortesía que si lo prefiere puede llamarnos directamente al ' +
  '0274-2623898 para asistencia manual.\n\n';

@injectable()
export class ChatOrchestrator {
  private toolRegistry: ToolRegistry;

  constructor(
    private llmProvider: ILLMProvider,
    private ragService: typeof import('../../services/rag.service.js').RAGService extends new (...args: any[]) => infer T ? T : never,
    @inject('SessionMemoryService') private sessionMemory: SessionMemoryService | null = null,
    @inject('SentimentAnalyzerService') private sentimentAnalyzer: SentimentAnalyzerService | null = null,
    @inject('VerificationThrottleService') private verificationThrottle: VerificationThrottleService | null = null
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

    // ── Sentiment analysis (síncrono, puro, <1ms) ─────────────────────────
    // Corre ANTES del switch. Solo afecta flujos con LLM (Branch B, catalog, general).
    // Branch A (DB directo) ignora completamente el resultado.
    const { isFrustrated, score: sentimentScore } = this.sentimentAnalyzer
      ? this.sentimentAnalyzer.analyzeMessage(userMessage)
      : { isFrustrated: false, score: 0 };

    if (isFrustrated) {
      logger.info('Sentiment: user appears frustrated', { sentimentScore });
    }

    let result: ChatResponse;
    switch (intent) {
      case 'registration':
        result = await this.handleRegistration(userMessage, conversationHistory, requestId, input.sessionId, isFrustrated);
        break;
      case 'catalog':
        result = await this.handleCatalog(userMessage, conversationHistory, requestId, isFrustrated);
        break;
      case 'general':
      default:
        result = await this.handleGeneral(userMessage, conversationHistory, requestId, isFrustrated);
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
    sessionId?: string,
    isFrustrated?: boolean
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

    // ─── BRANCH A: EMAIL KNOWN → OWNERSHIP VERIFICATION, NO LLM ─────────────
    // Antes de revelar PII exigimos el teléfono registrado (prueba de propiedad).
    // La tool es auto-protegida: nunca devuelve cursos sin un teléfono que coincida.
    if (existingEmail !== null) {
      const maskedEmail = maskEmail(existingEmail);

      // Reúne el teléfono SOLO de los mensajes del usuario, no del asistente
      // (evita capturar números que el propio bot menciona, p.ej. 0274-2623898).
      const existingPhone = this.extractPhoneFromUserMessages(conversationHistory, userMessage);

      if (existingPhone === null) {
        logger.info('BRANCH A — email conocido, falta teléfono: solicitando verificación', {
          email: maskedEmail,
        });
        return this.applyPolicy(ASK_FOR_PHONE, 'registration', [], 0, true, logger);
      }

      // Throttle anti fuerza-bruta del teléfono (por correo). Complementa el
      // rate-limit por IP del router. Fail-open si Redis no está disponible.
      if (this.verificationThrottle) {
        const throttle = await this.verificationThrottle.check(existingEmail);
        if (!throttle.allowed) {
          logger.warn('registration_verification: throttled', {
            email: maskedEmail,
            retryAfterSeconds: throttle.retryAfterSeconds,
          });
          return this.applyPolicy(THROTTLE_MSG, 'registration', [], 0, true, logger);
        }
      }

      let rawResult: string;
      try {
        rawResult = await this.toolRegistry.executeTool(
          'consultar_inscripciones',
          JSON.stringify({ email: existingEmail, phone: existingPhone })
        );
      } catch (toolExecError) {
        logger.error('registration_verification: tool execution threw', {
          email: maskedEmail,
          error: String(toolExecError),
        });
        return this.applyPolicy(TECH_ERROR_MSG, 'registration', [], 0, true, logger);
      }

      let parsed: { status?: string; cantidad_cursos?: number; cursos?: unknown; error?: string };
      try {
        parsed = JSON.parse(rawResult);
      } catch (parseError) {
        logger.error('registration_verification: failed to parse tool result', {
          email: maskedEmail,
          parseError: String(parseError),
        });
        return this.applyPolicy(TECH_ERROR_MSG, 'registration', [], 0, true, logger);
      }

      if (!parsed || typeof parsed !== 'object') {
        logger.error('registration_verification: tool returned non-object result', { email: maskedEmail });
        return this.applyPolicy(TECH_ERROR_MSG, 'registration', [], 0, true, logger);
      }

      if (parsed.error) {
        logger.error('registration_verification: tool returned error', { email: maskedEmail });
        return this.applyPolicy(TECH_ERROR_MSG, 'registration', [], 0, true, logger);
      }

      // El teléfono provisto no era suficiente (la tool aún exige uno válido).
      if (parsed.status === 'needs_phone') {
        return this.applyPolicy(ASK_FOR_PHONE, 'registration', [], 0, true, logger);
      }

      if (parsed.status === 'verified') {
        await this.verificationThrottle?.reset(existingEmail);
        logger.info('registration_verification: success', {
          email: maskedEmail,
          courseCount: parsed.cantidad_cursos,
        });
        const answer = this.formatVerifiedResponse(parsed);
        return this.applyPolicy(answer, 'registration', [], 0, true, logger);
      }

      // status === 'not_verified' (correo inexistente O teléfono no coincide →
      // tratados idénticamente). Cuenta como intento fallido para el throttle.
      await this.verificationThrottle?.recordFailure(existingEmail);
      logger.warn('registration_verification: not_verified', { email: maskedEmail });
      return this.applyPolicy(NOT_VERIFIED_GENERIC, 'registration', [], 0, true, logger);
    }

    // ─── BRANCH B: EMAIL UNKNOWN → LLM asks user for email ──────────────────
    logger.info('BRANCH B — no email found, LLM will ask user for email');

    const ragResult = await this.ragService.retrieveContext(userMessage, { matchCount: 5 }, requestId);
    // Branch B: solo cuando el LLM habla (pedir email). Empathy prefix aplica aquí.
    const empathyPrefix = isFrustrated ? EMPATHY_ALERT : '';
    const systemPrompt = empathyPrefix + CHAT_SYSTEM_PROMPT + this.formatRagContextForPrompt(ragResult.context);
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
    requestId?: string,
    isFrustrated?: boolean
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);

    const ragResult = await this.ragService.retrieveContext(userMessage, { matchCount: 5 }, requestId);
    logger.info('Catalog flow RAG result', {
      hit: ragResult.hit,
      maxSimilarity: ragResult.maxSimilarity,
      sourceCount: ragResult.sources.length,
    });

    const empathyPrefix = isFrustrated ? EMPATHY_ALERT : '';
    const systemPrompt = empathyPrefix + CHAT_SYSTEM_PROMPT + this.formatRagContextForPrompt(ragResult.context);
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
    requestId?: string,
    isFrustrated?: boolean
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
      return this.handleGeneralFallback(userMessage, conversationHistory, requestId, isFrustrated);
    }

    const empathyPrefix = isFrustrated ? EMPATHY_ALERT : '';
    const systemPrompt = empathyPrefix + CHAT_SYSTEM_PROMPT + this.formatRagContextForPrompt(ragResult.context);
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
    requestId?: string,
    isFrustrated?: boolean
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);
    logger.info('Using general fallback (no RAG context)');

    const empathyPrefix = isFrustrated ? EMPATHY_ALERT : '';
    const systemPrompt =
      empathyPrefix +
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
   *
   * IMPORTANTE: solo considera mensajes del USUARIO. Los mensajes del asistente
   * contienen correos institucionales (contactoibime@gmail.com) que no deben
   * confundirse con el correo que el usuario provee.
   */
  private extractEmailFromConversation(
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    currentMessage: string
  ): string | null {
    const allText = this.collectUserText(history, currentMessage);
    return this.extractEmailFromText(allText);
  }

  /** Une el texto de los mensajes del usuario (historial + mensaje actual). */
  private collectUserText(
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    currentMessage: string
  ): string {
    const userTexts = history.filter((m) => m.role === 'user').map((m) => m.text);
    if (currentMessage.trim() !== '') userTexts.push(currentMessage);
    return userTexts.join(' ');
  }

  /**
   * Extrae el primer teléfono plausible (7-15 dígitos) de un texto, ignorando
   * los dígitos que pertenezcan a correos. Devuelve la subcadena original (la
   * normalización para comparar se hace en la capa de verificación).
   */
  private extractPhoneFromText(text: string): string | null {
    if (!text || text.trim() === '') return null;
    // Quita correos para no confundir sus dígitos con un teléfono.
    const withoutEmails = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, ' ');
    const candidates = withoutEmails.match(/\+?\d[\d\s().-]{5,}\d/g);
    if (!candidates) return null;
    for (const candidate of candidates) {
      const digits = candidate.replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) return candidate.trim();
    }
    return null;
  }

  /** Extrae el teléfono solo de los mensajes del usuario (nunca del asistente). */
  private extractPhoneFromUserMessages(
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    currentMessage: string
  ): string | null {
    return this.extractPhoneFromText(this.collectUserText(history, currentMessage));
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

  /**
   * Formatea la respuesta de una verificación EXITOSA (identidad ya probada por
   * teléfono). Solo se invoca con status 'verified', por lo que asume que hay
   * registros; si por inconsistencia de datos no hay cursos legibles, degrada con
   * gracia sin afirmar nada falso.
   */
  private formatVerifiedResponse(result: { cantidad_cursos?: number; cursos?: unknown }): string {
    const cursos = Array.isArray(result.cursos)
      ? (result.cursos as unknown[]).filter((c): c is string => typeof c === 'string' && c.trim() !== '')
      : [];

    if (cursos.length === 0) {
      return 'Verifiqué tu identidad correctamente, pero no pude obtener el detalle de tus cursos en este momento. Por favor contáctanos al 0274-2623898 para ayudarte directamente.';
    }

    const cantidad = result.cantidad_cursos ?? cursos.length;
    const courseList = cursos.map((c) => `• ${c.trim()}`).join('\n');
    return `¡Listo! Verifiqué tu identidad. Estás inscrito(a) en ${cantidad} curso(s):\n${courseList}\n\n¿Hay algo más en lo que pueda ayudarte?`;
  }
}
