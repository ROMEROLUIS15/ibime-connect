import { describe, it, expect } from 'vitest';
import { checkResponseGuardrail } from '../../../modules/chat/response-guardrail.js';

describe('ResponseGuardrail', () => {
  describe('registration flow (DB-backed — should pass)', () => {
    it('should ALLOW "no se encontraron inscripciones" in registration flow', () => {
      const result = checkResponseGuardrail(
        'No se encontraron inscripciones para tu correo en nuestro sistema.',
        'registration'
      );
      expect(result.passed).toBe(true);
    });

    it('should ALLOW "no estás inscrito en ningún curso" in registration flow', () => {
      const result = checkResponseGuardrail(
        'Actualmente no estás inscrito en ningún curso.',
        'registration'
      );
      expect(result.passed).toBe(true);
    });

    it('should ALLOW positive registration results', () => {
      const result = checkResponseGuardrail(
        'Estás inscrito en los siguientes cursos: Taller de Python, Taller de Excel.',
        'registration'
      );
      expect(result.passed).toBe(true);
    });
  });

  describe('catalog flow (NOT DB-backed — should block user-state claims)', () => {
    it('should BLOCK "no estás inscrito" in catalog flow', () => {
      const result = checkResponseGuardrail(
        'No estás inscrito en ningún curso disponible.',
        'catalog'
      );
      expect(result.passed).toBe(false);
      expect(result.safeResponse).toContain('correo registrado');
    });

    it('should BLOCK "no se encontró tu inscripción" in catalog flow', () => {
      const result = checkResponseGuardrail(
        'No se encontró tu inscripción en nuestro sistema.',
        'catalog'
      );
      expect(result.passed).toBe(false);
    });

    it('should BLOCK "tu cuenta no" in catalog flow', () => {
      const result = checkResponseGuardrail(
        'Tu cuenta no tiene registros de cursos.',
        'catalog'
      );
      expect(result.passed).toBe(false);
    });

    it('should BLOCK "no estás registrado" in catalog flow', () => {
      const result = checkResponseGuardrail(
        'No estás registrado en nuestra base de datos.',
        'catalog'
      );
      expect(result.passed).toBe(false);
    });

    it('should BLOCK "no tienes inscripciones" in catalog flow', () => {
      const result = checkResponseGuardrail(
        'No tienes inscripciones activas.',
        'catalog'
      );
      expect(result.passed).toBe(false);
    });

    it('should ALLOW normal catalog responses', () => {
      const result = checkResponseGuardrail(
        'Ofrecemos talleres de Python, Excel y computación básica. Puedes inscribirte en nuestras sedes.',
        'catalog'
      );
      expect(result.passed).toBe(true);
    });

    it('should ALLOW responses about institutional info', () => {
      const result = checkResponseGuardrail(
        'El IBIME tiene más de 40 bibliotecas distribuidas en 6 distritos.',
        'catalog'
      );
      expect(result.passed).toBe(true);
    });
  });

  describe('general flow (NOT DB-backed — should block user-state claims)', () => {
    it('should BLOCK "el correo no está registrado" in general flow', () => {
      const result = checkResponseGuardrail(
        'El correo proporcionado no está registrado en nuestro sistema.',
        'general'
      );
      expect(result.passed).toBe(false);
    });

    it('should BLOCK "no apareces en la base de datos" in general flow', () => {
      const result = checkResponseGuardrail(
        'No apareces en la base de datos de inscripciones.',
        'general'
      );
      expect(result.passed).toBe(false);
    });

    it('should BLOCK "sin cuenta activa" in general flow', () => {
      const result = checkResponseGuardrail(
        'No tienes una cuenta activa en el sistema.',
        'general'
      );
      expect(result.passed).toBe(false);
    });

    it('should ALLOW normal general responses', () => {
      const result = checkResponseGuardrail(
        'Nuestro horario de atención es de lunes a viernes de 8:00am a 4:00pm.',
        'general'
      );
      expect(result.passed).toBe(true);
    });

    it('should ALLOW greeting responses', () => {
      const result = checkResponseGuardrail(
        '¡Hola! Soy el Asistente IBIME. ¿En qué puedo ayudarte?',
        'general'
      );
      expect(result.passed).toBe(true);
    });

    it('should ALLOW out-of-scope redirect', () => {
      const result = checkResponseGuardrail(
        'Solo puedo ayudarte con información sobre el IBIME, sus servicios y actividades.',
        'general'
      );
      expect(result.passed).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should BLOCK empty response', () => {
      const result = checkResponseGuardrail('', 'catalog');
      expect(result.passed).toBe(false);
      expect(result.safeResponse).toBeTruthy();
    });

    it('should return safe fallback when blocked', () => {
      const result = checkResponseGuardrail('No estás inscrito', 'catalog');
      expect(result.safeResponse).toBe(
        'Puedo ayudarte a consultar los cursos disponibles o tus inscripciones si proporcionas tu correo registrado.'
      );
    });
  });
});
