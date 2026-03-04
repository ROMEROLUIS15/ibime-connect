import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

// FloatingButtons NO renderiza ningún botón en bottom-6 right-6.
// Ese espacio está reservado para IBIMEAssistant.
// La columna flotante completa queda así (de abajo hacia arriba):
//   bottom-6   → IBIMEAssistant (chat)
//   bottom-[68px] → Scroll to Bottom  (solo cuando showScrollTop=false)
//   bottom-[68px] → Scroll to Top     (solo cuando showScrollTop=true)

export const FloatingButtons = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  // Estilo base compartido — igual que el botón del IBIMEAssistant
  const base: React.CSSProperties = {
    position: 'fixed',
    right: '24px',
    bottom: '76px',          // justo encima del botón del asistente (24px + 44px + 8px gap)
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,             // un nivel por debajo del asistente (9999)
    boxShadow: '0 4px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)',
    transition: 'opacity 0.25s, transform 0.25s, box-shadow 0.2s',
  };

  return (
    <>
      {/* Scroll to Top — aparece al bajar */}
      <button
        onClick={scrollToTop}
        style={{
          ...base,
          background: 'linear-gradient(135deg, #15803d, #166534)',
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? 'translateY(0)' : 'translateY(12px)',
          pointerEvents: showScrollTop ? 'auto' : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)';
        }}
        aria-label="Ir al inicio"
      >
        <ChevronUp color="white" size={20} strokeWidth={2.5} />
      </button>

      {/* Scroll to Bottom — aparece al estar arriba */}
      <button
        onClick={scrollToBottom}
        style={{
          ...base,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          opacity: showScrollTop ? 0 : 1,
          transform: showScrollTop ? 'translateY(12px)' : 'translateY(0)',
          pointerEvents: showScrollTop ? 'none' : 'auto',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)';
        }}
        aria-label="Ir al final"
      >
        <ChevronDown color="#15803d" size={20} strokeWidth={2.5} />
      </button>
    </>
  );
};

export default FloatingButtons;