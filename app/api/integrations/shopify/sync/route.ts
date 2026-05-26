import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import {
  shopifyFetchAll,
  classifySegment,
  mapFulfillmentStatus,
  getCustomerName,
  detectProductCategory,
  type ShopifyCustomer,
  type ShopifyOrder,
  type ShopifyProduct,
  type ShopifyCheckout,
  type SyncMeta,
} from '@/lib/shopify'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = session.user.id

  const integration = await prisma.integration.findUnique({
    where: { userId_platform: { userId, platform: 'shopify' } },
  })
  if (!integration?.shopDomain || !integration.accessToken) {
    return NextResponse.json({ error: 'Shopify bağlantısı bulunamadı' }, { status: 404 })
  }

  return runSync(userId, integration.id, integration.shopDomain, integration.accessToken, integration.meta)
}

export async function runSync(
  userId: string,
  integrationId: string,
  domain: string,
  token: string,
  rawMeta: string | null,
) {
  await prisma.integration.update({
    where: { id: integrationId },
    data: { meta: JSON.stringify({ ...parseMeta(rawMeta), syncInProgress: true }) },
  })

  const startedAt = Date.now()
  const stats = { customers: 0, orders: 0, products: 0, abandonedCarts: 0 }

  try {
    // ── 1. Products ──────────────────────────────────────────────────────────
    const products = await shopifyFetchAll<ShopifyProduct>(
      domain, token, '/products.json?status=active', 'products',
    )

    for (const p of products) {
      const mainImage = p.images.find(i => i.position === 1)?.src ?? p.images[0]?.src ?? null
      const variant = p.variants[0]
      const price = variant ? parseFloat(variant.price) : null
      const compareAt = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null
      const productUrl = `https://${domain}/products/${p.handle}`
      const category = detectProductCategory(p)
      const platformId = String(p.id)

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
            productUrl,
          },
        })
      } else {
        await prisma.campaignProduct.create({
          data: {
            userId,
            productName: p.title,
            productImage: mainImage,
            price,
            compareAtPrice: compareAt,
            description: p.body_html ? p.body_html.replace(/<[^>]+>/g, '').slice(0, 500) : null,
            category,
            productUrl,
            platformId,
            source: 'shopify',
          },
        })
      }
      stats.products++
    }

    // ── 2. Customers ─────────────────────────────────────────────────────────
    const customers = await shopifyFetchAll<ShopifyCustomer>(
      domain, token, '/customers.json', 'customers',
    )

    for (const c of customers) {
      const email = c.email?.toLowerCase()
      if (!email) continue

      const spent = parseFloat(c.total_spent ?? '0')
      const segment = classifySegment({ totalOrders: c.orders_count ?? 0, totalSpent: spent })

      await prisma.customer.upsert({
        where: { userId_email: { userId, email } },
        create: {
          userId,
          name: getCustomerName(c),
          firstName: c.first_name ?? null,
          lastName: c.last_name ?? null,
          email,
          phone: c.phone ?? null,
          platformId: String(c.id),
          source: 'shopify',
          totalOrders: c.orders_count ?? 0,
          totalSpent: spent,
          avgOrder: c.orders_count > 0 ? spent / c.orders_count : 0,
          tags: JSON.stringify(c.tags ? c.tags.split(',').map(t => t.trim()) : []),
          segment,
        },
        update: {
          name: getCustomerName(c),
          firstName: c.first_name ?? null,
          lastName: c.last_name ?? null,
          phone: c.phone ?? null,
          platformId: String(c.id),
          totalOrders: c.orders_count ?? 0,
          totalSpent: spent,
          avgOrder: c.orders_count > 0 ? spent / c.orders_count : 0,
          tags: JSON.stringify(c.tags ? c.tags.split(',').map(t => t.trim()) : []),
          segment,
        },
      })
      stats.customers++
    }

    // ── 3. Orders ────────────────────────────────────────────────────────────
    const orders = await shopifyFetchAll<ShopifyOrder>(
      domain, token, '/orders.json?status=any', 'orders',
    )

    for (const o of orders) {
      const customerEmail = o.customer?.email?.toLowerCase()
      if (!customerEmail) continue

      const customer = await prisma.customer.findUnique({
        where: { userId_email: { userId, email: customerEmail } },
      })
      if (!customer) continue

      const platformOrderId = String(o.id)
      const existing = await prisma.order.findUnique({
        where: { userId_platformOrderId: { userId, platformOrderId } },
      })

      const orderPayload = {
        status: mapFulfillmentStatus(o.fulfillment_status),
        financialStatus: o.financial_status ?? null,
        total: parseFloat(o.total_price ?? '0'),
        subtotal: parseFloat(o.subtotal_price ?? '0'),
        discount: parseFloat(o.total_discounts ?? '0'),
        shipping: parseFloat(o.total_shipping_price_set?.shop_money?.amount ?? '0'),
        currency: o.currency ?? 'TRY',
        shippingCity: o.shipping_address?.city ?? null,
        shippingCountry: o.shipping_address?.country_code ?? null,
      }

      if (!existing) {
        const order = await prisma.order.create({
          data: {
            userId,
            integrationId,
            customerId: customer.id,
            platformOrderId,
            orderNumber: o.name,
            placedAt: new Date(o.created_at),
            ...orderPayload,
          },
        })

        await Promise.all(
          (o.line_items ?? []).map(li =>
            prisma.orderItem.create({
              data: {
                orderId: order.id,
                platformId: String(li.id),
                title: li.title,
                variantTitle: li.variant_title ?? null,
                quantity: li.quantity,
                price: parseFloat(li.price ?? '0'),
              },
            }),
          ),
        )

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

        stats.orders++
      } else {
        await prisma.order.update({ where: { id: existing.id }, data: orderPayload })
      }
    }

    // Recalculate customer stats from real order history
    const emailsToRecalc = [
      ...new Set(orders.filter(o => o.customer?.email).map(o => o.customer!.email!.toLowerCase())),
    ]
    await Promise.allSettled(emailsToRecalc.map(email => recalcCustomerStats(userId, email)))

    // ── 4. Abandoned Carts ───────────────────────────────────────────────────
    const carts = await shopifyFetchAll<ShopifyCheckout>(
      domain, token, '/checkouts.json?status=open', 'checkouts',
    )

    for (const ch of carts) {
      const email = ch.email?.toLowerCase()
      if (!email || ch.completed_at) continue

      const customer = await prisma.customer.findUnique({
        where: { userId_email: { userId, email } },
      })
      if (!customer) continue

      const checkoutId = String(ch.id)
      const exists = await prisma.customerEvent.findFirst({
        where: { customerId: customer.id, type: 'cart_abandoned', data: { contains: checkoutId } },
      })
      if (exists) continue

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
      stats.abandonedCarts++
    }

    // ── 5. Finalize ──────────────────────────────────────────────────────────
    const existingMeta = parseMeta(rawMeta)
    const updatedMeta: SyncMeta = {
      ...existingMeta,
      syncInProgress: false,
      lastSync: {
        customers: stats.customers,
        orders: stats.orders,
        products: stats.products,
        abandonedCarts: stats.abandonedCarts,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      },
    }

    await prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date(), status: 'active', meta: JSON.stringify(updatedMeta) },
    })

    return NextResponse.json({
      success: true,
      stats,
      message: `${stats.customers} müşteri, ${stats.orders} sipariş, ${stats.products} ürün, ${stats.abandonedCarts} sepet senkronize edildi.`,
    })
  } catch (err) {
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: 'error',
        meta: JSON.stringify({ ...parseMeta(rawMeta), syncInProgress: false }),
      },
    })
    console.error('Shopify sync error:', err)
    return NextResponse.json({ error: 'Senkronizasyon hatası' }, { status: 500 })
  }
}

function parseMeta(raw: string | null | undefined): SyncMeta {
  try { return JSON.parse(raw ?? '{}') as SyncMeta } catch { return {} }
}

async function recalcCustomerStats(userId: string, email: string) {
  const customer = await prisma.customer.findUnique({
    where: { userId_email: { userId, email } },
  })
  if (!customer) return

  const orders = await prisma.order.findMany({
    where: { userId, customerId: customer.id, financialStatus: 'paid' },
    select: { total: true, placedAt: true },
    orderBy: { placedAt: 'desc' },
  })

  const totalOrders = orders.length
  const totalSpent = orders.reduce((s, o) => s + o.total, 0)
  const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0
  const lastOrder = orders[0]?.placedAt ?? null
  const segment = classifySegment({ totalOrders, totalSpent, lastOrderAt: lastOrder })

  await prisma.customer.update({
    where: { id: customer.id },
    data: { totalOrders, totalSpent, avgOrder, lastOrder, segment },
  })
}
