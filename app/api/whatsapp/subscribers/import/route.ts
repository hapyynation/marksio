import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 })

  const text = await file.text()
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const hasHeader = lines[0]?.toLowerCase().startsWith('phone') || lines[0]?.toLowerCase().startsWith('telefon')
  const dataLines = hasHeader ? lines.slice(1) : lines

  let upserted = 0
  let skipped = 0
  const errors: { line: number; raw: string; reason: string }[] = []

  for (let i = 0; i < dataLines.length; i++) {
    const raw = dataLines[i]
    const cols = raw.split(',')
    const rawPhone = cols[0]?.trim()

    if (!rawPhone) {
      errors.push({ line: i + (hasHeader ? 2 : 1), raw, reason: 'Telefon numarası boş' })
      skipped++
      continue
    }

    const phoneNumber = rawPhone.replace(/\D/g, '')
    if (phoneNumber.length < 7 || phoneNumber.length > 15) {
      errors.push({ line: i + (hasHeader ? 2 : 1), raw, reason: `Geçersiz telefon: "${rawPhone}"` })
      skipped++
      continue
    }

    const optInRaw = (cols[1] ?? '').trim().toUpperCase()
    const optInStatus: 'OPTED_IN' | 'OPTED_OUT' | 'UNKNOWN' =
      optInRaw === 'OPTED_OUT' ? 'OPTED_OUT'
      : optInRaw === 'UNKNOWN' ? 'UNKNOWN'
      : 'OPTED_IN'

    const tagsRaw = (cols[2] ?? '').trim()
    const tags = tagsRaw ? tagsRaw.split('|').map(t => t.trim()).filter(Boolean) : []

    const existing = await prisma.whatsappContact.findUnique({
      where: { userId_phoneNumber: { userId: session.user.id, phoneNumber } },
      select: { optInStatus: true },
    })

    await prisma.whatsappContact.upsert({
      where: { userId_phoneNumber: { userId: session.user.id, phoneNumber } },
      create: { userId: session.user.id, phoneNumber, optInStatus, tags },
      update: { optInStatus, tags },
    })

    // Log opt-in history if status changed or new contact
    if (!existing || existing.optInStatus !== optInStatus) {
      await prisma.whatsappOptInHistory.create({
        data: {
          userId: session.user.id,
          phoneNumber,
          status: optInStatus,
          source: 'csv_import',
          note: `CSV import: ${file.name}`,
        },
      })
    }

    upserted++
  }

  return NextResponse.json({
    upserted,
    skipped,
    total: dataLines.length,
    errors,
    hasErrors: errors.length > 0,
  })
}
