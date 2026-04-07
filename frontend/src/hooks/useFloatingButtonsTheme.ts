import { useState, useEffect } from 'react';

/**
 * useFloatingButtonsTheme — v3
 *
 * Detecta secciones oscuras/verdes/azules usando estrategia dual:
 * 1. IntersectionObserver para secciones grandes
 * 2. scroll + getBoundingClientRect para elementos pequeños
 *
 * IDs oscuros registrados:
 *   inicio                → HeroSection (foto oscura)
 *   eventos               → EventsSection (bg-gradient-institutional)
 *   visitantes            → VisitorCounter (bg-gradient-institutional)
 *   cifras-institucionales → div en MissionVisionSection
 *   footer-ibime          → Footer (bg-footer-navy azul oscuro)
 */

const LARGE_DARK_IDS = ['inicio', 'eventos', 'visitantes'];
const SCROLL_DARK_IDS = ['cifras-institucionales', 'footer-ibime'];

export function useFloatingButtonsTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const active = new Set<string>();
    const observers: IntersectionObserver[] = [];

    // ── Estrategia 1: IntersectionObserver para secciones grandes ──
    LARGE_DARK_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            active.add(id);
          } else {
            active.delete(id);
          }
          setIsDark(active.size > 0);
        },
        {
          threshold: 0.1,
          rootMargin: '-50% 0px 0px 0px',
        }
      );

      obs.observe(el);
      observers.push(obs);
    });

    // ── Estrategia 2: scroll listener para elementos pequeños/footer ──
    const checkScrollElements = () => {
      const vh = window.innerHeight;
      const buttonsY = vh * 0.65; // zona donde viven los botones (~65% desde arriba)

      SCROLL_DARK_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const coversButtons = rect.top < vh && rect.bottom > buttonsY;

        if (coversButtons) {
          active.add(id);
        } else {
          active.delete(id);
        }
      });

      setIsDark(active.size > 0);
    };

    window.addEventListener('scroll', checkScrollElements, { passive: true });
    checkScrollElements(); // verificar estado inicial

    return () => {
      observers.forEach((o) => o.disconnect());
      window.removeEventListener('scroll', checkScrollElements);
    };
  }, []);

  return { isDark };
}