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

// Real Stripe test-mode Price objects (Phase 1 done), keyed by Price ID.
// Amounts are duplicated here rather than fetched live because there's no
// backend yet (Phase 2, the Cloudflare Worker) to call Stripe with the
// secret key — swap this function's body for a real lookup once that exists.
const placeholderPrices: Record<string, Price> = {
  price_1U1QcP1HnhNtqQNvxC61NKYx: { amount: 24900, currency: 'sek' }, // opinel-svampkniv
  price_1U1QcU1HnhNtqQNvKtmhEpdh: { amount: 34900, currency: 'sek' }, // flatad-svampkorg
  price_1U1QcW1HnhNtqQNvIVGkrz0t: { amount: 9900, currency: 'sek' }, // torkad-kantarell
  price_1U1QcX1HnhNtqQNvSGUknyg0: { amount: 29900, currency: 'sek' }, // odlingskit-ostronskivling
  price_1U1QcZ1HnhNtqQNvNnw8BWxj: { amount: 19900, currency: 'sek' }, // svampboken-faltguide
  price_1U1Qca1HnhNtqQNvsgh5RICZ: { amount: 14900, currency: 'sek' }, // tygkasse-med-tryck
}

export async function getProductPrice(stripePriceId: string): Promise<Price> {
  return placeholderPrices[stripePriceId] ?? { amount: 0, currency: 'sek' }
}

export async function createCheckoutSession(lineItems: CheckoutLineItem[]): Promise<CheckoutSession> {
  const response = await fetch(`${import.meta.env.VITE_CHECKOUT_WORKER_URL}/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineItems }),
  })
  if (!response.ok) {
    throw new Error('Failed to create checkout session')
  }
  return (await response.json()) as CheckoutSession
}
