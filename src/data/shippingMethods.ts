import { shippingMethod as liveShippingMethod } from './shippingMethods.live'
import { shippingMethod as sandboxShippingMethod } from './shippingMethods.sandbox'

export type { ShippingMethod } from './shippingMethodTypes'

// Same live/sandbox switch as products.ts — keep the two changing together.
// DHL only — PostNord was ruled out (80 kr even for small packages).
export const shippingMethod = import.meta.env.VITE_CATALOG_MODE === 'live' ? liveShippingMethod : sandboxShippingMethod
