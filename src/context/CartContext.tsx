import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { products } from '../data/products'
import { resolveVariantSelection, type VariantSelection } from '../lib/productVariants'
import { CartContext, cartItemKey, type CartItem } from './cartContext'

const STORAGE_KEY = 'svampskogen_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const saved = raw ? (JSON.parse(raw) as CartItem[]) : []
    // A saved line goes if its product's variants have since changed, since
    // the Worker would refuse the whole checkout over it.
    return saved.filter((item) => {
      const product = products.find((candidate) => candidate.slug === item.slug)
      return !product || resolveVariantSelection(product, item.variants) !== null
    })
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (slug: string, quantity = 1, variants?: VariantSelection) => {
    const key = cartItemKey({ slug, variants })
    setItems((current) => {
      if (current.some((item) => cartItemKey(item) === key)) {
        return current.map((item) =>
          cartItemKey(item) === key ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...current, { slug, quantity, variants }]
    })
  }

  const removeItem = (key: string) => {
    setItems((current) => current.filter((item) => cartItemKey(item) !== key))
  }

  const setQuantity = (key: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => cartItemKey(item) !== key)
        : current.map((item) => (cartItemKey(item) === key ? { ...item, quantity } : item)),
    )
  }

  const clear = () => setItems([])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const value = useMemo(
    () => ({ items, itemCount, addItem, removeItem, setQuantity, clear }),
    [items, itemCount],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
