import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_TEMPLATES = [
  { id: 'welcome',            name: 'Hoş Geldin',    type: 'welcome',            isDefault: true, description: 'Yeni kayıtları karşıla',            usageCount: 0 },
  { id: 'promotion',          name: 'Promosyon',     type: 'promotion',          isDefault: true, description: 'İndirim ve kampanya duyurusu',       usageCount: 0 },
  { id: 'cart_abandonment',   name: 'Sepet Terk',    type: 'cart_abandonment',   isDefault: true, description: 'Sepeti bırakanları geri kazan',      usageCount: 0 },
  { id: 'order_confirmation', name: 'Sipariş Onay',  type: 'order_confirmation', isDefault: true, description: 'Sipariş detaylarını bildir',         usageCount: 0 },
  { id: 'win_back',           name: 'Geri Kazan',    type: 'win_back',           isDefault: true, description: 'Pasif müşterilere özel teklif gönder', usageCount: 0 },
]

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const custom = await prisma.emailTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({
    defaults: DEFAULT_TEMPLATES,
    custom,
    total: DEFAULT_TEMPLATES.length + custom.length,
  })
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json() as { name?: string; description?: string; subject?: string; htmlContent?: string; textContent?: string; type?: string }

  if (!body.name?.trim()) return NextResponse.json({ error: 'Şablon adı gerekli' }, { status: 400 })

  const template = await prisma.emailTemplate.create({
    data: {
      userId:      session.user.id,
      name:        body.name.trim(),
      description: body.description,
      subject:     body.subject,
      htmlContent: body.htmlContent,
      textContent: body.textContent,
      type:        body.type ?? 'custom',
    },
  })

  return NextResponse.json(template, { status: 201 })
}
