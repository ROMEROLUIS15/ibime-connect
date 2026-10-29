import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ mockInsert: vi.fn() }));

vi.mock('../config/supabase.config.js', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({ insert: mocks.mockInsert }),
  },
}));

import app from '../app.js';

// --- Fixtures -----------------------------------------------------------------

const REGISTRATION = {
  name: 'Maria Lopez',
  email: 'maria@test.com',
  phone: '0412-1234567',
  courseName: 'Taller Método Braille: El Braille y la comunicación táctil',
};

const ALREADY_REGISTERED =
  'Ya estás inscrito en este curso. Si necesitas actualizar tus datos, llámanos al 0274-2623898.';

/** Error de Postgres por la restricción UNIQUE (email, course_name). */
const UNIQUE_VIOLATION = {
  code: '23505',
  message: 'duplicate key value violates unique constraint "uq_course_registrations_email_course"',
  details: `Key (email, course_name)=(${REGISTRATION.email}, ${REGISTRATION.courseName}) already exists.`,
};

// --- Suite --------------------------------------------------------------------

// Las dos rutas montadas (versionada y heredada) deben comportarse igual.
describe.each(['/api/v1/registrations', '/api/registrations'])('POST %s', (path) => {
  beforeEach(() => {
    mocks.mockInsert.mockReset();
  });

  it('inscribe a la persona y responde 201', async () => {
    mocks.mockInsert.mockResolvedValueOnce({ error: null });

    const response = await request(app).post(path).send(REGISTRATION);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Inscripción completada exitosamente' });
    expect(mocks.mockInsert).toHaveBeenCalledWith({
      name: REGISTRATION.name,
      email: REGISTRATION.email,
      phone: REGISTRATION.phone,
      course_name: REGISTRATION.courseName,
    });
  });

  it('responde 409 "Ya estás inscrito" si el correo ya está inscrito en ese curso, sin crear otra fila', async () => {
    // Caso real (29/10/2026): la segunda inscripción con el mismo correo en el
    // taller de Braille no se guardaba, pero se respondía "Inscripción completada".
    mocks.mockInsert.mockResolvedValueOnce({ error: UNIQUE_VIOLATION });

    const response = await request(app).post(path).send(REGISTRATION);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ text: ALREADY_REGISTERED });
    expect(mocks.mockInsert).toHaveBeenCalledTimes(1);
  });

  it('trata el mismo correo con mayúsculas como el mismo inscrito', async () => {
    mocks.mockInsert.mockResolvedValueOnce({ error: UNIQUE_VIOLATION });

    const response = await request(app)
      .post(path)
      .send({ ...REGISTRATION, email: 'Maria@Test.com' });

    expect(response.status).toBe(409);
    expect(mocks.mockInsert).toHaveBeenCalledWith(expect.objectContaining({ email: 'maria@test.com' }));
  });

  it('sigue respondiendo 500 genérico ante otros errores de la base', async () => {
    mocks.mockInsert.mockResolvedValueOnce({ error: { code: '08006', message: 'connection failure' } });

    const response = await request(app).post(path).send(REGISTRATION);

    expect(response.status).toBe(500);
    expect(response.body.text).not.toBe(ALREADY_REGISTERED);
  });
});
