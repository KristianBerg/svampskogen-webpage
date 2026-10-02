import type { ShippingMethod } from './shippingMethodTypes'

export const shippingMethods: ShippingMethod[] = [
  {
    id: 'dhl',
    stripePriceId: 'price_1UM4sj09vQZGLxR7CQ9r1Xa5',
    name: { sv: 'DHL', en: 'DHL' },
  },
  {
    id: 'postnord',
    stripePriceId: 'price_1UM4si09vQZGLxR707KNAcH0',
    name: { sv: 'PostNord', en: 'PostNord' },
  },
]
