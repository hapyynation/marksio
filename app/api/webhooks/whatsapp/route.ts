import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt, verifyHmacSha256 } from '@/lib/encryption'
import Groq from 'groq-sdk'
import { getStoreContextForAssistant } from '@/lib/whatsapp-assistant/store-context'

// Durum sıralaması — geriye düşmeyi önlemek için
const STATUS_ORDER: Record<string, number> = {
  QUEUED: 0, SENT: 1, DELIVERED: 2, READ: 3,
}

// ─── GET: Meta webhook doğrulama ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !token) {
    return new Response('Forbidden', { status: 403 })
  }

  const account = await prisma.whatsappAccount.findUnique({
    where: { webhookVerifyToken: token },
    select: { id: true, status: true },
  })

  if (!account || account.status === 'DISCONNECTED') {
    return new Response('Forbidden', { status: 403 })
  }

  return new Response(challenge ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}

// ─── POST: Meta webhook event handler ────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log('[WhatsApp Webhook] POST alındı —', new Date().toISOString(), '| UA:', req.headers.get('user-agent')?.slice(0, 60))

  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature-256') ?? ''

  console.log('[WhatsApp Webhook] Body uzunluğu:', rawBody.length, '| İmza:', signature ? 'var' : 'yok')

  let payload: MetaPayload
  try {
    payload = JSON.parse(rawBody) as MetaPayload
  } catch {
    console.warn('[WhatsApp Webhook] JSON parse hatası, body:', rawBody.slice(0, 200))
    return new Response('OK', { status: 200 })
  }

  // phone_number_id üzerinden hesabı bul
  const phoneNumberId = extractPhoneNumberId(payload)
  if (!phoneNumberId) return new Response('OK', { status: 200 })

  const account = await prisma.whatsappAccount.findUnique({
    where: { phoneNumberId },
    select: { id: true, appSecret: true, wabaId: true, messagingTier: true, lastWebhookAt: true },
  })

  if (!account) {
    // Bilinmeyen hesap — sessizce 200 dön (Meta retry yapmasın)
    console.warn('[WhatsApp Webhook] Bilinmeyen phoneNumberId:', phoneNumberId)
    return new Response('OK', { status: 200 })
  }

  // İmza doğrulama
  const appSecret = decrypt(account.appSecret)
  if (signature && !verifyHmacSha256(rawBody, signature, appSecret)) {
    return new Response('Forbidden', { status: 403 })
  }

  // lastWebhookAt güncelle
  prisma.whatsappAccount.update({
    where: { id: account.id },
    data: { lastWebhookAt: new Date() },
  }).catch(() => null)

  // Event routing
  try {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value
        if (!value) continue

        const field = change.field

        if (field === 'messages') {
          if (value.messages?.length) {
            for (const msg of value.messages) {
              await handleInboundMessage(account.id, phoneNumberId, value, msg)
            }
          }
          if (value.statuses?.length) {
            for (const status of value.statuses) {
              await handleStatusUpdate(account.id, status)
            }
          }
        }

        if (field === 'message_template_status_update') {
          await handleTemplateStatusUpdate(account.id, value)
        }

        if (field === 'phone_number_quality_update') {
          await handleQualityUpdate(account.id, value)
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp Webhook] İşleme hatası:', err)
  }

  // Meta her zaman 200 bekler
  return new Response('OK', { status: 200 })
}

// ─── Inbound mesaj handler ────────────────────────────────────────────────────

async function handleInboundMessage(
  accountId: string,
  _phoneNumberId: string,
  value: MetaValue,
  msg: MetaMessage,
) {
  const account = await prisma.whatsappAccount.findUnique({
    where: { id: accountId },
    select: { id: true, userId: true },
  })
  if (!account) return

  const phoneNumber = normalizePhone(msg.from)
  const now = new Date()
  const windowExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // Kontak upsert
  const contact = await prisma.whatsappContact.upsert({
    where: { userId_phoneNumber: { userId: account.userId, phoneNumber } },
    create: {
      userId: account.userId,
      phoneNumber,
      optInStatus: 'UNKNOWN',
      lastInboundAt: now,
      windowExpiresAt: windowExpires,
      tags: [],
    },
    update: {
      lastInboundAt: now,
      windowExpiresAt: windowExpires,
    },
  })

  // Conversation upsert (AI_HANDLING durumunda açık konuşma)
  let conversation = await prisma.whatsappConversation.findFirst({
    where: { contactId: contact.id, accountId, status: { not: 'CLOSED' } },
    select: { id: true },
  })

  if (!conversation) {
    conversation = await prisma.whatsappConversation.create({
      data: { contactId: contact.id, accountId, status: 'AI_HANDLING' },
      select: { id: true },
    })
  } else {
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: now },
    })
  }

  const content = extractMessageContent(msg)
  const metaMessageId = msg.id ?? null

  // Idempotency: aynı metaMessageId zaten varsa atla
  if (metaMessageId) {
    const duplicate = await prisma.whatsappMessage.findUnique({
      where: { metaMessageId },
      select: { id: true },
    })
    if (duplicate) return
  }

  await prisma.whatsappMessage.create({
    data: {
      conversationId: conversation.id,
      direction: 'INBOUND',
      content,
      metaMessageId,
      status: 'DELIVERED',
    },
  })

  // AI asistan pipeline entegrasyon noktası
  triggerAiAssistant(conversation.id).catch(() => null)
}

