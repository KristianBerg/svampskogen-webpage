import { createContext } from 'react'

export interface CartItem {
  slug: string
  quantity: number
}

export interface CartContextValue {
  items: CartItem[]
  itemCount: number
  addItem: (slug: string, quantity?: number) => void
  removeItem: (slug: string) => void
  setQuantity: (slug: string, quantity: number) => void
  clear: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
