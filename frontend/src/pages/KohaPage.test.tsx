import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KohaPage from './KohaPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <KohaPage />
    </MemoryRouter>
  );

describe('KohaPage', () => {
  it('links to the public Koha catalog (OPAC), not the staff login', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /Acceder a Koha/i });
    // :8000 es el catálogo público (OPAC); :8001 es el inicio de sesión del personal.
    expect(link).toHaveAttribute('href', 'http://www.ibime.gob.ve:8000/');
  });
});
