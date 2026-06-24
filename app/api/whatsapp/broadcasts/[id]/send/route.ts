import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { Client } from '@upstash/qstash'
import { sendBatch } from '@/lib/whatsapp-broadcast'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.marksio.com'

// Tier'a göre batch boyutu ve arasındaki saniye
const TIER_CONFIG: Record<string, { batchSize: number; delaySeconds: number }> = {
  TIER_250:  { batchSize: 25,   delaySeconds: 60 },
  TIER_1K:   { batchSize: 100,  delaySeconds: 30 },
  TIER_10K:  { batchSize: 250,  delaySeconds: 15 },
  TIER_100K: { batchSize: 500,  delaySeconds: 10 },
  UNLIMITED: { batchSize: 1000, delaySeconds: 5 },
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const broadcast = await prisma.whatsappBroadcast.findFirst({
    where: { id: params.id, account: { userId: session.user.id } },
    include: {
      account: {
        select: { id: true, phoneNumberId: true, accessToken: true, messagingTier: true, userId: true },
      },
      template: {
        select: { metaTemplateId: true, name: true, language: true, componentsJson: true },
      },
    },
  })

  if (!broadcast) return NextResponse.json({ error: 'Broadcast bulunamadı.' }, { status: 404 })
  if (broadcast.demo) return NextResponse.json({ error: 'Demo broadcast gönderilemez.' }, { status: 400 })
  if (!broadcast.template) return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 400 })
  if (broadcast.status !== 'DRAFT' && broadcast.status !== 'SCHEDULED') {
    return NextResponse.json({ error: 'Broadcast zaten gönderilmiş veya gönderiliyor.' }, { status: 409 })
  }

  // Segment kontaklarını al (sadece OPTED_IN)
  const contacts = await prisma.whatsappContact.findMany({
    where: {
      userId: broadcast.account.userId,
      optInStatus: 'OPTED_IN',
      ...(broadcast.segmentId ? { tags: { has: broadcast.segmentId } } : {}),
    },
    select: { id: true, phoneNumber: true },
  })

  if (contacts.length === 0) {
    await prisma.whatsappBroadcast.update({
      where: { id: broadcast.id },
      data: { status: 'COMPLETED', totalRecipients: 0 },
    })
    return NextResponse.json({ ok: true, totalRecipients: 0 })
  }

  await prisma.whatsappBroadcast.update({
    where: { id: broadcast.id },
    data: { status: 'SENDING', totalRecipients: contacts.length },
  })

  const config = TIER_CONFIG[broadcast.account.messagingTier] ?? TIER_CONFIG.TIER_250
  const qstash = process.env.QSTASH_TOKEN ? new Client({ token: process.env.QSTASH_TOKEN }) : null

  // Batch'lere böl ve QStash'e yayınla
  const batches: string[][] = []
  for (let i = 0; i < contacts.length; i += config.batchSize) {
    batches.push(contacts.slice(i, i + config.batchSize).map(c => c.phoneNumber))
  }

  if (qstash) {
    for (let i = 0; i < batches.length; i++) {
      await qstash.publishJSON({
        url: `${APP_URL}/api/whatsapp/broadcasts/${broadcast.id}/batch`,
        delay: i * config.delaySeconds,
        body: {
          broadcastId: broadcast.id,
          phoneNumbers: batches[i],
          batchIndex: i,
          totalBatches: batches.length,
        },
      })
    }
  } else {
    // QStash yoksa ilk batch'i senkron gönder (geliştirme ortamı)
    await sendBatch(broadcast.id, batches[0] ?? [], broadcast.account, broadcast.template!)
    if (batches.length === 1) {
      await prisma.whatsappBroadcast.update({
        where: { id: broadcast.id },
        data: { status: 'COMPLETED' },
      })
    }
  }

  return NextResponse.json({ ok: true, totalRecipients: contacts.length, batches: batches.length })
}

