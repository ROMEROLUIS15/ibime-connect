import { describe, it, expect } from 'vitest';
import { normalizePhone, phonesMatch } from '../../utils/phone.util.js';

describe('normalizePhone', () => {
  it('should strip all non-digit characters', () => {
    expect(normalizePhone('+58 412-123 4567')).toBe('584121234567');
  });

  it('should return an empty string for empty or nullish input', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(undefined as unknown as string)).toBe('');
  });
});

describe('phonesMatch', () => {
  it('should match the same number written in different formats', () => {
    expect(phonesMatch('+58 412-1234567', '04121234567')).toBe(true);
    expect(phonesMatch('0412 123 4567', '(412) 1234567')).toBe(true);
  });

  it('should match ignoring the country-code prefix', () => {
    expect(phonesMatch('584121234567', '4121234567')).toBe(true);
  });

  it('should not match different numbers', () => {
    expect(phonesMatch('04121234567', '04129999999')).toBe(false);
  });

  it('should reject inputs with fewer than 7 significant digits', () => {
    expect(phonesMatch('12345', '12345')).toBe(false);
    expect(phonesMatch('', '04121234567')).toBe(false);
  });
});
