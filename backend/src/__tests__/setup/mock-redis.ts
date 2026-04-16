import { vi } from 'vitest';

// Mock de redisClient
export const mockRedisClient = {
  isOpen: true,
  get: vi.fn(),
  incr: vi.fn(),
  incrBy: vi.fn(),
  expire: vi.fn(),
};