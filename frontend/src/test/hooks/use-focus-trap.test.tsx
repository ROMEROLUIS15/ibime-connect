import { describe, it, expect } from 'vitest';
import { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFocusTrap } from '../../hooks/use-focus-trap';

function Trap() {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);
  return (
    <div ref={ref}>
      <button disabled>Deshabilitado</button>
      <input aria-label="Primero" />
      <button>Último</button>
      <button disabled>Deshabilitado al final</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('should give the focus to the first element that is not disabled', () => {
    render(<Trap />);
    expect(screen.getByLabelText('Primero')).toHaveFocus();
  });

  it('should wrap from the last enabled element to the first one, skipping disabled ones', () => {
    render(<Trap />);
    const last = screen.getByRole('button', { name: 'Último' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(screen.getByLabelText('Primero')).toHaveFocus();
  });

  it('should wrap backwards from the first enabled element to the last one', () => {
    render(<Trap />);
    const first = screen.getByLabelText('Primero');
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus();
  });
});
