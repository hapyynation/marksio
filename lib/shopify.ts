import { createHmac } from 'crypto'

export const SHOPIFY_API = '2024-10'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShopifyProduct {
  id: number
  title: string
  body_html?: string
  vendor?: string
  product_type?: string
  handle?: string
  status?: string
  tags?: string
  images: Array<{ src: string; position: number }>
  variants: Array<{
    id: number
    title: string
    price: string
    compare_at_price?: string | null
    inventory_quantity?: number
    sku?: string
  }>
}

export interface ShopifyCustomer {
  id: number
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  orders_count: number
  total_spent: string
  last_order_name?: string | null
  tags?: string
  created_at?: string
}

export interface ShopifyOrder {
  id: number
  name: string
  created_at: string
  financial_status?: string
  fulfillment_status?: string | null
  total_price?: string
  subtotal_price?: string
  total_discounts?: string
  total_shipping_price_set?: { shop_money?: { amount?: string } }
  currency?: string
  customer?: { id?: number; email?: string; first_name?: string; last_name?: string }
  shipping_address?: { city?: string; country_code?: string }
  line_items?: Array<{
    id: number; title: string; variant_title?: string
    quantity: number; price?: string; product_id?: number
  }>
}

export interface ShopifyCheckout {
  id: number
  token?: string
  email?: string
  created_at?: string
  updated_at?: string
  completed_at?: string | null
  abandoned_checkout_url?: string
  total_price?: string
  currency?: string
  line_items?: Array<{
    id: number; title: string; quantity: number
    price?: string; product_id?: number
  }>
}

export interface SyncMeta {
  shopName?: string
  webhooksRegistered?: boolean
  syncInProgress?: boolean
  lastSync?: {
    customers: number
    orders: number
    products: number
    abandonedCarts: number
    completedAt: string
    durationMs: number
  }
}

// ── API Client ────────────────────────────────────────────────────────────────

export async function shopifyFetch<T = unknown>(
  domain: string,
  token: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `https://${domain}/admin/api/${SHOPIFY_API}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Shopify ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

// Cursor-based pagination — fetches all pages
export async function shopifyFetchAll<T>(
  domain: string,
  token: string,
  initialPath: string,
  resourceKey: string,
): Promise<T[]> {
  const results: T[] = []
  const sep = initialPath.includes('?') ? '&' : '?'
  let url: string | null = `https://${domain}/admin/api/${SHOPIFY_API}${initialPath}${sep}limit=250`

  while (url) {
    const res: Response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    })
    if (!res.ok) break

    const data = (await res.json()) as Record<string, unknown>
    const items = (data[resourceKey] as T[]) ?? []
    results.push(...items)

    const link = res.headers.get('link') ?? ''
    const next = link.match(/<([^>]+)>;\s*rel="next"/)
    url = next ? next[1] : null
  }

  return results
}

// ── Webhook Registration ──────────────────────────────────────────────────────

const WEBHOOK_TOPICS = [
  'orders/create',
  'orders/updated',
  'customers/create',
  'customers/update',
  'checkouts/create',
  'checkouts/update',
  'products/create',
  'products/update',
  'app/uninstalled',
] as const

export type WebhookRegistrationResult = {
  topic: string
  success: boolean
  error?: string
}

export async function registerWebhooks(
  domain: string,
  token: string,
  appBaseUrl: string,
): Promise<WebhookRegistrationResult[]> {
  const address = `${appBaseUrl}/api/webhooks/shopify`

  const existing = await shopifyFetch<{ webhooks: Array<{ id: number; topic: string }> }>(
    domain, token, '/webhooks.json',
  ).catch(() => ({ webhooks: [] }))

  const existingTopics = new Set(existing.webhooks.map((w) => w.topic))
  const toRegister = WEBHOOK_TOPICS.filter((t) => !existingTopics.has(t))

  const results = await Promise.allSettled(
    toRegister.map((topic) =>
      shopifyFetch(domain, token, '/webhooks.json', {
        method: 'POST',
        body: JSON.stringify({ webhook: { topic, address, format: 'json' } }),
      }),
    ),
  )

  return toRegister.map((topic, i) => {
    const r = results[i]
    if (r.status === 'fulfilled') return { topic, success: true }
    return { topic, success: false, error: String((r as PromiseRejectedResult).reason) }
  })
}

