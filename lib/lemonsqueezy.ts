import crypto from 'crypto'

export const LS_API_URL = 'https://api.lemonsqueezy.com/v1'

// plan id → Lemon Squeezy variant ID
export const VARIANT_IDS: Record<string, string> = {
  starter: process.env.LS_VARIANT_STARTER ?? '1741638',
  growth:  process.env.LS_VARIANT_GROWTH  ?? '1741701',
  agency:  process.env.LS_VARIANT_AGENCY  ?? '1741713',
}

// Lemon Squeezy variant ID → internal plan name
export const VARIANT_TO_PLAN: Record<string, string> = {
  '1741638': 'starter',
  '1741701': 'growth',
  '1741713': 'agency',
}

function lsHeaders() {
  return {
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  }
}

export interface CheckoutResult {
  url: string
  id: string
}

export async function createCheckout(params: {
  variantId: string
  userEmail: string
  userName: string
  userId: string
  successUrl: string
  cancelUrl: string
}): Promise<CheckoutResult> {
  const res = await fetch(`${LS_API_URL}/checkouts`, {
    method: 'POST',
    headers: lsHeaders(),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: params.userEmail,
            name:  params.userName,
            custom: { user_id: params.userId },
          },
          checkout_options: {
            success_url: params.successUrl,
            cancel_url:  params.cancelUrl,
            embed: false,
          },
          expires_at: null,
        },
        relationships: {
          store: {
            data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID },
          },
          variant: {
            data: { type: 'variants', id: params.variantId },
          },
        },
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`Lemon Squeezy checkout hatası (${res.status}): ${errText.slice(0, 200)}`)
  }

  const json = await res.json() as { data: { id: string; attributes: { url: string } } }
  return {
    id:  json.data.id,
    url: json.data.attributes.url,
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) return false
  const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
}
