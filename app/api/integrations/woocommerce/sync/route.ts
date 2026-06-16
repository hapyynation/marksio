import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const integration = await prisma.integration.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: 'woocommerce' } },
  })
  if (!integration?.accessToken || !integration.apiSecret || !integration.shopDomain) {
    return NextResponse.json({ error: 'WooCommerce bağlantısı bulunamadı' }, { status: 404 })
  }

  const { shopDomain, accessToken, apiSecret } = integration
  const auth = Buffer.from(`${accessToken}:${apiSecret}`).toString('base64')
  const base = `https://${shopDomain}/wp-json/wc/v3`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function wooFetch(path: string): Promise<any> {
    const res = await fetch(`${base}${path}`, { headers: { Authorization: `Basic ${auth}` } })
    if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`)
    return res.json()
  }

  let customersUpserted = 0
  let ordersUpserted = 0

  try {
    // Müşterileri çek — page-based pagination, inline işleme
    let customerPage = 1
    while (true) {
      const page = await wooFetch(`/customers?per_page=100&page=${customerPage}`)
      if (!Array.isArray(page) || page.length === 0) break

      for (const c of page) {
        const email = (c.email as string | undefined)?.toLowerCase()
        if (!email) continue

        const totalOrders = (c.orders_count as number) ?? 0
        const totalSpent = parseFloat((c.total_spent as string) ?? '0')

        await prisma.customer.upsert({
          where: { userId_email: { userId: session.user.id, email } },
          create: {
            userId: session.user.id,
            name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || email,
            email,
            phone: (c.billing?.phone as string | null) ?? null,
            platformId: String(c.id),
            source: 'woocommerce',
            totalOrders,
            totalSpent,
            avgOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
            segment: totalOrders >= 5 ? 'vip' : totalOrders >= 3 ? 'loyal' : 'new',
          },
          update: {
            name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || email,
            phone: (c.billing?.phone as string | null) ?? null,
            totalOrders,
            totalSpent,
            avgOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
            segment: totalOrders >= 5 ? 'vip' : totalOrders >= 3 ? 'loyal' : 'new',
          },
        })
        customersUpserted++
      }

      if (page.length < 100) break
      customerPage++
    }

    // Siparişleri çek — page-based pagination, inline işleme
    let orderPage = 1
    while (true) {
      const page = await wooFetch(`/orders?per_page=100&status=any&page=${orderPage}`)
      if (!Array.isArray(page) || page.length === 0) break

      for (const o of page) {
        const customerEmail = (o.billing?.email as string | undefined)?.toLowerCase()
        if (!customerEmail) continue

        const customer = await prisma.customer.findUnique({
          where: { userId_email: { userId: session.user.id, email: customerEmail } },
        })
        if (!customer) continue

        const existing = await prisma.order.findUnique({
          where: { userId_platformOrderId: { userId: session.user.id, platformOrderId: String(o.id) } },
        })

        if (!existing) {
          const order = await prisma.order.create({
            data: {
              userId: session.user.id,
              integrationId: integration.id,
              customerId: customer.id,
              platformOrderId: String(o.id),
              orderNumber: `#${o.number}`,
              status: o.status === 'completed' ? 'delivered' : 'confirmed',
              financialStatus: o.status as string,
              total: parseFloat((o.total as string) ?? '0'),
              currency: (o.currency as string) ?? 'TRY',
              placedAt: new Date(o.date_created as string),
            },
          })

          for (const li of (o.line_items ?? [])) {
            await prisma.orderItem.create({
              data: {
                orderId: order.id,
                platformId: String(li.id),
                title: li.name as string,
                quantity: li.quantity as number,
                price: parseFloat((li.price as string) ?? '0'),
              },
            })
          }

          await prisma.customerEvent.create({
            data: {
              userId: session.user.id,
              customerId: customer.id,
              orderId: order.id,
              type: 'order_placed',
              source: 'woocommerce',
              data: JSON.stringify({ orderNumber: `#${o.number}`, total: o.total }),
            },
          })
          ordersUpserted++
        }
      }

      if (page.length < 100) break
      orderPage++
    }

    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date(), status: 'active' },
    })

    return NextResponse.json({
      success: true,
      message: `${customersUpserted} müşteri, ${ordersUpserted} sipariş senkronize edildi.`,
    })
  } catch (err) {
    console.error('WooCommerce sync error:', err)
    return NextResponse.json({ error: 'Senkronizasyon hatası: ' + String(err) }, { status: 500 })
  }
}
