import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getIp } from '@/lib/rate-limit'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { storeId, sessionId, eventType, pageUrl, device, browser, metadata } =
      body as Record<string, unknown>

    if (!storeId || !sessionId || !eventType) {
      return NextResponse.json({ ok: false }, { status: 400, headers: CORS })
    }

    // Rate limit: max 10 istek / 10 saniye per session
    const rl = rateLimit(`track:${sessionId}`, 10, 10_000)
    if (!rl.allowed) {
      return NextResponse.json({ ok: true }, { headers: CORS })
    }

    // Entegrasyonun var olduğunu doğrula
    const integration = await prisma.integration.findFirst({
      where: { id: storeId as string, status: 'active' },
      select: { id: true },
    })
    if (!integration) {
      return NextResponse.json({ ok: true }, { headers: CORS })
    }

    // Geo bilgisi — Vercel header'larından
    const city = req.headers.get('x-vercel-ip-city')
      ? decodeURIComponent(req.headers.get('x-vercel-ip-city')!)
      : null
    const country = req.headers.get('x-vercel-ip-country') ?? null
    const ip = getIp(req.headers)

    // Oturumu upsert et, lastSeenAt güncelle
    const session = await prisma.visitorSession.upsert({
      where: { storeId_sessionId: { storeId: storeId as string, sessionId: sessionId as string } },
      create: {
        storeId: storeId as string,
        sessionId: sessionId as string,
        ip,
        city,
        country,
        device: (device as string | null) ?? null,
        browser: (browser as string | null) ?? null,
        currentPage: (pageUrl as string | null) ?? null,
        status: 'active',
      },
      update: {
        lastSeenAt: new Date(),
        currentPage: (pageUrl as string | null) ?? undefined,
        city: city ?? undefined,
        country: country ?? undefined,
        status: eventType === 'page_leave' ? 'left' : 'active',
      },
    })

    // Event kaydet (heartbeat hariç - gereksiz yazma yükü)
    if (eventType !== 'heartbeat') {
      await prisma.visitorEvent.create({
        data: {
          sessionId: session.id,
          storeId: storeId as string,
          eventType: eventType as string,
          pageUrl: (pageUrl as string | null) ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          metadata: metadata as any ?? undefined,
        },
      })
    }

    // Heartbeat durumunda sadece lastSeenAt güncellendi (upsert update'te), event yok
    // 2 dakikadır heartbeat gelmemiş oturumları idle/left yap (toplu güncelleme, her 60s'de bir)
    // Bu işlemi her request'te yapmak yerine probabilistik yapıyoruz (%5 şans)
    if (Math.random() < 0.05) {
      const idleThreshold = new Date(Date.now() - 30_000)
      const leftThreshold = new Date(Date.now() - 120_000)

      await prisma.visitorSession.updateMany({
        where: { storeId: storeId as string, status: 'active', lastSeenAt: { lt: idleThreshold } },
        data: { status: 'idle' },
      })
      await prisma.visitorSession.updateMany({
        where: { storeId: storeId as string, status: { in: ['active', 'idle'] }, lastSeenAt: { lt: leftThreshold } },
        data: { status: 'left' },
      })
    }

    return NextResponse.json({ ok: true }, { headers: CORS })
  } catch (err) {
    console.error('[Track]', err)
    return NextResponse.json({ ok: true }, { headers: CORS })
  }
}
