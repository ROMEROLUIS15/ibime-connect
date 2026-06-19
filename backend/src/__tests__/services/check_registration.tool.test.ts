import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckRegistrationTool } from '../../services/tools/check_registration.tool.js';
import { RegistrationService } from '../../services/registration.service.js';

vi.mock('../../services/registration.service.js', () => ({
  RegistrationService: {
    findByEmail: vi.fn(),
  },
}));

const findByEmail = RegistrationService.findByEmail as unknown as ReturnType<typeof vi.fn>;

describe('CheckRegistrationTool — ownership verification', () => {
  const tool = new CheckRegistrationTool();

  beforeEach(() => {
    findByEmail.mockReset();
  });

  it('should error when email is missing', async () => {
    const result = await tool.execute({ phone: '04121234567' });
    expect(result).toEqual({ error: 'Falta proveer el email.' });
    expect(findByEmail).not.toHaveBeenCalled();
  });

  it('should ask for phone when it is missing (never hits the DB)', async () => {
    const result = await tool.execute({ email: 'ana@mail.com' });
    expect(result).toEqual({ status: 'needs_phone' });
    expect(findByEmail).not.toHaveBeenCalled();
  });

  it('should reveal courses only when the phone matches the registration', async () => {
    findByEmail.mockResolvedValue([
      { course_name: 'Soldadura', phone: '+58 412-1234567' },
      { course_name: 'Electrónica', phone: '+58 412-1234567' },
    ]);

    const result = await tool.execute({ email: 'ana@mail.com', phone: '04121234567' });

    expect(result).toEqual({
      status: 'verified',
      cantidad_cursos: 2,
      cursos: ['Soldadura', 'Electrónica'],
    });
  });

  it('should return not_verified when the phone does not match', async () => {
    findByEmail.mockResolvedValue([{ course_name: 'Soldadura', phone: '04121234567' }]);

    const result = await tool.execute({ email: 'ana@mail.com', phone: '04129999999' });

    expect(result).toEqual({ status: 'not_verified' });
  });

  it('should return the SAME not_verified result for an unknown email (no existence leak)', async () => {
    findByEmail.mockResolvedValue([]);

    const result = await tool.execute({ email: 'desconocido@mail.com', phone: '04121234567' });

    expect(result).toEqual({ status: 'not_verified' });
  });

  it('should surface a technical error without leaking data', async () => {
    findByEmail.mockRejectedValue(new Error('DB down'));

    const result = await tool.execute({ email: 'ana@mail.com', phone: '04121234567' });

    expect(result).toEqual({ error: 'DB down' });
  });
});
