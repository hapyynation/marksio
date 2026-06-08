import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, VARIANT_TO_PLAN } from '@/lib/lemonsqueezy'

// ─── Payload shapes ───────────────────────────────────────────────────────────

interface LsOrderAttributes {
  user_email: string
  status: string // paid | pending | refunded | voided
  first_order_item?: {
    variant_id: number
    product_name?: string
  }
}

interface LsSubscriptionAttributes {
  user_email: string
  variant_id: number
  status: string // active | cancelled | expired | past_due | paused | unpaid | on_trial
  customer_id: number
  order_id: number
  renews_at: string | null
  ends_at: string | null
  cancelled: boolean
  trial_ends_at: string | null
}

interface LsWebhookPayload {
  meta: {
    event_name: string
    custom_data?: { user_id?: string }
  }
  data: {
    id: string
    type: string
    attributes: Record<string, unknown>
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findUser(payload: LsWebhookPayload) {
  const userId = payload.meta.custom_data?.user_id
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) return user
  }

  const email = (payload.data.attributes as unknown as { user_email?: string }).user_email
  if (email) {
    return prisma.user.findFirst({ where: { email } })
  }

  return null
}

function resolvePlan(variantId: number): string | null {
  return VARIANT_TO_PLAN[String(variantId)] ?? null
}

function resolvePlanStatus(lsStatus: string): string {
  switch (lsStatus) {
    case 'active':
    case 'on_trial':  return 'active'
    case 'cancelled': return 'cancelled'
    case 'expired':   return 'expired'
    case 'past_due':
    case 'unpaid':    return 'past_due'
    case 'paused':    return 'cancelled'
    default:          return 'active'
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Raw body must be consumed before any JSON parsing — required for HMAC
  const rawBody = await req.text()
  const signature = req.headers.get('X-Signature') ?? ''

  if (!signature) {
    console.warn('[LS Webhook] 401 — X-Signature header missing')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[LS Webhook] 401 — Invalid HMAC signature')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let payload: LsWebhookPayload
  try {
    payload = JSON.parse(rawBody) as LsWebhookPayload
  } catch {
    console.error('[LS Webhook] 400 — JSON parse failure')
    return new NextResponse('Bad Request', { status: 400 })
  }

  const { event_name } = payload.meta
  console.log(`[LS Webhook] event=${event_name} data_id=${payload.data?.id}`)

  try {
    switch (event_name) {
      case 'order_created':
        return await handleOrderCreated(payload)

      case 'subscription_created':
      case 'subscription_updated':
        return await handleSubscriptionCreatedOrUpdated(payload)

      case 'subscription_payment_success':
        return await handleSubscriptionPaymentSuccess(payload)

      case 'subscription_cancelled':
        return await handleSubscriptionCancelled(payload)

      case 'subscription_expired':
        return await handleSubscriptionExpired(payload)

      case 'subscription_payment_failed':
        return await handleSubscriptionPaymentFailed(payload)

      default:
        console.warn(`[LS Webhook] 400 — Unhandled event: ${event_name}`)
        return NextResponse.json({ error: `Unhandled event: ${event_name}` }, { status: 400 })
    }
  } catch (err) {
    console.error(`[LS Webhook] 500 — Error processing ${event_name}:`, err)
    // Return 500 so Lemon Squeezy retries — this is a transient server error
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleOrderCreated(payload: LsWebhookPayload) {
  const attrs = payload.data.attributes as unknown as LsOrderAttributes

  if (attrs.status !== 'paid') {
    console.log(`[LS Webhook] order_created — status="${attrs.status}", not paid — skipping`)
    return NextResponse.json({ received: true, handled: false })
  }

  const user = await findUser(payload)
  if (!user) {
    console.error(
      `[LS Webhook] order_created — user not found: email="${attrs.user_email}" ` +
      `custom_user_id="${payload.meta.custom_data?.user_id}"`,
    )
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const rawVariantId = attrs.first_order_item?.variant_id
  const plan = rawVariantId != null ? resolvePlan(rawVariantId) : null
  if (!plan) {
    console.error(
      `[LS Webhook] order_created — unknown variant_id="${rawVariantId}" for user="${user.id}"`,
    )
    return NextResponse.json({ error: `Unknown variant: ${rawVariantId}` }, { status: 400 })
  }

  const previousPlan = user.plan
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan,
      planStatus: 'active',
      lsOrderId: payload.data.id,
    },
  })

  console.log(
    `[LS Webhook] order_created — user="${user.id}" ` +
    `plan: ${previousPlan}→${plan} order="${payload.data.id}"`,
  )
  return NextResponse.json({ received: true, plan })
}

async function handleSubscriptionCreatedOrUpdated(payload: LsWebhookPayload) {
  const event_name = payload.meta.event_name
  const attr = payload.data.attributes as unknown as LsSubscriptionAttributes

  const user = await findUser(payload)
  if (!user) {
    console.error(
      `[LS Webhook] ${event_name} — user not found: email="${attr.user_email}" ` +
      `custom_user_id="${payload.meta.custom_data?.user_id}"`,
    )
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const plan = resolvePlan(attr.variant_id)
  if (!plan) {
    console.error(
      `[LS Webhook] ${event_name} — unknown variant_id="${attr.variant_id}" for user="${user.id}"`,
    )
    return NextResponse.json({ error: `Unknown variant: ${attr.variant_id}` }, { status: 400 })
  }

  const planStatus = resolvePlanStatus(attr.status)
  const renewsAt = attr.renews_at ? new Date(attr.renews_at) : null
  const previousPlan = user.plan

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan,
      planStatus,
      planRenewsAt:     renewsAt,
      lsSubscriptionId: payload.data.id,
      lsCustomerId:     String(attr.customer_id),
      lsOrderId:        String(attr.order_id),
    },
  })

  console.log(
    `[LS Webhook] ${event_name} — user="${user.id}" plan: ${previousPlan}→${plan} ` +
    `status=${planStatus} sub="${payload.data.id}" renewsAt="${renewsAt?.toISOString() ?? 'n/a'}"`,
  )
  return NextResponse.json({ received: true, plan, planStatus })
}

