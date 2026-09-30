import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FondoEditorialPage from './FondoEditorialPage';
import { CATALOG, CONTACT, FONDO_EDITORIAL, type Book } from '@/data/fondo-editorial';
import { matchesQuery, normalizeForSearch } from '@/lib/search';

const renderPage = () =>
  render(
    <MemoryRouter>
      <FondoEditorialPage />
    </MemoryRouter>
  );

const catalogItems = () => {
  const section = document.getElementById('catalogo') as HTMLElement;
  return within(section).getAllByRole('listitem');
};

const searchBox = () => screen.getByRole('searchbox', { name: 'Buscar en el catálogo' });

const search = (text: string) => fireEvent.change(searchBox(), { target: { value: text } });

const haystack = (b: Book) =>
  normalizeForSearch([b.title, b.author, b.illustrator, b.credits, b.synopsis].filter(Boolean).join(' '));

const matching = (query: string, pool: readonly Book[] = CATALOG) =>
  pool.filter((b) => matchesQuery(haystack(b), query));

describe('FondoEditorialPage', () => {
  it('muestra el título y un enlace real al catálogo', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Carmen Delia Bencomo');
    expect(screen.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '#catalogo');
    expect(document.getElementById('catalogo')).not.toBeNull();
  });

  it('muestra todos los libros por defecto', () => {
    renderPage();
    expect(catalogItems()).toHaveLength(CATALOG.length);
    expect(screen.getByText('Mostrando 46 libros')).toBeInTheDocument();
  });

  it('cada enlace Descargar PDF apunta al PDF de su libro y abre en pestaña nueva', () => {
    renderPage();
    for (const book of CATALOG) {
      const link = screen.getByRole('link', {
        name: `Descargar PDF de ${book.title} (se abre en una pestaña nueva)`,
      });
      expect(link).toHaveAttribute('href', book.pdfUrl);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
  });

  it('filtra por colección y vuelve a mostrar todos', () => {
    renderPage();
    const historia = screen.getByRole('button', { name: 'Historia y patrimonio (3)' });
    const todos = screen.getByRole('button', { name: 'Todos' });

    fireEvent.click(historia);
    const expected = CATALOG.filter((b) => b.collections.includes('historia-patrimonio'));
    expect(catalogItems()).toHaveLength(expected.length);
    expect(historia).toHaveAttribute('aria-pressed', 'true');
    expect(todos).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(`Mostrando ${expected.length} de ${CATALOG.length} libros`)).toBeInTheDocument();

    fireEvent.click(todos);
    expect(catalogItems()).toHaveLength(CATALOG.length);
    expect(todos).toHaveAttribute('aria-pressed', 'true');
  });

  it('busca por texto y actualiza el conteo', () => {
    renderPage();
    const expected = matching('búho');
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(CATALOG.length);

    search('búho');
    expect(catalogItems()).toHaveLength(expected.length);
    expect(screen.getByText(`Mostrando ${expected.length} de ${CATALOG.length} libros`)).toBeInTheDocument();
    for (const book of expected) {
      expect(screen.getByRole('heading', { level: 3, name: book.title })).toBeInTheDocument();
    }
  });

  it('busca por el nombre del ilustrador', () => {
    renderPage();
    const expected = matching('Ludwianna');
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.some((b) => b.illustrator?.includes('Ludwianna'))).toBe(true);

    search('Ludwianna');
    expect(catalogItems()).toHaveLength(expected.length);
  });

  it('la búsqueda ignora tildes y mayúsculas', () => {
    renderPage();
    search('DIARIO de una muneca');
    expect(screen.getByRole('heading', { level: 3, name: 'Diario de una muñeca' })).toBeInTheDocument();
  });

  it('combina la búsqueda con el filtro de colección', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Biblioteca Digital Carmen Delia Bencomo (14)' }));
    const inCollection = CATALOG.filter((b) => b.collections.includes('biblioteca-cdb'));
    expect(inCollection).toHaveLength(14);
    const expected = matching('poesía', inCollection);
    expect(expected.length).toBeGreaterThan(0);

    search('poesía');
    expect(catalogItems()).toHaveLength(expected.length);
    expect(screen.getByText(`Mostrando ${expected.length} de ${CATALOG.length} libros`)).toBeInTheDocument();
  });

  it('sin resultados muestra el aviso y "Limpiar búsqueda" restaura todo', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Historia y patrimonio (3)' }));
    search('zzzz');

    const section = document.getElementById('catalogo') as HTMLElement;
    expect(within(section).queryAllByRole('listitem')).toHaveLength(0);
    expect(
      screen.getByText('No encontramos libros que coincidan con «zzzz» en esta colección')
    ).toBeInTheDocument();

    fireEvent.click(within(section).getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(catalogItems()).toHaveLength(CATALOG.length);
    expect(searchBox()).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('el botón ✕ solo aparece con texto y limpia la búsqueda', () => {
    renderPage();
    const borrar = { name: 'Borrar el texto de la búsqueda' };
    expect(screen.queryByRole('button', borrar)).toBeNull();

    search('búho');
    fireEvent.click(screen.getByRole('button', borrar));
    expect(searchBox()).toHaveValue('');
    expect(searchBox()).toHaveFocus();
    expect(screen.queryByRole('button', borrar)).toBeNull();
    expect(catalogItems()).toHaveLength(CATALOG.length);
  });

  it('ofrece la versión para colorear solo donde existe', () => {
    renderPage();
    const expected = CATALOG.filter((b) => b.coloringPdfUrl).length;
    expect(screen.getAllByText('Versión para colorear')).toHaveLength(expected);
    expect(expected).toBe(3);
  });

  it('muestra misión y visión con sus fotos, y el correo de contacto', () => {
    renderPage();
    expect(screen.getByText(FONDO_EDITORIAL.mission)).toBeInTheDocument();
    expect(screen.getByText(FONDO_EDITORIAL.vision)).toBeInTheDocument();
    expect(screen.getByAltText('Seis personas frente a la fachada del IBIME')).toBeInTheDocument();
    expect(screen.getByAltText(/^Actividad del Fondo Editorial/)).toBeInTheDocument();
    expect(screen.getByText(CONTACT.intro)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: CONTACT.email })).toHaveAttribute(
      'href',
      `mailto:${CONTACT.email}`
    );
    expect(screen.getByRole('link', { name: 'Escríbenos' })).toHaveAttribute('href', `mailto:${CONTACT.email}`);
    expect(screen.getByRole('link', { name: new RegExp(`^${CONTACT.subscribe}`) })).toHaveAttribute(
      'href',
      CONTACT.blogUrl
    );
  });

  it('muestra el lugar y el año de nacimiento y de muerte de Carmen Delia Bencomo', () => {
    renderPage();
    // 12/10/2002 según el Centro Nacional del Libro (el blog también da 2003, por error).
    expect(screen.getByText('(Tovar, 1923 – La Guaira, 2002)')).toBeInTheDocument();
  });

  it('no muestra las publicaciones inventadas anteriores', () => {
    renderPage();
    for (const title of [
      'Revista Cultural Merideña',
      'Colección Autores Merideños',
      'Cuadernos de Historia Regional',
      'Boletín Informativo IBIME',
    ]) {
      expect(screen.queryByText(title)).toBeNull();
    }
  });
});
