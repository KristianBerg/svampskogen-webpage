import type { VariantSelection } from './productVariants'

export interface CheckoutLineItem {
  slug: string
  quantity: number
  variants?: VariantSelection
}

export interface CheckoutSession {
  url: string
}

// Checkout's language; the Worker uses it for both Stripe's own UI and the
// line item names it builds from the catalog.
export type CheckoutLocale = 'sv' | 'en'

export async function createCheckoutSession(
  lineItems: CheckoutLineItem[],
  locale: CheckoutLocale,
): Promise<CheckoutSession> {
  const response = await fetch(`${import.meta.env.VITE_CHECKOUT_WORKER_URL}/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineItems, locale }),
  })
  if (!response.ok) {
    throw new Error('Failed to create checkout session')
  }
  return (await response.json()) as CheckoutSession
}
