import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { templatePresets } from '@/lib/email-template-presets'

// GET /api/templates — kullanıcının şablonları + preset şablonlar
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const includePresets = searchParams.get('presets') !== 'false'

  const [user, userTemplates] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
    prisma.template.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, type: true, category: true,
        subject: true, body: true, design: true, cta: true,
        isPublic: true, createdAt: true,
      },
    }),
  ])

  const isPremium = user?.plan !== 'starter' && user?.plan !== 'free'

  const presets = includePresets
    ? templatePresets.map(p => ({
        id: `preset:${p.id}`,
        name: p.name,
        type: 'email',
        category: p.category,
        subject: p.defaultSubject,
        body: '',
        design: JSON.stringify(p.blocks),
        cta: null,
        isPublic: true,
        isPreset: true,
        tag: p.tag,
        tagColor: p.tagColor,
        rate: p.rate,
        accent: p.accent,
        heroGrad: p.heroGrad,
        pillBg: p.pillBg,
        desc: p.desc,
      }))
    : []

  return NextResponse.json({ presets, userTemplates, isPremium })
}

// POST /api/templates — şablon kaydet
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { name, type, category, subject, body, design, cta } = await req.json()
  if (!name || !body) return NextResponse.json({ error: 'name ve body zorunlu' }, { status: 400 })

  const template = await prisma.template.create({
    data: {
      userId: session.user.id,
      name,
      type: type || 'email',
      category: category || 'general',
      subject: subject || null,
      body,
      design: design || '[]',
      cta: cta || null,
      isPublic: false,
    },
  })

  return NextResponse.json(template, { status: 201 })
}
