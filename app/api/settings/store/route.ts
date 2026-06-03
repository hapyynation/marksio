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

  const { storeName, currency, language, timezone } = await req.json()

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { storeName, currency, language, timezone },
    select: { storeName: true, currency: true, language: true, timezone: true },
  })

  return NextResponse.json(user)
}
