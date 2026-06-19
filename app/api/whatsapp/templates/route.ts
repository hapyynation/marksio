import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const accounts = await prisma.whatsappAccount.findMany({
    where: { userId: session.user.id, status: 'CONNECTED' },
    select: { id: true },
  })
  const accountIds = accounts.map(a => a.id)

  const templates = await prisma.whatsappTemplate.findMany({
    where: { accountId: { in: accountIds } },
    orderBy: { syncedAt: 'desc' },
    select: {
      id: true,
      name: true,
      category: true,
      language: true,
      status: true,
      rejectedReason: true,
    },
  })

  return NextResponse.json({ templates })
}
