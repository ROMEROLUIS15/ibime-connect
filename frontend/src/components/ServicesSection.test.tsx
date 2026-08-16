import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServicesSection } from './ServicesSection';
import { AXES, TOTAL_LIBRARIES } from '@/data/library-network';

describe('ServicesSection', () => {
  it('renderiza el encabezado de la sección', () => {
    render(<ServicesSection />);
    expect(screen.getByRole('heading', { name: /Servicios/i })).toBeInTheDocument();
  });

  it('muestra los 5 ejes de la red bibliotecaria', () => {
    render(<ServicesSection />);
    expect(screen.getByRole('heading', { name: 'Eje Metropolitano' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Eje Mocotíes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Eje Panamericano' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Eje Páramo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Eje Pueblo del Sur' })).toBeInTheDocument();
  });

  it('conserva solo la tarjeta de En Construcción (6 tarjetas en total)', () => {
    render(<ServicesSection />);
    expect(screen.getAllByText('En Construcción').length).toBeGreaterThanOrEqual(1);
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

  it('el conteo mostrado por eje coincide con el directorio transcrito del mapa', () => {
    render(<ServicesSection />);

    // Los totales impresos en los mapas: 17 / 11 / 12 / 11 / 07.
    const esperados = [17, 11, 12, 11, 7];
    expect(AXES.map((axis) => axis.libraries.length)).toEqual(esperados);

    // Cada cifra aparece al menos una vez en las tarjetas de la sección.
    for (const total of new Set(esperados)) {
      expect(screen.getAllByText(String(total)).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('solo el Eje Metropolitano declara punto de lectura (el único rotulado)', () => {
    render(<ServicesSection />);
    const conPuntos = AXES.filter((axis) => axis.readingPoints != null);
    expect(conPuntos).toHaveLength(1);
    expect(conPuntos[0].name).toBe('Eje Metropolitano');
    expect(screen.getAllByText('Puntos de lectura')).toHaveLength(1);
  });

  it('cada biblioteca del directorio tiene nombre y municipio para su ficha', () => {
    // La ficha individual muestra nombre + ubicación (localidad opcional y
    // municipio): sin municipio el modal abriría con la ubicación vacía.
    for (const axis of AXES) {
      for (const lib of axis.libraries) {
        expect(lib.name.trim().length).toBeGreaterThan(0);
        expect(lib.municipality.trim().length).toBeGreaterThan(0);
        expect(axis.municipalities).toContain(lib.municipality);
      }
    }
  });

  it('no publica direcciones de prueba ni bibliotecas numeradas de relleno', () => {
    for (const axis of AXES) {
      for (const lib of axis.libraries) {
        expect(lib.name).not.toMatch(/prueba|Biblioteca \d+/i);
        expect(lib.locality ?? '').not.toMatch(/prueba/i);
        expect(lib.municipality).not.toMatch(/prueba/i);
      }
    }
    expect(TOTAL_LIBRARIES).toBe(58);
  });
});
