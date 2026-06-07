import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { storeName: true, currency: true, language: true, timezone: true },
  })
  return NextResponse.json(user)
}

export async function PUT(req: Request) {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    storeName?: string; currency?: string; language?: string; timezone?: string
    notificationPrefs?: Record<string, boolean>
    brandSettings?: Record<string, string>
  }

  const existing = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { onboardingData: true },
  })

  let extra: Record<string, unknown> = {}
  try { extra = JSON.parse(existing?.onboardingData ?? '{}') as Record<string, unknown> } catch {}
  if (body.notificationPrefs !== undefined) extra.notificationPrefs = body.notificationPrefs
  if (body.brandSettings !== undefined) extra.brandSettings = body.brandSettings

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      ...(body.storeName  !== undefined && { storeName:  body.storeName  }),
      ...(body.currency   !== undefined && { currency:   body.currency   }),
      ...(body.language   !== undefined && { language:   body.language   }),
      ...(body.timezone   !== undefined && { timezone:   body.timezone   }),
      onboardingData: JSON.stringify(extra),
    },
    select: { storeName: true, currency: true, language: true, timezone: true },
  })

  return NextResponse.json(user)
}
