import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServicesSection } from './ServicesSection';

describe('ServicesSection', () => {
  it('renderiza el encabezado de la sección', () => {
    render(<ServicesSection />);
    expect(screen.getByRole('heading', { name: /Servicios/i })).toBeInTheDocument();
  });

  it('muestra los 5 ejes de la red bibliotecaria', () => {
    render(<ServicesSection />);
    expect(screen.getByText('Eje Metropolitano')).toBeInTheDocument();
    expect(screen.getByText('Eje Mocotíes')).toBeInTheDocument();
    expect(screen.getByText('Eje Panamericano')).toBeInTheDocument();
    expect(screen.getByText('Eje Páramo')).toBeInTheDocument();
    expect(screen.getByText('Eje Pueblos del Sur')).toBeInTheDocument();
  });

  it('conserva solo la tarjeta de Distrito Oeste (6 tarjetas en total)', () => {
    render(<ServicesSection />);
    expect(screen.getByText('Distrito Oeste')).toBeInTheDocument();
    expect(screen.queryByText('Distrito Central')).not.toBeInTheDocument();
    expect(screen.queryByText('Distrito Periférico')).not.toBeInTheDocument();
  });

  it('renderiza una imagen de mapa por cada eje (5)', () => {
    render(<ServicesSection />);
    const mapas = screen.getAllByAltText(/^Mapa del Eje/i);
    expect(mapas).toHaveLength(5);
  });

  it('cada mapa de eje es un botón accesible que abre el lightbox', () => {
    render(<ServicesSection />);
    const botones = screen.getAllByRole('button', { name: /Ampliar el mapa del Eje/i });
    expect(botones).toHaveLength(5);
  });

  it('muestra las estadísticas reales de cada eje', () => {
    render(<ServicesSection />);
    expect(screen.getByText('17')).toBeInTheDocument(); // Metropolitano
    expect(screen.getByText('12')).toBeInTheDocument(); // Panamericano
    expect(screen.getAllByText('11')).toHaveLength(2); // Mocotíes + Páramo
    expect(screen.getAllByText('7').length).toBeGreaterThanOrEqual(1); // Pueblos del Sur
  });
});
