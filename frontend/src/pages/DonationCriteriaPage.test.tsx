import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DonationCriteriaPage } from './DonationCriteriaPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <DonationCriteriaPage />
    </MemoryRouter>
  );

describe('DonationCriteriaPage', () => {
  it('renders the main title', () => {
    renderPage();
    expect(
      screen.getByText(
        'Criterios de donación para la aceptación de materiales Bibliohemerográficos en las Bibliotecas públicas'
      )
    ).toBeInTheDocument();
  });

  it('renders the key conservation criterion', () => {
    renderPage();
    const matches = screen.getAllByText('Solo se aceptarán documentos en buen estado de conservación');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Estado de conservación heading', () => {
    renderPage();
    const matches = screen.getAllByText('Estado de conservación');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders without errors', () => {
    renderPage();
    expect(
      screen.getByText(/Criterios de donación/)
    ).toBeInTheDocument();
  });
});
