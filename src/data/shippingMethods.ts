import type { ShippingMethod } from './shippingMethodTypes'

export type { DeliveryMethod, ShippingMethod } from './shippingMethodTypes'

// DHL only: PostNord was ruled out (80 kr even for small packages).
export const shippingMethod: ShippingMethod = {
  id: 'dhl',
  priceOre: 6000,
  vatRate: 0.25,
  name: { sv: 'DHL', en: 'DHL' },
}
