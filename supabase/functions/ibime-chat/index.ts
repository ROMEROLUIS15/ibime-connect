// Supabase Edge Function — ibime-chat (RAG-enabled)
// 1. Generates an embedding for the user's last message via Gemini
// 2. Retrieves relevant context from knowledge_base (pgvector)
// 3. Injects context into the system prompt
// 4. Calls Gemini to generate a grounded response

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const GEMINI_GENERATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

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

interface GeminiPart { text: string }
interface GeminiContent { role: "user" | "model"; parts: GeminiPart[] }
interface ChatMessage { role: "user" | "assistant"; text: string }
interface KnowledgeRow { id: number; title: string; content: string; similarity: number }

// ── Helper: get Gemini embedding ──────────────────────────────────────────────
async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }),
  });
  if (!res.ok) throw new Error(`Embedding error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data?.embedding?.values ?? [];
}

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
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey) throw new Error("GEMINI_API_KEY no está configurada.");
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
      const embedding = await getEmbedding(latestUserText, apiKey);
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
      // RAG failure is non-fatal — fall back to base system prompt
      console.error("RAG retrieval failed (non-fatal):", ragError);
    }

    // ── 3. Build Gemini payload ───────────────────────────────────────────────
    const systemPrompt = IBIME_SYSTEM_PROMPT + ragContext;

    const geminiHistory: GeminiContent[] = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

    const lastMessage = geminiHistory[geminiHistory.length - 1];
    const history = geminiHistory.slice(0, -1);

    const geminiPayload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [...history, lastMessage],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 512,
        topP: 0.9,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };

    // ── 4. Call Gemini ────────────────────────────────────────────────────────
    const geminiResponse = await fetch(
      `${GEMINI_GENERATE_URL}?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Gemini API error:", errorBody);
      throw new Error(`Error de la API de Gemini: ${geminiResponse.status} - ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Lo siento, no pude generar una respuesta. Por favor intenta de nuevo.";

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
