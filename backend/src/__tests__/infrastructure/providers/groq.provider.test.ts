import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LLMMessage, ITool } from '../../../domain/interfaces/index.js';

// --- Module-level mocks (hoisted before imports) ------------------------------

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

vi.mock('../../../config/env.config.js', () => ({
  ENV: { GROQ_API_KEY: 'test-groq-key' },
}));

vi.mock('../../../infrastructure/providers/groq-rate-limiter.js', () => ({
  groqRateLimiter: {
    canProceed: vi.fn().mockResolvedValue({ ok: true, waitMs: 0 }),
    recordUsage: vi.fn(),
  },
}));

import { GroqProvider } from '../../../infrastructure/providers/groq.provider.js';

// --- Fixtures -----------------------------------------------------------------

const SAMPLE_MESSAGES: LLMMessage[] = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello' },
];

/** Builds a minimal valid Groq API response, merging any field overrides. */
function buildGroqResponse(messageOverrides: Partial<Record<string, unknown>> = {}) {
  return {
    choices: [{
      message: {
        content: 'Hello! How can I help you?',
        tool_calls: null,
        ...messageOverrides,
      },
    }],
    usage: { total_tokens: 50 },
    model: 'llama-3.1-8b-instant',
  };
}

// --- Suite --------------------------------------------------------------------

describe('GroqProvider', () => {
  let provider: GroqProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GroqProvider();
  });

  describe('generateAnswer — successful responses', () => {
    it('should return content, tokensUsed, model, and null toolCalls from a plain text response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => buildGroqResponse() });

      // Act
      const result = await provider.generateAnswer(SAMPLE_MESSAGES);

      // Assert
      expect(result.content).toBe('Hello! How can I help you?');
      expect(result.tokensUsed).toBe(50);
      expect(result.model).toBe('llama-3.1-8b-instant');
      expect(result.toolCalls).toBeNull();
    });

    it('should return non-null toolCalls and null content when the LLM requests a tool call', async () => {
      // Arrange
      const toolCalls = [{ id: 'tc1', function: { name: 'check_registration', arguments: '{}' } }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => buildGroqResponse({ content: null, tool_calls: toolCalls }),
      });

      // Act
      const result = await provider.generateAnswer(SAMPLE_MESSAGES);

      // Assert
      expect(result.content).toBeNull();
      expect(result.toolCalls).toEqual(toolCalls);
    });

    it('should default tokensUsed to 0 when the usage object is absent from the response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Hi' } }] }),
      });

      // Act
      const result = await provider.generateAnswer(SAMPLE_MESSAGES);

      // Assert
      expect(result.tokensUsed).toBe(0);
    });

    it('should return 0 tokensUsed when usage.total_tokens is zero', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...buildGroqResponse(), usage: { total_tokens: 0 } }),
      });

      // Act
      const result = await provider.generateAnswer(SAMPLE_MESSAGES);

      // Assert
      expect(result.tokensUsed).toBe(0);
    });
  });

  describe('generateAnswer — request payload construction', () => {
    it('should include the Authorization header with the configured API key', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => buildGroqResponse() });

      // Act
      await provider.generateAnswer(SAMPLE_MESSAGES);

      // Assert
      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders['Authorization']).toBe('Bearer test-groq-key');
    });

    it('should use default temperature=0.6 and maxTokens=350 when no options are passed', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => buildGroqResponse() });

      // Act
      await provider.generateAnswer(SAMPLE_MESSAGES);

      // Assert
      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.temperature).toBe(0.6);
      expect(payload.max_tokens).toBe(350);
    });

    it('should override temperature and maxTokens when custom options are provided', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => buildGroqResponse() });

      // Act
      await provider.generateAnswer(SAMPLE_MESSAGES, { temperature: 0.2, maxTokens: 200 });

      // Assert
      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.temperature).toBe(0.2);
      expect(payload.max_tokens).toBe(200);
    });

    it('should omit the tools field from the payload when no tools are provided', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => buildGroqResponse() });

      // Act
      await provider.generateAnswer(SAMPLE_MESSAGES);

      // Assert
      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.tools).toBeUndefined();
    });

    it('should include serialized tools and tool_choice="auto" in the payload when tools are provided', async () => {
      // Arrange
      const tools: ITool[] = [{
        name: 'check_registration',
        description: 'Check user registrations',
        parameters: { type: 'object', properties: { email: { type: 'string' } } },
        execute: async () => ({}),
      }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => buildGroqResponse({ content: null, tool_calls: [{ id: 'tc1' }] }),
      });

      // Act
      await provider.generateAnswer(SAMPLE_MESSAGES, { tools });

      // Assert
      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.tools).toHaveLength(1);
      expect(payload.tools[0].function.name).toBe('check_registration');
      expect(payload.tool_choice).toBe('auto');
    });

    it('should correctly remap tool_calls and tool_call_id fields in multi-turn tool messages', async () => {
      // Arrange
      const messagesWithTool: LLMMessage[] = [
        { role: 'user', content: 'Check my registrations' },
        {
          role: 'assistant',
          content: '',
          tool_calls: [{ id: 'tc1', type: 'function' as const, function: { name: 'check', arguments: '{}' } }],
        },
        { role: 'tool', content: 'No registrations found', name: 'check', tool_call_id: 'tc1' },
      ];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => buildGroqResponse() });

      // Act
      await provider.generateAnswer(messagesWithTool);

      // Assert
      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.messages[1].tool_calls).toBeDefined();
      expect(payload.messages[2].tool_call_id).toBe('tc1');
      expect(payload.messages[2].name).toBe('check');
    });
  });

  describe('generateAnswer — error handling', () => {
    it('should throw "Empty response from Groq" when content is an empty string', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => buildGroqResponse({ content: '' }),
      });

      // Act & Assert
      await expect(provider.generateAnswer(SAMPLE_MESSAGES)).rejects.toThrow('Empty response from Groq');
    });

    it('should throw "Empty response from Groq" when both content and toolCalls are null', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => buildGroqResponse({ content: null, tool_calls: null }),
      });

      // Act & Assert
      await expect(provider.generateAnswer(SAMPLE_MESSAGES)).rejects.toThrow('Empty response from Groq');
    });

    it('should throw "Groq API Error (400)" when the API responds with a non-OK HTTP status', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'Bad Request' });

      // Act & Assert
      await expect(provider.generateAnswer(SAMPLE_MESSAGES)).rejects.toThrow('Groq API Error (400)');
    });

    it('should throw "Groq request timeout (25s)" when fetch is aborted', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));

      // Act & Assert
      await expect(provider.generateAnswer(SAMPLE_MESSAGES)).rejects.toThrow('Groq request timeout (25s)');
    });

    it('should propagate the original error message on a network failure', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(provider.generateAnswer(SAMPLE_MESSAGES)).rejects.toThrow('Network error');
    });
  });
});
