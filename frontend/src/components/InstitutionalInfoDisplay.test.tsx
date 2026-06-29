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
  it('renders the date', () => {
    renderComponent();
    expect(screen.getByText('14 Noviembre 2025')).toBeInTheDocument();
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
