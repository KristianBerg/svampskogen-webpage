export interface Price {
  amount: number
  currency: string
}

export interface CheckoutLineItem {
  stripePriceId: string
  quantity: number
}

export interface CheckoutSession {
  url: string
}

// Placeholder prices keyed by Stripe Price ID. Once Phase 1 (real Price
// objects) and Phase 2 (the Cloudflare Worker) exist, swap this function's
// body for a real lookup — callers only depend on the signature below.
const placeholderPrices: Record<string, Price> = {
  price_REPLACE_ME_opinel_knife: { amount: 24900, currency: 'sek' },
  price_REPLACE_ME_basket: { amount: 34900, currency: 'sek' },
  price_REPLACE_ME_dried_chanterelle: { amount: 9900, currency: 'sek' },
  price_REPLACE_ME_growing_kit: { amount: 29900, currency: 'sek' },
  price_REPLACE_ME_book: { amount: 19900, currency: 'sek' },
  price_REPLACE_ME_tote: { amount: 14900, currency: 'sek' },
}

export async function getProductPrice(stripePriceId: string): Promise<Price> {
  return placeholderPrices[stripePriceId] ?? { amount: 0, currency: 'sek' }
}

// Stubbed until the Phase 2 Cloudflare Worker exists to actually call
// stripe.checkout.sessions.create(...). Redirects straight to the success
// page so the cart -> checkout flow is clickable end to end in the meantime.
export async function createCheckoutSession(lineItems: CheckoutLineItem[]): Promise<CheckoutSession> {
  void lineItems
  return { url: '/checkout/success' }
}
