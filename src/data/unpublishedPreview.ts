import { isSandbox } from '../lib/sandbox'
import type { Product } from './productTypes'
import data from './products.json'

// Unpublished products, for previewing them in the storefront before they go
// live. Sandbox only: deployed builds get an empty list, so no store page shows
// these products. Only the storefront pages import this file, never the Worker,
// so checkout keeps refusing unpublished products and they can't be bought.
export const unpublishedProducts: Product[] = isSandbox
  ? (data as Product[]).filter((product) => !product.published)
  : []
