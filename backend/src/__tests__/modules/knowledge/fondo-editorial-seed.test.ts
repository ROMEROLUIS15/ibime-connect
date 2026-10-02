import { describe, it, expect } from 'vitest';
import { buildFondoEditorialSeed } from '../../../modules/knowledge/fondo-editorial-seed.js';
import { CATALOG } from '@shared/data/fondo-editorial.js';

// Títulos de las 8 entradas que ya carga scripts/seed-institutional-knowledge.ts.
const TITULOS_EXISTENTES = [
  'IBIME - Quiénes somos y misión',
  'Horario de atención del IBIME',
  'Contacto y ubicación del IBIME',
  'Red Bibliotecaria del estado Mérida',
  'Sistema Koha - Catálogo en línea',
  'Alfabetización Digital - Talleres gratuitos',
  'Libro Hablado - Programa de audiolibros',
  'Donación de libros al IBIME - Criterios y proceso',
];

describe('buildFondoEditorialSeed', () => {
  const entries = buildFondoEditorialSeed();
  const fichas = entries.filter((e) => e.title.startsWith('Fondo Editorial - '));
  const indice = entries.find((e) => e.title === 'Fondo Editorial Carmen Delia Bencomo - Catálogo de libros');

  it('devuelve 51 entradas (46 fichas + 1 índice + 4 institucionales), todas de la categoría fondo-editorial', () => {
    expect(CATALOG).toHaveLength(46);
    expect(entries).toHaveLength(51);
    expect(entries.every((e) => e.category === 'fondo-editorial')).toBe(true);
  });

  it('los títulos son únicos y no chocan con los 8 del seed actual', () => {
    const titulos = entries.map((e) => e.title);
    expect(new Set(titulos).size).toBe(51);
    for (const t of TITULOS_EXISTENTES) expect(titulos).not.toContain(t);
  });

  it('es determinista: dos llamadas dan el mismo resultado', () => {
    expect(buildFondoEditorialSeed()).toEqual(entries);
  });

  it('cada ficha nombra el libro, su autoría (si la hay) y su PDF', () => {
    expect(fichas).toHaveLength(46);
    CATALOG.forEach((book, i) => {
      const ficha = fichas[i];
      expect(ficha.title).toBe(`Fondo Editorial - ${book.title}`);
      expect(ficha.content).toContain(book.title);
      if (book.author) expect(ficha.content).toContain(book.author);
      expect(ficha.content).toContain(book.pdfUrl);
      if (book.coloringPdfUrl) expect(ficha.content).toContain(book.coloringPdfUrl);
    });
  });

  it('el índice lista los 46 títulos y dice que son 46', () => {
    expect(indice).toBeDefined();
    expect(indice!.content).toContain('tiene 46 libros publicados');
    for (const book of CATALOG) expect(indice!.content).toContain(book.title);
  });

  it('incluye las 4 entradas institucionales', () => {
    const titulos = entries.map((e) => e.title);
    expect(titulos).toContain('Fondo Editorial Carmen Delia Bencomo - Quiénes somos');
    expect(titulos).toContain('Carmen Delia Bencomo - Biografía');
    expect(titulos).toContain('Bienal Nacional de Literatura Infantil y Juvenil Carmen Delia Bencomo');
    expect(titulos).toContain('Fondo Editorial Carmen Delia Bencomo - Contacto');
  });

  it('la biografía incluye la fecha de muerte y la Bienal a su obra ganadora', () => {
    const bio = entries.find((e) => e.title === 'Carmen Delia Bencomo - Biografía')!;
    expect(bio.content).toContain('Murió en La Guaira el 12 de octubre de 2002.');
    const bienal = entries.find((e) => e.title.startsWith('Bienal'))!;
    expect(bienal.content).toContain('«A las nubes en un velero», de César Luis Franco Rivero');
  });

  it('el contacto trae correo y dirección del Fondo', () => {
    const contacto = entries.find((e) => e.title.endsWith('- Contacto'))!;
    expect(contacto.content).toContain('fondoeditorialcdb@gmail.com');
    expect(contacto.content).toContain('Glorias Patrias');
  });

  it('ninguna entrada menciona el dominio de Vercel (cambia con la mudanza)', () => {
    for (const e of entries) {
      expect(e.title).not.toContain('vercel.app');
      expect(e.content).not.toContain('vercel.app');
    }
  });
});
