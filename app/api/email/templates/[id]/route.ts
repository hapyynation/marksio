import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { name?: string; description?: string; subject?: string; htmlContent?: string; textContent?: string }

  const existing = await prisma.emailTemplate.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 })

  const updated = await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(body.name        !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.subject     !== undefined && { subject: body.subject }),
      ...(body.htmlContent !== undefined && { htmlContent: body.htmlContent }),
      ...(body.textContent !== undefined && { textContent: body.textContent }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.emailTemplate.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 })

  await prisma.emailTemplate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
