import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SidPage from './SidPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <SidPage />
    </MemoryRouter>
  );

describe('SidPage', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: /Servicio de Información Digital/i })
    ).toBeInTheDocument();
  });

  it('links to the Libro Hablado page', () => {
    renderPage();
    const link = screen.getByRole('link', { name: 'Ir a Libro Hablado' });
    expect(link).toHaveAttribute('href', '/libro-hablado');
  });

  it('states where the service is located', () => {
    renderPage();
    const location = screen.getByText(/municipio Libertador/i);
    expect(location).toHaveTextContent('Biblioteca Pública Central Estadal Simón Bolívar');
    expect(location).toHaveTextContent('Libertador');
  });

  it('is reachable from the navbar', () => {
    renderPage();
    const links = screen.getAllByRole('link', { name: 'SID' });
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link).toHaveAttribute('href', '/sid'));
  });
});
