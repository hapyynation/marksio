import crypto from 'crypto'

export const LS_API_URL = 'https://api.lemonsqueezy.com/v1'

// Strip BOM (U+FEFF) and whitespace that PowerShell pipe can prepend
function env(key: string): string {
  return (process.env[key] ?? '').replace(/^﻿/, '').trim()
}

// plan id → Lemon Squeezy variant ID
export const VARIANT_IDS: Record<string, string> = {
  starter: env('LS_VARIANT_STARTER'),
  growth:  env('LS_VARIANT_GROWTH'),
  agency:  env('LS_VARIANT_AGENCY'),
}

// Lemon Squeezy variant ID → internal plan name
export const VARIANT_TO_PLAN: Record<string, string> = {
  '1741638': 'starter',
  '1741701': 'growth',
  '1741713': 'agency',
}

function lsHeaders() {
  return {
    Authorization: `Bearer ${env('LEMONSQUEEZY_API_KEY')}`,
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  }
}

// Cache store ID so we only call the API once per process lifetime
let cachedStoreId: string | null = null

async function getStoreId(): Promise<string> {
  // 1. Use env var if set
  const fromEnv = env('LEMONSQUEEZY_STORE_ID')
  if (fromEnv) return fromEnv

  // 2. Already fetched
  if (cachedStoreId) return cachedStoreId

  // 3. Fetch from LS API
  const res = await fetch(`${LS_API_URL}/stores`, { headers: lsHeaders() })
  if (!res.ok) throw new Error(`Store listesi alınamadı (${res.status})`)

  const json = await res.json() as { data: Array<{ id: string }> }
  const first = json.data?.[0]?.id
  if (!first) throw new Error('Lemon Squeezy hesabında mağaza bulunamadı')

  cachedStoreId = first
  return first
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
  const storeId = await getStoreId()

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
          product_options: {
            redirect_url: params.successUrl,
          },
          checkout_options: {
            embed: false,
          },
          expires_at: null,
        },
        relationships: {
          store: {
            data: { type: 'stores', id: storeId },
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
    throw new Error(`Lemon Squeezy checkout hatası (${res.status}): ${errText.slice(0, 300)}`)
  }

  const json = await res.json() as { data: { id: string; attributes: { url: string } } }
  return {
    id:  json.data.id,
    url: json.data.attributes.url,
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = env('LEMONSQUEEZY_WEBHOOK_SECRET')
  if (!secret) return false
  const cleanSig = signature.replace(/^﻿/, '').trim()
  const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (hash.length !== cleanSig.length) return false
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(cleanSig, 'hex'))
}
