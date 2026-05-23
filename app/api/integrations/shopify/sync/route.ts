import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

const SHOPIFY_API = '2024-01'

async function shopifyFetch(domain: string, token: string, path: string) {
  const res = await fetch(`https://${domain}/admin/api/${SHOPIFY_API}${path}`, {
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`)
  return res.json()
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const integration = await prisma.integration.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: 'shopify' } },
  })

  if (!integration?.shopDomain || !integration.accessToken) {
    return NextResponse.json({ error: 'Shopify bağlantısı bulunamadı' }, { status: 404 })
  }

  const { domain, token } = { domain: integration.shopDomain, token: integration.accessToken }
  let customersUpserted = 0
  let ordersUpserted = 0

  try {
    // ── 1. Müşterileri çek ────────────────────────────────────────────────
    let customerUrl = `/customers.json?limit=250`
    while (customerUrl) {
      const data = await shopifyFetch(domain, token, customerUrl)
      const customers: ShopifyCustomer[] = data.customers ?? []

      for (const c of customers) {
        const email = c.email?.toLowerCase()
        if (!email) continue

        await prisma.customer.upsert({
          where: { userId_email: { userId: session.user.id, email } },
          create: {
            userId: session.user.id,
            name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || email,
            email,
            phone: c.phone ?? null,
            platformId: String(c.id),
            source: 'shopify',
            totalOrders: c.orders_count ?? 0,
            totalSpent: parseFloat(c.total_spent ?? '0'),
            avgOrder: c.orders_count > 0 ? parseFloat(c.total_spent ?? '0') / c.orders_count : 0,
            lastOrder: c.last_order_name ? new Date() : null,
            segment: classifySegment(c),
          },
          update: {
            name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || email,
            phone: c.phone ?? null,
            platformId: String(c.id),
            source: 'shopify',
            totalOrders: c.orders_count ?? 0,
            totalSpent: parseFloat(c.total_spent ?? '0'),
            avgOrder: c.orders_count > 0 ? parseFloat(c.total_spent ?? '0') / c.orders_count : 0,
            segment: classifySegment(c),
          },
        })
        customersUpserted++
      }

      // Pagination
      customerUrl = '' // SQLite'da link header parse etmek zor, single page yeterli MVP için
    }

    // ── 2. Siparişleri çek ────────────────────────────────────────────────
    const ordersData = await shopifyFetch(domain, token, `/orders.json?limit=250&status=any`)
    const orders: ShopifyOrder[] = ordersData.orders ?? []

    for (const o of orders) {
      const customerEmail = o.customer?.email?.toLowerCase()
      if (!customerEmail) continue

      const customer = await prisma.customer.findUnique({
        where: { userId_email: { userId: session.user.id, email: customerEmail } },
      })
      if (!customer) continue

      // Upsert order
      const existingOrder = await prisma.order.findUnique({
        where: { userId_platformOrderId: { userId: session.user.id, platformOrderId: String(o.id) } },
      })

      if (!existingOrder) {
        const order = await prisma.order.create({
          data: {
            userId: session.user.id,
            integrationId: integration.id,
            customerId: customer.id,
            platformOrderId: String(o.id),
            orderNumber: o.name,
            status: mapOrderStatus(o.fulfillment_status),
            financialStatus: o.financial_status,
            total: parseFloat(o.total_price ?? '0'),
            subtotal: parseFloat(o.subtotal_price ?? '0'),
            shipping: parseFloat(o.total_shipping_price_set?.shop_money?.amount ?? '0'),
            discount: parseFloat(o.total_discounts ?? '0'),
            currency: o.currency ?? 'TRY',
            shippingCity: o.shipping_address?.city ?? null,
            shippingCountry: o.shipping_address?.country_code ?? null,
            placedAt: new Date(o.created_at),
          },
        })

        // Order items
        for (const li of (o.line_items ?? [])) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              platformId: String(li.id),
              title: li.title,
              variantTitle: li.variant_title ?? null,
              quantity: li.quantity,
              price: parseFloat(li.price ?? '0'),
              imageUrl: null,
            },
          })
        }

        // CustomerEvent: order_placed
        await prisma.customerEvent.create({
          data: {
            userId: session.user.id,
            customerId: customer.id,
            orderId: order.id,
            type: 'order_placed',
            source: 'shopify',
            data: JSON.stringify({ orderNumber: o.name, total: o.total_price, currency: o.currency }),
          },
        })

        ordersUpserted++
      }
    }

    // ── 3. lastSyncAt güncelle ──────────────────────────────────────────
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date(), status: 'active' },
    })

    return NextResponse.json({
      success: true,
      customersUpserted,
      ordersUpserted,
      message: `${customersUpserted} müşteri, ${ordersUpserted} sipariş senkronize edildi.`,
    })
  } catch (err) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'error' },
    })
    console.error('Shopify sync error:', err)
    return NextResponse.json({ error: 'Senkronizasyon hatası' }, { status: 500 })
  }
}

// ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────

interface ShopifyCustomer {
  id: number
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  orders_count: number
  total_spent: string
  last_order_name?: string
}

interface ShopifyOrder {
  id: number
  name: string
  created_at: string
  financial_status?: string
  fulfillment_status?: string
  total_price?: string
  subtotal_price?: string
  total_discounts?: string
  currency?: string
  total_shipping_price_set?: { shop_money?: { amount?: string } }
  customer?: { email?: string }
  shipping_address?: { city?: string; country_code?: string }
  line_items?: Array<{
    id: number; title: string; variant_title?: string
    quantity: number; price?: string
  }>
}

function mapOrderStatus(fulfillment?: string | null): string {
  if (!fulfillment) return 'confirmed'
  if (fulfillment === 'fulfilled') return 'delivered'
  if (fulfillment === 'partial') return 'shipped'
  return 'confirmed'
}

function classifySegment(c: ShopifyCustomer): string {
  if (c.orders_count >= 5) return 'vip'
  if (c.orders_count >= 3) return 'loyal'
  if (c.orders_count === 0) return 'new'
  return 'new'
}
