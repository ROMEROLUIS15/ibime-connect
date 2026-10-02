import { describe, it, expect } from 'vitest';
import { checkResponseGuardrail, HOLDINGS_SAFE_RESPONSE } from '../../../modules/chat/response-guardrail.js';

// Respuestas reales de la batería de calidad del 2026-10-02
// (docs/grado/mediciones/bateria-calidad-chat-2026-10-02.json).
const R30 =
  'Sí, en las bibliotecas del IBIME disponemos de una amplia colección de libros sobre la historia del Estado Bolivariano de Mérida, incluyendo cronologías, biografías de personajes locales y estudios sobre la cultura y el desarrollo regional. Puedes consultar el catálogo en línea a través del Sistema Koha (http://www.ibime.gob.ve:8000/) o visitar cualquiera de las 58 bibliotecas públicas de la red. Si buscas un título específico, indícanos el nombre y con gusto te orientaremos sobre su disponibilidad.';
const R36 =
  '¡Claro! En las bibliotecas del IBIME contamos con una amplia colección de obras de Gabriel García Márquez, tanto en formato físico como digital. Puedes buscarlos en el Sistema Koha (http://www.ibime.gob.ve:8000/) o visitar cualquiera de nuestras 58 bibliotecas públicas. Si necesitas ayuda para localizar un título específico, no dudes en preguntar.';
const R26 =
  'Sí, el IBIME cuenta con obras de Rubén Darío. En el Fondo Editorial Carmen Delia Bencomo se encuentra el libro **«El verso azul y la canción profana»** de Rubén Darío, disponible para leer y descargar en PDF de forma gratuita en nuestro sitio web.';
const R27 =
  '¡Claro! El IBIME cuenta con una amplia colección de libros para niños y jóvenes.  \n- **Colección Infantil y Juvenil**: 28 títulos, entre ellos *El ruiseñor y la estrella*, *Cantos que cuenta la luna* y muchos más.';
const R40 =
  'El IBIME cuenta con **46 obras** en su Fondo Editorial Carmen Delia Bencomo, todas disponibles de forma gratuita para leer y descargar en PDF.';
const R12 =
  'El Programa **Libro Hablado** es la iniciativa del IBIME que ofrece audiolibros gratuitos. Está pensado para personas con discapacidad visual, dificultades de lectura y para toda la comunidad merideña. El catálogo incluye grabaciones profesionales de obras de autores venezolanos, literatura universal, textos educativos y material cultural.';
const R6 = 'La Red Bibliotecaria del IBIME cuenta con **58 bibliotecas públicas** distribuidas en los cinco ejes territoriales del estado Mérida.';

describe('ResponseGuardrail: holdings claims without a Fondo Editorial source', () => {
  it.each([
    ['#30', R30],
    ['#36', R36],
  ])('blocks %s and replaces it with the Koha response', (_n, text) => {
    const r = checkResponseGuardrail(text, 'general', { hasFondoEditorialSource: false });
    expect(r.passed).toBe(false);
    expect(r.reason).toContain('Unsupported holdings claim');
    expect(r.safeResponse).toBe(HOLDINGS_SAFE_RESPONSE);
    expect(HOLDINGS_SAFE_RESPONSE).toContain('http://www.ibime.gob.ve:8000/');
  });

  it('blocks a holdings claim when no option is given (no sources at all)', () => {
    expect(checkResponseGuardrail(R36, 'general').passed).toBe(false);
  });

  it.each([
    ['#26', R26],
    ['#27', R27],
    ['#40', R40],
  ])('lets %s through when a Fondo Editorial source is present', (_n, text) => {
    expect(checkResponseGuardrail(text, 'general', { hasFondoEditorialSource: true }).passed).toBe(true);
  });

  it.each([
    ['#12 Libro Hablado', R12],
    ['#6 58 bibliotecas', R6],
  ])('lets %s through without a Fondo source', (_n, text) => {
    expect(checkResponseGuardrail(text, 'general', { hasFondoEditorialSource: false }).passed).toBe(true);
  });

  it.each([
    'Sí, tenemos el libro Cien años de soledad en nuestras bibliotecas.',
    'Contamos con obras de Gabriel García Márquez.',
    'Disponemos de libros sobre la historia de Mérida.',
    'Tenemos el título «Doña Bárbara» en la biblioteca central.',
    'Nuestras bibliotecas tienen libros de Cervantes en sus estantes.',
    'El IBIME cuenta con una amplia colección de libros de poesía.',
    'Poseemos colecciones sobre historia regional.',
  ])('blocks specific-holdings claim: %s', (text) => {
    expect(checkResponseGuardrail(text, 'general', { hasFondoEditorialSource: false }).passed).toBe(false);
  });

  it.each([
    'La Red Bibliotecaria del IBIME cuenta con 58 bibliotecas públicas que brindan acceso a libros, revistas y recursos a la comunidad.',
    'El IBIME tiene un catálogo en línea (Koha) donde puedes buscar libros, revistas y recursos digitales: http://www.ibime.gob.ve:8000/',
    'En el programa Libro Hablado tenemos grabaciones de obras de autores venezolanos, todas gratuitas.',
    'Con Koha puedes reservar libros y renovar préstamos; las bibliotecas tienen el registro de cada ejemplar.',
    'En nuestras bibliotecas tienes acceso gratuito a libros y revistas.',
    'Aceptamos donaciones de libros en buen estado; tenemos criterios claros para recibirlos.',
    'Contamos con una colección de audiolibros gratuitos para personas con discapacidad visual.',
  ])('lets a legitimate answer through: %s', (text) => {
    expect(checkResponseGuardrail(text, 'general', { hasFondoEditorialSource: false }).passed).toBe(true);
  });
});
