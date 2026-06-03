import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = session.user.id
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  try {
    const where: { userId: string; status?: string; resolvedBy?: string } = { userId }
    if (status === 'open') where.status = 'open'
    else if (status === 'closed') where.status = 'closed'
    else if (status === 'human') where.resolvedBy = 'human'

    const conversations = await prisma.whatsAppConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 60,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    return NextResponse.json({ conversations })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}
