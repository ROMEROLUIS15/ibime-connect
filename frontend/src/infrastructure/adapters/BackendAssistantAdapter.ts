/**
 * src/infrastructure/adapters/BackendAssistantAdapter.ts
 *
 * Adapter that implements IAssistantPort by calling our custom Node.js backend.
 */

import type { ChatResponse, ApiResult } from '@shared/types/domain';
import type { IAssistantPort, GenerateAnswerInput } from '@/domain/ports/AssistantPort';
import { buildApiUrl } from '@/lib/api-url';

export class BackendAssistantAdapter implements IAssistantPort {
  async generateAnswer(input: GenerateAnswerInput): Promise<ApiResult<ChatResponse>> {
    const payload = {
      userMessage: input.userMessage,
      conversationHistory: input.conversationHistory.map((m) => ({
        role: m.role,
        text: m.text,
      })),
    };

    try {
      const endpoint = buildApiUrl('chat');

      // Timeout manual en el fetch del frontend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          ok: false,
          error: errorData.text || 'El asistente no respondió a tiempo. Por favor intenta de nuevo.'
        };
      }

      const data = await response.json() as ChatResponse;

      if (!data) {
        return { ok: false, error: 'Respuesta vacía del servidor.' };
      }

      return {
        ok: true,
        data: {
          answer: data.answer,
          sources: data.sources || [],
          tokensUsed: data.tokensUsed
        },
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { ok: false, error: 'La conexión con el asistente expiró. Verifica tu internet.' };
      }
      return { ok: false, error: 'No se pudo conectar con el servidor.' };
    }
  }
}
