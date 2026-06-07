import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['jpg', 'jpeg', 'png', 'webp']

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'Dosya çok büyük (maks 5MB)' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED.includes(ext))
      return NextResponse.json({ error: 'Geçersiz dosya türü. JPG, PNG veya WebP olmalı.' }, { status: 400 })

    const filename = `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')

    await mkdir(uploadDir, { recursive: true })
    const bytes = await file.arrayBuffer()
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes))

    const host = req.headers.get('host') || 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const avatarUrl = `${proto}://${host}/uploads/avatars/${filename}`

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
