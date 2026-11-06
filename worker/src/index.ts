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
  slug: string
  quantity: number
}

type Locale = 'sv' | 'en'

// A line item resolved against the in-repo catalog: everything shown or charged.
interface ResolvedLineItem {
  name: string
  amountOre: number
  vatRate: number
  quantity: number
  metadata: Record<string, string>
}

const SHIPPING_LABEL: Record<Locale, string> = { sv: 'Frakt', en: 'Shipping' }

function resolveProduct(env: Env, item: CheckoutLineItem, locale: Locale): ResolvedLineItem | null {
  const products = env.CATALOG_MODE === 'live' ? liveProducts : sandboxProducts
  const product = products.find((entry) => entry.slug === item.slug)
  if (!product) return null
  return {
    name: product.name[locale],
    amountOre: product.priceOre,
    vatRate: product.vatRate,
    quantity: item.quantity,
    metadata: { slug: product.slug },
  }
}

// Added here rather than sent by the cart, so a tampered request can't leave it out.
function resolveShipping(env: Env, locale: Locale): ResolvedLineItem {
  const shippingMethod = env.CATALOG_MODE === 'live' ? liveShippingMethod : sandboxShippingMethod
  return {
    name: `${SHIPPING_LABEL[locale]} – ${shippingMethod.name[locale]}`,
    amountOre: shippingMethod.priceOre,
    vatRate: shippingMethod.vatRate,
    quantity: 1,
    metadata: { shipping_method: shippingMethod.id },
  }
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
      typeof (entry as Record<string, unknown>).slug !== 'string' ||
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

    // Amount, name and tax rate for each line item are resolved here from the in-repo
    // catalog, never accepted from the request body. The request only carries slugs and
    // quantities, so a tampered one can't change what's charged, what VAT applies, or
    // what the receipt and packing list say.
    const resolved: ResolvedLineItem[] = []
    for (const item of lineItems) {
      const entry = resolveProduct(env, item, locale)
      if (!entry) {
        return jsonResponse({ error: `Unknown product: ${item.slug}` }, 400, origin)
      }
      resolved.push(entry)
    }
    resolved.push(resolveShipping(env, locale))

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    })

    let session: Stripe.Checkout.Session
    try {
      // Each line item is a one-off product built with price_data, which lets its name
      // follow the customer's language. Its metadata links back to the catalog.
      const sessionLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = resolved.map((entry) => {
        const taxRateId = taxRateIdForVatRate(env, entry.vatRate)
        // Stripe would accept 0 and hand the item out for free, so it's stopped here.
        if (!Number.isInteger(entry.amountOre) || entry.amountOre <= 0 || !taxRateId) {
          throw new Error(`Line item "${entry.name}" has an invalid price or no recognized vatRate`)
        }
        return {
          price_data: {
            currency: 'sek',
            unit_amount: entry.amountOre,
            tax_behavior: 'inclusive',
            product_data: { name: entry.name, metadata: entry.metadata },
          },
          quantity: entry.quantity,
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
