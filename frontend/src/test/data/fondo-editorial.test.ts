import { describe, it, expect } from 'vitest';
import { CATALOG, COLLECTIONS, getBookCover } from '@/data/fondo-editorial';

const UPLOADS = 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/';
const BLOG = 'https://carmendeliabencomo.wordpress.com/';

describe('datos del Fondo Editorial', () => {
  it('tiene los 46 libros del catálogo', () => {
    expect(CATALOG).toHaveLength(46);
  });

  it('usa ids únicos en kebab-case', () => {
    const ids = CATALOG.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('cada libro tiene portada (datos y script de portadas sincronizados)', () => {
    const sinPortada = CATALOG.filter((b) => getBookCover(b.id) === undefined).map((b) => b.id);
    expect(sinPortada).toEqual([]);
  });

  it('las colecciones usadas existen y ninguna está vacía', () => {
    const known = new Set<string>(COLLECTIONS.map((c) => c.id));
    for (const book of CATALOG) {
      expect(book.collections.length).toBeGreaterThan(0);
      for (const id of book.collections) expect(known.has(id)).toBe(true);
    }
    for (const c of COLLECTIONS) {
      expect(CATALOG.some((b) => b.collections.includes(c.id))).toBe(true);
    }
  });

  it('los PDF y las fichas apuntan al blog del Fondo', () => {
    for (const book of CATALOG) {
      expect(book.pdfUrl.startsWith(UPLOADS)).toBe(true);
      expect(book.pdfUrl.endsWith('.pdf')).toBe(true);
      if (book.coloringPdfUrl !== undefined) {
        expect(book.coloringPdfUrl.startsWith(UPLOADS)).toBe(true);
        expect(book.coloringPdfUrl.endsWith('.pdf')).toBe(true);
      }
      expect(book.postUrl.startsWith(BLOG)).toBe(true);
    }
  });

  it('ningún campo de texto está vacío', () => {
    for (const book of CATALOG) {
      for (const [key, value] of Object.entries(book)) {
        if (typeof value === 'string') {
          expect(value.trim(), `${book.id}.${key}`).not.toBe('');
        }
      }
    }
  });
});
