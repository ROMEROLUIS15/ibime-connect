import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { IBIMEAssistant } from './IBIMEAssistant';

/** Respuesta del backend que el test libera cuando quiere. */
function deferredChatResponse(answer: string) {
  let release: () => void = () => undefined;
  const pending = new Promise<Response>((resolve) => {
    release = () =>
      resolve({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({ answer, sources: [] }),
      } as unknown as Response);
  });
  return { pending, release: () => act(async () => release()) };
}

async function openAssistant(): Promise<HTMLInputElement> {
  render(<IBIMEAssistant />);
  fireEvent.click(screen.getByRole('button', { name: 'Abrir Asistente IA del IBIME' }));
  const input = await screen.findByRole('textbox', { name: 'Escribe tu consulta al asistente' });
  return input as HTMLInputElement;
}

describe('IBIMEAssistant — foco de la caja de texto', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    // jsdom no implementa scrollIntoView (el chat baja al último mensaje).
    Element.prototype.scrollIntoView = vi.fn();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mantiene el foco en la caja al enviar con Enter, mientras responde y después', async () => {
    const response = deferredChatResponse('Abrimos de lunes a viernes.');
    fetchMock.mockReturnValueOnce(response.pending);
    const input = await openAssistant();

    input.focus();
    fireEvent.change(input, { target: { value: '¿Cuál es el horario?' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByRole('status', { name: 'El asistente está escribiendo' })).toBeInTheDocument();
    expect(input).not.toBeDisabled();
    expect(input).toHaveFocus();

    await response.release();
    expect(await screen.findByText('Abrimos de lunes a viernes.')).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('devuelve el foco a la caja al enviar con el botón', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ answer: 'Hola, ¿en qué te ayudo?', sources: [] }),
    });
    const input = await openAssistant();

    fireEvent.change(input, { target: { value: 'Hola' } });
    const sendButton = screen.getByRole('button', { name: 'Enviar mensaje' });
    sendButton.focus();
    fireEvent.click(sendButton);

    expect(input).toHaveFocus();
    expect(await screen.findByText('Hola, ¿en qué te ayudo?')).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('deja escribir mientras responde, pero no envía otro mensaje hasta recibir la respuesta', async () => {
    const response = deferredChatResponse('Primera respuesta.');
    fetchMock.mockReturnValueOnce(response.pending);
    const input = await openAssistant();

    fireEvent.change(input, { target: { value: 'Primera pregunta' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await screen.findByRole('status', { name: 'El asistente está escribiendo' });

    fireEvent.change(input, { target: { value: 'Segunda pregunta' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input).toHaveValue('Segunda pregunta');
    expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await response.release();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeEnabled());
    expect(input).toHaveValue('Segunda pregunta');
  });
});

describe('IBIMEAssistant — nueva conversación', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ answer: 'Respuesta del asistente.', sources: [] }),
    }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Cuerpo de la llamada `n` al backend del chat. */
  function sentPayload(n: number): { sessionId?: string; conversationHistory: unknown[] } {
    const init = fetchMock.mock.calls[n][1] as RequestInit;
    return JSON.parse(init.body as string);
  }

  async function send(input: HTMLInputElement, text: string): Promise<void> {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() =>
      expect(screen.queryByRole('status', { name: 'El asistente está escribiendo' })).not.toBeInTheDocument(),
    );
  }

  it('borra los mensajes, vacía la caja y sigue con otra sesión sin historial', async () => {
    const input = await openAssistant();
    await send(input, 'Hola');
    await send(input, 'Mi correo es ana@test.com');
    // Dentro de una misma conversación la sesión no cambia.
    expect(sentPayload(1).sessionId).toBe(sentPayload(0).sessionId);

    fireEvent.change(input, { target: { value: 'borrador sin enviar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Nueva conversación' }));

    expect(screen.queryByText('Hola')).not.toBeInTheDocument();
    expect(screen.queryByText('Mi correo es ana@test.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Respuesta del asistente.')).not.toBeInTheDocument();
    expect(screen.getByText(/Soy el Asistente IA del IBIME/)).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();

    await send(input, 'Otra consulta');
    expect(sentPayload(2).sessionId).toBeDefined();
    expect(sentPayload(2).sessionId).not.toBe(sentPayload(0).sessionId);
    expect(sentPayload(2).conversationHistory).toEqual([]);
  });

  it('cerrar con la X solo minimiza: conserva la conversación y su sesión', async () => {
    const input = await openAssistant();
    await send(input, 'Hola');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar asistente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Asistente IA del IBIME' }));
    const reopened = (await screen.findByRole('textbox', {
      name: 'Escribe tu consulta al asistente',
    })) as HTMLInputElement;

    expect(screen.getByText('Hola')).toBeInTheDocument();
    await send(reopened, 'Sigo aquí');
    expect(sentPayload(1).sessionId).toBe(sentPayload(0).sessionId);
    expect(sentPayload(1).conversationHistory).toContainEqual({ role: 'user', text: 'Hola' });
  });

  it('no deja empezar otra conversación mientras el asistente responde', async () => {
    const response = deferredChatResponse('Respuesta tardía.');
    fetchMock.mockReturnValueOnce(response.pending);
    const input = await openAssistant();

    fireEvent.change(input, { target: { value: 'Hola' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await screen.findByRole('status', { name: 'El asistente está escribiendo' });
    expect(screen.getByRole('button', { name: 'Nueva conversación' })).toBeDisabled();

    await response.release();
    expect(await screen.findByText('Respuesta tardía.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nueva conversación' })).toBeEnabled();
  });
});

describe('IBIMEAssistant — respuesta del backend sin texto', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no rompe el chat si la respuesta llega sin `answer` y muestra un aviso', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({ response: 'Campo con otro nombre' }),
      }),
    );
    const input = await openAssistant();

    fireEvent.change(input, { target: { value: 'Hola' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('Respuesta vacía del servidor.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Asistente Virtual IBIME' })).toBeInTheDocument();
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });
});
