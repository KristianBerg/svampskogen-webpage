import { products as liveProducts } from './products.live'
import { products as sandboxProducts } from './products.sandbox'

export type { Product } from './productTypes'

// Defaults to the sandbox catalog so local dev and any deploy still running
// on a test-mode Stripe key never accidentally serve the live catalog.
// Flip VITE_CATALOG_MODE=live only once the Worker's STRIPE_SECRET_KEY is
// also live (Phase 7) — the two must change together.
const catalog = import.meta.env.VITE_CATALOG_MODE === 'live' ? liveProducts : sandboxProducts

// Everything on the storefront goes through this list, so an unpublished product
// has no listing or page, and any saved cart entry for it is dropped.
export const products = catalog.filter((product) => product.published)
