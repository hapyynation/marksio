import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = session.user.id

  try {
    const settings = await prisma.whatsAppSettings.findUnique({ where: { userId } })

    if (!settings?.metaAccessToken || !settings?.phoneNumberId) {
      return NextResponse.json(
        { error: 'Meta Access Token ve Phone Number ID gerekli. Önce kaydedin.' },
        { status: 400 },
      )
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${settings.phoneNumberId}?fields=display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${settings.metaAccessToken}` } },
    )

    const data = await res.json()

    if (!res.ok) {
      await prisma.whatsAppSettings.update({
        where: { userId },
        data: { connectionStatus: 'error' },
      })
      const errorMsg = (data as { error?: { message?: string } })?.error?.message ?? `Meta API hatası: ${res.status}`
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    await prisma.whatsAppSettings.update({
      where: { userId },
      data: { connectionStatus: 'connected' },
    })

    return NextResponse.json({
      ok: true,
      phone: (data as { display_phone_number?: string }).display_phone_number,
      name: (data as { verified_name?: string }).verified_name,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Bağlantı hatası' }, { status: 500 })
  }
}
