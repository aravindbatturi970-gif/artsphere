/**
 * Small shared helpers. Kept dependency-free on purpose.
 */

/**
 * Merge conditional class names — a tiny stand-in for `clsx` so Stage 1
 * carries zero extra dependencies.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a price for display. INR is the marketplace default; USD remains
 * for legacy sample rows.
 */
export function formatPrice(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
