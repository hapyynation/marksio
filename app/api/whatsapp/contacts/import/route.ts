import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

// CSV formatı: phoneNumber,optInStatus,tags
// tags alanı opsiyonel — pipe ile ayrılmış: "tag1|tag2"
export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const text = await req.text()
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Başlık satırını atla
  const dataLines = lines[0]?.toLowerCase().startsWith('phone') ? lines.slice(1) : lines

  let upserted = 0
  let skipped = 0

  for (const line of dataLines) {
    const cols = line.split(',')
    const rawPhone = cols[0]?.trim()
    if (!rawPhone) { skipped++; continue }

    const phoneNumber = rawPhone.replace(/\D/g, '')
    if (phoneNumber.length < 7) { skipped++; continue }

    const optInRaw = (cols[1] ?? '').trim().toUpperCase()
    const optInStatus: 'OPTED_IN' | 'OPTED_OUT' | 'UNKNOWN' =
      optInRaw === 'OPTED_IN' ? 'OPTED_IN'
      : optInRaw === 'OPTED_OUT' ? 'OPTED_OUT'
      : 'UNKNOWN'

    const tagsRaw = (cols[2] ?? '').trim()
    const tags = tagsRaw ? tagsRaw.split('|').map(t => t.trim()).filter(Boolean) : []

    await prisma.whatsappContact.upsert({
      where: { userId_phoneNumber: { userId: session.user.id, phoneNumber } },
      create: { userId: session.user.id, phoneNumber, optInStatus, tags },
      update: { optInStatus, tags },
    })
    upserted++
  }

  return NextResponse.json({ upserted, skipped })
}
