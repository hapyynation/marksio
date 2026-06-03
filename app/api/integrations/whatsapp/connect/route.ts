import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const { phoneNumberId, accessToken, displayPhone } = await req.json()
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({ error: 'Phone Number ID ve Access Token zorunlu' }, { status: 400 })
    }

    // Doğrulama: Meta API'ye test isteği at
    const testRes = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!testRes.ok) {
      return NextResponse.json({ error: 'Geçersiz API bilgileri. Phone Number ID veya Access Token hatalı.' }, { status: 400 })
    }

    const info = await testRes.json()

    await prisma.integration.upsert({
      where: { userId_platform: { userId: session.user.id, platform: 'whatsapp' } },
      create: {
        userId: session.user.id,
        platform: 'whatsapp',
        sellerId: phoneNumberId,
        accessToken,
        shopDomain: displayPhone || info.display_phone_number || '',
        status: 'active',
        meta: JSON.stringify({ verifiedName: info.verified_name }),
      },
      update: {
        sellerId: phoneNumberId,
        accessToken,
        shopDomain: displayPhone || info.display_phone_number || '',
        status: 'active',
        meta: JSON.stringify({ verifiedName: info.verified_name }),
      },
    })

    return NextResponse.json({ success: true, phone: info.display_phone_number, name: info.verified_name })
  } catch (err) {
    console.error('[WhatsApp Connect]', err)
    return NextResponse.json({ error: 'Bağlantı kurulamadı' }, { status: 500 })
  }
}
