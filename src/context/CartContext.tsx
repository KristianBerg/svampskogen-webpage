import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartContext, type CartItem } from './cartContext'

const STORAGE_KEY = 'svampskogen_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (slug: string, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.slug === slug)
      if (existing) {
        return current.map((item) =>
          item.slug === slug ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...current, { slug, quantity }]
    })
  }

  const removeItem = (slug: string) => {
    setItems((current) => current.filter((item) => item.slug !== slug))
  }

  const setQuantity = (slug: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.slug !== slug)
        : current.map((item) => (item.slug === slug ? { ...item, quantity } : item)),
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
