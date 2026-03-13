import { useState, useRef, useEffect } from "react";
import { useFloatingButtonsTheme } from '@/hooks/useFloatingButtonsTheme';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

// ── Ícono de robot SVG ────────────────────────────────────────────────────────
const RobotIcon = ({ size = 22, color = "white" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="12" rx="3" />
    <circle cx="9" cy="14" r="1.5" fill={color} stroke="none" />
    <circle cx="15" cy="14" r="1.5" fill={color} stroke="none" />
    <path d="M12 2v4" />
    <circle cx="12" cy="2" r="1.2" fill={color} stroke="none" />
    <path d="M3 13H1M23 13h-2" />
    <path d="M9 20v1M15 20v1" />
  </svg>
);

// ── Ícono de enviar ───────────────────────────────────────────────────────────
const SendIcon = ({ color = "white" }: { color?: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export function IBIMEAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "¡Hola! Soy el Asistente IA del IBIME 🤖\nPuedo ayudarte con horarios, catálogo Koha, eventos, servicios y más. ¿En qué te ayudo hoy?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useFloatingButtonsTheme();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      const chatHistory = updatedMessages
        .filter((m) => !(m.role === "assistant" && m.id === 0))
        .map((m) => ({ role: m.role, text: m.text }));

      const { data, error } = await supabase.functions.invoke("ibime-chat", {
        body: { messages: chatHistory },
      });

      const responseText =
        error || !data?.text
          ? "Lo siento, tuve un problema al procesar tu consulta. Por favor llama al 0274-2623898 o escribe a contactoibime@gmail.com."
          : data.text;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: responseText,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Lo siento, hubo un error de conexión. Intenta de nuevo en un momento.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const fmt = (d: Date) =>
    d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });

  // ── Colores del trigger según sección ────────────────────────────────────
  const triggerBg = isDark
    ? "rgba(255,255,255,0.95)"
    : "linear-gradient(135deg, #15803d, #166534)";
  const iconColor = isDark ? "#15803d" : "white";
  const ringColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(21,128,61,0.4)";

  return (
    <>
      <div style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "12px",
        zIndex: 9999,
      }}>

        {/* ── Ventana de Chat ─────────────────────────────────────────────── */}
        {isOpen && (
          <div style={{
            width: "calc(100vw - 48px)",
            maxWidth: "360px",
            height: "480px",
            maxHeight: "calc(100vh - 120px)",
            display: "flex",
            flexDirection: "column",
            borderRadius: "20px",
            overflow: "hidden",
            background: "#f8fafc",
            boxShadow: "0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)",
            border: "1px solid rgba(0,0,0,0.06)",
            animation: "ibime-slide-up 0.25s cubic-bezier(.4,0,.2,1)",
          }}>

            {/* ── Header con gradiente ── */}
            <div style={{
              background: "linear-gradient(135deg, #15803d 0%, #166534 60%, #14532d 100%)",
              padding: "14px 14px 10px",
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Decoración de fondo */}
              <div style={{
                position: "absolute", top: -20, right: -20,
                width: 100, height: 100, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
              }} />
              <div style={{
                position: "absolute", bottom: -30, left: "30%",
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
              }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                {/* Avatar + Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Avatar IA */}
                  <div style={{
                    width: 42, height: 42, borderRadius: "12px",
                    background: "rgba(255,255,255,0.18)",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}>
                    <RobotIcon size={22} color="white" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ color: "white", fontWeight: 700, fontSize: 13.5, margin: 0, lineHeight: 1.2 }}>
                        Asistente IBIME
                      </p>
                      {/* Badge IA */}
                      <span style={{
                        background: "rgba(255,255,255,0.25)",
                        color: "white", fontSize: 9, fontWeight: 700,
                        padding: "1px 6px", borderRadius: 20,
                        border: "1px solid rgba(255,255,255,0.4)",
                        letterSpacing: "0.05em",
                      }}>IA</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#4ade80",
                        boxShadow: "0 0 6px #4ade80",
                        display: "inline-block",
                        animation: "ibime-pulse-green 2s ease-in-out infinite",
                      }} />
                      <span style={{ color: "#bbf7d0", fontSize: 10.5 }}>En línea · Listo para ayudarte</span>
                    </div>
                  </div>
                </div>
                {/* Cerrar */}
                <button onClick={() => setIsOpen(false)} style={{
                  width: 28, height: 28, borderRadius: "8px",
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 16, lineHeight: 1,
                  transition: "background 0.15s",
                }} aria-label="Cerrar">
                  ✕
                </button>
              </div>
            </div>

            {/* ── Mensajes ── */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "12px 10px",
              display: "flex", flexDirection: "column", gap: "8px",
              background: "#f8fafc",
              scrollbarWidth: "thin", scrollbarColor: "#15803d22 transparent",
            }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: 7,
                  alignItems: "flex-end",
                }}>
                  {/* Avatar asistente */}
                  {msg.role === "assistant" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "8px", flexShrink: 0,
                      background: "linear-gradient(135deg, #15803d, #166534)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <RobotIcon size={14} color="white" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "78%", padding: "8px 12px",
                    borderRadius: msg.role === "user"
                      ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #15803d, #166534)"
                      : "#ffffff",
                    color: msg.role === "user" ? "white" : "#1e293b",
                    fontSize: 12.5, lineHeight: 1.5,
                    boxShadow: msg.role === "user"
                      ? "0 2px 8px rgba(21,128,61,0.3)"
                      : "0 1px 4px rgba(0,0,0,0.08)",
                    border: msg.role === "assistant" ? "1px solid rgba(0,0,0,0.05)" : "none",
                    whiteSpace: "pre-line",
                  }}>
                    <p style={{ margin: 0 }}>{msg.text}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 9.5, opacity: 0.5, textAlign: "right" }}>
                      {fmt(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Indicador de escritura */}
              {isTyping && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "8px", flexShrink: 0,
                    background: "linear-gradient(135deg, #15803d, #166534)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <RobotIcon size={14} color="white" />
                  </div>
                  <div style={{
                    padding: "10px 14px", borderRadius: "14px 14px 14px 3px",
                    background: "#ffffff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    display: "flex", gap: 4, alignItems: "center",
                  }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: "50%", background: "#15803d",
                        display: "inline-block",
                        animation: `ibime-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <div style={{
              padding: "10px 12px 12px",
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="Escribe tu consulta..."
                  disabled={isTyping}
                  style={{
                    flex: 1, height: 38, padding: "0 12px", borderRadius: 12,
                    border: "1.5px solid #e2e8f0", fontSize: 12.5,
                    color: "#1e293b", background: "#f8fafc", outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#15803d")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isTyping || !inputValue.trim()}
                  style={{
                    width: 38, height: 38, borderRadius: 12, border: "none", flexShrink: 0,
                    cursor: isTyping || !inputValue.trim() ? "not-allowed" : "pointer",
                    background: isTyping || !inputValue.trim()
                      ? "#dcfce7"
                      : "linear-gradient(135deg, #15803d, #166534)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isTyping || !inputValue.trim() ? "none" : "0 2px 8px rgba(21,128,61,0.4)",
                    transition: "all 0.15s",
                  }}
                  aria-label="Enviar"
                >
                  <SendIcon color={isTyping || !inputValue.trim() ? "#86efac" : "white"} />
                </button>
              </div>
              <p style={{ fontSize: 9.5, color: "#94a3b8", margin: "6px 0 0", textAlign: "center" }}>
                Asistente IA del IBIME · Powered by Gemini
              </p>
            </div>
          </div>
        )}

        {/* ── Botón trigger con anillo pulsante ──────────────────────────── */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Anillo pulsante exterior */}
          {!isOpen && (
            <div style={{
              position: "absolute",
              width: 60, height: 60,
              borderRadius: "50%",
              background: ringColor,
              animation: "ibime-ring-pulse 2s ease-out infinite",
              pointerEvents: "none",
            }} />
          )}

          {/* Etiqueta flotante (solo en desktop para no aglomerar el móvil) */}
          {!isOpen && (
            <div className="hidden md:block" style={{
              position: "absolute",
              right: 58,
              whiteSpace: "nowrap",
              background: isDark ? "rgba(255,255,255,0.95)" : "#15803d",
              color: isDark ? "#15803d" : "white",
              fontSize: 11.5, fontWeight: 600,
              padding: "5px 10px", borderRadius: 20,
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              border: isDark ? "1px solid rgba(21,128,61,0.2)" : "none",
              animation: "ibime-label-fade 0.4s ease",
              pointerEvents: "none",
            }}>
              🤖 Asistente IA
            </div>
          )}

          <button
            onClick={() => setIsOpen((p) => !p)}
            style={{
              width: 50, height: 50,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 500ms ease, transform 200ms ease",
              background: triggerBg,
              border: isDark
                ? "1.5px solid rgba(255,255,255,0.55)"
                : "1.5px solid rgba(255,255,255,0.18)",
              boxShadow: isDark
                ? "0 8px 28px rgba(0,0,0,0.28)"
                : "0 4px 20px rgba(21,128,61,0.5)",
              position: "relative",
              zIndex: 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px) scale(1.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0) scale(1)"; }}
            aria-label={isOpen ? "Cerrar asistente" : "Abrir Asistente IA del IBIME"}
          >
            {isOpen ? (
              <span style={{ color: iconColor, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>✕</span>
            ) : (
              <RobotIcon size={24} color={iconColor} />
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ibime-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes ibime-ring-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
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
