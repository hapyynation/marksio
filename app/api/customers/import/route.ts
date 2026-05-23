import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const { csv } = await req.json()
    if (!csv) return NextResponse.json({ error: 'CSV verisi gerekli' }, { status: 400 })

    const lines = csv.split('\n').map((l: string) => l.trim()).filter(Boolean)
    if (lines.length < 2) return NextResponse.json({ error: 'CSV boş veya geçersiz' }, { status: 400 })

    // Parse header
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase().replace(/"/g, ''))
    const nameIdx = headers.findIndex((h: string) => h.includes('name') || h.includes('isim') || h.includes('ad'))
    const emailIdx = headers.findIndex((h: string) => h.includes('email') || h.includes('mail'))
    const phoneIdx = headers.findIndex((h: string) => h.includes('phone') || h.includes('tel') || h.includes('gsm'))
    const segmentIdx = headers.findIndex((h: string) => h.includes('segment'))

    if (emailIdx === -1) {
      return NextResponse.json({ error: 'CSV\'de email sütunu bulunamadı' }, { status: 400 })
    }

    const rows = lines.slice(1)
    let imported = 0
    let skipped = 0

    for (const row of rows) {
      const cols = row.split(',').map((c: string) => c.trim().replace(/"/g, ''))
      const email = cols[emailIdx]
      if (!email || !email.includes('@')) { skipped++; continue }

      const name = nameIdx >= 0 ? cols[nameIdx] : email.split('@')[0]
      const phone = phoneIdx >= 0 ? cols[phoneIdx] : undefined
      const segment = segmentIdx >= 0 ? cols[segmentIdx] : 'new'

      try {
        await prisma.customer.upsert({
          where: {
            userId_email: { userId, email },
          },
          update: { name, phone: phone || undefined, segment: segment || 'new' },
          create: {
            userId,
            email,
            name,
            phone: phone || undefined,
            segment: segment || 'new',
          },
        })
        imported++
      } catch {
        skipped++
      }
    }

    return NextResponse.json({ success: true, imported, skipped })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
