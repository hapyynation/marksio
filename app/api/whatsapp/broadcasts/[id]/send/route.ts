import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'
import { Client } from '@upstash/qstash'

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
    await sendBatch(broadcast.id, batches[0] ?? [], broadcast.account, broadcast.template)
    if (batches.length === 1) {
      await prisma.whatsappBroadcast.update({
        where: { id: broadcast.id },
        data: { status: 'COMPLETED' },
      })
    }
  }

  return NextResponse.json({ ok: true, totalRecipients: contacts.length, batches: batches.length })
}

export async function sendBatch(
  broadcastId: string,
  phoneNumbers: string[],
  account: { id: string; phoneNumberId: string; accessToken: string },
  template: { metaTemplateId: string; name: string; language: string; componentsJson: unknown },
) {
  const accessToken = decrypt(account.accessToken)
  const META_API = 'https://graph.facebook.com/v19.0'

  for (const phoneNumber of phoneNumbers) {
    // 24 saatlik pencere dolmuşsa sadece template gönderilebilir — bu zaten template broadcast
    const contact = await prisma.whatsappContact.findFirst({
      where: { phoneNumber },
      select: { id: true },
    })

    // Conversation al veya oluştur
    let conversation = contact
      ? await prisma.whatsappConversation.findFirst({
          where: { contact: { phoneNumber }, accountId: account.id, status: { not: 'CLOSED' } },
          select: { id: true },
        })
      : null

    if (!conversation && contact) {
      conversation = await prisma.whatsappConversation.create({
        data: { contactId: contact.id, accountId: account.id, status: 'AI_HANDLING' },
        select: { id: true },
      })
    }

    // Mesaj kaydı oluştur
    const msgRecord = conversation
      ? await prisma.whatsappMessage.create({
          data: {
            conversationId: conversation.id,
            direction: 'OUTBOUND',
            status: 'QUEUED',
            broadcastId,
          },
        })
      : null

    // Meta API'ye template mesajı gönder
    const metaRes = await fetch(`${META_API}/${account.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'template',
        template: {
          name: template.name,
          language: { code: template.language },
        },
      }),
    }).catch(() => null)

    if (metaRes?.ok) {
      const data = await metaRes.json() as { messages?: Array<{ id?: string }> }
      const metaMessageId = data.messages?.[0]?.id ?? null

      if (msgRecord) {
        await prisma.whatsappMessage.update({
          where: { id: msgRecord.id },
          data: { status: 'SENT', metaMessageId },
        })
      }
      await prisma.whatsappBroadcast.update({
        where: { id: broadcastId },
        data: { sentCount: { increment: 1 } },
      })
    } else {
      const errData = metaRes ? await metaRes.json().catch(() => ({})) : {}
      const reason = (errData as { error?: { message?: string } })?.error?.message ?? 'Bilinmeyen hata'
      console.error('[WhatsApp Broadcast] Meta API hatası:', {
        status: metaRes?.status,
        error: (errData as { error?: unknown })?.error,
        phoneNumber,
        broadcastId,
      })

      if (msgRecord) {
        await prisma.whatsappMessage.update({
          where: { id: msgRecord.id },
          data: { status: 'FAILED', errorReason: reason },
        })
      }
      await prisma.whatsappBroadcast.update({
        where: { id: broadcastId },
        data: { failedCount: { increment: 1 } },
      })
    }
  }
}
