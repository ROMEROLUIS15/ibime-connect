import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IAssistantPort } from '../../../domain/ports/AssistantPort.js';
import type { ChatResponse, ApiResult } from '@shared/types/domain';
import { AskAssistantUseCase, type AskAssistantInput } from '../../../application/use-cases/AskAssistantUseCase.js';

describe('AskAssistantUseCase', () => {
  let mockPort: IAssistantPort;
  let useCase: AskAssistantUseCase;

  beforeEach(() => {
    mockPort = {
      generateAnswer: vi.fn(),
    };
    useCase = new AskAssistantUseCase(mockPort);
  });

  describe('execute', () => {
    const SAMPLE_INPUT: AskAssistantInput = {
      userMessage: '¿A qué hora abren?',
      conversationHistory: [
        { role: 'user' as const, text: 'Hola' },
        { role: 'assistant' as const, text: '¡Hola! ¿En qué puedo ayudarte?' },
      ],
    };

    it('should call assistantPort.generateAnswer with correct input', async () => {
      (mockPort.generateAnswer as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: { answer: 'Abrimos a las 8am', sources: [] },
      });

      await useCase.execute(SAMPLE_INPUT);

      expect(mockPort.generateAnswer).toHaveBeenCalledWith({
        userMessage: '¿A qué hora abren?',
        conversationHistory: SAMPLE_INPUT.conversationHistory,
        context: [],
      });
    });

    it('should pass empty context array', async () => {
      (mockPort.generateAnswer as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: { answer: 'Respuesta', sources: [] },
      });

      await useCase.execute(SAMPLE_INPUT);

      const callArg = (mockPort.generateAnswer as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArg.context).toEqual([]);
    });

    it('should return ApiResult from port on success', async () => {
      const expected: ApiResult<ChatResponse> = {
        ok: true,
        data: { answer: 'Abrimos a las 8am', sources: [{ id: '1', category: 'horario', title: 'Horario', content: '', similarity: 0.9 }] },
      };
      (mockPort.generateAnswer as ReturnType<typeof vi.fn>).mockResolvedValue(expected);

      const result = await useCase.execute(SAMPLE_INPUT);

      expect(result).toEqual(expected);
    });

    it('should return error ApiResult when port fails', async () => {
      (mockPort.generateAnswer as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        error: 'Servidor no disponible',
      });

      const result = await useCase.execute(SAMPLE_INPUT);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Servidor no disponible');
      }
    });

    it('should handle empty conversation history', async () => {
      (mockPort.generateAnswer as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: { answer: 'Hola', sources: [] },
      });

      await useCase.execute({
        userMessage: 'Hola',
        conversationHistory: [],
      });

      expect(mockPort.generateAnswer).toHaveBeenCalledWith(
        expect.objectContaining({ conversationHistory: [] })
      );
    });

    it('should handle very long conversation history', async () => {
      (mockPort.generateAnswer as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: { answer: 'OK', sources: [] },
      });

      const longHistory = Array.from({ length: 100 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant' as const,
        text: `Message ${i}`,
      }));

      await useCase.execute({
        userMessage: 'Test',
        conversationHistory: longHistory,
      });

      expect(mockPort.generateAnswer).toHaveBeenCalledWith(
        expect.objectContaining({ conversationHistory: longHistory })
      );
    });

    it('should rethrow if port throws', async () => {
      (mockPort.generateAnswer as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(useCase.execute(SAMPLE_INPUT)).rejects.toThrow('Network error');
    });
  });
});
