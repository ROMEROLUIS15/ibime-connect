/**
 * Animation utilities for staggered entrance effects.
 */

/**
 * Returns an inline style string for staggered animation delays.
 *
 * @param index - The item index in the list
 * @param baseDelay - Base delay in ms between each item (default: 100ms)
 *
 * @example
 * style={{ animationDelay: getAnimationDelay(index) }}
 * style={{ animationDelay: getAnimationDelay(index, 150) }}
 */
export function getAnimationDelay(index: number, baseDelay = 100): string {
  return `${index * baseDelay}ms`;
}
