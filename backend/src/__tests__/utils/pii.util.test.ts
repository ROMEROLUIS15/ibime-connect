import { describe, it, expect } from 'vitest';
import { maskEmail } from '../../utils/pii.util.js';

describe('maskEmail', () => {
  it('should keep the first character and the domain', () => {
    expect(maskEmail('juan.perez@gmail.com')).toBe('j***@gmail.com');
  });

  it('should mask single-character local parts fully', () => {
    expect(maskEmail('a@x.com')).toBe('*@x.com');
  });

  it('should return *** for invalid input', () => {
    expect(maskEmail('not-an-email')).toBe('***');
    expect(maskEmail('')).toBe('***');
  });
});
