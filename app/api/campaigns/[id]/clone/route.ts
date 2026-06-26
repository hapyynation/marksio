import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const userId = (session.user as { id: string }).id

  const original = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
  })

  if (!original) {
    return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })
  }

  const clone = await prisma.campaign.create({
    data: {
      userId,
      name: `Kopya — ${original.name}`,
      type: original.type,
      status: 'draft',
      segment: original.segment,
      subject: original.subject,
      previewText: original.previewText,
      headline: original.headline,
      body: original.body,
      design: original.design,
      cta: original.cta,
      tips: original.tips,
      purpose: original.purpose,
      imageUrl: original.imageUrl,
      imagePrompt: original.imagePrompt,
      htmlContent: original.htmlContent,
      ctaText: original.ctaText,
      ctaUrl: original.ctaUrl,
      layoutStyle: original.layoutStyle,
      brandColor: original.brandColor,
      templateType: original.templateType,
      productsJson: original.productsJson,
    },
  })

  return NextResponse.json({
    ...clone,
    tips: (() => { try { return JSON.parse(clone.tips) } catch { return [] } })(),
  }, { status: 201 })
}
