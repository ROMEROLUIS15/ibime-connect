import { describe, it, expect } from 'vitest';
import { applyResponsePolicy } from '../../../modules/chat/response-policy.js';

// ─── Constants mirrored from response-policy.ts ─────────────────────────────
const MIN_ANSWER_LENGTH = 10;
const MAX_ANSWER_LENGTH = 1500;

const FALLBACKS = {
  registration: '¡Claro que sí! Con mucho gusto te ayudo a verificar tus inscripciones. Por favor, indícame tu correo electrónico registrado para buscarlo en nuestro sistema.',
  catalog: 'Actualmente no tengo información detallada sobre ese tema en nuestra base de conocimientos. Te invito a contactarnos al teléfono 0274-2623898 o al correo contactoibime@gmail.com para recibir información actualizada sobre nuestros cursos y talleres.',
  general: 'No tengo información específica sobre ese tema. Puedes contactarnos al teléfono 0274-2623898 o al correo contactoibime@gmail.com, o visitar nuestras redes sociales @ibimegob para más información.',
};

const HALLUCINATION_FALLBACK = 'Puedo ayudarte a consultar los cursos disponibles o tus inscripciones si proporcionas tu correo registrado.';

// ─── Structural validation ───────────────────────────────────────────────────
describe('ResponsePolicy — structural validation', () => {
  describe('empty / blank response', () => {
    it('should reject empty string and return registration fallback', () => {
      const result = applyResponsePolicy('', 'registration', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(FALLBACKS.registration);
      expect(result.reason).toMatch(/empty/i);
    });

    it('should reject whitespace-only response and return catalog fallback', () => {
      const result = applyResponsePolicy('   ', 'catalog', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(FALLBACKS.catalog);
    });

    it('should reject empty response and return general fallback', () => {
      const result = applyResponsePolicy('', 'general', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(FALLBACKS.general);
    });
  });

  describe('too short response', () => {
    it(`should reject response shorter than ${MIN_ANSWER_LENGTH} chars`, () => {
      const short = 'Ok';
      expect(short.length).toBeLessThan(MIN_ANSWER_LENGTH);
      const result = applyResponsePolicy(short, 'catalog', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(FALLBACKS.catalog);
      expect(result.reason).toMatch(/short/i);
    });

    it('should reject single-word response', () => {
      const result = applyResponsePolicy('Hola', 'general', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(FALLBACKS.general);
    });
  });

  describe('too long response', () => {
    it(`should reject response longer than ${MAX_ANSWER_LENGTH} chars`, () => {
      const tooLong = 'a'.repeat(MAX_ANSWER_LENGTH + 1);
      const result = applyResponsePolicy(tooLong, 'general', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(FALLBACKS.general);
      expect(result.reason).toMatch(/long/i);
    });

    it(`should accept response at exactly ${MAX_ANSWER_LENGTH} chars`, () => {
      // Use a safe string (no hallucination patterns) of exactly MAX length
      const exactMax = 'El IBIME ofrece servicios bibliotecarios. '.repeat(36).substring(0, MAX_ANSWER_LENGTH);
      const result = applyResponsePolicy(exactMax, 'general', false);
      expect(result.valid).toBe(true);
    });
  });

  describe('valid length response', () => {
    it('should accept a normal response and trim whitespace', () => {
      const answer = '  El IBIME tiene más de 40 bibliotecas en Mérida.  ';
      const result = applyResponsePolicy(answer, 'general', false);
      expect(result.valid).toBe(true);
      expect(result.answer).toBe(answer.trim());
      expect(result.reason).toBeNull();
    });
  });
});

// ─── Guardrail: hallucination blocking ──────────────────────────────────────
describe('ResponsePolicy — hallucination blocking (isDbBacked=false)', () => {
  describe('catalog flow', () => {
    it('should block "no estás inscrito" in catalog flow', () => {
      const result = applyResponsePolicy('No estás inscrito en ningún curso disponible.', 'catalog', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(HALLUCINATION_FALLBACK);
    });

    it('should block "tu cuenta no tiene" in catalog flow', () => {
      const result = applyResponsePolicy('Tu cuenta no tiene inscripciones activas.', 'catalog', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(HALLUCINATION_FALLBACK);
    });

    it('should block "el correo no está registrado" in catalog flow', () => {
      const result = applyResponsePolicy('El correo que proporcionaste no está registrado en el sistema.', 'catalog', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(HALLUCINATION_FALLBACK);
    });

    it('should ALLOW legitimate catalog responses', () => {
      const result = applyResponsePolicy('Ofrecemos talleres de Python, Excel y computación básica en nuestras sedes.', 'catalog', false);
      expect(result.valid).toBe(true);
    });
  });

  describe('general flow', () => {
    it('should block "no apareces en la base de datos" in general flow', () => {
      const result = applyResponsePolicy('No apareces en la base de datos de inscripciones del sistema.', 'general', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(HALLUCINATION_FALLBACK);
    });

    it('should block "no estás registrado" in general flow', () => {
      const result = applyResponsePolicy('Lo siento, no estás registrado en nuestra base de datos.', 'general', false);
      expect(result.valid).toBe(false);
      expect(result.answer).toBe(HALLUCINATION_FALLBACK);
    });

    it('should ALLOW legitimate general responses', () => {
      const result = applyResponsePolicy('El horario de atención es de lunes a viernes de 8:00 a.m. a 4:00 p.m.', 'general', false);
      expect(result.valid).toBe(true);
    });
  });
});

// ─── DB-backed bypass (registration flow) ───────────────────────────────────
describe('ResponsePolicy — DB-backed bypass (isDbBacked=true)', () => {
  it('should ALLOW "no se encontraron inscripciones" when isDbBacked=true', () => {
    // This comes from the DB — it is NOT a hallucination
    const result = applyResponsePolicy(
      'No se encontraron inscripciones registradas para este correo en el sistema.',
      'registration',
      true
    );
    expect(result.valid).toBe(true);
  });

  it('should ALLOW "no estás inscrito" message when isDbBacked=true', () => {
    const result = applyResponsePolicy(
      'Actualmente no estás inscrito en ningún curso según nuestra base de datos.',
      'registration',
      true
    );
    expect(result.valid).toBe(true);
  });

  it('should ALLOW positive registration results when isDbBacked=true', () => {
    const result = applyResponsePolicy(
      'Estás inscrito en los siguientes cursos: Taller de Python, Alfabetización Digital.',
      'registration',
      true
    );
    expect(result.valid).toBe(true);
    expect(result.answer).toContain('Taller de Python');
  });

  it('should BLOCK if isDbBacked=false even in registration flow (edge case)', () => {
    // Defensive: if registration flow somehow called without DB data
    const result = applyResponsePolicy(
      'No estás registrado en nuestro sistema de inscripciones.',
      'registration',
      false
    );
    expect(result.valid).toBe(false);
    expect(result.answer).toBe(HALLUCINATION_FALLBACK);
  });
});

// ─── Intent-specific fallback correctness ────────────────────────────────────
describe('ResponsePolicy — intent-specific fallbacks', () => {
  it('registration fallback contains "correo electrónico"', () => {
    const result = applyResponsePolicy('', 'registration', false);
    expect(result.answer).toContain('correo electrónico');
  });

  it('catalog fallback contains contact info', () => {
    const result = applyResponsePolicy('', 'catalog', false);
    expect(result.answer).toContain('0274-2623898');
    expect(result.answer).toContain('contactoibime@gmail.com');
  });

  it('general fallback contains contact info and social media', () => {
    const result = applyResponsePolicy('', 'general', false);
    expect(result.answer).toContain('0274-2623898');
    expect(result.answer).toContain('@ibimegob');
  });

  it('hallucination fallback is different from intent fallbacks', () => {
    // Guardrail fallback is intentionally neutral (not intent-specific)
    const hallucinationResult = applyResponsePolicy(
      'No estás inscrito en ningún curso activo según los registros del sistema.',
      'catalog',
      false
    );
    expect(hallucinationResult.answer).toBe(HALLUCINATION_FALLBACK);
    expect(hallucinationResult.answer).not.toBe(FALLBACKS.catalog);
  });
});

// ─── Integration: full valid response path ───────────────────────────────────
describe('ResponsePolicy — full valid response path', () => {
  it('should return valid=true, trimmed answer, reason=null for a clean response', () => {
    const answer = '  El IBIME ofrece talleres de computación gratuitos para la comunidad merideña.  ';
    const result = applyResponsePolicy(answer, 'catalog', false);
    expect(result.valid).toBe(true);
    expect(result.answer).toBe(answer.trim());
    expect(result.reason).toBeNull();
  });

  it('valid result always has a non-empty answer', () => {
    const result = applyResponsePolicy(
      'Los horarios son de lunes a viernes de 8am a 4pm en el IBIME Mérida.',
      'general',
      false
    );
    expect(result.valid).toBe(true);
    expect(result.answer.length).toBeGreaterThan(0);
  });
});
