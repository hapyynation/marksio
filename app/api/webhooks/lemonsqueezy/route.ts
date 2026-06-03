import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, VARIANT_TO_PLAN } from '@/lib/lemonsqueezy'

// Lemon Squeezy webhook event shapes (simplified)
interface LsSubscriptionAttributes {
  status: string               // active | cancelled | expired | past_due | paused | unpaid | on_trial
  user_email: string
  variant_id: number
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
    attributes: LsSubscriptionAttributes
  }
}

async function findUser(payload: LsWebhookPayload): Promise<{ id: string } | null> {
  const userId = payload.meta.custom_data?.user_id
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (user) return user
  }

  const email = payload.data.attributes.user_email
  if (email) {
    const user = await prisma.user.findFirst({ where: { email }, select: { id: true } })
    if (user) return user
  }

  return null
}

function resolvePlan(variantId: number): string {
  return VARIANT_TO_PLAN[String(variantId)] ?? 'starter'
}

function resolvePlanStatus(lsStatus: string): string {
  switch (lsStatus) {
    case 'active':
    case 'on_trial': return 'active'
    case 'cancelled': return 'cancelled'
    case 'expired':   return 'expired'
    case 'past_due':
    case 'unpaid':    return 'past_due'
    case 'paused':    return 'cancelled'
    default:          return 'active'
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('X-Signature') ?? ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[LS Webhook] Geçersiz imza')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let payload: LsWebhookPayload
  try {
    payload = JSON.parse(rawBody) as LsWebhookPayload
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const { event_name } = payload.meta
  console.log(`[LS Webhook] ${event_name}`, payload.data.id)

  try {
    switch (event_name) {
      case 'subscription_created':
      case 'subscription_updated': {
        const user = await findUser(payload)
        if (!user) {
          console.warn('[LS Webhook] Kullanıcı bulunamadı', payload.data.attributes.user_email)
          break
        }

        const attr = payload.data.attributes
        const plan = resolvePlan(attr.variant_id)
        const planStatus = resolvePlanStatus(attr.status)
        const renewsAt = attr.renews_at ? new Date(attr.renews_at) : null

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

        console.log(`[LS Webhook] ${event_name} → user=${user.id} plan=${plan} status=${planStatus}`)
        break
      }

      case 'subscription_cancelled': {
        const user = await findUser(payload)
        if (!user) break

        const attr = payload.data.attributes
        // Keep the plan until ends_at; mark as cancelled
        const endsAt = attr.ends_at ? new Date(attr.ends_at) : null

        await prisma.user.update({
          where: { id: user.id },
          data: {
            planStatus:  'cancelled',
            planRenewsAt: endsAt,
          },
        })

        console.log(`[LS Webhook] subscription_cancelled → user=${user.id} ends=${endsAt?.toISOString()}`)
        break
      }

      case 'subscription_expired': {
        const user = await findUser(payload)
        if (!user) break

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan:            'free',
            planStatus:      'expired',
            planRenewsAt:    null,
            lsSubscriptionId: null,
          },
        })

        console.log(`[LS Webhook] subscription_expired → user=${user.id} → free`)
        break
      }

      case 'subscription_payment_failed': {
        const user = await findUser(payload)
        if (!user) break

        await prisma.user.update({
          where: { id: user.id },
          data: { planStatus: 'past_due' },
        })

        console.log(`[LS Webhook] subscription_payment_failed → user=${user.id} → past_due`)
        break
      }

      case 'subscription_payment_success': {
        const user = await findUser(payload)
        if (!user) break

        const attr = payload.data.attributes
        const renewsAt = attr.renews_at ? new Date(attr.renews_at) : null

        await prisma.user.update({
          where: { id: user.id },
          data: { planStatus: 'active', planRenewsAt: renewsAt },
        })

        console.log(`[LS Webhook] subscription_payment_success → user=${user.id} renewed`)
        break
      }

      default:
        console.log(`[LS Webhook] Unhandled: ${event_name}`)
    }
  } catch (err) {
    console.error('[LS Webhook] DB hatası:', err)
    // Return 200 anyway so LS doesn't retry (DB errors are our problem, not theirs)
  }

  return NextResponse.json({ received: true })
}
