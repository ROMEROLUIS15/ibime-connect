/**
 * src/lib/inline-bold.ts
 *
 * Divide un texto en segmentos normales y en negrita según la marca Markdown
 * `**texto**`, que el modelo del asistente usa para resaltar (p. ej. nombres).
 *
 * Devuelve datos, no HTML: el componente pinta cada segmento con React, así
 * que el texto nunca se interpreta como marcado (sin `dangerouslySetInnerHTML`).
 *
 * Solo se reconoce la negrita dentro de una misma línea y sin espacios pegados
 * a los asteriscos (como en Markdown). Una marca sin cerrar queda como texto.
 */
export interface TextSegment {
  readonly text: string;
  readonly bold: boolean;
}

const BOLD_PATTERN = /\*\*([^\s*](?:[^*\n]*[^\s*])?)\*\*/;

export function splitInlineBold(text: string): TextSegment[] {
  // Con un grupo de captura, split intercala el contenido de cada negrita:
  // los índices impares son el texto que iba entre `**`.
  return text
    .split(BOLD_PATTERN)
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((segment) => segment.text !== '');
}
