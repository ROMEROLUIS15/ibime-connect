// Normaliza para comparar: sin tildes, en minúsculas y con los espacios colapsados.
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Todos los términos de la consulta deben aparecer en el texto ya normalizado (AND).
export function matchesQuery(normalizedHaystack: string, query: string): boolean {
  const terms = normalizeForSearch(query).split(' ').filter(Boolean);
  return terms.every((term) => normalizedHaystack.includes(term));
}
