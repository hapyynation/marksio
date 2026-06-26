import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { buildChatbotReply } from '@/lib/chatbot'
import { decrypt, verifyHmacSha256 } from '@/lib/encryption'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !token) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check new model accounts first
  const newAccount = await prisma.whatsappAccount.findFirst({
    where: { webhookVerifyToken: token },
  })
  if (newAccount) return new Response(challenge, { status: 200 })

  // Check global env token
  const globalToken = process.env.WHATSAPP_VERIFY_TOKEN
  if (globalToken && token === globalToken) return new Response(challenge, { status: 200 })

  // Legacy fallback
  const match = await prisma.whatsAppSettings.findFirst({
    where: { webhookVerifyToken: token },
  })
  if (match) return new Response(challenge, { status: 200 })

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-hub-signature-256') ?? ''

    // Per-account HMAC doğrulaması — appSecret ile imzalı istekler kabul edilir
    if (signature) {
      const phoneNumberId = (() => {
        try {
          const p = JSON.parse(rawBody)
          return p?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id as string | undefined
        } catch { return undefined }
      })()
      if (phoneNumberId) {
        const acct = await prisma.whatsappAccount.findUnique({
          where: { phoneNumberId },
          select: { appSecret: true },
        }).catch(() => null)
        if (acct?.appSecret) {
          const secret = (() => { try { return decrypt(acct.appSecret) } catch { return null } })()
          if (secret && !verifyHmacSha256(rawBody, signature, secret)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
        }
      }
    }

    const body = JSON.parse(rawBody)

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ ok: true })
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value

        // ── Status updates ────────────────────────────────────────────────────
        if (value?.statuses?.length) {
          for (const status of value.statuses) {
            const waMessageId: string = status.id
            const statusType: string = status.status
            const phoneNumberId: string = value.metadata?.phone_number_id ?? ''

            // New model message status update
            const newMsg = await prisma.whatsappMessage.findFirst({
              where: { metaMessageId: waMessageId },
              select: { id: true, broadcastId: true },
            }).catch(() => null)

            if (newMsg) {
              const s = statusType.toUpperCase() as 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
              await prisma.whatsappMessage.update({
                where: { id: newMsg.id },
                data: { status: s },
              }).catch(() => null)

              if (newMsg.broadcastId) {
                await prisma.whatsappBroadcast.update({
                  where: { id: newMsg.broadcastId },
                  data: {
                    ...(statusType === 'delivered' && { deliveredCount: { increment: 1 } }),
                    ...(statusType === 'read' && { readCount: { increment: 1 } }),
                    ...(statusType === 'failed' && { failedCount: { increment: 1 } }),
                  },
                }).catch(() => null)
              }
            }

            // Legacy model status update
            const legacyMsg = await prisma.whatsAppMessage.findFirst({
              where: { externalId: waMessageId },
            }).catch(() => null)

            if (legacyMsg) {
              await prisma.whatsAppMessage.update({
                where: { id: legacyMsg.id },
                data: {
                  status: statusType,
                  ...(statusType === 'delivered' && { deliveredAt: new Date() }),
                  ...(statusType === 'read' && { readAt: new Date() }),
                  ...(statusType === 'failed' && { failedAt: new Date() }),
                },
              }).catch(() => null)
            }

            // Legacy campaign counters
            if (statusType === 'read' || statusType === 'delivered') {
              const integration = await prisma.integration.findFirst({
                where: { platform: 'whatsapp', sellerId: phoneNumberId, status: 'active' },
              }).catch(() => null)
              if (integration) {
                const campaign = await prisma.whatsAppCampaign.findFirst({
                  where: { userId: integration.userId, externalMessageId: waMessageId },
                }).catch(() => null)
                if (campaign) {
                  await prisma.whatsAppCampaign.update({
                    where: { id: campaign.id },
                    data: {
                      ...(statusType === 'delivered' && { delivered: { increment: 1 } }),
                      ...(statusType === 'read' && { opened: { increment: 1 } }),
                    },
                  }).catch(() => null)
                }
              }
            }
          }
        }

        if (!value?.messages?.length) continue

        const phoneNumberId: string = value.metadata?.phone_number_id
        const message = value.messages[0]
        if (message.type !== 'text') continue

        const from: string = message.from
        const text: string = message.text?.body ?? ''
        if (!text || !phoneNumberId) continue

        // ── NEW MODEL: WhatsappAccount path ───────────────────────────────────
        const waAccount = await prisma.whatsappAccount.findFirst({
          where: { phoneNumberId, status: 'CONNECTED' },
          include: {
            user: { select: { id: true, storeName: true } },
            assistantConfig: {
              include: { faqs: true, knowledgeSources: true },
            },
          },
        })

        if (waAccount) {
          await handleNewModelMessage({
            waAccount,
            from,
            text,
            metaMessageId: message.id as string,
            phoneNumberId,
          })
          // Don't fall through to legacy path for this phone number
          continue
        }

        // ── LEGACY MODEL path ─────────────────────────────────────────────────
        const settings = await prisma.whatsAppSettings.findFirst({
          where: { phoneNumberId, connectionStatus: 'connected' },
          include: { user: { select: { id: true, storeName: true } } },
        })

        let accessToken: string | undefined
        let userId: string | undefined
        let storeName: string | undefined

        if (settings?.metaAccessToken) {
          accessToken = settings.metaAccessToken
          userId = settings.userId
          storeName = settings.user.storeName
        } else {
          const integration = await prisma.integration.findFirst({
            where: { platform: 'whatsapp', sellerId: phoneNumberId, status: 'active' },
            include: { user: { select: { id: true, storeName: true } } },
          })
          if (!integration?.accessToken) continue
          accessToken = integration.accessToken
          userId = integration.userId
          storeName = integration.user.storeName
        }

        if (!accessToken || !userId) continue

        let conversation = await prisma.whatsAppConversation.findFirst({
          where: { userId, customerPhone: from, status: 'open' },
        })

        if (!conversation) {
          const customer = await prisma.customer.findFirst({
            where: { userId, phone: { contains: from.slice(-10) } },
            select: { name: true },
          })
          conversation = await prisma.whatsAppConversation.create({
            data: {
              userId,
              customerPhone: from,
              customerName: customer?.name ?? null,
              status: 'open',
              lastMessage: text,
            },
          })
        } else {
          await prisma.whatsAppConversation.update({
            where: { id: conversation.id },
            data: { lastMessage: text, updatedAt: new Date() },
          })
        }

        await prisma.whatsAppMessage.create({
          data: { conversationId: conversation.id, role: 'customer', content: text },
        })

        const quickReplies = await prisma.whatsAppQuickReply.findMany({ where: { userId, isActive: true } })
        const msgLower = text.toLowerCase()
        let reply: string | null = null

        for (const qr of quickReplies) {
          const keywords = qr.triggerKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
          if (keywords.some(kw => msgLower.includes(kw))) { reply = qr.responseText; break }
        }

        if (!reply) {
          const customer = await prisma.customer.findFirst({
            where: { userId, phone: { contains: from.slice(-10) } },
            include: { orders: { orderBy: { placedAt: 'desc' }, take: 3, select: { orderNumber: true, status: true, total: true, placedAt: true } } },
          })
          const [campaigns, botSettings] = await Promise.all([
            prisma.campaign.findMany({ where: { userId, status: 'active' }, select: { name: true, type: true, segment: true }, take: 5 }),
            settings ? Promise.resolve({ tone: settings.tone, responseLength: settings.responseLength, emojiUsage: settings.emojiUsage, fallbackMessage: settings.fallbackMessage, botName: settings.botName }) : Promise.resolve(undefined),
          ])
          reply = await buildChatbotReply({ storeName: storeName ?? 'Mağaza', customerName: customer?.name, customerOrders: customer?.orders ?? [], activeCampaigns: campaigns, currency: 'TRY', userMessage: text, botSettings })
        }

        await prisma.whatsAppMessage.create({ data: { conversationId: conversation.id, role: 'bot', content: reply } })
        await sendWhatsAppMessage({ phoneNumberId, accessToken, to: from, body: reply })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[WhatsApp Webhook]', err)
    return NextResponse.json({ ok: true })
  }
}

