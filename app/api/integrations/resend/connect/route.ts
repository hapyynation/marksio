import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apiKey } = await req.json() as { apiKey: string }
  if (!apiKey?.trim()) return NextResponse.json({ error: 'API anahtarı gerekli' }, { status: 400 })

  await prisma.integration.upsert({
    where: { userId_platform: { userId: session.user.id, platform: 'resend' } },
    create: { userId: session.user.id, platform: 'resend', accessToken: apiKey.trim(), status: 'active' },
    update: { accessToken: apiKey.trim(), status: 'active' },
  })

  return NextResponse.json({ ok: true })
}
