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
 *  - Mapas con texto (eje-*): mismo tamaño, con el criterio de logos para que el
 *    texto siga legible.
 *
 * El repositorio guarda solo las WebP. Para una imagen nueva: copiá el original a
 * la carpeta de su sección en src/assets, agregalo a IMAGENES, corré el script,
 * revisá la WebP y después borrá el original y su entrada de la lista.
 *
 * Los originales de las WebP actuales se borraron el 29/10/2026; siguen en el
 * historial de git: `git log --diff-filter=D --name-only -- frontend/src/assets`.
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

/**
 * [ruta del original dentro de src/assets, opciones WebP, ancho final (undefined = el original)]
 * Ejemplos: ['galeria/foto-nueva.jpg', FOTO] · ['marca/logo-nuevo.png', LOGO, 480]
 */
const IMAGENES = [];

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

for (const [archivo, opciones, ancho] of IMAGENES) {
  const origen = resolve(ASSETS, archivo);
  const { dir, name } = parse(archivo);
  const destino = resolve(ASSETS, dir, `${name}.webp`);
  let tuberia = sharp(origen);
  if (ancho) tuberia = tuberia.resize({ width: ancho, withoutEnlargement: true });
  const info = await tuberia.webp(opciones).toFile(destino);
  console.log(
    `${archivo} (${kb(statSync(origen).size)}) → ${parse(destino).base} ` +
      `${info.width}×${info.height} (${kb(info.size)})`
  );
}
