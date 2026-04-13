/**
 * src/components/IBIMEAssistant.tsx
 *
 * Virtual assistant widget for IBIME — Clean Architecture version.
 *
 * Pipeline:
 *   user message
 *     → AskAssistantUseCase.execute()
 *       → IKnowledgePort.retrieveContext() [OpenAI embedding + pgvector search]
 *       → IAssistantPort.generateAnswer()  [Gemini via Supabase Edge Function]
 *     → display response with sources
 *
 * The component depends ONLY on the Use Case — infrastructure is injected.
 * TypeScript strict throughout. No `any`, no implicit nulls.
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type JSX,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { useFloatingButtonsTheme } from '@/hooks/useFloatingButtonsTheme';
import { useFocusTrap, useEscapeKey } from '@/hooks/use-focus-trap';
import { AskAssistantUseCase, type AskAssistantInput } from '@/application/use-cases/AskAssistantUseCase';
import { BackendAssistantAdapter } from '@/infrastructure/adapters/BackendAssistantAdapter';
import type { ChatMessage, KnowledgeMatch } from '@shared/types/domain';

// ─── Assets ───────────────────────────────────────────────────────────────────

const OWL_AVATAR = '/buho-robot.jpeg';

// ─── Constants ───────────────────────────────────────────────────────────────

const WELCOME_MESSAGE: ChatMessage = {
  id: 0,
  role: 'assistant',
  text: '¡Hola! Soy el Asistente IA del IBIME 🤖\nPuedo ayudarte con horarios, catálogo Koha, eventos, servicios y más. ¿En qué te ayudo hoy?',
  timestamp: new Date(),
  sources: [],
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SourceBadgesProps {
  readonly sources: readonly KnowledgeMatch[];
}

function SourceBadges({ sources }: SourceBadgesProps): JSX.Element | null {
  if (sources.length === 0) return null;
  return (
    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {sources.map((s) => (
        <span
          key={s.id}
          style={{
            fontSize: 9,
            padding: '1px 6px',
            borderRadius: 8,
            background: 'rgba(21,128,61,0.12)',
            color: '#15803d',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {s.category}
        </span>
      ))}
    </div>
  );
}

const SendIcon = ({ color = 'white' }: { readonly color?: string }): JSX.Element => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

interface MessageBubbleProps {
  readonly message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps): JSX.Element {
  const isUser = message.role === 'user';
  return (
    <div style={{ display: 'flex', alignItems: isUser ? 'flex-end' : 'flex-end', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 7 }}>
      {/* Avatar del búho para mensajes del asistente */}
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '8px',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #15803d, #166534)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={OWL_AVATAR}
            alt="Búho"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
          />
        </div>
      )}
      <div
        style={{
          maxWidth: '78%',
          padding: '8px 12px',
          borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
          background: isUser ? 'linear-gradient(135deg, #15803d, #166534)' : '#ffffff',
          color: isUser ? 'white' : '#1e293b',
          fontSize: 12.5,
          lineHeight: 1.5,
          boxShadow: isUser
            ? '0 2px 8px rgba(21,128,61,0.3)'
            : '0 1px 4px rgba(0,0,0,0.08)',
          border: !isUser ? '1px solid rgba(0,0,0,0.05)' : 'none',
          whiteSpace: 'pre-line' as const,
        }}
      >
        <p style={{ margin: 0 }}>{message.text}</p>
        {!isUser && message.sources !== undefined && (
          <SourceBadges sources={message.sources} />
        )}
        <p
          style={{
            margin: '3px 0 0',
            fontSize: 9.5,
            opacity: 0.5,
            textAlign: 'right',
          }}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator(): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '8px',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #15803d, #166534)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={OWL_AVATAR}
          alt="Búho"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
        />
      </div>
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '14px 14px 14px 3px',
          background: '#ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}
        aria-label="El asistente está escribiendo"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#15803d',
              display: 'inline-block',
              animation: `ibime-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function IBIMEAssistant(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { isDark } = useFloatingButtonsTheme();

  // Focus trap + Escape key handler
  useFocusTrap(dialogRef, isOpen);
  useEscapeKey(() => setIsOpen(false), isOpen);

  // ── Dependency Injection via useMemo ─────────────────────────────────────
  const askAssistant = useMemo<AskAssistantUseCase>(() => {
    const assistantAdapter = new BackendAssistantAdapter();
    return new AskAssistantUseCase(assistantAdapter);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  const handleSendMessage = useCallback(async (): Promise<void> => {
    const trimmed = inputValue.trim();
    if (trimmed === '' || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Build conversation history (last 10 messages, excluding welcome)
      const history = messages
        .slice(1)
        .slice(-10)
        .map((m) => ({ role: m.role, text: m.text }));

      const input: AskAssistantInput = {
        userMessage: trimmed,
        conversationHistory: history,
      };

      const result = await askAssistant.execute(input);

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        timestamp: new Date(),
        text: result.ok
          ? result.data.answer
          : result.error,
        sources: result.ok ? result.data.sources : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      console.error('[IBIMEAssistant] Unhandled error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: 'assistant',
          text: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
          timestamp: new Date(),
          sources: [],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, messages, askAssistant]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  // ── Dynamic styles ──────────────────────────────────────────────────────
  const ringColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(21,128,61,0.4)';
  const canSend = inputValue.trim() !== '' && !isTyping;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px',
          zIndex: 9999,
        }}
      >
        {/* ── Ventana de Chat ── */}
        {isOpen && (
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Asistente Virtual IBIME"
            style={{
              width: 'calc(100vw - 48px)',
              maxWidth: '360px',
              height: '480px',
              maxHeight: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#f8fafc',
              boxShadow: '0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)',
              border: '1px solid rgba(0,0,0,0.06)',
              animation: 'ibime-slide-up 0.25s cubic-bezier(.4,0,.2,1)',
            }}
          >
            {/* ── Header con gradiente ── */}
            <div
              style={{
                background: 'linear-gradient(135deg, #15803d 0%, #166534 60%, #14532d 100%)',
                padding: '14px 14px 10px',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decoración de fondo */}
              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -30,
                  left: '30%',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                {/* Avatar + Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Avatar del búho IA */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.18)',
                      border: '1.5px solid rgba(255,255,255,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    <img
                      src={OWL_AVATAR}
                      alt="Búho IA"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p
                        style={{
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 13.5,
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        Asistente IBIME
                      </p>
                      {/* Badge IA */}
                      <span
                        style={{
                          fontSize: 8.5,
                          fontWeight: 700,
                          color: '#15803d',
                          background: 'rgba(255,255,255,0.92)',
                          padding: '1.5px 6px',
                          borderRadius: 8,
                          letterSpacing: '0.05em',
                        }}
                      >
                        IA
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#4ade80',
                          boxShadow: '0 0 6px #4ade80',
                          display: 'inline-block',
                          animation: 'ibime-pulse-green 2s ease-in-out infinite',
                        }}
                        aria-hidden="true"
                      />
                      <span style={{ color: '#bbf7d0', fontSize: 10.5, fontWeight: 500 }}>En línea</span>
                    </div>
                  </div>
                </div>

                {/* Cerrar */}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar asistente"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ color: 'white', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>✕</span>
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div
              role="log"
              aria-live="polite"
              aria-label="Historial de conversación"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: '#f8fafc',
                scrollbarWidth: 'thin',
                scrollbarColor: '#15803d22 transparent',
              }}
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <div
              style={{
                padding: '10px 12px 12px',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu consulta..."
                  disabled={isTyping}
                  maxLength={500}
                  aria-label="Escribe tu consulta al asistente"
                  style={{
                    flex: 1,
                    height: 38,
                    padding: '0 12px',
                    borderRadius: 12,
                    border: '1.5px solid #e2e8f0',
                    fontSize: 12.5,
                    color: '#1e293b',
                    background: '#f8fafc',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#15803d';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                />
                <button
                  onClick={() => void handleSendMessage()}
                  disabled={!canSend}
                  aria-label="Enviar mensaje"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border: 'none',
                    flexShrink: 0,
                    cursor: canSend ? 'pointer' : 'not-allowed',
                    background: canSend
                      ? 'linear-gradient(135deg, #15803d, #166534)'
                      : '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: canSend ? '0 2px 8px rgba(21,128,61,0.4)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <SendIcon color={canSend ? 'white' : '#86efac'} />
                </button>
              </div>
              <p style={{ fontSize: 9.5, color: '#94a3b8', margin: '6px 0 0', textAlign: 'center' }}>
                Asistente IA del IBIME · Powered by Gemini
              </p>
            </div>
          </div>
        )}

        {/* ── Botón trigger con anillo pulsante y búho ── */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Anillo pulsante exterior */}
          {!isOpen && (
            <div
              style={{
                position: 'absolute',
                width: 45,
                height: 45,
                borderRadius: '50%',
                background: ringColor,
                animation: 'ibime-ring-pulse 2s ease-out infinite',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Etiqueta flotante */}
          {!isOpen && (
            <div
              className="ibime-floating-label"
              style={{
                background: isDark ? '#ffffff' : '#15803d',
                color: isDark ? '#1e293b' : '#ffffff',
                border: isDark ? '2px solid #e2e8f0' : '2px solid #14532d',
              }}
            >
              Asistente IA
            </div>
          )}

          <button
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? 'Cerrar asistente virtual IBIME' : 'Abrir Asistente IA del IBIME'}
            aria-expanded={isOpen}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 500ms ease, transform 200ms ease',
              background: 'white',
              border: '3px solid #15803d',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              position: 'relative',
              zIndex: 1,
              overflow: isOpen ? 'hidden' : 'visible',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            {isOpen ? (
              <span style={{ color: '#15803d', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>✕</span>
            ) : (
              <img
                src={OWL_AVATAR}
                alt="Asistente IA"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  transform: 'scale(1.15) translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
            )}
          </button>
        </div>
      </div>

      <style>{`
        .ibime-floating-label {
          position: absolute;
          top: -42px;
          left: 50%;
          white-space: nowrap;
          background: #ffffff;
          color: #1e293b;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 8px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          border: 1px solid #e2e8f0;
          animation: ibime-bounce 2.5s ease-in-out infinite;
          pointer-events: none;
          z-index: 10;
        }

        @media (max-width: 640px) {
          .ibime-floating-label {
            font-size: 9px;
            padding: 2.5px 6px;
            top: -36px;
          }
        }

        @keyframes ibime-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes ibime-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-5px); }
        }
        @keyframes ibime-ring-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes ibime-pulse-green {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #4ade80; }
          50% { opacity: 0.6; box-shadow: 0 0 12px #4ade80; }
        }
        @keyframes ibime-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ibime-label-fade {
          from { opacity: 0; transform: translateX(6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

export default IBIMEAssistant;
