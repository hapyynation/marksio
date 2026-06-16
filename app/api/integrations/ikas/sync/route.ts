import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const IKAS_GQL = 'https://graphql.myikas.com/api/1.0/graphql'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ikasQuery(token: string, query: string, variables = {}): Promise<any> {
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
  const session = await getApiSession()
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
    // Müşterileri çek — cursor-based pagination, inline işleme
    let customerCursor: string | null = null
    let hasMoreCustomers = true

    while (hasMoreCustomers) {
      const paginationArg = customerCursor
        ? `{ limit: 200, after: "${customerCursor}" }`
        : `{ limit: 200 }`

      const customersData = await ikasQuery(token, `{
        listCustomer(pagination: ${paginationArg}) {
          data {
            id email firstName lastName phone totalOrderCount totalOrderAmount
          }
          pageInfo { hasNextPage endCursor }
        }
      }`)

      for (const c of (customersData?.listCustomer?.data ?? [])) {
        const email = (c.email as string | undefined)?.toLowerCase()
        if (!email) continue

        const totalOrders = (c.totalOrderCount as number) ?? 0
        const totalSpent = parseFloat((c.totalOrderAmount as string) ?? '0')

        await prisma.customer.upsert({
          where: { userId_email: { userId: session.user.id, email } },
          create: {
            userId: session.user.id,
            name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || email,
            email,
            phone: (c.phone as string | null) ?? null,
            platformId: String(c.id),
            source: 'ikas',
            totalOrders,
            totalSpent,
            avgOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
            segment: totalOrders >= 5 ? 'vip' : totalOrders >= 3 ? 'loyal' : 'new',
          },
          update: {
            name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || email,
            phone: (c.phone as string | null) ?? null,
            platformId: String(c.id),
            totalOrders,
            totalSpent,
            avgOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
            segment: totalOrders >= 5 ? 'vip' : totalOrders >= 3 ? 'loyal' : 'new',
          },
        })
        customersUpserted++
      }

      const pageInfo = customersData?.listCustomer?.pageInfo
      hasMoreCustomers = pageInfo?.hasNextPage === true
      customerCursor = (pageInfo?.endCursor as string | null) ?? null
    }

    // Siparişleri çek — cursor-based pagination, inline işleme
    let orderCursor: string | null = null
    let hasMoreOrders = true

    while (hasMoreOrders) {
      const paginationArg = orderCursor
        ? `{ limit: 200, after: "${orderCursor}" }`
        : `{ limit: 200 }`

      const ordersData = await ikasQuery(token, `{
        listOrder(pagination: ${paginationArg}) {
          data {
            id orderNumber status totalFinalPrice currencyCode createdAt
            customer { email }
            orderLineItems {
              id finalPrice quantity
              variant { name }
              product { name }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`)

      for (const o of (ordersData?.listOrder?.data ?? [])) {
        const customerEmail = (o.customer?.email as string | undefined)?.toLowerCase()
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
              orderNumber: o.orderNumber as string,
              status: (o.status as string | undefined)?.toLowerCase() === 'delivered' ? 'delivered' : 'confirmed',
              total: parseFloat((o.totalFinalPrice as string) ?? '0'),
              currency: (o.currencyCode as string) ?? 'TRY',
              placedAt: new Date(o.createdAt as string),
            },
          })

          for (const li of (o.orderLineItems ?? [])) {
            await prisma.orderItem.create({
              data: {
                orderId: order.id,
                platformId: String(li.id),
                title: (li.product?.name as string) ?? 'Ürün',
                variantTitle: (li.variant?.name as string | null) ?? null,
                quantity: (li.quantity as number) ?? 1,
                price: parseFloat((li.finalPrice as string) ?? '0'),
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

      const pageInfo = ordersData?.listOrder?.pageInfo
      hasMoreOrders = pageInfo?.hasNextPage === true
      orderCursor = (pageInfo?.endCursor as string | null) ?? null
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
