import { createContext } from 'react'
import type { DeliveryMethod } from '../data/shippingMethods'
import type { VariantSelection } from '../lib/productVariants'

export interface CartItem {
  slug: string
  quantity: number
  variants?: VariantSelection
}

// Identifies a cart line: the same product in another color is a separate line.
export function cartItemKey({ slug, variants = {} }: Pick<CartItem, 'slug' | 'variants'>): string {
  const choices = Object.keys(variants)
    .sort()
    .map((category) => `${category}=${variants[category]}`)
  return [slug, ...choices].join('|')
}

export interface CartContextValue {
  items: CartItem[]
  itemCount: number
  addItem: (slug: string, quantity?: number, variants?: VariantSelection) => void
  // Both take a line's cartItemKey.
  removeItem: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  clear: () => void
  deliveryMethod: DeliveryMethod
  setDeliveryMethod: (method: DeliveryMethod) => void
}

export const CartContext = createContext<CartContextValue | null>(null)
