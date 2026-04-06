// supabase/functions/_shared/groq.ts

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqPayload {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string | string[] | null;
}

/**
 * Generates chat completion using Groq API (OpenAI-compatible)
 */
export async function generateGroqCompletion(
  payload: GroqPayload,
  apiKey: string
): Promise<string> {
  const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`Groq API Error (${res.status}):`, errorBody);
    throw new Error(`Error de Groq API: ${res.status}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? 
    "Lo siento, no pude generar una respuesta con Groq. Por favor intenta de nuevo.";
}
