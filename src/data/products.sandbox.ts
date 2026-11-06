import type { Product } from './productTypes'
import data from './products.sandbox.json'

// Placeholder catalog for exercising the store against a test-mode Stripe key.
// The data lives in products.sandbox.json, typed here.
export const products: Product[] = data
