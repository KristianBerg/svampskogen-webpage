import Stripe from 'stripe'

export interface Env {
  STRIPE_SECRET_KEY: string
  SITE_ORIGIN: string
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

// metadata.vat_rate is a plain Stripe metadata string, so it's normalized here rather than
// assumed to be in one format — it may have been written as either "25" or "0.25".
function normalizeVatPercent(raw: string): number | null {
  const value = Number(raw)
  if (!Number.isFinite(value)) return null
  const percent = Math.round(value <= 1 ? value * 100 : value)
  return [6, 12, 25].includes(percent) ? percent : null
}

function taxRateIdForPercent(env: Env, percent: number): string | null {
  switch (percent) {
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

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    })

    let session: Stripe.Checkout.Session
    try {
      // The tax rate for each line item is resolved here from the Price's own metadata,
      // never accepted from the request body — the same trust boundary already used for
      // price itself, so a tampered request can't under-charge VAT.
      const prices = await Promise.all(lineItems.map((item) => stripe.prices.retrieve(item.stripePriceId)))
      const sessionLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lineItems.map((item, index) => {
        const vatRateRaw = prices[index]?.metadata.vat_rate
        const percent = vatRateRaw ? normalizeVatPercent(vatRateRaw) : null
        const taxRateId = percent !== null ? taxRateIdForPercent(env, percent) : null
        if (!taxRateId) {
          throw new Error(`Price ${item.stripePriceId} has no recognized vat_rate metadata`)
        }
        return { price: item.stripePriceId, quantity: item.quantity, tax_rates: [taxRateId] }
      })

      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: sessionLineItems,
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
