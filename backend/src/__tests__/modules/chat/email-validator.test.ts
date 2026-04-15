import { describe, it, expect } from 'vitest';
import { validateEmail } from '../../../modules/chat/email-validator.js';

describe('EmailValidator', () => {
  describe('valid emails', () => {
    it('should accept standard email', () => {
      const result = validateEmail('user@example.com');
      expect(result.valid).toBe(true);
      expect(result.email).toBe('user@example.com');
    });

    it('should accept email with subdomain', () => {
      const result = validateEmail('user@sub.example.com');
      expect(result.valid).toBe(true);
      expect(result.email).toBe('user@sub.example.com');
    });

    it('should accept email with dots and plus', () => {
      const result = validateEmail('user.name+tag@example.co.uk');
      expect(result.valid).toBe(true);
    });

    it('should normalize to lowercase', () => {
      const result = validateEmail('User@Example.COM');
      expect(result.valid).toBe(true);
      expect(result.email).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const result = validateEmail('  user@example.com  ');
      expect(result.valid).toBe(true);
      expect(result.email).toBe('user@example.com');
    });
  });

  describe('invalid emails', () => {
    it('should reject undefined', () => {
      const result = validateEmail(undefined);
      expect(result.valid).toBe(false);
      expect(result.email).toBeNull();
    });

    it('should reject null', () => {
      const result = validateEmail(null);
      expect(result.valid).toBe(false);
      expect(result.email).toBeNull();
    });

    it('should reject empty string', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.email).toBeNull();
    });

    it('should reject whitespace-only string', () => {
      const result = validateEmail('   ');
      expect(result.valid).toBe(false);
      expect(result.email).toBeNull();
    });

    it('should reject plain text without @', () => {
      const result = validateEmail('usuario');
      expect(result.valid).toBe(false);
    });

    it('should reject missing domain', () => {
      const result = validateEmail('user@');
      expect(result.valid).toBe(false);
    });

    it('should reject missing local part', () => {
      const result = validateEmail('@example.com');
      expect(result.valid).toBe(false);
    });

    it('should reject missing TLD', () => {
      const result = validateEmail('user@example');
      expect(result.valid).toBe(false);
    });

    it('should reject missing TLD dot', () => {
      const result = validateEmail('user@example.c');
      expect(result.valid).toBe(false);
    });

    it('should reject just an @', () => {
      const result = validateEmail('@');
      expect(result.valid).toBe(false);
    });
  });

  describe('reason messages', () => {
    it('should provide reason for missing email', () => {
      const result = validateEmail(undefined);
      expect(result.reason).toContain('unauthenticated');
    });

    it('should provide reason for invalid format', () => {
      const result = validateEmail('not-an-email');
      expect(result.reason).toContain('Invalid email format');
    });
  });
});
