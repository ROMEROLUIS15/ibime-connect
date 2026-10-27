import { describe, it, expect } from 'vitest';
import { splitInlineLinks } from '../../lib/inline-links';

const KOHA = 'http://www.ibime.gob.ve:8000/';
const PDF = 'https://carmendeliabencomo.wordpress.com/wp-content/uploads/2016/06/raulyelgranmazafesio.pdf';

describe('splitInlineLinks', () => {
  it('should turn a Markdown link into a link that shows only its label', () => {
    expect(splitInlineLinks(`Descárgala desde el siguiente enlace:\n[Raúl y el Gran Mazafesio (PDF)](${PDF})`)).toEqual([
      { text: 'Descárgala desde el siguiente enlace:\n' },
      { text: 'Raúl y el Gran Mazafesio (PDF)', href: PDF },
    ]);
  });

  it('should link a bare URL and leave the punctuation after it as text', () => {
    expect(splitInlineLinks(`Disponible en el catálogo en línea (Koha): ${KOHA}, o en la biblioteca.`)).toEqual([
      { text: 'Disponible en el catálogo en línea (Koha): ' },
      { text: KOHA, href: KOHA },
      { text: ', o en la biblioteca.' },
    ]);
    expect(splitInlineLinks('A través de su blog: https://carmendeliabencomo.wordpress.com/.')).toEqual([
      { text: 'A través de su blog: ' },
      { text: 'https://carmendeliabencomo.wordpress.com/', href: 'https://carmendeliabencomo.wordpress.com/' },
      { text: '.' },
    ]);
  });

  it('should not take the closing parenthesis into a bare URL', () => {
    expect(splitInlineLinks(`el catálogo en línea del Sistema Koha (${KOHA}) puedes buscar`)).toEqual([
      { text: 'el catálogo en línea del Sistema Koha (' },
      { text: KOHA, href: KOHA },
      { text: ') puedes buscar' },
    ]);
  });

  it('should link a URL between angle brackets and drop the brackets', () => {
    expect(splitInlineLinks(`Enlace directo: <${PDF}>`)).toEqual([
      { text: 'Enlace directo: ' },
      { text: PDF, href: PDF },
    ]);
  });

  it('should link several URLs in the same text', () => {
    expect(splitInlineLinks(`[PDF](${PDF}) y ${KOHA}`)).toEqual([
      { text: 'PDF', href: PDF },
      { text: ' y ' },
      { text: KOHA, href: KOHA },
    ]);
  });

  it('should only link http and https addresses', () => {
    expect(splitInlineLinks('[clic](javascript:alert(1)) y ftp://ibime.gob.ve/archivo')).toEqual([
      { text: '[clic](javascript:alert(1)) y ftp://ibime.gob.ve/archivo' },
    ]);
  });

  it('should turn an email into a mailto link and leave the punctuation after it as text', () => {
    expect(splitInlineLinks('Llámanos al 0274-2623898 o escribe un correo a contactoibime@gmail.com.')).toEqual([
      { text: 'Llámanos al 0274-2623898 o escribe un correo a ' },
      { text: 'contactoibime@gmail.com', href: 'mailto:contactoibime@gmail.com' },
      { text: '.' },
    ]);
    expect(splitInlineLinks('teléfono (0274-2623898) o correo (contactoibime@gmail.com).')).toEqual([
      { text: 'teléfono (0274-2623898) o correo (' },
      { text: 'contactoibime@gmail.com', href: 'mailto:contactoibime@gmail.com' },
      { text: ').' },
    ]);
  });

  it('should not link a masked email', () => {
    expect(splitInlineLinks('Tu correo j***@gmail.com no aparece.')).toEqual([
      { text: 'Tu correo j***@gmail.com no aparece.' },
    ]);
  });

  it('should return a single plain segment when there is no link', () => {
    expect(splitInlineLinks('Horario: lunes a viernes.')).toEqual([{ text: 'Horario: lunes a viernes.' }]);
  });

  it('should return no segments for an empty string', () => {
    expect(splitInlineLinks('')).toEqual([]);
  });
});
