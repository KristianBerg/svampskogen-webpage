export interface WithdrawalRequest {
  name: string
  email: string
  items: string
  orderReference: string
  locale: 'sv' | 'en'
}

export type WithdrawalResult =
  | { ok: true; receivedAt: string }
  | { ok: false; error: 'invalid' | 'links' | 'failed' }

export async function submitWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResult> {
  try {
    const response = await fetch(`${import.meta.env.VITE_CHECKOUT_WORKER_URL}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    const body = (await response.json()) as { receivedAt?: string; error?: string }
    if (response.ok && body.receivedAt) return { ok: true, receivedAt: body.receivedAt }
    if (body.error === 'invalid' || body.error === 'links') return { ok: false, error: body.error }
    return { ok: false, error: 'failed' }
  } catch {
    return { ok: false, error: 'failed' }
  }
}