async function handleSubscriptionPaymentSuccess(payload: LsWebhookPayload) {
  const attr = payload.data.attributes as unknown as LsSubscriptionAttributes

  const user = await findUser(payload)
  if (!user) {
    console.error(
      `[LS Webhook] subscription_payment_success — user not found: email="${attr.user_email}"`,
    )
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const renewsAt = attr.renews_at ? new Date(attr.renews_at) : null

  await prisma.user.update({
    where: { id: user.id },
    data: { planStatus: 'active', planRenewsAt: renewsAt },
  })

  console.log(
    `[LS Webhook] subscription_payment_success — user="${user.id}" ` +
    `planStatus→active renewsAt="${renewsAt?.toISOString() ?? 'n/a'}"`,
  )
  return NextResponse.json({ received: true })
}

async function handleSubscriptionCancelled(payload: LsWebhookPayload) {
  const attr = payload.data.attributes as unknown as LsSubscriptionAttributes

  const user = await findUser(payload)
  if (!user) {
    console.error(
      `[LS Webhook] subscription_cancelled — user not found: email="${attr.user_email}"`,
    )
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Prefer ends_at (explicit access-end date) over renews_at when cancelled
  const accessUntil = attr.ends_at
    ? new Date(attr.ends_at)
    : attr.renews_at
    ? new Date(attr.renews_at)
    : null

  await prisma.user.update({
    where: { id: user.id },
    data: {
      planStatus:   'cancelled',
      planRenewsAt: accessUntil,
    },
  })

  console.log(
    `[LS Webhook] subscription_cancelled — user="${user.id}" plan="${user.plan}" ` +
    `access until "${accessUntil?.toISOString() ?? 'unknown'}"`,
  )
  return NextResponse.json({ received: true })
}

async function handleSubscriptionExpired(payload: LsWebhookPayload) {
  const attr = payload.data.attributes as unknown as LsSubscriptionAttributes

  const user = await findUser(payload)
  if (!user) {
    console.error(
      `[LS Webhook] subscription_expired — user not found: email="${attr.user_email}"`,
    )
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const previousPlan = user.plan

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan:             'free',
      planStatus:       'expired',
      planRenewsAt:     null,
      lsSubscriptionId: null,
    },
  })

  console.log(`[LS Webhook] subscription_expired — user="${user.id}" plan: ${previousPlan}→free`)
  return NextResponse.json({ received: true })
}

async function handleSubscriptionPaymentFailed(payload: LsWebhookPayload) {
  const attr = payload.data.attributes as unknown as LsSubscriptionAttributes

  const user = await findUser(payload)
  if (!user) {
    console.error(
      `[LS Webhook] subscription_payment_failed — user not found: email="${attr.user_email}"`,
    )
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { planStatus: 'past_due' },
  })

  console.log(`[LS Webhook] subscription_payment_failed — user="${user.id}" planStatus→past_due`)
  return NextResponse.json({ received: true })
}
