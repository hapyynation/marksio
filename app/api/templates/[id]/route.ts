import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { getPresetById } from '@/lib/email-template-presets'

// GET /api/templates/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  // Preset template
  if (params.id.startsWith('preset:')) {
    const presetId = params.id.replace('preset:', '')
    const preset = getPresetById(presetId)
    if (!preset) return NextResponse.json({ error: 'Preset bulunamadı' }, { status: 404 })
    return NextResponse.json({
      id: params.id,
      name: preset.name,
      type: 'email',
      category: preset.category,
      subject: preset.defaultSubject,
      body: '',
      design: JSON.stringify(preset.blocks),
      cta: null,
      isPreset: true,
    })
  }

  const template = await prisma.template.findFirst({
    where: { id: params.id, userId: session.user.id },
  })

  if (!template) return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 })
  return NextResponse.json(template)
}

// PUT /api/templates/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  if (params.id.startsWith('preset:')) {
    return NextResponse.json({ error: 'Preset şablonlar düzenlenemez' }, { status: 400 })
  }

  const data = await req.json()
  const template = await prisma.template.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.body && { body: data.body }),
      ...(data.design !== undefined && { design: data.design }),
      ...(data.cta !== undefined && { cta: data.cta }),
    },
  })

  return NextResponse.json({ updated: template.count })
}

// DELETE /api/templates/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  if (params.id.startsWith('preset:')) {
    return NextResponse.json({ error: 'Preset şablonlar silinemez' }, { status: 400 })
  }

  await prisma.template.deleteMany({
    where: { id: params.id, userId: session.user.id },
  })

  return NextResponse.json({ success: true })
}
