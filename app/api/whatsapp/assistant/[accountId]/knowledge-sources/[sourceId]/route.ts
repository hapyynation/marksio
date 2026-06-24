import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

async function verifySourceOwnership(sourceId: string, userId: string) {
  return prisma.whatsappKnowledgeSource.findFirst({
    where: {
      id: sourceId,
      config: { account: { userId } },
    },
    select: { id: true, storageUrl: true },
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { accountId: string; sourceId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const source = await verifySourceOwnership(params.sourceId, session.user.id)
  if (!source) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 })

  await prisma.whatsappKnowledgeSource.delete({ where: { id: params.sourceId } })
  return new Response(null, { status: 204 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { accountId: string; sourceId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const source = await verifySourceOwnership(params.sourceId, session.user.id)
  if (!source) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 })

  const body = await req.json() as { title?: string; content?: string; url?: string }

  const updated = await prisma.whatsappKnowledgeSource.update({
    where: { id: params.sourceId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.url !== undefined && { url: body.url }),
    },
  })

  return NextResponse.json({ source: updated })
}
