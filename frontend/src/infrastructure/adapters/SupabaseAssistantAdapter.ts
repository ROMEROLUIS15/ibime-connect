/**
 * src/infrastructure/adapters/SupabaseAssistantAdapter.ts
 *
 * Adapter that implements IAssistantPort by calling the Supabase Edge Function
 * `ibime-chat`. The deployed Edge Function internally handles RAG (Gemini embeddings)
 * and LLM generation (Gemini 1.5 Flash).
 */

import { supabase } from '@/lib/supabase';
import type { ChatResponse, ApiResult } from '@shared/types/domain';
import type { IAssistantPort, GenerateAnswerInput } from '@/domain/ports/AssistantPort';

// ─── Edge Function contract ───────────────────────────────────────────────────

interface EdgeFunctionPayload {
  readonly messages: ReadonlyArray<{ role: 'user' | 'assistant'; text: string }>;
}

interface EdgeFunctionResponse {
  readonly text?: string;
  readonly error?: string;
}

// ─── Adapter implementation ───────────────────────────────────────────────────

export class SupabaseAssistantAdapter implements IAssistantPort {
  async generateAnswer(input: GenerateAnswerInput): Promise<ApiResult<ChatResponse>> {
    const messages = [
      ...input.conversationHistory.map((m) => ({
        role: m.role,
        text: m.text,
      })),
      { role: 'user' as const, text: input.userMessage },
    ];

    const payload: EdgeFunctionPayload = { messages };

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const endpoint = `${backendUrl}/api/chat`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('[BackendAssistantAdapter] API error:', response.statusText);
        return { ok: false, error: 'El asistente no está disponible en este momento. Intenta de nuevo más tarde.' };
      }

      const data = await response.json() as EdgeFunctionResponse;

      if (!data) {
        return { ok: false, error: 'Respuesta vacía del servidor.' };
      }

      if (data.error !== undefined) {
        console.error('[BackendAssistantAdapter] Backend execution error:', data.error);
        return { ok: false, error: 'Lo siento, hubo un problema procesando tu consulta.' };
      }

      if (data.text === undefined || data.text.trim() === '') {
        return { ok: false, error: 'No se pudo leer la respuesta del asistente.' };
      }

      // El backend original no retorna 'sources' (lo incluye en el texto si es necesario),
      // pero para mantener el contrato con la interfaz IAssistantPort pasamos los del contexto (si hubiere).
      return {
        ok: true,
        data: {
          answer: data.text,
          sources: input.context,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      console.error('[SupabaseAssistantAdapter] Unexpected error calling Edge Function:', message);
      return { ok: false, error: 'Error de conexión con el servidor.' };
    }
  }
}
