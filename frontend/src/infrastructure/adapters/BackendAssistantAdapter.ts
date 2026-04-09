/**
 * src/infrastructure/adapters/BackendAssistantAdapter.ts
 *
 * Adapter that implements IAssistantPort by calling our custom Node.js backend.
 */

import type { ChatResponse, ApiResult } from '@shared/types/domain';
import type { IAssistantPort, GenerateAnswerInput } from '@/domain/ports/AssistantPort';

export class BackendAssistantAdapter implements IAssistantPort {
  async generateAnswer(input: GenerateAnswerInput): Promise<ApiResult<ChatResponse>> {
    // Aliniamos el payload con el esquema chatRequestSchema del backend
    const payload = {
      userMessage: input.userMessage,
      conversationHistory: input.conversationHistory.map((m) => ({
        role: m.role,
        text: m.text,
      })),
    };

    try {
      // Priorizar el backend local en desarrollo para evitar desincronización con producción
      const defaultLocalUrl = 'http://localhost:3000/api';
      const envUrl = import.meta.env.VITE_API_URL;
      
      // En desarrollo, intentamos usar localhost:3000 a menos que se esté probando produccion explícitamente
      let baseUrl = envUrl || defaultLocalUrl;
      
      if (import.meta.env.DEV) {
        // Si estamos en localhost (frontend), preferimos localhost (backend)
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost && !envUrl?.includes('localhost')) {
          baseUrl = defaultLocalUrl;
        }
      }

      const endpoint = baseUrl.endsWith('/api') ? `${baseUrl}/chat` : `${baseUrl}/api/chat`;

      console.log(`[BackendAssistantAdapter] Enviando consulta a: ${endpoint}`);

      // Añadimos un timeout manual en el fetch del frontend también (opcional pero recomendado)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s en frontend

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[BackendAssistantAdapter] API error:', response.status, errorData);
        return { 
          ok: false, 
          error: errorData.error || 'El asistente no respondió a tiempo. Por favor intenta de nuevo.' 
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
      const message = err instanceof Error ? err.message : 'Error de red';
      console.error('[BackendAssistantAdapter] Unexpected error:', message);
      return { ok: false, error: 'No se pudo conectar con el servidor.' };
    }
  }
}
