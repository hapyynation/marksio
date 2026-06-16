import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { triggerAutomationsForEvent } from '@/lib/automation/engine'
import { attributeAutomationRevenue } from '@/lib/automation-attribution'

function verifySignature(body: string, sig: string, secret: string): boolean {
  if (!secret || !sig) return false
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex') === sig
}

export async function POST(req: NextRequest) {
  // delivery_url: ${APP_URL}/api/webhooks/ikas?iid=${integration.id}
  const integrationId = req.nextUrl.searchParams.get('iid') ?? ''
  const signature = req.headers.get('x-ikas-signature') ?? ''
  const rawBody = await req.text()

  if (!integrationId) return NextResponse.json({ ok: true })

  const integration = await prisma.integration.findFirst({
    where: { id: integrationId, platform: 'ikas', status: 'active' },
  })
  if (!integration) return NextResponse.json({ ok: true })

  let meta: Record<string, unknown> = {}
  try { meta = JSON.parse(integration.meta) } catch {}

  const webhookSecret = meta.webhookSecret as string | undefined
  if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
    console.error('[İkas Webhook] Geçersiz imza, integrationId:', integrationId)
    return NextResponse.json({ ok: true })
  }

  let payload: Record<string, unknown>
  try { payload = JSON.parse(rawBody) } catch { return NextResponse.json({ ok: true }) }

  // İkas eventName: ORDER_CREATED, ORDER_UPDATED, CUSTOMER_CREATED, CUSTOMER_UPDATED, CART_ABANDONED
  const topic = ((payload.eventName ?? payload.topic ?? '') as string)
    .toUpperCase()
    .replace(/[.\-]/g, '_')
  const data = (payload.payload ?? payload.data ?? payload) as Record<string, unknown>
  const userId = integration.userId

  try {
    switch (topic) {
      case 'ORDER_CREATED': {
        const event = await handleOrder(userId, integration.id, data)
        if (event) triggerAutomationsForEvent(event).catch(err => console.error('[İkas Webhook]', err))
        break
      }
      case 'ORDER_UPDATED':
        await handleOrderUpdate(userId, data)
        break
      case 'CUSTOMER_CREATED': {
        const event = await handleCustomer(userId, data, false)
        if (event) triggerAutomationsForEvent(event).catch(err => console.error('[İkas Webhook]', err))
        break
      }
      case 'CUSTOMER_UPDATED':
        await handleCustomer(userId, data, true)
        break
      case 'CART_ABANDONED': {
        const event = await handleCartAbandoned(userId, data)
        if (event) triggerAutomationsForEvent(event).catch(err => console.error('[İkas Webhook]', err))
        break
      }
    }
  } catch (err) {
    console.error(`[İkas Webhook] ${topic} hatası:`, err)
  }

  return NextResponse.json({ ok: true })
}

type CreatedEvent = Awaited<ReturnType<typeof prisma.customerEvent.create>>

async function handleOrder(
  userId: string,
  integrationId: string,
  o: Record<string, unknown>,
): Promise<CreatedEvent | null> {
  const c = o.customer as Record<string, unknown> | undefined
  const email = (c?.email as string | undefined)?.toLowerCase()
  if (!email) return null

  const customer = await prisma.customer.upsert({
    where: { userId_email: { userId, email } },
    create: {
      userId,
      name: `${c?.firstName ?? ''} ${c?.lastName ?? ''}`.trim() || email,
      email,
      phone: (c?.phone as string | null) ?? null,
      source: 'ikas',
    },
    update: {},
  })

  const platformOrderId = String(o.id)
  const existing = await prisma.order.findUnique({
    where: { userId_platformOrderId: { userId, platformOrderId } },
  })
  if (existing) return null

  const order = await prisma.order.create({
    data: {
      userId,
      integrationId,
      customerId: customer.id,
      platformOrderId,
      orderNumber: o.orderNumber as string,
      status: (o.status as string | undefined)?.toLowerCase() === 'delivered' ? 'delivered' : 'confirmed',
      total: parseFloat((o.totalFinalPrice as string) ?? '0'),
      currency: (o.currencyCode as string) ?? 'TRY',
      placedAt: new Date((o.createdAt as string) ?? Date.now()),
    },
  })

  for (const li of ((o.orderLineItems as Array<Record<string, unknown>>) ?? [])) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        platformId: String(li.id),
        title: (li.product as Record<string, unknown> | undefined)?.name as string ?? 'Ürün',
        variantTitle: (li.variant as Record<string, unknown> | undefined)?.name as string | null ?? null,
        quantity: (li.quantity as number) ?? 1,
        price: parseFloat((li.finalPrice as string) ?? '0'),
      },
    })
  }

  attributeAutomationRevenue(customer.id, parseFloat((o.totalFinalPrice as string) ?? '0'))
    .catch(err => console.error('[İkas AutomationAttribution]', err))

  return prisma.customerEvent.create({
    data: {
      userId,
      customerId: customer.id,
      orderId: order.id,
      type: 'order_placed',
      source: 'ikas',
      data: JSON.stringify({ orderNumber: o.orderNumber, total: o.totalFinalPrice }),
    },
  })
}

async function handleOrderUpdate(userId: string, o: Record<string, unknown>) {
  const platformOrderId = String(o.id)
  await prisma.order.updateMany({
    where: { userId, platformOrderId },
    data: {
      status: (o.status as string | undefined)?.toLowerCase() === 'delivered' ? 'delivered' : 'confirmed',
    },
  })
}

async function handleCustomer(
  userId: string,
  c: Record<string, unknown>,
  isUpdate: boolean,
): Promise<CreatedEvent | null> {
  const email = (c.email as string | undefined)?.toLowerCase()
  if (!email) return null

  const existing = await prisma.customer.findUnique({ where: { userId_email: { userId, email } } })

  const customer = await prisma.customer.upsert({
    where: { userId_email: { userId, email } },
    create: {
      userId,
      name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || email,
      email,
      phone: (c.phone as string | null) ?? null,
      platformId: String(c.id),
      source: 'ikas',
      totalOrders: (c.totalOrderCount as number) ?? 0,
      totalSpent: parseFloat((c.totalOrderAmount as string) ?? '0'),
    },
    update: {
      name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || email,
      phone: (c.phone as string | null) ?? null,
      platformId: String(c.id),
    },
  })

  if (!isUpdate && !existing) {
    return prisma.customerEvent.create({
      data: {
        userId,
        customerId: customer.id,
        type: 'customer_created',
        source: 'ikas',
        data: JSON.stringify({ email, platformId: String(c.id) }),
      },
    })
  }
  return null
}

async function handleCartAbandoned(
  userId: string,
  ch: Record<string, unknown>,
): Promise<CreatedEvent | null> {
  const email = (ch.email as string | undefined)?.toLowerCase()
  if (!email) return null

  const cartId = String(ch.id)
  const customer = await prisma.customer.findUnique({ where: { userId_email: { userId, email } } })
  if (!customer) return null

  const existing = await prisma.customerEvent.findFirst({
    where: { customerId: customer.id, type: 'cart_abandoned', data: { contains: cartId } },
  })
  if (existing) return null

  return prisma.customerEvent.create({
    data: {
      userId,
      customerId: customer.id,
      type: 'cart_abandoned',
      source: 'ikas',
      data: JSON.stringify({
        cartId,
        total: ch.totalFinalPrice ?? ch.total,
        currency: ch.currencyCode ?? ch.currency,
        lineItems: ch.cartItems ?? ch.lineItems,
      }),
    },
  })
}
