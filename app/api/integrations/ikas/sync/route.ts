import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

const IKAS_GQL = 'https://graphql.myikas.com/api/1.0/graphql'

async function ikasQuery(token: string, query: string, variables = {}) {
  const res = await fetch(IKAS_GQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`İkas API error: ${res.status}`)
  const data = await res.json()
  if (data.errors) throw new Error(data.errors[0]?.message)
  return data.data
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const integration = await prisma.integration.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: 'ikas' } },
  })
  if (!integration?.accessToken) {
    return NextResponse.json({ error: 'İkas bağlantısı bulunamadı' }, { status: 404 })
  }

  const token = integration.accessToken
  let customersUpserted = 0
  let ordersUpserted = 0

  try {
    // Müşterileri çek
    const customersData = await ikasQuery(token, `{
      listCustomer(pagination: { limit: 200 }) {
        data {
          id email firstName lastName phone totalOrderCount totalOrderAmount
        }
      }
    }`)

    const customers = customersData?.listCustomer?.data ?? []
    for (const c of customers) {
      const email = c.email?.toLowerCase()
      if (!email) continue

      const totalOrders = c.totalOrderCount ?? 0
      const totalSpent = parseFloat(c.totalOrderAmount ?? '0')

      await prisma.customer.upsert({
        where: { userId_email: { userId: session.user.id, email } },
        create: {
          userId: session.user.id,
          name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || email,
          email,
          phone: c.phone ?? null,
          platformId: String(c.id),
          source: 'ikas',
          totalOrders,
          totalSpent,
          avgOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
          segment: totalOrders >= 5 ? 'vip' : totalOrders >= 3 ? 'loyal' : 'new',
        },
        update: {
          name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || email,
          phone: c.phone ?? null,
          platformId: String(c.id),
          totalOrders,
          totalSpent,
          avgOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
          segment: totalOrders >= 5 ? 'vip' : totalOrders >= 3 ? 'loyal' : 'new',
        },
      })
      customersUpserted++
    }

    // Siparişleri çek
    const ordersData = await ikasQuery(token, `{
      listOrder(pagination: { limit: 200 }) {
        data {
          id orderNumber status totalFinalPrice currencyCode createdAt
          customer { email }
          orderLineItems {
            id finalPrice quantity
            variant { name }
            product { name }
          }
        }
      }
    }`)

    const orders = ordersData?.listOrder?.data ?? []
    for (const o of orders) {
      const customerEmail = o.customer?.email?.toLowerCase()
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
            orderNumber: o.orderNumber,
            status: o.status?.toLowerCase() === 'delivered' ? 'delivered' : 'confirmed',
            total: parseFloat(o.totalFinalPrice ?? '0'),
            currency: o.currencyCode ?? 'TRY',
            placedAt: new Date(o.createdAt),
          },
        })

        for (const li of (o.orderLineItems ?? [])) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              platformId: String(li.id),
              title: li.product?.name ?? 'Ürün',
              variantTitle: li.variant?.name ?? null,
              quantity: li.quantity ?? 1,
              price: parseFloat(li.finalPrice ?? '0'),
            },
          })
        }

        await prisma.customerEvent.create({
          data: {
            userId: session.user.id,
            customerId: customer.id,
            orderId: order.id,
            type: 'order_placed',
            source: 'ikas',
            data: JSON.stringify({ orderNumber: o.orderNumber, total: o.totalFinalPrice }),
          },
        })

        ordersUpserted++
      }
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
    console.error('İkas sync error:', err)
    return NextResponse.json({ error: 'Senkronizasyon hatası: ' + String(err) }, { status: 500 })
  }
}
