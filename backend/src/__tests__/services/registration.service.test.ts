import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockEq: vi.fn(),
  mockSelect: vi.fn().mockReturnValue({ eq: vi.fn() }),
}));

vi.mock('../../config/supabase.config.js', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      insert: mocks.mockInsert,
      select: mocks.mockSelect,
    }),
  },
}));

import { RegistrationService } from '../../services/registration.service.js';

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
  });

  describe('register', () => {
    it('should map camelCase courseName to snake_case course_name before inserting', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      // Act
      await RegistrationService.register(REGISTRANT);

      // Assert — field mapping is part of the service contract
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

    it('should throw InternalServerError when Supabase insert returns an error', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: { message: 'Constraint failed' } });

      // Act & Assert
      await expect(RegistrationService.register(REGISTRANT)).rejects.toThrow(
        'Error al registering for course'
      );
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
        { course_name: 'Curso A', name: 'Juan', created_at: '2026-01-01' },
        { course_name: 'Curso B', name: 'Juan', created_at: '2026-02-01' },
      ];
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: expected, error: null });

      // Act
      const results = await RegistrationService.findByEmail('juan@test.com');

      // Assert
      expect(results).toEqual(expected);
      expect(mocks.mockSelect).toHaveBeenCalledWith('course_name, name, created_at');
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
