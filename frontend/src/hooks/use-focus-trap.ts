import { useEffect, type RefObject } from 'react';

/**
 * Traps keyboard focus within a container element.
 * Only activates when `enabled` is true.
 *
 * @param containerRef - Ref to the container element
 * @param enabled - Whether the trap should be active
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusableElements = (): HTMLElement[] => {
      const elements = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(elements).filter((el) => !el.disabled && el.tabIndex >= 0);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown as unknown as EventListener);

    const focusable = getFocusableElements();
    if (focusable.length > 0) focusable[0].focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown as unknown as EventListener);
      previouslyFocused?.focus();
    };
  }, [containerRef, enabled]);
}

/**
 * Closes something when the Escape key is pressed.
 *
 * @param onEscape - Callback to run when Escape is pressed
 * @param enabled - Whether the listener should be active
 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };

    document.addEventListener('keydown', handleEscape as unknown as EventListener);
    return () => document.removeEventListener('keydown', handleEscape as unknown as EventListener);
  }, [onEscape, enabled]);
}
