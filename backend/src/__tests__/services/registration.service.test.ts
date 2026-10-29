import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockEq: vi.fn(),
  mockSelect: vi.fn().mockReturnValue({ eq: vi.fn() }),
  mockLogError: vi.fn(),
  mockChild: vi.fn(),
}));

vi.mock('../../config/supabase.config.js', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      insert: mocks.mockInsert,
      select: mocks.mockSelect,
    }),
  },
}));

vi.mock('../../infrastructure/logger/index.js', () => ({
  logger: { error: mocks.mockLogError, child: mocks.mockChild },
  contextLogger: () => ({ error: mocks.mockLogError }),
}));

import { RegistrationService, ALREADY_REGISTERED } from '../../services/registration.service.js';
import { ConflictError } from '../../domain/errors/app-error.js';

// --- Fixtures -----------------------------------------------------------------

const REGISTRANT = {
  name: 'Maria Lopez',
  email: 'maria@test.com',
  phone: '+58 412 1234567',
  courseName: 'Alfabetizacion Digital',
};

// --- Suite --------------------------------------------------------------------

describe('RegistrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockEq.mockReset();
    mocks.mockChild.mockReturnValue({ error: mocks.mockLogError });
  });

  describe('register', () => {
    it('should map camelCase courseName to snake_case course_name and insert the row', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      // Act
      await RegistrationService.register(REGISTRANT);

      // Assert
      expect(mocks.mockInsert).toHaveBeenCalledWith({
        name: REGISTRANT.name,
        email: REGISTRANT.email,
        phone: REGISTRANT.phone,
        course_name: REGISTRANT.courseName,
      });
    });

    it('should return { success: true } when Supabase insert succeeds', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      // Act
      const result = await RegistrationService.register(REGISTRANT);

      // Assert
      expect(result).toEqual({ success: true });
    });

    it('should reject a duplicate registration with a 409 "ya estás inscrito", without logging a DB error', async () => {
      // La constraint UNIQUE(email, course_name) rechaza la fila repetida (23505).
      // Antes se ignoraba con upsert y se respondía éxito (caso real del 29/10/2026).
      mocks.mockInsert.mockResolvedValueOnce({
        error: { code: '23505', message: 'duplicate key value violates unique constraint "uq_course_registrations_email_course"' },
      });

      const error = await RegistrationService.register(REGISTRANT).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toMatchObject({ statusCode: 409, message: ALREADY_REGISTERED });
      expect(mocks.mockLogError).not.toHaveBeenCalled();
    });

    it('should throw InternalServerError when Supabase insert returns an error', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: { message: 'Constraint failed' } });

      // Act & Assert
      await expect(RegistrationService.register(REGISTRANT)).rejects.toThrow(
        'Error al registering for course'
      );
    });

    it('should not log the registrant personal data when the insert fails', async () => {
      // Arrange — Postgres repite la fila que falló en `details`
      mocks.mockInsert.mockResolvedValueOnce({
        error: {
          code: '23514',
          message: 'new row for relation "course_registrations" violates check constraint',
          details: `Failing row contains (${REGISTRANT.name}, ${REGISTRANT.email}, ${REGISTRANT.phone}).`,
        },
      });

      // Act
      await expect(RegistrationService.register(REGISTRANT, 'req-456')).rejects.toThrow(
        'Error al registering for course'
      );

      // Assert — el requestId va en el logger hijo y el texto como mensaje
      expect(mocks.mockChild).toHaveBeenCalledWith({ requestId: 'req-456' });
      expect(mocks.mockLogError).toHaveBeenCalledTimes(1);
      const [logged, message] = mocks.mockLogError.mock.calls[0];
      expect(message).toBe('Database error while registering for course');
      expect(logged.context).toEqual({ email: 'm***@test.com', courseName: REGISTRANT.courseName });
      const serialized = JSON.stringify(mocks.mockLogError.mock.calls);
      expect(serialized).not.toContain(REGISTRANT.name);
      expect(serialized).not.toContain(REGISTRANT.email);
      expect(serialized).not.toContain('1234567');
    });

    it('should resolve successfully when an optional requestId is provided', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      // Act & Assert
      await expect(
        RegistrationService.register(REGISTRANT, 'req-456')
      ).resolves.toEqual({ success: true });
    });
  });

  describe('findByEmail', () => {
    it('should return matching registrations for the given email', async () => {
      // Arrange
      const expected = [
        { course_name: 'Curso A', name: 'Juan', phone: '04121234567', created_at: '2026-01-01' },
        { course_name: 'Curso B', name: 'Juan', phone: '04121234567', created_at: '2026-02-01' },
      ];
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: expected, error: null });

      // Act
      const results = await RegistrationService.findByEmail('juan@test.com');

      // Assert
      expect(results).toEqual(expected);
      expect(mocks.mockSelect).toHaveBeenCalledWith('course_name, name, phone, created_at');
      expect(mocks.mockEq).toHaveBeenCalledWith('email', 'juan@test.com');
    });

    it('should return empty array when no registrations exist for the email', async () => {
      // Arrange
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: [], error: null });

      // Act
      const results = await RegistrationService.findByEmail('nuevo@test.com');

      // Assert
      expect(results).toEqual([]);
    });

    it('should return empty array when Supabase returns null data (no results)', async () => {
      // Arrange
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: null, error: null });

      // Act
      const results = await RegistrationService.findByEmail('test@test.com');

      // Assert
      expect(results).toEqual([]);
    });

    it('should throw InternalServerError when Supabase query returns an error', async () => {
      // Arrange
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: null, error: { message: 'Query failed' } });

      // Act & Assert
      await expect(RegistrationService.findByEmail('test@test.com')).rejects.toThrow(
        'Error al finding registrations by email'
      );
    });

    it('should log the email masked when the query fails', async () => {
      // Arrange — el chat consulta sin requestId, con el logger raíz
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: null, error: { message: 'Query failed' } });

      // Act
      await expect(RegistrationService.findByEmail('juan.perez@test.com')).rejects.toThrow(
        'Error al finding registrations by email'
      );

      // Assert
      const [logged, message] = mocks.mockLogError.mock.calls[0];
      expect(message).toBe('Database error while finding registrations by email');
      expect(logged.context).toEqual({ email: 'j***@test.com' });
      expect(JSON.stringify(mocks.mockLogError.mock.calls)).not.toContain('juan.perez@test.com');
    });

    it('should resolve successfully when an optional requestId is provided', async () => {
      // Arrange
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: [], error: null });

      // Act & Assert
      await expect(
        RegistrationService.findByEmail('test@test.com', 'req-789')
      ).resolves.toEqual([]);
    });
  });
});