/**
 * Shopify mağazasına Script Tag ekle.
 * Script Tag sayfa yüklendiğinde /api/track/visit endpoint'ini çağırır.
 * Canlı Takip sayfası için gerçek ziyaretçi verisi toplar.
 */
export async function registerScriptTag(
  domain: string,
  token: string,
  appBaseUrl: string,
): Promise<void> {
  const scriptSrc = `${appBaseUrl}/shopify-pixel.js`

  // Mevcut script tag'leri kontrol et
  const existing = await shopifyFetch<{ script_tags: Array<{ id: number; src: string }> }>(
    domain, token, '/script_tags.json',
  ).catch(() => ({ script_tags: [] }))

  const alreadyInstalled = existing.script_tags.some(s => s.src.includes('/shopify-pixel.js'))
  if (alreadyInstalled) return

  await shopifyFetch(domain, token, '/script_tags.json', {
    method: 'POST',
    body: JSON.stringify({
      script_tag: {
        event: 'onload',
        src: scriptSrc,
        display_scope: 'online_store',
      },
    }),
  }).catch(() => null)
}

// ── Security ──────────────────────────────────────────────────────────────────

export function verifyWebhookHmac(body: string, hmacHeader: string, secret: string): boolean {
  if (!secret || !hmacHeader) return false
  const hash = createHmac('sha256', secret).update(body, 'utf8').digest('base64')
  return hash === hmacHeader
}

export function verifyOAuthHmac(params: URLSearchParams, secret: string): boolean {
  const hmac = params.get('hmac') ?? ''
  const pairs: string[] = []
  params.forEach((value, key) => { if (key !== 'hmac') pairs.push(`${key}=${value}`) })
  pairs.sort()
  const message = pairs.join('&')
  const computed = createHmac('sha256', secret).update(message).digest('hex')
  return computed === hmac
}

// ── Business Logic Helpers ────────────────────────────────────────────────────

export function classifySegment(opts: {
  totalOrders: number
  totalSpent: number
  lastOrderAt?: Date | null
}): string {
  const { totalOrders, totalSpent, lastOrderAt } = opts
  if (totalOrders >= 5 || totalSpent >= 5000) return 'vip'
  if (totalOrders >= 3) return 'loyal'
  if (totalOrders >= 1 && lastOrderAt) {
    const days = (Date.now() - lastOrderAt.getTime()) / 86_400_000
    if (days > 90) return 'inactive'
    if (days > 60) return 'at_risk'
    return 'loyal'
  }
  return 'new'
}

export function mapFulfillmentStatus(status?: string | null): string {
  if (!status) return 'confirmed'
  if (status === 'fulfilled') return 'delivered'
  if (status === 'partial') return 'shipped'
  return 'confirmed'
}

export function getCustomerName(c: {
  first_name?: string; last_name?: string; email?: string
}): string {
  return `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || (c.email ?? 'Müşteri')
}

// Derive product category from Shopify product_type / tags
export function detectProductCategory(p: ShopifyProduct): string {
  const raw = `${p.product_type ?? ''} ${p.tags ?? ''}`.toLowerCase()
  if (/giy|cloth|shirt|tshirt|dress|jean|fashion|moda/.test(raw)) return 'fashion'
  if (/cilt|serum|krem|beauty|skin|kozmetik|parfüm/.test(raw)) return 'skincare'
  if (/elektronik|tech|phone|laptop|bilgisayar|tablet/.test(raw)) return 'tech'
  if (/gaming|oyun|gamer/.test(raw)) return 'gaming'
  if (/mobilya|furniture|ev|home|dekor/.test(raw)) return 'furniture'
  if (/takı|jewelry|gold|silver|saat|watch/.test(raw)) return 'luxury'
  if (/bebek|çocuk|baby|kid/.test(raw)) return 'baby'
  if (/kitap|book|eğitim|kurs/.test(raw)) return 'education'
  return 'general'
}
