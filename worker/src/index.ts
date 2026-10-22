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

type Locale = 'sv' | 'en'

// A line item resolved against the in-repo catalog: everything shown or charged
// except the amount, which always comes from the Stripe Price itself.
interface ResolvedLineItem {
  name: string
  vatRate: number
  metadata: Record<string, string>
}

const SHIPPING_LABEL: Record<Locale, string> = { sv: 'Frakt', en: 'Shipping' }

function resolveLineItem(env: Env, stripePriceId: string, locale: Locale): ResolvedLineItem | null {
  const live = env.CATALOG_MODE === 'live'
  const products = live ? liveProducts : sandboxProducts
  const shippingMethod = live ? liveShippingMethod : sandboxShippingMethod

  const product = products.find((entry) => entry.stripePriceId === stripePriceId)
  if (product) {
    return { name: product.name[locale], vatRate: product.vatRate, metadata: { slug: product.slug } }
  }
  // The cart sends the shipping fee as an ordinary line item, so it's resolved here too.
  if (shippingMethod.stripePriceId === stripePriceId) {
    return {
      name: `${SHIPPING_LABEL[locale]} – ${shippingMethod.name[locale]}`,
      vatRate: shippingMethod.vatRate,
      metadata: { shipping_method: shippingMethod.id },
    }
  }
  return null
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
    // Falls back to Swedish rather than rejecting, so a frontend from before
    // locale was sent still checks out.
    let locale: Locale = 'sv'
    try {
      const body = (await request.json()) as { lineItems?: unknown; locale?: unknown }
      lineItems = parseLineItems(body.lineItems)
      if (body.locale === 'en') locale = 'en'
    } catch {
      lineItems = null
    }
    if (!lineItems) {
      return jsonResponse({ error: 'Invalid request body' }, 400, origin)
    }

    // Name and tax rate for each line item are resolved here from the in-repo catalog,
    // never accepted from the request body — the request only carries Price IDs, so a
    // tampered one can't change what's charged, what VAT applies, or what the receipt
    // and packing list say.
    const resolved: ResolvedLineItem[] = []
    for (const item of lineItems) {
      const entry = resolveLineItem(env, item.stripePriceId, locale)
      if (!entry) {
        return jsonResponse({ error: `Unknown price: ${item.stripePriceId}` }, 400, origin)
      }
      resolved.push(entry)
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    })

    let session: Stripe.Checkout.Session
    try {
      // Line items are built with price_data rather than the Price ID because a Price ID
      // always shows its Product's single (Swedish) name. The amount is still the
      // Price's own, read here; the one-off product's metadata links back to the catalog.
      const prices = await Promise.all(lineItems.map((item) => stripe.prices.retrieve(item.stripePriceId)))
      const sessionLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lineItems.map((item, index) => {
        const price = prices[index]!
        const entry = resolved[index]!
        const taxRateId = taxRateIdForVatRate(env, entry.vatRate)
        if (!price.active || price.unit_amount === null || !taxRateId) {
          throw new Error(`Price ${item.stripePriceId} is inactive, has no fixed amount, or has no recognized vatRate`)
        }
        return {
          price_data: {
            currency: price.currency,
            unit_amount: price.unit_amount,
            tax_behavior: 'inclusive',
            product_data: {
              name: entry.name,
              metadata: {
                ...entry.metadata,
                stripe_price_id: price.id,
                stripe_product_id: typeof price.product === 'string' ? price.product : price.product.id,
              },
            },
          },
          quantity: item.quantity,
          tax_rates: [taxRateId],
        }
      })

      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        locale,
        line_items: sessionLineItems,
        shipping_address_collection: { allowed_countries: ['SE'] },
        success_url: `${origin}/checkout/success`,
        cancel_url: `${origin}/checkout/cancel`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create checkout session'
      return jsonResponse({ error: message }, 502, origin)
    }

    if (!session.url) {
      return jsonResponse({ error: 'Stripe did not return a session URL' }, 502, origin)
    }

    return jsonResponse({ url: session.url }, 200, origin)
  },
} satisfies ExportedHandler<Env>
