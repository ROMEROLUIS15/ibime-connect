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
      screen.getByText((content) => content.includes('Dona conocimiento'))
    ).toBeInTheDocument();
  });

  it('renders the stats section', () => {
    renderPage();
    expect(screen.getByText('5,000+')).toBeInTheDocument();
    expect(screen.getByText('Libros donados')).toBeInTheDocument();
  });

  it('renders Estado de conservación heading', () => {
    renderPage();
    const matches = screen.getAllByText('Estado de conservación');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders criteria section', () => {
    renderPage();
    expect(screen.getByText('Criterios de aceptación')).toBeInTheDocument();
    expect(screen.getByText('detallados')).toBeInTheDocument();
  });

  it('renders timeline process', () => {
    renderPage();
    expect(screen.getByText('Así funciona')).toBeInTheDocument();
    expect(screen.getByText('Evalúa')).toBeInTheDocument();
    expect(screen.getByText('Entrega')).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    renderPage();
    expect(
      screen.getByText('¿Listo para donar?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('¡Tu donación importa!')
    ).toBeInTheDocument();
  });
});
