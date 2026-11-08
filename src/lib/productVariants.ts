import type { Product, ProductVariantCategory, ProductVariantOption } from '../data/productTypes'

// Category id -> option id, e.g. { farg: 'bla', broderi: 'kantarell' }.
export type VariantSelection = Record<string, string>

export interface ChosenVariant {
  category: ProductVariantCategory
  option: ProductVariantOption
}

// Shared with the Worker, which is what actually enforces this. Returns the
// choices in catalog order, or null unless the selection picks exactly one
// existing option in every category. A product without variants resolves to [].
export function resolveVariantSelection(product: Product, selection: VariantSelection = {}): ChosenVariant[] | null {
  const categories = product.variants ?? []
  if (Object.keys(selection).length !== categories.length) return null

  const chosen: ChosenVariant[] = []
  for (const category of categories) {
    const option = category.options.find((candidate) => candidate.id === selection[category.id])
    if (!option) return null
    chosen.push({ category, option })
  }
  return chosen
}

// The title of a cart, order or Stripe line: "Foraging bag (Blue, Chanterelle)".
export function lineItemName(product: Product, selection: VariantSelection | undefined, locale: 'sv' | 'en'): string {
  const chosen = resolveVariantSelection(product, selection) ?? []
  if (chosen.length === 0) return product.name[locale]
  return `${product.name[locale]} (${chosen.map(({ option }) => option.name[locale]).join(', ')})`
}
