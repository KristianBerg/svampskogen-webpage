import Stripe from 'stripe'
import { products as liveProducts } from '../../src/data/products.live'
import { products as sandboxProducts } from '../../src/data/products.sandbox'
import { shippingMethod as liveShippingMethod } from '../../src/data/shippingMethods.live'
import { shippingMethod as sandboxShippingMethod } from '../../src/data/shippingMethods.sandbox'

export interface Env {
  STRIPE_SECRET_KEY: string
  SITE_ORIGIN: string
  // Which in-repo catalog to resolve line items against. Must match the Stripe mode of
  // STRIPE_SECRET_KEY, the same way the frontend's VITE_CATALOG_MODE does.
  CATALOG_MODE: 'sandbox' | 'live'
  TAX_RATE_6: string
  TAX_RATE_12: string
  TAX_RATE_25: string
}

interface CheckoutLineItem {
  stripePriceId: string
  quantity: number
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function jsonResponse(body: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

function taxRateIdForVatRate(env: Env, vatRate: number): string | null {
  switch (Math.round(vatRate * 100)) {
    case 6:
      return env.TAX_RATE_6
    case 12:
      return env.TAX_RATE_12
    case 25:
      return env.TAX_RATE_25
    default:
      return null
  }
}

function parseLineItems(value: unknown): CheckoutLineItem[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const lineItems: CheckoutLineItem[] = []
  for (const entry of value) {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof (entry as Record<string, unknown>).stripePriceId !== 'string' ||
      !Number.isInteger((entry as Record<string, unknown>).quantity) ||
      ((entry as Record<string, unknown>).quantity as number) < 1
    ) {
      return null
    }
    lineItems.push(entry as CheckoutLineItem)
  }
  return lineItems
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.SITE_ORIGIN

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) })
    }

    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== '/create-checkout-session') {
      return jsonResponse({ error: 'Not found' }, 404, origin)
    }

    let lineItems: CheckoutLineItem[] | null
    try {
      const body = (await request.json()) as { lineItems?: unknown }
      lineItems = parseLineItems(body.lineItems)
    } catch {
      lineItems = null
    }
    if (!lineItems) {
      return jsonResponse({ error: 'Invalid request body' }, 400, origin)
    }

    // The tax rate for each line item is resolved here from the in-repo catalog's vatRate,
    // never accepted from the request body — the same trust boundary already used for
    // price itself, so a tampered request can't under-charge VAT.
    // The cart sends the shipping fee as an ordinary line item, so it's resolved the same way.
    const catalog =
      env.CATALOG_MODE === 'live'
        ? [...liveProducts, liveShippingMethod]
        : [...sandboxProducts, sandboxShippingMethod]
    const sessionLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    for (const item of lineItems) {
      const entry = catalog.find((candidate) => candidate.stripePriceId === item.stripePriceId)
      if (!entry) {
        return jsonResponse({ error: `Unknown price: ${item.stripePriceId}` }, 400, origin)
      }
      const taxRateId = taxRateIdForVatRate(env, entry.vatRate)
      if (!taxRateId) {
        return jsonResponse({ error: `Price ${item.stripePriceId} has no recognized vatRate` }, 500, origin)
      }
      sessionLineItems.push({ price: item.stripePriceId, quantity: item.quantity, tax_rates: [taxRateId] })
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    })

    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: sessionLineItems,
        shipping_address_collection: { allowed_countries: ['SE'] },
        success_url: `${origin}/checkout/success`,
        cancel_url: `${origin}/checkout/cancel`,
      })
    } catch (error) {
      const message = error instanceof Stripe.errors.StripeError ? error.message : 'Failed to create checkout session'
      return jsonResponse({ error: message }, 502, origin)
    }

    if (!session.url) {
      return jsonResponse({ error: 'Stripe did not return a session URL' }, 502, origin)
    }

    return jsonResponse({ url: session.url }, 200, origin)
  },
} satisfies ExportedHandler<Env>
