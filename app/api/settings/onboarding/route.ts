import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
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
