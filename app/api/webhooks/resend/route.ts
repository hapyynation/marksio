import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const SECRET = process.env.RESEND_WEBHOOK_SECRET ?? ''

function verifySignature(body: string, svixId: string, svixTimestamp: string, svixSignature: string): boolean {
  if (!SECRET) return true // skip verification if no secret configured
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
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  const svixId = req.headers.get('svix-id') ?? ''
  const svixTs = req.headers.get('svix-timestamp') ?? ''
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

  const eventType = payload.type
  const data = payload.data ?? {}
  const resendMessageId = String(data.email_id ?? '')
  const mappedType = TYPE_MAP[eventType]

  if (!mappedType || !resendMessageId) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    const event = await prisma.emailEvent.findFirst({
      where: { resendMessageId },
    })

    if (event) {
      const updateData: Record<string, unknown> = { type: mappedType }
      if (mappedType === 'opened') updateData.openedAt = new Date()
      if (mappedType === 'clicked') updateData.clickedAt = new Date()
      if (mappedType === 'bounced') {
        updateData.bouncedAt = new Date()
        const bounce = data.bounce as Record<string, unknown> | undefined
        updateData.failedReason = String(bounce?.message ?? 'bounce')
      }

      await prisma.emailEvent.update({ where: { id: event.id }, data: updateData })

      // Update campaign counter
      const counterMap: Record<string, string> = {
        opened: 'opened',
        clicked: 'clicked',
      }
      const counter = counterMap[mappedType]
      if (counter) {
        await prisma.campaign.update({
          where: { id: event.campaignId },
          data: { [counter]: { increment: 1 } },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Resend Webhook]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
