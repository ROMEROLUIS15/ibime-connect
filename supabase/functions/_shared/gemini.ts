// supabase/functions/_shared/gemini.ts

const GEMINI_GENERATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

/**
 * Obtiene el embedding de un texto usando la API de Gemini.
 */
export async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("El texto para generar embedding está vacío.");
  }

  const res = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }),
  });

  if (!res.ok) {
    throw new Error(`Error de embedding: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const embedding: number[] = data?.embedding?.values ?? [];

  if (embedding.length === 0) {
    throw new Error("La API de Gemini devolvió un embedding vacío.");
  }

  return embedding;
}

export interface GeminiPart { text: string }
export interface GeminiContent { role: "user" | "model"; parts: GeminiPart[] }

/**
 * Llama a Gemini para generar una respuesta
 */
export async function generateContent(payload: Record<string, unknown>, apiKey: string): Promise<string> {
  const res = await fetch(`${GEMINI_GENERATE_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Error de la API de Gemini: ${res.status} - ${errorBody}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 
    "Lo siento, no pude generar una respuesta. Por favor intenta de nuevo.";
}
