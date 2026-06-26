import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBatch } from '@/lib/whatsapp-broadcast'
import { verifyQStashSignature } from '@/lib/qstash'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.marksio.com'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
    const valid = await verifyQStashSignature(
      req.clone() as Request,
      `${APP_URL}/api/whatsapp/broadcasts/${params.id}/batch`,
    )
    if (!valid) return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json() as {
    broadcastId?: string
    phoneNumbers?: string[]
    batchIndex?: number
    totalBatches?: number
  }

  if (!body.broadcastId || !body.phoneNumbers?.length) {
    return NextResponse.json({ error: 'Geçersiz batch payload.' }, { status: 400 })
  }

  const broadcast = await prisma.whatsappBroadcast.findUnique({
    where: { id: body.broadcastId },
    include: {
      account: {
        select: { id: true, phoneNumberId: true, accessToken: true, messagingTier: true },
      },
      template: {
        select: { metaTemplateId: true, name: true, language: true, componentsJson: true },
      },
    },
  })

  if (!broadcast || broadcast.status === 'FAILED' || !broadcast.template) {
    return NextResponse.json({ ok: true })
  }

  await sendBatch(broadcast.id, body.phoneNumbers, broadcast.account, broadcast.template)

  // Son batch ise COMPLETED yap
  const isLast = body.batchIndex !== undefined && body.totalBatches !== undefined
    && body.batchIndex === body.totalBatches - 1

  if (isLast) {
    await prisma.whatsappBroadcast.update({
      where: { id: broadcast.id },
      data: { status: 'COMPLETED' },
    })
  }

  return NextResponse.json({ ok: true })
}
