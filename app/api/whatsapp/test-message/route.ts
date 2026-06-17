import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { phoneNumber } = await req.json() as { phoneNumber?: string }
  if (!phoneNumber?.trim()) {
    return NextResponse.json({ error: 'Telefon numarası gerekli' }, { status: 400 })
  }

  const integration = await prisma.integration.findFirst({
    where: { userId: session.user.id, platform: 'whatsapp', status: 'active' },
  })

  if (!integration?.accessToken || !integration?.sellerId) {
    return NextResponse.json(
      { error: 'Test göndermek için önce WhatsApp API\'yi bağlayın' },
      { status: 400 }
    )
  }

  try {
    await sendWhatsAppMessage({
      phoneNumberId: integration.sellerId,
      accessToken: integration.accessToken,
      to: phoneNumber.trim(),
      body: 'Bu bir Marksio test mesajıdır. WhatsApp entegrasyonunuz başarıyla çalışıyor! 🎉',
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Mesaj gönderilemedi' },
      { status: 500 }
    )
  }
}
