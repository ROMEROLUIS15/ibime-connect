import { ENV } from '../config/env.config.js';

const GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

export class AIService {
  /**
   * Obtiene el embedding de un texto usando la API de Gemini.
   */
  static async getEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error("El texto para generar embedding está vacío.");
    }

    const res = await fetch(`${GEMINI_EMBED_URL}?key=${ENV.GEMINI_API_KEY}`, {
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
}
