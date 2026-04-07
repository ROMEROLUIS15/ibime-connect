// Supabase Edge Function — ibime-chat (RAG-enabled)
// 1. Generates an embedding for the user's last message via Gemini
// 2. Retrieves relevant context from knowledge_base (pgvector)
// 3. Injects context into the system prompt
// 4. Calls Groq (Llama 3) to generate a grounded response

import { corsHeaders } from "../_shared/cors.ts";
import { getEmbedding } from "../_shared/gemini.ts";
import { generateGroqCompletion, GroqMessage } from "../_shared/groq.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

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

interface ChatMessage { role: "user" | "assistant"; text: string }
interface KnowledgeRow { id: number; title: string; content: string; similarity: number }

// ── Helper: retrieve context from Supabase ────────────────────────────────────
async function retrieveContext(
  embedding: number[],
  supabaseUrl: string,
  supabaseKey: string,
  matchCount = 5,
  matchThreshold = 0.5
): Promise<KnowledgeRow[]> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/match_knowledge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      query_embedding: `[${embedding.join(",")}]`,
      match_count: matchCount,
      match_threshold: matchThreshold,
    }),
  });
  if (!res.ok) {
    console.error("match_knowledge error:", await res.text());
    return [];
  }
  return res.json() as Promise<KnowledgeRow[]>;
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!geminiApiKey) throw new Error("GEMINI_API_KEY no está configurada.");
    if (!groqApiKey) throw new Error("GROQ_API_KEY no está configurada.");
    if (!supabaseUrl || !supabaseKey) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configuradas.");

    const { messages }: { messages: ChatMessage[] } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Se requiere un arreglo de mensajes." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. Get the user's latest message ─────────────────────────────────────
    const userMessages = messages.filter((m) => m.role === "user");
    const latestUserText = userMessages[userMessages.length - 1]?.text ?? "";

    // ── 2. RAG: embed + retrieve ──────────────────────────────────────────────
    let ragContext = "";
    try {
      const embedding = await getEmbedding(latestUserText, geminiApiKey);
      if (embedding.length > 0) {
        const rows = await retrieveContext(embedding, supabaseUrl, supabaseKey);
        if (rows.length > 0) {
          ragContext =
            "\n\n== CONTEXTO RECUPERADO DE LA BASE DE CONOCIMIENTOS ==\n" +
            rows
              .map((r, i) => `[${i + 1}] ${r.title ? `**${r.title}**\n` : ""}${r.content}`)
              .join("\n\n") +
            "\n\nUtiliza este contexto para responder con precisión. Si la información no está en el contexto ni en tus instrucciones, indícalo amablemente.";
        }
      }
    } catch (ragError) {
      console.error("RAG retrieval failed (non-fatal):", ragError);
    }

    // ── 3. Build Groq payload ───────────────────────────────────────────────
    const systemPrompt = IBIME_SYSTEM_PROMPT + ragContext;

    const groqMessages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m): GroqMessage => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      }))
    ];

    const groqPayload = {
      model: "llama3-8b-8192",
      messages: groqMessages,
      temperature: 0.5,
      max_tokens: 512,
      top_p: 0.9,
    };

    // ── 4. Call Groq using shared utility ───────────────────────────────────
    const responseText = await generateGroqCompletion(groqPayload, groqApiKey);

    return new Response(
      JSON.stringify({ text: responseText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor.";
    console.error("ibime-chat error:", message);
    return new Response(
      JSON.stringify({
        text: "Lo siento, hubo un problema al procesar tu consulta. Por favor llama al 0274-2623898 o escribe a contactoibime@gmail.com.",
        error: message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

export {};

