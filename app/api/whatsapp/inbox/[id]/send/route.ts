import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'

const META_API = 'https://graph.facebook.com/v19.0'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { message } = await req.json() as { message?: string }
  if (!message?.trim()) return NextResponse.json({ error: 'Mesaj boş olamaz.' }, { status: 400 })

  const conv = await prisma.whatsappConversation.findFirst({
    where: {
      id: params.id,
      account: { userId: session.user.id },
    },
    include: {
      contact: { select: { phoneNumber: true } },
      account: { select: { id: true, phoneNumberId: true, accessToken: true } },
    },
  })
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı.' }, { status: 404 })

  const accessToken = decrypt(conv.account.accessToken)
  const to = conv.contact.phoneNumber

  const metaRes = await fetch(`${META_API}/${conv.account.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: message.trim() },
    }),
  }).catch((err) => {
    console.error('[WhatsApp Send] Ağ hatası:', err)
    return null
  })

  type MetaResult = { messages?: Array<{ id?: string }>; error?: { message?: string; code?: number; type?: string } }
  let metaMessageId: string | null = null
  if (metaRes) {
    const metaResult = await metaRes.json().catch(() => ({})) as MetaResult
    if (metaRes.ok) {
      metaMessageId = metaResult.messages?.[0]?.id ?? null
    } else {
      console.error('[WhatsApp Send] Meta API hatası:', {
        status: metaRes.status,
        error: metaResult.error,
        phoneNumberId: conv.account.phoneNumberId,
      })
    }
  }

  await prisma.whatsappMessage.create({
    data: {
      conversationId: conv.id,
      direction: 'OUTBOUND',
      content: message.trim(),
      metaMessageId,
      status: metaRes?.ok ? 'SENT' : 'FAILED',
    },
  })

  await prisma.whatsappConversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: new Date() },
  })

  return NextResponse.json({ ok: true, sent: metaRes?.ok ?? false })
}
