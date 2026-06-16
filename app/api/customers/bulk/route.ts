import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const body = await req.json() as {
    action: 'tag' | 'segment' | 'delete'
    customerIds: string[]
    payload?: { tag?: string; segment?: string }
  }
  const { action, customerIds, payload } = body

  if (!customerIds?.length) return NextResponse.json({ error: 'Müşteri seçilmedi' }, { status: 400 })

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds }, userId },
    select: { id: true, tags: true },
  })
  if (customers.length === 0) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })

  const validIds = customers.map(c => c.id)

  if (action === 'delete') {
    await prisma.customer.deleteMany({ where: { id: { in: validIds }, userId } })
    return NextResponse.json({ success: true, count: validIds.length })
  }

  if (action === 'segment') {
    if (!payload?.segment) return NextResponse.json({ error: 'Segment belirtilmedi' }, { status: 400 })
    await prisma.customer.updateMany({
      where: { id: { in: validIds }, userId },
      data: { segment: payload.segment },
    })
    return NextResponse.json({ success: true, count: validIds.length })
  }

  if (action === 'tag') {
    if (!payload?.tag?.trim()) return NextResponse.json({ error: 'Etiket belirtilmedi' }, { status: 400 })
    const tag = payload.tag.trim()
    await Promise.all(customers.map(async c => {
      let tags: string[] = []
      try { tags = JSON.parse(c.tags) } catch { /* */ }
      if (!tags.includes(tag)) {
        tags.push(tag)
        await prisma.customer.update({ where: { id: c.id }, data: { tags: JSON.stringify(tags) } })
      }
    }))
    return NextResponse.json({ success: true, count: validIds.length })
  }

  return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
}
