// Supabase Edge Function — ibime-ingest
// Receives text content, generates an embedding via Gemini, and stores it
// in the knowledge_base table for RAG retrieval.
//
// POST body: { title?: string, content: string, metadata?: object }
// Auth:      Requires the Supabase service-role key (admin only)

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const GEMINI_EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!geminiApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables.");
    }

    const { title, content, metadata } = await req.json() as {
      title?: string;
      content: string;
      metadata?: Record<string, unknown>;
    };

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "The 'content' field is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. Generate embedding ─────────────────────────────────────────────────
    const embedRes = await fetch(`${GEMINI_EMBED_URL}?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: content }] },
        outputDimensionality: 768,
      }),
    });

    if (!embedRes.ok) {
      const errText = await embedRes.text();
      throw new Error(`Gemini embedding error: ${embedRes.status} — ${errText}`);
    }

    const embedData = await embedRes.json();
    const embedding: number[] = embedData?.embedding?.values;

    if (!embedding || embedding.length === 0) {
      throw new Error("Empty embedding returned by Gemini.");
    }

    // ── 2. Insert into knowledge_base via Supabase REST API ───────────────────
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/knowledge_base`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        title: title ?? null,
        content,
        embedding: `[${embedding.join(",")}]`,
        metadata: metadata ?? null,
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Supabase insert error: ${insertRes.status} — ${errText}`);
    }

    const inserted = await insertRes.json();

    return new Response(
      JSON.stringify({ success: true, id: inserted?.[0]?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    console.error("ibime-ingest error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

export {};
