// Paths under public/, e.g. "/products/opinel-svampkniv/1-thumb.webp".
// thumb is sized for grid/cart views, full for the product page.
export interface ProductImage {
  thumb: string
  full: string
}

export interface Product {
  slug: string
  // Whole kronor expressed in öre (24500 = 245 kr), the unit Stripe charges in.
  // The single source of truth for this product's price: both the site and the
  // Worker read it from here. See scripts/check-catalog.mjs for what's allowed.
  priceOre: number
  vatRate: number
  inStock: boolean
  // Used only to group/sort products in the local image-upload tool's
  // navigation — not read by the image pipeline (paths are keyed by slug
  // alone) or shown anywhere on the storefront.
  category?: string
  name: {
    sv: string
    en: string
  }
  description: {
    sv: string
    en: string
  }
}
