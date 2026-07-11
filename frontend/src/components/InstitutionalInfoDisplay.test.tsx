import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InstitutionalInfoDisplay } from './InstitutionalInfoDisplay';

const renderComponent = () =>
  render(
    <MemoryRouter>
      <InstitutionalInfoDisplay />
    </MemoryRouter>
  );

describe('InstitutionalInfoDisplay', () => {
  it('renders today\'s date dynamically', () => {
    renderComponent();
    // La fecha ya no está hardcodeada: se calcula al render (misma lógica que el
    // componente), así que el test la deriva igual en vez de fijar una fecha.
    const today = new Date();
    const fechaFormateada = today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const fechaISO = today.toISOString().split('T')[0];
    const timeEl = screen.getByText(fechaFormateada);
    expect(timeEl).toBeInTheDocument();
    expect(timeEl).toHaveAttribute('dateTime', fechaISO);
  });

  it('renders the category', () => {
    renderComponent();
    expect(screen.getByText('Institucional')).toBeInTheDocument();
  });

  it('renders the title', () => {
    renderComponent();
    expect(
      screen.getByText('Conformación del Congreso Nacional Constituyente Obrero')
    ).toBeInTheDocument();
  });

  it('renders the first paragraph of the description', () => {
    renderComponent();
    expect(
      screen.getByText(/Cumpliendo con el llamado a la patria/)
    ).toBeInTheDocument();
  });

  it('renders the second paragraph of the description', () => {
    renderComponent();
    expect(
      screen.getByText(/renovación profunda de nuestras estructuras/)
    ).toBeInTheDocument();
  });

  it('renders the "Leer más" link with correct href', () => {
    renderComponent();
    const link = screen.getByText('Leer más');
    expect(link).toHaveAttribute('href', '/donation-criteria');
  });

  it('renders without errors', () => {
    renderComponent();
    expect(screen.getByText('Leer más')).toBeInTheDocument();
  });
});
