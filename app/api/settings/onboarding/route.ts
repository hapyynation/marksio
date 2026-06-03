import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      storeName: body.businessName || undefined,
      onboarded: true,
      onboardingData: JSON.stringify(body),
    },
  })

  return NextResponse.json({ ok: true })
}
