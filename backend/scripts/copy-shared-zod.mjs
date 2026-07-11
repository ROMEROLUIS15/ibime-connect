/**
 * Copia `zod` a shared/node_modules antes de compilar el backend.
 *
 * Por qué: `shared/package.json` no declara dependencias, pero
 * `shared/validators/schemas.ts` importa `zod`. En Render el servicio se
 * construye con `rootDir: backend`, así que el único `node_modules` que existe
 * es el del backend y la resolución desde `shared/` fallaría en runtime.
 *
 * Antes esto era un one-liner de shell (`mkdir -p … && cp -r … || true`) que
 * cmd.exe no entiende: en Windows fallaba siempre, y el `|| true` se tragaba el
 * error sin que nadie se enterara. Aquí falla ruidosamente si algo va mal, que
 * es lo que queremos en un paso previo al build.
 */
import { existsSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const origen = resolve(here, '../node_modules/zod');
const destino = resolve(here, '../../shared/node_modules/zod');

if (!existsSync(origen)) {
  console.error(`[prebuild] No se encontró zod en ${origen}. ¿Se instalaron las dependencias del backend?`);
  process.exit(1);
}

// Copia limpia: si quedó una versión anterior, se reemplaza en vez de mezclarse.
rmSync(destino, { recursive: true, force: true });
mkdirSync(dirname(destino), { recursive: true });
cpSync(origen, destino, { recursive: true });

console.log(`[prebuild] zod copiado a shared/node_modules`);
