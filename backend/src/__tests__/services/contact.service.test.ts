import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockInsert: vi.fn(),
}));

vi.mock('../../config/supabase.config.js', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      insert: mocks.mockInsert,
    }),
  },
}));

import { ContactService } from '../../services/contact.service.js';

describe('ContactService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMessage', () => {
    const SAMPLE_DATA = {
      name: 'Juan Pérez',
      email: 'juan@test.com',
      message: 'Quiero información sobre los horarios.',
    };

    it('should call Supabase insert with correct data', async () => {
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      await ContactService.createMessage(SAMPLE_DATA);

      expect(mocks.mockInsert).toHaveBeenCalledWith({
        name: 'Juan Pérez',
        email: 'juan@test.com',
        message: 'Quiero información sobre los horarios.',
      });
    });

    it('should return success on successful insert', async () => {
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      const result = await ContactService.createMessage(SAMPLE_DATA);

      expect(result).toEqual({ success: true });
    });

    it('should throw InternalServerError on Supabase error', async () => {
      mocks.mockInsert.mockResolvedValueOnce({ error: { message: 'Connection failed' } });

      await expect(ContactService.createMessage(SAMPLE_DATA)).rejects.toThrow('Error al inserting contact message');
    });

    it('should accept requestId for context logging', async () => {
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      await ContactService.createMessage(SAMPLE_DATA, 'req-123');

      expect(mocks.mockInsert).toHaveBeenCalled();
    });

    it('should work without requestId', async () => {
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      await expect(ContactService.createMessage(SAMPLE_DATA)).resolves.toEqual({ success: true });
    });
  });
});
