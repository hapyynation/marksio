import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const bypassId = process.env.BYPASS_AUTH_USER_ID

  let userId: string
  if (bypassId) {
    userId = bypassId
  } else {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }
    userId = session.user.id
  }

  const body = await req.json().catch(() => ({})) as {
    storeName?: string
    storeUrl?: string
    industry?: string
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboarded: true,
      ...(body.storeName ? { storeName: body.storeName } : {}),
      onboardingData: JSON.stringify({
        storeUrl: body.storeUrl ?? '',
        industry: body.industry ?? '',
        completedAt: new Date().toISOString(),
      }),
    },
  })

  const res = NextResponse.json({ success: true })
  res.cookies.set('marksio_onboarded', '1', {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    httpOnly: true,
    sameSite: 'lax',
  })
  return res
}
