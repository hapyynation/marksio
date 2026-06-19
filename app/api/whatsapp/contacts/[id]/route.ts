import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const contact = await prisma.whatsappContact.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  })
  if (!contact) return NextResponse.json({ error: 'Kontak bulunamadı.' }, { status: 404 })

  const body = await req.json() as {
    optInStatus?: 'OPTED_IN' | 'OPTED_OUT' | 'UNKNOWN'
    tags?: string[]
  }

  const updated = await prisma.whatsappContact.update({
    where: { id: params.id },
    data: {
      ...(body.optInStatus ? { optInStatus: body.optInStatus } : {}),
      ...(body.tags ? { tags: body.tags } : {}),
    },
  })

  return NextResponse.json(updated)
}
