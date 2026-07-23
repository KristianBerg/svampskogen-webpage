import { useEffect, useState } from 'react'
import { getProductPrice, type Price } from '../lib/stripe'

export function useProductPrices(stripePriceIds: string[]): Record<string, Price> {
  const [prices, setPrices] = useState<Record<string, Price>>({})
  const key = stripePriceIds.join(',')

  useEffect(() => {
    let cancelled = false
    void Promise.all(
      stripePriceIds.map((id) => getProductPrice(id).then((price) => [id, price] as const)),
    ).then((entries) => {
      if (!cancelled) setPrices(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
    // stripePriceIds is re-derived from `key` each render; keying on the
    // joined string avoids re-fetching for an array literal that changed
    // identity but not contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return prices
}
