import type { Product } from './productTypes'
import data from './products.live.json'

// Live catalog, built up incrementally from the PayPal POS (Zettle) export.
// Entries below have real Stripe Price IDs but still need real marketing
// copy (name.en, description.sv/en) and real product photos.
// The data lives in products.live.json so the local image uploader can edit it
// as plain data; this wrapper is what gives it the Product type.
export const products: Product[] = data
