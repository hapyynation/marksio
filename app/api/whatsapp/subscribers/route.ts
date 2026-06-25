import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const optInFilter = searchParams.get('optIn') ?? '' // OPTED_IN | OPTED_OUT | UNKNOWN | window_open
  const segmentFilter = searchParams.get('segment') ?? ''
  const tagFilter = searchParams.get('tag') ?? ''
  const riskFilter = searchParams.get('risk') ?? ''
  const minSpent = parseFloat(searchParams.get('minSpent') ?? '0') || 0
  const maxSpent = parseFloat(searchParams.get('maxSpent') ?? '0') || 0
  const sortBy = searchParams.get('sort') ?? 'createdAt_desc'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 50

  const orderMap: Record<string, object> = {
    createdAt_desc: { createdAt: 'desc' },
    createdAt_asc: { createdAt: 'asc' },
    lastMessage_desc: { lastInboundAt: 'desc' },
    lastMessage_asc: { lastInboundAt: 'asc' },
  }

  const where: Record<string, unknown> = {
    userId: session.user.id,
  }

  if (search) {
    where.OR = [{ phoneNumber: { contains: search } }]
  }

  if (optInFilter === 'OPTED_IN' || optInFilter === 'OPTED_OUT' || optInFilter === 'UNKNOWN') {
    where.optInStatus = optInFilter
  } else if (optInFilter === 'window_open') {
    where.windowExpiresAt = { gt: new Date() }
  }

  if (tagFilter) {
    where.tags = { has: tagFilter }
  }

  const [totalCount, contacts] = await Promise.all([
    prisma.whatsappContact.count({ where }),
    prisma.whatsappContact.findMany({
      where,
      orderBy: orderMap[sortBy] ?? { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  if (contacts.length === 0) {
    return NextResponse.json({ subscribers: [], total: 0, page, totalPages: 0 })
  }

  // Enrich with Customer data via phone matching (normalize to last 10 digits)
  const phoneSuffixes = contacts.map(c => c.phoneNumber.replace(/\D/g, '').slice(-10))

  const customers = await prisma.customer.findMany({
    where: {
      userId: session.user.id,
      phone: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      segment: true,
      totalOrders: true,
      totalSpent: true,
      lastOrder: true,
      riskScore: true,
      tags: true,
    },
  })

  const customerByPhone = new Map<string, typeof customers[0]>()
  for (const c of customers) {
    if (c.phone) {
      const suffix = c.phone.replace(/\D/g, '').slice(-10)
      customerByPhone.set(suffix, c)
    }
  }

  let subscribers = contacts.map((c, i) => {
    const suffix = phoneSuffixes[i]
    const cust = customerByPhone.get(suffix) ?? null
    const windowOpen = c.windowExpiresAt ? c.windowExpiresAt > new Date() : false

    return {
      id: c.id,
      phone: c.phoneNumber,
      optIn: c.optInStatus as string,
      tags: c.tags,
      windowOpen,
      windowExpiresAt: c.windowExpiresAt?.toISOString() ?? null,
      lastMessageAt: c.lastInboundAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),

      customerId: cust?.id ?? null,
      name: cust?.name ?? null,
      email: cust?.email ?? null,
      segment: cust?.segment ?? null,
      totalSpent: cust?.totalSpent ?? null,
      totalOrders: cust?.totalOrders ?? null,
      lastOrderDate: cust?.lastOrder?.toISOString() ?? null,
      riskScore: cust?.riskScore ?? null,
      customerTags: cust ? (JSON.parse(cust.tags ?? '[]') as string[]) : [],
    }
  })

  // Client-side filters that need Customer data
  if (segmentFilter) {
    subscribers = subscribers.filter(s => s.segment === segmentFilter)
  }
  if (riskFilter) {
    subscribers = subscribers.filter(s => s.riskScore === riskFilter)
  }
  if (minSpent > 0) {
    subscribers = subscribers.filter(s => (s.totalSpent ?? 0) >= minSpent)
  }
  if (maxSpent > 0) {
    subscribers = subscribers.filter(s => (s.totalSpent ?? 0) <= maxSpent)
  }
  if (search && !where.OR) {
    subscribers = subscribers.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
    )
  } else if (search) {
    // Also filter by name (phone already filtered in DB)
    subscribers = subscribers.filter(s =>
      s.phone.includes(search) ||
      s.name?.toLowerCase().includes(search.toLowerCase())
    )
  }

  // KPI counts (from total set, not page)
  const allContacts = await prisma.whatsappContact.findMany({
    where: { userId: session.user.id },
    select: { optInStatus: true, windowExpiresAt: true },
  })

  const kpis = {
    total: allContacts.length,
    optedIn: allContacts.filter(c => c.optInStatus === 'OPTED_IN').length,
    optedOut: allContacts.filter(c => c.optInStatus === 'OPTED_OUT').length,
    windowOpen: allContacts.filter(c => c.windowExpiresAt && c.windowExpiresAt > new Date()).length,
  }

  return NextResponse.json({
    subscribers,
    total: totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
    kpis,
  })
}