// ─── New model message handler ────────────────────────────────────────────────

async function handleNewModelMessage({
  waAccount,
  from,
  text,
  metaMessageId,
  phoneNumberId,
}: {
  waAccount: {
    id: string
    userId: string
    accessToken: string
    user: { id: string; storeName: string }
    assistantConfig: {
      id: string
      enabled: boolean
      fallbackMessage: string | null
      customKnowledge: string | null
      businessName: string | null
      faqs: Array<{ question: string; answer: string }>
      knowledgeSources: Array<{ sourceType: string; content: string | null; url: string | null; fileName: string | null; title: string | null }>
    } | null
  }
  from: string
  text: string
  metaMessageId: string
  phoneNumberId: string
}) {
  const userId = waAccount.user.id

  // Find or create contact
  let contact = await prisma.whatsappContact.upsert({
    where: { userId_phoneNumber: { userId, phoneNumber: from } },
    create: { userId, phoneNumber: from, optInStatus: 'OPTED_IN', lastInboundAt: new Date() },
    update: { lastInboundAt: new Date() },
  })

  // Find open conversation or create one
  let conv = await prisma.whatsappConversation.findFirst({
    where: { contactId: contact.id, accountId: waAccount.id, status: { not: 'CLOSED' } },
  })

  if (!conv) {
    conv = await prisma.whatsappConversation.create({
      data: { contactId: contact.id, accountId: waAccount.id, status: 'AI_HANDLING' },
    })
  }

  // Record inbound message
  await prisma.whatsappMessage.create({
    data: {
      conversationId: conv.id,
      direction: 'INBOUND',
      content: text,
      metaMessageId,
      status: 'DELIVERED',
    },
  })

  await prisma.whatsappConversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: new Date() },
  })

  // Human takeover → no auto reply
  if (conv.status === 'HUMAN_TAKEOVER') return

  // Build AI reply
  const customer = await prisma.customer.findFirst({
    where: { userId, OR: [{ phone: { endsWith: from.slice(-10) } }, { phone: from }] },
    include: { orders: { orderBy: { placedAt: 'desc' }, take: 3, select: { orderNumber: true, status: true, total: true, placedAt: true } } },
  })

  const aiConfig = waAccount.assistantConfig
  const orderDataUsed = (customer?.orders?.length ?? 0) > 0

  let reply: string
  let intent: string | null = null
  let confidence: number | null = null
  let knowledgeSource: string | null = null
  let faqMatched: string | null = null
  let transferred = false
  let transferReason: string | null = null

  // Check FAQ matches first
  if (aiConfig?.enabled && aiConfig.faqs.length > 0) {
    const matched = findBestFaqMatch(text, aiConfig.faqs)
    if (matched) {
      reply = matched.answer
      intent = 'faq_match'
      confidence = 0.95
      knowledgeSource = 'faq'
      faqMatched = matched.question
    }
  }

  if (!reply!) {
    try {
      const botSettings = aiConfig ? {
        tone: 'friendly',
        responseLength: 'medium',
        emojiUsage: 'low',
        fallbackMessage: aiConfig.fallbackMessage ?? 'Üzgünüm, şu an yanıt veremiyorum.',
        botName: aiConfig.businessName ?? waAccount.user.storeName,
      } : undefined

      reply = await buildChatbotReply({
        storeName: aiConfig?.businessName ?? waAccount.user.storeName,
        customerName: customer?.name,
        customerOrders: customer?.orders ?? [],
        activeCampaigns: [],
        currency: 'TRY',
        userMessage: text,
        botSettings,
        knowledgeSources: aiConfig?.knowledgeSources ?? [],
      })

      intent = 'general_query'
      confidence = 0.75
      knowledgeSource = orderDataUsed ? 'order_data' : 'custom_knowledge'
    } catch {
      reply = aiConfig?.fallbackMessage ?? 'Üzgünüm, şu an yanıt veremiyorum. Ekibimiz en kısa sürede iletişime geçecek.'
      transferred = true
      transferReason = 'ai_error'
      await prisma.whatsappConversation.update({
        where: { id: conv.id },
        data: { status: 'HUMAN_TAKEOVER' },
      })
    }
  }

  // Record AI decision log
  await prisma.aiDecisionLog.create({
    data: {
      conversationId: conv.id,
      userId,
      intent,
      confidence,
      knowledgeSource,
      faqMatched,
      orderDataUsed,
      transferred,
      transferReason,
      action: transferred ? 'transfer_to_human' : 'auto_reply',
      responsePreview: reply.slice(0, 100),
    },
  })

  // Send reply via Meta
  const accessToken = decrypt(waAccount.accessToken)
  const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: from, type: 'text', text: { body: reply } }),
  }).catch(() => null)

  const outboundId = metaRes?.ok
    ? await metaRes.json().then((r: { messages?: Array<{ id?: string }> }) => r.messages?.[0]?.id ?? null).catch(() => null)
    : null

  // Record outbound message
  await prisma.whatsappMessage.create({
    data: {
      conversationId: conv.id,
      direction: 'OUTBOUND',
      content: reply,
      metaMessageId: outboundId ?? undefined,
      status: metaRes?.ok ? 'SENT' : 'FAILED',
    },
  })
}

