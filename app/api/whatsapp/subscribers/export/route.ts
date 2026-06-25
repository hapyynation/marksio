import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const optInFilter = searchParams.get('optIn') ?? ''
  const tagFilter = searchParams.get('tag') ?? ''

  const where: Record<string, unknown> = { userId: session.user.id }
  if (optInFilter === 'OPTED_IN' || optInFilter === 'OPTED_OUT' || optInFilter === 'UNKNOWN') {
    where.optInStatus = optInFilter
  }
  if (tagFilter) where.tags = { has: tagFilter }

  const contacts = await prisma.whatsappContact.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  const phones = contacts.map(c => c.phoneNumber.replace(/\D/g, '').slice(-10))
  const customers = await prisma.customer.findMany({
    where: { userId: session.user.id, phone: { not: null } },
    select: { phone: true, name: true, email: true, segment: true, totalSpent: true, totalOrders: true, lastOrder: true },
  })

  const custByPhone = new Map<string, typeof customers[0]>()
  for (const c of customers) {
    if (c.phone) custByPhone.set(c.phone.replace(/\D/g, '').slice(-10), c)
  }

  const header = ['phone', 'optIn', 'tags', 'name', 'email', 'segment', 'totalSpent', 'totalOrders', 'lastOrder', 'windowExpiresAt', 'createdAt']
  const rows = contacts.map((c, i) => {
    const cust = custByPhone.get(phones[i])
    return [
      c.phoneNumber,
      c.optInStatus,
      c.tags.join('|'),
      cust?.name ?? '',
      cust?.email ?? '',
      cust?.segment ?? '',
      cust?.totalSpent?.toString() ?? '',
      cust?.totalOrders?.toString() ?? '',
      cust?.lastOrder?.toISOString().split('T')[0] ?? '',
      c.windowExpiresAt?.toISOString() ?? '',
      c.createdAt.toISOString().split('T')[0],
    ].map(v => `"${String(v).replace(/"/g, '""')}"`)
  })

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="whatsapp-subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
