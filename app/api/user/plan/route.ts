import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ plan: 'free' })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  return NextResponse.json({ plan: user?.plan ?? 'free' })
}
