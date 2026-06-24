import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { conversationId, messages } = await req.json() as {
    conversationId: string
    messages: Array<{ role: string; body: string }>
  }

  if (!conversationId || !messages?.length) {
    return NextResponse.json({ suggestions: [] })
  }

  const conv = await prisma.whatsappConversation.findFirst({
    where: { id: conversationId, account: { userId: session.user.id } },
    include: {
      contact: { select: { phoneNumber: true } },
      account: { include: { assistantConfig: true } },
    },
  })
  if (!conv) return NextResponse.json({ suggestions: [] })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storeName: true },
  })

  const phone = conv.contact.phoneNumber
  const last10 = phone.replace(/\D/g, '').slice(-10)

  const customer = await prisma.customer.findFirst({
    where: {
      userId: session.user.id,
      OR: [{ phone: { endsWith: last10 } }, { phone: phone }],
    },
    include: {
      orders: {
        orderBy: { placedAt: 'desc' },
        take: 3,
        select: { orderNumber: true, status: true, total: true, placedAt: true },
      },
    },
  })

  const history = messages.slice(-8).map(m =>
    `${m.role === 'customer' ? 'Müşteri' : 'Temsilci'}: ${m.body}`
  ).join('\n')

  const customerCtx = customer
    ? `Müşteri: ${customer.name}, ${customer.totalOrders} sipariş, toplam ${customer.totalSpent.toFixed(2)} TL harcama.${customer.orders.length ? ` Son sipariş: #${customer.orders[0].orderNumber} (${customer.orders[0].status})` : ''}`
    : 'Müşteri kaydı bulunamadı.'

  try {
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Sen ${user?.storeName ?? 'bir mağaza'} adına çalışan bir müşteri hizmetleri asistanısın.

${customerCtx}

Son konuşma:
${history}

Yukarıdaki konuşmaya devam için 3 farklı kısa Türkçe cevap önerisi yaz.
- Her öneri yeni bir satırda, numara ile başlasın (1. 2. 3.)
- Her öneri maksimum 2 cümle
- Gerçekçi, samimi ve yardımcı ton
- Öneri dışında başka metin yazma`,
      }],
    })

    const text = resp.content[0].type === 'text' ? resp.content[0].text : ''
    const suggestions = text
      .split('\n')
      .filter(l => /^\d\./.test(l.trim()))
      .map(l => l.replace(/^\d\.\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 3)

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
