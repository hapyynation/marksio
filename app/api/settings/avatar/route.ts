import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MAX_SIZE = 500 * 1024  // 500 KB
const ALLOWED = ['jpg', 'jpeg', 'png', 'webp']

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'Maksimum 500KB yükleyebilirsiniz' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED.includes(ext))
      return NextResponse.json({ error: 'Geçersiz dosya türü. JPG, PNG veya WebP olmalı.' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const avatarUrl = `data:${file.type};base64,${base64}`

    const existing = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { onboardingData: true },
    })

    let extra: Record<string, unknown> = {}
    try { extra = JSON.parse(existing?.onboardingData ?? '{}') as Record<string, unknown> } catch {}
    extra.avatarUrl = avatarUrl

    await prisma.user.update({
      where: { email: session.user.email },
      data: { onboardingData: JSON.stringify(extra) },
    })

    return NextResponse.json({ url: avatarUrl })
  } catch (err) {
    console.error('[Avatar upload]', err)
    return NextResponse.json({ error: 'Yükleme başarısız' }, { status: 500 })
  }
}
