import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const storeId = req.nextUrl.searchParams.get('storeId') ?? ''
  if (!storeId) return NextResponse.json({ error: 'storeId gerekli' }, { status: 400 })

  // Entegrasyonun bu kullanıcıya ait olduğunu doğrula
  const integration = await prisma.integration.findFirst({
    where: { id: storeId, userId: session.user.id, status: 'active' },
    select: { id: true },
  })
  if (!integration) return NextResponse.json({ error: 'Entegrasyon bulunamadı' }, { status: 404 })

  const since2min = new Date(Date.now() - 120_000)
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [sessions, totalToday, totalViews] = await Promise.all([
    // Son 2 dakika içinde görülen aktif oturumlar
    prisma.visitorSession.findMany({
      where: { storeId, lastSeenAt: { gte: since2min } },
      orderBy: { lastSeenAt: 'desc' },
      take: 100,
    }),
    // Bugün başlayan benzersiz oturum sayısı
    prisma.visitorSession.count({
      where: { storeId, startedAt: { gte: startOfDay } },
    }),
    // Bugün toplam page_view event sayısı
    prisma.visitorEvent.count({
      where: { storeId, eventType: 'page_view', createdAt: { gte: startOfDay } },
    }),
  ])

  return NextResponse.json({ sessions, totalToday, totalViews })
}
