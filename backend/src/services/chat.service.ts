import { supabaseClient } from '../config/supabase.config';
import { ENV } from '../config/env.config';
import { AIService } from './ai.service';

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const IBIME_SYSTEM_PROMPT = `Eres el Asistente Virtual oficial del IBIME (Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida, Venezuela).

Tu nombre es "Asistente IBIME". Respondes siempre en español, de manera amigable, institucional y concisa.

== INFORMACIÓN INSTITUCIONAL ==
- Institución: IBIME — Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida
- Gobernación: Estado Bolivariano de Mérida, Venezuela
- Dirección: Sector Glorias Patrias, Calle 1 Los Eucaliptos, entre Av. Gonzalo Picón y Tulio Febres, Mérida, Venezuela
- Teléfono: 0274-2623898
- Correo: contactoibime@gmail.com
- Web: ibime-connect.vercel.app
- Redes sociales: @ibimegob (Twitter/X, Facebook, Instagram) | YouTube: @ibime1800

== HORARIO DE ATENCIÓN ==
- Lunes a Viernes: 8:00 a.m. a 12:00 p.m. y 1:00 p.m. a 4:00 p.m.
- Sábados y domingos: Cerrado

== SERVICIOS PRINCIPALES ==
1. Red Bibliotecaria: 6 distritos cubriendo Norte, Sur, Este, Oeste, Central y Periférico. Total >40 bibliotecas y >71 puntos de lectura.
2. Sistema Koha: Sistema integrado de gestión bibliotecaria de código abierto. Permite buscar libros, revistas y recursos digitales, gestionar préstamos, renovaciones y reservas. Acceso: http://www.ibime.gob.ve:8001/
3. Libro Hablado: Servicio de audiolibros y recursos accesibles para personas con discapacidad visual.
4. Fondo Editorial: Publicaciones y material editorial del IBIME.
5. Alfabetización Digital: Talleres gratuitos de computación y uso de internet, especialmente para adultos mayores.
6. Club de Lectura: Reuniones mensuales de discusión literaria.
7. Cuentacuentos Infantil: Sesiones de narración oral para niños de 3 a 10 años con actividades interactivas.
8. Talleres culturales: Talleres de escritura, exposiciones y actividades culturales gratuitas.

== CATÁLOGO KOHA ==
Para consultar libros disponibles, reservar o gestionar préstamos, los usuarios deben acceder directamente al sistema Koha en: http://www.ibime.gob.ve:8001/
Si el usuario pregunta por un libro específico, indícale que lo busque en el catálogo Koha o que llame al 0274-2623898. No puedes dar información de existencias en tiempo real.

== INSTRUCCIONES ==
- Responde SOLO sobre temas relacionados con el IBIME, bibliotecas, cultura, educación y servicios bibliotecarios de Mérida.
- Si alguien pregunta algo fuera de ese ámbito, redirige amablemente hacia los servicios del IBIME.
- Sé conciso: máximo 3-4 oraciones por respuesta, salvo que el usuario pida más detalles.
- Si no tienes información exacta, indica que el usuario puede llamar al 0274-2623898 o escribir a contactoibime@gmail.com.
- NUNCA inventes datos de libros, existencias o disponibilidad.
- Usa un tono cálido, profesional e institucional.`;

export class ChatService {
  /**
   * Procesa la lista de mensajes y genera una respuesta usando RAG y Groq.
   */
  static async processChat(messages: ChatMessage[]): Promise<string> {
    // 1. Get the latest user message
    const userMessages = messages.filter((m) => m.role === "user");
    const latestUserText = userMessages[userMessages.length - 1]?.text ?? "";

    // 2. RAG: Obtener contexto desde Supabase usando el embedding de Gemini
    let ragContext = "";
    try {
      const embedding = await AIService.getEmbedding(latestUserText);
      if (embedding.length > 0) {
        // Llamar a Supabase RPC match_knowledge
        const { data: rows, error } = await supabaseClient.rpc('match_knowledge', {
          query_embedding: `[${embedding.join(",")}]`,
          match_count: 5,
          match_threshold: 0.5
        });

        if (error) throw error;

        if (rows && rows.length > 0) {
          ragContext =
            "\n\n== CONTEXTO RECUPERADO DE LA BASE DE CONOCIMIENTOS ==\n" +
            rows
              .map((r: any, i: number) => `[${i + 1}] ${r.title ? `**${r.title}**\n` : ""}${r.content}`)
              .join("\n\n") +
            "\n\nUtiliza este contexto para responder con precisión. Si la información no está en el contexto ni en tus instrucciones, indícalo amablemente.";
        }
      }
    } catch (error) {
      console.error("RAG retrieval failed (non-fatal):", error);
    }

    // 3. Preparar el payload de Groq (Llama 3)
    const systemPrompt = IBIME_SYSTEM_PROMPT + ragContext;

    const groqMessages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m): GroqMessage => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      }))
    ];

    const groqPayload = {
      model: "llama-3.1-8b-instant",
      messages: groqMessages,
      temperature: 0.5,
      max_tokens: 512,
      top_p: 0.9,
    };

    // 4. Llamar a Groq API
    const res = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.GROQ_API_KEY}`,
      },
      body: JSON.stringify(groqPayload),
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
}
