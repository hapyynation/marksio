import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildChatbotReply } from '@/lib/chatbot'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = session.user.id

  try {
    const { message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'message zorunlu' }, { status: 400 })

    const [settings, quickReplies, user] = await Promise.all([
      prisma.whatsAppSettings.findUnique({ where: { userId } }),
      prisma.whatsAppQuickReply.findMany({ where: { userId, isActive: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { storeName: true } }),
    ])

    const msgLower = message.toLowerCase()

    // Check quick replies first — keyword match wins
    for (const qr of quickReplies) {
      const keywords = qr.triggerKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
      if (keywords.some(kw => msgLower.includes(kw))) {
        return NextResponse.json({ reply: qr.responseText, source: 'quick_reply', matchedTitle: qr.title })
      }
    }

    // Fallback to AI with bot settings
    const reply = await buildChatbotReply({
      storeName: user?.storeName ?? 'Mağaza',
      customerName: null,
      customerOrders: [],
      activeCampaigns: [],
      currency: 'TRY',
      userMessage: message,
      botSettings: settings
        ? {
            tone: settings.tone,
            responseLength: settings.responseLength,
            emojiUsage: settings.emojiUsage,
            fallbackMessage: settings.fallbackMessage,
            botName: settings.botName,
          }
        : undefined,
    })

    return NextResponse.json({ reply, source: 'ai' })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}
