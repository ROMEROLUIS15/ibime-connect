import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { ScrollToTop } from './ScrollToTop';

/** Botón que navega a otra ruta para provocar un cambio de location. */
const Navigator = () => {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/otra-ruta')}>ir</button>;
};

describe('ScrollToTop', () => {
  beforeEach(() => {
    // jsdom no implementa scrollTo; lo mockeamos para poder aseverar.
    window.scrollTo = vi.fn();
  });

  it('desplaza al inicio al montar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('desplaza al inicio en cada cambio de ruta', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollToTop />
        <Navigator />
      </MemoryRouter>
    );
    expect(window.scrollTo).toHaveBeenCalledTimes(1); // montaje

    fireEvent.click(screen.getByText('ir'));
    expect(window.scrollTo).toHaveBeenCalledTimes(2); // tras cambiar de ruta
  });

  it('no renderiza ningún elemento en el DOM', () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });
});
