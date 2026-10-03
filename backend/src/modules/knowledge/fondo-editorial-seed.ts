/**
 * Constructor puro (sin I/O) de las entradas del Fondo Editorial Carmen Delia
 * Bencomo para la knowledge_base (RAG).
 *
 * Lee los mismos datos que la página /fondo-editorial (shared/data/fondo-editorial.ts)
 * y produce 51 entradas: 4 institucionales, 1 índice del catálogo y 1 ficha por
 * libro (46), en ese orden.
 *
 * Por qué cada texto nombra el libro y su autoría: el seed calcula el embedding
 * solo con `content`, así que lo que no esté dentro del texto no se puede
 * recuperar. Los textos no llevan la URL del sitio (el dominio cambia con la
 * mudanza al servidor propio): se remite a «la sección Fondo Editorial del sitio».
 */
import {
  BIENAL,
  CARMEN_DELIA_BENCOMO,
  CATALOG,
  COLLECTIONS,
  CONTACT,
  FONDO_EDITORIAL,
  type Book,
} from '@shared/data/fondo-editorial.js';

export interface SeedEntry {
  category: string;
  title: string;
  content: string;
}

const CATEGORY = 'fondo-editorial';
const FONDO = 'Fondo Editorial Carmen Delia Bencomo del IBIME';

const collectionLabel = (id: string): string => COLLECTIONS.find((c) => c.id === id)!.label;
const withPeriod = (s: string): string => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

function bookEntry(book: Book): SeedEntry {
  const head = [`«${book.title}»`];
  if (book.author) head.push(`de ${book.author}`);
  if (book.illustrator) head.push(`con ilustraciones de ${book.illustrator}`);
  const labels = book.collections.filter((c) => c !== 'otras').map(collectionLabel);
  const collection =
    labels.length === 0
      ? ''
      : labels.length === 1
        ? `, de la colección ${labels[0]}`
        : `, de las colecciones ${labels.join(' y ')}`;
  const parts = [`${head.join(', ')}${head.length > 1 ? ',' : ''} es un libro del ${FONDO}${collection}.`];
  if (book.credits) parts.push(withPeriod(book.credits));
  if (book.synopsis) parts.push(`Sinopsis: ${withPeriod(book.synopsis)}`);
  parts.push(`Se puede leer y descargar gratis en PDF: ${book.pdfUrl}`);
  if (book.coloringPdfUrl) parts.push(`Versión para colorear: ${book.coloringPdfUrl}`);
  return { category: CATEGORY, title: `Fondo Editorial - ${book.title}`, content: parts.join(' ') };
}

function indexEntry(): SeedEntry {
  // Cada título va entre «»: varios llevan un punto interno ("El leñador y otras
  // obras. Tomo I") y, sin delimitarlos, el modelo los partía en dos.
  const groups = COLLECTIONS.map((c) => {
    const titles = CATALOG.filter((b) => b.collections.includes(c.id)).map((b) => `«${b.title}»`);
    const name = c.id === 'otras' ? 'Otras publicaciones, fuera de colección' : c.label;
    return `${name} (${titles.length}): ${titles.join('; ')}.`;
  });
  // La remisión a la página va antes de las listas: una respuesta larga se recorta
  // al final, y así la mención al catálogo completo no se pierde con el recorte.
  const content =
    `El ${FONDO} tiene ${CATALOG.length} libros publicados, todos gratuitos para leer y descargar en PDF. ` +
    'El catálogo completo, con buscador, portadas y descargas, está en la sección Fondo Editorial del sitio web del IBIME. ' +
    `Están organizados por colección (algunos libros están en dos colecciones). ${groups.join(' ')}`;
  return { category: CATEGORY, title: 'Fondo Editorial Carmen Delia Bencomo - Catálogo de libros', content };
}

function institutionalEntries(): SeedEntry[] {
  const fe = FONDO_EDITORIAL;
  const cdb = CARMEN_DELIA_BENCOMO;
  return [
    {
      category: CATEGORY,
      title: 'Fondo Editorial Carmen Delia Bencomo - Quiénes somos',
      content:
        `${fe.about.join(' ')} Misión: ${fe.mission} Visión: ${fe.vision} Servicios: ` +
        fe.services.map((s) => `${s.title}: ${s.description}`).join(' '),
    },
    {
      category: CATEGORY,
      title: 'Carmen Delia Bencomo - Biografía',
      content:
        `Carmen Delia Bencomo (${cdb.lifespan}) da nombre al Fondo Editorial del IBIME. ${cdb.summary.join(' ')} ` +
        // Fecha sustentada en el comentario de fuentes de shared/data/fondo-editorial.ts (CENAL).
        `Murió en La Guaira el 12 de octubre de 2002. Premios: ${cdb.awards.join(' ')} Obras: ${cdb.works} ` +
        'El Fondo Editorial publica su obra en la colección Biblioteca Digital Carmen Delia Bencomo.',
    },
    {
      category: CATEGORY,
      title: BIENAL.name,
      content:
        `${BIENAL.name}. ${BIENAL.description} La obra ganadora, «A las nubes en un velero», de César Luis Franco Rivero, ` +
        `forma parte del catálogo del ${FONDO}.`,
    },
    {
      category: CATEGORY,
      title: 'Fondo Editorial Carmen Delia Bencomo - Contacto',
      content:
        `Contacto del ${FONDO}: correo ${CONTACT.email}; Instagram ${CONTACT.instagramHandle}; blog ${CONTACT.blogUrl}. ` +
        `Dirección: ${CONTACT.address} ${CONTACT.intro} ${withPeriod(CONTACT.subscribe)}`,
    },
  ];
}

/** Las 51 entradas del Fondo Editorial: institucionales, índice y una ficha por libro. */
export function buildFondoEditorialSeed(): SeedEntry[] {
  return [...institutionalEntries(), indexEntry(), ...CATALOG.map(bookEntry)];
}

let fondoTitles: Set<string> | undefined;

/**
 * Indica si un título de fuente recuperada pertenece al Fondo Editorial. El RPC del
 * RAG no devuelve la categoría, así que se decide por los títulos que genera el seed
 * (quedan sincronizados con lo que se carga en la knowledge_base).
 */
export function isFondoEditorialTitle(title: string): boolean {
  fondoTitles ??= new Set(buildFondoEditorialSeed().map((e) => e.title));
  return fondoTitles.has(title);
}
