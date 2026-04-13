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

describe('RegistrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockEq.mockReset();
  });

  const SAMPLE_DATA = {
    name: 'María López',
    email: 'maria@test.com',
    phone: '+58 412 1234567',
    courseName: 'Alfabetización Digital',
  };

  describe('register', () => {
    it('should call Supabase insert with correct data including course_name', async () => {
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      await RegistrationService.register(SAMPLE_DATA);

      expect(mocks.mockInsert).toHaveBeenCalledWith({
        name: 'María López',
        email: 'maria@test.com',
        phone: '+58 412 1234567',
        course_name: 'Alfabetización Digital',
      });
    });

    it('should return success on successful insert', async () => {
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      const result = await RegistrationService.register(SAMPLE_DATA);

      expect(result).toEqual({ success: true });
    });

    it('should throw on Supabase error', async () => {
      mocks.mockInsert.mockResolvedValueOnce({ error: { message: 'Constraint failed' } });

      await expect(RegistrationService.register(SAMPLE_DATA)).rejects.toThrow('Error al registering for course');
    });

    it('should accept requestId for context logging', async () => {
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      await expect(RegistrationService.register(SAMPLE_DATA, 'req-456')).resolves.toEqual({ success: true });
    });
  });

  describe('findByEmail', () => {
    it('should return registrations for given email', async () => {
      const sampleData = [
        { course_name: 'Curso A', name: 'Juan', created_at: '2026-01-01' },
        { course_name: 'Curso B', name: 'Juan', created_at: '2026-02-01' },
      ];
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: sampleData, error: null });

      const results = await RegistrationService.findByEmail('juan@test.com');

      expect(results).toEqual(sampleData);
      expect(mocks.mockSelect).toHaveBeenCalledWith('course_name, name, created_at');
      expect(mocks.mockEq).toHaveBeenCalledWith('email', 'juan@test.com');
    });

    it('should return empty array when no registrations found', async () => {
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: [], error: null });

      const results = await RegistrationService.findByEmail('nuevo@test.com');

      expect(results).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: null, error: null });

      const results = await RegistrationService.findByEmail('test@test.com');

      expect(results).toEqual([]);
    });

    it('should throw on Supabase error', async () => {
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: null, error: { message: 'Query failed' } });

      await expect(RegistrationService.findByEmail('test@test.com')).rejects.toThrow(
        'Error al finding registrations by email'
      );
    });

    it('should accept requestId for context logging', async () => {
      mocks.mockSelect.mockReturnValueOnce({ eq: mocks.mockEq });
      mocks.mockEq.mockResolvedValueOnce({ data: [], error: null });

      await expect(RegistrationService.findByEmail('test@test.com', 'req-789')).resolves.toEqual([]);
    });
  });
});