const TONE_MAP: Record<string, string> = {
  FORMAL: 'Resmi ve kibarca yanıt ver.',
  FRIENDLY: 'Samimi ve sıcak bir ton kullan.',
  PROFESSIONAL: 'Profesyonel ve yardımsever bir şekilde yanıtla.',
}

async function triggerAiAssistant(conversationId: string) {
  const conv = await prisma.whatsappConversation.findUnique({
    where: { id: conversationId },
    include: {
      contact: { select: { phoneNumber: true } },
      account: {
        select: {
          id: true,
          userId: true,
          phoneNumberId: true,
          accessToken: true,
          assistantConfig: { include: { faqs: true } },
        },
      },
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 10,
        select: { direction: true, content: true },
      },
    },
  })

  if (!conv) return
  if (conv.status === 'HUMAN_TAKEOVER' || conv.status === 'CLOSED') return

  const config = conv.account.assistantConfig
  if (!config?.enabled) return

  const user = await prisma.user.findUnique({
    where: { id: conv.account.userId },
    select: { plan: true },
  })
  if (!['growth', 'agency'].includes(user?.plan ?? '')) return

  const history = [...conv.messages].reverse()
  const storeContext = await getStoreContextForAssistant(conv.account.userId)

  const faqSection = config.faqs.length > 0
    ? 'Sık Sorulan Sorular:\n' + config.faqs.map(f => `S: ${f.question}\nC: ${f.answer}`).join('\n---\n')
    : ''

  const systemPrompt = [
    `Sen ${config.businessName ?? 'bu işletmenin'} WhatsApp AI müşteri asistanısın.`,
    TONE_MAP[config.tone] ?? TONE_MAP.PROFESSIONAL,
    'Kısa ve net yanıtlar ver. Gereksiz uzun açıklamalar yapma.',
    storeContext ? `\nMağaza Bilgileri:\n${storeContext}` : '',
    config.customKnowledge ? `\nÖzel Bilgi:\n${config.customKnowledge}` : '',
    faqSection ? `\n${faqSection}` : '',
  ].filter(Boolean).join('\n')

  const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...history
      .filter(m => m.content)
      .map(m => ({
        role: (m.direction === 'INBOUND' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content!,
      })),
  ]

  let reply: string | undefined
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      max_tokens: 300,
      temperature: 0.7,
    })
    reply = completion.choices[0]?.message?.content?.trim() ?? undefined
  } catch (err) {
    console.error('[AI Assistant] Groq hatası:', err)
    reply = config.fallbackMessage ?? undefined
  }

  if (!reply) return

  const accessToken = decrypt(conv.account.accessToken)
  const metaRes = await fetch(`https://graph.facebook.com/v19.0/${conv.account.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: conv.contact.phoneNumber,
      type: 'text',
      text: { body: reply },
    }),
  }).catch((err) => {
    console.error('[AI Assistant] Ağ hatası:', err)
    return null
  })

  type MetaResult = { messages?: Array<{ id?: string }>; error?: { message?: string; code?: number; type?: string } }
  let metaMessageId: string | null = null
  if (metaRes) {
    const metaResult = await metaRes.json().catch(() => ({})) as MetaResult
    if (metaRes.ok) {
      metaMessageId = metaResult.messages?.[0]?.id ?? null
    } else {
      console.error('[AI Assistant] Meta API hatası:', {
        status: metaRes.status,
        error: metaResult.error,
        phoneNumberId: conv.account.phoneNumberId,
        conversationId: conv.id,
      })
    }
  }

  await prisma.whatsappMessage.create({
    data: {
      conversationId: conv.id,
      direction: 'OUTBOUND',
      content: reply,
      metaMessageId,
      status: metaRes?.ok ? 'SENT' : 'FAILED',
    },
  })

  await prisma.whatsappConversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: new Date() },
  }).catch(() => null)
}

// ─── Status update handler ────────────────────────────────────────────────────

async function handleStatusUpdate(_accountId: string, status: MetaStatus) {
  const metaMessageId = status.id
  if (!metaMessageId) return

  const newStatus = mapMetaStatus(status.status)
  if (!newStatus) return

  const existing = await prisma.whatsappMessage.findUnique({
    where: { metaMessageId },
    select: { id: true, status: true, broadcastId: true },
  })
  if (!existing) return

  // Geriye düşmeyi engelle (READ geldikten sonra SENT gelirse yoksay)
  if (newStatus !== 'FAILED') {
    const currentOrder = STATUS_ORDER[existing.status] ?? -1
    const newOrder = STATUS_ORDER[newStatus] ?? -1
    if (newOrder <= currentOrder) return
  }

  await prisma.whatsappMessage.update({
    where: { id: existing.id },
    data: { status: newStatus },
  })

  // Broadcast sayaçlarını atomik güncelle
  if (existing.broadcastId) {
    const counterField = {
      SENT: 'sentCount',
      DELIVERED: 'deliveredCount',
      READ: 'readCount',
      FAILED: 'failedCount',
    }[newStatus]

    if (counterField) {
      await prisma.whatsappBroadcast.update({
        where: { id: existing.broadcastId },
        data: { [counterField]: { increment: 1 } },
      }).catch(() => null)
    }
  }
}

// ─── Template status update ───────────────────────────────────────────────────

async function handleTemplateStatusUpdate(accountId: string, value: MetaValue) {
  const templateEvent = value.message_template_status_update
  if (!templateEvent) return

  const metaTemplateId = String(templateEvent.message_template_id)
  const event = templateEvent.event
  if (!event) return
  const newStatus = mapTemplateStatus(event)
  if (!newStatus) return

  await prisma.whatsappTemplate.updateMany({
    where: { accountId, metaTemplateId },
    data: {
      status: newStatus,
      rejectedReason: templateEvent.reason ?? null,
    },
  })
}

// ─── Quality / tier update ────────────────────────────────────────────────────

async function handleQualityUpdate(accountId: string, value: MetaValue) {
  const qualityData = value.phone_number_quality_update
  if (!qualityData) return

  const QUALITY_MAP: Record<string, 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'> = {
    GREEN: 'GREEN', YELLOW: 'YELLOW', RED: 'RED',
  }
  const TIER_MAP: Record<string, 'TIER_250' | 'TIER_1K' | 'TIER_10K' | 'TIER_100K' | 'UNLIMITED'> = {
    TIER_250: 'TIER_250', TIER_1K: 'TIER_1K', TIER_10K: 'TIER_10K',
    TIER_100K: 'TIER_100K', UNLIMITED: 'UNLIMITED',
  }

  await prisma.whatsappAccount.update({
    where: { id: accountId },
    data: {
      qualityRating: QUALITY_MAP[qualityData.current_limit ?? ''] ?? 'UNKNOWN',
      messagingTier: TIER_MAP[qualityData.messaging_limit_tier ?? ''] ?? undefined,
    },
  })
}

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

function extractPhoneNumberId(payload: MetaPayload): string | null {
  try {
    return payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ?? null
  } catch {
    return null
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function extractMessageContent(msg: MetaMessage): string {
  if (msg.type === 'text') return msg.text?.body ?? ''
  if (msg.type === 'image') return '[Görsel]'
  if (msg.type === 'video') return '[Video]'
  if (msg.type === 'audio') return '[Ses]'
  if (msg.type === 'document') return '[Dosya]'
  if (msg.type === 'location') return '[Konum]'
  return `[${msg.type}]`
}

function mapMetaStatus(s: string): 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | null {
  const map: Record<string, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
    sent: 'SENT', delivered: 'DELIVERED', read: 'READ', failed: 'FAILED',
  }
  return map[s] ?? null
}

function mapTemplateStatus(
  event: string
): 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED' | null {
  const map: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED'> = {
    APPROVED: 'APPROVED', REJECTED: 'REJECTED', PENDING: 'PENDING',
    PAUSED: 'PAUSED', DISABLED: 'DISABLED',
  }
  return map[event] ?? null
}

// ─── Tip tanımları ────────────────────────────────────────────────────────────

interface MetaPayload {
  object?: string
  entry?: Array<{
    id?: string
    changes?: Array<{
      field?: string
      value?: MetaValue
    }>
  }>
}

interface MetaValue {
  metadata?: { phone_number_id?: string; display_phone_number?: string }
  messages?: MetaMessage[]
  statuses?: MetaStatus[]
  message_template_status_update?: {
    message_template_id?: number
    event?: string
    reason?: string
  }
  phone_number_quality_update?: {
    current_limit?: string
    messaging_limit_tier?: string
  }
}

interface MetaMessage {
  id?: string
  from: string
  type: string
  text?: { body?: string }
  timestamp?: string
}

interface MetaStatus {
  id: string
  status: string
  timestamp?: string
  recipient_id?: string
  conversation?: { id?: string }
  pricing?: { billable?: boolean; pricing_model?: string; category?: string }
}
