import { shippingMethods as liveShippingMethods } from './shippingMethods.live'
import { shippingMethods as sandboxShippingMethods } from './shippingMethods.sandbox'

export type { ShippingMethod } from './shippingMethodTypes'

// Same live/sandbox switch as products.ts — keep the two changing together.
export const shippingMethods =
  import.meta.env.VITE_CATALOG_MODE === 'live' ? liveShippingMethods : sandboxShippingMethods

export const DEFAULT_SHIPPING_METHOD_ID = 'dhl'
