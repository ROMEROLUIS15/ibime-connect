import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';

const TOTAL = 7;

// Embla falso: jsdom no tiene ResizeObserver/IntersectionObserver
const { fakeApi, resetFakeApi } = vi.hoisted(() => {
  let index = 0;
  let listeners: Array<() => void> = [];
  const emit = () => listeners.forEach((l) => l());
  const api = {
    on: vi.fn(),
    off: vi.fn(),
    selectedScrollSnap: vi.fn(),
    scrollTo: vi.fn(),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
    canScrollPrev: () => true,
    canScrollNext: () => true,
  };
  const reset = () => {
    index = 0;
    listeners = [];
    api.on.mockReset().mockImplementation((_evt: string, cb: () => void) => {
      listeners.push(cb);
      return api;
    });
    api.off.mockReset().mockImplementation((_evt: string, cb: () => void) => {
      listeners = listeners.filter((l) => l !== cb);
      return api;
    });
    api.selectedScrollSnap.mockReset().mockImplementation(() => index);
    api.scrollTo.mockReset().mockImplementation((i: number) => {
      index = i;
      emit();
    });
    api.scrollNext.mockReset().mockImplementation(() => {
      index = (index + 1) % 7;
      emit();
    });
    api.scrollPrev.mockReset().mockImplementation(() => {
      index = (index - 1 + 7) % 7;
      emit();
    });
  };
  return { fakeApi: api, resetFakeApi: reset };
});

vi.mock('embla-carousel-react', () => ({
  default: () => [vi.fn(), fakeApi],
}));

import { GallerySection } from './GallerySection';

const region = () =>
  screen.getByRole('region', { name: 'Espacios: fotos de nuestras instalaciones' });

const slides = () => within(region()).getAllByRole('group', { hidden: true });

const dot = (i: number) => screen.getByRole('button', { name: `Ir a la foto ${i + 1}` });

describe('GallerySection', () => {
  beforeEach(() => {
    resetFakeApi();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Contactos y Actividades son enlaces a sus secciones; Espacios es una región', () => {
    render(<GallerySection />);
    expect(screen.getByRole('link', { name: /Contactos/ })).toHaveAttribute('href', '#contacto');
    expect(screen.getByRole('link', { name: /Actividades/ })).toHaveAttribute('href', '#eventos');
    expect(region()).toBeInTheDocument();
  });

  it('renderiza las fotos con su alt, carga diferida y formato webp', () => {
    render(<GallerySection />);
    const imgs = within(region()).getAllByRole('img', { hidden: true });
    expect(imgs).toHaveLength(TOTAL);
    expect(imgs.map((img) => img.getAttribute('alt'))).toEqual([
      'Estanterías con libros junto a mesas de lectura; al fondo, usuarios leyendo en la sala contigua',
      'Sala de lectura amplia con mesas, sillas y estanterías de libros en las paredes',
      'Mesas de lectura rodeadas de estanterías, con libros en exhibición y un globo terráqueo',
      'Mesas de estudio con libros y papeles frente a estanterías bajo grandes ventanales',
      'Pasillo con una exposición de obras gráficas enmarcadas',
      'Sala con estanterías de madera, una mesa de trabajo en forma de L y puestos de computación',
      'Sala de computación con varios equipos, mesas de trabajo y estanterías',
    ]);
    imgs.forEach((img) => {
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img.getAttribute('src')).toMatch(/\.webp$/);
    });
  });

  it('solo expone la foto actual y actualiza el indicador al navegar', () => {
    render(<GallerySection />);
    const hidden = () => slides().filter((s) => s.getAttribute('aria-hidden') === 'true');
    expect(slides()).toHaveLength(TOTAL);
    expect(hidden()).toHaveLength(TOTAL - 1);
    expect(slides()[0]).not.toHaveAttribute('aria-hidden', 'true');
    expect(dot(0)).toHaveAttribute('aria-current', 'true');

    act(() => {
      fireEvent.click(dot(3));
    });

    expect(slides()[3]).not.toHaveAttribute('aria-hidden', 'true');
    expect(slides()[0]).toHaveAttribute('aria-hidden', 'true');
    expect(hidden()).toHaveLength(TOTAL - 1);
    expect(dot(3)).toHaveAttribute('aria-current', 'true');
    expect(dot(0)).not.toHaveAttribute('aria-current');
  });

  it('los botones anterior y siguiente navegan', () => {
    render(<GallerySection />);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    });
    expect(fakeApi.scrollNext).toHaveBeenCalledTimes(1);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Foto anterior' }));
    });
    expect(fakeApi.scrollPrev).toHaveBeenCalledTimes(1);
  });

  describe('autoplay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('avanza a los 3500 ms', () => {
      render(<GallerySection />);
      act(() => {
        vi.advanceTimersByTime(3499);
      });
      expect(fakeApi.scrollNext).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(fakeApi.scrollNext).toHaveBeenCalledTimes(1);
    });

    it('reinicia la cuenta atrás tras una navegación manual', () => {
      render(<GallerySection />);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      act(() => {
        fireEvent.click(dot(2));
      });
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(fakeApi.scrollNext).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(fakeApi.scrollNext).toHaveBeenCalledTimes(1);
    });

    it('se pausa con el mouse encima y se reanuda al salir', () => {
      render(<GallerySection />);
      act(() => {
        fireEvent.mouseEnter(region());
      });
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(fakeApi.scrollNext).not.toHaveBeenCalled();
      act(() => {
        fireEvent.mouseLeave(region());
      });
      act(() => {
        vi.advanceTimersByTime(3500);
      });
      expect(fakeApi.scrollNext).toHaveBeenCalledTimes(1);
    });

    it('se pausa con el foco dentro y se reanuda al perderlo', () => {
      render(<GallerySection />);
      act(() => {
        fireEvent.focus(dot(1));
      });
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(fakeApi.scrollNext).not.toHaveBeenCalled();
      act(() => {
        fireEvent.blur(dot(1), { relatedTarget: document.body });
      });
      act(() => {
        vi.advanceTimersByTime(3500);
      });
      expect(fakeApi.scrollNext).toHaveBeenCalledTimes(1);
    });

    it('no avanza con prefers-reduced-motion', () => {
      const original = window.matchMedia;
      window.matchMedia = ((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as typeof window.matchMedia;
      try {
        render(<GallerySection />);
        act(() => {
          vi.advanceTimersByTime(10000);
        });
        expect(fakeApi.scrollNext).not.toHaveBeenCalled();
      } finally {
        window.matchMedia = original;
      }
    });
  });
});
