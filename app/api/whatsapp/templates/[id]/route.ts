import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import type { Prisma } from '@prisma/client'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as { action?: string; newName?: string; attemptNote?: string }

  const source = await prisma.whatsappTemplate.findFirst({
    where: { id: params.id, account: { userId: session.user.id } },
    select: {
      accountId: true,
      name: true,
      category: true,
      language: true,
      componentsJson: true,
      metaTemplateId: true,
    },
  })
  if (!source) return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 404 })

  if (body.action === 'clone') {
    const baseName = body.newName?.trim() || `${source.name}_kopya`
    const safeName = baseName.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 512)

    // Unique metaTemplateId placeholder — will be overwritten on next sync
    const placeholderMetaId = `clone_${Date.now()}`

    const clone = await prisma.whatsappTemplate.create({
      data: {
        accountId: source.accountId,
        metaTemplateId: placeholderMetaId,
        name: safeName,
        category: source.category,
        language: source.language,
        status: 'PENDING',
        componentsJson: source.componentsJson as Prisma.InputJsonValue,
        submittedAt: new Date(),
      },
    })

    // Log initial version
    await prisma.whatsappTemplateVersion.create({
      data: {
        templateId: clone.id,
        componentsJson: source.componentsJson as Prisma.InputJsonValue,
        status: 'PENDING',
        attemptNote: body.attemptNote ?? `${source.name} şablonundan klonlandı`,
      },
    })

    return NextResponse.json({ clone }, { status: 201 })
  }

  return NextResponse.json({ error: 'Geçersiz action.' }, { status: 400 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const template = await prisma.whatsappTemplate.findFirst({
    where: { id: params.id, account: { userId: session.user.id } },
    select: { id: true, status: true },
  })
  if (!template) return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 404 })

  await prisma.whatsappTemplate.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
