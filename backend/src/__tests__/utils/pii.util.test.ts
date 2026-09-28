import { describe, it, expect } from 'vitest';
import { maskEmail, maskPiiInText } from '../../utils/pii.util.js';

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

describe('maskPiiInText', () => {
  it('should mask every email inside free text', () => {
    expect(maskPiiInText('Escribir a ana.perez@test.com o a luis@x.com')).toBe(
      'Escribir a a***@test.com o a l***@x.com'
    );
  });

  it('should mask emails inside a JSON error body and keep the rest', () => {
    const body = JSON.stringify({
      error: {
        code: 'tool_use_failed',
        failed_generation: '{"name":"consultar_inscripciones","arguments":{"email":"ana.perez@test.com"}}',
      },
    });
    const masked = maskPiiInText(body);
    expect(masked).not.toContain('ana.perez@test.com');
    expect(masked).toContain('a***@test.com');
    expect(masked).toContain('tool_use_failed');
  });

  it('should mask phone numbers keeping only the last two digits', () => {
    expect(maskPiiInText('tel 0412-123-4567 y +58 412 7654321')).toBe('tel ***67 y ***21');
  });

  it('should mask two phones written one after the other', () => {
    expect(maskPiiInText('04121234567 04127654321')).not.toMatch(/\d{7}/);
  });

  it('should leave text without personal data unchanged', () => {
    const text = 'Rate limit reached: 8000 tokens per minute, retry in 30s';
    expect(maskPiiInText(text)).toBe(text);
  });

  it('should return an empty string unchanged', () => {
    expect(maskPiiInText('')).toBe('');
  });
});
