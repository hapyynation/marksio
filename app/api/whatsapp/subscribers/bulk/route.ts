import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

// POST /api/whatsapp/subscribers/bulk
// body: { action: "tag"|"untag"|"set_optin"|"delete", contactIds: string[], payload?: any }
export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { action, contactIds, payload } = await req.json() as {
    action: string
    contactIds: string[]
    payload?: Record<string, unknown>
  }

  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    return NextResponse.json({ error: 'contactIds gerekli.' }, { status: 400 })
  }

  // Verify all contacts belong to this user
  const owned = await prisma.whatsappContact.findMany({
    where: { id: { in: contactIds }, userId: session.user.id },
    select: { id: true, phoneNumber: true, optInStatus: true, tags: true },
  })

  if (owned.length === 0) {
    return NextResponse.json({ error: 'Hiçbir abone bulunamadı.' }, { status: 404 })
  }

  const ownedIds = owned.map(c => c.id)

  if (action === 'tag') {
    const tag = String(payload?.tag ?? '').trim()
    if (!tag) return NextResponse.json({ error: 'tag gerekli.' }, { status: 400 })

    await Promise.all(
      owned.map(c =>
        prisma.whatsappContact.update({
          where: { id: c.id },
          data: { tags: c.tags.includes(tag) ? c.tags : [...c.tags, tag] },
        })
      )
    )
    return NextResponse.json({ affected: owned.length })
  }

  if (action === 'untag') {
    const tag = String(payload?.tag ?? '').trim()
    if (!tag) return NextResponse.json({ error: 'tag gerekli.' }, { status: 400 })

    await Promise.all(
      owned.map(c =>
        prisma.whatsappContact.update({
          where: { id: c.id },
          data: { tags: c.tags.filter(t => t !== tag) },
        })
      )
    )
    return NextResponse.json({ affected: owned.length })
  }

  if (action === 'set_optin') {
    const status = String(payload?.status ?? '')
    if (!['OPTED_IN', 'OPTED_OUT', 'UNKNOWN'].includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 })
    }

    await prisma.whatsappContact.updateMany({
      where: { id: { in: ownedIds } },
      data: { optInStatus: status as 'OPTED_IN' | 'OPTED_OUT' | 'UNKNOWN' },
    })

    await prisma.whatsappOptInHistory.createMany({
      data: owned.filter(c => c.optInStatus !== status).map(c => ({
        userId: session.user.id,
        phoneNumber: c.phoneNumber,
        status: status as 'OPTED_IN' | 'OPTED_OUT' | 'UNKNOWN',
        source: 'manual',
        note: 'Toplu işlem',
      })),
    })

    return NextResponse.json({ affected: ownedIds.length })
  }

  if (action === 'delete') {
    await prisma.whatsappContact.deleteMany({
      where: { id: { in: ownedIds } },
    })
    return NextResponse.json({ affected: ownedIds.length })
  }

  return NextResponse.json({ error: 'Geçersiz action.' }, { status: 400 })
}
