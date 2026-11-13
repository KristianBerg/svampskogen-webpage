import { categories } from '../data/categories'
import { products } from '../data/products'
import { unpublishedProducts } from '../data/unpublishedPreview'

// What the store page shows for a given filter (its URL search). Shared with the
// product page, so the arrow keys there step through the same list the visitor
// was browsing.
export function getStoreListing(searchParams: URLSearchParams) {
  const inStockProducts = products.filter((product) => product.inStock)
  // Only categories with something for sale, so no button leads to an empty page.
  const availableCategories = categories.filter((category) =>
    inStockProducts.some((product) => product.category === category.id),
  )
  // Sandbox only (the list is empty in deployed builds). A separate search
  // parameter, so it can't collide with a real category id.
  const showUnpublished = unpublishedProducts.length > 0 && searchParams.has('unpublished')
  const activeCategoryId = showUnpublished
    ? null
    : (availableCategories.find((category) => category.id === searchParams.get('category'))?.id ?? null)
  const visibleProducts = showUnpublished
    ? unpublishedProducts
    : activeCategoryId
      ? inStockProducts.filter((product) => product.category === activeCategoryId)
      : inStockProducts

  return { inStockProducts, availableCategories, showUnpublished, activeCategoryId, visibleProducts }
}

// Router state a store link passes to a product page: the store's search, e.g.
// "?category=bocker", so the product page knows which list it came from.
export interface StoreLinkState {
  storeSearch: string
}

export function readStoreSearch(state: unknown): string {
  const search = (state as Partial<StoreLinkState> | null)?.storeSearch
  return typeof search === 'string' ? search : ''
}
