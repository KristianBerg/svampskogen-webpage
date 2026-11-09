// Paths under public/, e.g. "/products/opinel-svampkniv/1-thumb.webp".
// thumb is sized for grid/cart views, full for the product page.
export interface ProductImage {
  thumb: string
  full: string
}

// The ids are what carts and orders refer to, so names can be edited freely.
export interface ProductVariantOption {
  id: string
  name: {
    sv: string
    en: string
  }
}

// One choice the customer makes, e.g. color or embroidery. Doesn't affect price.
export interface ProductVariantCategory {
  id: string
  name: {
    sv: string
    en: string
  }
  options: ProductVariantOption[]
}

// A store category. The id is what products and store links refer to, so names
// can be edited freely.
export interface Category {
  id: string
  name: {
    sv: string
    en: string
  }
}

export interface Product {
  slug: string
  // Whole kronor expressed in öre (24500 = 245 kr), the unit Stripe charges in.
  // The single source of truth for this product's price: both the site and the
  // Worker read it from here. See scripts/check-catalog.mjs for what's allowed.
  priceOre: number
  vatRate: number
  // false keeps the product in the CMS but off the storefront: no store listing,
  // no product page, and the Worker won't sell it. Not a secret though, since
  // the whole catalog and its photos are still public files on the static site.
  published: boolean
  inStock: boolean
  // The id of an entry in categories.json. Not read by the image pipeline
  // (paths are keyed by slug alone).
  category?: string
  name: {
    sv: string
    en: string
  }
  description: {
    sv: string
    en: string
  }
  // The customer picks one option in every category before buying.
  variants?: ProductVariantCategory[]
}
