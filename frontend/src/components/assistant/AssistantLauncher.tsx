/**
 * src/components/assistant/AssistantLauncher.tsx
 *
 * Mascota flotante del Asistente IBIME — el búho institucional.
 *
 * Componente 100% presentacional e independiente: NO conoce nada de la lógica
 * de chat (mensajes, sesión, backend, RAG). Su único trabajo es mostrar al búho
 * con un globo de diálogo que invita a conversar, y avisar al padre cuando el
 * usuario lo activa (vía `onToggle`). Mientras el chat está abierto se oculta,
 * para que la ventana ocupe su lugar sin estorbo visual.
 *
 * Inspirado en el patrón de mascota-lanzador (estilo SENA), adaptado a la
 * identidad del IBIME: el búho como símbolo de la red de bibliotecas.
 */

import { useState, useRef, useEffect, type JSX, type TouchEvent } from 'react';
import { useFloatingButtonsTheme } from '@/hooks/useFloatingButtonsTheme';
import owlMascot from '@/assets/buho_8-removebg-preview.png';

interface AssistantLauncherProps {
  /** Si el panel de chat está abierto: la mascota se oculta para no estorbar. */
  readonly isOpen: boolean;
  /** Se invoca cuando el usuario toca/hace clic en la mascota para abrir el chat. */
  readonly onToggle: () => void;
}

const MASCOT_SIZE = 104; // px — búho de cuerpo completo
const DRAG_THRESHOLD = 5; // px — a partir de aquí el gesto es arrastre, no clic
const MOBILE_BREAKPOINT = 768; // px

export function AssistantLauncher({ isOpen, onToggle }: AssistantLauncherProps): JSX.Element | null {
  const { isDark } = useFloatingButtonsTheme();

  // Arrastre vertical (solo móvil) para reubicar la mascota sin abrir el chat.
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDraggingActive, setIsDraggingActive] = useState<boolean>(false);
  const dragStartY = useRef<number | null>(null);
  const initialOffset = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Al volver a la versión de escritorio, resetear la posición de arrastre.
  useEffect(() => {
    const handleResize = (): void => {
      if (window.innerWidth > MOBILE_BREAKPOINT) setDragOffset(0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchStart = (e: TouchEvent<HTMLButtonElement>): void => {
    if (window.innerWidth > MOBILE_BREAKPOINT) return;
    dragStartY.current = e.touches[0].clientY;
    initialOffset.current = dragOffset;
    isDragging.current = false;
    setIsDraggingActive(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLButtonElement>): void => {
    if (dragStartY.current === null || window.innerWidth > MOBILE_BREAKPOINT) return;
    const deltaY = dragStartY.current - e.touches[0].clientY; // positivo hacia arriba
    if (Math.abs(deltaY) > DRAG_THRESHOLD) isDragging.current = true;

    let next = initialOffset.current + deltaY;
    const maxOffset = window.innerHeight - 150;
    if (next < -10) next = -10;
    if (next > maxOffset) next = maxOffset;
    setDragOffset(next);
  };

  const handleTouchEnd = (): void => {
    dragStartY.current = null;
    setIsDraggingActive(false);
  };

  const handleActivate = (): void => {
    // Si el gesto fue un arrastre, no interpretarlo como "abrir chat".
    if (isDragging.current) {
      isDragging.current = false;
      return;
    }
    onToggle();
  };

  // Mientras el chat está abierto, la mascota desaparece: la ventana la sustituye.
  if (isOpen) return null;

  const bubbleBg = isDark ? '#ffffff' : '#0B1930';
  const bubbleColor = isDark ? '#0B1930' : '#ffffff';
  const bubbleBorder = isDark ? '#e2e8f0' : '#051231';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `calc(20px + ${dragOffset}px)`,
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
        transition: isDraggingActive ? 'none' : 'bottom 0.3s ease',
      }}
    >
      {/* ── Globo de diálogo invitando a conversar ── */}
      <div
        className="ibime-launcher-bubble"
        style={{ background: bubbleBg, color: bubbleColor, borderColor: bubbleBorder }}
        aria-hidden="true"
      >
        <strong style={{ display: 'block', fontWeight: 700 }}>¿Tienes dudas?</strong>
        <span>Estoy aquí para ayudarte</span>
        <span
          className="ibime-launcher-bubble-tail"
          style={{ background: bubbleBg, borderColor: bubbleBorder }}
        />
      </div>

      {/* ── El búho (disparador del chat) ── */}
      <button
        type="button"
        onClick={handleActivate}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label="Abrir Asistente IA del IBIME"
        className="ibime-launcher-mascot"
        style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }}
      >
        <img
          src={owlMascot}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="ibime-launcher-mascot-img"
        />
      </button>

      <style>{`
        .ibime-launcher-bubble {
          position: relative;
          max-width: 190px;
          margin-right: 8px;
          padding: 10px 14px;
          border-radius: 16px;
          border: 2px solid;
          font-size: 12.5px;
          line-height: 1.35;
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
          animation:
            ibime-launcher-bubble-in 0.4s cubic-bezier(.4,0,.2,1) both,
            ibime-launcher-bob 3s ease-in-out 0.4s infinite;
        }
        .ibime-launcher-bubble-tail {
          position: absolute;
          right: 22px;
          bottom: -7px;
          width: 13px;
          height: 13px;
          border-right: 2px solid;
          border-bottom: 2px solid;
          border-radius: 0 0 4px 0;
          transform: rotate(45deg);
        }
        .ibime-launcher-mascot {
          width: ${MASCOT_SIZE}px;
          height: ${MASCOT_SIZE}px;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          display: block;
          touch-action: none;
          filter: drop-shadow(0 10px 14px rgba(11,25,48,0.28));
          transition: transform 0.2s ease;
        }
        .ibime-launcher-mascot:hover { transform: translateY(-6px) scale(1.05); }
        .ibime-launcher-mascot:focus-visible {
          outline: 3px solid #4ade80;
          outline-offset: 4px;
          border-radius: 12px;
        }
        .ibime-launcher-mascot-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
          pointer-events: none;
          animation: ibime-launcher-float 3.4s ease-in-out infinite;
        }
        @media (max-width: 640px) {
          .ibime-launcher-bubble { max-width: 150px; font-size: 11px; padding: 8px 11px; }
        }
        @keyframes ibime-launcher-bubble-in {
          from { opacity: 0; transform: translateY(8px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ibime-launcher-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes ibime-launcher-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ibime-launcher-bubble,
          .ibime-launcher-mascot-img { animation: none; }
        }
      `}</style>
    </div>
  );
}

export default AssistantLauncher;
