import { returnAddress } from '../../src/data/returnAddress'

export interface WithdrawEnv {
  RESEND_API_KEY: string
  WITHDRAW_RATE_LIMITER: RateLimit
}

type Locale = 'sv' | 'en'

type Respond = (body: unknown, status: number) => Response

interface Withdrawal {
  name: string
  email: string
  items: string
  orderReference: string
}

// Everything about returns goes to this address, so the shop's mailbox can sort
// it automatically for the retention period in the privacy policy.
const RETURNS_EMAIL = 'retur@svampskogen.com'
// A different address from RETURNS_EMAIL: Gmail can hide incoming mail sent from
// an address the account also sends as, which would swallow the BCC copy.
// Must be on mail.svampskogen.com, the domain verified in Resend.
const FROM = 'Svampskogen <bekraftelse@mail.svampskogen.com>'

const MAX_NAME = 200
const MAX_EMAIL = 254
const MAX_ITEMS = 1000
const MAX_ORDER_REFERENCE = 200

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// The email goes to an address typed into a public form, so links are refused
// to keep it useless for sending spam. Names, products and dates never need one.
const LINK_PATTERN = /:\/\/|\bwww\.|[a-z0-9-]\.(com|se|net|org|info|io|co|ru|xyz|top|biz|shop|site|online)\b/i

// Control characters and line breaks collapse to spaces, so a field can only
// ever be one line of plain text in the email.
function cleanField(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\s\p{Cc}]+/gu, ' ').trim()
}

function parseWithdrawal(body: Record<string, unknown>): Withdrawal | null {
  const withdrawal = {
    name: cleanField(body.name),
    email: cleanField(body.email),
    items: cleanField(body.items),
    orderReference: cleanField(body.orderReference),
  }
  if (
    !withdrawal.name ||
    withdrawal.name.length > MAX_NAME ||
    withdrawal.email.length > MAX_EMAIL ||
    !EMAIL_PATTERN.test(withdrawal.email) ||
    !withdrawal.items ||
    withdrawal.items.length > MAX_ITEMS ||
    withdrawal.orderReference.length > MAX_ORDER_REFERENCE
  ) {
    return null
  }
  return withdrawal
}

function formatReceivedAt(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Stockholm',
  }).format(date)
}

function confirmationEmail(withdrawal: Withdrawal, receivedAt: string, locale: Locale) {
  const { name, email, items, orderReference } = withdrawal
  const address = `${returnAddress.recipient}\n${returnAddress.street}\n${returnAddress.postalCity}`

  // The time received makes each subject unique, so Gmail gives every
  // withdrawal its own thread instead of grouping them by subject.
  if (locale === 'sv') {
    return {
      subject: `Vi har tagit emot att du ångrar ditt köp (${receivedAt})`,
      text: [
        `Hej ${name},`,
        `Vi tog emot ditt meddelande om att ångra köpet den ${receivedAt}.`,
        [`Namn: ${name}`, `E-post: ${email}`, `Det här ångrar du: ${items}`, ...(orderReference ? [`Beställning: ${orderReference}`] : [])].join('\n'),
        `Skicka tillbaka varan utan onödigt dröjsmål och senast 14 dagar efter i dag till:\n${address}`,
        'Du står själv för returfrakten. Du kan också lämna varan i butiken på Claesgatan 8 i Malmö under våra öppettider, som du hittar på svampskogen.com.',
        'Vi betalar tillbaka inom 14 dagar från i dag, med samma betalningssätt som du använde. Vi väntar med återbetalningen tills vi har fått varan eller du har visat att den har skickats.',
        'Det här mejlet bekräftar att ditt meddelande har kommit fram till oss. Har du frågor är det bara att svara på mejlet.',
        'Varma hälsningar,\nSvampskogen',
      ].join('\n\n'),
    }
  }

  return {
    subject: `We've received your cancellation (${receivedAt})`,
    text: [
      `Hi ${name},`,
      `We received your message cancelling your purchase on ${receivedAt}.`,
      [`Name: ${name}`, `Email: ${email}`, `What you're cancelling: ${items}`, ...(orderReference ? [`Order: ${orderReference}`] : [])].join('\n'),
      `Please send the item back without undue delay, and no later than 14 days from today, to:\n${address}`,
      "You pay for the return shipping. You can also drop the item off at the shop on Claesgatan 8 in Malmö during our opening hours, which you'll find at svampskogen.com.",
      "We'll refund you within 14 days from today, using the payment method you paid with. We'll hold the refund until we've received the item or you've shown that it has been sent.",
      "This email confirms that your message has reached us. If you have any questions, just reply to this email.",
      'Warm regards,\nSvampskogen',
    ].join('\n\n'),
  }
}

export async function handleWithdraw(request: Request, env: WithdrawEnv, respond: Respond): Promise<Response> {
  const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const { success: withinLimit } = await env.WITHDRAW_RATE_LIMITER.limit({ key: clientIp })
  if (!withinLimit) return respond({ error: 'rate_limited' }, 429)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return respond({ error: 'invalid' }, 400)
  }

  const withdrawal = parseWithdrawal(body)
  if (!withdrawal) return respond({ error: 'invalid' }, 400)
  if (LINK_PATTERN.test(`${withdrawal.name} ${withdrawal.items} ${withdrawal.orderReference}`)) {
    return respond({ error: 'links' }, 400)
  }

  const locale: Locale = body.locale === 'en' ? 'en' : 'sv'
  const receivedAt = formatReceivedAt(new Date(), locale)
  const { subject, text } = confirmationEmail(withdrawal, receivedAt, locale)

  // One send with a BCC, so the customer's confirmation and the shop's copy can't diverge.
  let sent = false
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [withdrawal.email], bcc: [RETURNS_EMAIL], reply_to: RETURNS_EMAIL, subject, text }),
    })
    sent = response.ok
  } catch {
    sent = false
  }
  if (!sent) return respond({ error: 'send_failed' }, 502)

  return respond({ receivedAt }, 200)
}
