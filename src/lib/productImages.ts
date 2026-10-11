import { productImageCounts } from '../data/productImageCounts.generated'
import type { Product, ProductImage } from '../data/productTypes'

const placeholder: ProductImage = { thumb: '/products/placeholder.svg', full: '/products/placeholder.svg' }

// Derives a product's images from the file-naming convention
// (public/products/<slug>/<n>-{thumb,full}.webp) instead of a hand-maintained
// list, so uploading photos never requires a products.ts edit. Falls back to
// a shared placeholder when no photos have been uploaded yet.
export function getProductImages(product: Product): [ProductImage, ...ProductImage[]] {
  const count = productImageCounts[product.slug] ?? 0
  if (count === 0) {
    return [placeholder]
  }

  return Array.from({ length: count }, (_, index) => {
    const n = index + 1
    return {
      thumb: `/products/${product.slug}/${n}-thumb.webp`,
      full: `/products/${product.slug}/${n}-full.webp`,
    }
  }) as [ProductImage, ...ProductImage[]]
}
