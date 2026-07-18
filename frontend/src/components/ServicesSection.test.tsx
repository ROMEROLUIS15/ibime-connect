import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServicesSection } from './ServicesSection';

describe('ServicesSection', () => {
  it('renderiza el encabezado de la sección', () => {
    render(<ServicesSection />);
    expect(screen.getByRole('heading', { name: /Servicios/i })).toBeInTheDocument();
  });

  it('muestra los 3 ejes de la red bibliotecaria', () => {
    render(<ServicesSection />);
    expect(screen.getByText('Eje Metropolitano')).toBeInTheDocument();
    expect(screen.getByText('Eje Mocotíes')).toBeInTheDocument();
    expect(screen.getByText('Eje Panamericano')).toBeInTheDocument();
  });

  it('mantiene las 3 tarjetas de distrito como placeholders', () => {
    render(<ServicesSection />);
    expect(screen.getByText('Distrito Oeste')).toBeInTheDocument();
    expect(screen.getByText('Distrito Central')).toBeInTheDocument();
    expect(screen.getByText('Distrito Periférico')).toBeInTheDocument();
  });

  it('renderiza una imagen de mapa por cada eje (3)', () => {
    render(<ServicesSection />);
    const mapas = screen.getAllByAltText(/^Mapa del Eje/i);
    expect(mapas).toHaveLength(3);
  });

  it('cada mapa de eje es un botón accesible que abre el lightbox', () => {
    render(<ServicesSection />);
    const botones = screen.getAllByRole('button', { name: /Ampliar el mapa del Eje/i });
    expect(botones).toHaveLength(3);
  });

  it('muestra las estadísticas reales de cada eje', () => {
    render(<ServicesSection />);
    expect(screen.getByText('17')).toBeInTheDocument(); // Metropolitano
    expect(screen.getByText('11')).toBeInTheDocument(); // Mocotíes
    expect(screen.getByText('12')).toBeInTheDocument(); // Panamericano
  });
});
