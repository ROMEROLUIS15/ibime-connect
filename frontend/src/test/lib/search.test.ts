import { describe, it, expect } from 'vitest';
import { matchesQuery, normalizeForSearch } from '@/lib/search';

describe('normalizeForSearch', () => {
  it('quita tildes y conserva la ñ como n', () => {
    expect(normalizeForSearch('Muñeca Búho')).toBe('muneca buho');
    expect(normalizeForSearch('Poesía á é í ó ú ü')).toBe('poesia a e i o u u');
  });

  it('pasa a minúsculas', () => {
    expect(normalizeForSearch('CARMEN Delia')).toBe('carmen delia');
  });

  it('colapsa espacios y recorta los extremos', () => {
    expect(normalizeForSearch('  Diario   de\tuna \n muñeca  ')).toBe('diario de una muneca');
  });
});

describe('matchesQuery', () => {
  const haystack = normalizeForSearch('Las curiosidades de Búho. Ilustraciones de Ludwianna');

  it('una consulta vacía coincide siempre', () => {
    expect(matchesQuery(haystack, '')).toBe(true);
    expect(matchesQuery(haystack, '   ')).toBe(true);
  });

  it('coincide con un término', () => {
    expect(matchesQuery(haystack, 'curiosidades')).toBe(true);
  });

  it('exige todos los términos (AND)', () => {
    expect(matchesQuery(haystack, 'curiosidades ludwianna')).toBe(true);
    expect(matchesQuery(haystack, 'curiosidades poesia')).toBe(false);
  });

  it('ignora tildes y mayúsculas', () => {
    expect(matchesQuery(haystack, 'BUHO')).toBe(true);
    expect(matchesQuery(haystack, 'búho')).toBe(true);
  });

  it('un término ausente no coincide', () => {
    expect(matchesQuery(haystack, 'zzzz')).toBe(false);
  });
});
