import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { triggerAutomationsForEvent } from '@/lib/automation/engine'
import { attributeAutomationRevenue } from '@/lib/automation-attribution'

// WooCommerce HMAC-SHA256 is base64-encoded
function verifySignature(body: string, sig: string, secret: string): boolean {
  if (!secret || !sig) return false
  return createHmac('sha256', secret).update(body, 'utf8').digest('base64') === sig
}

export async function POST(req: NextRequest) {
  const topic = req.headers.get('x-wc-webhook-topic') ?? ''
  // x-wc-webhook-source: "https://mystore.com/" — strip protocol and trailing slash
  const source = (req.headers.get('x-wc-webhook-source') ?? '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
  const signature = req.headers.get('x-wc-webhook-signature') ?? ''
  const rawBody = await req.text()

  const integration = await prisma.integration.findFirst({
    where: { shopDomain: source, platform: 'woocommerce', status: 'active' },
  })
  if (!integration) return NextResponse.json({ ok: true })

  let meta: Record<string, unknown> = {}
  try { meta = JSON.parse(integration.meta) } catch {}

  const webhookSecret = meta.webhookSecret as string | undefined
  if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
    console.error('[WooCommerce Webhook] Geçersiz imza, domain:', source)
    return NextResponse.json({ ok: true })
  }

  let payload: Record<string, unknown>
  try { payload = JSON.parse(rawBody) } catch { return NextResponse.json({ ok: true }) }

  const userId = integration.userId

  try {
    switch (topic) {
      case 'order.created': {
        const event = await handleOrder(userId, integration.id, payload)
        if (event) triggerAutomationsForEvent(event).catch(err => console.error('[WooCommerce Webhook]', err))
        break
      }
      case 'order.updated':
        await handleOrderUpdate(userId, payload)
        break
      case 'customer.created': {
        const event = await handleCustomer(userId, payload, false)
        if (event) triggerAutomationsForEvent(event).catch(err => console.error('[WooCommerce Webhook]', err))
        break
      }
      case 'customer.updated':
        await handleCustomer(userId, payload, true)
        break
    }
  } catch (err) {
    console.error(`[WooCommerce Webhook] ${topic} hatası:`, err)
  }

  return NextResponse.json({ ok: true })
}

type CreatedEvent = Awaited<ReturnType<typeof prisma.customerEvent.create>>

async function handleOrder(
  userId: string,
  integrationId: string,
  o: Record<string, unknown>,
): Promise<CreatedEvent | null> {
  const billing = o.billing as Record<string, unknown> | undefined
  const email = (billing?.email as string | undefined)?.toLowerCase()
  if (!email) return null

  const customer = await prisma.customer.upsert({
    where: { userId_email: { userId, email } },
    create: {
      userId,
      name: `${billing?.first_name ?? ''} ${billing?.last_name ?? ''}`.trim() || email,
      email,
      phone: (billing?.phone as string | null) ?? null,
      source: 'woocommerce',
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
      orderNumber: `#${o.number ?? o.id}`,
      status: o.status === 'completed' ? 'delivered' : 'confirmed',
      financialStatus: o.status as string | null,
      total: parseFloat((o.total as string) ?? '0'),
      currency: (o.currency as string) ?? 'TRY',
      placedAt: new Date((o.date_created as string) ?? Date.now()),
    },
  })

  for (const li of ((o.line_items as Array<Record<string, unknown>>) ?? [])) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        platformId: String(li.id),
        title: li.name as string,
        quantity: (li.quantity as number) ?? 1,
        price: parseFloat((li.price as string) ?? '0'),
      },
    })
  }

  attributeAutomationRevenue(customer.id, parseFloat((o.total as string) ?? '0'))
    .catch(err => console.error('[WooCommerce AutomationAttribution]', err))

  return prisma.customerEvent.create({
    data: {
      userId,
      customerId: customer.id,
      orderId: order.id,
      type: 'order_placed',
      source: 'woocommerce',
      data: JSON.stringify({ orderNumber: `#${o.number}`, total: o.total }),
    },
  })
}

async function handleOrderUpdate(userId: string, o: Record<string, unknown>) {
  const platformOrderId = String(o.id)
  await prisma.order.updateMany({
    where: { userId, platformOrderId },
    data: {
      status: o.status === 'completed' ? 'delivered' : 'confirmed',
      financialStatus: o.status as string,
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

  const billing = c.billing as Record<string, unknown> | undefined
  const totalOrders = (c.orders_count as number) ?? 0
  const totalSpent = parseFloat((c.total_spent as string) ?? '0')

  const customer = await prisma.customer.upsert({
    where: { userId_email: { userId, email } },
    create: {
      userId,
      name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || email,
      email,
      phone: (billing?.phone as string | null) ?? null,
      platformId: String(c.id),
      source: 'woocommerce',
      totalOrders,
      totalSpent,
      avgOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
      segment: totalOrders >= 5 ? 'vip' : totalOrders >= 3 ? 'loyal' : 'new',
    },
    update: {
      name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || email,
      phone: (billing?.phone as string | null) ?? null,
      totalOrders,
      totalSpent,
      avgOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
      segment: totalOrders >= 5 ? 'vip' : totalOrders >= 3 ? 'loyal' : 'new',
    },
  })

  if (!isUpdate && !existing) {
    return prisma.customerEvent.create({
      data: {
        userId,
        customerId: customer.id,
        type: 'customer_created',
        source: 'woocommerce',
        data: JSON.stringify({ email, platformId: String(c.id) }),
      },
    })
  }
  return null
}
