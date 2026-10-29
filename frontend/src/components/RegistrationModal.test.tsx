import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegistrationModal } from './RegistrationModal';
import { Toaster } from '@/components/ui/toaster';

const EVENT = {
  id: 1,
  image: '',
  title: 'Taller Método Braille: El Braille y la comunicación táctil',
  date: '13 oct – 6 nov 2026',
  location: 'Biblioteca Pública Central',
  description: 'Taller',
};

const ALREADY_REGISTERED =
  'Ya estás inscrito en este curso. Si necesitas actualizar tus datos, llámanos al 0274-2623898.';

function respond(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status < 400,
      status,
      headers: { get: () => null },
      json: async () => body,
    }),
  );
}

function submitForm(): void {
  render(
    <>
      <RegistrationModal event={EVENT} onClose={vi.fn()} />
      <Toaster />
    </>,
  );
  fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Maria Lopez' } });
  fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'maria@test.com' } });
  fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '0412-1234567' } });
  fireEvent.click(screen.getByRole('button', { name: /Confirmar Inscripción/i }));
}

describe('RegistrationModal — respuesta del backend', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('si el correo ya está inscrito (409), avisa "Ya estás inscrito" sin mostrarlo como error', async () => {
    respond(409, { text: ALREADY_REGISTERED });

    submitForm();

    // El estado de los avisos es global: se espera el aviso y se vuelve a buscar.
    await screen.findByText('Ya estás inscrito');
    expect(screen.getByText('Ya estás inscrito')).toBeInTheDocument();
    expect(screen.getByText(ALREADY_REGISTERED)).toBeInTheDocument();
    expect(screen.queryByText('Error al inscribirse')).not.toBeInTheDocument();
    expect(screen.queryByText(/Inscripción exitosa/i)).not.toBeInTheDocument();
  });

  it('ante otro error sigue mostrando "Error al inscribirse"', async () => {
    respond(500, { text: 'Lo sentimos, ha ocurrido un error interno.' });

    submitForm();

    // El estado de los avisos es global: se espera el aviso y se vuelve a buscar.
    await screen.findByText('Error al inscribirse');
    expect(screen.getByText('Error al inscribirse')).toBeInTheDocument();
    expect(screen.queryByText('Ya estás inscrito')).not.toBeInTheDocument();
  });

  it('si la inscripción es nueva, confirma "¡Inscripción exitosa!"', async () => {
    respond(201, { message: 'Inscripción completada exitosamente' });

    submitForm();

    // El estado de los avisos es global: se espera el aviso y se vuelve a buscar.
    await screen.findByText('¡Inscripción exitosa!');
    expect(screen.getByText('¡Inscripción exitosa!')).toBeInTheDocument();
  });
});
