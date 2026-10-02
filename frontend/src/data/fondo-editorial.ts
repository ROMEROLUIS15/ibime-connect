/**
 * frontend/src/data/fondo-editorial.ts
 *
 * Los datos del Fondo Editorial (catálogo, colecciones, textos) viven en
 * shared/data/fondo-editorial.ts, porque los lee también el seed del RAG del
 * backend. Este archivo los reexporta —los imports de la página no cambian— y
 * conserva lo que solo existe en Vite: las portadas.
 */
export * from '@shared/data/fondo-editorial';

/** Portadas por id del libro (nombre del archivo sin `.webp`). */
const COVER_BY_ID = new Map(
  Object.entries(
    import.meta.glob<string>('@/assets/fondo-editorial/*.webp', { eager: true, import: 'default' })
  ).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.webp'.length), url])
);

/** URL de la portada del libro, o `undefined` si falta su WebP. */
export function getBookCover(id: string): string | undefined {
  return COVER_BY_ID.get(id);
}
