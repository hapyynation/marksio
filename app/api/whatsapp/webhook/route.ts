import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { buildChatbotReply } from '@/lib/chatbot'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !token) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check against global env token first, then per-user tokens
  const globalToken = process.env.WHATSAPP_VERIFY_TOKEN
  if (globalToken && token === globalToken) {
    return new Response(challenge, { status: 200 })
  }

  const match = await prisma.whatsAppSettings.findFirst({
    where: { webhookVerifyToken: token },
  })

  if (match) {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ ok: true })
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value

        // ── Delivery / read status güncellemeleri ─────────────────────────
        if (value?.statuses?.length) {
          for (const status of value.statuses) {
            const waMessageId: string = status.id
            const statusType: string  = status.status // sent | delivered | read | failed
            const phoneNumberId: string = value.metadata?.phone_number_id ?? ''

            // Kampanya mesajını bul ve durumunu güncelle
            const waMsg = await prisma.whatsAppMessage.findFirst({
              where: { externalId: waMessageId },
            }).catch(() => null)

            if (waMsg) {
              await prisma.whatsAppMessage.update({
                where: { id: waMsg.id },
                data: {
                  status:    statusType,
                  ...(statusType === 'delivered' && { deliveredAt: new Date() }),
                  ...(statusType === 'read'      && { readAt: new Date() }),
                  ...(statusType === 'failed'    && { failedAt: new Date() }),
                },
              }).catch(() => null)
            }

            // WhatsApp kampanya sayaçlarını güncelle
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
                      ...(statusType === 'read'      && { opened: { increment: 1 } }),
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

        // Find settings by phoneNumberId — prefer WhatsAppSettings, fallback to Integration
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
          // Legacy fallback: Integration model
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

        // Find or create conversation
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

        // Store incoming message
        await prisma.whatsAppMessage.create({
          data: { conversationId: conversation.id, role: 'customer', content: text },
        })

        // Check quick replies
        const quickReplies = await prisma.whatsAppQuickReply.findMany({
          where: { userId, isActive: true },
        })

        const msgLower = text.toLowerCase()
        let reply: string | null = null

        for (const qr of quickReplies) {
          const keywords = qr.triggerKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
          if (keywords.some(kw => msgLower.includes(kw))) {
            reply = qr.responseText
            break
          }
        }

        // If no quick reply match, generate AI response
        if (!reply) {
          const customer = await prisma.customer.findFirst({
            where: { userId, phone: { contains: from.slice(-10) } },
            include: {
              orders: {
                orderBy: { placedAt: 'desc' },
                take: 3,
                select: { orderNumber: true, status: true, total: true, placedAt: true },
              },
            },
          })

          const [campaigns, botSettings] = await Promise.all([
            prisma.campaign.findMany({
              where: { userId, status: 'active' },
              select: { name: true, type: true, segment: true },
              take: 5,
            }),
            settings
              ? Promise.resolve({
                  tone: settings.tone,
                  responseLength: settings.responseLength,
                  emojiUsage: settings.emojiUsage,
                  fallbackMessage: settings.fallbackMessage,
                  botName: settings.botName,
                })
              : Promise.resolve(undefined),
          ])

          reply = await buildChatbotReply({
            storeName: storeName ?? 'Mağaza',
            customerName: customer?.name,
            customerOrders: customer?.orders ?? [],
            activeCampaigns: campaigns,
            currency: 'TRY',
            userMessage: text,
            botSettings,
          })
        }

        // Store bot message
        await prisma.whatsAppMessage.create({
          data: { conversationId: conversation.id, role: 'bot', content: reply },
        })

        // Send response via Meta
        await sendWhatsAppMessage({ phoneNumberId, accessToken, to: from, body: reply })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[WhatsApp Webhook]', err)
    return NextResponse.json({ ok: true }) // Meta always expects 200
  }
}
