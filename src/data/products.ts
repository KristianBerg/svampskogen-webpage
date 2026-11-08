import type { Product } from './productTypes'
import data from './products.json'

export type { Product } from './productTypes'

// The one catalog, shared by sandbox and live: prices are charged from here rather
// than from Stripe Products, so it doesn't depend on the Stripe mode.
// The data lives in products.json so the CMS can edit it as plain data; this
// wrapper is what gives it the Product type.
const catalog: Product[] = data

// The storefront and the checkout Worker both go through this list, so an unpublished
// product has no listing or page, can't be bought, and any saved cart entry for it is
// dropped.
export const products = catalog.filter((product) => product.published)
