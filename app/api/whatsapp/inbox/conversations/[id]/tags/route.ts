import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

async function getAuthorizedConv(id: string, userId: string) {
  return prisma.whatsappConversation.findFirst({
    where: { id, account: { userId } },
    select: { id: true },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const conv = await getAuthorizedConv(params.id, session.user.id)
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı.' }, { status: 404 })

  const links = await prisma.conversationTagLink.findMany({
    where: { conversationId: params.id },
    include: { tag: true },
  })

  return NextResponse.json({ tags: links.map(l => l.tag) })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const conv = await getAuthorizedConv(params.id, session.user.id)
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı.' }, { status: 404 })

  const { tagId, name, color } = await req.json() as { tagId?: string; name?: string; color?: string }

  let resolvedTagId = tagId
  if (!resolvedTagId && name?.trim()) {
    const tag = await prisma.conversationTag.upsert({
      where: { userId_name: { userId: session.user.id, name: name.trim() } },
      create: { userId: session.user.id, name: name.trim(), color: color ?? '#6B7280' },
      update: {},
    })
    resolvedTagId = tag.id
  }

  if (!resolvedTagId) return NextResponse.json({ error: 'tagId veya name gerekli.' }, { status: 400 })

  const link = await prisma.conversationTagLink.upsert({
    where: { conversationId_tagId: { conversationId: params.id, tagId: resolvedTagId } },
    create: { conversationId: params.id, tagId: resolvedTagId },
    update: {},
  })

  return NextResponse.json({ link })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const conv = await getAuthorizedConv(params.id, session.user.id)
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı.' }, { status: 404 })

  const { tagId } = await req.json() as { tagId?: string }
  if (!tagId) return NextResponse.json({ error: 'tagId gerekli.' }, { status: 400 })

  await prisma.conversationTagLink.deleteMany({
    where: { conversationId: params.id, tagId },
  })

  return NextResponse.json({ ok: true })
}
