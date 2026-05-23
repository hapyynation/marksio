import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const { to, body, campaignId } = await req.json()
    if (!to || !body) return NextResponse.json({ error: 'to ve body zorunlu' }, { status: 400 })

    // Kullanıcının bağlı WhatsApp entegrasyonunu al
    const integration = await prisma.integration.findFirst({
      where: { userId: session.user.id, platform: 'whatsapp', status: 'active' },
    })

    if (!integration?.accessToken || !integration?.sellerId) {
      return NextResponse.json({ error: 'WhatsApp Business API bağlantısı bulunamadı' }, { status: 503 })
    }

    const phoneNumberId = integration.sellerId
    const accessToken = integration.accessToken
    const numbers: string[] = Array.isArray(to) ? to : [to]

    let validNumbers = numbers
    if (campaignId) {
      const customers = await prisma.customer.findMany({
        where: { userId: session.user.id, phone: { in: numbers }, unsubscribed: false },
        select: { phone: true },
      })
      const validSet = new Set(customers.map(c => c.phone))
      validNumbers = numbers.filter(n => validSet.has(n))
    }

    let sent = 0
    const errors: string[] = []

    for (const number of validNumbers) {
      try {
        await sendWhatsAppMessage({ phoneNumberId, accessToken, to: number, body })
        sent++
      } catch (e) {
        errors.push(`${number}: ${e instanceof Error ? e.message : 'hata'}`)
      }
    }

    if (campaignId && sent > 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { sent: { increment: sent }, status: 'active' },
      }).catch(() => null)
    }

    return NextResponse.json({ success: true, sent, skipped: numbers.length - validNumbers.length, errors: errors.length ? errors : undefined })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'WhatsApp gönderilemedi' }, { status: 500 })
  }
}
