import { describe, it, expect } from 'vitest';
import { splitInlineBold } from '../../lib/inline-bold';

describe('splitInlineBold', () => {
  it('should mark the text between ** as bold and drop the asterisks', () => {
    expect(
      splitInlineBold('La directora actual del IBIME es la Licenciada **Zenaida Hernández**, quien lidera los proyectos.'),
    ).toEqual([
      { text: 'La directora actual del IBIME es la Licenciada ', bold: false },
      { text: 'Zenaida Hernández', bold: true },
      { text: ', quien lidera los proyectos.', bold: false },
    ]);
  });

  it('should return a single plain segment when there is no bold mark', () => {
    expect(splitInlineBold('Horario: lunes a viernes.')).toEqual([
      { text: 'Horario: lunes a viernes.', bold: false },
    ]);
  });

  it('should handle several bold marks and bold at the edges', () => {
    expect(splitInlineBold('**Lunes** y **martes**')).toEqual([
      { text: 'Lunes', bold: true },
      { text: ' y ', bold: false },
      { text: 'martes', bold: true },
    ]);
  });

  it('should keep line breaks inside the plain segments', () => {
    expect(splitInlineBold('Primera línea\n**Segunda**')).toEqual([
      { text: 'Primera línea\n', bold: false },
      { text: 'Segunda', bold: true },
    ]);
  });

  it('should leave unclosed or spaced marks as literal text', () => {
    expect(splitInlineBold('Precio **sin cerrar')).toEqual([
      { text: 'Precio **sin cerrar', bold: false },
    ]);
    expect(splitInlineBold('a ** b ** c')).toEqual([{ text: 'a ** b ** c', bold: false }]);
  });

  it('should not join bold across lines', () => {
    expect(splitInlineBold('**uno\ndos**')).toEqual([{ text: '**uno\ndos**', bold: false }]);
  });

  it('should return no segments for an empty string', () => {
    expect(splitInlineBold('')).toEqual([]);
  });
});
