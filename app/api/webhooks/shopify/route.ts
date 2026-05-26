import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyWebhookHmac,
  classifySegment,
  mapFulfillmentStatus,
  getCustomerName,
  detectProductCategory,
  type ShopifyProduct,
} from '@/lib/shopify'

export async function POST(req: NextRequest) {
  const topic = req.headers.get('x-shopify-topic') ?? ''
  const shopDomain = req.headers.get('x-shopify-shop-domain') ?? ''
  const hmac = req.headers.get('x-shopify-hmac-sha256') ?? ''

  const rawBody = await req.text()

  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (webhookSecret && !verifyWebhookHmac(rawBody, hmac, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // İlgili integration'ı bul
  const integration = await prisma.integration.findFirst({
    where: { shopDomain, platform: 'shopify', status: 'active' },
  })
  if (!integration) return NextResponse.json({ ok: true }) // Bilmediğimiz mağaza, sessizce geç

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const userId = integration.userId

  try {
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
        await handleOrder(userId, integration.id, payload)
        break

      case 'customers/create':
      case 'customers/update':
        await handleCustomer(userId, payload)
        break

      case 'checkouts/create':
      case 'checkouts/update':
        await handleCheckout(userId, payload)
        break

      case 'products/create':
      case 'products/update':
        await handleProduct(userId, payload)
        break

      default:
        break
    }
  } catch (err) {
    console.error(`Shopify webhook error [${topic}]:`, err)
  }

  return NextResponse.json({ ok: true })
}

// ─── Sipariş event handler ─────────────────────────────────────────────────

async function handleOrder(userId: string, integrationId: string, o: Record<string, unknown>) {
  const customerEmail = (o.customer as Record<string, unknown> | undefined)?.email as string | undefined
  if (!customerEmail) return

  // Müşteriyi bul/oluştur
  const customer = await prisma.customer.upsert({
    where: { userId_email: { userId, email: customerEmail.toLowerCase() } },
    create: {
      userId,
      name: getCustomerName(o.customer as Record<string, unknown>),
      email: customerEmail.toLowerCase(),
      source: 'shopify',
    },
    update: {},
  })

  const platformOrderId = String(o.id)

  // Sipariş var mı?
  const existing = await prisma.order.findUnique({
    where: { userId_platformOrderId: { userId, platformOrderId } },
  })

  const orderData = {
    status: mapFulfillmentStatus(o.fulfillment_status as string | undefined | null),
    financialStatus: o.financial_status as string | null,
    total: parseFloat((o.total_price as string) ?? '0'),
    subtotal: parseFloat((o.subtotal_price as string) ?? '0'),
    discount: parseFloat((o.total_discounts as string) ?? '0'),
    currency: (o.currency as string) ?? 'TRY',
  }

  if (!existing) {
    const order = await prisma.order.create({
      data: {
        userId,
        integrationId,
        customerId: customer.id,
        platformOrderId,
        orderNumber: o.name as string,
        placedAt: new Date((o.created_at as string) ?? Date.now()),
        ...orderData,
      },
    })

    // Line items
    const lineItems = (o.line_items as Array<Record<string, unknown>>) ?? []
    for (const li of lineItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          platformId: String(li.id),
          title: li.title as string,
          variantTitle: (li.variant_title as string | null) ?? null,
          quantity: (li.quantity as number) ?? 1,
          price: parseFloat((li.price as string) ?? '0'),
        },
      })
    }

    // CustomerEvent: order_placed
    await prisma.customerEvent.create({
      data: {
        userId,
        customerId: customer.id,
        orderId: order.id,
        type: 'order_placed',
        source: 'shopify',
        data: JSON.stringify({ orderNumber: o.name, total: o.total_price, currency: o.currency }),
      },
    })

    // Müşteri istatistiklerini güncelle
    await updateCustomerStats(userId, customer.id)
  } else {
    await prisma.order.update({ where: { id: existing.id }, data: orderData })
  }
}

