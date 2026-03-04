import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export function IBIMEAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "¡Hola! Soy el Asistente del IBIME. Puedo ayudarte con el catálogo, agenda cultural, cursos y servicios.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus al abrir + reset de mensajes a bienvenida si se reabre limpio
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: trimmed, timestamp: new Date() },
    ]);
    setInputValue("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Recibido. Estoy consultando la base de datos oficial del IBIME sobre su solicitud...",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const fmt = (d: Date) =>
    d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });

  // Estilo base compartido con FloatingButtons — 44px, círculo, misma sombra
  const sharedBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 4px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
  };

  return (
    <>
      {/* Stack flotante — mismo eje vertical que FloatingButtons (right-6) */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "12px",
          zIndex: 9999,
        }}
      >
        {/* ── Ventana de Chat ── */}
        {isOpen && (
          <div
            style={{
              width: "320px",
              height: "420px",
              display: "flex",
              flexDirection: "column",
              borderRadius: "16px",
              overflow: "hidden",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.07)",
            }}
          >
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #15803d, #166534)",
              padding: "10px 12px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0, minHeight: "52px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  border: "1.5px solid rgba(255,255,255,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <p style={{ color: "white", fontWeight: 600, fontSize: 12,
                    lineHeight: 1.2, margin: 0, textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>
                    Asistente IBIME
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%",
                      background: "#4ade80", boxShadow: "0 0 4px #4ade80",
                      display: "inline-block" }} />
                    <span style={{ color: "#bbf7d0", fontSize: 10 }}>En línea</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }} aria-label="Cerrar">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Mensajes */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "10px",
              display: "flex", flexDirection: "column", gap: "7px",
              background: "#f8fafc",
              scrollbarWidth: "thin", scrollbarColor: "#15803d22 transparent",
            }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}>
                  <div style={{
                    maxWidth: "82%", padding: "7px 11px",
                    borderRadius: msg.role === "user"
                      ? "13px 13px 3px 13px" : "13px 13px 13px 3px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #15803d, #166534)" : "#ffffff",
                    color: msg.role === "user" ? "white" : "#1e293b",
                    fontSize: 12.5, lineHeight: 1.45,
                    boxShadow: msg.role === "user"
                      ? "0 2px 6px rgba(21,128,61,0.28)" : "0 1px 3px rgba(0,0,0,0.08)",
                  }}>
                    <p style={{ margin: 0 }}>{msg.text}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 9.5, opacity: 0.5, textAlign: "right" }}>
                      {fmt(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{
                    padding: "9px 13px", borderRadius: "13px 13px 13px 3px",
                    background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    display: "flex", gap: 3, alignItems: "center",
                  }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{
                        width: 5, height: 5, borderRadius: "50%", background: "#15803d",
                        display: "inline-block",
                        animation: `ibime-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input + Enviar */}
            <div style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "8px 10px", background: "#ffffff",
              borderTop: "1px solid #e2e8f0", flexShrink: 0,
            }}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Escribe tu consulta..."
                disabled={isTyping}
                style={{
                  flex: 1, height: 34, padding: "0 10px", borderRadius: 9,
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
                  width: 34, height: 34, borderRadius: 9, border: "none", flexShrink: 0,
                  cursor: isTyping || !inputValue.trim() ? "not-allowed" : "pointer",
                  background: isTyping || !inputValue.trim()
                    ? "#dcfce7" : "linear-gradient(135deg, #15803d, #166534)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isTyping || !inputValue.trim()
                    ? "none" : "0 2px 6px rgba(21,128,61,0.35)",
                  transition: "all 0.15s",
                }}
                aria-label="Enviar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={isTyping || !inputValue.trim() ? "#86efac" : "white"}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Botón flotante — idéntico en forma/sombra al scroll-to-top ── */}
        <button
          onClick={() => setIsOpen((p) => !p)}
          style={{
            ...sharedBtn,
            background: isOpen
              ? "#166534"
              : "linear-gradient(135deg, #15803d, #166534)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)";
          }}
          aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente virtual IBIME"}
        >
          {isOpen ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9" cy="10" r="1" fill="white" stroke="none" />
              <circle cx="12" cy="10" r="1" fill="white" stroke="none" />
              <circle cx="15" cy="10" r="1" fill="white" stroke="none" />
            </svg>
          )}
        </button>
      </div>

      <style>{`
        @keyframes ibime-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30%            { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default IBIMEAssistant;