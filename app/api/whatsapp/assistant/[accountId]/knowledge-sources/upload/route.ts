import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { PDFParse } from 'pdf-parse'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase yapılandırması eksik.')
  return createClient(url, key)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: params.accountId, userId: session.user.id },
    select: { id: true },
  })
  if (!account) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Dosya zorunlu.' }, { status: 400 })

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) return NextResponse.json({ error: 'Dosya 10MB\'tan büyük olamaz.' }, { status: 400 })

  if (!file.type.includes('pdf')) return NextResponse.json({ error: 'Yalnızca PDF dosyaları kabul edilir.' }, { status: 400 })

  let config = await prisma.whatsappAssistantConfig.findUnique({
    where: { accountId: params.accountId },
  })
  if (!config) {
    config = await prisma.whatsappAssistantConfig.create({
      data: { accountId: params.accountId },
    })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const fileName = `${params.accountId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const supabase = getAdminClient()
  const { error: uploadError } = await supabase.storage
    .from('whatsapp-knowledge')
    .upload(fileName, buffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: 'Dosya yüklenemedi: ' + uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('whatsapp-knowledge')
    .getPublicUrl(fileName)

  let extractedText: string | null = null
  try {
    const parser = new PDFParse({ data: buffer })
    const parsed = await parser.getText()
    await parser.destroy()
    extractedText = parsed.text?.trim().slice(0, 12000) || null
  } catch {
    // PDF ayrıştırma başarısız olsa bile devam et, içerik null kalır
  }

  const source = await prisma.whatsappKnowledgeSource.create({
    data: {
      configId: config.id,
      sourceType: 'PDF',
      title: file.name,
      fileName: file.name,
      storageUrl: urlData.publicUrl,
      content: extractedText,
    },
  })

  return NextResponse.json({ source, textExtracted: extractedText !== null }, { status: 201 })
}
