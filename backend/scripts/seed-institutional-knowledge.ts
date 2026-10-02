/**
 * Seed de conocimiento institucional para la knowledge_base (RAG).
 *
 * Por qué existe: la knowledge_base se alimenta normalmente vía el webhook
 * Koha (n8n) con el catálogo. Hasta que esa integración cargue datos reales,
 * este seed inserta la información institucional base (servicios, horarios,
 * contacto, Koha, alfabetización digital) — los mismos hechos del system
 * prompt — para que RAG recupere y fundamente respuestas con fuentes. Las
 * entradas de Libro Hablado y de donaciones resumen las páginas /libro-hablado
 * y /donation-criteria del sitio.
 *
 * Qué carga: 8 entradas institucionales (escritas aquí) y 51 del Fondo Editorial
 * Carmen Delia Bencomo (46 fichas de libros, 1 índice del catálogo y 4
 * institucionales), construidas por buildFondoEditorialSeed() desde
 * shared/data/fondo-editorial.ts: la misma fuente que la página /fondo-editorial.
 *
 * Orden de trabajo: primero calcula TODOS los embeddings (con reintento ante el
 * 429 de Gemini); si falta alguno, termina con código distinto de cero sin tocar
 * la base. Después anota los ids de las entradas previas (por título), inserta
 * las 59 filas en lotes y recién entonces borra las previas por id.
 *
 * Idempotente por título, pero NO transaccional: si un insert o el borrado final
 * fallan, pueden quedar filas duplicadas (nunca faltantes); volver a ejecutarlo
 * las reemplaza. Respaldar la tabla knowledge_base antes de ejecutarlo contra
 * producción.
 *
 * Uso:  npx tsx scripts/seed-institutional-knowledge.ts
 */
import { EmbeddingService } from '../src/services/embedding.service.js';
import { supabaseClient } from '../src/config/supabase.config.js';
import { buildFondoEditorialSeed } from '../src/modules/knowledge/fondo-editorial-seed.js';

interface SeedEntry {
  category: string;
  title: string;
  content: string;
}

const INSTITUTIONAL_ENTRIES: SeedEntry[] = [
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
      'La Red Bibliotecaria del IBIME cuenta con 58 bibliotecas públicas en 5 ejes territoriales del estado Mérida: Metropolitano (17 bibliotecas y 1 punto de lectura), Panamericano (12), Mocotíes (11), Páramo (11) y Pueblo del Sur (7), brindando acceso a libros, revistas y recursos a la comunidad. El directorio de bibliotecas por eje, con sus mapas, está en la sección Servicios Bibliotecarios del sitio web.',
  },
  {
    category: 'servicio',
    title: 'Sistema Koha - Catálogo en línea',
    content:
      'El IBIME utiliza Koha, un sistema integrado de gestión bibliotecaria de código abierto. Permite buscar libros, revistas y recursos digitales, y gestionar préstamos, renovaciones y reservas. Acceso al catálogo en línea: http://www.ibime.gob.ve:8000/',
  },
  {
    category: 'curso',
    title: 'Alfabetización Digital - Talleres gratuitos',
    content:
      'El IBIME ofrece el programa de Alfabetización Digital: talleres gratuitos de computación y uso de internet para la comunidad, orientados a desarrollar habilidades digitales básicas. Para conocer los talleres vigentes y cómo inscribirse, comunícate al 0274-2623898 o a contactoibime@gmail.com.',
  },
  {
    category: 'servicio',
    title: 'Libro Hablado - Programa de audiolibros',
    content:
      'Libro Hablado es el programa de audiolibros del IBIME. Hace accesible la lectura para personas con discapacidad visual o dificultades de lectura y para toda la comunidad merideña. Ofrece grabaciones profesionales de obras de autores venezolanos, literatura universal, textos educativos y material de interés cultural, todas gratuitas. Para saber cómo acceder a los audiolibros, comunícate al 0274-2623898 o a contactoibime@gmail.com.',
  },
  {
    category: 'tramite',
    title: 'Donación de libros al IBIME - Criterios y proceso',
    content:
      'El IBIME recibe donaciones de libros y materiales bibliográficos: libros y folletos, revistas, materiales audiovisuales, documentos digitales y material de referencia. Deben estar en buen estado: sin roturas ni páginas faltantes, sin humedad, moho ni daños por insectos, y con páginas legibles. Se prefieren contenidos educativos y culturales, obras de interés general o académico y publicaciones actualizadas. Para donar: revisa que tus materiales cumplan los criterios, organízalos por categorías, entrégalos en la biblioteca más cercana y recibe una constancia de donación. El equipo técnico evalúa cada donación y puede aceptarla o rechazarla. Más información: 0274-2623898 o contactoibime@gmail.com.',
  },
];

