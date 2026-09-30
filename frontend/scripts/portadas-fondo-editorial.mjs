/**
 * Descarga las portadas del catálogo del Fondo Editorial Carmen Delia Bencomo
 * desde su blog y escribe una WebP por libro en src/assets/fondo-editorial/.
 *
 * Por qué no se guardan los originales en el repositorio (a diferencia de
 * optimizar-imagenes.mjs): las 46 portadas pesan 13,8 MB en el blog, varias en
 * PNG de hasta 2363 px. La fuente queda registrada aquí (URL por libro) y el
 * script las regenera.
 *
 * Criterio: 560 px de ancho (sin agrandar las más chicas). En escritorio la
 * tarjeta del catálogo mide unos 280 px, así que alcanza para densidad 2.
 * Mismas opciones de foto que optimizar-imagenes.mjs.
 *
 * El nombre de cada WebP es el `id` del libro en src/data/fondo-editorial.ts;
 * la página resuelve la portada por ese id.
 *
 * sharp no es dependencia del proyecto. Para regenerar:
 *   npm i --no-save sharp --prefix <carpeta-temporal>
 *   SHARP_DIR=<carpeta-temporal>/node_modules/sharp node frontend/scripts/portadas-fondo-editorial.mjs
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sharpDir = process.env.SHARP_DIR;
if (!sharpDir) {
  throw new Error('Falta SHARP_DIR (ruta a node_modules/sharp). Ver el encabezado del script.');
}
const sharp = createRequire(import.meta.url)(resolve(sharpDir));

const DESTINO = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets/fondo-editorial');
const ORIGEN = 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/';
const ANCHO = 560;
const FOTO = { quality: 82, effort: 6 };

/** [id del libro, ruta de la portada dentro de wp-content/uploads del blog] */
const PORTADAS = [
  ['el-ruisenor-y-la-estrella', '2026/07/portada-el-ruisenor-y-la-estrella-cesar-albornoz.jpg'],
  ['unidos-por-la-lectura', '2026/05/unidos-por-la-lectura-plan-de-lectura-escritura-y-oralidad.jpg'],
  ['saberes-en-accion', '2026/03/saberes-en-accion.jpg'],
  ['antidoto-explosivo', '2026/03/portada-antidoto-explosivo-y-otros-cuentos.jpg'],
  ['las-campanas-magicas-de-don-gaspar', '2026/03/portada-libro.jpg'],
  ['las-semillas-magicas-de-ines', '2025/05/las-semillas-magicas-de-ines.jpg'],
  ['entre-sombras-y-musgo', '2025/05/portada.jpg'],
  ['amaly-pregunta-sobre-el-cacao', '2025/04/amaly-pregunta-sobre-el-cacao.jpg'],
  ['plan-leer-para-sonar', '2025/03/plan-de-lectura-leer-para-sonar-2022-2024.jpg'],
  ['las-curiosidades-de-buho', '2025/01/las-curiosidades-de-buho-maria-julia-rojas.jpg'],
  ['lolita-pequena', '2024/11/portada-de-lolita-pequena.jpg'],
  ['mi-bosque-sorprendido', '2024/10/mi-bosque-sorprendido-1.jpg'],
  ['poemas-de-entrecasa', '2024/04/portada-poemas-de-entrecasa.jpg'],
  ['solo-yo-conozco-tus-suenos', '2024/04/solo-yo-conozco-tus-suenos-portada.jpg'],
  ['el-lenador-y-otras-obras', '2024/04/portadael-lenador-y-otras-obras1-pedro-maldonado-rojas.jpg'],
  ['sortilegios', '2023/11/portada-sortilegios-carmen-delia-bencomo.png'],
  ['a-las-nubes-en-un-velero', '2023/11/tapas-a-las-nubes-en-un-velero.png'],
  ['cocuyos-de-cristal', '2023/07/cocuyos-de-cristal-cdb-portada.png'],
  ['historia-basica-de-la-playa', '2023/06/historia-basica-de-la-playa-portada.jpg'],
  ['caja-de-poesia', '2023/08/caja-de-poesia-carmen-delia-bencomo-poesia.png'],
  ['rostro-de-soledad', '2023/06/rostro-de-soledad.jpg'],
  ['los-cuentos-del-colibri', '2023/06/los-cuentos-del-colibri-cdb.jpg'],
  ['los-papagayos', '2023/03/imagen_2023-03-30_105656345.png'],
  ['tiempo-de-sombra', '2022/12/portada-tiempo-de-sombra.jpg'],
  ['cantaclaro-el-hijo-del-viento', '2022/12/portada-cantaclaro.jpg'],
  ['con-el-camino', '2022/12/con-el-camino-carmen-delia-bencomo-poesia.jpg'],
  ['diario-de-una-muneca', '2022/08/diario.jpg'],
  ['el-oso-de-anteojos', '2022/07/el-oso-de-anteojos-elenamolina.jpg'],
  ['el-dia-que-gato-vendio-sus-guayos', '2022/06/el-dicc81a-que-gato-vendiocc81-sus-guayos-1.jpg'],
  ['cuentos-increibles-de-la-nona-maria', '2021/12/cuentos-de-la-nona-maria.jpg'],
  ['balcones-del-agua', '2021/07/balconesdeagua-carmendeliabencomo.jpg'],
  ['las-letras-asustadas', '2021/06/las-letras-asustadas-1.jpg'],
  ['en-las-nubes', '2021/05/enlasnubes-anasanchez.jpg'],
  ['el-ascensor-magico', '2021/05/elascensormagico.jpg'],
  ['el-paramo-en-el-alma', '2021/05/el-paramo-en-el-alma-henriette-arreaza.jpg'],
  ['el-verso-azul', '2020/03/verso-azul-rubc3a9n-darc3ado.jpg'],
  ['modernismo-literario', '2020/03/modernismo-literario.jpg'],
  ['mar-revuelto', '2020/03/mar-revuelto.jpg'],
  ['en-amarillo', '2020/03/en-amarillo.jpg'],
  ['cuentos-rurales', '2020/03/cuentos-rurales.jpg'],
  ['canto-poetico', '2020/03/cantopoetico.jpg'],
  ['cantos-que-cuenta-la-luna', '2020/03/cantos-que-cuenta-la-luna.jpg'],
  ['palabras-para-la-infancia', '2020/03/carmendelia-palabras-para-la-infanci.jpg'],
  ['la-pequena-inventora', '2020/03/lapequena.jpg'],
  ['filomena-en-busqueda-de-la-fotografia', '2016/06/filomena-en-bc3basqueda-de-la-fotografc3ada.jpg'],
  ['raul-y-el-gran-mazafesio', '2016/06/raulyelgranmazafesio.jpg'],
];

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

mkdirSync(DESTINO, { recursive: true });
let total = 0;
for (const [id, ruta] of PORTADAS) {
  const respuesta = await fetch(ORIGEN + ruta);
  if (!respuesta.ok) throw new Error(`${id}: HTTP ${respuesta.status} en ${ORIGEN + ruta}`);
  const original = Buffer.from(await respuesta.arrayBuffer());
  const info = await sharp(original)
    .resize({ width: ANCHO, withoutEnlargement: true })
    .webp(FOTO)
    .toFile(resolve(DESTINO, `${id}.webp`));
  total += info.size;
  console.log(`${id} (${kb(original.length)}) → ${info.width}×${info.height} (${kb(info.size)})`);
}
console.log(`${PORTADAS.length} portadas, ${kb(total)} en total`);
