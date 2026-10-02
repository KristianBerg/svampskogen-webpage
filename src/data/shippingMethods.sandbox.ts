import type { ShippingMethod } from './shippingMethodTypes'

export const shippingMethods: ShippingMethod[] = [
  {
    id: 'dhl',
    stripePriceId: 'price_1UM4sb1HnhNtqQNv3Q8EJ6fz',
    name: { sv: 'DHL', en: 'DHL' },
  },
  {
    id: 'postnord',
    stripePriceId: 'price_1UM70u1HnhNtqQNvfm3JwSPj',
    name: { sv: 'PostNord', en: 'PostNord' },
  },
]
