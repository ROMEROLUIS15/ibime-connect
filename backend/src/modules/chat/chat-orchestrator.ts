/**
 * ChatOrchestrator — Deterministic routing based on classified intent.
 *
 * Responsibilities:
 *   1. Validate email (if provided)
 *   2. Classify the user's intent (via IntentClassifier)
 *   3. Route to the correct flow:
 *      - "registration" → DB query (no LLM decision), format with LLM
 *      - "catalog"      → RAG retrieval + LLM generation
 *      - "general"      → LLM generation with institutional knowledge only
 *   4. Run response guardrail after every LLM generation
 *   5. Emit structured observability logs
 *   6. Return a unified ChatResponse
 *
 * This replaces the previous ChatService which mixed ALL responsibilities.
 */

import type { ChatResponse } from '@shared/types/domain.js';
import type { ILLMProvider, LLMMessage } from '../../domain/interfaces/index.js';
import { RegistrationService } from '../../services/registration.service.js';
import { classifyIntent, type ChatIntent } from './intent-classifier.js';
import { validateEmail } from './email-validator.js';
import { applyResponsePolicy, type ChatIntent as PolicyIntent } from './response-policy.js';
import { contextLogger } from '../../infrastructure/logger/index.js';
import { CHAT_SYSTEM_PROMPT } from './system-prompt.js';

export interface ChatOrchestratorInput {
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>;
  userEmail?: string; // Optional: provided by authenticated session or explicit input
}

export class ChatOrchestrator {
  constructor(
    private llmProvider: ILLMProvider,
    private ragService: typeof import('../../services/rag.service.js').RAGService extends new (...args: any[]) => infer T ? T : never
  ) { }

  async process(input: ChatOrchestratorInput, requestId?: string): Promise<ChatResponse> {
    const logger = contextLogger(requestId);
    const { userMessage, conversationHistory, userEmail } = input;

    const startTime = Date.now();

    // ─── Observability: request start ──────────────────────────────────────
    logger.info('ChatOrchestrator processing request', {
      userMessageLength: userMessage.length,
      historyLength: conversationHistory.length,
      hasUserEmail: !!userEmail,
    });

    // Step 1: Validate email (if provided)
    const emailValidation = validateEmail(userEmail);
    const validEmail = emailValidation.valid ? emailValidation.email : null;

    if (userEmail && !emailValidation.valid) {
      logger.warn('Invalid email provided', { reason: emailValidation.reason, providedEmail: userEmail });
    }

    // Step 2: Classify intent (deterministic, no LLM)
    const { intent, confidence } = classifyIntent(userMessage);
    logger.info('Intent classified', { intent, confidence });

    // Step 3: Route based on intent
    let result: ChatResponse;
    switch (intent) {
      case 'registration':
        result = await this.handleRegistration(userMessage, conversationHistory, validEmail, requestId);
        break;
      case 'catalog':
        result = await this.handleCatalog(userMessage, conversationHistory, requestId);
        break;
      case 'general':
      default:
        result = await this.handleGeneral(userMessage, conversationHistory, requestId);
        break;
    }

    // ─── Observability: request complete ───────────────────────────────────
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
  // Limits conversation history sent to the LLM to avoid prompt token bloat.
  // Keeps the last `maxTurns` user+assistant pairs (default: 3 turns = 6 msgs).
  // This is critical for free-tier token budget management.

  private trimHistory(
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    maxTurns = 3
  ): Array<{ role: 'user' | 'assistant'; text: string }> {
    const maxMessages = maxTurns * 2; // each turn = 1 user + 1 assistant message
    if (history.length <= maxMessages) return history;
    return history.slice(history.length - maxMessages);
  }

  // ─── REGISTRATION FLOW ──────────────────────────────────────────────────
  // User asks about their personal enrollments.
  // NEVER uses RAG. NEVER lets LLM decide. DB is queried directly.
  // Guardrail runs but registration flow is DB-backed (allowed).

  private async handleRegistration(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
    validEmail: string | null,
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);

    // If no valid email → deterministic response (no LLM)
    if (!validEmail) {
      logger.info('Registration query without valid email — returning deterministic response');
      const answer = '¡Claro que sí! Con mucho gusto te ayudo a verificar tus inscripciones. Por favor, indícame tu correo electrónico registrado para buscarlo en nuestro sistema.';
      return this.applyPolicy(answer, 'registration', [], 0, true, logger);
    }

    // Query DB directly (no LLM tool calling)
    const records = await RegistrationService.findByEmail(validEmail, requestId);

    logger.info('Registration query result', {
      email: validEmail,
      recordCount: records.length,
    });

    // Build context from DB results — inject into LLM for friendly formatting
    const registrationContext = this.formatRegistrationContext(records, validEmail);

    // LLM only formats the response — no decision making
    const trimmedHistory = this.trimHistory(conversationHistory);
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `Eres el Asistente Virtual oficial del IBIME. Responde siempre en español, de manera amigable y concisa.

El siguiente texto contiene los resultados de una consulta de inscripciones desde la base de datos. Tu ÚNICA tarea es formatear esta información de manera clara y amable para el usuario. NO inventes cursos, NO asumas información adicional. Usa EXCLUSIVAMENTE los datos proporcionados.

${registrationContext}`,
      },
      ...trimmedHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await this.llmProvider.generateAnswer(messages, {
      temperature: 0.2, // Very low — this is formatting, not creation
      maxTokens: 250,   // Was 400 — reduced for free-tier token budget
    }, requestId);

