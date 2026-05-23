import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { buildChatbotReply } from '@/lib/chatbot'

// Meta webhook doğrulama
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Gelen WhatsApp mesajlarını işle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ ok: true })
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value
        if (!value?.messages?.length) continue

        const phoneNumberId: string = value.metadata?.phone_number_id
        const message = value.messages[0]

        if (message.type !== 'text') continue

        const from: string = message.from
        const text: string = message.text?.body ?? ''

        if (!text || !phoneNumberId) continue

        // Hangi mağaza bu numaraya sahip?
        const integration = await prisma.integration.findFirst({
          where: { platform: 'whatsapp', sellerId: phoneNumberId, status: 'active' },
          include: { user: { select: { id: true, storeName: true } } },
        })

        if (!integration?.accessToken) continue

        const userId = integration.userId
        const storeName = integration.user.storeName

        // Müşteriyi bul (telefon numarasından)
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

        // Mağaza ürün/kampanya verisi
        const [campaigns, recentOrders] = await Promise.all([
          prisma.campaign.findMany({
            where: { userId, status: 'active' },
            select: { name: true, type: true, segment: true },
            take: 5,
          }),
          prisma.order.findMany({
            where: { userId },
            orderBy: { placedAt: 'desc' },
            take: 1,
            select: { currency: true },
          }),
        ])

        const currency = recentOrders[0]?.currency ?? 'TRY'

        // AI yanıt üret
        const reply = await buildChatbotReply({
          storeName,
          customerName: customer?.name,
          customerOrders: customer?.orders ?? [],
          activeCampaigns: campaigns,
          currency,
          userMessage: text,
        })

        // WhatsApp'tan yanıt gönder
        await sendWhatsAppMessage({
          phoneNumberId,
          accessToken: integration.accessToken,
          to: from,
          body: reply,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[WhatsApp Webhook]', err)
    return NextResponse.json({ ok: true }) // Meta her zaman 200 bekler
  }
}
