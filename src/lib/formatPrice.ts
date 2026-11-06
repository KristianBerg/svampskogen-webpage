// Always formatted sv-SE ("249 kr") regardless of UI language — the shop
// only ever charges in SEK, so an English UI showing "SEK 249.00" would be
// more confusing, not less.
export function formatPrice(amountOre: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(amountOre / 100)
}
