import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const SECRET = process.env.RESEND_WEBHOOK_SECRET ?? ''

function verifySignature(body: string, svixId: string, svixTimestamp: string, svixSignature: string): boolean {
  if (!SECRET) return true
  try {
    const secretBytes = Buffer.from(SECRET.replace(/^whsec_/, ''), 'base64')
    const toSign = `${svixId}.${svixTimestamp}.${body}`
    const hmac = crypto.createHmac('sha256', secretBytes).update(toSign).digest('base64')
    const expected = `v1,${hmac}`
    const provided = svixSignature.split(' ').find(s => s.startsWith('v1,')) ?? ''
    if (!provided) return false
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
  } catch {
    return false
  }
}

const TYPE_MAP: Record<string, string> = {
  'email.sent':        'sent',
  'email.delivered':   'delivered',
  'email.opened':      'opened',
  'email.clicked':     'clicked',
  'email.bounced':     'bounced',
  'email.complained':  'complained',
  'email.unsubscribed':'unsubscribed',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const svixId  = req.headers.get('svix-id') ?? ''
  const svixTs  = req.headers.get('svix-timestamp') ?? ''
  const svixSig = req.headers.get('svix-signature') ?? ''

  if (SECRET && svixSig && !verifySignature(body, svixId, svixTs, svixSig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: { type: string; data: Record<string, unknown> }
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType       = payload.type
  const data            = payload.data ?? {}
  const resendMessageId = String(data.email_id ?? '')
  const mappedType      = TYPE_MAP[eventType]

  if (!mappedType || !resendMessageId) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    const event = await prisma.emailEvent.findFirst({ where: { resendMessageId } })
    if (!event) return NextResponse.json({ ok: true, skipped: true })

    // ── Build event update ────────────────────────────────────────────────────
    const eventUpdate: Record<string, unknown> = { type: mappedType }

    if (mappedType === 'opened')  eventUpdate.openedAt  = new Date()
    if (mappedType === 'clicked') eventUpdate.clickedAt = new Date()

    if (mappedType === 'bounced') {
      eventUpdate.bouncedAt = new Date()
      const bounce = data.bounce as Record<string, unknown> | undefined
      eventUpdate.failedReason = String(bounce?.message ?? 'bounce')
    }

    await prisma.emailEvent.update({ where: { id: event.id }, data: eventUpdate })

    // ── Side-effects per event type ───────────────────────────────────────────

    // 1. Increment campaign counters for opened / clicked
    const campaignCounters: Record<string, string> = { opened: 'opened', clicked: 'clicked' }
    const counter = campaignCounters[mappedType]
    if (counter) {
      await prisma.campaign.update({
        where: { id: event.campaignId },
        data: { [counter]: { increment: 1 } },
      }).catch(() => null)
    }

    // 2. Bounce → mark customer as bounced + hit health score
    if (mappedType === 'bounced' && event.customerId) {
      await prisma.customer.update({
        where: { id: event.customerId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { bounced: true, bouncedAt: new Date() } as any,
      }).catch(() => null)

      const campaign = await prisma.campaign.findUnique({ where: { id: event.campaignId }, select: { userId: true } }).catch(() => null)
      if (campaign?.userId) {
        await prisma.emailHealthScore.upsert({
          where:  { userId: campaign.userId },
          create: { userId: campaign.userId, score: 90, status: 'good', bounceRate: 1.5 },
          update: {
            score:          { decrement: 3 },
            lastCalculated: new Date(),
          },
        }).catch(() => null)
      }

      // Record unsubscribed EmailEvent so dashboards reflect this
      await prisma.emailEvent.create({
        data: {
          campaignId:      event.campaignId,
          customerId:      event.customerId,
          email:           event.email,
          type:            'failed',
          resendMessageId: null,
          metadata:        JSON.stringify({ reason: 'bounce_suppressed' }),
        },
      }).catch(() => null)
    }

    // 3. Complaint → immediately unsubscribe customer + hit health score
    if (mappedType === 'complained' && event.customerId) {
      await prisma.customer.update({
        where: { id: event.customerId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { unsubscribed: true, complained: true, complainedAt: new Date() } as any,
      }).catch(() => null)

      const campaign = await prisma.campaign.findUnique({ where: { id: event.campaignId }, select: { userId: true } }).catch(() => null)
      if (campaign?.userId) {
        await prisma.emailHealthScore.upsert({
          where:  { userId: campaign.userId },
          create: { userId: campaign.userId, score: 80, status: 'warning', complaintRate: 0.15 },
          update: {
            score:         { decrement: 15 },
            status:        'warning',
            lastCalculated: new Date(),
          },
        }).catch(() => null)
      }
    }

    // 4. Unsubscribe event from Resend → sync to customer
    if (mappedType === 'unsubscribed' && event.customerId) {
      await prisma.customer.update({
        where: { id: event.customerId },
        data: { unsubscribed: true },
      }).catch(() => null)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Resend Webhook]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
