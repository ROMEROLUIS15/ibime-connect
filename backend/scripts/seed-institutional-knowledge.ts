/**
 * Seed de conocimiento institucional para la knowledge_base (RAG).
 *
 * Por qué existe: la knowledge_base se alimenta normalmente vía el webhook
 * Koha (n8n) con el catálogo. Hasta que esa integración cargue datos reales,
 * este seed inserta la información institucional base (servicios, horarios,
 * contacto, Koha, alfabetización digital) — los mismos hechos del system
 * prompt — para que RAG recupere y fundamente respuestas con fuentes.
 *
 * Idempotente: borra sus propias entradas (por título) antes de reinsertar.
 *
 * Uso:  npx tsx scripts/seed-institutional-knowledge.ts
 */
import { EmbeddingService } from '../src/services/embedding.service.js';
import { supabaseClient } from '../src/config/supabase.config.js';

interface SeedEntry {
  category: string;
  title: string;
  content: string;
}

const ENTRIES: SeedEntry[] = [
  {
    category: 'servicio',
    title: 'IBIME - Quiénes somos y misión',
    content:
      'El IBIME (Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida, Venezuela) es la red de bibliotecas públicas del estado Mérida, dedicada a garantizar el acceso libre a la información, la cultura y la educación. La directora actual es la Licenciada Zenaida Hernández. Depende de la Gobernación del Estado Bolivariano de Mérida.',
  },
  {
    category: 'horario',
    title: 'Horario de atención del IBIME',
    content:
      'El horario de atención del IBIME es de lunes a viernes, de 8:00 a.m. a 12:00 p.m. y de 1:00 p.m. a 4:00 p.m. Sábados y domingos permanece cerrado.',
  },
  {
    category: 'contacto',
    title: 'Contacto y ubicación del IBIME',
    content:
      'El IBIME está ubicado en el Sector Glorias Patrias, Calle 1 Los Eucaliptos, entre Av. Gonzalo Picón y Tulio Febres, Mérida, Venezuela. Teléfono: 0274-2623898. Correo: contactoibime@gmail.com. Web: ibime-connect.vercel.app. Redes sociales: @ibimegob en Twitter/X, Facebook e Instagram; YouTube: @ibime1800.',
  },
  {
    category: 'servicio',
    title: 'Red Bibliotecaria del estado Mérida',
    content:
      'La Red Bibliotecaria del IBIME cubre 6 distritos (Norte, Sur, Este, Oeste, Central y Periférico) con más de 40 bibliotecas y más de 71 puntos de lectura en todo el estado Mérida, brindando acceso a libros, revistas y recursos a la comunidad.',
  },
  {
    category: 'servicio',
    title: 'Sistema Koha - Catálogo en línea',
    content:
      'El IBIME utiliza Koha, un sistema integrado de gestión bibliotecaria de código abierto. Permite buscar libros, revistas y recursos digitales, y gestionar préstamos, renovaciones y reservas. Acceso al catálogo en línea: http://www.ibime.gob.ve:8001/',
  },
  {
    category: 'curso',
    title: 'Alfabetización Digital - Talleres gratuitos',
    content:
      'El IBIME ofrece el programa de Alfabetización Digital: talleres gratuitos de computación y uso de internet para la comunidad, orientados a desarrollar habilidades digitales básicas. Para conocer los talleres vigentes y cómo inscribirse, comunícate al 0274-2623898 o a contactoibime@gmail.com.',
  },
];

async function main() {
  const embedder = new EmbeddingService();
  const titles = ENTRIES.map((e) => e.title);

  // Idempotencia: elimina entradas previas con estos títulos.
  const { error: delError } = await supabaseClient
    .from('knowledge_base')
    .delete()
    .in('title', titles);
  if (delError) {
    console.error('Error limpiando entradas previas:', delError.message);
  }

  // Reintento con backoff para el 429 (RESOURCE_EXHAUSTED) del free-tier de Gemini.
  const embedWithRetry = async (text: string, attempts = 4): Promise<number[]> => {
    for (let i = 1; i <= attempts; i++) {
      try {
        return await embedder.getEmbedding(text);
      } catch (err) {
        const msg = (err as Error).message ?? '';
        if (i < attempts && /429|RESOURCE_EXHAUSTED|exhausted/i.test(msg)) {
          const waitMs = i * 8000;
          console.log(`  …429 de Gemini, reintentando en ${waitMs / 1000}s (intento ${i}/${attempts})`);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        throw err;
      }
    }
    throw new Error('embedWithRetry agotó reintentos');
  };

  let ok = 0;
  let fail = 0;
  for (const entry of ENTRIES) {
    try {
      const embedding = await embedWithRetry(entry.content);
      const embeddingString = `[${embedding.join(',')}]`;
      const { error } = await supabaseClient.from('knowledge_base').insert({
        title: entry.title,
        content: entry.content,
        embedding: embeddingString,
        metadata: { category: entry.category, source: 'institutional-seed' },
      });
      if (error) {
        console.error(`✗ ${entry.title}: ${error.message}`);
        fail++;
      } else {
        console.log(`✓ ${entry.title} (${embedding.length}d)`);
        ok++;
      }
      // Pausa entre llamadas para respetar la cuota del free-tier de embeddings.
      await new Promise((r) => setTimeout(r, 2500));
    } catch (err) {
      console.error(`✗ ${entry.title}: ${(err as Error).message}`);
      fail++;
    }
  }

  console.log(`\nSeed finalizado: ${ok} insertadas, ${fail} con error.`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
