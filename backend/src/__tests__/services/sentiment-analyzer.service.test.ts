/**
 * Tests for SentimentAnalyzerService
 *
 * Validates the 3 heuristic rules:
 *   1. High-signal frustration patterns (score +2 each)
 *   2. Medium-signal patterns (score +1 each)
 *   3. Punctuation abuse (3+ consecutive ! or ?)
 *
 * Frustration threshold: score >= 2. Letter case never changes the result.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service.js';

describe('SentimentAnalyzerService', () => {
  let analyzer: SentimentAnalyzerService;

  beforeEach(() => {
    analyzer = new SentimentAnalyzerService();
  });

  // ─── Rule 1: High-signal patterns ─────────────────────────────────────────

  describe('Rule 1 — High-signal frustration patterns (+2 each)', () => {
    it.each([
      ['pésimo servicio', 'pésimo'],
      ['esto es un asco', 'es un asco'],
      ['es horrible la atención', 'horrible'],
      ['terrible experiencia', 'terrible'],
      ['mal servicio recibido', 'mal servicio'],
      ['estoy harto de esperar', 'harto'],
      ['no funciona el sistema', 'no funciona'],
      ['no sirve para nada', 'no sirve'],
    ])('"%s" → frustrated (matches high-signal: %s)', (message) => {
      const result = analyzer.analyzeMessage(message);
      expect(result.isFrustrated).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Rule 2: Medium-signal patterns ───────────────────────────────────────

  describe('Rule 2 — Medium-signal patterns (+1 each, need combination)', () => {
    it('single "ayuda" alone does NOT trigger frustration (score 1, threshold 2)', () => {
      const result = analyzer.analyzeMessage('necesito ayuda');
      expect(result.isFrustrated).toBe(false);
      expect(result.score).toBe(1);
    });

    it('single "error" alone does NOT trigger frustration', () => {
      const result = analyzer.analyzeMessage('hay un error');
      expect(result.isFrustrated).toBe(false);
      expect(result.score).toBe(1);
    });

    it('"error" + "no entiendo" combination triggers frustration (score 2)', () => {
      const result = analyzer.analyzeMessage('hay un error y no entiendo qué pasó');
      expect(result.isFrustrated).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it('"humano" + "ayuda" combination triggers frustration', () => {
      const result = analyzer.analyzeMessage('quiero hablar con un humano, necesito ayuda');
      expect(result.isFrustrated).toBe(true);
    });

    it('"urgente" + "problema" combination triggers frustration', () => {
      const result = analyzer.analyzeMessage('tengo un problema urgente');
      expect(result.isFrustrated).toBe(true);
    });
  });

  // ─── Rule 3: Punctuation abuse ─────────────────────────────────────────────

  describe('Rule 3 — Punctuation abuse (3+ consecutive !/?)', () => {
    it('"!!!" triggers frustration alone (score +2)', () => {
      const result = analyzer.analyzeMessage('¿Cuándo responden???');
      expect(result.isFrustrated).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it('"!!!" triggers frustration alone', () => {
      const result = analyzer.analyzeMessage('Por favor ayúdenme!!!');
      expect(result.isFrustrated).toBe(true);
    });

    it('double "!!" does NOT trigger punctuation rule (needs 3+)', () => {
      const result = analyzer.analyzeMessage('hola!!');
      // score from !! = 0 (needs 3+). score from "hola" = 0.
      expect(result.score).toBe(0);
      expect(result.isFrustrated).toBe(false);
    });
  });

  // ─── Combinations ──────────────────────────────────────────────────────────

  describe('Combined signals', () => {
    it('an ALL-CAPS complaint is still detected by its words', () => {
      const result = analyzer.analyzeMessage('NO FUNCIONA PARA NADA');
      // "no funciona" (+2); the uppercase itself adds nothing
      expect(result.score).toBe(2);
      expect(result.isFrustrated).toBe(true);
    });

    it('an accented ALL-CAPS complaint is detected too', () => {
      const result = analyzer.analyzeMessage('PÉSIMO SERVICIO');
      // "pésimo" (+2) matches "PÉSIMO"; the uppercase adds nothing
      expect(result.score).toBe(2);
      expect(result.isFrustrated).toBe(true);
    });

    it('punctuation abuse + medium signal = frustrated', () => {
      const result = analyzer.analyzeMessage('RESPONDAN POR FAVOR!!!');
      // !!! (+2) + "por favor" (+1) = 3
      expect(result.score).toBe(3);
      expect(result.isFrustrated).toBe(true);
    });
  });

  // ─── Letter case ──────────────────────────────────────────────────────────

  describe('Letter case does not change the result', () => {
    // Muchas personas escriben todo en mayúsculas sin estar molestas: el tono de
    // la respuesta no debe depender de cómo se escribe, solo de lo que se dice.
    const variantes = (texto: string) => [texto.toLowerCase(), texto.toUpperCase(), texto];

    it.each([
      ['¿Cuál es el horario de atención?'],
      ['¿Dónde puedo buscar un libro en el catálogo en línea?'],
      ['Quiero ver mis inscripciones, mi correo es Juan.Perez@Gmail.com'],
      ['No funciona el sistema'],
      ['Pésimo servicio'],
      ['Hay un error y no entiendo qué pasó'],
      ['Respondan por favor!!!'],
    ])('"%s" → same score in lowercase, UPPERCASE and mixed case', (texto) => {
      const [minusculas, mayusculas, mixta] = variantes(texto).map((t) => analyzer.analyzeMessage(t));
      expect(mayusculas).toEqual(minusculas);
      expect(mixta).toEqual(minusculas);
    });

    it('an ALL-CAPS neutral question is not flagged as frustrated', () => {
      const result = analyzer.analyzeMessage('¿CUÁL ES EL HORARIO DE ATENCIÓN?');
      expect(result.isFrustrated).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  // ─── Safe messages ──────────────────────────────────────────────────────────

  describe('Safe/neutral messages (should NOT be frustrated)', () => {
    it.each([
      ['¿Cuáles son los horarios de la biblioteca?'],
      ['Me gustaría inscribirme en un curso'],
      ['Buenos días'],
      ['Gracias por la información'],
      ['¿Tienen catálogo en línea?'],
      ['lueduar15@gmail.com'],
    ])('"%s" → not frustrated', (message) => {
      const result = analyzer.analyzeMessage(message);
      expect(result.isFrustrated).toBe(false);
    });
  });
});
