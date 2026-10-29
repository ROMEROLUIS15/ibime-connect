import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

// Sede del IBIME: Sector Glorias Patrias, Calle 1 Los Eucaliptos, entre Av. Gonzalo
// Picón y Tulio Febres. Coordenadas de la ficha del instituto en Google Maps.
const SEDE = '8.5890769,-71.1529978';

describe('Footer — mapa de ubicación', () => {
  it('muestra el mapa con el marcador en las coordenadas de la sede', () => {
    render(<Footer />);

    const map = screen.getByTitle('Google Maps IBIME');
    const src = new URL(map.getAttribute('src') ?? '');
    expect(src.hostname).toBe('maps.google.com');
    expect(src.searchParams.get('q')).toBe(SEDE);
    expect(src.searchParams.get('output')).toBe('embed');
  });

  it('al hacer clic abre Google Maps en el mismo punto, en otra pestaña', () => {
    render(<Footer />);

    const link = screen.getByTitle('Ver en Google Maps');
    const href = new URL(link.getAttribute('href') ?? '');
    expect(href.searchParams.get('query')).toBe(SEDE);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
