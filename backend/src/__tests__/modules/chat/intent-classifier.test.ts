import { describe, it, expect } from 'vitest';
import { classifyIntent } from '../../../modules/chat/intent-classifier.js';

describe('IntentClassifier', () => {
  describe('registration intent', () => {
    it('should detect "mi curso"', () => {
      expect(classifyIntent('¿En qué curso estoy inscrito?')).toEqual({
        intent: 'registration',
        confidence: 'high',
      });
    });

    it('should detect "mis inscripciones"', () => {
      expect(classifyIntent('¿Cuáles son mis inscripciones?')).toEqual({
        intent: 'registration',
        confidence: 'high',
      });
    });

    it('should detect "estoy inscrito"', () => {
      expect(classifyIntent('¿Estoy inscrito en algún curso?')).toEqual({
        intent: 'registration',
        confidence: 'high',
      });
    });

    it('should detect "mis cursos"', () => {
      expect(classifyIntent('Quiero ver mis cursos')).toEqual({
        intent: 'registration',
        confidence: 'high',
      });
    });

    it('should detect "verificar mi inscripción"', () => {
      expect(classifyIntent('Cómo puedo verificar mi inscripción')).toEqual({
        intent: 'registration',
        confidence: 'high',
      });
    });

    it('should detect "me inscribí"', () => {
      expect(classifyIntent('¿Me inscribí en el taller de computación?')).toEqual({
        intent: 'registration',
        confidence: 'high',
      });
    });

    it('should detect "puedo ver mis cursos"', () => {
      expect(classifyIntent('Puedo ver mis cursos')).toEqual({
        intent: 'registration',
        confidence: 'high',
      });
    });

    it('should detect "dónde veo mis registros"', () => {
      expect(classifyIntent('Dónde veo mis registros')).toEqual({
        intent: 'registration',
        confidence: 'high',
      });
    });
  });

  describe('catalog intent', () => {
    it('should detect "qué cursos tienen"', () => {
      expect(classifyIntent('¿Qué cursos tienen?')).toEqual({
        intent: 'catalog',
        confidence: 'high',
      });
    });

    it('should detect "qué talleres hay"', () => {
      expect(classifyIntent('¿Qué talleres hay disponibles?')).toEqual({
        intent: 'catalog',
        confidence: 'high',
      });
    });

    it('should detect "cursos de computación"', () => {
      expect(classifyIntent('Cursos de computación')).toEqual({
        intent: 'catalog',
        confidence: 'high',
      });
    });

    it('should detect "catálogo"', () => {
      expect(classifyIntent('¿Dónde puedo ver el catálogo?')).toEqual({
        intent: 'catalog',
        confidence: 'high',
      });
    });

    it('should detect "cómo me inscribo"', () => {
      expect(classifyIntent('¿Cómo me inscribo en un curso?')).toEqual({
        intent: 'catalog',
        confidence: 'high',
      });
    });

    it('should detect "puedo inscribirme"', () => {
      expect(classifyIntent('¿Puedo inscribirme en algún taller?')).toEqual({
        intent: 'catalog',
        confidence: 'high',
      });
    });

    it('should detect "taller de..."', () => {
      expect(classifyIntent('Taller de programación para principiantes')).toEqual({
        intent: 'catalog',
        confidence: 'high',
      });
    });
  });

  describe('general intent (fallback)', () => {
    it('should classify greetings as general', () => {
      expect(classifyIntent('Hola')).toEqual({
        intent: 'general',
        confidence: 'low',
      });
    });

    it('should classify institutional questions as general', () => {
      expect(classifyIntent('¿Cuál es el horario de atención?')).toEqual({
        intent: 'general',
        confidence: 'low',
      });
    });

    it('should classify location questions as general', () => {
      expect(classifyIntent('¿Dónde queda la biblioteca?')).toEqual({
        intent: 'general',
        confidence: 'low',
      });
    });

    it('should classify out-of-scope as general', () => {
      expect(classifyIntent('¿Quién ganó el mundial?')).toEqual({
        intent: 'general',
        confidence: 'low',
      });
    });

    it('should classify phone number questions as general', () => {
      expect(classifyIntent('¿Cuál es el teléfono del IBIME?')).toEqual({
        intent: 'general',
        confidence: 'low',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = classifyIntent('');
      expect(result.intent).toBe('general');
    });

    it('should handle whitespace-only string', () => {
      const result = classifyIntent('   ');
      expect(result.intent).toBe('general');
    });

    it('should handle mixed case', () => {
      expect(classifyIntent('¿QUÉ CURSOS TIENEN?')).toEqual({
        intent: 'catalog',
        confidence: 'high',
      });
    });

    it('should handle accents variations', () => {
      expect(classifyIntent('¿Cuales son mis inscripciones?')).toEqual({
        intent: 'registration',
        confidence: 'high',
      });
    });

    it('should NOT confuse "cómo me inscribo" (catalog) with "mis cursos" (registration)', () => {
      // "cómo me inscribo" is about future action → catalog
      const result1 = classifyIntent('¿Cómo me inscribo?');
      expect(result1.intent).toBe('catalog');

      // "mis cursos" is about current state → registration
      const result2 = classifyIntent('¿Cuáles son mis cursos?');
      expect(result2.intent).toBe('registration');
    });
  });
});
