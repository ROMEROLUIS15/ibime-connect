import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useFloatingButtonsTheme } from '@/hooks/useFloatingButtonsTheme';

export const FloatingButtons = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { isDark } = useFloatingButtonsTheme();

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  // ── Estilos dinámicos ──────────────────────────────────────────
  // isDark = true  → sobre sección verde/oscura → botón BLANCO glassmorphism
  // isDark = false → sobre sección clara        → botón VERDE institucional
  const dynamicStyle: React.CSSProperties = isDark
    ? {
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(255, 255, 255, 0.55)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.14)',
      }
    : {
        background: 'linear-gradient(135deg, #15803d, #166534)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: '1.5px solid rgba(255,255,255,0.18)',
        boxShadow: '0 4px 16px rgba(21,128,61,0.45), 0 1px 4px rgba(21,128,61,0.2)',
      };

  const iconColor = isDark ? '#15803d' : 'white';

  // Base compartida entre ambos botones
  const base: React.CSSProperties = {
    position: 'fixed',
    right: '27px',         // centrado geométrico con el asistente (50px vs 44px)
    bottom: '94px',        // más cerca del asistente (dejando rango para la onda)
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'none', /* oculto a petición, layout mantendrá estructura sin verse */
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    // Transición suave 500ms al cruzar entre secciones
    transition: 'all 500ms ease, opacity 250ms ease, transform 250ms ease',
    ...dynamicStyle,
  };

  return (
    <>
      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        style={{
          ...base,
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? 'translateY(0)' : 'translateY(12px)',
          pointerEvents: showScrollTop ? 'auto' : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = showScrollTop
            ? 'translateY(0) scale(1)'
            : 'translateY(12px) scale(1)';
        }}
        aria-label="Ir al inicio"
        title="Volver al inicio"
      >
        <ChevronUp color={iconColor} size={22} strokeWidth={2.5} />
      </button>

      {/* Scroll to Bottom */}
      <button
        onClick={scrollToBottom}
        style={{
          ...base,
          opacity: showScrollTop ? 0 : 1,
          transform: showScrollTop ? 'translateY(12px)' : 'translateY(0)',
          pointerEvents: showScrollTop ? 'none' : 'auto',
        }}
        onMouseEnter={(e) => {
          if (!showScrollTop)
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = showScrollTop
            ? 'translateY(12px) scale(1)'
            : 'translateY(0) scale(1)';
        }}
        aria-label="Ir al final"
        title="Ir al final de la página"
      >
        <ChevronDown color={iconColor} size={22} strokeWidth={2.5} />
      </button>
    </>
  );
};

export default FloatingButtons;
