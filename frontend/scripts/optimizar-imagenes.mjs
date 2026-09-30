/**
 * Genera las versiones WebP de las imágenes de la portada.
 *
 * Por qué: Lighthouse móvil (2026-09-27) midió 3,8 MB de imágenes sobre 4,5 MB
 * totales. Las fotos eran JPEG casi sin comprimir y los logos, PNG de hasta
 * 2.531 px para mostrarse a 48 px.
 *
 * Criterio, medido con Playwright en móvil (412×823, DPR 1,75) y escritorio
 * (1440×900, DPR 2; 1920×1080, DPR 1):
 *  - Fotos: se mantienen sus dimensiones. Todas se muestran con `object-cover`
 *    y, en un teléfono vertical, el hero necesita más resolución de la que
 *    tienen; achicarlas las volvería borrosas. Solo cambian a WebP.
 *  - Logos y búho: se reducen a unas 3 veces su tamaño mostrado (DPR 3).
 *
 * Los originales quedan en src/assets: este script los lee y escribe al lado
 * un .webp con el mismo nombre.
 *
 * sharp no es dependencia del proyecto. Para regenerar:
 *   npm i --no-save sharp --prefix <carpeta-temporal>
 *   SHARP_DIR=<carpeta-temporal>/node_modules/sharp node frontend/scripts/optimizar-imagenes.mjs
 */
import { createRequire } from 'node:module';
import { statSync } from 'node:fs';
import { dirname, resolve, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const sharpDir = process.env.SHARP_DIR;
if (!sharpDir) {
  throw new Error('Falta SHARP_DIR (ruta a node_modules/sharp). Ver el encabezado del script.');
}
const sharp = createRequire(import.meta.url)(resolve(sharpDir));

const ASSETS = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets');

const FOTO = { quality: 82, effort: 6 };
const LOGO = { quality: 90, alphaQuality: 100, effort: 6 };

/** [archivo original, opciones WebP, ancho final (undefined = el original)] */
const IMAGENES = [
  ['fachada-ibime.jpeg', FOTO],
  ['cultura-para-todos.jpg', FOTO],
  ['library-activity.jpg', FOTO],
  ['library-building.jpg', FOTO],
  ['community-event.jpeg', FOTO],
  ['event-literary.jpg', FOTO],
  ['event-children.jpg', FOTO],
  ['event-digital.jpg', FOTO],
  ['ESPACIO BPC 1.jpg', FOTO],
  ['ESPACIO BPC 2.jpg', FOTO],
  ['ESPACIO BPC 3.jpg', FOTO],
  ['ESPACIO BPC 4.jpg', FOTO],
  ['ESPACIO BPC 5.jpg', FOTO],
  ['ESPACIO BPC 6.jpg', FOTO],
  ['ESPACIO BPC 7.jpg', FOTO],
  ['fondo editoria 1.jpg', FOTO],
  ['fondo editoria 2.jpg', FOTO],
  ['logo-ibime.png', LOGO, 480],
  ['buho_8-removebg-preview.png', LOGO, 256],
  ['logo-gobernacion.png', LOGO, 160],
];

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

for (const [archivo, opciones, ancho] of IMAGENES) {
  const origen = resolve(ASSETS, archivo);
  const destino = resolve(ASSETS, `${parse(archivo).name}.webp`);
  let tuberia = sharp(origen);
  if (ancho) tuberia = tuberia.resize({ width: ancho, withoutEnlargement: true });
  const info = await tuberia.webp(opciones).toFile(destino);
  console.log(
    `${archivo} (${kb(statSync(origen).size)}) → ${parse(destino).base} ` +
      `${info.width}×${info.height} (${kb(info.size)})`
  );
}