const ENTRIES: SeedEntry[] = [...INSTITUTIONAL_ENTRIES, ...buildFondoEditorialSeed()];

async function main() {
  const embedder = new EmbeddingService();
  const titles = ENTRIES.map((e) => e.title);

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

  // 1) Todos los embeddings primero: si alguno falla, la base queda intacta.
  const rows: Array<{ title: string; content: string; embedding: string; metadata: Record<string, string> }> = [];
  const failed: string[] = [];
  for (const entry of ENTRIES) {
    try {
      const embedding = await embedWithRetry(entry.content);
      rows.push({
        title: entry.title,
        content: entry.content,
        embedding: `[${embedding.join(',')}]`,
        metadata: { category: entry.category, source: 'institutional-seed' },
      });
      console.log(`✓ embedding ${rows.length}/${ENTRIES.length}: ${entry.title} (${embedding.length}d)`);
    } catch (err) {
      console.error(`✗ ${entry.title}: ${(err as Error).message}`);
      failed.push(entry.title);
    }
    // Pausa entre llamadas para respetar la cuota del free-tier de embeddings.
    await new Promise((r) => setTimeout(r, 2500));
  }

  if (failed.length > 0) {
    console.error(`\nAbortado: ${failed.length} embedding(s) fallaron; no se tocó la base de datos. Reintentar más tarde.`);
    process.exit(1);
  }

  // 2) Recién ahora se escribe. Se anotan los ids de las entradas previas (mismos
  //    títulos), se inserta lo nuevo y solo al final se borran las previas por id:
  //    si un insert falla, la base conserva lo que tenía.
  const { data: previas, error: selError } = await supabaseClient
    .from('knowledge_base')
    .select('id')
    .in('title', titles);
  if (selError) {
    console.error(`Error leyendo las entradas previas; no se escribió nada: ${selError.message}`);
    process.exit(1);
  }
  const idsPrevios = (previas ?? []).map((p: { id: number }) => p.id);

  // Lotes de 20 filas (~330 KB cada uno) en lugar de un único cuerpo de ~1 MB.
  const LOTE = 20;
  for (let i = 0; i < rows.length; i += LOTE) {
    const { error: insError } = await supabaseClient.from('knowledge_base').insert(rows.slice(i, i + LOTE));
    if (insError) {
      console.error(
        `Error insertando el lote ${i / LOTE + 1}: ${insError.message}. Las entradas previas siguen intactas; ` +
          'si quedaron filas nuevas duplicadas, volver a ejecutar el seed las reemplaza.'
      );
      process.exit(1);
    }
  }

  if (idsPrevios.length > 0) {
    const { error: delError } = await supabaseClient.from('knowledge_base').delete().in('id', idsPrevios);
    if (delError) {
      console.error(
        `Las ${rows.length} entradas nuevas se insertaron, pero falló el borrado de las ${idsPrevios.length} ` +
          `previas (quedan duplicadas; volver a ejecutar el seed): ${delError.message}`
      );
      process.exit(1);
    }
  }

  console.log(`\nSeed finalizado: ${rows.length} entradas insertadas, ${idsPrevios.length} previas reemplazadas.`);
  process.exit(0);
}

main();
