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
