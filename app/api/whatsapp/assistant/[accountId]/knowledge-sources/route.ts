import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

type SourceType = 'WEBSITE_URL' | 'PDF' | 'FAQ_IMPORT' | 'MANUAL'

async function getConfig(accountId: string, userId: string) {
  const account = await prisma.whatsappAccount.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  })
  if (!account) return null

  let config = await prisma.whatsappAssistantConfig.findUnique({
    where: { accountId },
  })
  if (!config) {
    config = await prisma.whatsappAssistantConfig.create({
      data: { accountId },
    })
  }
  return config
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const config = await getConfig(params.accountId, session.user.id)
  if (!config) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  const sources = await prisma.whatsappKnowledgeSource.findMany({
    where: { configId: config.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ sources })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const config = await getConfig(params.accountId, session.user.id)
  if (!config) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  const body = await req.json() as {
    sourceType?: SourceType
    title?: string
    content?: string
    url?: string
    fileName?: string
    storageUrl?: string
  }

  if (!body.sourceType) return NextResponse.json({ error: 'sourceType zorunlu.' }, { status: 400 })

  if (body.sourceType === 'WEBSITE_URL' && !body.url?.trim()) {
    return NextResponse.json({ error: 'URL zorunlu.' }, { status: 400 })
  }
  if (body.sourceType === 'MANUAL' && !body.content?.trim()) {
    return NextResponse.json({ error: 'İçerik zorunlu.' }, { status: 400 })
  }

  let resolvedContent = body.content ?? null

  if (body.sourceType === 'WEBSITE_URL' && body.url?.trim()) {
    const rawUrl = body.url.trim()
    const fetchUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
    try {
      const res = await fetch(fetchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Marksio-Bot/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const html = await res.text()
        resolvedContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[\s\S]*?<\/nav>/gi, '')
          .replace(/<header[\s\S]*?<\/header>/gi, '')
          .replace(/<footer[\s\S]*?<\/footer>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 8000) || null
      }
    } catch {
      // Fetch başarısız olsa da devam et, içerik null kalır
    }
  }

  const source = await prisma.whatsappKnowledgeSource.create({
    data: {
      configId: config.id,
      sourceType: body.sourceType,
      title: body.title ?? null,
      content: resolvedContent,
      url: body.url ?? null,
      fileName: body.fileName ?? null,
      storageUrl: body.storageUrl ?? null,
    },
  })

  return NextResponse.json({ source }, { status: 201 })
}
