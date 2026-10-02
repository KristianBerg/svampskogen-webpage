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

  // Live catalog (products.live.ts), amounts pulled from the live Stripe account.
  price_1ULlXv09vQZGLxR7wyD2J7rh: { amount: 39500, currency: 'sek' }, // notknappare
  price_1ULlkK09vQZGLxR7ajghaWk6: { amount: 16500, currency: 'sek' }, // flaskkork-ekorre
  price_1ULlkM09vQZGLxR7fV715Xdj: { amount: 16500, currency: 'sek' }, // flaskkork-groda
  price_1ULlXy09vQZGLxR7z8K5Gsxu: { amount: 45000, currency: 'sek' }, // skrin-skata
  price_1ULlkF09vQZGLxR7dSzAs50R: { amount: 24500, currency: 'sek' }, // svampkrok-kantarell
  price_1ULlkH09vQZGLxR7o2cVaoY1: { amount: 24500, currency: 'sek' }, // svampkrok-stensopp
  price_1ULlkJ09vQZGLxR73vY6ESHb: { amount: 24500, currency: 'sek' }, // svampkrok-flugsvamp

  // Shipping methods (shippingMethods.ts) — sandbox, then live.
  price_1UM4sb1HnhNtqQNv3Q8EJ6fz: { amount: 6000, currency: 'sek' }, // dhl
  price_1UM70u1HnhNtqQNvfm3JwSPj: { amount: 8000, currency: 'sek' }, // postnord
  price_1UM4sj09vQZGLxR7CQ9r1Xa5: { amount: 6000, currency: 'sek' }, // dhl
  price_1UM70v09vQZGLxR78YxwVPRe: { amount: 8000, currency: 'sek' }, // postnord
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