// ─── FAQ matching ─────────────────────────────────────────────────────────────

const TR_STOPWORDS = new Set([
  'bir', 'bu', 'da', 'de', 'mi', 've', 'ya', 'ne', 'en', 'ben', 'sen',
  'biz', 'siz', 'ama', 'için', 'gibi', 'daha', 'çok', 'kadar', 'var',
  'yok', 'nasıl', 'neden', 'niçin', 'ile', 'her', 'olan', 'olan', 'olan',
  'bu', 'şu', 'o', 'ki', 'mı', 'mu', 'mü', 'mi',
])

function normalizeTr(s: string): string {
  return s.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
}

function keywords(s: string): string[] {
  return normalizeTr(s)
    .split(/[\s,?.!]+/)
    .filter(w => w.length >= 3 && !TR_STOPWORDS.has(w))
}

function findBestFaqMatch(
  text: string,
  faqs: Array<{ question: string; answer: string }>,
): { question: string; answer: string } | null {
  const msgNorm = normalizeTr(text)
  const msgWords = new Set(keywords(text))

  for (const faq of faqs) {
    // Direct substring check
    if (msgNorm.includes(normalizeTr(faq.question))) return faq

    // Keyword overlap: ≥60% of FAQ keywords found in message
    const faqWords = keywords(faq.question)
    if (faqWords.length === 0) continue
    const overlap = faqWords.filter(w => msgWords.has(w)).length
    if (overlap / faqWords.length >= 0.6) return faq
  }

  return null
}
