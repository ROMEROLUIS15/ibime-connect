/**
 * Scroll utilities for smooth navigation within the page.
 */

/**
 * Smoothly scrolls to an element by ID, with optional offset.
 *
 * @param id - The element ID to scroll to (without the #)
 * @param offset - Vertical offset in pixels (default: 80px for fixed headers)
 */
export function scrollToElement(id: string, offset = 80): void {
  const element = document.getElementById(id);
  if (!element) return;

  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}
