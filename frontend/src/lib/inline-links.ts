/**
 * src/lib/inline-links.ts
 *
 * Divide un texto en segmentos normales y en enlaces. El modelo del asistente
 * escribe los enlaces de tres formas, y las tres se reconocen:
 *   - Markdown `[texto](url)`: se muestra solo el texto;
 *   - entre ángulos `<url>`: se quitan los ángulos;
 *   - URL suelta: la puntuación y el paréntesis que la cierran quedan fuera.
 *
 * Solo se enlazan direcciones http y https (nunca `javascript:` ni otros
 * esquemas). Como en `inline-bold.ts`, devuelve datos y no HTML.
 */
export interface LinkSegment {
  readonly text: string;
  readonly href?: string;
}

const LINK_PATTERN =
  /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|<(https?:\/\/[^\s<>]+)>|(https?:\/\/[^\s<>()[\]{}"«»]+)/gi;

// Puntuación de la frase que suele quedar pegada a una URL suelta.
const TRAILING_PUNCTUATION = /[.,;:!?…'*]+$/;

export function splitInlineLinks(text: string): LinkSegment[] {
  const segments: LinkSegment[] = [];
  let plain = '';
  let lastIndex = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const [whole, label, markdownUrl, angleUrl, bareUrl] = match;
    plain += text.slice(lastIndex, match.index);
    lastIndex = match.index + whole.length;

    let link: LinkSegment;
    if (markdownUrl !== undefined) {
      link = { text: label, href: markdownUrl };
    } else if (angleUrl !== undefined) {
      link = { text: angleUrl, href: angleUrl };
    } else {
      const url = bareUrl.replace(TRAILING_PUNCTUATION, '');
      if (url.endsWith('//')) {
        // Solo quedaba el esquema ("https://."): no es una dirección.
        plain += whole;
        continue;
      }
      link = { text: url, href: url };
      lastIndex -= bareUrl.length - url.length;
    }

    if (plain !== '') segments.push({ text: plain });
    plain = '';
    segments.push(link);
  }

  plain += text.slice(lastIndex);
  if (plain !== '') segments.push({ text: plain });
  return segments;
}
