import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { storeName: true, currency: true, language: true, timezone: true },
  })
  return NextResponse.json(user)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeName, currency, language, timezone } = await req.json()

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { storeName, currency, language, timezone },
    select: { storeName: true, currency: true, language: true, timezone: true },
  })

  return NextResponse.json(user)
}