    const answer = response.content || this.formatRegistrationContext(records, validEmail);
    // DB-backed: isDbBacked=true → guardrail skipped (data from DB, not hallucinated)
    return this.applyPolicy(answer, 'registration', [], response.tokensUsed, true, logger);
  }

  // ─── CATALOG FLOW ───────────────────────────────────────────────────────
  // User asks about available courses/offerings in general.
  // Uses RAG for contextual information. Guardrail is CRITICAL here.

  private async handleCatalog(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);

    // Retrieve RAG context (RAGService enforces MIN_VALID_THRESHOLD internally)
    const ragResult = await this.ragService.retrieveContext(
      userMessage,
      { matchCount: 5 },
      requestId
    );

    logger.info('Catalog flow RAG result', {
      hit: ragResult.hit,
      maxSimilarity: ragResult.maxSimilarity,
      sourceCount: ragResult.sources.length,
    });

    // Build system prompt with RAG context (if available)
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
      temperature: 0.3, // Low — factual responses
      maxTokens: 350,   // Was 600 — reduced for free-tier token budget
    }, requestId);

    // applyPolicy handles fallback — empty string triggers intent-specific fallback in ResponsePolicy
    const answer = response.content || '';
    return this.applyPolicy(answer, 'catalog', ragResult.sources, response.tokensUsed, false, logger);
  }

  // ─── GENERAL FLOW ───────────────────────────────────────────────────────
  // Greetings, institutional info, out-of-scope questions.
  // RAG with fail-hard + fallback. Guardrail applies.

  private async handleGeneral(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);

    // Check if it's a simple greeting — skip RAG entirely
    if (this.isGreeting(userMessage)) {
      logger.info('Detected greeting — using deterministic response');
      const answer = this.getGreetingResponse(userMessage);
      return { answer, sources: [], tokensUsed: 0 };
    }

    // Try RAG (RAGService enforces MIN_VALID_THRESHOLD internally)
    const ragResult = await this.ragService.retrieveContext(
      userMessage,
      { matchCount: 5 },
      requestId
    );

    logger.info('General flow RAG result', {
      hit: ragResult.hit,
      maxSimilarity: ragResult.maxSimilarity,
      sourceCount: ragResult.sources.length,
    });

    // If RAG failed (fail-hard), use fallback
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
      maxTokens: 350,   // Was 600 — reduced for free-tier token budget
    }, requestId);

    const answer = response.content || '';
    return this.applyPolicy(answer, 'general', ragResult.sources, response.tokensUsed, false, logger);
  }

  // ─── FALLBACK for general when RAG finds nothing ────────────────────────

  private async handleGeneralFallback(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);
    logger.info('Using general fallback (no RAG context)');

    const systemPrompt = CHAT_SYSTEM_PROMPT + `\n\nNota: No se encontró información específica en la base de conocimientos para esta consulta. Responde con tu conocimiento institucional general o indica amablemente que no tienes esa información disponible.`;
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
      maxTokens: 300,   // Was 500 — reduced for free-tier token budget
    }, requestId);

    const answer = response.content || '';
    return this.applyPolicy(answer, 'general', [], response.tokensUsed, false, logger);
  }

  // ─── ResponsePolicy wrapper ─────────────────────────────────────────────
  // THE LAST GATE before any response reaches the user.
  // Delegates entirely to applyResponsePolicy() — single source of truth.
  //
  // applyResponsePolicy handles:
  //   1. Structural validation (empty, too short, too long)
  //   2. Guardrail check (hallucination detection) — skipped if isDbBacked
  //   3. Intent-specific fallback when any check fails

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

  private isGreeting(message: string): boolean {
    const normalized = message.toLowerCase().trim();
    return /^(hola|buenos|buenas|hey|saludos|qué tal|que tal|hi|buen día|buen dia)$/i.test(normalized)
      || /^(hola|buenos|buenas|hey|saludos)\s/i.test(normalized);
  }

  private getGreetingResponse(message: string): string {
    const normalized = message.toLowerCase().trim();
    if (/\bnoche/i.test(normalized)) {
      return '¡Buenas noches! Soy el Asistente IBIME. ¿En qué puedo ayudarte?';
    }
    if (/\btarde/i.test(normalized)) {
      return '¡Buenas tardes! Soy el Asistente IBIME. ¿En qué puedo ayudarte?';
    }
    return '¡Hola! Soy el Asistente IBIME. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre nuestros servicios, horarios, talleres o información institucional.';
  }

  private formatRagContextForPrompt(ragContext: string): string {
    if (!ragContext || ragContext.trim() === '') {
      return '';
    }
    return `\n\n${ragContext}\n\nUtiliza la información anterior como referencia para responder con precisión. Si no es relevante para la pregunta del usuario, responde con tu conocimiento institucional.`;
  }

  private formatRegistrationContext(records: any[], email: string): string {
    if (!records || records.length === 0) {
      return `Consulta para el correo: ${email}\nResultado: No se encontraron inscripciones registradas en el sistema para este correo.`;
    }

    const lines = [`Consulta para el correo: ${email}`, `Resultados: ${records.length} curso(s) encontrado(s):`, ''];
    for (const record of records) {
      const courseName = record.course_name || record.courseName || 'Curso desconocido';
      const name = record.name || 'N/A';
      lines.push(`- ${courseName} (Nombre: ${name})`);
    }

    return lines.join('\n');
  }
}
