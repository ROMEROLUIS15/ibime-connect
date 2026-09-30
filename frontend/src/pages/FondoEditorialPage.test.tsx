import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FondoEditorialPage from './FondoEditorialPage';
import { CATALOG, CONTACT, FONDO_EDITORIAL } from '@/data/fondo-editorial';

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
    expect(screen.getByText(`Mostrando ${expected.length} libros`)).toBeInTheDocument();

    fireEvent.click(todos);
    expect(catalogItems()).toHaveLength(CATALOG.length);
    expect(todos).toHaveAttribute('aria-pressed', 'true');
  });

  it('ofrece la versión para colorear solo donde existe', () => {
    renderPage();
    const expected = CATALOG.filter((b) => b.coloringPdfUrl).length;
    expect(screen.getAllByText('Versión para colorear')).toHaveLength(expected);
    expect(expected).toBe(3);
  });

  it('muestra misión, visión y el correo de contacto', () => {
    renderPage();
    expect(screen.getByText(FONDO_EDITORIAL.mission)).toBeInTheDocument();
    expect(screen.getByText(FONDO_EDITORIAL.vision)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: CONTACT.email })).toHaveAttribute(
      'href',
      `mailto:${CONTACT.email}`
    );
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
