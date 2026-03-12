/**
 * Simple Item Limit for "¿Qué Me Pongo?"
 * 300 items free - no payments
 */

export const FREE_ITEM_LIMIT = 300;

/**
 * Calculate total item limit for a user
 * Currently just returns the free limit (300 items)
 */
export function calculateItemLimit(): number {
  return FREE_ITEM_LIMIT;
}
