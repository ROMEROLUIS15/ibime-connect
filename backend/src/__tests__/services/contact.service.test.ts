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

// --- Fixtures -----------------------------------------------------------------

const CONTACT_MESSAGE = {
  name: 'Juan Perez',
  email: 'juan@test.com',
  message: 'Quiero informacion sobre los horarios.',
};

// --- Suite --------------------------------------------------------------------

describe('ContactService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should persist all contact fields to Supabase without transformation', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      // Act
      await ContactService.createMessage(CONTACT_MESSAGE);

      // Assert
      expect(mocks.mockInsert).toHaveBeenCalledWith({
        name: CONTACT_MESSAGE.name,
        email: CONTACT_MESSAGE.email,
        message: CONTACT_MESSAGE.message,
      });
    });

    it('should return { success: true } when Supabase insert succeeds', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      // Act
      const result = await ContactService.createMessage(CONTACT_MESSAGE);

      // Assert
      expect(result).toEqual({ success: true });
    });

    it('should throw InternalServerError when Supabase insert returns an error', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: { message: 'Connection failed' } });

      // Act & Assert
      await expect(
        ContactService.createMessage(CONTACT_MESSAGE)
      ).rejects.toThrow('Error al inserting contact message');
    });

    it('should call insert once even when an optional requestId is provided', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      // Act
      await ContactService.createMessage(CONTACT_MESSAGE, 'req-123');

      // Assert
      expect(mocks.mockInsert).toHaveBeenCalledTimes(1);
    });

    it('should resolve successfully without a requestId', async () => {
      // Arrange
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      // Act & Assert
      await expect(ContactService.createMessage(CONTACT_MESSAGE)).resolves.toEqual({
        success: true,
      });
    });
  });
});
