/**
 * Tests for SentimentAnalyzerService
 *
 * Validates the 4 heuristic rules:
 *   1. Sustained uppercase (>70% of letters in caps, message >6 chars)
 *   2. High-signal frustration patterns (score +2 each)
 *   3. Medium-signal patterns (score +1 each)
 *   4. Punctuation abuse (3+ consecutive ! or ?)
 *
 * Frustration threshold: score >= 2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service.js';

describe('SentimentAnalyzerService', () => {
  let analyzer: SentimentAnalyzerService;

  beforeEach(() => {
    analyzer = new SentimentAnalyzerService();
  });

  // ─── Rule 1: Uppercase ratio ───────────────────────────────────────────────

  describe('Rule 1 — Sustained uppercase', () => {
    it('flags ALL-CAPS long message as frustrated (score +2)', () => {
      const result = analyzer.analyzeMessage('NO ENTIENDO NADA DE ESTO');
      expect(result.isFrustrated).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it('does not flag short ALL-CAPS message (<=6 chars)', () => {
      // "HOLA" is 4 chars — rule requires >6
      const result = analyzer.analyzeMessage('HOLA');
      expect(result.score).toBeLessThan(2); // caps rule doesn't fire
    });

    it('does not flag mixed-case polite message', () => {
      const result = analyzer.analyzeMessage('Buenos días, ¿cuáles son los horarios?');
      expect(result.isFrustrated).toBe(false);
    });
  });

  // ─── Rule 2: High-signal patterns ─────────────────────────────────────────

  describe('Rule 2 — High-signal frustration patterns (+2 each)', () => {
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

  // ─── Rule 3: Medium-signal patterns ───────────────────────────────────────

  describe('Rule 3 — Medium-signal patterns (+1 each, need combination)', () => {
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

  // ─── Rule 4: Punctuation abuse ─────────────────────────────────────────────

  describe('Rule 4 — Punctuation abuse (3+ consecutive !/?)', () => {
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
    it('caps + high-signal = high score', () => {
      const result = analyzer.analyzeMessage('NO FUNCIONA PARA NADA');
      // caps (+2) + "no funciona" (+2) = 4
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.isFrustrated).toBe(true);
    });

    it('caps + punctuation abuse = frustrated', () => {
      const result = analyzer.analyzeMessage('RESPONDAN POR FAVOR!!!');
      // caps (+2) + !!! (+2) + "por favor" (+1) = 5
      expect(result.isFrustrated).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(2);
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
