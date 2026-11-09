import Stripe from 'stripe'
import { products } from '../../src/data/products'
import { shippingMethod } from '../../src/data/shippingMethods'
import type { DeliveryMethod } from '../../src/data/shippingMethodTypes'
import { lineItemName, resolveVariantSelection, type VariantSelection } from '../../src/lib/productVariants'
import { handleWithdraw, type WithdrawEnv } from './withdraw'

export interface Env extends WithdrawEnv {
  STRIPE_SECRET_KEY: string
  SITE_ORIGIN: string
  TAX_RATE_6: string
  TAX_RATE_12: string
  TAX_RATE_25: string
}

interface CheckoutLineItem {
  slug: string
  quantity: number
  variants?: VariantSelection
}

type Locale = 'sv' | 'en'

// A line item resolved against the in-repo catalog: everything shown or charged.
interface ResolvedLineItem {
  name: string
  amountOre: number
  vatRate: number
  quantity: number
  metadata: Record<string, string>
  // Only the pickup line may be 0 kr; anything else at 0 is a catalog mistake.
  allowFree?: boolean
}

const SHIPPING_LABEL: Record<Locale, string> = { sv: 'Frakt', en: 'Shipping' }
const PICKUP_LABEL: Record<Locale, string> = { sv: 'Hämtas i butiken', en: 'Pickup in store' }

function resolveProduct(item: CheckoutLineItem, locale: Locale): ResolvedLineItem | null {
  const product = products.find((entry) => entry.slug === item.slug)
  if (!product) return null
  const chosen = resolveVariantSelection(product, item.variants)
  if (!chosen) return null
  return {
    name: lineItemName(product, item.variants, locale),
    amountOre: product.priceOre,
    vatRate: product.vatRate,
    quantity: item.quantity,
    metadata: {
      slug: product.slug,
      ...(chosen.length > 0 && {
        variants: chosen.map(({ category, option }) => `${category.id}=${option.id}`).join(','),
      }),
    },
  }
}

// Added here rather than sent by the cart, so a tampered request can't leave it out.
function resolveShipping(locale: Locale): ResolvedLineItem {
  return {
    name: `${SHIPPING_LABEL[locale]} – ${shippingMethod.name[locale]}`,
    amountOre: shippingMethod.priceOre,
    vatRate: shippingMethod.vatRate,
    quantity: 1,
    metadata: { shipping_method: shippingMethod.id },
  }
}

// A 0 kr line so the receipt and the Stripe order both say the customer picks it up.
// No VAT is charged on 0 kr, but Stripe still needs a tax rate on the line.
function resolvePickup(locale: Locale): ResolvedLineItem {
  return {
    name: PICKUP_LABEL[locale],
    amountOre: 0,
    vatRate: 0.25,
    quantity: 1,
    metadata: { shipping_method: 'pickup' },
    allowFree: true,
  }
}

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

// Each Claude session can run its own frontend on its own port, so a local Worker
// accepts any local origin. Production only ever answers to SITE_ORIGIN.
function allowedOrigin(request: Request, env: Env): string {
  const requestOrigin = request.headers.get('Origin')
  if (LOCAL_ORIGIN.test(env.SITE_ORIGIN) && requestOrigin && LOCAL_ORIGIN.test(requestOrigin)) return requestOrigin
  return env.SITE_ORIGIN
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

function isVariantSelection(value: unknown): value is VariantSelection {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((optionId) => typeof optionId === 'string')
  )
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
      ((entry as Record<string, unknown>).quantity as number) < 1 ||
      ((entry as Record<string, unknown>).variants !== undefined &&
        !isVariantSelection((entry as Record<string, unknown>).variants))
    ) {
      return null
    }
    lineItems.push(entry as CheckoutLineItem)
  }
  return lineItems
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) })
    }

    const url = new URL(request.url)
    if (request.method === 'POST' && url.pathname === '/withdraw') {
      return handleWithdraw(request, env, (body, status) => jsonResponse(body, status, origin))
    }
    if (request.method !== 'POST' || url.pathname !== '/create-checkout-session') {
      return jsonResponse({ error: 'Not found' }, 404, origin)
    }

    let lineItems: CheckoutLineItem[] | null
    // Falls back to Swedish rather than rejecting, so a frontend from before
    // locale was sent still checks out.
    let locale: Locale = 'sv'
    // Anything but an explicit pickup ships, for the same reason.
    let deliveryMethod: DeliveryMethod = 'shipping'
    try {
      const body = (await request.json()) as { lineItems?: unknown; locale?: unknown; deliveryMethod?: unknown }
      lineItems = parseLineItems(body.lineItems)
      if (body.locale === 'en') locale = 'en'
      if (body.deliveryMethod === 'pickup') deliveryMethod = 'pickup'
    } catch {
      lineItems = null
    }
    if (!lineItems) {
      return jsonResponse({ error: 'Invalid request body' }, 400, origin)
    }

    // Amount, name and tax rate for each line item are resolved here from the in-repo
    // catalog, never accepted from the request body. The request only carries slugs,
    // quantities and catalog variant ids, so a tampered one can't change what's charged, what VAT applies, or
    // what the receipt and packing list say.
    const resolved: ResolvedLineItem[] = []
    for (const item of lineItems) {
      const entry = resolveProduct(item, locale)
      if (!entry) {
        return jsonResponse({ error: `Unknown product or variant: ${item.slug}` }, 400, origin)
      }
      resolved.push(entry)
    }
    resolved.push(deliveryMethod === 'pickup' ? resolvePickup(locale) : resolveShipping(locale))

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
        const minAmountOre = entry.allowFree ? 0 : 1
        if (!Number.isInteger(entry.amountOre) || entry.amountOre < minAmountOre || !taxRateId) {
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
        metadata: { delivery_method: deliveryMethod },
        // Checkout always collects an email. Shipping orders get a name with the address;
        // pickup orders ask for one directly so the order can be matched at the counter.
        ...(deliveryMethod === 'shipping'
          ? { shipping_address_collection: { allowed_countries: ['SE'] } }
          : { name_collection: { individual: { enabled: true } } }),
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
