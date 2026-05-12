/**
 * ChatOrchestrator — Intelligent routing with LLM-powered tool calling.
 *
 * Responsibilities:
 *   1. Classify the user's intent (via IntentClassifier)
 *   2. Route to the correct flow:
 *      - "registration" → RAG + Tool calling (LLM extracts email from conversation)
 *      - "catalog"      → RAG retrieval + LLM generation
 *      - "general"      → LLM generation with institutional knowledge only
 *   3. Run response guardrail after every LLM generation
 *   4. Emit structured observability logs
 *   5. Return a unified ChatResponse
 */

import type { ChatResponse } from '@shared/types/domain.js';
import type { ILLMProvider, LLMMessage, ITool } from '../../domain/interfaces/index.js';
import { classifyIntent, type ChatIntent } from './intent-classifier.js';
import { applyResponsePolicy, type ChatIntent as PolicyIntent } from './response-policy.js';
import { contextLogger } from '../../infrastructure/logger/index.js';
import { CHAT_SYSTEM_PROMPT } from './system-prompt.js';
import { ToolRegistry } from '../../services/tools.service.js';
import { CheckRegistrationTool } from '../../services/tools/check_registration.tool.js';

export interface ChatOrchestratorInput {
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export class ChatOrchestrator {
  private toolRegistry: ToolRegistry;
  private static readonly MAX_TOOL_ITERATIONS = 3;

  constructor(
    private llmProvider: ILLMProvider,
    private ragService: typeof import('../../services/rag.service.js').RAGService extends new (...args: any[]) => infer T ? T : never
  ) {
    this.toolRegistry = new ToolRegistry();
    this.toolRegistry.registerTool(new CheckRegistrationTool());
  }

  async process(input: ChatOrchestratorInput, requestId?: string): Promise<ChatResponse> {
    const logger = contextLogger(requestId);
    const { userMessage, conversationHistory } = input;

    const startTime = Date.now();

    // ─── Observability: request start ──────────────────────────────────────
    logger.info('ChatOrchestrator processing request', {
      userMessageLength: userMessage.length,
      historyLength: conversationHistory.length,
    });

    // Classify intent (deterministic, no LLM)
    const { intent, confidence } = classifyIntent(userMessage);
    logger.info('Intent classified', { intent, confidence });

    // Route based on intent
    let result: ChatResponse;
    switch (intent) {
      case 'registration':
        result = await this.handleRegistration(userMessage, conversationHistory, requestId);
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
// Uses RAG for institutional context + Tool calling for DB access.
// The LLM decides when to call the tool based on conversation context.

  private async handleRegistration(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);

    const existingEmail = this.extractEmailFromConversation(conversationHistory, userMessage);
    const skipRag = existingEmail !== null;

    logger.info('Registration flow', { hasEmail: existingEmail !== null, email: existingEmail, skipRag });

    const ragResult = skipRag
      ? { context: '', sources: [], maxSimilarity: 0, hit: false }
      : await this.ragService.retrieveContext(userMessage, { matchCount: 5 }, requestId);

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

    const availableTools = this.toolRegistry.getTools();

    logger.debug('Generating first answer with tools for registration flow');
    let response = await this.llmProvider.generateAnswer(
      messages,
      { temperature: 0.3, maxTokens: 350, tools: availableTools },
      requestId
    );

    let totalTokens = response.tokensUsed;

    let iterations = 0;
    while (response.toolCalls && response.toolCalls.length > 0 && iterations < ChatOrchestrator.MAX_TOOL_ITERATIONS) {
      iterations++;
      logger.info('LLM requested tool calls', { count: response.toolCalls.length, iteration: iterations });

      messages.push({
        role: 'assistant',
        content: response.content || '',
        tool_calls: response.toolCalls
      });

      for (const toolCall of response.toolCalls) {
        logger.info(`Executing tool ${toolCall.function.name}`, { args: toolCall.function.arguments });
        const toolResult = await this.toolRegistry.executeTool(
          toolCall.function.name,
          typeof toolCall.function.arguments === 'string'
            ? toolCall.function.arguments
            : JSON.stringify(toolCall.function.arguments)
        );

        messages.push({
          role: 'tool',
          content: toolResult,
          name: toolCall.function.name,
          tool_call_id: toolCall.id
        });
      }

      if (iterations === 1) {
        const lastToolResult = messages.filter(m => m.role === 'tool').pop();
        const emailForFastPath = existingEmail || this.extractEmailFromToolArguments(messages);

        if (lastToolResult && emailForFastPath) {
          logger.info('Fast path ACTIVE: registration tool executed', {
            email: emailForFastPath,
            toolContent: lastToolResult.content,
          });

          const rawContent = lastToolResult.content || '';

          if (rawContent.trim() === '') {
            logger.warn('Fast path: tool returned empty content', { email: emailForFastPath });
            const fallbackMsg = `No recibí respuesta del sistema de inscripciones para ${emailForFastPath}. Por favor intenta más tarde o contacta al soporte.`;
            totalTokens += response.tokensUsed;
            return this.applyPolicy(fallbackMsg, 'registration', ragResult.sources, totalTokens, true, logger);
          }

          try {
            const parsed = JSON.parse(rawContent);
            const answer = this.formatRegistrationResponse(parsed, emailForFastPath);
            totalTokens += response.tokensUsed;
            return this.applyPolicy(answer, 'registration', ragResult.sources, totalTokens, true, logger);
          } catch (parseError) {
            logger.error('Fast path: failed to parse tool result — forcing deterministic fallback', {
              email: emailForFastPath,
              toolContent: rawContent.substring(0, 300),
              parseError: String(parseError),
            });
            const fallbackMsg = `Error al procesar la respuesta del sistema para ${emailForFastPath}: ${rawContent.substring(0, 100)}. Intenta de nuevo o contacta al soporte.`;
            totalTokens += response.tokensUsed;
            return this.applyPolicy(fallbackMsg, 'registration', ragResult.sources, totalTokens, true, logger);
          }
        } else if (!lastToolResult) {
          logger.warn('Fast path: tool was called but no result found in messages');
        } else if (!emailForFastPath) {
          logger.info('Fast path skipped: no email found for registration tool');
        }
      }

      response = await this.llmProvider.generateAnswer(
        messages,
        { temperature: 0.3, maxTokens: 350, tools: availableTools },
        requestId
      );
      totalTokens += response.tokensUsed;
    }

    const answer = response.content || '';
    const isDbBacked = iterations > 0;
    return this.applyPolicy(answer, 'registration', ragResult.sources, totalTokens, isDbBacked, logger);
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

  private extractEmailFromToolArguments(
    messages: LLMMessage[]
  ): string | null {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

    for (const msg of messages) {
      if (msg.role === 'assistant' && msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          const rawArgs = tc.function.arguments;
          const argsString = typeof rawArgs === 'string' ? rawArgs : JSON.stringify(rawArgs);
          try {
            const argsObj = JSON.parse(argsString);
            const rawEmail = argsObj.email || argsObj.correo;
            if (rawEmail && emailRegex.test(rawEmail)) {
              return rawEmail.toLowerCase().trim();
            }
          } catch {
            const emailMatch = argsString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
            if (emailMatch) {
              return emailMatch[0].toLowerCase();
            }
          }
        }
      }
    }
    return null;
  }

  private extractEmailFromConversation(
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    currentMessage: string
  ): string | null {
    const allText = [...history, { role: 'user' as const, text: currentMessage }]
      .map(m => m.text)
      .join(' ')
      .toLowerCase();

    const patterns = [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
      /correo[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    ];

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

    for (const pattern of patterns) {
      const matches = allText.match(pattern);
      if (matches && matches.length > 0) {
        const candidate = matches[0].toLowerCase().trim();
        if (emailRegex.test(candidate)) {
          return candidate;
        }
      }
    }
    return null;
  }

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

  private formatRegistrationResponse(result: any, email: string): string {
    const content = (result?.content ?? '').replace(/\([^)]*\)/g, '').trim();

    if (!result || typeof result !== 'object') {
      return `Error interno: el resultado de la consulta no tiene el formato esperado para el correo ${email}. Contacta al soporte si el problema persiste.`;
    }

    if (result.error) {
      return `[Error técnico] No pude completar la consulta: ${result.error}. Intenta de nuevo en unos minutos.`;
    }

    if (result.status === 'no_registrado') {
      const mensaje = result.mensaje || '';
      if (mensaje) {
        return `${mensaje} (Correo consultado: ${email})`;
      }
      return `No se encontraron cursos registrados en el sistema para el correo ${email}. ¿Es posible que el correo sea diferente o que aún no te hayas inscrito en un taller?`;
    }

    if (result.status === 'registrado' && Array.isArray(result.cursos) && result.cursos.length > 0) {
      const courseList = result.cursos.map((c: string) => `• ${c}`).join('\n');
      return `¡Encontré tu inscripción! Estás registrado en ${result.cantidad_cursos} curso(s):\n${courseList}\n\n¿Necesitas más información?`;
    }

    return `[Debug] Resultado inesperado: ${JSON.stringify(result).substring(0, 200)} para ${email}. Contacta al soporte con este mensaje.`;
  }
}
