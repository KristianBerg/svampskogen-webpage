import type { FreeShippingOffer, ShippingMethod } from './shippingMethodTypes'

export type { DeliveryMethod, FreeShippingOffer, ShippingMethod } from './shippingMethodTypes'

// DHL only: PostNord was ruled out (80 kr even for small packages).
export const shippingMethod: ShippingMethod = {
  id: 'dhl',
  priceOre: 6000,
  vatRate: 0.25,
  name: { sv: 'DHL', en: 'DHL' },
}

// Launch and Christmas offer. The last day is Sunday 13 Dec, a couple of days before
// the last order date for delivery before Christmas. Set to null to switch the offer off.
export const freeShippingOffer: FreeShippingOffer | null = {
  minSubtotalOre: 40000,
  endsAt: '2026-12-14T00:00:00+01:00',
  lastDay: { sv: '13 december', en: '13 December' },
}

export function isFreeShippingActive(now: Date = new Date()): boolean {
  return freeShippingOffer !== null && now < new Date(freeShippingOffer.endsAt)
}

// The Worker charges this and the cart shows it, so both read the same rule.
// The subtotal is the products only, before any discount code.
export function shippingPriceOre(subtotalOre: number, now: Date = new Date()): number {
  if (freeShippingOffer && isFreeShippingActive(now) && subtotalOre >= freeShippingOffer.minSubtotalOre) return 0
  return shippingMethod.priceOre
}