// ─── Müşteri event handler ─────────────────────────────────────────────────

async function handleCustomer(userId: string, c: Record<string, unknown>) {
  const email = (c.email as string | undefined)?.toLowerCase()
  if (!email) return

  await prisma.customer.upsert({
    where: { userId_email: { userId, email } },
    create: {
      userId,
      name: getCustomerName(c),
      email,
      phone: (c.phone as string | null) ?? null,
      platformId: String(c.id),
      source: 'shopify',
    },
    update: {
      name: getCustomerName(c),
      phone: (c.phone as string | null) ?? null,
      platformId: String(c.id),
    },
  })
}

// ─── Checkout (sepet terk) event handler ─────────────────────────────────

async function handleCheckout(userId: string, ch: Record<string, unknown>) {
  const email = (ch.email as string | undefined)?.toLowerCase()
  if (!email) return

  const checkoutId = String(ch.id)
  const completedAt = ch.completed_at

  // Tamamlanmış checkout'u atla
  if (completedAt) return

  const customer = await prisma.customer.findUnique({
    where: { userId_email: { userId, email } },
  })
  if (!customer) return

  // Aynı checkout için zaten event var mı?
  const existingEvent = await prisma.customerEvent.findFirst({
    where: { customerId: customer.id, type: 'cart_abandoned', data: { contains: checkoutId } },
  })
  if (existingEvent) return

  await prisma.customerEvent.create({
    data: {
      userId,
      customerId: customer.id,
      type: 'cart_abandoned',
      source: 'shopify',
      data: JSON.stringify({
        checkoutId,
        total: ch.total_price,
        currency: ch.currency,
        abandonedCheckoutUrl: ch.abandoned_checkout_url,
        lineItems: ch.line_items,
      }),
    },
  })
}

// ─── Products handler ──────────────────────────────────────────────────────

async function handleProduct(userId: string, payload: Record<string, unknown>) {
  const p = payload as unknown as ShopifyProduct
  if (!p.id) return

  const mainImage = p.images?.find(i => i.position === 1)?.src ?? p.images?.[0]?.src ?? null
  const variant = p.variants?.[0]
  const price = variant ? parseFloat(variant.price) : null
  const compareAt = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null
  const platformId = String(p.id)
  const category = detectProductCategory(p)

  const existing = await prisma.campaignProduct.findFirst({ where: { userId, platformId } })

  if (existing) {
    await prisma.campaignProduct.update({
      where: { id: existing.id },
      data: {
        productName: p.title,
        productImage: mainImage,
        price,
        compareAtPrice: compareAt,
        description: p.body_html ? p.body_html.replace(/<[^>]+>/g, '').slice(0, 500) : null,
        category,
      },
    })
  } else {
    // Only create if product is active
    if (p.status && p.status !== 'active') return
    await prisma.campaignProduct.create({
      data: {
        userId,
        productName: p.title,
        productImage: mainImage,
        price,
        compareAtPrice: compareAt,
        description: p.body_html ? p.body_html.replace(/<[^>]+>/g, '').slice(0, 500) : null,
        category,
        platformId,
        source: 'shopify',
      },
    })
  }
}

// ─── Yardımcı fonksiyonlar ─────────────────────────────────────────────────

async function updateCustomerStats(userId: string, customerId: string) {
  const orders = await prisma.order.findMany({
    where: { userId, customerId, financialStatus: 'paid' },
    select: { total: true, placedAt: true },
    orderBy: { placedAt: 'desc' },
  })

  const totalOrders = orders.length
  const totalSpent = orders.reduce((s, o) => s + o.total, 0)
  const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0
  const lastOrder = orders[0]?.placedAt ?? null
  const segment = classifySegment({ totalOrders, totalSpent, lastOrderAt: lastOrder })

  await prisma.customer.update({
    where: { id: customerId },
    data: { totalOrders, totalSpent, avgOrder, lastOrder, segment },
  })
}
